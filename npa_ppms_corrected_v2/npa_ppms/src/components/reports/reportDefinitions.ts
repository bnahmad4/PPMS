import { ReportColumnDef, ReportDataset, ReportFilterConfig, ReportTemplate } from '../../types';

export interface DatasetColumnConfig {
  id: string;
  label: string;
  category: 'IDENTITY' | 'FINANCE' | 'SECURITY' | 'BIOMETRICS' | 'OPERATIONS';
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'badge' | 'number';
  getValue: (item: any) => any;
  render?: (val: any, item: any) => React.ReactNode;
}

export const DATASET_OPTIONS: Array<{ id: ReportDataset; label: string; description: string; icon: string }> = [
  {
    id: 'APPLICATIONS',
    label: 'Applications & Workflow Dossiers',
    description: 'Comprehensive tracking of all port pass applications across ports, categories, and vetting stages.',
    icon: 'FileText'
  },
  {
    id: 'FINANCIAL_BILLING',
    label: 'Oracle EBS & Remita Collections',
    description: 'Financial registers, statutory billing assessments, Remita RRRs, and TSA verified treasury receipts.',
    icon: 'CreditCard'
  },
  {
    id: 'PASSES_BIOMETRICS',
    label: 'Issued Port Passes & Biometrics',
    description: 'RFID/NFC card serials, biometric capture status, zone access rights, and collection registers.',
    icon: 'BadgeCheck'
  },
  {
    id: 'COMPANIES_AUDIT',
    label: 'Concessionaires & Sponsoring Companies',
    description: 'Terminal operators, shipping agencies, and leaseholders with workforce headcounts and compliance.',
    icon: 'Building2'
  },
  {
    id: 'SECURITY_CLEARANCE',
    label: 'GM Security Approvals & Clearances',
    description: 'Port security clearances, GM security decisions, risk classifications, and access permissions.',
    icon: 'ShieldCheck'
  },
  {
    id: 'AUDIT_LOGS',
    label: 'System Audit Trail & Officer Activity',
    description: 'Immutable regulatory log of all officer actions, payment verifications, and approvals.',
    icon: 'History'
  }
];

export const DATASET_COLUMNS: Record<ReportDataset, DatasetColumnConfig[]> = {
  APPLICATIONS: [
    { id: 'referenceNumber', label: 'Reference Number', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.referenceNumber },
    { id: 'companyName', label: 'Company / Concessionaire', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.companyName },
    { id: 'portName', label: 'Port Complex', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.portName },
    { id: 'categoryName', label: 'Customer Category', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.categoryName },
    { id: 'passTypeName', label: 'Pass Type', category: 'OPERATIONS', defaultVisible: false, format: 'text', getValue: i => i.passTypeName || 'Annual Port Pass' },
    { id: 'numberOfEmployees', label: 'Staff Count', category: 'OPERATIONS', defaultVisible: true, align: 'right', format: 'number', getValue: i => i.numberOfEmployees || i.employees?.length || 1 },
    { id: 'status', label: 'Workflow Status', category: 'OPERATIONS', defaultVisible: true, format: 'badge', getValue: i => i.status },
    { id: 'submittedAt', label: 'Submitted Date', category: 'OPERATIONS', defaultVisible: true, format: 'date', getValue: i => i.submittedAt },
    { id: 'oracleBillReference', label: 'Oracle Bill Ref', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.bill?.oracleBillReference || '-' },
    { id: 'rrrNumber', label: 'Remita RRR', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.bill?.rrrNumber || '-' },
    { id: 'amountNgn', label: 'Billed Amount (NGN)', category: 'FINANCE', defaultVisible: true, align: 'right', format: 'currency', getValue: i => i.bill?.amountNgn || 0 },
    { id: 'paymentStatus', label: 'Payment Verification', category: 'FINANCE', defaultVisible: true, format: 'badge', getValue: i => i.payment?.verificationStatus || (i.bill ? 'AWAITING_PAYMENT' : 'UNBILLED') },
    { id: 'paymentDate', label: 'Payment Date', category: 'FINANCE', defaultVisible: false, format: 'date', getValue: i => i.payment?.paymentDate },
    { id: 'validityMonths', label: 'Validity Period', category: 'OPERATIONS', defaultVisible: false, align: 'right', format: 'text', getValue: i => `${i.validityPeriodMonths || 12} Mos` },
    { id: 'justification', label: 'Operational Justification', category: 'IDENTITY', defaultVisible: false, format: 'text', getValue: i => i.justification || '-' }
  ],

  FINANCIAL_BILLING: [
    { id: 'oracleBillReference', label: 'Oracle Bill Ref', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.bill?.oracleBillReference || i.oracleBillReference || '-' },
    { id: 'rrrNumber', label: 'Remita RRR Number', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.bill?.rrrNumber || i.rrrNumber || '-' },
    { id: 'referenceNumber', label: 'Dossier Ref', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.referenceNumber },
    { id: 'companyName', label: 'Company / Payer', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.companyName },
    { id: 'portName', label: 'Port Complex', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.portName },
    { id: 'categoryName', label: 'Tariff Category', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.categoryName },
    { id: 'amountNgn', label: 'Tariff Amount (NGN)', category: 'FINANCE', defaultVisible: true, align: 'right', format: 'currency', getValue: i => i.bill?.amountNgn || i.amountNgn || 0 },
    { id: 'billingDate', label: 'Billing Assessment Date', category: 'FINANCE', defaultVisible: true, format: 'date', getValue: i => i.bill?.billingDate || i.billingDate },
    { id: 'paymentDeadline', label: 'Payment Deadline', category: 'FINANCE', defaultVisible: false, format: 'date', getValue: i => i.bill?.paymentDeadline },
    { id: 'receiptReference', label: 'CBN Remita Receipt', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.payment?.receiptReference || '-' },
    { id: 'paymentStatus', label: 'TSA Settlement Status', category: 'FINANCE', defaultVisible: true, format: 'badge', getValue: i => i.payment?.verificationStatus || (i.bill ? 'AWAITING_PAYMENT' : 'UNBILLED') },
    { id: 'paymentDate', label: 'Payment Date', category: 'FINANCE', defaultVisible: true, format: 'date', getValue: i => i.payment?.paymentDate },
    { id: 'verifiedByName', label: 'Verified By Officer', category: 'FINANCE', defaultVisible: true, format: 'text', getValue: i => i.payment?.verifiedByOfficerName || '-' },
    { id: 'verifiedAt', label: 'Verification Date', category: 'FINANCE', defaultVisible: false, format: 'datetime', getValue: i => i.payment?.verifiedAt }
  ],

  PASSES_BIOMETRICS: [
    { id: 'serialNumber', label: 'Pass Card Serial', category: 'BIOMETRICS', defaultVisible: true, format: 'text', getValue: i => i.serialNumber },
    { id: 'employeeName', label: 'Cardholder Name', category: 'BIOMETRICS', defaultVisible: true, format: 'text', getValue: i => i.employeeName },
    { id: 'companyName', label: 'Sponsoring Company', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.companyName },
    { id: 'portName', label: 'Authorized Port', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.portName },
    { id: 'passTypeName', label: 'Pass Category', category: 'BIOMETRICS', defaultVisible: true, format: 'text', getValue: i => i.passTypeName },
    { id: 'zoneAccess', label: 'Access Zones', category: 'SECURITY', defaultVisible: true, format: 'text', getValue: i => i.zoneAccess || 'All Standard Gates' },
    { id: 'status', label: 'Card Status', category: 'BIOMETRICS', defaultVisible: true, format: 'badge', getValue: i => i.status },
    { id: 'issuedAt', label: 'Issuance Date', category: 'OPERATIONS', defaultVisible: true, format: 'date', getValue: i => i.issuedAt },
    { id: 'expiresAt', label: 'Card Expiry Date', category: 'OPERATIONS', defaultVisible: true, format: 'date', getValue: i => i.expiresAt },
    { id: 'rfidUid', label: 'NFC / RFID UID', category: 'BIOMETRICS', defaultVisible: false, format: 'text', getValue: i => i.rfidUid || '-' },
    { id: 'collectedBy', label: 'Collected By', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.collectedBy || (i.status === 'ACTIVE' ? 'Cardholder' : 'Pending Collection') },
    { id: 'collectedAt', label: 'Collection Timestamp', category: 'OPERATIONS', defaultVisible: false, format: 'datetime', getValue: i => i.collectedAt }
  ],

  COMPANIES_AUDIT: [
    { id: 'companyName', label: 'Company / Concessionaire', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.companyName },
    { id: 'cacNumber', label: 'CAC Registration No', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.cacNumber || '-' },
    { id: 'tinNumber', label: 'FIRS Tax ID (TIN)', category: 'FINANCE', defaultVisible: false, format: 'text', getValue: i => i.tinNumber || '-' },
    { id: 'primaryPort', label: 'Primary Operating Port', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.portName || i.primaryPort || '-' },
    { id: 'categoryName', label: 'Concession Category', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.categoryName || 'Port Concessionaire' },
    { id: 'status', label: 'Compliance Status', category: 'SECURITY', defaultVisible: true, format: 'badge', getValue: i => i.status || 'ACTIVE' },
    { id: 'mdCeoName', label: 'MD / CEO Name', category: 'IDENTITY', defaultVisible: false, format: 'text', getValue: i => i.mdCeoName || '-' },
    { id: 'totalApplications', label: 'Dossiers Submitted', category: 'OPERATIONS', defaultVisible: true, align: 'right', format: 'number', getValue: i => i.totalApplications || 1 },
    { id: 'totalActivePasses', label: 'Active Cardholders', category: 'BIOMETRICS', defaultVisible: true, align: 'right', format: 'number', getValue: i => i.totalActivePasses || i.numberOfEmployees || 0 },
    { id: 'totalBilledNgn', label: 'Cumulative Billed (NGN)', category: 'FINANCE', defaultVisible: true, align: 'right', format: 'currency', getValue: i => i.totalBilledNgn || i.bill?.amountNgn || 0 },
    { id: 'email', label: 'Official Contact Email', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.email || '-' },
    { id: 'phone', label: 'Contact Phone', category: 'IDENTITY', defaultVisible: false, format: 'text', getValue: i => i.phone || '-' }
  ],

  SECURITY_CLEARANCE: [
    { id: 'referenceNumber', label: 'Reference Number', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.referenceNumber },
    { id: 'companyName', label: 'Company Name', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.companyName },
    { id: 'portName', label: 'Port Complex', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.portName },
    { id: 'categoryName', label: 'Operational Category', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.categoryName },
    { id: 'numberOfEmployees', label: 'Personnel Vetted', category: 'OPERATIONS', defaultVisible: true, align: 'right', format: 'number', getValue: i => i.numberOfEmployees || 1 },
    { id: 'securityStatus', label: 'GM Security Clearance', category: 'SECURITY', defaultVisible: true, format: 'badge', getValue: i => {
      if (['GM_SECURITY_APPROVED', 'READY_FOR_SCHEDULING', 'CAPTURING_SCHEDULED', 'PASS_READY_FOR_COLLECTION', 'COLLECTED'].includes(i.status)) return 'SECURITY_CLEARED';
      if (i.status === 'PENDING_GM_SECURITY_APPROVAL') return 'SECURITY_REVIEW_PENDING';
      if (i.status === 'RETURNED_TO_ID_UNIT') return 'SECURITY_RETURNED';
      if (i.status === 'REJECTED') return 'SECURITY_DENIED';
      return 'VETTING_IN_PROGRESS';
    }},
    { id: 'riskClassification', label: 'Risk Rating', category: 'SECURITY', defaultVisible: true, format: 'badge', getValue: i => i.categoryId === 'cat-terminal' ? 'RESTRICTED_ACCESS' : 'STANDARD_ACCESS' },
    { id: 'submittedAt', label: 'Vetting Initiated', category: 'OPERATIONS', defaultVisible: true, format: 'date', getValue: i => i.submittedAt },
    { id: 'gmOfficerName', label: 'Clearing Authority', category: 'SECURITY', defaultVisible: true, format: 'text', getValue: () => 'General Manager, Security Division' },
    { id: 'justification', label: 'Access Purpose', category: 'IDENTITY', defaultVisible: false, format: 'text', getValue: i => i.justification || '-' }
  ],

  AUDIT_LOGS: [
    { id: 'createdAt', label: 'Timestamp', category: 'OPERATIONS', defaultVisible: true, format: 'datetime', getValue: i => i.createdAt },
    { id: 'action', label: 'Audit Action Code', category: 'OPERATIONS', defaultVisible: true, format: 'badge', getValue: i => i.action },
    { id: 'entityName', label: 'Target Entity', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => i.entityName },
    { id: 'userName', label: 'Acting Officer', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.userName },
    { id: 'userRole', label: 'Officer Role', category: 'IDENTITY', defaultVisible: true, format: 'text', getValue: i => i.userRole },
    { id: 'ipAddress', label: 'IP Address', category: 'SECURITY', defaultVisible: true, format: 'text', getValue: i => i.ipAddress || '127.0.0.1' },
    { id: 'detailsSummary', label: 'Action Summary', category: 'OPERATIONS', defaultVisible: true, format: 'text', getValue: i => JSON.stringify(i.details || {}) }
  ]
};

// Date range calculation helpers
export const calculateDateBounds = (preset?: string, startCustom?: string, endCustom?: string): { start?: Date; end?: Date } => {
  const now = new Date();
  if (preset === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }
  if (preset === 'YESTERDAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    return { start, end };
  }
  if (preset === 'THIS_WEEK') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    return { start, end };
  }
  if (preset === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();
    return { start, end };
  }
  if (preset === 'LAST_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  if (preset === 'THIS_QUARTER') {
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date();
    return { start, end };
  }
  if (preset === 'YEAR_TO_DATE') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date();
    return { start, end };
  }
  if (preset === 'CUSTOM' && startCustom) {
    const start = new Date(startCustom);
    const end = endCustom ? new Date(endCustom) : new Date();
    end.setHours(23, 59, 59);
    return { start, end };
  }
  return {};
};

// Filter engine for datasets
export const filterDataset = (items: any[], config: ReportFilterConfig, dataset: ReportDataset): any[] => {
  if (!items || items.length === 0) return [];
  const { start, end } = calculateDateBounds(config.dateRangePreset, config.startDate, config.endDate);

  return items.filter(item => {
    // 1. Port filter
    if (config.portId && config.portId !== 'ALL') {
      const itemPort = item.portId || item.primaryPortId;
      if (itemPort && itemPort !== config.portId) return false;
    }

    // 2. Statuses filter
    if (config.statuses && config.statuses.length > 0) {
      if (!config.statuses.includes(item.status)) return false;
    }

    // 3. Payment status filter
    if (config.paymentStatus && config.paymentStatus !== 'ALL') {
      const payStatus = item.payment?.verificationStatus || (item.bill ? 'AWAITING_PAYMENT' : 'UNBILLED');
      if (config.paymentStatus === 'CONFIRMED' && payStatus !== 'CONFIRMED') return false;
      if (config.paymentStatus === 'PENDING' && !['PENDING', 'AWAITING_PAYMENT'].includes(payStatus)) return false;
      if (config.paymentStatus === 'UNDER_REVIEW' && item.status !== 'PAYMENT_UNDER_REVIEW') return false;
    }

    // 4. Category filter
    if (config.categoryId && config.categoryId !== 'ALL') {
      if (item.categoryId && item.categoryId !== config.categoryId) return false;
    }

    // 5. Date filtering
    if (start || end) {
      const dateField = config.dateField || 'submittedAt';
      const rawDate = item[dateField] || item.submittedAt || item.createdAt || item.issuedAt;
      if (rawDate) {
        const itemDate = new Date(rawDate);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
      }
    }

    // 6. Min / Max employees
    if (config.minEmployees != null && config.minEmployees > 0) {
      const count = item.numberOfEmployees || item.employees?.length || 1;
      if (count < config.minEmployees) return false;
    }
    if (config.maxEmployees != null && config.maxEmployees > 0) {
      const count = item.numberOfEmployees || item.employees?.length || 1;
      if (count > config.maxEmployees) return false;
    }

    // 7. Amount filters
    if (config.minAmount != null && config.minAmount > 0) {
      const amt = item.bill?.amountNgn || item.amountNgn || 0;
      if (amt < config.minAmount) return false;
    }
    if (config.maxAmount != null && config.maxAmount > 0) {
      const amt = item.bill?.amountNgn || item.amountNgn || 0;
      if (amt > config.maxAmount) return false;
    }

    // 8. Search query
    if (config.searchTerm && config.searchTerm.trim() !== '') {
      const term = config.searchTerm.toLowerCase().trim();
      const searchableStr = [
        item.referenceNumber,
        item.companyName,
        item.portName,
        item.categoryName,
        item.status,
        item.serialNumber,
        item.employeeName,
        item.bill?.oracleBillReference,
        item.bill?.rrrNumber,
        item.cacNumber
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableStr.includes(term)) return false;
    }

    return true;
  });
};

// Grouping engine
export interface GroupedReportData {
  groupKey: string;
  groupLabel: string;
  items: any[];
  totalCount: number;
  totalAmountNgn: number;
  totalEmployees: number;
}

export const groupDataset = (items: any[], groupBy?: string): GroupedReportData[] => {
  if (!groupBy || groupBy === 'NONE') {
    return [{
      groupKey: 'ALL',
      groupLabel: 'All Records',
      items,
      totalCount: items.length,
      totalAmountNgn: items.reduce((sum, i) => sum + (i.bill?.amountNgn || i.amountNgn || 0), 0),
      totalEmployees: items.reduce((sum, i) => sum + (i.numberOfEmployees || i.employees?.length || 1), 0)
    }];
  }

  const groupsMap = new Map<string, any[]>();
  items.forEach(item => {
    let key = 'Other';
    if (groupBy === 'portName') key = item.portName || 'Unknown Port';
    else if (groupBy === 'status') key = item.status || 'Unknown Status';
    else if (groupBy === 'categoryName') key = item.categoryName || 'General';
    else if (groupBy === 'paymentStatus') key = item.payment?.verificationStatus || (item.bill ? 'AWAITING_PAYMENT' : 'UNBILLED');
    else if (item[groupBy]) key = String(item[groupBy]);

    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(item);
  });

  const result: GroupedReportData[] = [];
  groupsMap.forEach((groupItems, key) => {
    result.push({
      groupKey: key,
      groupLabel: key,
      items: groupItems,
      totalCount: groupItems.length,
      totalAmountNgn: groupItems.reduce((sum, i) => sum + (i.bill?.amountNgn || i.amountNgn || 0), 0),
      totalEmployees: groupItems.reduce((sum, i) => sum + (i.numberOfEmployees || i.employees?.length || 1), 0)
    });
  });

  return result;
};

// Export to CSV generator
export const generateCsvContent = (
  items: any[],
  columns: DatasetColumnConfig[],
  visibleColumnIds: string[]
): string => {
  const activeCols = columns.filter(c => visibleColumnIds.includes(c.id));
  const headers = activeCols.map(c => `"${c.label.replace(/"/g, '""')}"`);

  const rows = items.map(item => {
    return activeCols.map(col => {
      const val = col.getValue(item);
      if (val == null) return '""';
      if (typeof val === 'number') return val.toString();
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// Export to TSV for clipboard
export const generateTsvContent = (
  items: any[],
  columns: DatasetColumnConfig[],
  visibleColumnIds: string[]
): string => {
  const activeCols = columns.filter(c => visibleColumnIds.includes(c.id));
  const headers = activeCols.map(c => c.label);

  const rows = items.map(item => {
    return activeCols.map(col => {
      const val = col.getValue(item);
      if (val == null) return '';
      return String(val).replace(/[\t\n\r]/g, ' ');
    }).join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
};
