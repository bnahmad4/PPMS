import {
  Port,
  CustomerCategory,
  PassType,
  Company,
  Application,
  User,
  WorkflowLog,
  CapturingSlot,
  CapturingAppointment,
  PassRecord,
  SmtpSettings,
  EmailNotificationLog,
  EmailTemplate,
  InAppNotification,
  AuditTrailEntry,
  SystemSettings,
  ReportTemplate,
  ReportSummaryStats
} from '../types';

let currentAuthEmail = (() => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ppms_current_user') : null;
    if (saved) {
      const u = JSON.parse(saved);
      return u.email || '';
    }
  } catch {
    // ignore
  }
  return '';
})();

export const setAuthEmail = (email: string) => {
  currentAuthEmail = email;
};

export const getAuthEmail = () => currentAuthEmail;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Ensure auth email is kept up to date
  let email = currentAuthEmail;
  if (!email && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ppms_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        email = u.email || '';
        currentAuthEmail = email;
      }
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(email ? { 'x-user-email': email } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const url = endpoint.startsWith('/api') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new Error(`Network connection error calling ${endpoint}: ${netErr.message || 'Unable to connect to server'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text().catch(() => '');
  const trimmed = rawText.trim();
  const isHtml = trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype') || contentType.includes('text/html');

  let parsed: any = null;
  if (!isHtml && trimmed) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Body is not valid JSON
    }
  }

  if (isHtml || (trimmed && parsed === null)) {
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} (${response.statusText}). Please verify server status.`);
    }
    throw new Error(`Invalid server response from ${endpoint}: Expected JSON but received HTML document.`);
  }

  if (!response.ok) {
    throw new Error(parsed?.message || `Request failed with HTTP ${response.status} (${response.statusText})`);
  }

  return (parsed ?? {}) as T;
}

export const api = {
  // Auth & Personas
  getPersonas: () => request<{ success: boolean; personas: User[] }>('/auth/personas'),
  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),
  login: (email: string, password?: string) => request<{ success: boolean; user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  forgotPassword: (email: string) =>
    request<{
      success: boolean;
      message: string;
      maskedEmail: string;
      email: string;
      companyName?: string;
      expiresInMinutes?: number;
      previewCode?: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    request<{
      success: boolean;
      message: string;
      user?: User;
    }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Reference data
  getPorts: () => request<{ success: boolean; ports: Port[] }>('/ports'),
  getCategories: () => request<{ success: boolean; categories: CustomerCategory[] }>('/categories'),
  getPassTypes: () => request<{ success: boolean; passTypes: PassType[] }>('/pass-types'),

  // Companies
  getCompanies: () => request<{ success: boolean; companies: Company[] }>('/companies'),
  registerCompany: (data: { company: Partial<Company>; userEmail: string; userPhone: string }) =>
    request<{ success: boolean; company: Company; user: User; message?: string }>('/companies/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCompanyStatus: (id: string, status: string) =>
    request<{ success: boolean; company: Company }>(`/companies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  resendCompanyCredentials: (id: string) =>
    request<{ success: boolean; message: string }>(`/companies/${id}/resend-credentials`, {
      method: 'POST'
    }),

  // Applications
  getApplications: (params?: { portId?: string; status?: string; search?: string; companyId?: string }) => {
    const query = new URLSearchParams();
    if (params?.portId) query.set('portId', params.portId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.companyId) query.set('companyId', params.companyId);
    return request<{ success: boolean; applications: Application[]; total: number }>(`/applications?${query.toString()}`);
  },
  getApplicationById: (id: string) => request<{ success: boolean; application: Application; workflowLogs: WorkflowLog[] }>(`/applications/${id}`),
  trackApplication: (ref: string) => request<{ success: boolean; application: Application; workflowLogs: WorkflowLog[] }>(`/track?ref=${encodeURIComponent(ref)}`),
  createApplication: (payload: any) => request<{ success: boolean; application: Application }>('/applications', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  resubmitApplication: (appId: string, payload: {
    justification?: string;
    employees?: any[];
    documents?: any[];
    resubmissionNotes?: string;
  }) => request<{ success: boolean; application: Application }>(`/applications/${appId}/resubmit`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Workflow Actions
  verifyIdUnit: (appId: string, action: 'APPROVE' | 'REJECT' | 'RETURN_CORRECTION', notes: string) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/id-unit-verify`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    }),

  approveGmSecurity: (appId: string, action: 'APPROVE' | 'REJECT' | 'RETURN_TO_ID_UNIT', notes: string) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/gm-security-approve`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    }),

  recordBilling: (appId: string, billingData: any) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/billing`, {
      method: 'POST',
      body: JSON.stringify(billingData)
    }),

  uploadPayment: (appId: string, paymentData: any) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }),

  verifyPayment: (
    appId: string,
    action: 'CONFIRM' | 'REJECT' | 'REQUEST_CLARIFICATION',
    notes: string,
    verificationDocument?: {
      fileName: string;
      documentName?: string;
      fileData?: string;
      fileSizeBytes?: number;
      mimeType?: string;
    },
    supportingDocuments?: any[]
  ) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ action, notes, verificationDocument, supportingDocuments })
    }),

  // Capturing & Passes
  getCapturingSlots: (portId?: string) =>
    request<{ success: boolean; slots: CapturingSlot[] }>(`/capturing/slots${portId ? `?portId=${portId}` : ''}`),

  createCapturingSlot: (slotData: Partial<CapturingSlot>) =>
    request<{ success: boolean; slot: CapturingSlot }>('/capturing/slots', {
      method: 'POST',
      body: JSON.stringify(slotData)
    }),

  bookCapturingAppointment: (appId: string, slotId: string) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/book-capturing`, {
      method: 'POST',
      body: JSON.stringify({ slotId })
    }),

  recordCapturingOutcomes: (appId: string, outcomes: any[]) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/capturing-outcomes`, {
      method: 'POST',
      body: JSON.stringify({ outcomes })
    }),

  markPassReady: (appId: string) =>
    request<{ success: boolean; application: Application }>(`/applications/${appId}/mark-pass-ready`, {
      method: 'POST'
    }),

  getPasses: (params?: { portId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.portId) query.set('portId', params.portId);
    if (params?.search) query.set('search', params.search);
    return request<{ success: boolean; passes: PassRecord[] }>(`/passes?${query.toString()}`);
  },

  recordPassCollection: (passId: string, collectionData: any) =>
    request<{ success: boolean; pass: PassRecord }>(`/passes/${passId}/collect`, {
      method: 'POST',
      body: JSON.stringify(collectionData)
    }),

  // SMTP & Settings
  getSmtpSettings: () => request<{ success: boolean; settings: SmtpSettings }>('/settings/smtp'),
  updateSmtpSettings: (settings: Partial<SmtpSettings>) =>
    request<{ success: boolean; settings: SmtpSettings }>('/settings/smtp', {
      method: 'POST',
      body: JSON.stringify(settings)
    }),
  testSmtpConnection: (customConfig?: Partial<SmtpSettings>) =>
    request<{ success: boolean; message: string; details?: any }>('/settings/smtp/test-connection', {
      method: 'POST',
      body: JSON.stringify(customConfig || {})
    }),
  sendTestEmail: (recipientEmail: string, note?: string) =>
    request<{ success: boolean; message: string; messageId?: string; previewUrl?: string }>('/settings/smtp/send-test', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail, note })
    }),
  provisionLiveSmtp: () =>
    request<{ success: boolean; settings: SmtpSettings; webInbox: string; message: string }>('/settings/smtp/provision-live', {
      method: 'POST'
    }),

  getEmailLogs: () => request<{ success: boolean; logs: EmailNotificationLog[] }>('/settings/email-logs'),
  getEmailTemplates: () => request<{ success: boolean; templates: EmailTemplate[] }>('/settings/email-templates'),

  // Notifications
  getNotifications: () => request<{ success: boolean; notifications: InAppNotification[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean; notification: InAppNotification }>(`/notifications/${id}/read`, {
    method: 'POST'
  }),

  // Audit
  getAuditLogs: () => request<{ success: boolean; logs: AuditTrailEntry[] }>('/audit-logs'),

  // System & Reports
  getSystemSettings: () => request<{ success: boolean; settings: SystemSettings }>('/settings/system'),
  getReportsSummary: () => request<{ success: boolean; summary: ReportSummaryStats }>('/reports/summary'),
  getReportTemplates: () => request<{ success: boolean; templates: ReportTemplate[] }>('/reports/templates'),
  createReportTemplate: (data: Partial<ReportTemplate>) =>
    request<{ success: boolean; template: ReportTemplate }>('/reports/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateReportTemplate: (id: string, data: Partial<ReportTemplate>) =>
    request<{ success: boolean; template: ReportTemplate }>(`/reports/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteReportTemplate: (id: string) =>
    request<{ success: boolean }>(`/reports/templates/${id}`, {
      method: 'DELETE'
    }),
  sendReportEmail: (data: {
    recipientEmail: string;
    reportTitle: string;
    reportSummary: any;
    notes?: string;
    csvContent?: string;
    csvFilename?: string;
  }) =>
    request<{ success: boolean; message: string; previewUrl?: string }>('/reports/email', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  resetTestData: () => request<{ success: boolean; message: string }>('/system/reset-test-data', {
    method: 'POST'
  })
};

