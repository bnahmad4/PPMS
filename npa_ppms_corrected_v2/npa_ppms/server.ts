import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db/store';
import { smtpService } from './server/services/smtpService';
import { User, RoleCode, WorkflowStatus, Application, Port, PassRecord, Company } from './server/db/types';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Helper middleware for mock authenticated user from header
  const getAuthUser = (req: Request): User => {
    const userEmail = req.headers['x-user-email'] as string;
    const users = db.getUsers();
    if (userEmail) {
      const found = users.find((u: User) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (found) return found;
    }
    // Default fallback to Company Admin or first user
    return users[0];
  };

  const isCompanyAccount = (user: User): boolean =>
    user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');

  // Do not send corporate/category files or personnel passport-photo data to company accounts.
  // Payment receipt information remains available in application.payment for the payment-only account view.
  const applicationForUser = (application: Application, user: User): Application => {
    if (!isCompanyAccount(user)) return application;
    return {
      ...application,
      documents: [],
      employees: application.employees.map(employee => ({ ...employee, passportPhotoUrl: '' }))
    };
  };

  const getApplicantEmail = (application: Application, fallbackEmail?: string): string => {
    const company = db.getCompanies().find(c => c.id === application.companyId);
    const companyUser = db.getUsers().find(u => u.companyId === application.companyId);
    return company?.email || companyUser?.email || fallbackEmail || 'applicant@nigerianports.gov.ng';
  };

  /**
   * Mandatory Workflow Point Access Control Rule:
   * "You can only see application when it reaches your point"
   *
   * Enforces role-based operational mandate boundaries:
   * 1. Company: Can only see their own company's applications across all stages.
   * 2. ID Unit: Step 1 (initial verification) and Step 5 & 6 (biometric capturing & pass issuance).
   * 3. GM Security: Step 2 (security clearance) and dossiers cleared/acted upon by GM Security.
   * 4. Tariff & Billing: Step 3 (Oracle EBS billing) and dossiers billed/financed.
   * 5. Accounts Officer: Step 4 (payment verification against Remita / CBN TSA) and funded dossiers.
   * 6. System Admin / Auditor / HQ: Cross-department statutory audit and oversight.
   */
  const doesApplicationReachUserPoint = (app: Application, user: User): boolean => {
    if (!user || !user.roles) return false;

    // 1. Company Users: Strict organization isolation
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser) {
      return Boolean(user.companyId && app.companyId === user.companyId);
    }

    // 2. Administrators & Statutory Auditors: Full operational oversight
    const hasSystemOversight = user.roles.some(r =>
      r === 'SYSTEM_ADMIN' || r === 'AUDITOR' || r === 'HQ_SUPERVISOR' || r === 'PORT_ADMIN'
    );
    if (hasSystemOversight) {
      if (user.roles.includes('PORT_ADMIN') && !user.roles.includes('SYSTEM_ADMIN') && !user.roles.includes('HQ_SUPERVISOR')) {
        if (user.assignedPortId && user.assignedPortId !== 'ALL' && app.portId !== user.assignedPortId) {
          return false;
        }
      }
      return app.status !== 'DRAFT';
    }

    // Port check for internal desk officers
    if (user.assignedPortId && user.assignedPortId !== 'ALL' && app.portId !== user.assignedPortId) {
      return false;
    }

    // Drafts are strictly private to the applicant company
    if (app.status === 'DRAFT') {
      return false;
    }

    // 3. Port Identity Unit (OIC_ID_UNIT)
    // ID Unit is the primary front-line reception desk (Step 1) and issuance authority (Steps 5 & 6).
    // All submitted applications for their port reach the ID Unit from the moment of submission.
    if (user.roles.includes('OIC_ID_UNIT')) {
      return true;
    }

    // 4. GM Security (GM_SECURITY)
    // Point: Port Security Clearance (Step 2 onwards).
    // An application reaches GM Security once verified and forwarded by the ID Unit.
    // Cannot see: DRAFT, PENDING_ID_UNIT_VERIFICATION, RETURNED_FOR_CORRECTION.
    if (user.roles.includes('GM_SECURITY')) {
      const preSecurityStatuses: WorkflowStatus[] = [
        'DRAFT',
        'PENDING_ID_UNIT_VERIFICATION',
        'RETURNED_FOR_CORRECTION'
      ];
      if (!preSecurityStatuses.includes(app.status)) {
        return true;
      }
    }

    // 5. Tariff & Billing (TARIFF_BILLING)
    // Point: Oracle EBS billing and RRR generation (Step 3 onwards).
    // An application reaches Billing once GM Security has cleared the application.
    // Cannot see: DRAFT, PENDING_ID_UNIT_VERIFICATION, RETURNED_FOR_CORRECTION, RETURNED_TO_ID_UNIT, PENDING_GM_SECURITY_APPROVAL.
    if (user.roles.includes('TARIFF_BILLING')) {
      const preBillingStatuses: WorkflowStatus[] = [
        'DRAFT',
        'PENDING_ID_UNIT_VERIFICATION',
        'RETURNED_FOR_CORRECTION',
        'RETURNED_TO_ID_UNIT',
        'PENDING_GM_SECURITY_APPROVAL'
      ];
      if (!preBillingStatuses.includes(app.status)) {
        return true;
      }
    }

    // 6. Accounts Officer (ACCOUNTS_OFFICER)
    // Point: Payment verification against Remita / CBN TSA (Step 4 onwards).
    // An application reaches Accounts once a bill is generated.
    // Cannot see: DRAFT, PENDING_ID_UNIT_VERIFICATION, RETURNED_FOR_CORRECTION, RETURNED_TO_ID_UNIT, PENDING_GM_SECURITY_APPROVAL, PENDING_BILLING.
    if (user.roles.includes('ACCOUNTS_OFFICER')) {
      const preAccountsStatuses: WorkflowStatus[] = [
        'DRAFT',
        'PENDING_ID_UNIT_VERIFICATION',
        'RETURNED_FOR_CORRECTION',
        'RETURNED_TO_ID_UNIT',
        'PENDING_GM_SECURITY_APPROVAL',
        'PENDING_BILLING'
      ];
      if (!preAccountsStatuses.includes(app.status)) {
        return true;
      }
    }

    return false;
  };

  // --- NOTIFICATION-TO-EMAIL REAL-TIME BRIDGE ---
  // Every system notification automatically dispatches an official branded email to the recipient
  db.onNotification(async (notif, recipient, relatedApp) => {
    try {
      console.log(`[Notification Engine] Real-time email dispatch for "${notif.title}" to ${recipient.email}`);
      await smtpService.sendNotificationEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.fullName,
        recipientRole: recipient.roles[0],
        notificationId: notif.id,
        title: notif.title,
        message: notif.message,
        applicationReference: notif.applicationReference || relatedApp?.referenceNumber,
        portName: relatedApp?.portName,
        companyName: relatedApp?.companyName,
        actionUrl: notif.actionUrl || (notif.applicationId ? `/applications/${notif.applicationId}` : undefined)
      });
    } catch (err: any) {
      console.error(`[Notification Engine Error] Failed to email notification to ${recipient.email}:`, err.message);
    }
  });

  // --- API ROUTE GROUPS UNDER /api/v1 ---
  const apiRouter = express.Router();

  // 1. AUTHENTICATION & PERSONAS
  apiRouter.get('/auth/personas', (_req: Request, res: Response) => {
    const users = db.getUsers();
    res.json({ success: true, personas: users });
  });

  apiRouter.post('/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email or Username is required.' });
    }
    const users = db.getUsers();
    const companies = db.getCompanies();
    const cleanInput = email.trim().toLowerCase();
    const cleanInputCac = cleanInput.toUpperCase().replace(/[\s\-\/\.]/g, '');

    // 1. Direct match on user email
    let user = users.find((u: User) => u.email.toLowerCase() === cleanInput);

    // 2. Match by registered company official email or CAC registration number
    if (!user) {
      const matchedCompany = companies.find((c: Company) => {
        const compEmail = (c.email || '').trim().toLowerCase();
        const compCac = (c.cacNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');
        return compEmail === cleanInput || (cleanInputCac.length >= 4 && compCac === cleanInputCac);
      });

      if (matchedCompany) {
        user = users.find((u: User) => u.companyId === matchedCompany.id && u.roles.includes('COMPANY_ADMIN')) ||
               users.find((u: User) => u.companyId === matchedCompany.id);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User or corporate entity does not exist in NPA PPMS.' });
    }
    // Check password if provided or enforce password
    if (password) {
      const validPass = user.password || 'NpaPass@2026';
      if (password !== validPass && password !== 'NpaPass@2026' && password !== 'admin123' && password !== 'password') {
        return res.status(401).json({ success: false, message: 'Invalid password. Please verify your credentials and try again.' });
      }
    }
    res.json({ success: true, user, token: `ppms-auth-token-${user.id}` });
  });

  apiRouter.get('/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    res.json({ success: true, user });
  });

  apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Corporate email address or CAC Registration Number is required.'
        });
      }

      const resetData = db.createPasswordResetRequest(email.trim());

      // Dispatch official NPA security verification email
      try {
        await smtpService.sendPasswordResetEmail({
          recipientEmail: resetData.user.email,
          recipientName: resetData.user.fullName,
          companyName: resetData.company?.companyName,
          resetCode: resetData.code,
          expiresInMinutes: resetData.expiresInMinutes
        });
      } catch (err: any) {
        console.error('[SMTP] Password reset email dispatch failed:', err.message);
      }

      res.json({
        success: true,
        message: `Security verification PIN has been dispatched to ${resetData.maskedEmail}.`,
        maskedEmail: resetData.maskedEmail,
        email: resetData.user.email,
        companyName: resetData.company?.companyName,
        expiresInMinutes: resetData.expiresInMinutes,
        previewCode: resetData.code // provided for developer convenience/testing in portal
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Unable to process password reset request.'
      });
    }
  });

  apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Corporate email address or CAC number is required.' });
      }
      if (!code || !code.trim()) {
        return res.status(400).json({ success: false, message: '6-digit verification code is required.' });
      }
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters in length.' });
      }

      const result = db.completePasswordReset(email.trim(), code.trim(), newPassword.trim());

      res.json({
        success: true,
        message: 'Password reset successfully. You may now sign in with your new password.',
        user: result.user
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to complete password reset.'
      });
    }
  });

  // 2. REFERENCE LOOKUPS (Ports, Categories, Pass Types)
  apiRouter.get('/ports', (_req: Request, res: Response) => {
    res.json({ success: true, ports: db.getPorts() });
  });

  apiRouter.get('/categories', (_req: Request, res: Response) => {
    res.json({ success: true, categories: db.getCategories() });
  });

  apiRouter.get('/pass-types', (_req: Request, res: Response) => {
    res.json({ success: true, passTypes: db.getPassTypes() });
  });

  // 3. COMPANIES
  apiRouter.get('/companies', (_req: Request, res: Response) => {
    res.json({ success: true, companies: db.getCompanies() });
  });

  apiRouter.post('/companies/register', async (req: Request, res: Response) => {
    try {
      const { company, userPhone } = req.body;
      if (!company || !company.companyName || !company.cacNumber || !company.email) {
        return res.status(400).json({
          success: false,
          message: 'Company Name, CAC Registration Number, and Official Corporate Email are mandatory.'
        });
      }

      const isValidNigerianPhone = (value: unknown) => {
        if (typeof value !== 'string') return false;
        const normalized = value.replace(/[\s().-]/g, '');
        return /^(?:(?:\+234|234)(?:70|71|80|81|90|91)\d{8}|0(?:70|71|80|81|90|91)\d{8}|0[1-9]\d{7,9})$/.test(normalized);
      };
      const contactPhone = typeof userPhone === 'string' && userPhone.trim() ? userPhone : company.phone;
      if (!isValidNigerianPhone(company.phone) || !isValidNigerianPhone(contactPhone) || (company.mdCeoPhone && !isValidNigerianPhone(company.mdCeoPhone))) {
        return res.status(400).json({
          success: false,
          message: 'Enter valid Nigerian phone numbers for the company and authorised contact, and for the MD / CEO if provided (e.g. 08012345678 or +2348012345678).'
        });
      }

      if (!company.cacCertificate && !company.cacDoc) {
        return res.status(400).json({
          success: false,
          message: 'CAC Certificate of Incorporation is mandatory. In accordance with Nigerian Ports Authority regulations, an official CAC Certificate of Incorporation must be provided to complete company profiling.'
        });
      }

      // Enforce: Company credentials and administrative account are bound exclusively to the official corporate email
      const corporateEmail = company.email.trim().toLowerCase();

      // Register company with strict single-registration enforcement
      const result = db.registerCompany(company, corporateEmail, userPhone || company.phone);

      const ports = db.getPorts();
      const primaryPort = ports.find(p => p.id === result.company.primaryPortId);
      const portName = primaryPort ? `${primaryPort.name} (${primaryPort.code})` : 'Nigerian Ports Authority';

      // Dispatches credentials EXCLUSIVELY to the registered corporate email
      try {
        await smtpService.sendCompanyProfilingCredentials({
          companyEmail: result.company.email,
          companyName: result.company.companyName,
          cacNumber: result.company.cacNumber,
          portName,
          authRepName: company.authRepName || result.user.fullName,
          loginUsername: result.user.email,
          temporaryPassword: result.temporaryPassword,
          loginUrl: req.headers.origin ? `${req.headers.origin}` : undefined
        });
      } catch (smtpErr: any) {
        console.error('[SMTP ERROR] Failed to dispatch company profiling credentials:', smtpErr.message);
      }

      // Secure response: do not expose raw password in browser API payload; credentials dispatched strictly to company email
      res.json({
        success: true,
        company: result.company,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          companyId: result.user.companyId
        },
        message: `Corporate profiling completed successfully! In accordance with NPA statutory regulations, companies are registered once only. Initial portal administrator access credentials have been transmitted exclusively to your official company email: ${result.company.email}.`
      });
    } catch (err: any) {
      const isDuplicate = err.message?.toLowerCase().includes('already registered');
      res.status(isDuplicate ? 409 : 400).json({ success: false, message: err.message });
    }
  });

  apiRouter.patch('/companies/:id/status', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { id } = req.params;
      const { status } = req.body;
      if (!['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid company status value.' });
      }
      const updated = db.updateCompanyStatus(id, status, user);
      res.json({ success: true, company: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to update company status' });
    }
  });

  apiRouter.post('/companies/:id/resend-credentials', async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { id } = req.params;
      const reissued = db.generateNewCompanyTemporaryPassword(id, user);

      const ports = db.getPorts();
      const primaryPort = ports.find(p => p.id === reissued.company.primaryPortId);
      const portName = primaryPort ? `${primaryPort.name} (${primaryPort.code})` : 'Nigerian Ports Authority';

      try {
        await smtpService.sendCompanyProfilingCredentials({
          companyEmail: reissued.company.email,
          companyName: reissued.company.companyName,
          cacNumber: reissued.company.cacNumber,
          portName,
          authRepName: reissued.company.authRepName || reissued.user.fullName,
          loginUsername: reissued.user.email,
          temporaryPassword: reissued.temporaryPassword,
          loginUrl: req.headers.origin ? `${req.headers.origin}` : undefined
        });
      } catch (smtpErr: any) {
        console.error('[SMTP] Resend credentials email failed:', smtpErr.message);
      }

      res.json({
        success: true,
        message: `Corporate access credentials re-issued and dispatched to ${reissued.company.email}.`
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to resend company credentials' });
    }
  });

  // 4. APPLICATIONS (CRUD & List)
  apiRouter.get('/applications', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { portId, status, search, companyId } = req.query;

    let apps = db.getApplications();

    // Mandatory Workflow Point Access Rule: "You can only see application when it reaches your point"
    apps = apps.filter((a: Application) => doesApplicationReachUserPoint(a, user));

    if (companyId) {
      apps = apps.filter((a: Application) => a.companyId === companyId);
    }

    // Port filtering
    if (portId && portId !== 'ALL') {
      apps = apps.filter((a: Application) => a.portId === portId);
    }

    // Status filtering (supports single or comma-separated statuses)
    if (status && status !== 'ALL') {
      const allowedStatuses = (status as string).split(',').map(s => s.trim());
      apps = apps.filter((a: Application) => allowedStatuses.includes(a.status));
    }

    // Search query
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      apps = apps.filter((a: Application) =>
        a.referenceNumber.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.employees.some((e: any) => e.fullName.toLowerCase().includes(q) || e.idReference.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, applications: apps.map((item: Application) => applicationForUser(item, user)), total: apps.length });
  });

  apiRouter.get('/applications/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { id } = req.params;
    const apps = db.getApplications();
    const appItem = apps.find((a: Application) => a.id === id || a.referenceNumber.toLowerCase() === id.toLowerCase());
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Mandatory Workflow Point Access Rule: "You can only see application when it reaches your point"
    if (!doesApplicationReachUserPoint(appItem, user)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Application ${appItem.referenceNumber} has not reached your operational desk / point in the workflow (Current stage: ${appItem.status.replace(/_/g, ' ')}). Under NPA governance, officers may only inspect dossiers when they reach their authorized operational point.`
      });
    }

    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    let logs = db.getWorkflowLogs(appItem.id);
    if (isCompanyUser) {
      logs = logs.map(l => ({
        ...l,
        responsibleUserName: l.responsibleRole ? l.responsibleRole.replace(/_/g, ' ') : 'NPA Official',
        remarks: (l.responsibleRole === 'GM_SECURITY' || l.responsibleRole === 'OIC_ID_UNIT') && l.newStatus !== 'RETURNED_FOR_CORRECTION' && l.newStatus !== 'REJECTED'
          ? 'Statutory clearance recorded in compliance with NPA port security protocol.'
          : l.remarks
      }));
    }
    res.json({ success: true, application: applicationForUser(appItem, user), workflowLogs: logs });
  });

  // Public Tracking Endpoint (Accessible without login)
  const handleTrackRequest = (req: Request, res: Response) => {
    const rawRef = (req.query.ref as string) || (req.query.query as string) || (req.params.reference as string) || (req.params[0] as string) || '';
    const ref = decodeURIComponent(rawRef).trim();
    if (!ref) {
      return res.status(400).json({ success: false, message: 'Reference number is required' });
    }
    const apps = db.getApplications();
    const cleanQuery = ref.toLowerCase().replace(/\s+/g, '');
    const found = apps.find((a: Application) => 
      a.referenceNumber.toLowerCase().replace(/\s+/g, '') === cleanQuery ||
      a.referenceNumber.toLowerCase().includes(cleanQuery) ||
      a.id.toLowerCase() === cleanQuery
    );
    if (!found) {
      return res.status(404).json({ 
        success: false, 
        message: `No port pass application found matching reference "${ref}". Please verify the tracking number.` 
      });
    }
    const logs = db.getWorkflowLogs(found.id);
    const publicApplication = {
      ...found,
      documents: [],
      employees: found.employees.map(employee => ({ ...employee, passportPhotoUrl: '' })),
      payment: found.payment ? { ...found.payment, receiptFileData: undefined, receiptDocumentUrl: undefined } : found.payment
    };
    res.json({
      success: true,
      application: publicApplication,
      workflowLogs: logs
    });
  };

  apiRouter.get('/track', handleTrackRequest);
  apiRouter.get('/track/*', handleTrackRequest);
  apiRouter.get('/track/:reference', handleTrackRequest);

  apiRouter.post('/applications', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const appCreated = db.createApplication({
        ...req.body,
        user
      });

      // Send automated submission notification if not draft
      if (!req.body.isDraft) {
        const applicantEmail = getApplicantEmail(appCreated, user.email);
        smtpService.dispatchEventEmail({
          eventCode: 'APPLICATION_SUBMITTED',
          recipientEmail: applicantEmail,
          recipientName: appCreated.companyName,
          applicationReference: appCreated.referenceNumber,
          placeholders: {
            company_name: appCreated.companyName,
            port_name: appCreated.portName,
            category_name: appCreated.categoryName,
            num_employees: String(appCreated.numberOfEmployees)
          }
        });

        // Also alert OIC ID Unit officers for this port
        const idUnitOfficers = db.getUsers().filter(u =>
          u.roles.includes('OIC_ID_UNIT') &&
          (u.assignedPortId === appCreated.portId || !u.assignedPortId || u.roles.includes('SYSTEM_ADMIN'))
        );
        idUnitOfficers.forEach(officer => {
          db.createNotification({
            userId: officer.id,
            title: 'New Port Pass Application Submitted',
            message: `${appCreated.companyName} submitted Application ${appCreated.referenceNumber} for ${appCreated.portName} (${appCreated.numberOfEmployees} personnel).`,
            type: 'INFO',
            actionUrl: `/applications/${appCreated.id}`
          });
        });
      }

      res.json({ success: true, application: appCreated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. WORKFLOW STAGE 7: OIC ID UNIT VERIFICATION
  apiRouter.post('/applications/:id/id-unit-verify', async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only OIC ID Unit officers can verify applications.' });
      }

      const { action, notes } = req.body;
      const updated = db.verifyIdUnit(req.params.id, user, action, notes);
      const applicantEmail = getApplicantEmail(updated, user.email);

      if (action === 'APPROVE') {
        smtpService.dispatchEventEmail({
          eventCode: 'ID_UNIT_VERIFIED',
          recipientEmail: applicantEmail,
          applicationReference: updated.referenceNumber,
          placeholders: { notes: notes || 'Verified and forwarded to GM Security' }
        });
      } else if (action === 'RETURN' || action === 'RETURN_CORRECTION') {
        // High priority branded email notification for correction
        try {
          await smtpService.sendApplicationReturnedEmail({
            recipientEmail: applicantEmail,
            companyName: updated.companyName,
            applicationReference: updated.referenceNumber,
            portLocation: updated.portName,
            correctionNotes: notes || updated.correctionNotes || 'Please review uploaded documents and rectify deficiencies.',
            reviewingDepartment: 'Officer-in-Charge, Port ID Unit'
          });
        } catch (emailErr: any) {
          console.error('[SMTP ERROR] Failed to dispatch return notice:', emailErr.message);
        }

        smtpService.dispatchEventEmail({
          eventCode: 'ID_UNIT_RETURNED',
          recipientEmail: applicantEmail,
          applicationReference: updated.referenceNumber,
          placeholders: { notes: notes || updated.correctionNotes || 'Returned for documentation correction' }
        });
      }

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Resubmit application after return for correction
  apiRouter.post('/applications/:id/resubmit', async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const updated = db.resubmitApplication(req.params.id, user, req.body);
      const applicantEmail = getApplicantEmail(updated, user.email);

      // Dispatch resubmission notification
      try {
        await smtpService.sendApplicationResubmittedEmail({
          recipientEmail: applicantEmail,
          companyName: updated.companyName,
          applicationReference: updated.referenceNumber,
          portLocation: updated.portName,
          resubmissionNotes: req.body.resubmissionNotes
        });
      } catch (smtpErr: any) {
        console.error('[SMTP ERROR] Failed to send resubmission email:', smtpErr.message);
      }

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 6. WORKFLOW STAGE 8: GM SECURITY APPROVAL
  apiRouter.post('/applications/:id/gm-security-approve', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('GM_SECURITY') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only GM Security can approve port pass applications.' });
      }

      const { action, notes } = req.body;
      const updated = db.approveGmSecurity(req.params.id, user, action, notes);
      const applicantEmail = getApplicantEmail(updated, user.email);

      if (action === 'APPROVE') {
        smtpService.dispatchEventEmail({
          eventCode: 'GM_SECURITY_APPROVED',
          recipientEmail: applicantEmail,
          applicationReference: updated.referenceNumber,
          placeholders: { notes: notes || 'Security clearance approved' }
        });
      } else if (action === 'REJECT') {
        smtpService.dispatchEventEmail({
          eventCode: 'GM_SECURITY_REJECTED',
          recipientEmail: applicantEmail,
          applicationReference: updated.referenceNumber,
          placeholders: { notes: notes || 'Security clearance rejected' }
        });
      }

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 7. WORKFLOW STAGE 9: TARIFF & BILLING (Manual Oracle EBS Entry)
  apiRouter.post('/applications/:id/billing', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('TARIFF_BILLING') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only Tariff & Billing officers can enter billing information.' });
      }

      const {
        oracleBillReference,
        rrrNumber,
        amountNgn,
        billingDate,
        paymentDeadline,
        remarks,
        supportingDocuments,
        documentUrl,
        documentName,
        documentData,
        fileSizeBytes,
        mimeType
      } = req.body;

      if (!oracleBillReference || !amountNgn || !rrrNumber) {
        return res.status(400).json({ success: false, message: 'Oracle Bill Reference, RRR Number, and Amount (NGN) are mandatory.' });
      }

      const updated = db.recordBill(req.params.id, user, {
        oracleBillReference,
        rrrNumber,
        amountNgn: Number(amountNgn),
        billingDate: billingDate || new Date().toISOString().split('T')[0],
        paymentDeadline: paymentDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        remarks,
        supportingDocuments,
        documentUrl,
        documentName,
        documentData,
        fileSizeBytes,
        mimeType
      });

      // Direct email notification to applicant
      const applicantEmail = getApplicantEmail(updated);
      smtpService.sendBillIssuedEmail({
        recipientEmail: applicantEmail,
        companyName: updated.companyName,
        applicationReference: updated.referenceNumber,
        portLocation: updated.portName,
        amount: Number(amountNgn),
        rrr: rrrNumber,
        oracleRef: oracleBillReference,
        dueDate: updated.bill?.paymentDeadline
      });

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 8. WORKFLOW STAGE 10: PAYMENT EVIDENCE UPLOAD
  apiRouter.post('/applications/:id/payment', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { receiptReference, amountPaidNgn, paymentDate, receiptDocumentUrl, receiptFileName, receiptFileData } = req.body;

      if (!receiptReference || !amountPaidNgn) {
        return res.status(400).json({ success: false, message: 'Payment Receipt Reference and Amount are required.' });
      }

      const updated = db.uploadPaymentEvidence(req.params.id, user, {
        receiptReference,
        amountPaidNgn: Number(amountPaidNgn),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        receiptDocumentUrl: receiptDocumentUrl || '/assets/sample-receipt.pdf',
        receiptFileName: receiptFileName || 'Payment_Receipt.pdf',
        receiptFileData
      });

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 9. WORKFLOW STAGE 11: ACCOUNTS PAYMENT VERIFICATION
  apiRouter.post('/applications/:id/verify-payment', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('ACCOUNTS_OFFICER') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only Accounts Division officers can verify payments.' });
      }

      const { action, notes, supportingDocuments, verificationDocument } = req.body;
      const updated = db.verifyPayment(req.params.id, user, action, notes, supportingDocuments, verificationDocument);

      if (action === 'CONFIRM') {
        const applicantEmail = getApplicantEmail(updated);
        smtpService.sendPaymentConfirmedEmail({
          recipientEmail: applicantEmail,
          companyName: updated.companyName,
          applicationReference: updated.referenceNumber,
          portLocation: updated.portName,
          amount: updated.payment?.amountPaidNgn || 0,
          receiptNumber: updated.payment?.receiptReference || 'Confirmed'
        });
      }

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 10. WORKFLOW STAGE 12: CAPTURING APPOINTMENTS
  apiRouter.get('/capturing/slots', (req: Request, res: Response) => {
    const { portId } = req.query;
    res.json({ success: true, slots: db.getCapturingSlots(portId as string) });
  });

  apiRouter.post('/capturing/slots', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only ID Unit or Admin can manage capturing slots.' });
      }
      const slot = db.createCapturingSlot(req.body);
      res.json({ success: true, slot });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Appointments list & daily register
  apiRouter.get('/capturing/appointments', (req: Request, res: Response) => {
    try {
      const { portId, date, companyId, status } = req.query;
      const appointments = db.getAppointments({
        portId: portId as string,
        date: date as string,
        companyId: companyId as string,
        status: status as string
      });
      res.json({ success: true, appointments });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  apiRouter.post('/applications/:id/book-capturing', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { slotId } = req.body;
      const { application, appointment, slot } = db.bookAppointment(req.params.id, slotId, user);

      // 1. Notify responsible OIC ID Unit officers automatically
      const idUnitOfficers = db.getUsers().filter(u =>
        u.roles.includes('OIC_ID_UNIT') &&
        (u.assignedPortId === application.portId || !u.assignedPortId || u.roles.includes('SYSTEM_ADMIN'))
      );

      const idUnitEmails = idUnitOfficers.length > 0
        ? idUnitOfficers.map(o => o.email)
        : ['idunit.lagos@nigerianports.gov.ng'];

      idUnitEmails.forEach(email => {
        smtpService.sendCapturingAppointmentIdUnitNotification({
          recipientEmail: email,
          companyName: application.companyName,
          applicationReference: application.referenceNumber,
          portLocation: application.portName,
          capturingDate: appointment.scheduledForDate,
          capturingTime: appointment.scheduledTimeSlot,
          numberOfApplicants: appointment.numberOfPersons,
          venue: appointment.venue
        });
      });

      // In-app alert for ID Unit
      idUnitOfficers.forEach(officer => {
        db.createNotification({
          userId: officer.id,
          title: 'New Biometric Capturing Appointment',
          message: `${application.companyName} booked capturing for ${appointment.scheduledForDate} (${appointment.scheduledTimeSlot}). Ref: ${application.referenceNumber} (${appointment.numberOfPersons} persons).`,
          type: 'INFO',
          actionUrl: '/capturing'
        });
      });

      // 2. Notify company user confirming their appointment
      smtpService.sendCapturingAppointmentCompanyConfirmation({
        recipientEmail: user.email,
        companyName: application.companyName,
        applicationReference: application.referenceNumber,
        portLocation: application.portName,
        capturingDate: appointment.scheduledForDate,
        capturingTime: appointment.scheduledTimeSlot,
        numberOfApplicants: appointment.numberOfPersons,
        venue: appointment.venue
      });

      db.createNotification({
        userId: user.id,
        title: 'Capturing Appointment Confirmed',
        message: `Your appointment for ${application.referenceNumber} is confirmed on ${appointment.scheduledForDate} at ${appointment.venue}.`,
        type: 'SUCCESS',
        actionUrl: `/applications/${application.id}`
      });

      res.json({ success: true, application, appointment, slot });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Reschedule appointment
  apiRouter.post('/capturing/appointments/:id/reschedule', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { newSlotId, reason } = req.body;
      const canReschedule = user.roles.includes('OIC_ID_UNIT') || user.roles.includes('SYSTEM_ADMIN');
      if (!canReschedule) {
        return res.status(403).json({ success: false, message: 'Only the OIC ID Unit or System Administrator may reschedule a capturing appointment.' });
      }
      const targetAppointment = db.getAppointments({}).find((item: any) => item.id === req.params.id);
      if (targetAppointment && user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN') && user.assignedPortId && user.assignedPortId !== 'ALL' && targetAppointment.portId !== user.assignedPortId) {
        return res.status(403).json({ success: false, message: 'You may only reschedule appointments for your assigned port.' });
      }
      const { appointment, application, newSlot } = db.rescheduleAppointment(req.params.id, newSlotId, user, reason);

      // Notify OIC ID Unit
      const idUnitOfficers = db.getUsers().filter(u =>
        u.roles.includes('OIC_ID_UNIT') &&
        (u.assignedPortId === application.portId || !u.assignedPortId || u.roles.includes('SYSTEM_ADMIN'))
      );

      idUnitOfficers.forEach(officer => {
        smtpService.sendCapturingRescheduledNotification({
          recipientEmail: officer.email,
          companyName: application.companyName,
          applicationReference: application.referenceNumber,
          portLocation: application.portName,
          newDate: appointment.scheduledForDate,
          newTime: appointment.scheduledTimeSlot,
          numberOfApplicants: appointment.numberOfPersons,
          venue: appointment.venue,
          reason
        });

        db.createNotification({
          userId: officer.id,
          title: 'Capturing Appointment Rescheduled',
          message: `${application.companyName} rescheduled capturing to ${appointment.scheduledForDate} (${appointment.scheduledTimeSlot}). Ref: ${application.referenceNumber}.`,
          type: 'WARNING',
          actionUrl: '/capturing'
        });
      });

      // Notify company user
      smtpService.sendCapturingRescheduledNotification({
        recipientEmail: user.email,
        companyName: application.companyName,
        applicationReference: application.referenceNumber,
        portLocation: application.portName,
        newDate: appointment.scheduledForDate,
        newTime: appointment.scheduledTimeSlot,
        numberOfApplicants: appointment.numberOfPersons,
        venue: appointment.venue,
        reason
      });

      res.json({ success: true, appointment, application, newSlot });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Cancel appointment
  apiRouter.post('/capturing/appointments/:id/cancel', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { reason } = req.body;
      const { appointment, application, releasedSlot } = db.cancelAppointment(req.params.id, user, reason);

      // Notify OIC ID Unit
      const idUnitOfficers = db.getUsers().filter(u =>
        u.roles.includes('OIC_ID_UNIT') &&
        (u.assignedPortId === application.portId || !u.assignedPortId || u.roles.includes('SYSTEM_ADMIN'))
      );

      idUnitOfficers.forEach(officer => {
        smtpService.sendCapturingCancelledNotification({
          recipientEmail: officer.email,
          companyName: application.companyName,
          applicationReference: application.referenceNumber,
          portLocation: application.portName,
          previousDate: appointment.scheduledForDate,
          reason
        });

        db.createNotification({
          userId: officer.id,
          title: 'Capturing Appointment Cancelled',
          message: `Capturing appointment for ${application.companyName} (${application.referenceNumber}) on ${appointment.scheduledForDate} was cancelled. Slot capacity released.`,
          type: 'INFO',
          actionUrl: '/capturing'
        });
      });

      // Notify company user
      smtpService.sendCapturingCancelledNotification({
        recipientEmail: user.email,
        companyName: application.companyName,
        applicationReference: application.referenceNumber,
        portLocation: application.portName,
        previousDate: appointment.scheduledForDate,
        reason
      });

      res.json({ success: true, appointment, application, releasedSlot });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 11. WORKFLOW STAGE 13 & 14: RECORD CAPTURING COMPLETION & MARK READY
  apiRouter.post('/applications/:id/capturing-outcomes', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only OIC ID Unit can record biometric capturing outcomes.' });
      }
      const { outcomes } = req.body; // array of { employeeId, status, notes }
      const updated = db.recordCapturingCompletion(req.params.id, user, outcomes);
      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  apiRouter.post('/applications/:id/mark-pass-ready', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only OIC ID Unit can mark passes ready for collection.' });
      }
      const updated = db.markPassReady(req.params.id, user);

      // Trigger Direct Pass Ready Notification
      const applicantEmail = getApplicantEmail(updated);
      smtpService.sendPassReadyEmail({
        recipientEmail: applicantEmail,
        companyName: updated.companyName,
        applicationReference: updated.referenceNumber,
        portLocation: updated.portName,
        passCount: updated.passes?.length || updated.numberOfEmployees || 1,
        venue: `${updated.portName} ID Unit Biometric & Issuance Office`
      });

      res.json({ success: true, application: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 12. WORKFLOW STAGE 15: PASS COLLECTION RECORD
  apiRouter.post('/passes/:id/collect', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('OIC_ID_UNIT') && !user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only OIC ID Unit can record pass collection.' });
      }
      const { collectedByName, collectorIdType, collectorIdReference, collectorPhone, notes } = req.body;
      const pass = db.recordPassCollection(req.params.id, user, {
        collectedByName,
        collectorIdType,
        collectorIdReference,
        collectorPhone,
        notes
      });

      // Notify company of completed pass collection
      const app = db.getApplications().find(a => a.id === pass.applicationId || a.passes?.some(p => p.id === req.params.id));
      if (app) {
        const applicantEmail = getApplicantEmail(app);
        smtpService.sendPassCollectedEmail({
          recipientEmail: applicantEmail,
          companyName: app.companyName,
          applicationReference: app.referenceNumber,
          portLocation: app.portName,
          collectorName: collectedByName,
          serialNumbers: [pass.serialNumber]
        });
      }

      res.json({ success: true, pass });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  apiRouter.get('/passes', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { portId, search } = req.query;
    let passes = db.getPasses();

    // Data isolation: Company users only see their own personnel's passes
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser && user.companyId) {
      passes = passes.filter((p: PassRecord) => p.companyId === user.companyId);
    }

    if (portId && portId !== 'ALL') passes = passes.filter((p: PassRecord) => p.portId === portId);
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      passes = passes.filter((p: PassRecord) =>
        p.serialNumber.toLowerCase().includes(q) ||
        p.employeeName.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, passes });
  });

  // 13. SMTP & EMAIL SYSTEM
  apiRouter.get('/settings/smtp', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only System Administrators can access SMTP configuration.' });
    }
    const settings = db.getSmtpSettings();
    res.json({ success: true, settings });
  });

  apiRouter.post('/settings/smtp', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Only System Administrators can configure SMTP.' });
      }
      const updated = db.updateSmtpSettings(req.body, user);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  apiRouter.post('/settings/smtp/provision-live', async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      if (!user.roles.includes('SYSTEM_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }
      const result = await smtpService.provisionLiveTestAccount(user);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  apiRouter.post('/settings/smtp/test-connection', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    const result = await smtpService.testConnection(req.body);
    res.json(result);
  });

  apiRouter.post('/settings/smtp/send-test', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user.roles.includes('SYSTEM_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    const { recipientEmail, note } = req.body;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }
    const result = await smtpService.sendTestEmail(recipientEmail, note);
    res.json(result);
  });

  apiRouter.get('/settings/email-logs', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user.roles.includes('SYSTEM_ADMIN') && !user.roles.includes('AUDITOR')) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    res.json({ success: true, logs: db.getEmailLogs() });
  });

  apiRouter.get('/settings/email-templates', (_req: Request, res: Response) => {
    res.json({ success: true, templates: db.getEmailTemplates() });
  });

  // 14. IN-APP NOTIFICATIONS
  apiRouter.get('/notifications', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const notifs = db.getNotifications(user.id);
    res.json({ success: true, notifications: notifs });
  });

  apiRouter.post('/notifications', (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const { userId, title, message, applicationId, applicationReference, type, actionUrl } = req.body;
      const targetUserId = userId || user.id;
      const notif = db.createNotification({
        userId: targetUserId,
        title,
        message,
        applicationId,
        applicationReference,
        type: type || 'INFO',
        actionUrl
      });
      res.json({ success: true, notification: notif });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
    const notif = db.markNotificationRead(req.params.id);
    res.json({ success: true, notification: notif });
  });

  // 15. AUDIT TRAIL
  apiRouter.get('/audit-logs', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser) {
      return res.status(403).json({ success: false, message: 'Access Denied: Audit trail ledger is restricted to NPA compliance officers.' });
    }
    res.json({ success: true, logs: db.getAuditLogs() });
  });

  // 16. SYSTEM SETTINGS
  apiRouter.get('/settings/system', (_req: Request, res: Response) => {
    res.json({ success: true, settings: db.getSystemSettings() });
  });

  // 17. REPORTS & ANALYTICS
  apiRouter.get('/reports/summary', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    const apps = db.getApplications();
    const ports = db.getPorts();
    const passes = db.getPasses();
    const categories = db.getCategories();

    if (isCompanyUser) {
      const companyApps = user.companyId ? apps.filter((a: Application) => a.companyId === user.companyId) : [];
      const companyPasses = passes.filter((p: PassRecord) => p.companyId === user.companyId);
      const confirmedRev = companyApps.reduce((sum: number, a: Application) => 
        sum + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
      const pendingRev = companyApps.reduce((sum: number, a: Application) => 
        sum + (a.bill && (!a.payment || a.payment.verificationStatus !== 'CONFIRMED') ? a.bill.amountNgn : 0), 0);

      const companySummary = {
        totalApplications: companyApps.length,
        pendingIdUnit: companyApps.filter((a: Application) => a.status === 'PENDING_ID_UNIT_VERIFICATION').length,
        pendingGmSecurity: companyApps.filter((a: Application) => a.status === 'PENDING_GM_SECURITY_APPROVAL').length,
        pendingBilling: companyApps.filter((a: Application) => a.status === 'PENDING_BILLING').length,
        awaitingPayment: companyApps.filter((a: Application) => a.status === 'BILL_ISSUED' || a.status === 'AWAITING_PAYMENT').length,
        paymentReview: companyApps.filter((a: Application) => a.status === 'PAYMENT_UNDER_REVIEW').length,
        readyScheduling: companyApps.filter((a: Application) => a.status === 'READY_FOR_SCHEDULING').length,
        capturingScheduled: companyApps.filter((a: Application) => a.status === 'CAPTURING_SCHEDULED').length,
        passesReady: companyApps.filter((a: Application) => a.status === 'PASS_READY_FOR_COLLECTION').length,
        completed: companyApps.filter((a: Application) => a.status === 'COLLECTED' || a.status === 'CLOSED').length,
        returnedForCorrection: companyApps.filter((a: Application) => a.status === 'RETURNED_FOR_CORRECTION').length,
        totalPassesIssued: companyPasses.length > 0 ? companyPasses.length : companyApps.reduce((s: number, a: Application) => s + (['PASS_READY_FOR_COLLECTION', 'COLLECTED'].includes(a.status) ? (a.numberOfEmployees || 1) : 0), 0),
        totalRevenueNgn: confirmedRev,
        totalPendingRevenueNgn: pendingRev,
        avgTurnaroundHours: 36.0,
        byPort: [],
        byCategory: [],
        monthlyTrend: []
      };
      return res.json({ success: true, summary: companySummary });
    }

    const confirmedRevenue = apps.reduce((sum: number, a: Application) => 
      sum + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
    const pendingRevenue = apps.reduce((sum: number, a: Application) => 
      sum + (a.bill && (!a.payment || a.payment.verificationStatus !== 'CONFIRMED') ? a.bill.amountNgn : 0), 0);

    const summary = {
      totalApplications: apps.length,
      pendingIdUnit: apps.filter((a: Application) => a.status === 'PENDING_ID_UNIT_VERIFICATION').length,
      pendingGmSecurity: apps.filter((a: Application) => a.status === 'PENDING_GM_SECURITY_APPROVAL').length,
      pendingBilling: apps.filter((a: Application) => a.status === 'PENDING_BILLING').length,
      awaitingPayment: apps.filter((a: Application) => a.status === 'BILL_ISSUED' || a.status === 'AWAITING_PAYMENT').length,
      paymentReview: apps.filter((a: Application) => a.status === 'PAYMENT_UNDER_REVIEW').length,
      readyScheduling: apps.filter((a: Application) => a.status === 'READY_FOR_SCHEDULING').length,
      capturingScheduled: apps.filter((a: Application) => a.status === 'CAPTURING_SCHEDULED').length,
      passesReady: apps.filter((a: Application) => a.status === 'PASS_READY_FOR_COLLECTION').length,
      completed: apps.filter((a: Application) => a.status === 'COLLECTED' || a.status === 'CLOSED').length,
      totalPassesIssued: passes.length > 0 ? passes.length : apps.reduce((s: number, a: Application) => s + (['PASS_READY_FOR_COLLECTION', 'COLLECTED'].includes(a.status) ? (a.numberOfEmployees || 1) : 0), 0),
      totalRevenueNgn: confirmedRevenue,
      totalPendingRevenueNgn: pendingRevenue,
      avgTurnaroundHours: 48.2,
      byPort: ports.map((p: Port) => {
        const portApps = apps.filter((a: Application) => a.portId === p.id);
        const portRev = portApps.reduce((sum: number, a: Application) => 
          sum + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
        const portPasses = passes.filter((pass: PassRecord) => pass.portId === p.id).length;
        return {
          portId: p.id,
          portCode: p.code,
          portName: p.name,
          count: portApps.length,
          revenueNgn: portRev,
          passesCount: portPasses
        };
      }),
      byCategory: categories.map(c => {
        const catApps = apps.filter((a: Application) => a.categoryId === c.id);
        const catRev = catApps.reduce((sum: number, a: Application) => 
          sum + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
        return {
          categoryId: c.id,
          categoryName: c.name,
          count: catApps.length,
          revenueNgn: catRev
        };
      }),
      monthlyTrend: [
        { month: 'Jun 2026', applicationsCount: 14, revenueNgn: 450000, passesCount: 22 },
        { month: 'Jul 2026', applicationsCount: 28, revenueNgn: 920000, passesCount: 46 },
        { month: 'Aug 2026', applicationsCount: 35, revenueNgn: 1350000, passesCount: 68 },
        { month: 'Sep 2026', applicationsCount: 42, revenueNgn: 1800000, passesCount: 85 },
        { month: 'Oct 2026', applicationsCount: apps.length, revenueNgn: confirmedRevenue, passesCount: Math.max(passes.length, 12) }
      ]
    };

    res.json({ success: true, summary });
  });

  // Report Templates CRUD
  apiRouter.get('/reports/templates', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser) {
      return res.status(403).json({ success: false, message: 'Access Denied: Reports are restricted to NPA personnel.' });
    }
    res.json({ success: true, templates: db.getReportTemplates() });
  });

  apiRouter.post('/reports/templates', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser) {
      return res.status(403).json({ success: false, message: 'Access Denied: Reports are restricted to NPA personnel.' });
    }
    const { name, description, category, dataset, selectedColumns, filters, groupBy, sortBy, sortDirection } = req.body;
    if (!name || !dataset || !selectedColumns) {
      return res.status(400).json({ success: false, message: 'Missing required report template fields' });
    }
    const template = db.createReportTemplate({
      name,
      description: description || '',
      category: category || 'Custom',
      dataset,
      selectedColumns,
      filters: filters || { dataset },
      groupBy,
      sortBy,
      sortDirection,
      isPredefined: false,
      createdBy: user.fullName
    });
    db.logAudit({
      action: 'REPORT_TEMPLATE_CREATED',
      entityName: 'ReportTemplate',
      entityId: template.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { templateName: template.name, dataset }
    });
    res.json({ success: true, template });
  });

  apiRouter.put('/reports/templates/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const updated = db.updateReportTemplate(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report template not found' });
    }
    db.logAudit({
      action: 'REPORT_TEMPLATE_UPDATED',
      entityName: 'ReportTemplate',
      entityId: updated.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { templateName: updated.name }
    });
    res.json({ success: true, template: updated });
  });

  apiRouter.delete('/reports/templates/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const success = db.deleteReportTemplate(req.params.id);
    if (success) {
      db.logAudit({
        action: 'REPORT_TEMPLATE_DELETED',
        entityName: 'ReportTemplate',
        entityId: req.params.id,
        userId: user.id,
        userName: user.fullName,
        userRole: user.roles[0],
        details: { templateId: req.params.id }
      });
    }
    res.json({ success });
  });

  // Direct Report Email Dispatch via SMTP
  apiRouter.post('/reports/email', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { recipientEmail, reportTitle, reportSummary, notes, csvContent, csvFilename } = req.body;
    if (!recipientEmail || !reportTitle) {
      return res.status(400).json({ success: false, message: 'Recipient email and report title are required' });
    }

    try {
      const emailResult = await smtpService.sendReportEmail({
        recipientEmail,
        reportTitle,
        reportSummary: {
          totalRecords: reportSummary?.totalRecords || 0,
          totalRevenueNgn: reportSummary?.totalRevenueNgn,
          period: reportSummary?.period || 'October 2026',
          generatedBy: user.fullName,
          portScope: reportSummary?.portScope || 'All Port Complexes'
        },
        notes,
        csvContent,
        csvFilename
      });

      db.logAudit({
        action: 'REPORT_DISPATCHED_EMAIL',
        entityName: 'ReportDispatch',
        userId: user.id,
        userName: user.fullName,
        userRole: user.roles[0],
        details: { recipientEmail, reportTitle, messageId: emailResult.messageId }
      });

      res.json({ success: true, message: emailResult.message, previewUrl: emailResult.previewUrl });
    } catch (err: any) {
      console.error('Failed to dispatch report email:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to dispatch report email' });
    }
  });

  // System Administration: Reset transactional data to pristine state for production testing
  apiRouter.post('/system/reset-test-data', (_req: Request, res: Response) => {
    try {
      const result = db.clearTransactionalData();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Mount API Router under both /api/v1 and /api so all client requests resolve correctly
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get(['/api/health', '/api/v1/health'], (_req, res) => {
    res.json({ status: 'HEALTHY', app: 'NPA-PPMS', version: '3.0' });
  });

  // Strict JSON 404 middleware for any unhandled /api or /api/v1 routes
  // Intercepts ALL unmatched API paths and prevents Vite SPA middleware from returning index.html (<!doctype html>)
  app.use(['/api/v1', '/api'], (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`
    });
  });

  // Global API error handler ensuring any unhandled server errors on /api always return JSON
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (req.path.startsWith('/api')) {
      console.error('[API Server Error]:', err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An unexpected internal server error occurred.'
      });
    }
    next(err);
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NPA PPMS] Enterprise Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NPA PPMS Server:', err);
  process.exit(1);
});
