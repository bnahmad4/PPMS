import fs from 'fs';
import path from 'path';
import {
  Port,
  User,
  Company,
  CustomerCategory,
  PassType,
  Application,
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
  WorkflowStatus,
  RoleCode,
  ReportTemplate,
  ReportFilterConfig,
  ApplicationDocument
} from './types.js';

interface DatabaseState {
  ports: Port[];
  users: User[];
  companies: Company[];
  categories: CustomerCategory[];
  passTypes: PassType[];
  applications: Application[];
  workflowLogs: WorkflowLog[];
  capturingSlots: CapturingSlot[];
  capturingAppointments: CapturingAppointment[];
  passes: PassRecord[];
  smtpSettings: SmtpSettings;
  emailLogs: EmailNotificationLog[];
  emailTemplates: EmailTemplate[];
  notifications: InAppNotification[];
  auditLogs: AuditTrailEntry[];
  systemSettings: SystemSettings;
  reportTemplates?: ReportTemplate[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'ppms-db.json');

// Initial seed ports
const INITIAL_PORTS: Port[] = [
  {
    id: 'port-lpc-1',
    code: 'LPC',
    name: 'Lagos Port Complex (Apapa)',
    state: 'Lagos',
    address: 'Apapa Quays, Marina Road, Apapa, Lagos State',
    capturingLocation: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    contactEmail: 'idunit.lpc@nigerianports.gov.ng',
    isActive: true
  },
  {
    id: 'port-tcipc-2',
    code: 'TCIPC',
    name: 'Tin Can Island Port Complex',
    state: 'Lagos',
    address: 'Tin Can Island Expressway, Apapa, Lagos State',
    capturingLocation: 'ID Unit Administrative Block, TCIPC Main Gate',
    contactEmail: 'idunit.tcipc@nigerianports.gov.ng',
    isActive: true
  },
  {
    id: 'port-rpc-3',
    code: 'RPC',
    name: 'Rivers Port Complex (Port Harcourt)',
    state: 'Rivers',
    address: 'Industry Road, Port Harcourt, Rivers State',
    capturingLocation: 'NPA Rivers Port Pass Office, Port Security Building',
    contactEmail: 'idunit.rpc@nigerianports.gov.ng',
    isActive: true
  },
  {
    id: 'port-opc-4',
    code: 'OPC',
    name: 'Onne Port Complex',
    state: 'Rivers',
    address: 'Federal Lighter Terminal (FLT), Onne, Rivers State',
    capturingLocation: 'NPA Pass & Biometric Unit, FLT Gate, Onne',
    contactEmail: 'idunit.opc@nigerianports.gov.ng',
    isActive: true
  },
  {
    id: 'port-cpc-5',
    code: 'CPC',
    name: 'Calabar Port Complex',
    state: 'Cross River',
    address: 'New Port Complex, Calabar, Cross River State',
    capturingLocation: 'NPA Security Headquarters, Calabar Port',
    contactEmail: 'idunit.cpc@nigerianports.gov.ng',
    isActive: true
  },
  {
    id: 'port-dpc-6',
    code: 'DPC',
    name: 'Delta Ports (Warri / Koko / Burutu)',
    state: 'Delta',
    address: 'New Port, Warri, Delta State',
    capturingLocation: 'ID & Security Station, Delta Port Gate',
    contactEmail: 'idunit.dpc@nigerianports.gov.ng',
    isActive: true
  }
];

// Pass Types
const INITIAL_PASS_TYPES: PassType[] = [
  { id: 'pt-annual', code: 'ANNUAL_PASS', name: 'Annual Port Pass (Full Access)', categoryPrefix: 'ANN', maxValidityDays: 365 },
  { id: 'pt-temp', code: 'TEMPORARY_PASS', name: 'Temporary Port Pass (Max 30 Days)', categoryPrefix: 'TMP', maxValidityDays: 30 },
  { id: 'pt-on-duty', code: 'ON_DUTY_TAG', name: 'NPA On-Duty Security Tag', categoryPrefix: 'ODT', maxValidityDays: 180 },
  { id: 'pt-visitor', code: 'VISITOR_TAG', name: 'Visitors Tag / Day Pass', categoryPrefix: 'VIS', maxValidityDays: 7 },
  { id: 'pt-vehicle', code: 'VEHICLE_STICKER', name: 'Port Vehicle Access Sticker', categoryPrefix: 'VEH', maxValidityDays: 365 }
];

// Customer Categories and Mandatory Document Checklists
const INITIAL_CATEGORIES: CustomerCategory[] = [
  {
    id: 'cat-ff',
    code: 'FREIGHT_FORWARDER',
    name: 'Freight Forwarders / Clearing Agents',
    description: 'Licensed clearing and forwarding firms operating within NPA terminals.',
    defaultValidityMonths: 12,
    baseFeeNgn: 45000,
    isActive: true,
    requirements: [
      { id: 'req-ff-1', categoryId: 'cat-ff', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ff-2', categoryId: 'cat-ff', documentName: 'Valid NPA Clearing & Forwarding Licence', code: 'NPA_LICENCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ff-3', categoryId: 'cat-ff', documentName: 'Valid Nigeria Customs Service Licence', code: 'CUSTOMS_LICENCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ff-4', categoryId: 'cat-ff', documentName: 'Valid FIRS Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ff-5', categoryId: 'cat-ff', documentName: 'Valid CRFFN Registration Certificate', code: 'CRFFN_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-sc',
    code: 'SHIPPING_COMPANY',
    name: 'Shipping Companies & Agencies',
    description: 'Registered maritime shipping lines and liner agents.',
    defaultValidityMonths: 12,
    baseFeeNgn: 65000,
    isActive: true,
    requirements: [
      { id: 'req-sc-1', categoryId: 'cat-sc', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-sc-2', categoryId: 'cat-sc', documentName: 'Valid NPA Certificate of Registration as Shipping Company', code: 'NPA_SHIPPING_REG', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-sc-3', categoryId: 'cat-sc', documentName: 'Valid FIRS Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-cs',
    code: 'CARGO_SURVEYOR',
    name: 'Cargo Surveyors',
    description: 'Appointed cargo tallying and marine inspection firms.',
    defaultValidityMonths: 12,
    baseFeeNgn: 50000,
    isActive: true,
    requirements: [
      { id: 'req-cs-1', categoryId: 'cat-cs', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-cs-2', categoryId: 'cat-cs', documentName: 'Valid NPA Appointment Letter as Cargo Surveyor', code: 'NPA_APPT_LETTER', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-cs-3', categoryId: 'cat-cs', documentName: 'Valid FIRS Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-pcs',
    code: 'PRIVATE_CARGO_SURVEYOR',
    name: 'Private Cargo Surveyors',
    description: 'Independent surveyors hired by consignees.',
    defaultValidityMonths: 12,
    baseFeeNgn: 50000,
    isActive: true,
    requirements: [
      { id: 'req-pcs-1', categoryId: 'cat-pcs', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-pcs-2', categoryId: 'cat-pcs', documentName: 'Introduction Letter to NPA through Shipping Co / Terminal Operator', code: 'INTRO_LETTER', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-pcs-3', categoryId: 'cat-pcs', documentName: 'Letters of Appointment from Two (2) Consignees', code: 'CONSIGNEE_APPTS', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-pcs-4', categoryId: 'cat-pcs', documentName: 'Valid Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-chandler',
    code: 'SHIP_CHANDLER',
    name: 'Ship Chandlers',
    description: 'Vessel supply and provisioning contractors.',
    defaultValidityMonths: 12,
    baseFeeNgn: 40000,
    isActive: true,
    requirements: [
      { id: 'req-ch-1', categoryId: 'cat-chandler', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ch-2', categoryId: 'cat-chandler', documentName: 'Valid Customs Ship Chandler Licence', code: 'CUSTOMS_CHANDLER_LICENCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ch-3', categoryId: 'cat-chandler', documentName: 'Evidence of NPA Registration', code: 'NPA_CHANDLER_REG', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-ch-4', categoryId: 'cat-chandler', documentName: 'Valid Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-contractor',
    code: 'CONTRACTOR_VENDOR',
    name: 'Contractors / Vendors',
    description: 'Third-party engineering, maintenance, and facility service providers.',
    defaultValidityMonths: 12,
    baseFeeNgn: 35000,
    isActive: true,
    requirements: [
      { id: 'req-cv-1', categoryId: 'cat-contractor', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-cv-2', categoryId: 'cat-contractor', documentName: 'Letter of Introduction from NPA Facilities / Engineering Division', code: 'FACILITIES_INTRO', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-cv-3', categoryId: 'cat-contractor', documentName: 'Valid Letter of Contract Award', code: 'AWARD_LETTER', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-cv-4', categoryId: 'cat-contractor', documentName: 'Valid Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-tol',
    code: 'LEASE_CONTRACTOR_TOL',
    name: 'Lease Contractors / TOL',
    description: 'Terminal operators lease and concessionaires.',
    defaultValidityMonths: 12,
    baseFeeNgn: 60000,
    isActive: true,
    requirements: [
      { id: 'req-tol-1', categoryId: 'cat-tol', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-tol-2', categoryId: 'cat-tol', documentName: 'Lease Agreement, Renewal, or Extension Document', code: 'LEASE_AGREEMENT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-tol-3', categoryId: 'cat-tol', documentName: 'NPA Payment Receipt for Lease', code: 'LEASE_RECEIPT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-tol-4', categoryId: 'cat-tol', documentName: 'Valid Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-stevedoring',
    code: 'STEVEDORING_CONTRACTOR',
    name: 'Stevedoring Contractors',
    description: 'Dock labour, cargo handling, and stevedoring firms.',
    defaultValidityMonths: 12,
    baseFeeNgn: 55000,
    isActive: true,
    requirements: [
      { id: 'req-st-1', categoryId: 'cat-stevedoring', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-st-2', categoryId: 'cat-stevedoring', documentName: 'Stevedoring Contract Agreement with NPA', code: 'STEVEDORE_CONTRACT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-st-3', categoryId: 'cat-stevedoring', documentName: 'Official Payment Receipt or Debit Note', code: 'PAYMENT_RECEIPT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-st-4', categoryId: 'cat-stevedoring', documentName: 'Valid Tax Clearance Certificate', code: 'TAX_CLEARANCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-terminal',
    code: 'TERMINAL_OPERATOR',
    name: 'Terminal Operators',
    description: 'Concessioned container, bulk, and RoRo port terminals.',
    defaultValidityMonths: 12,
    baseFeeNgn: 75000,
    isActive: true,
    requirements: [
      { id: 'req-to-1', categoryId: 'cat-terminal', documentName: 'Certificate of Incorporation', code: 'CAC_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-to-2', categoryId: 'cat-terminal', documentName: 'Official Staff List Signed by Head of HR', code: 'STAFF_LIST', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-to-3', categoryId: 'cat-terminal', documentName: 'Company Office Staff ID Cards (Front and Back)', code: 'STAFF_IDS', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  },
  {
    id: 'cat-vehicle',
    code: 'VEHICLE_STICKERS',
    name: 'Vehicle Stickers',
    description: 'Commercial and operational trucks, trailers, and staff cars entering port gates.',
    defaultValidityMonths: 12,
    baseFeeNgn: 30000,
    isActive: true,
    requirements: [
      { id: 'req-vs-1', categoryId: 'cat-vehicle', documentName: 'Valid Vehicle Licence', code: 'VEHICLE_LICENCE', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-vs-2', categoryId: 'cat-vehicle', documentName: 'Valid Motor Insurance Certificate', code: 'INSURANCE_CERT', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' },
      { id: 'req-vs-3', categoryId: 'cat-vehicle', documentName: 'Valid Roadworthiness Certificate (VIS)', code: 'ROADWORTHINESS', isMandatory: true, maxSizeMb: 5, allowedFormats: 'PDF,JPG,PNG' }
    ]
  }
];

// Seed Companies
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-dangote',
    companyName: 'Dangote Ports Logistics Ltd',
    cacNumber: 'RC-1849204',
    tinNumber: '21094820-0001',
    email: 'admin@dangotelogistics.ng',
    phone: '+234 1 271 2288',
    website: 'https://dangotelogistics.ng',
    address: '1 Alfred Rewane Road, Ikoyi / LPC Apapa Terminal Gate 3, Lagos',
    mdCeoName: 'Alhaji Aliko Dangote, GCON',
    mdCeoPhone: '+234 803 000 1122',
    authRepName: 'Mallam Kabiru Sani',
    authRepEmail: 'k.sani@dangotelogistics.ng',
    authRepPhone: '+234 802 334 4556',
    primaryPortId: 'port-lpc-1',
    status: 'ACTIVE',
    createdAt: '2026-01-10T09:00:00Z'
  },
  {
    id: 'comp-bua',
    companyName: 'BUA Maritime & Ports Services',
    cacNumber: 'RC-8492019',
    tinNumber: '32091840-0001',
    email: 'portops@buagroup.com',
    phone: '+234 1 461 0669',
    website: 'https://buagroup.com',
    address: 'BUA Towers, Victoria Island, Lagos / Rivers Port Wharf Road, Port Harcourt',
    mdCeoName: 'Abdul Samad Rabiu, CFR',
    mdCeoPhone: '+234 803 999 8877',
    authRepName: 'Chief Emeka Okafor',
    authRepEmail: 'e.okafor@buagroup.com',
    authRepPhone: '+234 803 445 6677',
    primaryPortId: 'port-rpc-3',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'comp-atlantic',
    companyName: 'Atlantic Marine Surveyors & Chandlers Ltd',
    cacNumber: 'RC-3920192',
    tinNumber: '19203849-0001',
    email: 'ops@atlanticmarinenigeria.com',
    phone: '+234 802 233 4455',
    website: 'https://atlanticmarinenigeria.com',
    address: '42 Commercial Avenue, Apapa, Lagos',
    mdCeoName: 'Capt. David Babatunde',
    mdCeoPhone: '+234 803 234 5678',
    authRepName: 'Aisha Ibrahim',
    authRepEmail: 'aisha@atlanticmarinenigeria.com',
    authRepPhone: '+234 809 112 3344',
    primaryPortId: 'port-lpc-1',
    status: 'ACTIVE',
    createdAt: '2026-02-15T11:00:00Z'
  }
];

// Seed RBAC Users (All Personas with Passwords)
const INITIAL_USERS: User[] = [
  {
    id: 'user-company-admin',
    email: 'dangote@portlogistics.ng',
    fullName: 'Mallam Kabiru Sani (Dangote Logistics)',
    phone: '+234 802 334 4556',
    password: 'NpaPass@2026',
    userType: 'EXTERNAL',
    roles: ['COMPANY_ADMIN'],
    companyId: 'comp-dangote',
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-10T09:00:00Z'
  },
  {
    id: 'user-id-unit-lpc',
    email: 'idunit.lagos@nigerianports.gov.ng',
    fullName: 'Capt. Abdullahi Mohammed',
    phone: '+234 803 777 1234',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['OIC_ID_UNIT'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-gm-security',
    email: 'gmsecurity@nigerianports.gov.ng',
    fullName: 'Col. Babatunde Ibrahim (Rtd)',
    phone: '+234 803 888 2345',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['GM_SECURITY'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-billing-lpc',
    email: 'billing.lagos@nigerianports.gov.ng',
    fullName: 'Mrs. Chinyere Okon',
    phone: '+234 803 999 3456',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['TARIFF_BILLING'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-accounts-lpc',
    email: 'accounts.lagos@nigerianports.gov.ng',
    fullName: 'Mr. Dayo Adeleke, FCA',
    phone: '+234 802 111 4567',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['ACCOUNTS_OFFICER'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-port-admin-lpc',
    email: 'portadmin.lpc@nigerianports.gov.ng',
    fullName: 'Engr. Mustapha Bello',
    phone: '+234 803 222 5678',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['PORT_ADMIN'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-hq-supervisor',
    email: 'hq.supervisor@nigerianports.gov.ng',
    fullName: 'Dr. Folake Eze (Headquarters GM Ops)',
    phone: '+234 803 333 6789',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['HQ_SUPERVISOR'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-sysadmin',
    email: 'sysadmin@nigerianports.gov.ng',
    fullName: 'Engr. Emeka Nnamdi (PPMS Lead Architect)',
    phone: '+234 803 444 7890',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['SYSTEM_ADMIN'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'user-auditor',
    email: 'audit@nigerianports.gov.ng',
    fullName: 'Internal Audit & Compliance Division',
    phone: '+234 803 555 8901',
    password: 'NpaPass@2026',
    userType: 'INTERNAL',
    roles: ['AUDITOR'],
    assignedPortId: 'port-lpc-1',
    isActive: true,
    mfaEnabled: true,
    createdAt: '2026-01-05T08:00:00Z'
  }
];

// Initial SMTP Settings (Defaults to Google Workspace / Gmail or On-Premise)
const INITIAL_SMTP: SmtpSettings = {
  id: 'smtp-default',
  host: 'smtp.gmail.com',
  port: 587,
  username: '',
  passwordEncrypted: '',
  encryptionType: 'STARTTLS',
  senderEmail: 'ppms-notifications@nigerianports.gov.ng',
  senderName: 'NPA Digital Port Pass Management System',
  replyToEmail: 'support-ppms@nigerianports.gov.ng',
  timeoutMs: 12000,
  maxRetries: 3,
  isEnabled: true,
  updatedAt: new Date().toISOString()
};

// Initial Email Templates
const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-sub',
    eventCode: 'APPLICATION_SUBMITTED',
    title: 'Port Pass Application Submission Confirmation',
    subject: 'NPA PPMS: Application Submitted — Ref: {{reference}}',
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #087443; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">NIGERIAN PORTS AUTHORITY</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Digital Port Pass Management System (PPMS)</p>
      </div>
      <div style="padding: 24px; background: #FFFFFF; color: #172B3A;">
        <h2 style="font-size: 17px; color: #087443;">Application Acknowledged</h2>
        <p>Dear <strong>{{company_name}}</strong>,</p>
        <p>Your application for Nigerian Ports Authority Port Passes has been successfully submitted and forwarded to the <strong>OIC ID Unit, {{port_name}}</strong> for preliminary document verification.</p>
        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Application Reference:</strong> <span style="color: #087443; font-weight: bold;">{{reference}}</span></p>
          <p style="margin: 4px 0;"><strong>Port Location:</strong> {{port_name}}</p>
          <p style="margin: 4px 0;"><strong>Category:</strong> {{category_name}}</p>
          <p style="margin: 4px 0;"><strong>Number of Personnel:</strong> {{num_employees}}</p>
          <p style="margin: 4px 0;"><strong>Submission Date:</strong> {{timestamp}}</p>
        </div>
        <p style="font-size: 14px; color: #475569;">You will receive real-time notifications as your application progresses through the mandatory security and billing verification stages.</p>
      </div>
      <div style="background-color: #F1F5F9; padding: 16px; text-align: center; font-size: 11px; color: #64748B;">
        Nigerian Ports Authority Headquarters, 26/28 Marina, Lagos, Nigeria.<br>
        Confidential Notice: This official notification was generated automatically by NPA PPMS.
      </div>
    </div>`,
    plainTextBody: 'Application {{reference}} has been submitted to NPA ID Unit for {{port_name}}.',
    isActive: true
  },
  {
    id: 'tpl-id-verified',
    eventCode: 'ID_UNIT_VERIFIED',
    title: 'ID Unit Verification Completed',
    subject: 'NPA PPMS: ID Unit Verified — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: ID Unit Verification Approved</h2></div><div style="padding: 20px;"><p>Application {{reference}} has passed OIC ID Unit verification and forwarded to GM Security for formal clearance.</p></div>`,
    plainTextBody: 'Application {{reference}} verified by OIC ID Unit and forwarded to GM Security.',
    isActive: true
  },
  {
    id: 'tpl-id-returned',
    eventCode: 'ID_UNIT_RETURNED',
    title: 'Application Returned for Correction',
    subject: 'ACTION REQUIRED: Application Returned for Correction — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #D97706; padding: 20px; color: white;"><h2>NPA PPMS: Application Returned for Correction</h2></div><div style="padding: 20px;"><p>Your Port Pass Application <strong>{{reference}}</strong> has been reviewed by the OIC ID Unit and returned for correction.</p><p><strong>Officer Notes / Instructions:</strong> {{notes}}</p><p>Please log in to your PPMS account, edit the requested documents or personnel bio-data, and resubmit your dossier.</p></div>`,
    plainTextBody: 'Application {{reference}} was returned by OIC ID Unit for correction: {{notes}}. Please log in to edit and resubmit.',
    isActive: true
  },
  {
    id: 'tpl-app-resubmitted',
    eventCode: 'APPLICATION_RESUBMITTED',
    title: 'Application Resubmitted After Correction',
    subject: 'NPA PPMS: Application Resubmitted for Verification — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Application Resubmitted</h2></div><div style="padding: 20px;"><p>Application <strong>{{reference}}</strong> has been corrected and resubmitted by the applicant for OIC ID Unit verification.</p></div>`,
    plainTextBody: 'Application {{reference}} has been resubmitted for OIC ID Unit verification.',
    isActive: true
  },
  {
    id: 'tpl-gm-approved',
    eventCode: 'GM_SECURITY_APPROVED',
    title: 'GM Security Approval Granted',
    subject: 'NPA PPMS: Security Clearance Approved — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Security Clearance Granted</h2></div><div style="padding: 20px;"><p>GM Security has formally approved Port Pass Application {{reference}}. The file is forwarded to Tariff & Billing for Oracle invoice coordination.</p></div>`,
    plainTextBody: 'Security Clearance approved for Application {{reference}} by GM Security.',
    isActive: true
  },
  {
    id: 'tpl-bill-issued',
    eventCode: 'BILL_ISSUED',
    title: 'Billing Information Recorded',
    subject: 'NPA PPMS: Billing Advice Issued — Ref: {{reference}} (RRR: {{rrr}})',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Billing Advice & Remita Reference</h2></div><div style="padding: 20px;"><p>Oracle EBS Reference: <strong>{{oracle_ref}}</strong><br>RRR: <strong>{{rrr}}</strong><br>Total Amount: <strong>NGN {{amount}}</strong><br>Payment Deadline: {{deadline}}</p><p>Please settle via Remita / approved bank channel and upload your receipt in PPMS.</p></div>`,
    plainTextBody: 'Bill of NGN {{amount}} (RRR: {{rrr}}) issued for Application {{reference}}.',
    isActive: true
  },
  {
    id: 'tpl-payment-confirmed',
    eventCode: 'PAYMENT_CONFIRMED',
    title: 'Payment Confirmed by Accounts',
    subject: 'NPA PPMS: Payment Confirmed — Ready for Biometric Scheduling (Ref: {{reference}})',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Payment Confirmed</h2></div><div style="padding: 20px;"><p>Accounts Division has confirmed your payment of NGN {{amount}}. You can now book your biometric capturing appointment.</p></div>`,
    plainTextBody: 'Payment confirmed for {{reference}}. Proceed to schedule capturing appointment.',
    isActive: true
  },
  {
    id: 'tpl-capturing-scheduled',
    eventCode: 'CAPTURING_SCHEDULED',
    title: 'Capturing Appointment Booked',
    subject: 'NPA PPMS: Capturing Appointment Confirmed — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Biometric Capturing Appointment</h2></div><div style="padding: 20px;"><p>Date: <strong>{{date}}</strong><br>Time Slot: <strong>{{time}}</strong><br>Venue: <strong>{{venue}}</strong></p><p>Please ensure all applicants bring original photo IDs.</p></div>`,
    plainTextBody: 'Capturing booked for {{reference}} on {{date}} at {{time}}.',
    isActive: true
  },
  {
    id: 'tpl-pass-ready',
    eventCode: 'PASS_READY_FOR_COLLECTION',
    title: 'Pass Ready for Collection',
    subject: 'NPA PPMS: Port Passes Ready for Collection — Ref: {{reference}}',
    htmlBody: `<div style="background-color: #087443; padding: 20px; color: white;"><h2>NPA PPMS: Passes Ready For Collection</h2></div><div style="padding: 20px;"><p>Your Port Passes have been produced and are ready for physical collection at the <strong>OIC ID Unit, {{port_name}}</strong>.</p></div>`,
    plainTextBody: 'Passes ready for collection at ID Unit for application {{reference}}.',
    isActive: true
  }
];

// Initial Capturing Slots for Ports (Active upcoming schedule for testing)
const INITIAL_CAPTURING_SLOTS: CapturingSlot[] = [
  {
    id: 'slot-lpc-1',
    portId: 'port-lpc-1',
    slotDate: '2026-10-18',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 25,
    bookedCount: 0,
    locationVenue: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    isBlocked: false
  },
  {
    id: 'slot-lpc-2',
    portId: 'port-lpc-1',
    slotDate: '2026-10-18',
    startTime: '11:30',
    endTime: '13:30',
    capacity: 25,
    bookedCount: 0,
    locationVenue: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    isBlocked: false
  },
  {
    id: 'slot-lpc-3',
    portId: 'port-lpc-1',
    slotDate: '2026-10-19',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 30,
    bookedCount: 0,
    locationVenue: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    isBlocked: false
  },
  {
    id: 'slot-lpc-4',
    portId: 'port-lpc-1',
    slotDate: '2026-10-19',
    startTime: '13:00',
    endTime: '15:00',
    capacity: 25,
    bookedCount: 0,
    locationVenue: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    isBlocked: false
  },
  {
    id: 'slot-lpc-5',
    portId: 'port-lpc-1',
    slotDate: '2026-10-20',
    startTime: '09:30',
    endTime: '12:00',
    capacity: 30,
    bookedCount: 0,
    locationVenue: 'NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays',
    isBlocked: false
  },
  {
    id: 'slot-tcipc-1',
    portId: 'port-tcipc-2',
    slotDate: '2026-10-18',
    startTime: '10:00',
    endTime: '12:00',
    capacity: 20,
    bookedCount: 0,
    locationVenue: 'ID Unit Administrative Block, TCIPC Main Gate',
    isBlocked: false
  },
  {
    id: 'slot-tcipc-2',
    portId: 'port-tcipc-2',
    slotDate: '2026-10-19',
    startTime: '09:00',
    endTime: '11:30',
    capacity: 25,
    bookedCount: 0,
    locationVenue: 'ID Unit Administrative Block, TCIPC Main Gate',
    isBlocked: false
  },
  {
    id: 'slot-rpc-1',
    portId: 'port-rpc-3',
    slotDate: '2026-10-18',
    startTime: '10:00',
    endTime: '12:00',
    capacity: 20,
    bookedCount: 0,
    locationVenue: 'NPA Rivers Port Pass Office, Port Security Building',
    isBlocked: false
  },
  {
    id: 'slot-rpc-2',
    portId: 'port-rpc-3',
    slotDate: '2026-10-19',
    startTime: '10:00',
    endTime: '12:00',
    capacity: 20,
    bookedCount: 0,
    locationVenue: 'NPA Rivers Port Pass Office, Port Security Building',
    isBlocked: false
  },
  {
    id: 'slot-opc-1',
    portId: 'port-opc-4',
    slotDate: '2026-10-18',
    startTime: '10:00',
    endTime: '13:00',
    capacity: 25,
    bookedCount: 0,
    locationVenue: 'NPA Pass & Biometric Unit, FLT Gate, Onne',
    isBlocked: false
  }
];

// Clean Applications register (Pristine - zero dummy data)
const INITIAL_APPLICATIONS: Application[] = [];

// Clean Workflow Logs
const INITIAL_WORKFLOW_LOGS: WorkflowLog[] = [];

// Clean In-App Notifications
const INITIAL_NOTIFICATIONS: InAppNotification[] = [];

// Clean Audit Trail
const INITIAL_AUDIT_LOGS: AuditTrailEntry[] = [];

const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  organizationName: 'Nigerian Ports Authority',
  systemName: 'Digital Port Pass Management System (PPMS)',
  logoUrl: 'https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
  primaryBrandColor: '#087443',
  auditRetentionDays: 365,
  emergencyMode: false
};

const INITIAL_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-consolidated-ops',
    name: 'Consolidated Port Applications Ledger',
    description: 'Executive overview of all port pass dossiers across all NPA port complexes with current workflow status, staffing count, and turnaround metrics.',
    category: 'Operations',
    dataset: 'APPLICATIONS',
    selectedColumns: ['referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'status', 'submittedAt', 'billAmountNgn'],
    filters: { dataset: 'APPLICATIONS', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'portName',
    sortBy: 'submittedAt',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tpl-remita-ebs',
    name: 'Oracle EBS & Remita Revenue Reconciliation',
    description: 'Finance & Treasury reconciliation audit: compares Oracle EBS billing advice numbers, Remita Retrieval References (RRRs), payment verification status, and TSA cleared revenue.',
    category: 'Finance & Treasury',
    dataset: 'FINANCIAL_BILLING',
    selectedColumns: ['referenceNumber', 'companyName', 'portName', 'oracleBillReference', 'rrrNumber', 'amountNgn', 'paymentStatus', 'verifiedAt', 'verifiedByName'],
    filters: { dataset: 'FINANCIAL_BILLING', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'paymentStatus',
    sortBy: 'amountNgn',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tpl-gm-security',
    name: 'GM Security Clearances & Risk Ledger',
    description: 'Port security clearances, GM security approval records, vetted concessionaires, and port access authorizations.',
    category: 'Security',
    dataset: 'SECURITY_CLEARANCE',
    selectedColumns: ['referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'securityStatus', 'gmApprovedAt', 'gmOfficerName'],
    filters: { dataset: 'SECURITY_CLEARANCE', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'portName',
    sortBy: 'gmApprovedAt',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tpl-id-unit-sla',
    name: 'OIC ID Unit Compliance & Vetting SLA',
    description: 'Analysis of ID Unit vetting queues, approval vs rejection rates, CAC verification checks, and verification processing duration.',
    category: 'Compliance',
    dataset: 'APPLICATIONS',
    selectedColumns: ['referenceNumber', 'companyName', 'portName', 'categoryName', 'status', 'submittedAt', 'vettingTurnaroundHours'],
    filters: { dataset: 'APPLICATIONS', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'portName',
    sortBy: 'submittedAt',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tpl-passes-bio',
    name: 'Port Passes Issued & Biometric Schedule',
    description: 'Biometric capture sessions, active RFID/NFC pass card numbers, badge validity periods, and issuance collection acknowledgments.',
    category: 'Pass Administration',
    dataset: 'PASSES_BIOMETRICS',
    selectedColumns: ['serialNumber', 'employeeName', 'companyName', 'portName', 'passType', 'biometricStatus', 'issuedAt', 'expiresAt', 'collectionStatus'],
    filters: { dataset: 'PASSES_BIOMETRICS', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'portName',
    sortBy: 'issuedAt',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tpl-concessionaire-audit',
    name: 'Concessionaire & Sponsoring Companies Audit',
    description: 'Port concessionaire compliance audit: active terminal lease verification, registered workforce headcount, and cumulative tariff payments.',
    category: 'Concessionaires',
    dataset: 'COMPANIES_AUDIT',
    selectedColumns: ['companyName', 'cacNumber', 'primaryPort', 'categoryName', 'totalActivePasses', 'totalBilledNgn', 'complianceStatus', 'primaryContact'],
    filters: { dataset: 'COMPANIES_AUDIT', portId: 'ALL', dateRangePreset: 'ALL' },
    groupBy: 'primaryPort',
    sortBy: 'totalBilledNgn',
    sortDirection: 'desc',
    isPredefined: true,
    createdAt: '2026-10-01T08:00:00Z'
  }
];


class DatabaseStore {
  private state: DatabaseState;
  private passwordResetRequests: Map<string, {
    email: string;
    code: string;
    expiresAt: number;
    createdAt: string;
    attempts: number;
    userId: string;
    companyName?: string;
  }> = new Map();

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ports: parsed.ports || INITIAL_PORTS,
          users: parsed.users || INITIAL_USERS,
          companies: parsed.companies || INITIAL_COMPANIES,
          categories: parsed.categories || INITIAL_CATEGORIES,
          passTypes: parsed.passTypes || INITIAL_PASS_TYPES,
          applications: parsed.applications || INITIAL_APPLICATIONS,
          workflowLogs: parsed.workflowLogs || INITIAL_WORKFLOW_LOGS,
          capturingSlots: parsed.capturingSlots || INITIAL_CAPTURING_SLOTS,
          capturingAppointments: parsed.capturingAppointments || [],
          passes: parsed.passes || [],
          smtpSettings: parsed.smtpSettings || INITIAL_SMTP,
          emailLogs: parsed.emailLogs || [],
          emailTemplates: parsed.emailTemplates || INITIAL_EMAIL_TEMPLATES,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
          systemSettings: parsed.systemSettings || INITIAL_SYSTEM_SETTINGS,
          reportTemplates: parsed.reportTemplates || INITIAL_REPORT_TEMPLATES
        };
      }
    } catch (err) {
      console.error('Error loading database from disk, using seed data:', err);
    }

    const defaultState: DatabaseState = {
      ports: INITIAL_PORTS,
      users: INITIAL_USERS,
      companies: INITIAL_COMPANIES,
      categories: INITIAL_CATEGORIES,
      passTypes: INITIAL_PASS_TYPES,
      applications: INITIAL_APPLICATIONS,
      workflowLogs: INITIAL_WORKFLOW_LOGS,
      capturingSlots: INITIAL_CAPTURING_SLOTS,
      capturingAppointments: [],
      passes: [],
      smtpSettings: INITIAL_SMTP,
      emailLogs: [],
      emailTemplates: INITIAL_EMAIL_TEMPLATES,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      systemSettings: INITIAL_SYSTEM_SETTINGS,
      reportTemplates: INITIAL_REPORT_TEMPLATES
    };

    this.saveToDisk(defaultState);
    return defaultState;
  }

  private saveToDisk(stateToSave?: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(stateToSave || this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  // --- GETTERS ---
  getPorts() { return this.state.ports; }
  getUsers() { return this.state.users; }
  getCompanies() { return this.state.companies; }
  getCategories() { return this.state.categories; }
  getPassTypes() { return this.state.passTypes; }
  getPasses() { return this.state.passes; }
  getApplications() { return this.state.applications; }
  getWorkflowLogs(appId?: string) {
    if (appId) return this.state.workflowLogs.filter(w => w.applicationId === appId);
    return this.state.workflowLogs;
  }
  getCapturingSlots(portId?: string) {
    if (portId) return this.state.capturingSlots.filter(s => s.portId === portId);
    return this.state.capturingSlots;
  }
  getAppointments(filters?: { portId?: string; date?: string; companyId?: string; status?: string }) {
    let list = this.state.capturingAppointments;
    if (filters?.portId && filters.portId !== 'ALL') {
      list = list.filter(a => a.portId === filters.portId);
    }
    if (filters?.date) {
      list = list.filter(a => a.scheduledForDate === filters.date);
    }
    if (filters?.companyId) {
      list = list.filter(a => a.companyId === filters.companyId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(a => a.status === filters.status);
    }
    return list;
  }
  getSmtpSettings() { return this.state.smtpSettings; }
  getEmailLogs() { return this.state.emailLogs; }
  getEmailTemplates() { return this.state.emailTemplates; }
  getNotifications(userId?: string) {
    if (userId) return this.state.notifications.filter(n => n.userId === userId);
    return this.state.notifications;
  }
  getAuditLogs() { return this.state.auditLogs; }
  getSystemSettings() { return this.state.systemSettings; }

  // --- REPORT TEMPLATES ---
  getReportTemplates(): ReportTemplate[] {
    return this.state.reportTemplates || INITIAL_REPORT_TEMPLATES;
  }

  createReportTemplate(data: Omit<ReportTemplate, 'id' | 'createdAt'>): ReportTemplate {
    const newTpl: ReportTemplate = {
      ...data,
      id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    if (!this.state.reportTemplates) {
      this.state.reportTemplates = [...INITIAL_REPORT_TEMPLATES];
    }
    this.state.reportTemplates.push(newTpl);
    this.saveToDisk();
    return newTpl;
  }

  updateReportTemplate(id: string, updates: Partial<ReportTemplate>): ReportTemplate | null {
    if (!this.state.reportTemplates) {
      this.state.reportTemplates = [...INITIAL_REPORT_TEMPLATES];
    }
    const idx = this.state.reportTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.state.reportTemplates[idx] = {
      ...this.state.reportTemplates[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.state.reportTemplates[idx];
  }

  deleteReportTemplate(id: string): boolean {
    if (!this.state.reportTemplates) {
      this.state.reportTemplates = [...INITIAL_REPORT_TEMPLATES];
    }
    const lenBefore = this.state.reportTemplates.length;
    this.state.reportTemplates = this.state.reportTemplates.filter(t => t.id !== id);
    if (this.state.reportTemplates.length !== lenBefore) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- TRANSACTIONAL DATA RESET (Ready for Production Testing) ---
  clearTransactionalData() {
    this.state.applications = [];
    this.state.workflowLogs = [];
    this.state.passes = [];
    this.state.capturingAppointments = [];
    this.state.emailLogs = [];
    this.state.notifications = [];
    this.state.auditLogs = [];
    if (this.state.capturingSlots) {
      this.state.capturingSlots.forEach(s => { s.bookedCount = 0; });
    }
    this.saveToDisk();
    return { success: true, message: 'All mock and test transactional records cleared. Register is in pristine state.' };
  }

  // --- AUDIT TRAIL LOGGING ---
  logAudit(entry: Omit<AuditTrailEntry, 'id' | 'createdAt'>) {
    const auditRecord: AuditTrailEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...entry
    };
    this.state.auditLogs.unshift(auditRecord);
    this.saveToDisk();
    return auditRecord;
  }

  // --- NOTIFICATIONS ---
  private notificationListeners: Array<(notif: InAppNotification, recipient: User, application?: Application) => Promise<void> | void> = [];

  onNotification(listener: (notif: InAppNotification, recipient: User, application?: Application) => Promise<void> | void) {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  createNotification(notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>) {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notif
    };
    this.state.notifications.unshift(newNotif);
    this.saveToDisk();

    // Match recipient user and application for automatic real-time email dispatch
    const recipient = this.state.users.find(u => u.id === newNotif.userId);
    const relatedApp = newNotif.applicationId
      ? this.state.applications.find(a => a.id === newNotif.applicationId)
      : (newNotif.applicationReference ? this.state.applications.find(a => a.referenceNumber === newNotif.applicationReference) : undefined);

    if (recipient && recipient.email) {
      this.notificationListeners.forEach(listener => {
        try {
          const res = listener(newNotif, recipient, relatedApp);
          if (res instanceof Promise) {
            res.catch(err => console.error('[Notification Listener Async Error]:', err));
          }
        } catch (err) {
          console.error('[Notification Listener Error]:', err);
        }
      });
    }

    return newNotif;
  }

  markNotificationRead(id: string) {
    const n = this.state.notifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      this.saveToDisk();
    }
    return n;
  }

  // --- COMPANY MANAGEMENT ---
  registerCompany(companyData: Omit<Company, 'id' | 'status' | 'createdAt'>, userEmail: string, userPhone: string) {
    // 1. Strict Single-Registration Enforcement: A company can ONLY be registered ONCE
    const cleanCac = (companyData.cacNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');
    const cleanEmail = (companyData.email || '').trim().toLowerCase();
    const cleanName = (companyData.companyName || '').trim().toLowerCase();
    const cleanTin = (companyData.tinNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');

    if (!cleanCac) {
      throw new Error('CAC Registration Number is mandatory for corporate profiling.');
    }
    if (!cleanEmail) {
      throw new Error('Official Corporate Email address is mandatory. Credentials will be dispatched to this address.');
    }

    // Check existing CAC Registration Number
    const existingCac = this.state.companies.find((c) => {
      const existingClean = (c.cacNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');
      return existingClean === cleanCac;
    });
    if (existingCac) {
      throw new Error(
        `Company already registered: A corporate entity with CAC Registration Number "${companyData.cacNumber}" (${existingCac.companyName}) is already profiled in the NPA Port Pass Management System. Under NPA statutory rules, each company can only be registered once.`
      );
    }

    // Check existing Corporate Email
    const existingEmail = this.state.companies.find(
      (c) => (c.email || '').trim().toLowerCase() === cleanEmail
    );
    if (existingEmail) {
      throw new Error(
        `Corporate email already registered: The email "${companyData.email}" is already bound to profiled company "${existingEmail.companyName}". A company can only be registered once.`
      );
    }

    // Check existing TIN (if provided)
    if (cleanTin && cleanTin.length >= 4) {
      const existingTin = this.state.companies.find((c) => {
        const curTin = (c.tinNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');
        return curTin && curTin === cleanTin;
      });
      if (existingTin) {
        throw new Error(
          `Tax Identification Number (TIN) "${companyData.tinNumber}" is already registered to "${existingTin.companyName}". A company can only be registered once.`
        );
      }
    }

    // Check existing Company Name
    const existingName = this.state.companies.find(
      (c) => (c.companyName || '').trim().toLowerCase() === cleanName
    );
    if (existingName) {
      throw new Error(
        `Company name already registered: "${companyData.companyName}" is already profiled under CAC ${existingName.cacNumber}. A company can only be registered once.`
      );
    }

    // 2. Generate secure temporary password for initial company access
    const randomPin = Math.floor(100000 + Math.random() * 900000);
    const temporaryPassword = `Npa@${randomPin}`;

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const companyId = `comp-${Date.now()}-${randomSuffix}`;
    const newCompany: Company = {
      ...companyData,
      id: companyId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.state.companies.push(newCompany);

    // Official company login is anchored directly to the corporate email
    const primaryLoginEmail = cleanEmail;

    // Check if user already exists
    const existingUserIndex = this.state.users.findIndex(
      (u) => u.email.toLowerCase() === primaryLoginEmail || (userEmail && u.email.toLowerCase() === userEmail.trim().toLowerCase())
    );

    let newUser: User;
    if (existingUserIndex >= 0) {
      // Update existing user with new company affiliation and new password
      this.state.users[existingUserIndex].companyId = companyId;
      this.state.users[existingUserIndex].fullName = companyData.authRepName || companyData.companyName;
      this.state.users[existingUserIndex].phone = userPhone || companyData.phone || this.state.users[existingUserIndex].phone;
      this.state.users[existingUserIndex].password = temporaryPassword;
      this.state.users[existingUserIndex].assignedPortId = companyData.primaryPortId;
      newUser = this.state.users[existingUserIndex];
    } else {
      newUser = {
        id: `user-${Date.now()}-${randomSuffix}`,
        email: primaryLoginEmail,
        fullName: companyData.authRepName || `${companyData.companyName} (Admin)`,
        phone: userPhone || companyData.phone,
        password: temporaryPassword,
        userType: 'EXTERNAL',
        roles: ['COMPANY_ADMIN'],
        companyId: companyId,
        assignedPortId: companyData.primaryPortId,
        isActive: true,
        mfaEnabled: false,
        createdAt: new Date().toISOString()
      };
      this.state.users.push(newUser);
    }

    this.logAudit({
      action: 'COMPANY_REGISTERED',
      entityName: 'COMPANY',
      entityId: companyId,
      userId: newUser.id,
      userName: newUser.fullName,
      userRole: 'COMPANY_ADMIN',
      details: {
        companyName: newCompany.companyName,
        cacNumber: newCompany.cacNumber,
        corporateEmail: newCompany.email,
        authRepName: companyData.authRepName
      }
    });

    this.saveToDisk();
    return { company: newCompany, user: newUser, temporaryPassword };
  }

  updateCompanyStatus(companyId: string, status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED', officer: User) {
    const company = this.state.companies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');

    const previousStatus = company.status;
    company.status = status;

    this.logAudit({
      action: 'COMPANY_STATUS_UPDATED',
      entityName: 'COMPANY',
      entityId: companyId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: officer.roles[0],
      details: {
        companyName: company.companyName,
        cacNumber: company.cacNumber,
        previousStatus,
        newStatus: status
      }
    });

    // Notify company admins
    const companyUsers = this.state.users.filter(u => u.companyId === companyId);
    companyUsers.forEach(u => {
      this.createNotification({
        userId: u.id,
        title: `Corporate Profiling Status Updated: ${status}`,
        message: `Your corporate entity status in NPA PPMS has been set to "${status}" by the NPA System Administrator.`
      });
    });

    this.saveToDisk();
    return company;
  }

  generateNewCompanyTemporaryPassword(companyId: string, officer: User) {
    const company = this.state.companies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');

    const companyUser = this.state.users.find(u => u.companyId === companyId && u.roles.includes('COMPANY_ADMIN')) ||
                       this.state.users.find(u => u.companyId === companyId);
    if (!companyUser) throw new Error('No portal administrator user found for this company');

    const randomPin = Math.floor(100000 + Math.random() * 900000);
    const temporaryPassword = `Npa@${randomPin}`;
    companyUser.password = temporaryPassword;

    this.logAudit({
      action: 'COMPANY_CREDENTIALS_REISSUED',
      entityName: 'COMPANY',
      entityId: companyId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: officer.roles[0],
      details: {
        companyName: company.companyName,
        cacNumber: company.cacNumber,
        corporateEmail: company.email,
        dispatchedToEmail: companyUser.email
      }
    });

    this.saveToDisk();
    return { company, user: companyUser, temporaryPassword };
  }

  // --- APPLICATION GENERATION & LIFECYCLE ---
  createApplication(data: {
    companyId: string;
    portId: string;
    categoryId: string;
    passTypeId: string;
    validityPeriodMonths: number;
    numberOfEmployees: number;
    justification: string;
    employees: Array<Omit<import('./types.js').ApplicationEmployee, 'id' | 'applicationId' | 'capturingStatus' | 'status' | 'createdAt'>>;
    documents: Array<Omit<import('./types.js').ApplicationDocument, 'id' | 'applicationId' | 'uploadedAt' | 'verified'>>;
    conditionsAcceptance?: Omit<import('./types.js').ConditionsAcceptance, 'id' | 'applicationId' | 'acceptedAt'>;
    isDraft?: boolean;
    user: User;
  }) {
    const port = this.state.ports.find(p => p.id === data.portId) || this.state.ports[0];
    const category = this.state.categories.find(c => c.id === data.categoryId) || this.state.categories[0];
    const passType = this.state.passTypes.find(pt => pt.id === data.passTypeId) || this.state.passTypes[0];
    const company = this.state.companies.find(c => c.id === data.companyId);

    const year = new Date().getFullYear();
    const count = this.state.applications.length + 1;
    const seq = String(count).padStart(6, '0');
    const referenceNumber = `NPA/PPMS/${port.code}/${year}/${seq}`;

    const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const initialStatus: WorkflowStatus = data.isDraft ? 'DRAFT' : 'PENDING_ID_UNIT_VERIFICATION';

    const fullEmployees = data.employees.map((e, index) => ({
      ...e,
      id: `emp-${appId}-${index + 1}`,
      applicationId: appId,
      capturingStatus: 'PENDING' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    }));

    const fullDocuments = data.documents.map((d, index) => ({
      ...d,
      id: `doc-${appId}-${index + 1}`,
      applicationId: appId,
      uploadedAt: new Date().toISOString(),
      verified: false
    }));

    const application: Application = {
      id: appId,
      referenceNumber,
      companyId: data.companyId,
      companyName: company?.companyName || 'Unknown Company',
      portId: data.portId,
      portName: port.name,
      categoryId: data.categoryId,
      categoryName: category.name,
      passTypeId: data.passTypeId,
      passTypeName: passType.name,
      status: initialStatus,
      validityPeriodMonths: data.validityPeriodMonths || 12,
      numberOfEmployees: fullEmployees.length,
      justification: data.justification,
      conditionsAccepted: !!data.conditionsAcceptance,
      conditionsAcceptance: data.conditionsAcceptance ? {
        id: `ca-${Date.now()}`,
        applicationId: appId,
        acceptedAt: new Date().toISOString(),
        ...data.conditionsAcceptance
      } : undefined,
      submittedAt: data.isDraft ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employees: fullEmployees,
      documents: fullDocuments
    };

    this.state.applications.unshift(application);

    // Workflow Log
    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: null,
      newStatus: initialStatus,
      responsibleUserId: data.user.id,
      responsibleUserName: data.user.fullName,
      responsibleRole: data.user.roles[0],
      remarks: data.isDraft ? 'Application draft created.' : 'Application submitted with mandatory Conditions of Issue acceptance.',
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: data.isDraft ? 'DRAFT_APPLICATION_CREATED' : 'APPLICATION_SUBMITTED',
      entityName: 'APPLICATION',
      entityId: appId,
      userId: data.user.id,
      userName: data.user.fullName,
      userRole: data.user.roles[0],
      details: { referenceNumber, employeesCount: fullEmployees.length, port: port.code }
    });

    // In-App Notifications
    if (!data.isDraft) {
      // Notify ID Unit officers for this port
      const idUnitOfficers = this.state.users.filter(u => u.roles.includes('OIC_ID_UNIT') && (!u.assignedPortId || u.assignedPortId === port.id));
      idUnitOfficers.forEach(officer => {
        this.createNotification({
          userId: officer.id,
          title: 'New Application for ID Unit Verification',
          message: `Application ${referenceNumber} submitted by ${application.companyName}. Please verify required documents.`,
          applicationId: appId,
          applicationReference: referenceNumber
        });
      });

      // Also notify the applicant company user
      this.createNotification({
        userId: data.user.id,
        title: 'Application Submitted Successfully',
        message: `Your Port Pass Application ${referenceNumber} for ${port.name} (${fullEmployees.length} personnel) has been submitted and queued for OIC ID Unit preliminary verification.`,
        applicationId: appId,
        applicationReference: referenceNumber
      });
    }

    this.saveToDisk();
    return application;
  }

  // --- WORKFLOW TRANSITION: OIC ID UNIT VERIFICATION ---
  verifyIdUnit(appId: string, officer: User, action: 'APPROVE' | 'REJECT' | 'RETURN_CORRECTION', notes: string) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    const prevStatus = app.status;
    let nextStatus: WorkflowStatus;

    if (action === 'APPROVE') {
      nextStatus = 'PENDING_GM_SECURITY_APPROVAL';
      app.documents.forEach(d => d.verified = true);
      // Clear previous correction notes once re-approved
      app.correctionNotes = undefined;
    } else if (action === 'REJECT') {
      nextStatus = 'REJECTED';
      app.rejectionReason = notes;
    } else {
      nextStatus = 'RETURNED_FOR_CORRECTION';
      app.correctionNotes = notes || app.correctionNotes || 'Please review uploaded documents, update deficiencies, and resubmit for statutory vetting.';
    }

    app.status = nextStatus;
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'OIC_ID_UNIT',
      remarks: notes || (action === 'RETURN_CORRECTION' ? (app.correctionNotes || 'Returned to company for documentation and bio-data correction') : `ID Unit action: ${action}`),
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: `ID_UNIT_${action}`,
      entityName: 'APPLICATION',
      entityId: appId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'OIC_ID_UNIT',
      details: { referenceNumber: app.referenceNumber, action, notes }
    });

    // Notify GM Security if approved
    if (action === 'APPROVE') {
      const gmSecurityOfficers = this.state.users.filter(u => u.roles.includes('GM_SECURITY'));
      gmSecurityOfficers.forEach(officer => {
        this.createNotification({
          userId: officer.id,
          title: 'Application Ready for GM Security Approval',
          message: `Application ${app.referenceNumber} has passed ID Unit verification. Pending your security clearance.`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });

      // Also notify company that application was verified
      const companyUsers = this.state.users.filter(u => u.companyId === app.companyId);
      companyUsers.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'ID Unit Verification Completed',
          message: `Application ${app.referenceNumber} has passed OIC ID Unit verification and was forwarded to GM Security for clearance.`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    } else if (action === 'RETURN_CORRECTION' || nextStatus === 'RETURNED_FOR_CORRECTION') {
      // In-App Notification for Company users when returned for correction
      const companyUsers = this.state.users.filter(u => u.companyId === app.companyId);
      companyUsers.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'Action Required: Application Returned for Correction',
          message: `Application ${app.referenceNumber} was returned by OIC ID Unit for correction: "${notes || app.correctionNotes || 'Please review requirements, update documents or personnel, and resubmit.'}"`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    } else if (action === 'REJECT') {
      const companyUsers = this.state.users.filter(u => u.companyId === app.companyId);
      companyUsers.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'Application Rejected by ID Unit',
          message: `Application ${app.referenceNumber} was declined by OIC ID Unit: "${notes || 'Application requirements not met.'}"`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    }

    this.saveToDisk();
    return app;
  }

  // --- APPLICATION RESUBMISSION (After Return for Correction) ---
  resubmitApplication(appId: string, user: User, data: {
    justification?: string;
    employees?: Array<{
      fullName: string;
      position: string;
      phone: string;
      email: string;
      idType: 'NIN' | 'INTERNATIONAL_PASSPORT' | 'DRIVERS_LICENCE' | 'VOTERS_CARD';
      idReference: string;
      passportPhotoUrl?: string;
    }>;
    documents?: Array<{
      id?: string;
      fileName: string;
      fileSizeBytes?: number;
      mimeType?: string;
      requirementCode: string;
      documentName: string;
      fileData?: string;
      fileUrl?: string;
    }>;
    resubmissionNotes?: string;
  }) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    const isCompanyUser = user.roles.includes('COMPANY_ADMIN') || user.roles.includes('COMPANY_STAFF');
    if (isCompanyUser && user.companyId && app.companyId !== user.companyId) {
      throw new Error('Unauthorized. You can only resubmit applications belonging to your organization.');
    }

    if (app.status !== 'RETURNED_FOR_CORRECTION' && app.status !== 'DRAFT') {
      throw new Error(`Cannot resubmit application in status "${app.status}". Only returned applications can be edited and resubmitted.`);
    }

    const prevStatus = app.status;
    app.status = 'PENDING_ID_UNIT_VERIFICATION';
    app.updatedAt = new Date().toISOString();

    if (data.justification) {
      app.justification = data.justification;
    }

    if (data.employees && data.employees.length > 0) {
      app.employees = data.employees.map((e, idx) => ({
        ...e,
        id: (e as any).id || `emp-${app.id}-${idx + 1}`,
        applicationId: app.id,
        capturingStatus: (e as any).capturingStatus || 'PENDING',
        status: (e as any).status || 'ACTIVE',
        createdAt: (e as any).createdAt || new Date().toISOString()
      }));
      app.numberOfEmployees = app.employees.length;
    }

    if (data.documents && data.documents.length > 0) {
      app.documents = data.documents.map((d, idx) => ({
        ...d,
        id: d.id || `doc-${app.id}-${idx + 1}`,
        applicationId: app.id,
        fileSizeBytes: d.fileSizeBytes || 1024 * 120,
        mimeType: d.mimeType || (d.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        uploadedAt: new Date().toISOString(),
        verified: false
      }));
    }

    // Workflow log
    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: prevStatus,
      newStatus: 'PENDING_ID_UNIT_VERIFICATION',
      responsibleUserId: user.id,
      responsibleUserName: user.fullName,
      responsibleRole: user.roles[0] || 'COMPANY_ADMIN',
      remarks: data.resubmissionNotes 
        ? `Application dossier corrected and resubmitted by company: ${data.resubmissionNotes}` 
        : 'Application dossier corrected and resubmitted by company for OIC ID Unit verification.',
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'APPLICATION_RESUBMITTED',
      entityName: 'APPLICATION',
      entityId: appId,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0] || 'COMPANY_ADMIN',
      details: { 
        referenceNumber: app.referenceNumber, 
        employeesCount: app.numberOfEmployees, 
        resubmissionNotes: data.resubmissionNotes 
      }
    });

    // In-App Notifications for OIC ID Unit officers
    const idUnitOfficers = this.state.users.filter(u => 
      u.roles.includes('OIC_ID_UNIT') && (!u.assignedPortId || u.assignedPortId === app.portId)
    );
    idUnitOfficers.forEach(officer => {
      this.createNotification({
        userId: officer.id,
        title: 'Application Resubmitted After Correction',
        message: `${app.companyName} has resubmitted Application ${app.referenceNumber} after completing requested corrections. Notes: ${data.resubmissionNotes || 'Updated documents attached'}.`,
        applicationId: app.id,
        applicationReference: app.referenceNumber
      });
    });

    // In-App Notification for company user
    this.createNotification({
      userId: user.id,
      title: 'Application Resubmitted Successfully',
      message: `Your corrected dossier for ${app.referenceNumber} has been delivered to the Port ID Unit for statutory re-verification.`,
      applicationId: app.id,
      applicationReference: app.referenceNumber
    });

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: GM SECURITY APPROVAL ---
  approveGmSecurity(appId: string, officer: User, action: 'APPROVE' | 'REJECT' | 'RETURN_TO_ID_UNIT', notes: string) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    if (app.status !== 'PENDING_GM_SECURITY_APPROVAL') {
      throw new Error(`Invalid workflow transition. GM Security cannot approve application in status "${app.status}". Mandatory ID Unit verification must precede GM Security approval.`);
    }

    const prevStatus = app.status;
    let nextStatus: WorkflowStatus;

    if (action === 'APPROVE') {
      nextStatus = 'PENDING_BILLING';
    } else if (action === 'REJECT') {
      nextStatus = 'REJECTED';
      app.rejectionReason = notes;
    } else {
      nextStatus = 'RETURNED_TO_ID_UNIT';
      app.correctionNotes = notes;
    }

    app.status = nextStatus;
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'GM_SECURITY',
      remarks: notes || `GM Security action: ${action}`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: `GM_SECURITY_${action}`,
      entityName: 'APPLICATION',
      entityId: appId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'GM_SECURITY',
      details: { referenceNumber: app.referenceNumber, action, notes }
    });

    // Notify Tariff & Billing if approved
    if (action === 'APPROVE') {
      const billingOfficers = this.state.users.filter(u => u.roles.includes('TARIFF_BILLING'));
      billingOfficers.forEach(bOfficer => {
        this.createNotification({
          userId: bOfficer.id,
          title: 'Application Awaiting Oracle EBS Billing',
          message: `Application ${app.referenceNumber} has received GM Security clearance. Please enter Oracle billing information and RRR.`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });

      // Also notify company
      const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
      companyAdmins.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'GM Security Clearance Approved',
          message: `Application ${app.referenceNumber} has received official security clearance from General Manager Security. Awaiting Oracle EBS billing advice generation.`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    } else if (action === 'RETURN_TO_ID_UNIT') {
      const idUnitOfficers = this.state.users.filter(u => 
        u.roles.includes('OIC_ID_UNIT') && (!u.assignedPortId || u.assignedPortId === app.portId)
      );
      idUnitOfficers.forEach(officer => {
        this.createNotification({
          userId: officer.id,
          title: 'Application Returned by GM Security',
          message: `Application ${app.referenceNumber} was returned by GM Security for review: "${notes || 'Security clarification requested'}"`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });

      // Also notify company
      const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
      companyAdmins.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'Dossier Under Technical Review',
          message: `Application ${app.referenceNumber} was referred back to Port ID Unit for technical review: "${notes || 'Security technical clarification requested.'}"`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    } else if (action === 'REJECT') {
      const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
      companyAdmins.forEach(cUser => {
        this.createNotification({
          userId: cUser.id,
          title: 'Application Rejected by GM Security',
          message: `Security clearance for Application ${app.referenceNumber} was declined by GM Security: "${notes || 'Security clearance rejected.'}"`,
          applicationId: appId,
          applicationReference: app.referenceNumber
        });
      });
    }

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: TARIFF & BILLING ---
  recordBill(appId: string, officer: User, billData: {
    oracleBillReference: string;
    rrrNumber: string;
    amountNgn: number;
    billingDate: string;
    paymentDeadline: string;
    remarks?: string;
    supportingDocuments?: Array<{
      id?: string;
      fileName: string;
      documentName?: string;
      fileData?: string;
      fileSizeBytes?: number;
      mimeType?: string;
    }>;
    documentUrl?: string;
    documentName?: string;
    documentData?: string;
    fileSizeBytes?: number;
    mimeType?: string;
  }) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    if (app.status !== 'PENDING_BILLING') {
      throw new Error(`Cannot enter bill for application in status "${app.status}". Application must be GM_SECURITY_APPROVED first.`);
    }

    const supportingDocs: ApplicationDocument[] = [];
    if (billData.supportingDocuments && billData.supportingDocuments.length > 0) {
      billData.supportingDocuments.forEach((doc, idx) => {
        const appDoc: ApplicationDocument = {
          id: doc.id || `doc-bill-${Date.now()}-${idx}`,
          applicationId: appId,
          requirementCode: 'TARIFF_BILLING_SUPPORTING',
          documentName: doc.documentName || 'Official Oracle EBS Demand Notice',
          fileName: doc.fileName,
          fileData: doc.fileData,
          fileSizeBytes: doc.fileSizeBytes || 1024 * 160,
          mimeType: doc.mimeType || (doc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
          uploadedAt: new Date().toISOString(),
          verified: true
        };
        supportingDocs.push(appDoc);
        if (!app.documents) app.documents = [];
        app.documents.push(appDoc);
      });
    } else if (billData.documentData || billData.documentName) {
      const appDoc: ApplicationDocument = {
        id: `doc-bill-${Date.now()}`,
        applicationId: appId,
        requirementCode: 'TARIFF_BILLING_SUPPORTING',
        documentName: billData.documentName || 'Official Oracle EBS Demand Notice',
        fileName: billData.documentName || 'Oracle_EBS_Demand_Notice.pdf',
        fileData: billData.documentData,
        fileSizeBytes: billData.fileSizeBytes || 1024 * 160,
        mimeType: billData.mimeType || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        verified: true
      };
      supportingDocs.push(appDoc);
      if (!app.documents) app.documents = [];
      app.documents.push(appDoc);
    }

    const bill = {
      id: `bill-${Date.now()}`,
      applicationId: appId,
      oracleBillReference: billData.oracleBillReference,
      rrrNumber: billData.rrrNumber,
      amountNgn: billData.amountNgn,
      billingDate: billData.billingDate,
      paymentDeadline: billData.paymentDeadline,
      billingOfficerId: officer.id,
      billingOfficerName: officer.fullName,
      remarks: billData.remarks,
      createdAt: new Date().toISOString(),
      supportingDocuments: supportingDocs,
      documentUrl: billData.documentUrl || (supportingDocs[0] ? `/uploads/billing/${supportingDocs[0].fileName}` : undefined),
      documentName: supportingDocs[0]?.documentName || billData.documentName,
      documentData: supportingDocs[0]?.fileData || billData.documentData,
      fileSizeBytes: supportingDocs[0]?.fileSizeBytes || billData.fileSizeBytes,
      mimeType: supportingDocs[0]?.mimeType || billData.mimeType
    };

    app.bill = bill;
    app.status = 'BILL_ISSUED';
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: 'PENDING_BILLING',
      newStatus: 'BILL_ISSUED',
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'TARIFF_BILLING',
      remarks: `Oracle EBS reference ${billData.oracleBillReference} recorded. Amount: NGN ${billData.amountNgn.toLocaleString()} (RRR: ${billData.rrrNumber}).`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'BILL_RECORDED',
      entityName: 'BILL',
      entityId: bill.id,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'TARIFF_BILLING',
      details: { referenceNumber: app.referenceNumber, ...billData }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Billing Advice Issued — Remita Payment Required',
        message: `Billing details entered for ${app.referenceNumber}. Amount: NGN ${billData.amountNgn.toLocaleString()} (RRR: ${billData.rrrNumber}). Please pay and upload receipt.`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: PAYMENT EVIDENCE UPLOAD ---
  uploadPaymentEvidence(appId: string, user: User, paymentData: {
    receiptReference: string;
    amountPaidNgn: number;
    paymentDate: string;
    receiptDocumentUrl: string;
    receiptFileName: string;
    receiptFileData?: string;
  }) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    const payment = {
      id: `pay-${Date.now()}`,
      applicationId: appId,
      billId: app.bill?.id || '',
      receiptReference: paymentData.receiptReference,
      amountPaidNgn: paymentData.amountPaidNgn,
      paymentDate: paymentData.paymentDate,
      paymentMethod: 'REMITA / BANK TRANSFER',
      receiptDocumentUrl: paymentData.receiptDocumentUrl,
      receiptFileName: paymentData.receiptFileName,
      receiptFileData: paymentData.receiptFileData || '',
      uploadedByUserId: user.id,
      uploadedByName: user.fullName,
      createdAt: new Date().toISOString(),
      verificationStatus: 'PENDING' as const
    };

    app.payment = payment;
    app.status = 'PAYMENT_UNDER_REVIEW';
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: 'BILL_ISSUED',
      newStatus: 'PAYMENT_UNDER_REVIEW',
      responsibleUserId: user.id,
      responsibleUserName: user.fullName,
      responsibleRole: user.roles[0],
      remarks: `Payment receipt uploaded (Ref: ${paymentData.receiptReference}, Amount: NGN ${paymentData.amountPaidNgn.toLocaleString()}). Submitted for Accounts Division review.`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'PAYMENT_EVIDENCE_UPLOADED',
      entityName: 'PAYMENT',
      entityId: payment.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { referenceNumber: app.referenceNumber, ...paymentData }
    });

    // Notify Accounts division
    const accountsOfficers = this.state.users.filter(u => u.roles.includes('ACCOUNTS_OFFICER'));
    accountsOfficers.forEach(acc => {
      this.createNotification({
        userId: acc.id,
        title: 'Payment Evidence Awaiting Verification',
        message: `Payment evidence uploaded for ${app.referenceNumber} (Receipt: ${paymentData.receiptReference}). Please verify against Remita/Bank settlement.`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    // Also notify uploading company user
    this.createNotification({
      userId: user.id,
      title: 'Payment Receipt Uploaded',
      message: `Your payment receipt (${paymentData.receiptReference}, Amount: NGN ${paymentData.amountPaidNgn.toLocaleString()}) for ${app.referenceNumber} has been received and queued for Accounts verification.`,
      applicationId: appId,
      applicationReference: app.referenceNumber
    });

    this.saveToDisk();
    return app;
  }

  verifyPayment(
    appId: string, 
    officer: User, 
    action: 'CONFIRM' | 'REJECT' | 'REQUEST_CLARIFICATION', 
    notes: string,
    supportingDocuments?: Array<{
      id?: string;
      fileName: string;
      documentName?: string;
      fileData?: string;
      fileSizeBytes?: number;
      mimeType?: string;
    }>,
    verificationDocument?: {
      fileName: string;
      documentName?: string;
      fileData?: string;
      fileSizeBytes?: number;
      mimeType?: string;
    }
  ) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app || !app.payment) throw new Error('Application or payment evidence not found');

    const prevStatus = app.status;
    let nextStatus: WorkflowStatus;

    if (action === 'CONFIRM') {
      nextStatus = 'READY_FOR_SCHEDULING';
      app.payment.verificationStatus = 'CONFIRMED';
    } else if (action === 'REJECT') {
      nextStatus = 'PAYMENT_REJECTED';
      app.payment.verificationStatus = 'REJECTED';
    } else {
      nextStatus = 'BILL_ISSUED';
      app.payment.verificationStatus = 'CLARIFICATION_REQUIRED';
    }

    const auditDocs: ApplicationDocument[] = [];
    if (supportingDocuments && supportingDocuments.length > 0) {
      supportingDocuments.forEach((doc, idx) => {
        const appDoc: ApplicationDocument = {
          id: doc.id || `doc-acct-${Date.now()}-${idx}`,
          applicationId: appId,
          requirementCode: 'TREASURY_SETTLEMENT_EVIDENCE',
          documentName: doc.documentName || 'Accounts Settlement Audit Document',
          fileName: doc.fileName,
          fileData: doc.fileData,
          fileSizeBytes: doc.fileSizeBytes || 1024 * 160,
          mimeType: doc.mimeType || (doc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
          uploadedAt: new Date().toISOString(),
          verified: true
        };
        auditDocs.push(appDoc);
        if (!app.documents) app.documents = [];
        app.documents.push(appDoc);
      });
    } else if (verificationDocument?.fileData || verificationDocument?.fileName) {
      const appDoc: ApplicationDocument = {
        id: `doc-acct-${Date.now()}`,
        applicationId: appId,
        requirementCode: 'TREASURY_SETTLEMENT_EVIDENCE',
        documentName: verificationDocument.documentName || 'CBN TSA Settlement Verification Schedule',
        fileName: verificationDocument.fileName,
        fileData: verificationDocument.fileData,
        fileSizeBytes: verificationDocument.fileSizeBytes || 1024 * 160,
        mimeType: verificationDocument.mimeType || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        verified: true
      };
      auditDocs.push(appDoc);
      if (!app.documents) app.documents = [];
      app.documents.push(appDoc);
    }

    if (auditDocs.length > 0) {
      app.payment.supportingDocuments = auditDocs;
      app.payment.verificationDocumentUrl = `/uploads/accounts/${auditDocs[0].fileName}`;
      app.payment.verificationDocumentName = auditDocs[0].documentName;
      app.payment.verificationFileData = auditDocs[0].fileData;
      app.payment.verificationFileSizeBytes = auditDocs[0].fileSizeBytes;
      app.payment.verificationMimeType = auditDocs[0].mimeType;
    }

    app.payment.verificationNotes = notes;
    app.payment.verifiedByOfficerId = officer.id;
    app.payment.verifiedByOfficerName = officer.fullName;
    app.payment.verifiedAt = new Date().toISOString();
    app.status = nextStatus;
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: prevStatus,
      newStatus: nextStatus,
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'ACCOUNTS_OFFICER',
      remarks: notes || `Accounts payment action: ${action}`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: `PAYMENT_${action}`,
      entityName: 'PAYMENT',
      entityId: app.payment.id,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'ACCOUNTS_OFFICER',
      details: { referenceNumber: app.referenceNumber, action, notes }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: action === 'CONFIRM' ? 'Payment Confirmed — Book Biometrics' : 'Payment Verification Issue',
        message: action === 'CONFIRM'
          ? `Payment for ${app.referenceNumber} has been verified by Accounts. You can now book your biometric capturing date.`
          : `Payment verification for ${app.referenceNumber} returned: ${notes}`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: BIOMETRIC APPOINTMENT SCHEDULING ---
  bookAppointment(appId: string, slotId: string, user: User) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');
    if (app.status !== 'READY_FOR_SCHEDULING' && app.status !== 'CAPTURING_SCHEDULED') {
      throw new Error(`Cannot book capturing appointment in current status: ${app.status}`);
    }
    if (app.capturingAppointment?.rescheduledAt) {
      throw new Error('This appointment has already been rescheduled by the OIC. The appointment is locked and no further date changes are permitted.');
    }

    const slot = this.state.capturingSlots.find(s => s.id === slotId);
    if (!slot) throw new Error('Capturing slot not found');

    if (slot.isBlocked) throw new Error('Selected date/time slot is blocked by ID Unit');
    if (slot.bookedCount + app.numberOfEmployees > slot.capacity) {
      throw new Error(`Insufficient slot capacity. Requested ${app.numberOfEmployees} persons, but only ${slot.capacity - slot.bookedCount} spaces remain.`);
    }

    // If previously booked, release previous slot capacity first
    if (app.capturingAppointment && app.capturingAppointment.slotId) {
      const prevSlot = this.state.capturingSlots.find(s => s.id === app.capturingAppointment?.slotId);
      if (prevSlot && prevSlot.id !== slot.id) {
        prevSlot.bookedCount = Math.max(0, prevSlot.bookedCount - app.numberOfEmployees);
      }
    }

    slot.bookedCount += app.numberOfEmployees;

    const appointment: CapturingAppointment = {
      id: `apt-${Date.now()}`,
      applicationId: appId,
      slotId: slot.id,
      companyId: app.companyId,
      companyName: app.companyName,
      applicationReference: app.referenceNumber,
      portId: app.portId,
      portName: app.portName,
      scheduledForDate: slot.slotDate,
      scheduledTimeSlot: `${slot.startTime} - ${slot.endTime}`,
      venue: slot.locationVenue,
      numberOfPersons: app.numberOfEmployees,
      status: 'SCHEDULED',
      bookedByUserId: user.id,
      bookedByUserName: user.fullName,
      createdAt: new Date().toISOString()
    };

    app.capturingAppointment = appointment;
    app.status = 'CAPTURING_SCHEDULED';
    app.updatedAt = new Date().toISOString();

    this.state.capturingAppointments.push(appointment);

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: 'READY_FOR_SCHEDULING',
      newStatus: 'CAPTURING_SCHEDULED',
      responsibleUserId: user.id,
      responsibleUserName: user.fullName,
      responsibleRole: user.roles[0],
      remarks: `Biometric appointment booked for ${slot.slotDate} (${slot.startTime} - ${slot.endTime}) at ${slot.locationVenue}. (${app.numberOfEmployees} applicant${app.numberOfEmployees > 1 ? 's' : ''}).`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'CAPTURING_APPOINTMENT_BOOKED',
      entityName: 'CAPTURING_APPOINTMENT',
      entityId: appointment.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { referenceNumber: app.referenceNumber, companyName: app.companyName, date: slot.slotDate, timeSlot: appointment.scheduledTimeSlot, numberOfPersons: app.numberOfEmployees }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Biometric Appointment Confirmed',
        message: `Appointment confirmed for ${app.referenceNumber} on ${slot.slotDate} (${slot.startTime} - ${slot.endTime}) at ${slot.locationVenue}. (${app.numberOfEmployees} applicant${app.numberOfEmployees > 1 ? 's' : ''}).`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    // Notify ID Unit officers
    const idOfficers = this.state.users.filter(u => u.roles.includes('OIC_ID_UNIT') && (!u.assignedPortId || u.assignedPortId === app.portId));
    idOfficers.forEach(officer => {
      this.createNotification({
        userId: officer.id,
        title: 'New Biometric Appointment Booked',
        message: `${app.companyName} booked capturing appointment for ${app.numberOfEmployees} person(s) on ${slot.slotDate} (${slot.startTime} - ${slot.endTime}) at ${slot.locationVenue}.`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return { application: app, appointment, slot };
  }

  rescheduleAppointment(appointmentId: string, newSlotId: string, user: User, reason?: string) {
    const apt = this.state.capturingAppointments.find(a => a.id === appointmentId);
    if (!apt) throw new Error('Capturing appointment not found');

    const app = this.state.applications.find(a => a.id === apt.applicationId);
    if (!app) throw new Error('Application not found');
    if (apt.rescheduledAt || app.capturingAppointment?.rescheduledAt) {
      throw new Error('This appointment has already been rescheduled once. Further rescheduling is not permitted.');
    }

    const oldSlot = this.state.capturingSlots.find(s => s.id === apt.slotId);
    const newSlot = this.state.capturingSlots.find(s => s.id === newSlotId);
    if (!newSlot) throw new Error('New capturing slot not found');
    if (newSlot.isBlocked) throw new Error('Target date/time slot is blocked by ID Unit');

    // Capacity check
    if (newSlot.id !== apt.slotId && (newSlot.bookedCount + apt.numberOfPersons > newSlot.capacity)) {
      throw new Error(`Insufficient slot capacity. Requested ${apt.numberOfPersons} persons, but only ${newSlot.capacity - newSlot.bookedCount} spaces remain.`);
    }

    // Release old slot capacity
    if (oldSlot && oldSlot.id !== newSlot.id) {
      oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - apt.numberOfPersons);
      newSlot.bookedCount += apt.numberOfPersons;
    }

    const oldDetails = `${apt.scheduledForDate} (${apt.scheduledTimeSlot})`;
    apt.slotId = newSlot.id;
    apt.scheduledForDate = newSlot.slotDate;
    apt.scheduledTimeSlot = `${newSlot.startTime} - ${newSlot.endTime}`;
    apt.venue = newSlot.locationVenue;
    apt.status = 'RESCHEDULED';
    apt.rescheduledAt = new Date().toISOString();

    if (app.capturingAppointment) {
      app.capturingAppointment.slotId = newSlot.id;
      app.capturingAppointment.scheduledForDate = newSlot.slotDate;
      app.capturingAppointment.scheduledTimeSlot = `${newSlot.startTime} - ${newSlot.endTime}`;
      app.capturingAppointment.venue = newSlot.locationVenue;
      app.capturingAppointment.status = 'SCHEDULED';
      app.capturingAppointment.rescheduledAt = apt.rescheduledAt;
    }
    app.status = 'CAPTURING_SCHEDULED';
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: app.id,
      previousStatus: 'CAPTURING_SCHEDULED',
      newStatus: 'CAPTURING_SCHEDULED',
      responsibleUserId: user.id,
      responsibleUserName: user.fullName,
      responsibleRole: user.roles[0],
      remarks: `Biometric appointment rescheduled from ${oldDetails} to ${newSlot.slotDate} (${newSlot.startTime} - ${newSlot.endTime}). Reason: ${reason || 'Operational adjustment'}.`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'CAPTURING_APPOINTMENT_RESCHEDULED',
      entityName: 'CAPTURING_APPOINTMENT',
      entityId: apt.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { referenceNumber: app.referenceNumber, newDate: newSlot.slotDate, newTimeSlot: apt.scheduledTimeSlot, reason }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Biometric Appointment Rescheduled',
        message: `Biometric appointment for ${app.referenceNumber} was rescheduled to ${newSlot.slotDate} (${newSlot.startTime} - ${newSlot.endTime}) at ${newSlot.locationVenue}. Reason: ${reason || 'Operational adjustment'}.`,
        applicationId: app.id,
        applicationReference: app.referenceNumber
      });
    });

    // Notify ID Unit officers
    const idOfficers = this.state.users.filter(u => u.roles.includes('OIC_ID_UNIT') && (!u.assignedPortId || u.assignedPortId === app.portId));
    idOfficers.forEach(officer => {
      this.createNotification({
        userId: officer.id,
        title: 'Biometric Appointment Rescheduled',
        message: `${app.companyName} rescheduled capturing appointment for ${app.referenceNumber} to ${newSlot.slotDate} (${newSlot.startTime} - ${newSlot.endTime}).`,
        applicationId: app.id,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return { appointment: apt, application: app, newSlot };
  }

  cancelAppointment(appointmentId: string, user: User, reason?: string) {
    const apt = this.state.capturingAppointments.find(a => a.id === appointmentId);
    if (!apt) throw new Error('Capturing appointment not found');

    const app = this.state.applications.find(a => a.id === apt.applicationId);
    if (!app) throw new Error('Application not found');

    const slot = this.state.capturingSlots.find(s => s.id === apt.slotId);
    if (slot) {
      // Release slot capacity back into availability
      slot.bookedCount = Math.max(0, slot.bookedCount - apt.numberOfPersons);
    }

    apt.status = 'CANCELLED';
    apt.cancelledAt = new Date().toISOString();
    apt.cancellationReason = reason || 'Cancelled by user/officer';

    if (app.capturingAppointment) {
      app.capturingAppointment.status = 'CANCELLED';
      app.capturingAppointment.cancelledAt = apt.cancelledAt;
      app.capturingAppointment.cancellationReason = apt.cancellationReason;
    }
    app.status = 'READY_FOR_SCHEDULING';
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: app.id,
      previousStatus: 'CAPTURING_SCHEDULED',
      newStatus: 'READY_FOR_SCHEDULING',
      responsibleUserId: user.id,
      responsibleUserName: user.fullName,
      responsibleRole: user.roles[0],
      remarks: `Biometric capturing appointment cancelled. Slot released into availability. Reason: ${reason || 'Cancelled'}.`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'CAPTURING_APPOINTMENT_CANCELLED',
      entityName: 'CAPTURING_APPOINTMENT',
      entityId: apt.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0],
      details: { referenceNumber: app.referenceNumber, date: apt.scheduledForDate, reason }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Biometric Appointment Cancelled',
        message: `Biometric capturing appointment for ${app.referenceNumber} on ${apt.scheduledForDate} was cancelled. Slot released. You can re-schedule anytime.`,
        applicationId: app.id,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return { appointment: apt, application: app, releasedSlot: slot };
  }

  // --- WORKFLOW TRANSITION: RECORD CAPTURING COMPLETION ---
  recordCapturingCompletion(appId: string, officer: User, outcomes: Array<{ employeeId: string; status: 'CAPTURED' | 'ABSENT' | 'RESCHEDULED' | 'CAPTURING_UNSUCCESSFUL'; notes?: string }>) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    outcomes.forEach(out => {
      const emp = app.employees.find(e => e.id === out.employeeId);
      if (emp) {
        emp.capturingStatus = out.status;
      }
    });

    const anyCaptured = app.employees.some(e => e.capturingStatus === 'CAPTURED');
    const newStatus: WorkflowStatus = anyCaptured ? 'AWAITING_PASS_PRODUCTION' : 'CAPTURING_SCHEDULED';

    app.status = newStatus;
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: 'CAPTURING_SCHEDULED',
      newStatus: newStatus,
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'OIC_ID_UNIT',
      remarks: `Biometric capturing recorded by ID Unit. Outcome: ${outcomes.map(o => o.status).join(', ')}.`,
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'CAPTURING_COMPLETION_RECORDED',
      entityName: 'APPLICATION',
      entityId: appId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'OIC_ID_UNIT',
      details: { referenceNumber: app.referenceNumber, outcomes }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: anyCaptured ? 'Biometric Capturing Completed' : 'Biometric Capturing Attendance Recorded',
        message: anyCaptured
          ? `Biometric capturing for ${app.referenceNumber} has been successfully completed at the Port ID Unit. Passes are now in production queue.`
          : `Biometric capturing attendance recorded for ${app.referenceNumber}. Some applicants may need to reschedule.`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: MARK PASS READY FOR COLLECTION ---
  markPassReady(appId: string, officer: User) {
    const app = this.state.applications.find(a => a.id === appId);
    if (!app) throw new Error('Application not found');

    const port = this.state.ports.find(p => p.id === app.portId) || this.state.ports[0];
    const passType = this.state.passTypes.find(pt => pt.id === app.passTypeId) || this.state.passTypes[0];

    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (passType.maxValidityDays || 365));
    const expiryStr = expiry.toISOString().split('T')[0];

    if (!app.passes) app.passes = [];

    app.employees.forEach((emp, idx) => {
      if (emp.capturingStatus === 'CAPTURED') {
        const serial = `NPA-PASS-${port.code}-${new Date().getFullYear()}-${String(this.state.passes.length + idx + 1).padStart(6, '0')}`;
        emp.passNumber = serial;

        const pass: PassRecord = {
          id: `pass-${Date.now()}-${idx}`,
          serialNumber: serial,
          applicationId: app.id,
          applicationReference: app.referenceNumber,
          employeeId: emp.id,
          employeeName: emp.fullName,
          companyId: app.companyId,
          companyName: app.companyName,
          portId: app.portId,
          portName: app.portName,
          passTypeCode: passType.code,
          validFrom: today,
          validUntil: expiryStr,
          status: 'AWAITING_COLLECTION',
          qrToken: `NPA-SECURE:${serial}:${emp.fullName}:${expiryStr}`,
          issuedAt: new Date().toISOString()
        };

        app.passes!.push(pass);
        this.state.passes.push(pass);
      }
    });

    app.status = 'PASS_READY_FOR_COLLECTION';
    app.updatedAt = new Date().toISOString();

    this.state.workflowLogs.unshift({
      id: `wl-${Date.now()}`,
      applicationId: appId,
      previousStatus: 'AWAITING_PASS_PRODUCTION',
      newStatus: 'PASS_READY_FOR_COLLECTION',
      responsibleUserId: officer.id,
      responsibleUserName: officer.fullName,
      responsibleRole: 'OIC_ID_UNIT',
      remarks: 'Port pass produced and marked ready for physical collection at ID Unit counter.',
      createdAt: new Date().toISOString()
    });

    this.logAudit({
      action: 'PASS_READY_FOR_COLLECTION',
      entityName: 'APPLICATION',
      entityId: appId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'OIC_ID_UNIT',
      details: { referenceNumber: app.referenceNumber, passCount: app.passes.length }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Port Passes Ready for Collection!',
        message: `Your port passes for application ${app.referenceNumber} have been printed and are ready for pickup at ${port.name} ID Unit.`,
        applicationId: appId,
        applicationReference: app.referenceNumber
      });
    });

    this.saveToDisk();
    return app;
  }

  // --- WORKFLOW TRANSITION: RECORD PASS COLLECTION ---
  recordPassCollection(passId: string, officer: User, collectionData: {
    collectedByName: string;
    collectorIdType: string;
    collectorIdReference: string;
    collectorPhone: string;
    notes?: string;
  }) {
    const pass = this.state.passes.find(p => p.id === passId);
    if (!pass) throw new Error('Pass not found');

    pass.status = 'COLLECTED';
    pass.collectionInfo = {
      ...collectionData,
      issuingOfficerName: officer.fullName,
      collectedAt: new Date().toISOString()
    };

    // Update parent application
    const app = this.state.applications.find(a => a.id === pass.applicationId);
    if (app) {
      const appPass = app.passes?.find(p => p.id === passId);
      if (appPass) {
        appPass.status = 'COLLECTED';
        appPass.collectionInfo = pass.collectionInfo;
      }
      const allCollected = app.passes?.every(p => p.status === 'COLLECTED');
      if (allCollected) {
        app.status = 'COLLECTED';
        app.updatedAt = new Date().toISOString();
      }
    }

    this.logAudit({
      action: 'PASS_COLLECTION_RECORDED',
      entityName: 'PASS',
      entityId: passId,
      userId: officer.id,
      userName: officer.fullName,
      userRole: 'OIC_ID_UNIT',
      details: { serialNumber: pass.serialNumber, ...collectionData }
    });

    // Notify company
    const companyAdmins = this.state.users.filter(u => u.companyId === app?.companyId);
    companyAdmins.forEach(cUser => {
      this.createNotification({
        userId: cUser.id,
        title: 'Port Pass Collected & Activated',
        message: `Port Pass ${pass.serialNumber} (${pass.employeeName}) for ${app?.referenceNumber} has been officially collected by ${collectionData.collectedByName}. Access badge is now active.`,
        applicationId: app?.id,
        applicationReference: app?.referenceNumber
      });
    });

    this.saveToDisk();
    return pass;
  }

  // --- CAPTURING SLOT MANAGEMENT ---
  createCapturingSlot(slotData: Omit<CapturingSlot, 'id' | 'bookedCount'>) {
    const newSlot: CapturingSlot = {
      id: `slot-${Date.now()}`,
      bookedCount: 0,
      ...slotData
    };
    this.state.capturingSlots.push(newSlot);
    this.saveToDisk();
    return newSlot;
  }

  toggleBlockSlot(slotId: string) {
    const slot = this.state.capturingSlots.find(s => s.id === slotId);
    if (slot) {
      slot.isBlocked = !slot.isBlocked;
      this.saveToDisk();
    }
    return slot;
  }

  // --- SMTP SETTINGS & EMAIL LOGS ---
  updateSmtpSettings(settings: Partial<SmtpSettings>, officer: User) {
    this.state.smtpSettings = {
      ...this.state.smtpSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };

    this.logAudit({
      action: 'SMTP_SETTINGS_UPDATED',
      entityName: 'SMTP_SETTINGS',
      entityId: this.state.smtpSettings.id,
      userId: officer.id,
      userName: officer.fullName,
      userRole: officer.roles[0],
      details: { host: this.state.smtpSettings.host, port: this.state.smtpSettings.port, encryption: this.state.smtpSettings.encryptionType }
    });

    this.saveToDisk();
    return this.state.smtpSettings;
  }

  logEmailNotification(log: Omit<EmailNotificationLog, 'id' | 'dispatchedAt'>) {
    const newLog: EmailNotificationLog = {
      id: `elog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dispatchedAt: new Date().toISOString(),
      ...log
    };
    this.state.emailLogs.unshift(newLog);
    this.saveToDisk();
    return newLog;
  }

  // --- SYSTEM SETTINGS ---
  updateSystemSettings(settings: Partial<SystemSettings>, officer: User) {
    this.state.systemSettings = {
      ...this.state.systemSettings,
      ...settings
    };

    this.logAudit({
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityName: 'SYSTEM_SETTINGS',
      userId: officer.id,
      userName: officer.fullName,
      userRole: officer.roles[0],
      details: settings
    });

    this.saveToDisk();
    return this.state.systemSettings;
  }

  // --- PASSWORD RESET ENGINE ---
  findUserByIdentifier(identifier: string): { user: User; company?: Company } | null {
    const cleanInput = (identifier || '').trim().toLowerCase();
    const cleanInputCac = cleanInput.toUpperCase().replace(/[\s\-\/\.]/g, '');

    // 1. Direct match on user email
    let user = this.state.users.find(u => u.email.toLowerCase() === cleanInput);
    let company: Company | undefined;

    if (user && user.companyId) {
      company = this.state.companies.find(c => c.id === user!.companyId);
    }

    // 2. Match by registered company official email or CAC registration number
    if (!user) {
      company = this.state.companies.find(c => {
        const compEmail = (c.email || '').trim().toLowerCase();
        const compCac = (c.cacNumber || '').trim().toUpperCase().replace(/[\s\-\/\.]/g, '');
        return compEmail === cleanInput || (cleanInputCac.length >= 4 && compCac === cleanInputCac);
      });

      if (company) {
        user = this.state.users.find(u => u.companyId === company!.id && u.roles.includes('COMPANY_ADMIN')) ||
               this.state.users.find(u => u.companyId === company!.id);
      }
    }

    if (!user) return null;
    return { user, company };
  }

  createPasswordResetRequest(identifier: string) {
    const found = this.findUserByIdentifier(identifier);
    if (!found) {
      throw new Error('No registered account or corporate entity found with the provided email address or CAC registration number.');
    }

    const { user, company } = found;
    // Generate secure 6-digit PIN
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = 15;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    const emailKey = user.email.toLowerCase();
    this.passwordResetRequests.set(emailKey, {
      email: user.email,
      code,
      expiresAt,
      createdAt: new Date().toISOString(),
      attempts: 0,
      userId: user.id,
      companyName: company?.companyName
    });

    // Mask email for user privacy display (e.g. dangote@portlogistics.ng -> d***e@portlogistics.ng)
    const emailParts = user.email.split('@');
    let maskedEmail = user.email;
    if (emailParts.length === 2) {
      const [local, domain] = emailParts;
      if (local.length <= 2) {
        maskedEmail = `${local[0]}*@${domain}`;
      } else {
        maskedEmail = `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`;
      }
    }

    this.logAudit({
      action: 'PASSWORD_RESET_REQUESTED',
      entityName: 'USER',
      entityId: user.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0] || 'COMPANY_ADMIN',
      details: {
        email: user.email,
        companyName: company?.companyName,
        expiresInMinutes
      }
    });

    return {
      user,
      company,
      code,
      expiresAt,
      expiresInMinutes,
      maskedEmail
    };
  }

  completePasswordReset(identifier: string, code: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters in length.');
    }

    const found = this.findUserByIdentifier(identifier);
    if (!found) {
      throw new Error('No registered account found for this password reset.');
    }

    const { user, company } = found;
    const emailKey = user.email.toLowerCase();
    const request = this.passwordResetRequests.get(emailKey);

    if (!request) {
      throw new Error('No active password reset request found. Please request a new verification code.');
    }

    if (Date.now() > request.expiresAt) {
      this.passwordResetRequests.delete(emailKey);
      throw new Error('The verification code has expired (valid for 15 minutes). Please request a new code.');
    }

    request.attempts += 1;
    if (request.attempts > 5) {
      this.passwordResetRequests.delete(emailKey);
      throw new Error('Too many failed verification attempts. For security reasons, please request a new verification PIN.');
    }

    if (request.code.trim() !== code.trim()) {
      throw new Error('Invalid verification code. Please check your email and enter the correct 6-digit PIN.');
    }

    // Success! Update user password
    user.password = newPassword.trim();
    this.passwordResetRequests.delete(emailKey);

    // Create In-App Notification
    this.createNotification({
      userId: user.id,
      title: 'Password Updated Successfully',
      message: `Your corporate access password was successfully reset on ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}.`
    });

    this.logAudit({
      action: 'PASSWORD_RESET_COMPLETED',
      entityName: 'USER',
      entityId: user.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roles[0] || 'COMPANY_ADMIN',
      details: {
        email: user.email,
        companyName: company?.companyName
      }
    });

    this.saveToDisk();
    return { success: true, user, company };
  }
}

export const db = new DatabaseStore();
