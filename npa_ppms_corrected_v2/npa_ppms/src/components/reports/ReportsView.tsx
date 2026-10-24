import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  RotateCw,
  SlidersHorizontal,
  Bookmark,
  Mail,
  Copy,
  Check,
  Code,
  Layers,
  ShieldCheck,
  FileText,
  CreditCard,
  BadgeCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  ReportSummaryStats,
  ReportTemplate,
  ReportFilterConfig,
  ReportDataset
} from '../../types';
import {
  DATASET_OPTIONS,
  DATASET_COLUMNS,
  filterDataset,
  groupDataset,
  generateCsvContent,
  generateTsvContent,
  DatasetColumnConfig
} from './reportDefinitions';
import { CustomReportBuilder } from './CustomReportBuilder';
import { VisualAnalyticsHub } from './VisualAnalyticsHub';
import { ReportTemplatesModal } from './ReportTemplatesModal';
import { ReportEmailModal } from './ReportEmailModal';
import { ReportPrintView } from './ReportPrintView';

export const ReportsView: React.FC = () => {
  const { currentPortId, ports, currentUser } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'STANDARD' | 'BUILDER' | 'ANALYTICS' | 'PRINT_PREVIEW'>('STANDARD');

  // Prebuilt standard report selection
  const [standardReportId, setStandardReportId] = useState<string>('SUMMARY');

  // Data states
  const [summary, setSummary] = useState<ReportSummaryStats | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Custom Builder Configuration State
  const [builderDataset, setBuilderDataset] = useState<ReportDataset>('APPLICATIONS');
  const [builderColumns, setBuilderColumns] = useState<string[]>([
    'referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'status', 'submittedAt', 'amountNgn'
  ]);
  const [filterConfig, setFilterConfig] = useState<ReportFilterConfig>({
    dataset: 'APPLICATIONS',
    portId: currentPortId !== 'ALL' ? currentPortId : 'ALL',
    dateRangePreset: 'ALL'
  });
  const [groupBy, setGroupBy] = useState<string>('NONE');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals & UI States
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedClipboard, setCopiedClipboard] = useState(false);

  // Fetch all core reporting data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, appsRes, passesRes, compsRes, auditRes, catsRes, tplsRes] = await Promise.all([
        api.getReportsSummary(),
        api.getApplications({ portId: currentPortId !== 'ALL' ? currentPortId : undefined }),
        api.getPasses({ portId: currentPortId !== 'ALL' ? currentPortId : undefined }),
        api.getCompanies(),
        api.getAuditLogs(),
        api.getCategories(),
        api.getReportTemplates().catch(() => ({ success: true, templates: [] }))
      ]);

      setSummary(sumRes.summary);
      setApplications(appsRes.applications || []);
      setPasses(passesRes.passes || []);
      setCompanies(compsRes.companies || []);
      setAuditLogs(auditRes.logs || []);
      setCategories(catsRes.categories || []);
      setTemplates(tplsRes.templates || []);
    } catch (err) {
      console.error('Error loading comprehensive reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPortId]);

  // Synchronize portId filter when top bar port switcher changes
  useEffect(() => {
    if (currentPortId && currentPortId !== 'ALL') {
      setFilterConfig(prev => ({ ...prev, portId: currentPortId }));
    }
  }, [currentPortId]);

  // Handle Standard Report selection presets
  useEffect(() => {
    if (activeTab !== 'STANDARD') return;

    if (standardReportId === 'SUMMARY') {
      setBuilderDataset('APPLICATIONS');
      setBuilderColumns(['referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'status', 'submittedAt', 'amountNgn']);
      setGroupBy('portName');
      setSortBy('submittedAt');
      setSortDirection('desc');
      setFilterConfig(prev => ({ ...prev, dataset: 'APPLICATIONS' }));
    } else if (standardReportId === 'BILLING_REGISTER') {
      setBuilderDataset('FINANCIAL_BILLING');
      setBuilderColumns(['oracleBillReference', 'rrrNumber', 'referenceNumber', 'companyName', 'portName', 'categoryName', 'amountNgn', 'paymentStatus', 'paymentDate', 'verifiedByName']);
      setGroupBy('paymentStatus');
      setSortBy('amountNgn');
      setSortDirection('desc');
      setFilterConfig(prev => ({ ...prev, dataset: 'FINANCIAL_BILLING' }));
    } else if (standardReportId === 'ID_UNIT') {
      setBuilderDataset('APPLICATIONS');
      setBuilderColumns(['referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'status', 'submittedAt']);
      setGroupBy('status');
      setSortBy('submittedAt');
      setSortDirection('desc');
      setFilterConfig(prev => ({
        ...prev,
        dataset: 'APPLICATIONS',
        statuses: ['PENDING_ID_UNIT_VERIFICATION', 'RETURNED_FOR_CORRECTION', 'ID_UNIT_VERIFIED']
      }));
    } else if (standardReportId === 'SECURITY') {
      setBuilderDataset('SECURITY_CLEARANCE');
      setBuilderColumns(['referenceNumber', 'companyName', 'portName', 'categoryName', 'numberOfEmployees', 'securityStatus', 'riskClassification', 'submittedAt']);
      setGroupBy('portName');
      setSortBy('submittedAt');
      setSortDirection('desc');
      setFilterConfig(prev => ({ ...prev, dataset: 'SECURITY_CLEARANCE' }));
    } else if (standardReportId === 'PASSES_BIO') {
      setBuilderDataset('PASSES_BIOMETRICS');
      setBuilderColumns(['serialNumber', 'employeeName', 'companyName', 'portName', 'passTypeName', 'zoneAccess', 'status', 'issuedAt', 'expiresAt', 'collectedBy']);
      setGroupBy('portName');
      setSortBy('issuedAt');
      setSortDirection('desc');
      setFilterConfig(prev => ({ ...prev, dataset: 'PASSES_BIOMETRICS' }));
    } else if (standardReportId === 'CONCESSIONAIRES') {
      setBuilderDataset('COMPANIES_AUDIT');
      setBuilderColumns(['companyName', 'cacNumber', 'primaryPort', 'categoryName', 'status', 'totalApplications', 'totalActivePasses', 'totalBilledNgn', 'email']);
      setGroupBy('primaryPort');
      setSortBy('totalBilledNgn');
      setSortDirection('desc');
      setFilterConfig(prev => ({ ...prev, dataset: 'COMPANIES_AUDIT' }));
    }
  }, [standardReportId, activeTab]);

  // Current active dataset items
  const currentDatasetItems = useMemo(() => {
    switch (builderDataset) {
      case 'APPLICATIONS':
        return applications;
      case 'FINANCIAL_BILLING':
        return applications.filter(a => a.bill || a.payment || a.status === 'PAYMENT_UNDER_REVIEW');
      case 'PASSES_BIOMETRICS':
        return passes.length > 0 ? passes : applications.flatMap(a => a.employees?.map((e: any) => ({
          serialNumber: e.passNumber || `NPA-PASS-${e.id?.substring(0, 6)?.toUpperCase()}`,
          employeeName: e.fullName,
          companyName: a.companyName,
          portName: a.portName,
          passTypeName: a.passTypeName,
          zoneAccess: 'ZONES 1, 2, 3 (ALL QUAYS)',
          status: a.status === 'COLLECTED' ? 'ACTIVE' : (a.status === 'PASS_READY_FOR_COLLECTION' ? 'READY' : 'PENDING'),
          issuedAt: a.updatedAt || a.submittedAt,
          expiresAt: '2027-10-01'
        })) || []);
      case 'COMPANIES_AUDIT':
        return companies.map(c => {
          const compApps = applications.filter(a => a.companyId === c.id || a.companyName === c.companyName);
          const totalStaff = compApps.reduce((s, a) => s + (a.numberOfEmployees || a.employees?.length || 1), 0);
          const totalBilled = compApps.reduce((s, a) => s + (a.bill?.amountNgn || 0), 0);
          const totalPaid = compApps.reduce((s, a) => s + (a.payment?.verificationStatus === 'CONFIRMED' ? (a.bill?.amountNgn || 0) : 0), 0);
          return {
            ...c,
            totalApplications: compApps.length,
            totalActivePasses: totalStaff,
            totalBilledNgn: totalBilled,
            totalPaidNgn: totalPaid,
            categoryName: compApps[0]?.categoryName || 'Port Concessionaire'
          };
        });
      case 'SECURITY_CLEARANCE':
        return applications;
      case 'AUDIT_LOGS':
        return auditLogs;
      default:
        return applications;
    }
  }, [builderDataset, applications, passes, companies, auditLogs]);

  // Filtered dataset
  const filteredDatasetItems = useMemo(() => {
    return filterDataset(currentDatasetItems, filterConfig, builderDataset);
  }, [currentDatasetItems, filterConfig, builderDataset]);

  // Current dataset column definitions
  const currentColumnsDef: DatasetColumnConfig[] = useMemo(() => {
    return DATASET_COLUMNS[builderDataset] || DATASET_COLUMNS.APPLICATIONS;
  }, [builderDataset]);

  // Filtered summary calculations
  const totalAmountNgn = useMemo(() => {
    return filteredDatasetItems.reduce((sum, item) => sum + (item.bill?.amountNgn || item.amountNgn || 0), 0);
  }, [filteredDatasetItems]);

  const totalHeadcount = useMemo(() => {
    return filteredDatasetItems.reduce((sum, item) => sum + (item.numberOfEmployees || item.employees?.length || 1), 0);
  }, [filteredDatasetItems]);

  // Apply a template
  const handleApplyTemplate = (tpl: ReportTemplate) => {
    setActiveTemplateId(tpl.id);
    setBuilderDataset(tpl.dataset);
    setBuilderColumns(tpl.selectedColumns);
    setFilterConfig(tpl.filters);
    if (tpl.groupBy) setGroupBy(tpl.groupBy);
    if (tpl.sortBy) setSortBy(tpl.sortBy);
    if (tpl.sortDirection) setSortDirection(tpl.sortDirection);
    setActiveTab('BUILDER');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const csvContent = generateCsvContent(filteredDatasetItems, currentColumnsDef, builderColumns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NPA_PPMS_Report_${builderDataset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredDatasetItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NPA_PPMS_Report_${builderDataset}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to Clipboard (TSV format for Excel/Sheets)
  const handleCopyClipboard = () => {
    const tsvContent = generateTsvContent(filteredDatasetItems, currentColumnsDef, builderColumns);
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 2500);
    });
  };

  // Print Official PDF
  const handlePrint = () => {
    window.print();
  };

  // Active Report title label
  const reportTitleLabel = useMemo(() => {
    if (activeTab === 'STANDARD') {
      const standardMap: Record<string, string> = {
        SUMMARY: 'Consolidated Port Pass Applications & Dossiers Register',
        BILLING_REGISTER: 'Oracle EBS Statutory Billing & Remita Revenue Register',
        ID_UNIT: 'OIC ID Unit Compliance & Vetting SLA Benchmark',
        SECURITY: 'GM Security Approvals & Port Clearance Register',
        PASSES_BIO: 'Port Pass Cards Issued & Biometric Schedule',
        CONCESSIONAIRES: 'Concessionaire & Sponsoring Companies Audit'
      };
      return standardMap[standardReportId] || 'Official Executive Register';
    }
    const dsObj = DATASET_OPTIONS.find(d => d.id === builderDataset);
    return dsObj ? `Custom Operational Intelligence: ${dsObj.label}` : 'Custom Operational Intelligence Register';
  }, [activeTab, standardReportId, builderDataset]);

  const activePortLabel = useMemo(() => {
    if (!filterConfig.portId || filterConfig.portId === 'ALL') return 'Consolidated All Port Complexes';
    return ports.find(p => p.id === filterConfig.portId)?.name || 'Specified NPA Port';
  }, [filterConfig.portId, ports]);

  const datePeriodLabel = useMemo(() => {
    if (filterConfig.dateRangePreset === 'ALL') return 'All Time (Current Financial Year)';
    if (filterConfig.dateRangePreset === 'THIS_MONTH') return 'October 2026';
    if (filterConfig.dateRangePreset === 'CUSTOM') return `${filterConfig.startDate || 'Start'} to ${filterConfig.endDate || 'End'}`;
    return filterConfig.dateRangePreset || 'October 2026';
  }, [filterConfig]);

  if (loading || !summary) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#087443] border-t-transparent rounded-full animate-spin mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">Generating NPA Operational Intelligence & Reports...</h4>
        <p className="text-xs text-slate-500">Querying Oracle EBS billing registers, Remita TSA vouchers, and Port Security clears...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Command Header (Hidden during print) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-[#087443] rounded-xl border border-emerald-200 shadow-2xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  NPA Reports & Operational Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-[#087443] text-[10px] font-black uppercase tracking-wider font-mono">
                  v3.0 Dynamic Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive reporting engine for Oracle EBS billing registers, Remita revenue, ID Unit SLAs, and GM Security clearances.
              </p>
            </div>
          </div>

          {/* Global Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Templates Selector */}
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-emerald-700" />
              <span>Saved Layouts ({templates.length})</span>
            </button>

            {/* Copy Table to Clipboard */}
            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              title="Copy table to clipboard as TSV for pasting into Excel or Google Sheets"
            >
              {copiedClipboard ? <Check className="w-4 h-4 text-[#087443]" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedClipboard ? 'Copied!' : 'Copy TSV'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            {/* Email Report via SMTP */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-blue-700" />
              <span>Email via SMTP</span>
            </button>

            {/* Print Official PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('STANDARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'STANDARD'
                ? 'bg-[#087443] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Curated NPA Official Registers</span>
          </button>

          <button
            onClick={() => setActiveTab('BUILDER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'BUILDER'
                ? 'bg-[#087443] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Custom Dynamic Report Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-[#087443] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visual Intelligence & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('PRINT_PREVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PRINT_PREVIEW'
                ? 'bg-[#087443] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formal Letterhead Preview</span>
          </button>
        </div>

        {/* Sub-selector for Standard Reports if in STANDARD tab */}
        {activeTab === 'STANDARD' && (
          <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0">
              OFFICIAL REGISTER:
            </span>
            {[
              { id: 'SUMMARY', label: 'Consolidated Port Ledger' },
              { id: 'BILLING_REGISTER', label: 'Oracle EBS & Remita Revenue' },
              { id: 'ID_UNIT', label: 'OIC ID Unit Compliance SLA' },
              { id: 'SECURITY', label: 'GM Security Clearances' },
              { id: 'PASSES_BIO', label: 'Port Passes Issued & RFID' },
              { id: 'CONCESSIONAIRES', label: 'Concessionaires Audit' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setStandardReportId(r.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                  standardReportId === r.id
                    ? 'bg-emerald-50 text-[#087443] border-[#087443] font-bold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Printable Letterhead Document view (Shown when in PRINT_PREVIEW tab OR during browser window.print()) */}
      <div className={activeTab === 'PRINT_PREVIEW' ? 'block' : 'hidden print:block'}>
        <ReportPrintView
          title={reportTitleLabel}
          subtitle="Official Executive Ledger & Operational Assessment"
          portScope={activePortLabel}
          dateRangeLabel={datePeriodLabel}
          items={filteredDatasetItems}
          columns={currentColumnsDef}
          visibleColumns={builderColumns}
          totalAmountNgn={totalAmountNgn}
          totalHeadcount={totalHeadcount}
          generatedBy={currentUser?.fullName || 'NPA Executive Officer'}
        />
      </div>

      {/* Visual Analytics Hub Tab */}
      {activeTab === 'ANALYTICS' && (
        <div className="print:hidden">
          <VisualAnalyticsHub
            summary={summary}
            selectedPortId={filterConfig.portId}
            onSelectPort={portId => setFilterConfig(prev => ({ ...prev, portId }))}
          />
        </div>
      )}

      {/* Custom Dynamic Builder & Standard Tab Views */}
      {(activeTab === 'STANDARD' || activeTab === 'BUILDER') && (
        <div className="print:hidden">
          <CustomReportBuilder
            dataset={builderDataset}
            onChangeDataset={setBuilderDataset}
            rawApplications={applications}
            rawPasses={passes}
            rawCompanies={companies}
            rawAuditLogs={auditLogs}
            ports={ports}
            categories={categories}
            activeColumns={builderColumns}
            onChangeColumns={setBuilderColumns}
            filterConfig={filterConfig}
            onChangeFilterConfig={setFilterConfig}
            groupBy={groupBy}
            onChangeGroupBy={setGroupBy}
            sortBy={sortBy}
            onChangeSortBy={setSortBy}
            sortDirection={sortDirection}
            onChangeSortDirection={setSortDirection}
            onOpenSaveTemplate={() => setShowTemplatesModal(true)}
          />
        </div>
      )}

      {/* Saved Report Templates Modal */}
      <ReportTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onApplyTemplate={handleApplyTemplate}
        onRefreshTemplates={async () => {
          const tplsRes = await api.getReportTemplates().catch(() => ({ success: true, templates: [] }));
          setTemplates(tplsRes.templates || []);
        }}
        currentConfig={{
          name: reportTitleLabel,
          dataset: builderDataset,
          selectedColumns: builderColumns,
          filters: filterConfig,
          groupBy,
          sortBy,
          sortDirection
        }}
      />

      {/* SMTP Email Transmission Modal */}
      <ReportEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportTitle={reportTitleLabel}
        reportSummary={{
          totalRecords: filteredDatasetItems.length,
          totalRevenueNgn: totalAmountNgn > 0 ? totalAmountNgn : undefined,
          period: datePeriodLabel,
          portScope: activePortLabel
        }}
        csvContent={generateCsvContent(filteredDatasetItems, currentColumnsDef, builderColumns)}
        csvFilename={`NPA_Report_${builderDataset}_${new Date().toISOString().split('T')[0]}.csv`}
      />
    </div>
  );
};
