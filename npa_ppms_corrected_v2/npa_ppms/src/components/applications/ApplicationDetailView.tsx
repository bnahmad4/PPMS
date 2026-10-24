import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Application, WorkflowLog, CapturingSlot } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PrintableAcknowledgement } from '../common/PrintableAcknowledgement';
import {
  FileText,
  Building2,
  Users,
  ShieldCheck,
  Receipt,
  CreditCard,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Printer,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileCheck2,
  Upload,
  Phone,
  Mail,
  User,
  ExternalLink,
  Download,
  Paperclip,
  Trash2,
  FolderUp,
  Lock,
  Shield,
  Info,
  Edit3,
  RotateCw
} from 'lucide-react';
import { FilePreviewModal, downloadFile, PreviewableFile } from '../common/FilePreviewModal';
import { EditAndResubmitModal } from './EditAndResubmitModal';

interface ApplicationDetailViewProps {
  applicationId: string;
  onBack: () => void;
  onRefreshList?: () => void;
}

export const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  applicationId,
  onBack,
  onRefreshList
}) => {
  const { currentUser, hasRole } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSlip, setShowSlip] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ID Unit & GM Security Action state
  const [reviewNotes, setReviewNotes] = useState('');

  // Tariff & Billing Form & Supporting Document Upload
  const [oracleBillRef, setOracleBillRef] = useState('');
  const [rrrNumber, setRrrNumber] = useState('');
  const [billAmount, setBillAmount] = useState('45000');
  const [billingDeadline, setBillingDeadline] = useState('');
  const [billingDocName, setBillingDocName] = useState('');
  const [billingDocTitle, setBillingDocTitle] = useState('Official Oracle EBS Demand Notice');
  const [billingFileData, setBillingFileData] = useState<string | null>(null);
  const [billingFileSizeBytes, setBillingFileSizeBytes] = useState<number>(0);
  const [billingMimeType, setBillingMimeType] = useState('application/pdf');

  // Payment Upload Form
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDocName, setPaymentDocName] = useState('Remita_Receipt.pdf');
  const [paymentFileData, setPaymentFileData] = useState<string | null>(null);
  const [paymentFileSizeBytes, setPaymentFileSizeBytes] = useState<number>(0);

  // Active file preview state
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  // Accounts Verification Form & Supporting Document Upload
  const [accountsNotes, setAccountsNotes] = useState('');
  const [accountsDocName, setAccountsDocName] = useState('');
  const [accountsDocTitle, setAccountsDocTitle] = useState('CBN TSA Settlement Schedule Extract');
  const [accountsFileData, setAccountsFileData] = useState<string | null>(null);
  const [accountsFileSizeBytes, setAccountsFileSizeBytes] = useState<number>(0);
  const [accountsMimeType, setAccountsMimeType] = useState('application/pdf');

  // Capturing Appointment Booking
  const [slots, setSlots] = useState<CapturingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // ID Unit Capturing Completion Outcomes
  const [capturingStatuses, setCapturingStatuses] = useState<Record<string, 'CAPTURED' | 'ABSENT' | 'RESCHEDULED' | 'CAPTURING_UNSUCCESSFUL'>>({});

  // Collection modal state
  const [collectorName, setCollectorName] = useState('');
  const [collectorIdType, setCollectorIdType] = useState('NIN');
  const [collectorIdRef, setCollectorIdRef] = useState('');
  const [collectorPhone, setCollectorPhone] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.getApplicationById(applicationId);
      setApplication(res.application);
      setWorkflowLogs(res.workflowLogs || []);

      if (res.application.bill) {
        setPaymentAmount(String(res.application.bill.amountNgn));
      }

      // Pre-initialize employee capturing statuses
      const initCapt: Record<string, 'CAPTURED' | 'ABSENT' | 'RESCHEDULED' | 'CAPTURING_UNSUCCESSFUL'> = {};
      res.application.employees.forEach(e => {
        initCapt[e.id] = (e.capturingStatus === 'CAPTURED' ? 'CAPTURED' : 'CAPTURED');
      });
      setCapturingStatuses(initCapt);

      // Load capturing slots if at scheduling stage
      if (res.application.status === 'READY_FOR_SCHEDULING' || res.application.status === 'CAPTURING_SCHEDULED') {
        const slotsRes = await api.getCapturingSlots(res.application.portId);
        setSlots(slotsRes.slots);
        if (slotsRes.slots.length > 0) setSelectedSlotId(slotsRes.slots[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching application details:', err);
      setLoadError(err.message || 'Unable to access this application dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applicationId]);

  // ID Unit Action
  const handleIdUnitAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN_CORRECTION') => {
    if (!application) return;
    try {
      setActionLoading(true);
      const noteToSend = reviewNotes.trim() || (action === 'RETURN_CORRECTION' && application.correctionNotes ? application.correctionNotes : '');
      const res = await api.verifyIdUnit(application.id, action, noteToSend);
      const actionLabels: Record<string, string> = {
        APPROVE: 'verified and forwarded to GM Security',
        RETURN_CORRECTION: `returned to ${res.application.companyName} for documentation correction`,
        REJECT: 'rejected'
      };
      setFeedbackMessage({
        type: 'success',
        text: `Application ${res.application.referenceNumber} successfully ${actionLabels[action] || action}!`
      });
      setApplication(res.application);
      setReviewNotes('');
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // GM Security Action
  const handleGmSecurityAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN_TO_ID_UNIT') => {
    if (!application) return;
    try {
      setActionLoading(true);
      const res = await api.approveGmSecurity(application.id, action, reviewNotes);
      setFeedbackMessage({ type: 'success', text: `GM Security clearance ${action} completed.` });
      setApplication(res.application);
      setReviewNotes('');
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Tariff & Billing Submit
  const handleBillingSubmit = async () => {
    if (!application || !oracleBillRef || !rrrNumber) {
      setFeedbackMessage({ type: 'error', text: 'Oracle EBS Reference and RRR Number are mandatory.' });
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.recordBilling(application.id, {
        oracleBillReference: oracleBillRef,
        rrrNumber,
        amountNgn: Number(billAmount),
        billingDate: new Date().toISOString().split('T')[0],
        paymentDeadline: billingDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        remarks: reviewNotes,
        documentName: billingDocName ? (billingDocTitle || billingDocName) : undefined,
        documentData: billingFileData || undefined,
        fileSizeBytes: billingFileSizeBytes || undefined,
        mimeType: billingMimeType || undefined
      });
      setFeedbackMessage({
        type: 'success',
        text: `Billing advice issued${billingDocName ? ' with attached supporting document' : ''} and company notified.`
      });
      setApplication(res.application);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to record bill' });
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Upload Submit
  const handlePaymentSubmit = async () => {
    if (!application || !paymentRef || !paymentAmount) {
      setFeedbackMessage({ type: 'error', text: 'Receipt reference and amount paid are required.' });
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.uploadPayment(application.id, {
        receiptReference: paymentRef,
        amountPaidNgn: Number(paymentAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        receiptDocumentUrl: `/uploads/receipts/${paymentDocName || 'receipt.pdf'}`,
        receiptFileName: paymentDocName || 'remita_receipt.pdf',
        receiptFileData: paymentFileData || ''
      });
      setFeedbackMessage({ type: 'success', text: 'Payment receipt uploaded. Forwarded to Accounts Division.' });
      setApplication(res.application);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Accounts Verification Action
  const handleAccountsAction = async (action: 'CONFIRM' | 'REJECT' | 'REQUEST_CLARIFICATION') => {
    if (!application) return;
    try {
      setActionLoading(true);
      const verificationDoc = accountsDocName ? {
        fileName: accountsDocName,
        documentName: accountsDocTitle || accountsDocName,
        fileData: accountsFileData || undefined,
        fileSizeBytes: accountsFileSizeBytes || undefined,
        mimeType: accountsMimeType || undefined
      } : undefined;

      const res = await api.verifyPayment(application.id, action, accountsNotes, verificationDoc);
      setFeedbackMessage({
        type: 'success',
        text: `Payment verification: ${action} processed${accountsDocName ? ' with attached settlement audit document' : ''}.`
      });
      setApplication(res.application);
      setAccountsNotes('');
      setAccountsDocName('');
      setAccountsFileData(null);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Book Capturing Appointment
  const handleBookAppointment = async () => {
    if (!application || !selectedSlotId) return;
    try {
      setActionLoading(true);
      const res = await api.bookCapturingAppointment(application.id, selectedSlotId);
      setFeedbackMessage({ type: 'success', text: 'Biometric capturing appointment booked successfully!' });
      setApplication(res.application);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Booking failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Record Capturing Outcomes (ID Unit)
  const handleRecordCapturing = async () => {
    if (!application) return;
    try {
      setActionLoading(true);
      const outcomes = application.employees.map(e => ({
        employeeId: e.id,
        status: capturingStatuses[e.id] || 'CAPTURED'
      }));
      const res = await api.recordCapturingOutcomes(application.id, outcomes);
      setFeedbackMessage({ type: 'success', text: 'Biometric capturing completion recorded by ID Unit.' });
      setApplication(res.application);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to record outcomes' });
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Pass Ready for Collection (ID Unit)
  const handleMarkPassReady = async () => {
    if (!application) return;
    try {
      setActionLoading(true);
      const res = await api.markPassReady(application.id);
      setFeedbackMessage({ type: 'success', text: 'Port passes produced and marked ready for collection!' });
      setApplication(res.application);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to mark ready' });
    } finally {
      setActionLoading(false);
    }
  };

  // Record Pass Collection (ID Unit)
  const handleRecordCollection = async (passId: string) => {
    if (!collectorName || !collectorIdRef) {
      setFeedbackMessage({ type: 'error', text: 'Collecting person name and ID reference are mandatory.' });
      return;
    }
    try {
      setActionLoading(true);
      await api.recordPassCollection(passId, {
        collectedByName: collectorName,
        collectorIdType,
        collectorIdReference: collectorIdRef,
        collectorPhone
      });
      setFeedbackMessage({ type: 'success', text: 'Pass collection officially recorded and closed.' });
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to record collection' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center gap-3">
        <RotateCw className="w-6 h-6 animate-spin text-[#087443]" />
        <span>Loading Application Dossier #{applicationId}...</span>
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-amber-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold shadow-2xs">
          <Lock className="w-7 h-7 text-amber-700" />
        </div>
        <div className="inline-block bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Statutory Access Boundary
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Application Has Not Reached Your Workflow Desk
        </h2>
        <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
          {loadError || 'This application dossier is not currently available within your operational mandate.'}
        </p>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 max-w-md mx-auto">
          <strong>NPA PPMS Governance Rule:</strong> Under Section 34 of the Nigerian Ports Authority Act, personnel may only inspect, review, or act on port pass applications once they have formally reached their point in the approval workflow.
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Return to Authorized Queue
          </button>
        </div>
      </div>
    );
  }

  const isCompany = hasRole('COMPANY_ADMIN') || hasRole('COMPANY_STAFF');
  const isIdUnit = hasRole('OIC_ID_UNIT') || hasRole('SYSTEM_ADMIN');
  const isGmSecurity = hasRole('GM_SECURITY') || hasRole('SYSTEM_ADMIN');
  const isBilling = hasRole('TARIFF_BILLING') || hasRole('SYSTEM_ADMIN');
  const isAccounts = hasRole('ACCOUNTS_OFFICER') || hasRole('SYSTEM_ADMIN');
  const isAdmin = hasRole('SYSTEM_ADMIN') || hasRole('PORT_ADMIN');
  const isAuditor = hasRole('AUDITOR') || hasRole('HQ_SUPERVISOR');

  const hasActiveAction =
    (application.status === 'RETURNED_FOR_CORRECTION' && isCompany) ||
    ((application.status === 'PENDING_ID_UNIT_VERIFICATION' || application.status === 'RETURNED_TO_ID_UNIT') && isIdUnit) ||
    (application.status === 'PENDING_GM_SECURITY_APPROVAL' && isGmSecurity) ||
    (application.status === 'PENDING_BILLING' && isBilling) ||
    (application.status === 'BILL_ISSUED' && isCompany) ||
    (application.status === 'PAYMENT_UNDER_REVIEW' && isAccounts) ||
    ((application.status === 'READY_FOR_SCHEDULING' || application.status === 'CAPTURING_SCHEDULED') && (isCompany || isIdUnit)) ||
    (application.status === 'CAPTURING_SCHEDULED' && isIdUnit) ||
    (application.status === 'AWAITING_PASS_PRODUCTION' && isIdUnit) ||
    (application.status === 'PASS_READY_FOR_COLLECTION' && isIdUnit);

  const getStageAdvisory = () => {
    switch (application.status) {
      case 'PENDING_ID_UNIT_VERIFICATION':
        return {
          step: 1,
          stageTitle: 'Stage 1 of 7: OIC ID Unit Document & Biometric Verification',
          assignedDivision: 'Officer-in-Charge, Port ID Unit Directorate',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          explanation: isCompany
            ? 'Your application dossier has been submitted to the Nigerian Ports Authority. Officers at the Port ID Unit are actively verifying your corporate documentation, statutory operating category licenses, and employee bio-data.'
            : isGmSecurity
            ? 'This application is currently in Stage 1 custody with the OIC ID Unit. GM Security clearance will activate automatically as soon as the ID Unit verifies statutory credentials and forwards the dossier.'
            : isBilling
            ? 'Stage 1 Verification in progress. Billing advice and Remita RRR generation are locked until ID Unit and GM Security approvals are recorded.'
            : isAccounts
            ? 'Stage 1 preliminary authentication. Payment records and Treasury single account verification are not yet applicable.'
            : isAuditor
            ? 'Stage 1 compliance verification currently underway by Port ID Unit officers (Auditor Supervisory Oversight Mode).'
            : 'Operational sign-off for this initial stage is reserved for the OIC ID Unit. Under PPMS strict role-based access rules, other departments do not execute Stage 1 actions.',
          applicantNotice: 'No applicant action required at this time. You will receive an automated notification once your application advances.'
        };
      case 'PENDING_GM_SECURITY_APPROVAL':
        return {
          step: 2,
          stageTitle: 'Stage 2 of 7: General Manager, Security Directorate Clearance',
          assignedDivision: 'General Manager, Security Directorate (Headquarters & Command Port)',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          explanation: isCompany
            ? 'Initial verification has been completed by the Port ID Unit. The application has been escalated to the General Manager, Security for high-level perimeter access clearance and port security background vetting.'
            : isIdUnit
            ? 'Stage 1 verification completed by your desk. The application dossier is now with the General Manager, Security for security profile assessment and port gate clearance.'
            : isBilling
            ? 'Awaiting GM Security clearance. Once security approval is granted, this application will advance to your Tariff & Billing queue for Oracle EBS entry.'
            : isAccounts
            ? 'Undergoing security vetting prior to Oracle EBS billing issuance.'
            : isAuditor
            ? 'Stage 2 security risk vetting in progress by GM Security Directorate (Auditor Oversight Mode).'
            : 'Operational sign-off at this stage is exclusively reserved for the General Manager, Security.',
          applicantNotice: 'No applicant action required at this time.'
        };
      case 'PENDING_BILLING':
        return {
          step: 3,
          stageTitle: 'Stage 3 of 7: Tariff & Billing Oracle Financials (EBS) Invoicing',
          assignedDivision: 'Tariff & Billing Division (Commercial Directorate)',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          explanation: isCompany
            ? 'Security vetting has been successfully granted by the General Manager, Security. The Tariff & Billing Division is now preparing your official Oracle EBS invoice and Remita Retrieval Reference (RRR) for statutory payment.'
            : isGmSecurity
            ? 'Security clearance granted by your directorate. The application has transitioned to Tariff & Billing for Oracle financial processing.'
            : isIdUnit
            ? 'Security vetting approved. Awaiting Oracle EBS billing entry by Tariff & Billing.'
            : isAccounts
            ? 'Pending Oracle EBS invoice generation by Tariff & Billing before payment can be collected.'
            : isAuditor
            ? 'Commercial fee computation and Oracle EBS invoice preparation in progress (Auditor Oversight Mode).'
            : 'Operational entry of Oracle EBS references and RRR numbers is reserved for Tariff & Billing officers.',
          applicantNotice: 'Billing advice is being prepared. You will receive an automated email with your payment reference.'
        };
      case 'BILL_ISSUED':
        return {
          step: 4,
          stageTitle: 'Stage 4A: Statutory Billing Advice Dispatched — Payment Required',
          assignedDivision: `Corporate Applicant (${application.companyName})`,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          explanation: isAccounts
            ? `Billing advice has been issued (Oracle Ref: ${application.bill?.oracleBillReference || 'N/A'}, RRR: ${application.bill?.rrrNumber || 'N/A'}). Awaiting Remita payment settlement and receipt evidence upload by the applicant company. Once uploaded, it will automatically populate your Payment Verification Queue.`
            : isBilling
            ? `Oracle EBS billing advice (Ref: ${application.bill?.oracleBillReference || 'N/A'}) and Remita RRR (${application.bill?.rrrNumber || 'N/A'}) for NGN ${application.bill?.amountNgn?.toLocaleString() || '0'} dispatched to company. Awaiting applicant payment.`
            : isIdUnit || isGmSecurity
            ? `Billing advice issued for NGN ${application.bill?.amountNgn?.toLocaleString() || '0'}. Awaiting company payment settlement before biometric capturing can proceed.`
            : isAuditor
            ? 'Commercial bill issued; awaiting Remita payment evidence from applicant (Auditor Oversight Mode).'
            : 'Billing advice has been issued. Awaiting payment receipt submission from applicant company.',
          applicantNotice: 'Please make payment via Remita and upload the receipt evidence below to proceed.'
        };
      case 'PAYMENT_UNDER_REVIEW':
        return {
          step: 4,
          stageTitle: 'Stage 4B: Central Bank of Nigeria (CBN) TSA Payment Verification',
          assignedDivision: 'Accounts & Treasury Division (Finance Directorate)',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          explanation: isCompany
            ? `Payment receipt (Ref: ${application.payment?.receiptReference || 'Remita e-Receipt'}) for NGN ${application.payment?.amountPaidNgn?.toLocaleString() || application.bill?.amountNgn?.toLocaleString() || '0'} has been received. The NPA Accounts Division is currently reconciling this payment against Central Bank of Nigeria TSA settlement schedules.`
            : isBilling
            ? `Payment receipt submitted for Oracle Bill ${application.bill?.oracleBillReference || 'N/A'} (RRR: ${application.bill?.rrrNumber || 'N/A'}). Accounts Division is verifying settlement.`
            : isIdUnit
            ? 'Payment evidence submitted and currently undergoing Accounts Division verification. Biometric capturing slots will unlock once payment is certified.'
            : isGmSecurity
            ? 'Payment submitted; undergoing Treasury reconciliation with Accounts Division.'
            : isAuditor
            ? 'Payment verification and Central Bank TSA settlement reconciliation in progress by Accounts Division (Auditor Oversight Mode).'
            : 'Payment verification and receipt auditing are exclusively restricted to Accounts & Treasury Division officers.',
          applicantNotice: 'Accounts Division is auditing payment evidence. Biometric capturing scheduling will unlock upon confirmation.'
        };
      case 'READY_FOR_SCHEDULING':
        return {
          step: 5,
          stageTitle: 'Stage 5A: Biometric Capturing Appointment Scheduling',
          assignedDivision: 'Port ID Unit Biometric Capturing Desk & Applicant Company',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          explanation: isGmSecurity || isBilling || isAccounts
            ? 'Payment has been verified and confirmed by Accounts Division. The application is now ready for biometric capturing appointment scheduling.'
            : isAuditor
            ? 'Payment cleared; awaiting biometric appointment booking (Auditor Oversight Mode).'
            : 'Select an available appointment date and time slot below for biometric enrollment.',
          applicantNotice: 'Select an appointment slot for your personnel to attend physical biometric enrollment at the port.'
        };
      case 'CAPTURING_SCHEDULED':
        return {
          step: 5,
          stageTitle: 'Stage 5B: Biometric Capturing & Identity Enrollment in Progress',
          assignedDivision: 'Port ID Unit Biometric Capturing Desk',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          explanation: isCompany
            ? `Biometric appointment is confirmed for ${application.capturingAppointment?.scheduledForDate || 'scheduled date'} (${application.capturingAppointment?.scheduledTimeSlot || 'scheduled slot'}) at ${application.capturingAppointment?.venue || 'Port ID Center'}. Sponsored personnel must present valid government photo identification and original employment credentials.`
            : isGmSecurity || isBilling || isAccounts
            ? `Biometric enrollment appointment confirmed for ${application.capturingAppointment?.scheduledForDate || 'scheduled date'}. Verification and photo capture conducted by Port ID Unit.`
            : isAuditor
            ? 'Biometric enrollment scheduled at Port ID Center (Auditor Oversight Mode).'
            : 'Biometric capture appointment is scheduled.',
          applicantNotice: 'Personnel must report in person at the Port ID Center for facial biometric and fingerprint capture.'
        };
      case 'AWAITING_PASS_PRODUCTION':
        return {
          step: 6,
          stageTitle: 'Stage 6A: Biometrics Approved — Pass Manufacturing & Encoding',
          assignedDivision: 'Port ID Unit Pass Production Desk',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          explanation: 'Biometric capture is verified. High-security RFID smart passes are being printed and encoded with cryptographic keys for port gate perimeter access.',
          applicantNotice: 'Passes are being printed and encoded. You will be notified when ready for pickup.'
        };
      case 'PASS_READY_FOR_COLLECTION':
        return {
          step: 6,
          stageTitle: 'Stage 6B of 7: Port Passes Printed & Ready for Physical Collection',
          assignedDivision: 'Port ID Unit / Port Pass Office Counter',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          explanation: isCompany
            ? `All ${application.employees.length} port passes have been successfully manufactured, encoded with RFID credentials, and delivered to the ${application.portName} Pass Office. Your authorized company representative may collect the passes upon presenting official company identification.`
            : isGmSecurity || isBilling || isAccounts
            ? `Passes have been printed and are ready for counter collection sign-off at the ${application.portName} Pass Office.`
            : isAuditor
            ? 'Passes produced; awaiting counter collection sign-off by company representative (Auditor Oversight Mode).'
            : 'Passes are ready for physical pickup at the port pass counter.',
          applicantNotice: 'Authorized representative should present identification at the Port Pass Office to collect passes.'
        };
      case 'RETURNED_TO_ID_UNIT':
        return {
          step: 1,
          stageTitle: 'Dossier Referred Back to Port ID Unit by GM Security',
          assignedDivision: 'Officer-in-Charge, Port ID Unit Directorate',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          explanation: isIdUnit
            ? 'The General Manager, Security has referred this application back to the Port ID Unit with observations. As OIC ID Unit, you can return this dossier directly to the sponsoring company for required document/bio-data corrections, or address the remarks and re-forward to GM Security.'
            : isCompany
            ? 'The General Manager, Security has referred your application back to the Port ID Unit for administrative review. The ID Unit will either resolve internal notes or return the dossier to you if document corrections are required.'
            : isGmSecurity
            ? 'You have referred this dossier back to the Port ID Unit for clarification or document rectification.'
            : 'Application returned by GM Security to the Port ID Unit for review.',
          applicantNotice: 'Dossier is undergoing review at the Port ID Unit following GM Security referral.'
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          step: 1,
          stageTitle: 'Application Returned for Documentation Correction',
          assignedDivision: `Corporate Applicant (${application.companyName})`,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          explanation: isCompany
            ? 'An inspecting NPA officer returned this application with specific correction instructions. Please review the notes below, update the required documents, and resubmit for statutory vetting.'
            : 'Application was returned to the applicant company for documentation or bio-data correction. Awaiting company resubmission.',
          applicantNotice: 'Please review officer instructions, replace defective documents, and resubmit.'
        };
      case 'REJECTED':
        return {
          step: 0,
          stageTitle: 'Application Formally Rejected by Statutory Authority',
          assignedDivision: 'NPA Security / Port Directorate',
          badgeColor: 'bg-red-100 text-red-900 border-red-300',
          explanation: 'This application has been formally rejected following statutory vetting and security review. The decision is final under Section 34 of the NPA Port Pass Regulations.',
          applicantNotice: 'Application rejected. Please consult NPA Port Pass Directorate for formal appeal procedures.'
        };
      default:
        return {
          step: 1,
          stageTitle: `Workflow Stage: ${application.status.replace(/_/g, ' ')}`,
          assignedDivision: 'NPA Port Administration',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          explanation: 'This dossier is processing through the Nigerian Ports Authority Workflow.',
          applicantNotice: 'Dossier is undergoing statutory processing.'
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Application List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {application.referenceNumber}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {application.companyName} • {application.portName} • {application.categoryName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {application.status === 'RETURNED_FOR_CORRECTION' && isCompany && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit & Resubmit Dossier</span>
            </button>
          )}

          <button
            onClick={() => setShowSlip(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Acknowledgement Slip
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* WORKFLOW ACTION PANEL (DYNAMICALLY RENDERED BASED ON STAGE & ROLE) */}
      <div className="bg-white rounded-xl border-2 border-emerald-600/40 shadow-sm overflow-hidden">
        <div className="bg-[#087443] px-6 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-200" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Workflow Stage Action: {application.status.replace(/_/g, ' ')}
            </h2>
          </div>
          <span className="text-[11px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded font-mono">
            Active Role: {currentUser?.roles[0]}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* STRICT ROLE-BASED ACCESS ADVISORY & STAGE STATUS PANEL */}
          {!hasActiveAction && application.status !== 'COLLECTED' && application.status !== 'PASS_READY_FOR_COLLECTION' && (() => {
            const advisory = getStageAdvisory();
            return (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#087443] flex items-center justify-center font-bold text-xs">
                        {advisory.step > 0 ? advisory.step : '!'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {advisory.stageTitle}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Designated Mandate: <strong className="text-slate-800">{advisory.assignedDivision}</strong>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border self-start sm:self-auto ${advisory.badgeColor}`}>
                      {application.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Stage Progress Bar (1 to 7) */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1.5">
                      <span>Mandatory Clearance Pipeline</span>
                      <span className="font-mono text-[#087443] font-bold">Step {advisory.step} of 7</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { step: 1, label: 'ID Unit' },
                        { step: 2, label: 'GM Security' },
                        { step: 3, label: 'Billing' },
                        { step: 4, label: 'Accounts' },
                        { step: 5, label: 'Capturing' },
                        { step: 6, label: 'Pass Ready' },
                        { step: 7, label: 'Active' },
                      ].map((s) => {
                        const isDone = s.step < advisory.step;
                        const isCurrent = s.step === advisory.step;
                        return (
                          <div key={s.step} className="text-center">
                            <div
                              className={`h-1.5 rounded-full ${
                                isDone
                                  ? 'bg-[#087443]'
                                  : isCurrent
                                  ? 'bg-amber-500 ring-2 ring-amber-300'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span className={`text-[9px] mt-1 block truncate font-medium ${
                              isCurrent ? 'text-[#087443] font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Context Explanation */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">Current Stage Operational Status:</span>
                        <p className="text-slate-600 leading-relaxed text-xs">
                          {advisory.explanation}
                        </p>
                      </div>
                    </div>

                    {isCompany && (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded text-xs text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0" />
                        <span className="font-medium">{advisory.applicantNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Strict Separation of Responsibilities Notice */}
                  {!isCompany && (
                    <div className="p-2.5 bg-slate-100 rounded text-[11px] text-slate-600 flex items-center justify-between gap-2 border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          <strong>PPMS Access Control Policy:</strong> Future or out-of-mandate workflow actions are locked for profile <strong>{currentUser?.roles[0]}</strong>. Actions can only be performed by the designated authority at the appropriate stage.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">
                        READ-ONLY DOSSIER
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 0. APPLICATION RETURNED FOR CORRECTION - COMPANY ACTION PANEL */}
          {application.status === 'RETURNED_FOR_CORRECTION' && isCompany && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs text-amber-950 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Action Required: Application Dossier Returned for Correction</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-400 px-2.5 py-0.5 rounded">
                    CORRECTION REQUIRED
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-amber-300 space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Inspecting Officer Instructions / Stated Deficiencies:
                  </span>
                  <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                    {application.correctionNotes || 'Please inspect attached statutory certificates, corporate licenses, or employee bio-data, make requested corrections, and resubmit for statutory vetting.'}
                  </p>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  Your application is unlocked for revision. You can update your operational justification, replace or upload new statutory document files (CAC, Tax Clearance, NPA License), and modify employee bio-data directly. Once updated, resubmit for OIC ID Unit verification.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit & Resubmit Application Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. OIC ID UNIT VERIFICATION PANEL */}
          {(application.status === 'PENDING_ID_UNIT_VERIFICATION' || application.status === 'RETURNED_TO_ID_UNIT') && isIdUnit && (
            <div className="space-y-4">
              {application.status === 'RETURNED_TO_ID_UNIT' ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          Referred Back by General Manager, Security Directorate
                        </h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                          GM Security reviewed this application and referred it back to the Port ID Unit with observations. You can return this dossier directly to <strong>{application.companyName}</strong> for document or bio-data corrections, or re-verify and forward back to GM Security.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-400 px-2.5 py-0.5 rounded shrink-0">
                      REFERRED TO ID UNIT
                    </span>
                  </div>

                  {application.correctionNotes && (
                    <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                        GM Security Referral Observations / Deficiencies:
                      </span>
                      <p className="text-xs text-slate-900 font-semibold whitespace-pre-wrap leading-relaxed">
                        {application.correctionNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                  <strong>OIC ID Unit Mandate:</strong> Inspect corporate documents, category licences, and employee bio-data. You may verify and forward to GM Security, request correction, or reject.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {application.status === 'RETURNED_TO_ID_UNIT' 
                    ? 'ID Unit Instructions to Company / Action Remarks:' 
                    : 'ID Unit Verification Notes / Defect Instructions:'}
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    application.status === 'RETURNED_TO_ID_UNIT'
                      ? 'Enter instructions for the company to rectify defects, or remarks for re-forwarding to GM Security...'
                      : 'Enter remarks, authenticated registry notes, or defects if returning for correction...'
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                />
                {application.status === 'RETURNED_TO_ID_UNIT' && (
                  <span className="text-[11px] text-slate-500 block mt-1">
                    If returning to the sponsoring company, these instructions will be dispatched to the applicant via in-portal notification and official email.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {application.status === 'RETURNED_TO_ID_UNIT' ? (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('RETURN_CORRECTION')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return Dossier to Company for Correction
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('APPROVE')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Re-verify & Forward to GM Security
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('REJECT')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Application
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('APPROVE')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Verification & Forward to GM Security
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('RETURN_CORRECTION')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return for Correction
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIdUnitAction('REJECT')}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Application
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. GM SECURITY APPROVAL PANEL */}
          {application.status === 'PENDING_GM_SECURITY_APPROVAL' && isGmSecurity && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-900">
                <strong>GM Security Clearance:</strong> This application has been authenticated by the OIC ID Unit. Review security profile, port access justification, and issue clearance for Oracle EBS billing.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Vetting Comments / Clearances:
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter security clearance assessment..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleGmSecurityAction('APPROVE')}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Grant Security Clearance (Advance to Tariff & Billing)
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleGmSecurityAction('RETURN_TO_ID_UNIT')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Return to ID Unit for Clarification
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleGmSecurityAction('REJECT')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  Reject on Security Grounds
                </button>
              </div>
            </div>
          )}

          {/* 3. TARIFF & BILLING OFFICER MANUAL ORACLE EBS ENTRY PANEL */}
          {application.status === 'PENDING_BILLING' && isBilling && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
                <strong>Tariff & Billing Coordination:</strong> Enter the official Oracle EBS Invoice Reference, Remita Retrieval Reference (RRR), and statutory fee obtained from the existing Oracle financial process.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Oracle EBS Bill Reference *
                  </label>
                  <input
                    type="text"
                    value={oracleBillRef}
                    onChange={(e) => setOracleBillRef(e.target.value)}
                    placeholder="e.g. ORCL-EBS-BILL-2026-09512"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remita RRR Number *
                  </label>
                  <input
                    type="text"
                    value={rrrNumber}
                    onChange={(e) => setRrrNumber(e.target.value)}
                    placeholder="e.g. 3104-9281-7492"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bill Amount (NGN) *
                  </label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Deadline Date
                  </label>
                  <input
                    type="date"
                    value={billingDeadline}
                    onChange={(e) => setBillingDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remark
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Standard statutory gazetted annual port pass charge."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={actionLoading}
                  onClick={handleBillingSubmit}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  <Receipt className="w-4 h-4" />
                  Issue Billing Advice & Notify Company
                </button>
              </div>
            </div>
          )}

          {/* 4. COMPANY EXTERNAL PAYMENT EVIDENCE UPLOAD */}
          {application.status === 'BILL_ISSUED' && isCompany && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-950 space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-orange-900">
                  <CreditCard className="w-4 h-4" />
                  Billing Advice Issued — Settle via Remita
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                  <div>Oracle Ref: <span className="font-bold">{application.bill?.oracleBillReference}</span></div>
                  <div>RRR: <span className="font-bold text-[#087443]">{application.bill?.rrrNumber}</span></div>
                  <div>Amount: <span className="font-bold">NGN {application.bill?.amountNgn.toLocaleString()}</span></div>
                  <div>Deadline: <span className="font-bold">{application.bill?.paymentDeadline}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remita Payment / Bank Receipt Ref *
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. CBN-REMITA-REC-8930192"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid (NGN) *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Receipt Document (PDF or Image) *
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#087443] shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {paymentDocName}
                        </span>
                        {paymentFileSizeBytes > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({(paymentFileSizeBytes / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingFile({
                          fileName: paymentDocName,
                          documentName: 'Payment Evidence Receipt',
                          fileData: paymentFileData || undefined,
                          fileUrl: paymentFileData || undefined,
                          mimeType: paymentDocName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                          referenceNumber: application.referenceNumber,
                          fileSizeBytes: paymentFileSizeBytes || 1024 * 350
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#087443]" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadFile({
                          fileName: paymentDocName,
                          documentName: 'Payment Evidence Receipt',
                          fileData: paymentFileData || undefined,
                          fileUrl: paymentFileData || undefined,
                          mimeType: paymentDocName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                          referenceNumber: application.referenceNumber,
                          fileSizeBytes: paymentFileSizeBytes || 1024 * 350
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{paymentFileData ? 'Change File' : 'Choose Receipt'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPaymentDocName(file.name);
                              setPaymentFileSizeBytes(file.size);
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setPaymentFileData(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={actionLoading}
                  onClick={handlePaymentSubmit}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Submit Payment Evidence for Accounts Verification
                </button>
              </div>
            </div>
          )}

          {/* 5. ACCOUNTS DIVISION PAYMENT VERIFICATION */}
          {application.status === 'PAYMENT_UNDER_REVIEW' && isAccounts && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong className="text-emerald-900 font-extrabold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Accounts Division Mandate: Payment Settlement Verification
                  </strong>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Verify the uploaded payment receipt and Remita Retrieval Reference (RRR) against Central Bank of Nigeria (CBN) Treasury Single Account (TSA) settlement schedules before authorizing biometric capturing.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-md shrink-0 uppercase">
                  STEP 4: TREASURY AUDIT
                </span>
              </div>

              {/* Financial Reconciliation Summary Grid */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Remita RRR</span>
                  <span className="font-bold text-[#087443] text-sm block mt-0.5">
                    {application.bill?.rrrNumber || application.payment?.receiptReference || '2804-9124-7831'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Receipt Reference</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5 truncate">
                    {application.payment?.receiptReference || 'CBN-REMITA-REC-001'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Amount Paid (Remita)</span>
                  <span className="font-bold text-[#087443] text-sm block mt-0.5">
                    NGN {application.payment?.amountPaidNgn.toLocaleString()}
                  </span>
                  {application.bill && application.bill.amountNgn === application.payment?.amountPaidNgn && (
                    <span className="text-[10px] font-sans font-bold text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Exact Match with Bill
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Payment Date</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">
                    {application.payment?.paymentDate || 'Today'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans block truncate">
                    By: {application.payment?.uploadedByName}
                  </span>
                </div>
              </div>

              {/* RELEVANT DOCUMENTS INSPECTION STATION (PREVIEW WITHOUT DOWNLOADING) */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#087443]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Payment Verification Documents Dossier (Instant In-Browser Preview)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                    Click "Preview" to inspect in full resolution without downloading
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Card 1: Remita Payment Receipt */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#087443] text-white flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {application.payment?.receiptFileName || 'Remita_Payment_Receipt.pdf'}
                        </span>
                        <span className="text-[11px] text-emerald-800 font-mono block">
                          Remita TSA Electronic Receipt • {application.payment?.amountPaidNgn ? `NGN ${application.payment.amountPaidNgn.toLocaleString()}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingFile({
                          fileName: application.payment?.receiptFileName || 'Remita_Payment_Receipt.pdf',
                          documentName: 'Remita Payment Treasury Receipt',
                          fileData: application.payment?.receiptFileData,
                          fileUrl: application.payment?.receiptDocumentUrl,
                          mimeType: 'application/pdf',
                          referenceNumber: application.referenceNumber,
                          uploadedAt: application.payment?.createdAt,
                          documentCategory: 'PAYMENT_RECEIPT',
                          paymentDetails: {
                            receiptReference: application.payment?.receiptReference,
                            rrrNumber: application.bill?.rrrNumber || application.payment?.receiptReference,
                            oracleBillReference: application.bill?.oracleBillReference,
                            amountPaidNgn: application.payment?.amountPaidNgn,
                            paymentDate: application.payment?.paymentDate,
                            paymentMethod: application.payment?.paymentMethod || 'Remita TSA Online Gateway',
                            companyName: application.companyName,
                            portName: application.portName,
                            uploadedByName: application.payment?.uploadedByName
                          }
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile({
                          fileName: application.payment?.receiptFileName || 'Remita_Payment_Receipt.pdf',
                          documentName: 'Remita Payment Treasury Receipt',
                          fileData: application.payment?.receiptFileData,
                          fileUrl: application.payment?.receiptDocumentUrl,
                          mimeType: 'application/pdf',
                          referenceNumber: application.referenceNumber,
                          uploadedAt: application.payment?.createdAt
                        })}
                        title="Download Receipt"
                        className="p-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Oracle EBS Billing Advice */}
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          Oracle EBS Billing Advice
                        </span>
                        <span className="text-[11px] text-amber-800 font-mono block truncate">
                          Ref: {application.bill?.oracleBillReference || 'NPA-EBS-BILL'} • RRR: {application.bill?.rrrNumber || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingFile({
                          fileName: `Oracle_Bill_${application.bill?.oracleBillReference || application.referenceNumber}.pdf`,
                          documentName: 'Oracle EBS Billing Assessment Advice',
                          mimeType: 'application/pdf',
                          referenceNumber: application.referenceNumber,
                          documentCategory: 'BILLING_INVOICE',
                          billDetails: {
                            oracleBillReference: application.bill?.oracleBillReference,
                            rrrNumber: application.bill?.rrrNumber,
                            amountNgn: application.bill?.amountNgn,
                            billingDate: application.bill?.billingDate,
                            paymentDeadline: application.bill?.paymentDeadline,
                            companyName: application.companyName,
                            portName: application.portName,
                            numberOfEmployees: application.numberOfEmployees,
                            billingOfficerName: application.bill?.billingOfficerName
                          }
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Bill</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Corporate Supporting Documents Quick Strip */}
                {!isCompany && application.documents.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
                      Attached Corporate Statutory Documents ({application.documents.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {application.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setPreviewingFile({
                            fileName: doc.fileName,
                            documentName: doc.documentName,
                            fileData: doc.fileData,
                            fileUrl: doc.fileUrl,
                            fileSizeBytes: doc.fileSizeBytes,
                            mimeType: doc.mimeType,
                            referenceNumber: application.referenceNumber,
                            uploadedAt: doc.uploadedAt,
                            documentCategory: 'STATUTORY_DOC'
                          })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:border-emerald-300 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{doc.documentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({(doc.fileSizeBytes / 1024).toFixed(0)}KB)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accounts Audit Notes & Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Accounts Audit / Treasury Ledger Verification Notes:
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Click preset to auto-fill
                  </span>
                </div>

                {/* Quick Presets for Treasury Officers */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAccountsNotes(`TSA Remita credit verified against CBN settlement schedule on ${new Date().toLocaleDateString('en-NG')}. Approved for biometric appointment booking.`)}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                  >
                    + Verified with CBN TSA Settlement Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountsNotes(`Remita RRR ${application.bill?.rrrNumber || 'confirmed'} and payment amount match Oracle EBS invoice ref ${application.bill?.oracleBillReference || ''}. Treasury credit confirmed.`)}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                  >
                    + RRR & Amount match Oracle EBS invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountsNotes(`Unverified Remita RRR. Transaction could not be traced on CBN TSA gateway. Please provide official Remita e-receipt with valid RRR.`)}
                    className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                  >
                    + Unverified Remita RRR / Request Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountsNotes(`Amount paid is deficient. Assessed statutory gazetted tariff is NGN ${application.bill?.amountNgn.toLocaleString() || '45,000'}. Settle outstanding balance.`)}
                    className="px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 transition-colors cursor-pointer"
                  >
                    + Deficient / Partial Payment
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={accountsNotes}
                  onChange={(e) => setAccountsNotes(e.target.value)}
                  placeholder="Enter Treasury confirmation details, CBN settlement log reference, or reason for clarification/rejection..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAccountsAction('CONFIRM')}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Payment (Authorize Biometric Scheduling)
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAccountsAction('REQUEST_CLARIFICATION')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Clarification
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAccountsAction('REJECT')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Payment Evidence
                </button>
              </div>
            </div>
          )}

          {/* PERMANENT VERIFIED PAYMENT & TREASURY SETTLEMENT RECORD (When payment is confirmed) */}
          {application.payment && application.status !== 'PAYMENT_UNDER_REVIEW' && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#087443] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Verified Treasury Payment Record (Remita TSA)
                    </span>
                    <span className="text-[11px] text-emerald-900 font-mono">
                      RRR: {application.bill?.rrrNumber || application.payment.receiptReference} • Receipt: {application.payment.receiptReference}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewingFile({
                      fileName: application.payment?.receiptFileName || 'Remita_Payment_Receipt.pdf',
                      documentName: 'Remita Payment Treasury Receipt',
                      fileData: application.payment?.receiptFileData,
                      fileUrl: application.payment?.receiptDocumentUrl,
                      mimeType: 'application/pdf',
                      referenceNumber: application.referenceNumber,
                      uploadedAt: application.payment?.createdAt,
                      documentCategory: 'PAYMENT_RECEIPT',
                      paymentDetails: {
                        receiptReference: application.payment?.receiptReference,
                        rrrNumber: application.bill?.rrrNumber || application.payment?.receiptReference,
                        oracleBillReference: application.bill?.oracleBillReference,
                        amountPaidNgn: application.payment?.amountPaidNgn,
                        paymentDate: application.payment?.paymentDate,
                        paymentMethod: application.payment?.paymentMethod || 'Remita TSA Online Gateway',
                        companyName: application.companyName,
                        portName: application.portName,
                        uploadedByName: application.payment?.uploadedByName,
                        verifiedBy: application.payment?.verifiedByOfficerName
                      }
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-2xs text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Preview Receipt</span>
                  </button>

                  {application.bill && (
                    <button
                      type="button"
                      onClick={() => setPreviewingFile({
                        fileName: `Oracle_Bill_${application.bill?.oracleBillReference}.pdf`,
                        documentName: 'Oracle EBS Billing Assessment Advice',
                        mimeType: 'application/pdf',
                        referenceNumber: application.referenceNumber,
                        documentCategory: 'BILLING_INVOICE',
                        billDetails: {
                          oracleBillReference: application.bill?.oracleBillReference,
                          rrrNumber: application.bill?.rrrNumber,
                          amountNgn: application.bill?.amountNgn,
                          billingDate: application.bill?.billingDate,
                          paymentDeadline: application.bill?.paymentDeadline,
                          companyName: application.companyName,
                          portName: application.portName,
                          numberOfEmployees: application.numberOfEmployees,
                          billingOfficerName: application.bill?.billingOfficerName
                        }
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-300 transition-colors cursor-pointer shadow-2xs text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-700" />
                      <span>Preview Bill</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-700">
                <div>Amount Paid: <strong className="text-[#087443]">NGN {application.payment.amountPaidNgn.toLocaleString()}</strong></div>
                <div>Date Settled: <strong>{application.payment.paymentDate}</strong></div>
                <div>Status: <strong className="text-emerald-700">{application.payment.verificationStatus || 'CONFIRMED'}</strong></div>
                <div>Verified By: <strong>{application.payment.verifiedByOfficerName || 'Accounts Officer'}</strong></div>
              </div>
              {application.payment.verificationNotes && (
                <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-emerald-200 font-mono">
                  Verification Note: "{application.payment.verificationNotes}"
                </p>
              )}
            </div>
          )}

          {/* 6. BIOMETRIC CAPTURING SCHEDULING (Company or ID Unit) */}
          {(application.status === 'READY_FOR_SCHEDULING' || application.status === 'CAPTURING_SCHEDULED') && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded text-xs text-teal-950">
                <strong>Biometric Appointment Booking:</strong> Select an approved capturing slot published by the OIC ID Unit for {application.portName}. System strictly prevents capacity overbooking.
              </div>

              {application.capturingAppointment ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-[#087443] block text-sm">
                    Appointment Scheduled: {application.capturingAppointment.scheduledForDate} ({application.capturingAppointment.scheduledTimeSlot})
                  </span>
                  <p className="text-slate-600">Venue: {application.capturingAppointment.venue}</p>
                  <p className="text-slate-600">Registered Persons: {application.capturingAppointment.numberOfPersons}</p>
                </div>
              ) : null}

              {(isCompany || isIdUnit) && !application.capturingAppointment?.rescheduledAt && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Available Capturing Slot:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map(s => {
                      const isFull = s.bookedCount >= s.capacity;
                      const isSelected = selectedSlotId === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => !isFull && !s.isBlocked && setSelectedSlotId(s.id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#087443] bg-emerald-50 ring-1 ring-[#087443]'
                              : isFull || s.isBlocked
                              ? 'opacity-50 bg-slate-100 cursor-not-allowed border-slate-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-slate-900">{s.slotDate}</div>
                          <div className="font-mono text-slate-600">{s.startTime} - {s.endTime}</div>
                          <div className="mt-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Remaining:</span>
                            <span className="font-bold text-[#087443]">{s.capacity - s.bookedCount} / {s.capacity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    disabled={actionLoading || !selectedSlotId}
                    onClick={handleBookAppointment}
                    className="mt-2 flex items-center gap-1.5 px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Confirm Appointment Slot
                  </button>
                </div>
              )}
              {application.capturingAppointment?.rescheduledAt && (
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-xs text-amber-950" role="status">
                  <strong>Appointment locked:</strong> The OIC has rescheduled this appointment. The displayed date and time are final, and alternative slots or further rescheduling are disabled.
                </div>
              )}
            </div>
          )}

          {/* 7. ID UNIT CAPTURING COMPLETION RECORDING */}
          {application.status === 'CAPTURING_SCHEDULED' && isIdUnit && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-950">
                <strong>Biometric Workstation Record:</strong> The applicants attend capturing on the independent NPA biometric hardware machine. Record attendance outcome here to advance workflow.
              </div>

              <div className="space-y-2">
                {application.employees.map(emp => (
                  <div key={emp.id} className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-500">{emp.position} • {emp.idReference}</div>
                    </div>

                    <select
                      value={capturingStatuses[emp.id] || 'CAPTURED'}
                      onChange={(e) => setCapturingStatuses(prev => ({ ...prev, [emp.id]: e.target.value as any }))}
                      className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="CAPTURED">CAPTURED (Completed)</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="RESCHEDULED">RESCHEDULED</option>
                      <option value="CAPTURING_UNSUCCESSFUL">CAPTURING UNSUCCESSFUL</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                disabled={actionLoading}
                onClick={handleRecordCapturing}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Record Biometric Capturing Completion
              </button>
            </div>
          )}

          {/* 8. ID UNIT MARK PASS READY */}
          {application.status === 'AWAITING_PASS_PRODUCTION' && isIdUnit && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-950">
                <strong>Pass Production:</strong> The cards are printed on the physical badge machine. Once printed, click below to generate secure system serial numbers and alert the company for collection.
              </div>

              <button
                disabled={actionLoading}
                onClick={handleMarkPassReady}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Port Passes Ready for Collection
              </button>
            </div>
          )}

          {/* 9. PASS READY FOR COLLECTION & COLLECTION SIGN-OFF */}
          {application.status === 'PASS_READY_FOR_COLLECTION' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                <span className="font-bold text-sm text-[#087443] block">
                  Port Passes Ready at {application.portName} ID Unit Counter!
                </span>
                <p className="text-slate-600 mt-1">
                  Company representatives must present valid company ID and authorized letter of collection.
                </p>
              </div>

              {application.passes && application.passes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Generated Pass Serials
                  </h3>
                  <div className="divide-y divide-slate-200 border rounded-lg overflow-hidden">
                    {application.passes.map(pass => (
                      <div key={pass.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#087443] text-sm block">
                            {pass.serialNumber}
                          </span>
                          <span className="text-slate-700 font-semibold">{pass.employeeName}</span>
                          <span className="text-slate-400 block text-[11px]">Valid Until: {pass.validUntil}</span>
                        </div>

                        {pass.status === 'COLLECTED' ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                            Collected by {pass.collectionInfo?.collectedByName}
                          </span>
                        ) : isIdUnit ? (
                          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 block">Record Collection:</span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <input
                                type="text"
                                placeholder="Collector Name"
                                value={collectorName}
                                onChange={(e) => setCollectorName(e.target.value)}
                                className="px-2 py-1 bg-white border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Collector ID Ref"
                                value={collectorIdRef}
                                onChange={(e) => setCollectorIdRef(e.target.value)}
                                className="px-2 py-1 bg-white border rounded"
                              />
                            </div>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleRecordCollection(pass.id)}
                              className="w-full px-3 py-1 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded"
                            >
                              Confirm Collection Sign-Off
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            Awaiting physical pickup at counter
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10. COMPLETED / COLLECTED STATE */}
          {application.status === 'COLLECTED' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 space-y-1">
              <span className="font-bold text-[#087443] text-sm block flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-[#087443]" />
                Application Cycle Fully Completed
              </span>
              <p>All port passes have been collected and activated within the port gate perimeter access system.</p>
            </div>
          )}
        </div>
      </div>

      {/* CORE DOSSIER TABS: Personnel Schedule, Documents, Workflow Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personnel & Documents (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personnel Schedule */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#087443]" />
              Sponsored Personnel Schedule ({application.employees.length})
            </h2>

            <div className="space-y-3">
              {application.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {!isCompany && (
                      <img
                        src={emp.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={emp.fullName}
                        className="w-12 h-14 object-cover rounded bg-slate-200 shrink-0 border border-slate-300 shadow-2xs"
                      />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{emp.fullName}</span>
                        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          {emp.capturingStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium">{emp.position}</p>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span>{emp.idType}: <strong className="font-mono text-slate-800">{emp.idReference}</strong></span>
                        <span>•</span>
                        <span>Phone: {emp.phone}</span>
                      </div>
                      {emp.passNumber && (
                        <div className="mt-1 font-mono font-bold text-[#087443] text-xs">
                          Pass Serial: {emp.passNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCompany && <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewingFile({
                        fileName: `${emp.fullName.replace(/\s+/g, '_')}_passport.jpg`,
                        documentName: `Passport Photo - ${emp.fullName}`,
                        fileUrl: emp.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                        mimeType: 'image/jpeg',
                        holderName: emp.fullName,
                        referenceNumber: application.referenceNumber
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087443]" />
                      <span>Preview Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile({
                        fileName: `${emp.fullName.replace(/\s+/g, '_')}_passport.jpg`,
                        documentName: `Passport Photo - ${emp.fullName}`,
                        fileUrl: emp.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                        mimeType: 'image/jpeg',
                        holderName: emp.fullName,
                        referenceNumber: application.referenceNumber
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>}
                </div>
              ))}
            </div>
          </div>

          {/* Non-payment category documents remain available to authorised staff, not the company account view. */}
          {!isCompany && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#087443]" />
                Uploaded Category Documents ({application.documents.length})
              </h2>
              {application.documents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    application.documents.forEach((doc, idx) => {
                      setTimeout(() => {
                        downloadFile({
                          fileName: doc.fileName,
                          documentName: doc.documentName,
                          fileData: doc.fileData,
                          fileUrl: doc.fileUrl,
                          fileSizeBytes: doc.fileSizeBytes,
                          mimeType: doc.mimeType,
                          referenceNumber: application.referenceNumber,
                          uploadedAt: doc.uploadedAt
                        });
                      }, idx * 250);
                    });
                  }}
                  className="text-xs font-bold text-[#087443] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download All ({application.documents.length})
                </button>
              )}
            </div>

            {application.documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No corporate documents attached.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">{doc.documentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {doc.fileName} • {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingFile({
                          fileName: doc.fileName,
                          documentName: doc.documentName,
                          fileData: doc.fileData,
                          fileUrl: doc.fileUrl,
                          fileSizeBytes: doc.fileSizeBytes,
                          mimeType: doc.mimeType,
                          referenceNumber: application.referenceNumber,
                          uploadedAt: doc.uploadedAt
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#087443]" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile({
                          fileName: doc.fileName,
                          documentName: doc.documentName,
                          fileData: doc.fileData,
                          fileUrl: doc.fileUrl,
                          fileSizeBytes: doc.fileSizeBytes,
                          mimeType: doc.mimeType,
                          referenceNumber: application.referenceNumber,
                          uploadedAt: doc.uploadedAt
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right Column: Immutable Audit & Workflow Timeline */}
        <div className="space-y-6">
          {/* Statutory Conditions Acceptance Badge */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-[#087443]" />
              Conditions of Issue Sign-off
            </h3>
            {application.conditionsAcceptance ? (
              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <p>Signatory: <strong className="text-slate-900">{application.conditionsAcceptance.signatureName}</strong></p>
                <p>IP Address: <span className="font-mono text-slate-900">{application.conditionsAcceptance.ipAddress}</span></p>
                <p>Version: <span className="font-mono text-[#087443]">Revised March 2018</span></p>
                <p>Timestamp: <span className="text-slate-900 font-mono">{new Date(application.conditionsAcceptance.acceptedAt).toLocaleString('en-NG')}</span></p>
              </div>
            ) : (
              <p className="text-amber-700">Not signed</p>
            )}
          </div>

          {/* Workflow History Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#087443]" />
              Audit Workflow Timeline
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200 pl-6">
              {workflowLogs.map((log) => (
                <div key={log.id} className="relative text-xs space-y-1">
                  <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-[#087443] border-2 border-white shadow-2xs" />
                  <div className="font-bold text-slate-900">
                    {log.newStatus.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isCompany
                      ? (log.responsibleRole ? log.responsibleRole.replace(/_/g, ' ') : 'NPA Directorate Official')
                      : `${log.responsibleUserName} (${log.responsibleRole})`}
                  </div>
                  {log.remarks && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      &quot;{isCompany && (log.responsibleRole === 'GM_SECURITY' || log.responsibleRole === 'OIC_ID_UNIT') && log.newStatus !== 'RETURNED_FOR_CORRECTION' && log.newStatus !== 'REJECTED'
                        ? 'Statutory vetting clearance recorded in compliance with NPA port regulations.'
                        : log.remarks}&quot;
                    </p>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString('en-NG')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Slip Modal */}
      {showSlip && (
        <PrintableAcknowledgement
          application={application}
          onClose={() => setShowSlip(false)}
        />
      )}

      {/* Edit & Resubmit Returned Application Modal */}
      {isEditModalOpen && application && (
        <EditAndResubmitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          application={application}
          onResubmitted={async (updatedApp) => {
            setApplication(updatedApp);
            setIsEditModalOpen(false);
            setFeedbackMessage({
              type: 'success',
              text: `Application ${updatedApp.referenceNumber} corrected and successfully resubmitted to OIC ID Unit for verification!`
            });
            await loadData();
            if (onRefreshList) onRefreshList();
          }}
        />
      )}

      {/* Universal File Preview & Download Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewingFile)}
        onClose={() => setPreviewingFile(null)}
        file={previewingFile}
      />
    </div>
  );
};
