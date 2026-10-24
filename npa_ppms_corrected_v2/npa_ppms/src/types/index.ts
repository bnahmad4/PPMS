export type UserType = 'INTERNAL' | 'EXTERNAL';

export type RoleCode = 
  | 'COMPANY_ADMIN'
  | 'COMPANY_STAFF'
  | 'OIC_ID_UNIT'
  | 'GM_SECURITY'
  | 'TARIFF_BILLING'
  | 'ACCOUNTS_OFFICER'
  | 'PORT_ADMIN'
  | 'HQ_SUPERVISOR'
  | 'SYSTEM_ADMIN'
  | 'AUDITOR';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_ID_UNIT_VERIFICATION'
  | 'RETURNED_FOR_CORRECTION'
  | 'ID_UNIT_VERIFIED'
  | 'PENDING_GM_SECURITY_APPROVAL'
  | 'RETURNED_TO_ID_UNIT'
  | 'GM_SECURITY_APPROVED'
  | 'REJECTED'
  | 'PENDING_BILLING'
  | 'BILL_ISSUED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_EVIDENCE_SUBMITTED'
  | 'PAYMENT_UNDER_REVIEW'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'READY_FOR_SCHEDULING'
  | 'CAPTURING_SCHEDULED'
  | 'CAPTURING_COMPLETED'
  | 'AWAITING_PASS_PRODUCTION'
  | 'PASS_READY_FOR_COLLECTION'
  | 'COLLECTED'
  | 'CLOSED'
  | 'CANCELLED';

export interface Port {
  id: string;
  code: string;
  name: string;
  state: string;
  address: string;
  capturingLocation: string;
  contactEmail: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  password?: string;
  userType: UserType;
  roles: RoleCode[];
  companyId?: string;
  assignedPortId?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  companyName: string;
  cacNumber: string;
  tinNumber?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  mdCeoName: string;
  mdCeoPhone: string;
  authRepName: string;
  authRepEmail: string;
  authRepPhone: string;
  primaryPortId: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  createdAt: string;
  cacCertificate?: {
    fileName: string;
    fileData?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    uploadedAt?: string;
  };
  taxClearanceCertificate?: {
    fileName: string;
    fileData?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    uploadedAt?: string;
  };
}

export interface CategoryRequirement {
  id: string;
  categoryId: string;
  documentName: string;
  code: string;
  isMandatory: boolean;
  maxSizeMb: number;
  allowedFormats: string;
}

export interface CustomerCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultValidityMonths: number;
  baseFeeNgn: number;
  isActive: boolean;
  requirements: CategoryRequirement[];
}

export interface PassType {
  id: string;
  code: string;
  name: string;
  categoryPrefix: string;
  maxValidityDays: number;
}

export interface ApplicationEmployee {
  id: string;
  applicationId: string;
  fullName: string;
  position: string;
  phone: string;
  email?: string;
  idType: 'NIN' | 'INTERNATIONAL_PASSPORT' | 'DRIVERS_LICENCE' | 'VOTERS_CARD';
  idReference: string;
  passportPhotoUrl?: string;
  idDocumentUrl?: string;
  capturingStatus: 'PENDING' | 'CAPTURED' | 'ABSENT' | 'RESCHEDULED' | 'CAPTURING_UNSUCCESSFUL' | 'AWAITING_PASS_PRODUCTION';
  passNumber?: string;
  status: 'ACTIVE' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  requirementCode: string;
  documentName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileData?: string;
  fileUrl?: string;
  uploadedAt: string;
  verified: boolean;
}

export interface ConditionsAcceptance {
  id: string;
  applicationId: string;
  userId: string;
  versionCode: string;
  signatureName: string;
  signatureData: string;
  ipAddress: string;
  scrolledToBottom: boolean;
  acceptedAt: string;
}

export interface WorkflowLog {
  id: string;
  applicationId: string;
  previousStatus: WorkflowStatus | null;
  newStatus: WorkflowStatus;
  responsibleUserId: string;
  responsibleUserName: string;
  responsibleRole: RoleCode;
  remarks: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  applicationId: string;
  oracleBillReference: string;
  rrrNumber: string;
  amountNgn: number;
  billingDate: string;
  paymentDeadline: string;
  billingOfficerId: string;
  billingOfficerName: string;
  remarks?: string;
  createdAt: string;
  supportingDocuments?: ApplicationDocument[];
  documentUrl?: string;
  documentName?: string;
  documentData?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface Payment {
  id: string;
  applicationId: string;
  billId: string;
  receiptReference: string;
  amountPaidNgn: number;
  paymentDate: string;
  paymentMethod: string;
  receiptDocumentUrl: string;
  receiptFileName: string;
  receiptFileData?: string;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
  verificationStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CLARIFICATION_REQUIRED';
  verificationNotes?: string;
  verifiedByOfficerId?: string;
  verifiedByOfficerName?: string;
  verifiedAt?: string;
  supportingDocuments?: ApplicationDocument[];
  verificationDocumentUrl?: string;
  verificationDocumentName?: string;
  verificationFileData?: string;
  verificationFileSizeBytes?: number;
  verificationMimeType?: string;
}

export interface CapturingSlot {
  id: string;
  portId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  locationVenue: string;
  isBlocked: boolean;
}

export interface CapturingAppointment {
  id: string;
  applicationId: string;
  slotId: string;
  companyId: string;
  companyName?: string;
  applicationReference?: string;
  portId: string;
  portName?: string;
  scheduledForDate: string;
  scheduledTimeSlot: string;
  venue: string;
  numberOfPersons: number;
  status: 'SCHEDULED' | 'ATTENDED' | 'RESCHEDULED' | 'CANCELLED';
  bookedByUserId: string;
  bookedByUserName?: string;
  createdAt: string;
  rescheduledAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface PassRecord {
  id: string;
  serialNumber: string;
  applicationId: string;
  applicationReference: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  portId: string;
  portName: string;
  passTypeCode: string;
  validFrom: string;
  validUntil: string;
  status: 'AWAITING_COLLECTION' | 'COLLECTED' | 'EXPIRED' | 'REVOKED';
  qrToken: string;
  issuedAt: string;
  collectionInfo?: {
    collectedByName: string;
    collectorIdType: string;
    collectorIdReference: string;
    collectorPhone: string;
    issuingOfficerName: string;
    collectedAt: string;
    notes?: string;
  };
}

export interface Application {
  id: string;
  referenceNumber: string;
  companyId: string;
  companyName: string;
  portId: string;
  portName: string;
  categoryId: string;
  categoryName: string;
  passTypeId: string;
  passTypeName: string;
  status: WorkflowStatus;
  validityPeriodMonths: number;
  numberOfEmployees: number;
  justification: string;
  conditionsAccepted: boolean;
  conditionsAcceptance?: ConditionsAcceptance;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  employees: ApplicationEmployee[];
  documents: ApplicationDocument[];
  bill?: Bill;
  payment?: Payment;
  capturingAppointment?: CapturingAppointment;
  passes?: PassRecord[];
  correctionNotes?: string;
  resubmissionNotes?: string;
  rejectionReason?: string;
}

export interface SmtpSettings {
  id: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted: string;
  encryptionType: 'STARTTLS' | 'TLS' | 'NONE';
  senderEmail: string;
  senderName: string;
  replyToEmail?: string;
  timeoutMs: number;
  maxRetries: number;
  isEnabled: boolean;
  updatedAt: string;
}

export interface EmailNotificationLog {
  id: string;
  recipientEmail: string;
  subject: string;
  applicationReference?: string;
  eventCode: string;
  attemptCount: number;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'RETRIED';
  smtpMessageId?: string;
  previewUrl?: string;
  errorMessage?: string;
  dispatchedAt: string;
}

export interface EmailTemplate {
  id: string;
  eventCode: string;
  title: string;
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  isActive: boolean;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  applicationId?: string;
  applicationReference?: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditTrailEntry {
  id: string;
  action: string;
  entityName: string;
  entityId?: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface SystemSettings {
  organizationName: string;
  systemName: string;
  logoUrl: string;
  primaryBrandColor: string;
  auditRetentionDays: number;
  emergencyMode: boolean;
}

// -------------------------------------------------------------
// FLEXIBLE & CUSTOMISABLE REPORTING SYSTEM TYPES
// -------------------------------------------------------------

export type ReportDataset = 
  | 'APPLICATIONS' 
  | 'FINANCIAL_BILLING' 
  | 'PASSES_BIOMETRICS' 
  | 'COMPANIES_AUDIT' 
  | 'SECURITY_CLEARANCE'
  | 'AUDIT_LOGS';

export interface ReportFilterConfig {
  dataset: ReportDataset;
  portId?: string;
  statuses?: string[];
  dateRangePreset?: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'YEAR_TO_DATE' | 'CUSTOM';
  dateField?: 'submittedAt' | 'createdAt' | 'updatedAt' | 'paymentDate';
  startDate?: string;
  endDate?: string;
  paymentStatus?: 'ALL' | 'CONFIRMED' | 'PENDING' | 'UNDER_REVIEW' | 'CLARIFICATION_REQUIRED' | 'REJECTED';
  categoryId?: string;
  searchTerm?: string;
  minEmployees?: number;
  maxEmployees?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface ReportColumnDef {
  id: string;
  label: string;
  category: 'IDENTITY' | 'FINANCE' | 'SECURITY' | 'BIOMETRICS' | 'OPERATIONS';
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'badge' | 'number';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  dataset: ReportDataset;
  selectedColumns: string[];
  filters: ReportFilterConfig;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  isPredefined?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportSummaryStats {
  totalApplications: number;
  totalPassesIssued: number;
  totalRevenueNgn: number;
  totalPendingRevenueNgn: number;
  avgTurnaroundHours: number;
  pendingIdUnit: number;
  pendingGmSecurity: number;
  pendingBilling: number;
  awaitingPayment: number;
  paymentReview: number;
  readyScheduling: number;
  capturingScheduled: number;
  passesReady: number;
  completed: number;
  byPort: Array<{
    portId: string;
    portCode: string;
    portName: string;
    count: number;
    revenueNgn: number;
    passesCount: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    revenueNgn: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    applicationsCount: number;
    revenueNgn: number;
    passesCount: number;
  }>;
}

