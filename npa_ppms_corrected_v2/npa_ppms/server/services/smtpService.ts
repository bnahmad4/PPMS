import nodemailer, { Transporter } from 'nodemailer';
import { db } from '../db/store.js';
import { SmtpSettings } from '../db/types.js';

const NPA_LOGO_URL = 'https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3';

class SmtpNotificationService {
  /**
   * Create a direct, real-time nodemailer transporter configured specifically for Gmail or On-Premise SMTP
   */
  private createLiveTransporter(customConfig?: Partial<SmtpSettings>): Transporter {
    const config = { ...db.getSmtpSettings(), ...(customConfig || {}) };
    const isSecure = config.encryptionType === 'TLS' || config.port === 465;

    // Check if auth credentials are provided (On-Premise open relays may omit credentials)
    const hasAuth = !!(config.username && config.passwordEncrypted);

    return nodemailer.createTransport({
      host: config.host || 'smtp.gmail.com',
      port: config.port || (isSecure ? 465 : 587),
      secure: isSecure,
      auth: hasAuth ? {
        user: config.username.trim(),
        pass: config.passwordEncrypted.trim()
      } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: config.timeoutMs || 12000
    });
  }

  /**
   * Safe stub: simulations disabled in production
   */
  async provisionLiveTestAccount(officer?: any): Promise<{ success: boolean; message: string; settings: SmtpSettings; webInbox: string }> {
    return {
      success: false,
      message: 'Simulation test mailboxes are disabled. The system is operating in production real-time mode with Google Workspace / Gmail and On-Premise SMTP.',
      settings: db.getSmtpSettings(),
      webInbox: ''
    };
  }

  /**
   * Test SMTP connection in real-time with the configured Gmail or On-Premise mail server
   */
  async testConnection(customConfig?: Partial<SmtpSettings>): Promise<{ success: boolean; message: string; details?: any }> {
    const config = { ...db.getSmtpSettings(), ...(customConfig || {}) };

    if (!config.host) {
      return {
        success: false,
        message: 'SMTP Host is missing. Please specify a valid mail server (smtp.gmail.com or On-Premise host).'
      };
    }

    try {
      const transporter = this.createLiveTransporter(config);
      await transporter.verify();

      const isGmail = config.host.toLowerCase().includes('gmail');
      const providerLabel = isGmail ? 'Google Workspace / Gmail' : 'On-Premise NPA Mail Server';

      return {
        success: true,
        message: `Real-time handshake verified! Successfully connected and authenticated with ${providerLabel} (${config.host}:${config.port} via ${config.encryptionType}).`
      };
    } catch (error: any) {
      const isGmail = (config.host || '').toLowerCase().includes('gmail');
      let friendlyHint = error.message || 'Unable to establish socket connection to mail server.';
      if (isGmail && (error.message?.includes('535') || error.message?.includes('Username and Password not accepted') || error.code === 'EAUTH')) {
        friendlyHint = 'Gmail authentication rejected. For Gmail/Google Workspace, please use a 16-character Google App Password (not your personal password). Enable 2-Step Verification in Google Account -> Security -> App Passwords.';
      }

      return {
        success: false,
        message: `SMTP Connection test failed: ${friendlyHint}`,
        details: {
          code: error.code,
          command: error.command,
          host: config.host,
          port: config.port
        }
      };
    }
  }

  /**
   * Core direct real-time email sender (no simulations or mock fallbacks)
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    eventCode: string;
    applicationReference?: string;
    attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = db.getSmtpSettings();
    if (!config.isEnabled) {
      console.log(`[SMTP] Skipping dispatch for ${options.eventCode} - SMTP disabled in settings.`);
      return { success: false, error: 'SMTP is disabled in system settings.' };
    }

    if (!config.host) {
      return { success: false, error: 'No SMTP server host configured. Please configure Gmail or On-Premise SMTP.' };
    }

    try {
      const transporter = this.createLiveTransporter(config);
      const senderAddress = config.senderEmail?.trim() || config.username?.trim() || 'noreply@nigerianports.gov.ng';
      const senderDisplayName = config.senderName?.trim() || 'Nigerian Ports Authority';

      const sentInfo = await transporter.sendMail({
        from: `"${senderDisplayName}" <${senderAddress}>`,
        to: options.to,
        replyTo: config.replyToEmail?.trim() || senderAddress,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
        attachments: options.attachments
      });

      // Log successful real-time transmission in database audit trail
      db.logEmailNotification({
        recipientEmail: options.to,
        subject: options.subject,
        applicationReference: options.applicationReference,
        eventCode: options.eventCode,
        attemptCount: 1,
        status: 'SENT',
        smtpMessageId: sentInfo.messageId
      });

      console.log(`[SMTP REAL-TIME] Dispatched [${options.eventCode}] to ${options.to} (MessageId: ${sentInfo.messageId})`);
      return { success: true, messageId: sentInfo.messageId };
    } catch (err: any) {
      const isGmail = (config.host || '').toLowerCase().includes('gmail');
      let errorMsg = err.message || 'SMTP delivery failed';
      if (isGmail && (err.message?.includes('535') || err.code === 'EAUTH')) {
        errorMsg = 'Gmail Authentication Failed (535): Please generate and provide a 16-character Google App Password in your Google Account Security settings.';
      }

      console.error(`[SMTP ERROR] Real-time delivery failed to ${options.to}:`, errorMsg);

      db.logEmailNotification({
        recipientEmail: options.to,
        subject: options.subject,
        applicationReference: options.applicationReference,
        eventCode: options.eventCode,
        attemptCount: 1,
        status: 'FAILED',
        errorMessage: errorMsg
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Build NPA standard branded HTML email
   */
  buildEmailTemplate(params: {
    title: string;
    subtitle?: string;
    greeting: string;
    bodyParagraphs: string[];
    detailsTable?: Array<{ label: string; value: string; isHighlight?: boolean }>;
    actionButton?: { label: string; url: string };
    footnote?: string;
    badgeText?: string;
    badgeColor?: 'green' | 'amber' | 'blue';
  }): string {
    const badgeBg = params.badgeColor === 'amber' ? '#FEF3C7' : params.badgeColor === 'blue' ? '#DBEAFE' : '#E8F5ED';
    const badgeText = params.badgeColor === 'amber' ? '#92400E' : params.badgeColor === 'blue' ? '#1E40AF' : '#065C35';
    const badgeBorder = params.badgeColor === 'amber' ? '#FDE68A' : params.badgeColor === 'blue' ? '#BFDBFE' : '#A7F3D0';

    return `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Top Official Header -->
        <div style="background-color: #087443; padding: 26px 24px; text-align: center; color: #FFFFFF;">
          <img src="${NPA_LOGO_URL}" alt="NPA Official Logo" style="width: 58px; height: 58px; margin-bottom: 12px; border-radius: 50%; background: #ffffff; padding: 4px; display: inline-block; object-fit: contain;" />
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">NIGERIAN PORTS AUTHORITY</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; opacity: 0.92; letter-spacing: 0.2px;">Digital Port Pass Management System (PPMS)</p>
        </div>

        <!-- Main Body -->
        <div style="padding: 28px 24px; color: #172B3A; font-size: 14px; line-height: 1.6;">
          ${params.badgeText ? `
            <div style="display: inline-block; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeText}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 12px; border-radius: 9999px; margin-bottom: 16px;">
              ${params.badgeText}
            </div>
          ` : ''}

          <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #087443;">
            ${params.title}
          </h2>
          ${params.subtitle ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #64748B;">${params.subtitle}</p>` : ''}

          <p style="margin: 16px 0 12px 0; font-size: 14px; color: #0F172A;">
            ${params.greeting}
          </p>

          ${params.bodyParagraphs.map(p => `<p style="margin: 8px 0; color: #334155; font-size: 14px;">${p}</p>`).join('')}

          ${params.detailsTable && params.detailsTable.length > 0 ? `
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                ${params.detailsTable.map((row, idx) => `
                  <tr style="${idx < params.detailsTable!.length - 1 ? 'border-bottom: 1px solid #E2E8F0;' : ''}">
                    <td style="padding: 8px 0; color: #64748B; font-weight: 500; width: 40%;">${row.label}</td>
                    <td style="padding: 8px 0; font-weight: 600; color: ${row.isHighlight ? '#087443' : '#0F172A'};">${row.value}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}

          ${params.actionButton ? `
            <div style="text-align: center; margin: 26px 0;">
              <a href="${params.actionButton.url}" style="display: inline-block; background-color: #087443; color: #FFFFFF; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(8, 116, 67, 0.2);">
                ${params.actionButton.label}
              </a>
            </div>
          ` : ''}

          ${params.footnote ? `
            <p style="font-size: 12px; color: #64748B; margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 14px;">
              ${params.footnote}
            </p>
          ` : ''}
        </div>

        <!-- Official Footer -->
        <div style="background-color: #F1F5F9; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">Nigerian Ports Authority • Corporate Headquarters</p>
          <p style="margin: 0 0 6px 0;">26/28 Marina, Lagos, Nigeria • Security & Gate Pass Management Gateway</p>
          <p style="margin: 0; font-size: 10px; color: #94A3B8;">Confidential Notice: This official automated electronic mail dispatch was issued by NPA PPMS.</p>
        </div>
      </div>
    `;
  }

  /**
   * Send a test email to a specified recipient in real time
   */
  async sendTestEmail(recipientEmail: string, note?: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    const timestamp = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
    const config = db.getSmtpSettings();
    const isGmail = (config.host || '').toLowerCase().includes('gmail');
    const providerLabel = isGmail ? 'Google Workspace / Gmail' : 'On-Premise NPA Mail Server';
    const subject = `NPA PPMS: Official Real-Time Test Email (${providerLabel})`;

    const htmlBody = this.buildEmailTemplate({
      title: 'SMTP Real-Time Gateway Transmission Test',
      subtitle: `Verified live mail dispatch via ${providerLabel}`,
      greeting: 'Hello Administrator / Authorized User,',
      badgeText: 'Live Delivery Test',
      badgeColor: 'green',
      bodyParagraphs: [
        `This real-time notification confirms that the <strong>${providerLabel}</strong> is fully active, authenticated, and communicating directly with recipient mailboxes.`,
        'All statutory portal events — including Port Pass application updates, GM Security clearances, Oracle billing advice, Remita receipts, and biometric capturing appointments — are dispatched instantly in real time.'
      ],
      detailsTable: [
        { label: 'Mail Server Gateway:', value: `${config.host}:${config.port} (${providerLabel})` },
        { label: 'Recipient Address:', value: recipientEmail },
        { label: 'Timestamp (WAT):', value: `${timestamp} (Lagos)` },
        { label: 'Security Handshake:', value: config.encryptionType },
        ...(note ? [{ label: 'Administrator Note:', value: note }] : [])
      ],
      footnote: 'This message was generated from the NPA PPMS System Administration Console.'
    });

    const result = await this.sendMail({
      to: recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'SMTP_TEST_EMAIL'
    });

    if (result.success) {
      return {
        success: true,
        message: `Real-time test email successfully dispatched via ${providerLabel} to ${recipientEmail}! Please check your inbox.`,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        message: `Real-time SMTP delivery failed: ${result.error}. Please verify server credentials and port accessibility.`
      };
    }
  }

  /**
   * Dispatch automatic event notification using templates
   */
  async dispatchEventEmail(params: {
    eventCode: string;
    recipientEmail: string;
    recipientName?: string;
    applicationReference: string;
    placeholders: Record<string, string>;
  }) {
    const config = db.getSmtpSettings();
    if (!config.isEnabled) return;

    const template = db.getEmailTemplates().find(t => t.eventCode === params.eventCode);
    let subject = template ? template.subject : `NPA PPMS Notification — Ref: ${params.applicationReference}`;
    let html = template ? template.htmlBody : `<p>Update on application ${params.applicationReference}</p>`;

    // Replace placeholders
    const allReplacements: Record<string, string> = {
      reference: params.applicationReference,
      recipient_name: params.recipientName || 'Valued Stakeholder',
      timestamp: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
      ...params.placeholders
    };

    Object.entries(allReplacements).forEach(([key, val]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), val);
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html,
      eventCode: params.eventCode,
      applicationReference: params.applicationReference
    });
  }

  /**
   * Automatic dispatch to OIC ID Unit when capturing is booked
   */
  async sendCapturingAppointmentIdUnitNotification(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    capturingDate: string;
    capturingTime: string;
    numberOfApplicants: number;
    venue: string;
  }) {
    const subject = 'New Biometric Capturing Appointment — NPA PPMS';

    const htmlBody = this.buildEmailTemplate({
      title: 'New Biometric Capturing Appointment',
      subtitle: 'Official notification to responsible Officer-In-Charge (OIC) ID Unit',
      greeting: 'Dear OIC ID Unit Officer,',
      badgeText: 'Action Required • Capturing Scheduled',
      badgeColor: 'amber',
      bodyParagraphs: [
        'A capturing appointment has been successfully booked by the registered corporate stakeholder below.',
        'Please review the scheduled personnel list and ensure the biometric capturing workstations, cameras, and fingerprint enrollment devices are prepared accordingly.'
      ],
      detailsTable: [
        { label: 'Company Name:', value: params.companyName },
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'Capturing Date:', value: params.capturingDate },
        { label: 'Capturing Time:', value: params.capturingTime },
        { label: 'Number of Applicants:', value: `${params.numberOfApplicants} personnel` },
        { label: 'Designated Venue:', value: params.venue }
      ],
      footnote: 'Please log in to the PPMS to view the complete appointment register and print capturing rosters.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'CAPTURING_APPOINTMENT_ID_UNIT_DISPATCH',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Confirmation dispatch to company when capturing is booked
   */
  async sendCapturingAppointmentCompanyConfirmation(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    capturingDate: string;
    capturingTime: string;
    numberOfApplicants: number;
    venue: string;
  }) {
    const subject = `Biometric Capturing Appointment Confirmed — NPA PPMS [Ref: ${params.applicationReference}]`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Biometric Capturing Appointment Confirmed',
      subtitle: 'Schedule details for personnel biometric enrollment',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Confirmed Appointment',
      badgeColor: 'green',
      bodyParagraphs: [
        `Your biometric capturing appointment for application reference <strong>${params.applicationReference}</strong> has been successfully booked and confirmed in the NPA PPMS.`,
        'All applicants must appear in person on the scheduled date and time with original national identification credentials (NIN slip, International Passport, or Voter Card) and proof of corporate employment.'
      ],
      detailsTable: [
        { label: 'Company Name:', value: params.companyName },
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'Capturing Date:', value: params.capturingDate },
        { label: 'Capturing Time Slot:', value: params.capturingTime },
        { label: 'Scheduled Employees:', value: `${params.numberOfApplicants} persons` },
        { label: 'Capturing Centre:', value: params.venue }
      ],
      footnote: 'Please arrive at least 15 minutes before your scheduled time slot to facilitate security check-in at the port gate.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'CAPTURING_CONFIRMED_COMPANY',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Reschedule dispatch to both parties
   */
  async sendCapturingRescheduledNotification(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    newDate: string;
    newTime: string;
    numberOfApplicants: number;
    venue: string;
    reason?: string;
  }) {
    const subject = `Biometric Capturing Rescheduled — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Capturing Appointment Rescheduled',
      subtitle: 'Updated date and time slot for biometric capturing',
      greeting: 'Dear Stakeholder,',
      badgeText: 'Schedule Modified',
      badgeColor: 'amber',
      bodyParagraphs: [
        `The biometric capturing appointment for <strong>${params.companyName}</strong> (Ref: <strong>${params.applicationReference}</strong>) has been updated to a new date and time slot.`,
        ...(params.reason ? [`<strong>Reason provided:</strong> ${params.reason}`] : [])
      ],
      detailsTable: [
        { label: 'Application Ref:', value: params.applicationReference, isHighlight: true },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'New Capturing Date:', value: params.newDate },
        { label: 'New Time Slot:', value: params.newTime },
        { label: 'Number of Personnel:', value: `${params.numberOfApplicants} persons` },
        { label: 'Capturing Venue:', value: params.venue }
      ],
      footnote: 'Previous slot capacity has been automatically returned to the public booking calendar.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'CAPTURING_RESCHEDULED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Cancellation dispatch to both parties
   */
  async sendCapturingCancelledNotification(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    previousDate: string;
    reason?: string;
  }) {
    const subject = `Biometric Capturing Appointment Cancelled — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Capturing Appointment Cancelled',
      subtitle: 'Notice of appointment cancellation and slot release',
      greeting: 'Dear Stakeholder,',
      badgeText: 'Appointment Cancelled',
      badgeColor: 'amber',
      bodyParagraphs: [
        `The scheduled capturing appointment for <strong>${params.companyName}</strong> on <strong>${params.previousDate}</strong> has been cancelled.`,
        'The reserved slot capacity has been released back into availability on the PPMS booking portal.',
        ...(params.reason ? [`<strong>Cancellation Reason:</strong> ${params.reason}`] : [])
      ],
      detailsTable: [
        { label: 'Application Ref:', value: params.applicationReference, isHighlight: true },
        { label: 'Company Name:', value: params.companyName },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'Cancelled Date:', value: params.previousDate }
      ],
      footnote: 'To re-book, log in to your PPMS dashboard and select a new available date and time slot.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'CAPTURING_CANCELLED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch when application is returned for correction by ID Unit or GM Security
   */
  async sendApplicationReturnedEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    correctionNotes: string;
    reviewingDepartment?: string;
  }) {
    const subject = `ACTION REQUIRED: Application Returned for Correction — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Port Pass Application Returned for Correction',
      subtitle: 'Statutory verification feedback requiring applicant attention',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Correction Required',
      badgeColor: 'amber',
      bodyParagraphs: [
        `Your Port Pass Application with reference <strong>${params.applicationReference}</strong> at <strong>${params.portLocation}</strong> has been reviewed by the <strong>${params.reviewingDepartment || 'OIC ID Unit'}</strong> and returned for documentation or personnel bio-data correction.`,
        'Please review the inspecting officer\'s specific instructions below, log into your PPMS corporate portal account, update or replace the requested documents, and resubmit your application for statutory verification.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Port Command:', value: params.portLocation },
        { label: 'Reviewing Authority:', value: params.reviewingDepartment || 'Officer-in-Charge, Port ID Unit' },
        { label: 'Correction Instructions:', value: params.correctionNotes || 'Please review uploaded documents and rectify deficiencies.', isHighlight: true },
        { label: 'Next Action:', value: 'Edit application dossier in PPMS and resubmit for verification.' }
      ],
      footnote: 'Promptly addressing the requested corrections will prevent delays in biometric capturing and gate access badge issuance.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'ID_UNIT_RETURNED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch when an application is corrected and resubmitted by the applicant
   */
  async sendApplicationResubmittedEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    resubmissionNotes?: string;
  }) {
    const subject = `NPA PPMS: Application Resubmitted for Verification — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Application Resubmitted for ID Unit Verification',
      subtitle: 'Applicant has completed requested corrections',
      greeting: `Attention OIC ID Unit / ${params.companyName},`,
      badgeText: 'Resubmitted / In Verification',
      badgeColor: 'blue',
      bodyParagraphs: [
        `Port Pass Application <strong>${params.applicationReference}</strong> (${params.companyName}) has been corrected and resubmitted for verification at <strong>${params.portLocation}</strong>.`,
        'The inspecting officer may now review the revised statutory documentation and employee bio-data.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Applicant Organization:', value: params.companyName },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'Applicant Response Notes:', value: params.resubmissionNotes || 'Requested document corrections uploaded.', isHighlight: true }
      ],
      footnote: 'This notification was automatically dispatched following electronic dossier resubmission in PPMS.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'APPLICATION_RESUBMITTED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatches official NPA corporate onboarding credentials EXCLUSIVELY to the registered company email
   */
  async sendCompanyProfilingCredentials(params: {
    companyEmail: string;
    companyName: string;
    cacNumber: string;
    portName: string;
    authRepName: string;
    loginUsername: string;
    temporaryPassword: string;
    loginUrl?: string;
  }) {
    const subject = `Official NPA PPMS Corporate Credentials — ${params.companyName} [CAC: ${params.cacNumber}]`;
    const portalUrl = params.loginUrl || 'https://ais-pre-age24yq6axggubpau2iadg-376635237839.europe-west1.run.app';

    const htmlBody = this.buildEmailTemplate({
      title: 'Corporate Profiling & Administrator Credentials',
      subtitle: 'Official Nigerian Ports Authority Digital Port Pass Management System (PPMS)',
      greeting: `Dear Management of ${params.companyName},`,
      badgeText: 'CONFIDENTIAL • CORPORATE ACCESS CREDENTIALS',
      badgeColor: 'green',
      bodyParagraphs: [
        `We are pleased to inform you that <strong>${params.companyName}</strong> (CAC Reg No: <strong>${params.cacNumber}</strong>) has been officially profiled and registered on the Nigerian Ports Authority Port Pass Management System (PPMS).`,
        'In accordance with NPA corporate access governance, your administrative login credentials have been provisioned and transmitted <strong>exclusively to this registered corporate email address</strong>.',
        'You may now log in to the portal to upload statutory certifications, manage your workforce list, and submit Port Pass applications.'
      ],
      detailsTable: [
        { label: 'Registered Entity Name:', value: params.companyName },
        { label: 'CAC Registration Number:', value: params.cacNumber },
        { label: 'Primary Port Command:', value: params.portName },
        { label: 'Authorized Representative:', value: params.authRepName },
        { label: 'Corporate Login Username / Email:', value: params.loginUsername, isHighlight: true },
        { label: 'Temporary Initial Password:', value: params.temporaryPassword, isHighlight: true },
        { label: 'Portal Access Link:', value: portalUrl }
      ],
      actionButton: {
        label: 'Sign In to NPA Corporate Portal',
        url: portalUrl
      },
      footnote: 'SECURITY NOTICE: These credentials grant corporate administrative rights. Do not forward or share this email. You will be prompted to update your password upon initial sign-in.'
    });

    return await this.sendMail({
      to: params.companyEmail,
      subject,
      html: htmlBody,
      eventCode: 'COMPANY_PROFILING_CREDENTIALS',
      applicationReference: params.cacNumber
    });
  }

  /**
   * Dispatches official NPA PPMS Password Reset Security Verification PIN exclusively to the registered corporate email
   */
  async sendPasswordResetEmail(params: {
    recipientEmail: string;
    recipientName: string;
    companyName?: string;
    resetCode: string;
    portalUrl?: string;
    expiresInMinutes?: number;
  }) {
    const subject = `NPA PPMS: Password Reset Verification Code [${params.resetCode}]`;
    const portalUrl = params.portalUrl || 'https://ais-dev-age24yq6axggubpau2iadg-376635237839.europe-west1.run.app';
    const validityMins = params.expiresInMinutes || 15;
    const timestamp = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });

    const htmlBody = this.buildEmailTemplate({
      title: 'Corporate Account Password Reset Verification',
      subtitle: 'Official Nigerian Ports Authority Digital Port Pass Management System (PPMS)',
      greeting: `Dear ${params.recipientName || params.companyName || 'Corporate Representative'},`,
      badgeText: 'SECURITY VERIFICATION • PASSWORD RESET',
      badgeColor: 'amber',
      bodyParagraphs: [
        'A request was made to reset the access credentials for your Nigerian Ports Authority Port Pass Management System (PPMS) account.',
        `To authorize and complete this password reset, please enter the official 6-digit One-Time Security PIN below into the portal verification window. This verification code is valid for <strong>${validityMins} minutes</strong>.`,
        'If you or an authorized corporate representative did not initiate this password recovery, please notify the NPA Port Pass Security Office immediately.'
      ],
      detailsTable: [
        { label: 'Authorized Account / User:', value: params.recipientEmail, isHighlight: true },
        ...(params.companyName ? [{ label: 'Corporate Entity:', value: params.companyName }] : []),
        { label: '6-Digit Security Verification PIN:', value: params.resetCode, isHighlight: true },
        { label: 'PIN Validity Period:', value: `${validityMins} Minutes (Expires shortly)` },
        { label: 'Request Timestamp (WAT):', value: `${timestamp} (Lagos)` }
      ],
      actionButton: {
        label: 'Enter Verification PIN on Portal',
        url: portalUrl
      },
      footnote: 'SECURITY PROTOCOL: Never disclose this PIN to third parties. NPA personnel will never request your password or security verification PIN.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      text: `NPA PPMS Password Reset Verification PIN: ${params.resetCode}\nValidity: ${validityMins} minutes\nAccount: ${params.recipientEmail}\nTimestamp: ${timestamp}`,
      eventCode: 'PASSWORD_RESET_DISPATCH',
      applicationReference: params.companyName || 'AUTH_RECOVERY'
    });
  }

  /**
   * Dispatch when Tariff & Billing generates invoice
   */
  async sendBillIssuedEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    amount: number;
    rrr: string;
    oracleRef: string;
    dueDate?: string;
  }) {
    const subject = `NPA PPMS: Billing Advice & Remita Reference — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Port Pass Billing Advice Issued',
      subtitle: 'Tariff assessment and official payment instructions',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Payment Required',
      badgeColor: 'amber',
      bodyParagraphs: [
        `The Tariff & Billing Division has assessed port pass dues for application reference <strong>${params.applicationReference}</strong>.`,
        'Please process payment using the Remita Retrieval Reference (RRR) below through your bank, online banking, or Remita portal. Once settled, upload your e-Receipt in PPMS to proceed.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Remita RRR:', value: params.rrr, isHighlight: true },
        { label: 'Oracle EBS Bill Ref:', value: params.oracleRef },
        { label: 'Total Payable:', value: `NGN ${params.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
        { label: 'Payment Deadline:', value: params.dueDate || 'Within 14 working days' }
      ],
      footnote: 'All payments must be made strictly to the official Nigerian Ports Authority TSA account via Remita.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'BILL_ISSUED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch when Accounts Division confirms payment
   */
  async sendPaymentConfirmedEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    amount: number;
    receiptNumber: string;
  }) {
    const subject = `NPA PPMS: Payment Confirmed — Ready for Biometrics (Ref: ${params.applicationReference})`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Payment Verification Confirmed',
      subtitle: 'Dues settled • Immediate biometric scheduling unlocked',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Payment Verified',
      badgeColor: 'green',
      bodyParagraphs: [
        `The Accounts Division has verified and reconciled your payment of <strong>NGN ${params.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong> for Application Reference <strong>${params.applicationReference}</strong>.`,
        'Your application is now officially <strong>Ready for Biometric Scheduling</strong>. Please log in to your PPMS portal to pick your preferred date and time slot for biometric enrollment.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Verified Amount:', value: `NGN ${params.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
        { label: 'Receipt / Bank Ref:', value: params.receiptNumber },
        { label: 'Port Location:', value: params.portLocation }
      ],
      footnote: 'Next Step: Proceed to "Biometric Appointment Booking" on your company dashboard.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'PAYMENT_CONFIRMED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch when passes are printed and ready for pickup
   */
  async sendPassReadyEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    passCount: number;
    venue: string;
  }) {
    const subject = `NPA PPMS: Port Passes Ready for Collection — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Port Passes Printed & Ready for Pickup',
      subtitle: 'Physical credentials available at port ID Unit',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Ready for Collection',
      badgeColor: 'green',
      bodyParagraphs: [
        `We are pleased to inform you that <strong>${params.passCount} Port Pass(es)</strong> for application reference <strong>${params.applicationReference}</strong> have been produced, RFID-encoded, and quality-verified.`,
        'Your authorized representative may now proceed to the designated Port ID Unit to physically collect the passes.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Number of Passes:', value: `${params.passCount} pass card(s)` },
        { label: 'Port Location:', value: params.portLocation },
        { label: 'Pickup Venue:', value: params.venue }
      ],
      footnote: 'Mandatory Collection Requirements: Authorized representative must present a formal Letter of Authority on company letterhead and a valid national ID.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'PASS_READY_FOR_COLLECTION',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch when passes are collected
   */
  async sendPassCollectedEmail(params: {
    recipientEmail: string;
    companyName: string;
    applicationReference: string;
    portLocation: string;
    collectorName: string;
    serialNumbers: string[];
  }) {
    const subject = `NPA PPMS: Port Passes Handover Completed — Ref: ${params.applicationReference}`;

    const htmlBody = this.buildEmailTemplate({
      title: 'Port Passes Collected & Activated',
      subtitle: 'Official handover record completed',
      greeting: `Dear ${params.companyName},`,
      badgeText: 'Completed & Active',
      badgeColor: 'green',
      bodyParagraphs: [
        `The physical port passes for application reference <strong>${params.applicationReference}</strong> were collected on <strong>${new Date().toLocaleDateString('en-NG')}</strong> by <strong>${params.collectorName}</strong>.`,
        'All issued RFID cards are now active at the designated port access turnstiles and gates.'
      ],
      detailsTable: [
        { label: 'Application Reference:', value: params.applicationReference, isHighlight: true },
        { label: 'Collector Name:', value: params.collectorName },
        { label: 'Pass Serial Numbers:', value: params.serialNumbers.join(', ') || 'N/A' },
        { label: 'Port Facility:', value: params.portLocation }
      ],
      footnote: 'Report lost or stolen cards immediately to NPA Port Security Division.'
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      eventCode: 'PASS_COLLECTED',
      applicationReference: params.applicationReference
    });
  }

  /**
   * Dispatch an official NPA Executive Report via SMTP email with optional CSV attachment
   */
  async sendReportEmail(params: {
    recipientEmail: string;
    reportTitle: string;
    reportSummary: { totalRecords: number; totalRevenueNgn?: number; period: string; generatedBy: string; portScope?: string };
    notes?: string;
    csvContent?: string;
    csvFilename?: string;
  }): Promise<{ success: boolean; message: string; messageId?: string; previewUrl?: string }> {
    const subject = `[NPA PPMS Executive Report] ${params.reportTitle} - ${new Date().toLocaleDateString('en-NG')}`;
    const formattedRevenue = params.reportSummary.totalRevenueNgn != null ? `NGN ${params.reportSummary.totalRevenueNgn.toLocaleString()}` : 'N/A';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #087443; padding: 24px; text-align: center; color: white;">
          <img src="${NPA_LOGO_URL}" alt="NPA Crest" style="height: 60px; margin-bottom: 12px; border-radius: 50%;" />
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">NIGERIAN PORTS AUTHORITY</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Digital Port Pass Management System (PPMS) — Official Executive Report</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #087443; margin-top: 0; font-size: 18px; border-bottom: 2px solid #087443; padding-bottom: 8px;">
            ${params.reportTitle}
          </h2>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            An official executive management report was generated from the NPA PPMS Reporting & Operational Intelligence Module.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b; width: 40%;">Report Scope:</td><td style="padding: 8px; font-weight: bold;">${params.reportSummary.portScope || 'All Port Complexes'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Reporting Period:</td><td style="padding: 8px;">${params.reportSummary.period}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Total Records Filtered:</td><td style="padding: 8px; font-weight: bold; color: #087443;">${params.reportSummary.totalRecords}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Total Revenue / Amount:</td><td style="padding: 8px; font-weight: bold; color: #0284c7;">${formattedRevenue}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Generated By:</td><td style="padding: 8px;">${params.reportSummary.generatedBy}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Dispatch Date:</td><td style="padding: 8px; font-family: monospace;">${new Date().toLocaleString('en-NG')}</td></tr>
          </table>
          ${params.notes ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #087443; padding: 12px; margin: 16px 0; font-size: 13px; color: #334155;">
              <strong>Executive Note / Remarks:</strong><br />${params.notes}
            </div>
          ` : ''}
          ${params.csvContent ? `
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569; margin-top: 16px;">
              📎 <strong>Attached Report File:</strong> ${params.csvFilename || 'npa_report_export.csv'} (Included as email attachment)
            </div>
          ` : ''}
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Nigerian Ports Authority Headquarters, 26/28 Marina, Lagos, Nigeria.<br />
          Confidential Management Document — For Authorized Port Security & Accounts Personnel Only.
        </div>
      </div>
    `;

    const attachments = params.csvContent ? [{
      filename: params.csvFilename || 'npa_report_export.csv',
      content: params.csvContent,
      contentType: 'text/csv'
    }] : undefined;

    const result = await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      text: `NPA PPMS Executive Report: ${params.reportTitle}\nScope: ${params.reportSummary.portScope || 'All Port Complexes'}\nTotal Records: ${params.reportSummary.totalRecords}\nRevenue: ${formattedRevenue}\nGenerated By: ${params.reportSummary.generatedBy}`,
      eventCode: 'REPORT_DISPATCH',
      attachments
    });

    return {
      success: result.success,
      message: result.success ? 'Official NPA Executive Report transmitted via SMTP.' : (result.error || 'Failed to dispatch report email.'),
      messageId: result.messageId
    };
  }

  /**
   * Universal dispatch for in-app notifications directly to recipient's email address in real time
   */
  async sendNotificationEmail(params: {
    recipientEmail: string;
    recipientName: string;
    recipientRole?: string;
    notificationId: string;
    title: string;
    message: string;
    applicationReference?: string;
    portName?: string;
    companyName?: string;
    actionUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!params.recipientEmail) {
      return { success: false, error: 'Recipient email is empty' };
    }

    // Deduplicate if an identical email was already dispatched to this recipient for this application in the last 2.5 seconds
    const recentEmail = db.getEmailLogs().find(log => 
      log.recipientEmail.toLowerCase() === params.recipientEmail.toLowerCase() &&
      (
        log.subject.includes(params.title) ||
        (params.applicationReference && log.applicationReference === params.applicationReference && (Date.now() - new Date(log.dispatchedAt).getTime()) < 2500)
      ) &&
      (Date.now() - new Date(log.dispatchedAt).getTime()) < 2500
    );

    if (recentEmail) {
      console.log(`[SMTP] Skipping redundant email dispatch for notification "${params.title}" to ${params.recipientEmail} (already sent within 2.5s).`);
      return { success: true, messageId: recentEmail.smtpMessageId };
    }

    const timestamp = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
    const hasRef = !!params.applicationReference;
    const subject = hasRef
      ? `NPA PPMS: ${params.title} — Ref: ${params.applicationReference}`
      : `NPA PPMS: ${params.title}`;

    const titleLower = params.title.toLowerCase();

    let badgeColor: 'green' | 'amber' | 'blue' = 'blue';
    let badgeText = 'Portal Notification';

    if (titleLower.includes('return') || titleLower.includes('action required') || titleLower.includes('warning') || titleLower.includes('reject')) {
      badgeColor = 'amber';
      badgeText = 'Action Required';
    } else if (titleLower.includes('ready') || titleLower.includes('collection') || titleLower.includes('pass ready')) {
      badgeColor = 'green';
      badgeText = 'Pass Ready For Collection';
    } else if (titleLower.includes('confirm') || titleLower.includes('approved') || titleLower.includes('verified') || titleLower.includes('clearance')) {
      badgeColor = 'green';
      badgeText = 'Official Clearance Approved';
    } else if (titleLower.includes('billing') || titleLower.includes('payment') || titleLower.includes('rrr') || titleLower.includes('remita')) {
      badgeColor = 'blue';
      badgeText = 'Billing & Treasury Notice';
    } else if (titleLower.includes('capturing') || titleLower.includes('appointment') || titleLower.includes('biometric')) {
      badgeColor = 'blue';
      badgeText = 'Biometric Capturing Schedule';
    }

    const detailsTable: Array<{ label: string; value: string; isHighlight?: boolean }> = [
      { label: 'Notification Subject:', value: params.title, isHighlight: true },
      { label: 'Date & Time (WAT):', value: `${timestamp} (Lagos)` }
    ];

    if (params.applicationReference) {
      detailsTable.push({ label: 'Application Reference:', value: params.applicationReference, isHighlight: true });
    }
    if (params.companyName) {
      detailsTable.push({ label: 'Organization:', value: params.companyName });
    }
    if (params.portName) {
      detailsTable.push({ label: 'Port Command:', value: params.portName });
    }
    if (params.recipientRole) {
      detailsTable.push({ label: 'Recipient Role / Desk:', value: params.recipientRole.replace(/_/g, ' ') });
    }

    const htmlBody = this.buildEmailTemplate({
      title: params.title,
      subtitle: 'Official Port Pass Management System Electronic Notification',
      greeting: `Dear ${params.recipientName || 'Authorized User'},`,
      badgeText,
      badgeColor,
      bodyParagraphs: [
        params.message,
        'This electronic notification was automatically dispatched from the Nigerian Ports Authority Port Pass Management System (PPMS) in real time to your registered corporate / officer email.'
      ],
      detailsTable,
      actionButton: {
        label: 'Open PPMS Security Portal',
        url: 'https://ais-dev-age24yq6axggubpau2iadg-376635237839.europe-west1.run.app'
      },
      footnote: `Notification ID: ${params.notificationId} • Dispatched to ${params.recipientEmail}. To manage your notification preferences, log in to your PPMS portal dashboard.`
    });

    return await this.sendMail({
      to: params.recipientEmail,
      subject,
      html: htmlBody,
      text: `${params.title}\n\n${params.message}\n\n${params.applicationReference ? `Reference: ${params.applicationReference}\n` : ''}Date: ${timestamp}`,
      eventCode: 'NOTIFICATION_EMAIL_DISPATCH',
      applicationReference: params.applicationReference
    });
  }
}

export const smtpService = new SmtpNotificationService();
