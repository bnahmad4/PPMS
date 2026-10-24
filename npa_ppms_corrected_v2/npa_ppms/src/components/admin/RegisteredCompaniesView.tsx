import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/client';
import { Company, Port, Application } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  RefreshCw,
  Download,
  Eye,
  Key,
  PlusCircle,
  Briefcase,
  Layers,
  Send,
  Clock,
  X,
  FileCheck,
  Globe,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';

interface RegisteredCompaniesViewProps {
  onRegisterNew?: () => void;
  onSelectApplication?: (appId: string) => void;
}

export const RegisteredCompaniesView: React.FC<RegisteredCompaniesViewProps> = ({
  onRegisterNew,
  onSelectApplication
}) => {
  const { currentUser, currentPortId } = useAuth();

  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortFilter, setSelectedPortFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Selected company for detail modal
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // File Preview Modal
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, portRes, appsRes] = await Promise.all([
        api.getCompanies(),
        api.getPorts(),
        api.getApplications()
      ]);

      setCompanies(compRes.companies || []);
      setPorts(portRes.ports || []);
      setApplications(appsRes.applications || []);
    } catch (err: any) {
      console.error('Error loading companies directory:', err);
      setError(err.message || 'Failed to load registered companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map port IDs for fast name resolution
  const portMap = useMemo(() => {
    const map = new Map<string, Port>();
    ports.forEach(p => map.set(p.id, p));
    return map;
  }, [ports]);

  // Count applications per company
  const companyAppCounts = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach(a => {
      if (a.companyId) {
        counts.set(a.companyId, (counts.get(a.companyId) || 0) + 1);
      }
    });
    return counts;
  }, [applications]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = (c.companyName || '').toLowerCase().includes(query);
        const matchesCac = (c.cacNumber || '').toLowerCase().includes(query);
        const matchesTin = (c.tinNumber || '').toLowerCase().includes(query);
        const matchesEmail = (c.email || '').toLowerCase().includes(query);
        const matchesRep = (c.authRepName || '').toLowerCase().includes(query) || (c.mdCeoName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCac && !matchesTin && !matchesEmail && !matchesRep) {
          return false;
        }
      }

      // Port filter
      if (selectedPortFilter !== 'ALL' && c.primaryPortId !== selectedPortFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [companies, searchQuery, selectedPortFilter, selectedStatusFilter]);

  // Statistics
  const totalCount = companies.length;
  const activeCount = companies.filter(c => c.status === 'ACTIVE').length;
  const pendingCount = companies.filter(c => c.status === 'PENDING_VERIFICATION').length;
  const suspendedCount = companies.filter(c => c.status === 'SUSPENDED').length;
  const withCacDocCount = companies.filter(c => !!(c.cacCertificate || (c as any).cacDoc)).length;

  // Status Change Handler
  const handleUpdateStatus = async (companyId: string, newStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED') => {
    try {
      setActionLoading(true);
      setActionErrorMsg(null);
      setActionSuccessMsg(null);
      const res = await api.updateCompanyStatus(companyId, newStatus);
      if (res.success && res.company) {
        setCompanies(prev => prev.map(c => c.id === companyId ? res.company : c));
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(res.company);
        }
        setActionSuccessMsg(`Status for "${res.company.companyName}" successfully updated to ${newStatus}.`);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update company status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reissue / Resend Credentials Handler
  const handleResendCredentials = async (company: Company) => {
    if (!window.confirm(`Are you sure you want to re-issue and dispatch temporary access credentials to "${company.email}" for ${company.companyName}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionErrorMsg(null);
      setActionSuccessMsg(null);
      const res = await api.resendCompanyCredentials(company.id);
      if (res.success) {
        setActionSuccessMsg(`Official corporate access credentials successfully dispatched to ${company.email}.`);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to dispatch credentials email.');
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Company ID',
      'Company Name',
      'CAC Number',
      'TIN',
      'Official Email',
      'Phone',
      'Address',
      'Primary Port Command',
      'MD / CEO',
      'Authorized Representative',
      'Rep Email',
      'Rep Phone',
      'Status',
      'Applications Count',
      'Profiled Date'
    ];

    const rows = filteredCompanies.map(c => {
      const port = portMap.get(c.primaryPortId);
      const appCount = companyAppCounts.get(c.id) || 0;
      return [
        `"${c.id}"`,
        `"${(c.companyName || '').replace(/"/g, '""')}"`,
        `"${c.cacNumber || ''}"`,
        `"${c.tinNumber || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${port ? `${port.name} (${port.code})` : c.primaryPortId}"`,
        `"${(c.mdCeoName || '').replace(/"/g, '""')}"`,
        `"${(c.authRepName || '').replace(/"/g, '""')}"`,
        `"${c.authRepEmail || ''}"`,
        `"${c.authRepPhone || ''}"`,
        `"${c.status}"`,
        appCount,
        `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NPA_PPMS_Registered_Companies_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Status Badge
  const renderCompanyStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-[#087443]" />
            ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            SUSPENDED
          </span>
        );
      case 'PENDING_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING VERIFICATION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header Banner */}
      <div className="bg-gradient-to-r from-[#087443] via-[#065C35] to-[#044426] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>NPA PPMS • Corporate Entities Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Registered Companies & Concessionaires
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
            System Administrator registry of profiled maritime organizations, verified CAC certificates of incorporation, executive leadership, and port pass authorization quotas across all NPA port complexes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredCompanies.length === 0}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onRegisterNew && (
            <button
              type="button"
              onClick={onRegisterNew}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-black rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Profile New Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Feedback Notifications */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            className="text-red-700 hover:text-red-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Profiled</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Corporate entities</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#087443] flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Entities</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{activeCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Full portal privileges</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CAC Certified</div>
            <div className="text-2xl font-black text-teal-700 mt-0.5">{withCacDocCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Statutory certs on file</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <BadgeCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Port Commands</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{ports.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Western & Eastern ports</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Company Name, CAC Number, TIN, Email, Rep..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden text-slate-900 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Layout toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Port Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Port:</span>
            <select
              value={selectedPortFilter}
              onChange={(e) => setSelectedPortFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden text-slate-800 font-medium"
            >
              <option value="ALL">All Port Complexes</option>
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden text-slate-800 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Table / Grid Mode */}
          <div className="border-l border-slate-200 pl-2 ml-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'TABLE' ? 'bg-[#087443] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Table View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'GRID' ? 'bg-[#087443] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Card Grid View"
            >
              <Briefcase className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Companies List / Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-[#087443] animate-spin" />
          <p className="text-xs font-semibold">Loading official corporate entities directory...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Registered Companies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedPortFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
              ? 'No corporate entities match your active search and filter parameters.'
              : 'There are no corporate entities registered in the system yet.'}
          </p>
          {(searchQuery || selectedPortFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPortFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-xs font-bold text-[#087443] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Corporate Entity</th>
                  <th className="py-3 px-4">CAC Reg No / TIN</th>
                  <th className="py-3 px-4">Primary Port Command</th>
                  <th className="py-3 px-4">Authorized Representative</th>
                  <th className="py-3 px-4">Statutory CAC Cert</th>
                  <th className="py-3 px-4">Dossiers</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((c) => {
                  const port = portMap.get(c.primaryPortId);
                  const appCount = companyAppCounts.get(c.id) || 0;
                  const hasCac = !!(c.cacCertificate || (c as any).cacDoc);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Company Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{c.companyName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      </td>

                      {/* CAC & TIN */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {c.cacNumber}
                        </span>
                        {c.tinNumber && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            TIN: {c.tinNumber}
                          </div>
                        )}
                      </td>

                      {/* Port Command */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {port ? port.code : 'NPA Port'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {port ? port.name : c.primaryPortId}
                        </div>
                      </td>

                      {/* Authorized Representative */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.authRepName || c.mdCeoName || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.authRepPhone || c.phone}
                        </div>
                      </td>

                      {/* Statutory CAC Certificate */}
                      <td className="py-3 px-4">
                        {hasCac ? (
                          <button
                            type="button"
                            onClick={() => {
                              const doc = c.cacCertificate || (c as any).cacDoc;
                              setPreviewingFile({
                                fileName: doc.fileName || `CAC_Certificate_${c.cacNumber}.pdf`,
                                fileData: doc.fileData,
                                fileUrl: doc.fileUrl,
                                mimeType: doc.mimeType || 'application/pdf',
                                documentName: 'Official CAC Certificate of Incorporation'
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-[11px] cursor-pointer transition-colors"
                            title="Preview CAC Certificate"
                          >
                            <FileCheck className="w-3 h-3 text-teal-600" />
                            <span>CAC Verified</span>
                            <Eye className="w-3 h-3 text-teal-500 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No File</span>
                        )}
                      </td>

                      {/* Applications Count */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {appCount} {appCount === 1 ? 'dossier' : 'dossiers'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {renderCompanyStatusBadge(c.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCompany(c)}
                            className="px-2.5 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full Profile Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResendCredentials(c)}
                            disabled={actionLoading}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Resend Credentials via Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
            <span>Showing {filteredCompanies.length} of {companies.length} registered corporate entities</span>
            <span>Nigerian Ports Authority • Commercial Shipping & Port Services Registry</span>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => {
            const port = portMap.get(c.primaryPortId);
            const appCount = companyAppCounts.get(c.id) || 0;
            const hasCac = !!(c.cacCertificate || (c as any).cacDoc);

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.cacNumber}
                    </span>
                    {renderCompanyStatusBadge(c.status)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1" title={c.companyName}>
                    {c.companyName}
                  </h3>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{port ? `${port.name} (${port.code})` : c.primaryPortId}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">MD / CEO:</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{c.mdCeoName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rep Contact:</span>
                      <span className="font-semibold text-slate-800 line-clamp-1">{c.authRepName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-600">
                    {appCount} {appCount === 1 ? 'dossier' : 'dossiers'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasCac && (
                      <button
                        type="button"
                        onClick={() => {
                          const doc = c.cacCertificate || (c as any).cacDoc;
                          setPreviewingFile({
                            fileName: doc.fileName || `CAC_Certificate_${c.cacNumber}.pdf`,
                            fileData: doc.fileData,
                            fileUrl: doc.fileUrl,
                            mimeType: doc.mimeType || 'application/pdf',
                            documentName: 'Official CAC Certificate of Incorporation'
                          });
                        }}
                        className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg text-xs"
                        title="View CAC Certificate"
                      >
                        <FileCheck className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCompany(c)}
                      className="px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETE COMPANY DOSSIER MODAL */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#087443] via-[#065C35] to-[#044426] text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xs">
                    <Building2 className="w-6 h-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-200 bg-white/15 px-2 py-0.5 rounded border border-white/20">
                        {selectedCompany.cacNumber}
                      </span>
                      {selectedCompany.tinNumber && (
                        <span className="font-mono text-xs text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                          TIN: {selectedCompany.tinNumber}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-white mt-1">
                      {selectedCompany.companyName}
                    </h2>
                    <p className="text-xs text-emerald-100/80">
                      Primary Command: {portMap.get(selectedCompany.primaryPortId)?.name || selectedCompany.primaryPortId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Quick Status and Actions Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Profiling Status:</span>
                  {renderCompanyStatusBadge(selectedCompany.status)}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle */}
                  <select
                    value={selectedCompany.status}
                    onChange={(e) => handleUpdateStatus(selectedCompany.id, e.target.value as any)}
                    disabled={actionLoading}
                    className="text-xs font-bold py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 outline-hidden"
                  >
                    <option value="ACTIVE">Set to ACTIVE</option>
                    <option value="PENDING_VERIFICATION">Set to PENDING</option>
                    <option value="SUSPENDED">Set to SUSPENDED</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleResendCredentials(selectedCompany)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Re-issue & Email Credentials</span>
                  </button>
                </div>
              </div>

              {/* General Information Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#087443]" />
                  Corporate Identification & Contacts
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Official Corporate Email:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCompany.email}</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Corporate Telephone:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCompany.phone || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Registered Head Office Address:</span>
                    <span className="font-medium text-slate-900">{selectedCompany.address || 'N/A'}</span>
                  </div>

                  {selectedCompany.website && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg sm:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Corporate Web Portal:</span>
                        <span className="font-mono text-slate-900">{selectedCompany.website}</span>
                      </div>
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#087443] hover:underline flex items-center gap-1 text-[11px] font-bold"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Leadership & Representation */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#087443]" />
                  Executive Leadership & Authorized Representatives
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold text-[#087443]">Managing Director / CEO</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedCompany.mdCeoName || 'N/A'}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCompany.mdCeoPhone || 'N/A'}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold text-[#087443]">Authorized Port Pass Liaison</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedCompany.authRepName || 'N/A'}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedCompany.authRepEmail || selectedCompany.email}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCompany.authRepPhone || selectedCompany.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory CAC Certificate */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#087443]" />
                  Statutory CAC Certificate of Incorporation
                </h4>

                {selectedCompany.cacCertificate || (selectedCompany as any).cacDoc ? (
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-teal-950 text-xs">
                          {selectedCompany.cacCertificate?.fileName || (selectedCompany as any).cacDoc?.fileName || `CAC_Certificate_${selectedCompany.cacNumber}.pdf`}
                        </div>
                        <div className="text-[11px] text-teal-800">
                          Official Corporate Affairs Commission Certificate of Incorporation
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const doc = selectedCompany.cacCertificate || (selectedCompany as any).cacDoc;
                        setPreviewingFile({
                          fileName: doc.fileName || `CAC_Certificate_${selectedCompany.cacNumber}.pdf`,
                          fileData: doc.fileData,
                          fileUrl: doc.fileUrl,
                          mimeType: doc.mimeType || 'application/pdf',
                          documentName: 'Official CAC Certificate of Incorporation'
                        });
                      }}
                      className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview Document</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                    No electronic CAC certificate was attached to this profile.
                  </div>
                )}
              </div>

              {/* Port Pass Dossiers Submitted by this Company */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#087443]" />
                  Port Pass Applications Ledger ({applications.filter(a => a.companyId === selectedCompany.id).length})
                </h4>

                {applications.filter(a => a.companyId === selectedCompany.id).length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {applications
                      .filter(a => a.companyId === selectedCompany.id)
                      .map((app) => (
                        <div key={app.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                          <div>
                            <div className="font-mono font-bold text-slate-900">{app.referenceNumber}</div>
                            <div className="text-[11px] text-slate-500">
                              {app.categoryName || 'Commercial'} • {app.numberOfEmployees} employees • Submitted {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border">
                              {app.status.replace(/_/g, ' ')}
                            </span>
                            {onSelectApplication && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCompany(null);
                                  onSelectApplication(app.id);
                                }}
                                className="text-xs font-bold text-[#087443] hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                    This company has not submitted any Port Pass applications yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Entity Profiled: {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleString() : 'N/A'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewingFile}
        file={previewingFile}
        onClose={() => setPreviewingFile(null)}
      />
    </div>
  );
};
