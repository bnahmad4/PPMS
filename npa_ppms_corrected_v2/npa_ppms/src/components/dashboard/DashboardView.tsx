import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Application } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  Clock,
  Receipt,
  ArrowRight,
  PlusCircle,
  RotateCw,
  AlertCircle,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';

interface DashboardViewProps {
  onSelectApplication: (id: string) => void;
  onNewApplication: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectApplication,
  onNewApplication,
  onNavigateTab
}) => {
  const { currentUser, currentPortId, hasRole } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [companiesCount, setCompaniesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const appsPromise = api.getApplications({ portId: currentPortId !== 'ALL' ? currentPortId : undefined })
        .catch(err => {
          console.warn('Applications load warning:', err.message);
          return { applications: [], total: 0 };
        });
      const summaryPromise = api.getReportsSummary()
        .catch(err => {
          console.warn('Reports summary load warning:', err.message);
          return { summary: null };
        });
      const compsPromise = api.getCompanies()
        .catch(err => {
          console.warn('Companies load warning:', err.message);
          return { companies: [] };
        });

      const [appsRes, sumRes, compsRes] = await Promise.all([appsPromise, summaryPromise, compsPromise]);
      setApplications(appsRes.applications || []);
      setSummary(sumRes?.summary || null);
      setCompaniesCount(compsRes?.companies?.length || 0);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPortId]);

  const isCompany = hasRole('COMPANY_ADMIN') || hasRole('COMPANY_STAFF');
  const isIdUnit = hasRole('OIC_ID_UNIT');
  const isGmSecurity = hasRole('GM_SECURITY');
  const isBilling = hasRole('TARIFF_BILLING');
  const isAccounts = hasRole('ACCOUNTS_OFFICER');
  const isHq = hasRole('HQ_SUPERVISOR') || hasRole('AUDITOR');
  const isAdmin = hasRole('SYSTEM_ADMIN');

  // Compute metrics
  const totalApps = applications.length;
  const returnedToIdUnitCount = applications.filter(a => a.status === 'RETURNED_TO_ID_UNIT').length;
  const pendingIdUnit = applications.filter(a => a.status === 'PENDING_ID_UNIT_VERIFICATION' || a.status === 'RETURNED_TO_ID_UNIT').length;
  const pendingGmSec = applications.filter(a => a.status === 'PENDING_GM_SECURITY_APPROVAL').length;
  const pendingBill = applications.filter(a => a.status === 'PENDING_BILLING').length;
  const awaitingPay = applications.filter(a => a.status === 'BILL_ISSUED').length;
  const payReview = applications.filter(a => a.status === 'PAYMENT_UNDER_REVIEW').length;
  const returnedForCorrection = applications.filter(a => a.status === 'RETURNED_FOR_CORRECTION').length;


  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#087443] text-white p-6 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold block">
            NIGERIAN PORTS AUTHORITY • PPMS PORTAL
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-1">
            Welcome, {currentUser?.fullName}
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            {isCompany && 'Track your corporate port pass applications, settle Oracle EBS billing, and manage biometric capturing.'}
            {isIdUnit && 'Manage first-line document verifications, biometric appointments schedule, and pass collections.'}
            {isGmSecurity && 'Command Security Clearance Console — Authenticate verified applications for port gate perimeter access.'}
            {isBilling && 'Tariff & Billing Desk — Enter manual Oracle EBS references and Remita Retrieval References (RRR).'}
            {isAccounts && 'Accounts & Finance Division — Verify incoming payment receipts against Central Bank of Nigeria (CBN) TSA settlement schedules without downloading files.'}
            {(isHq || isAdmin) && 'Consolidated Executive Overview across all Nigerian Port Complexes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCompany && (
            <button
              onClick={onNewApplication}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#087443] hover:bg-emerald-50 text-xs font-bold rounded-lg shadow-md transition-colors shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Apply for Port Pass
            </button>
          )}

          <button
            onClick={fetchData}
            title="Refresh Dashboard"
            className="p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ACTION REQUIRED: RETURNED FOR CORRECTION BANNER FOR COMPANIES */}
      {isCompany && returnedForCorrection > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Action Required: {returnedForCorrection} Application{returnedForCorrection > 1 ? 's' : ''} Returned for Correction
              </h2>
              <p className="text-xs text-amber-800">
                NPA inspecting officers returned {returnedForCorrection > 1 ? 'dossiers' : 'your dossier'} with specific documentation or bio-data revision instructions. You can edit and resubmit immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const returnedApp = applications.find(a => a.status === 'RETURNED_FOR_CORRECTION');
              if (returnedApp) onSelectApplication(returnedApp.id);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Review & Resubmit Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ACTION REQUIRED: DOSSIERS REFERRED BACK BY GM SECURITY FOR ID UNIT */}
      {isIdUnit && returnedToIdUnitCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Action Required: {returnedToIdUnitCount} Application{returnedToIdUnitCount > 1 ? 's' : ''} Referred Back by GM Security
              </h2>
              <p className="text-xs text-amber-800">
                GM Security referred {returnedToIdUnitCount > 1 ? 'dossiers' : 'a dossier'} back to the Port ID Unit with observations. You can return {returnedToIdUnitCount > 1 ? 'them' : 'it'} to the company for document correction or re-verify.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const returnedApp = applications.find(a => a.status === 'RETURNED_TO_ID_UNIT');
              if (returnedApp) onSelectApplication(returnedApp.id);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Review & Take Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ROLE HIGHLIGHT CARD */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${(isAdmin || isHq) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {isCompany
                ? 'Company Applications'
                : isIdUnit
                ? 'ID Unit Applications'
                : isGmSecurity
                ? 'Security Desk Applications'
                : isBilling
                ? 'Billing Desk Applications'
                : isAccounts
                ? 'Accounts Desk Applications'
                : 'Total Applications'}
            </span>
            <FileText className="w-4 h-4 text-[#087443]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalApps}</div>
          <p className="text-[11px] text-slate-500">
            {isCompany
              ? 'Submitted by your organization'
              : !isHq && !isAdmin
              ? 'Dossiers that have reached your operational point'
              : `Across ${currentPortId === 'ALL' ? 'all 6 NPA port complexes' : 'assigned port location'}`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Awaiting Action</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {isIdUnit ? pendingIdUnit : isGmSecurity ? pendingGmSec : isBilling ? pendingBill : isAccounts ? payReview : isCompany ? (awaitingPay + returnedForCorrection) : (pendingIdUnit + pendingGmSec)}
          </div>
          <p className="text-[11px] text-slate-500">
            {isCompany && returnedForCorrection > 0
              ? `${returnedForCorrection} returned for correction • ${awaitingPay} awaiting payment`
              : 'Pending immediate review for your authorized role'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {isCompany ? 'Fees Disbursed (Verified)' : 'Total Revenue (Verified)'}
            </span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono text-[#087443]">
            NGN {summary ? (summary.totalRevenueNgn || 0).toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-500">
            {isCompany ? 'Verified Remita disbursements recorded for your company' : 'Verified Remita collections recorded in PPMS'}
          </p>
        </div>

        {(isAdmin || isHq) && (
          <div
            onClick={() => onNavigateTab('registered_companies')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-[#087443] cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-[#087443] transition-colors">
                Registered Companies
              </span>
              <Building2 className="w-4 h-4 text-[#087443]" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono flex items-center justify-between">
              <span>{companiesCount} Profiled</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#087443] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500">
              Corporate directory, CAC certificates & quotas
            </p>
          </div>
        )}
      </div>

      {/* RECENT APPLICATIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {isCompany ? 'Recent Company Applications' : !isHq && !isAdmin ? 'Applications at Your Operational Desk' : 'Recent Port Pass Applications'}
          </h2>
          <button
            onClick={() => onNavigateTab('applications')}
            className="text-xs font-bold text-[#087443] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isCompany ? 'View My Applications' : !isHq && !isAdmin ? 'View My Desk Applications' : 'View All Applications'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#087443] text-white">
              <tr>
                <th className="py-2.5 px-4 font-bold">Reference Number</th>
                <th className="py-2.5 px-4 font-bold">Company</th>
                <th className="py-2.5 px-4 font-bold">Port</th>
                <th className="py-2.5 px-4 font-bold text-center">Personnel</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
                <th className="py-2.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No applications submitted yet. Click &quot;New Application&quot; to initiate a port pass request.
                  </td>
                </tr>
              ) : (
                applications.slice(0, 6).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#087443]">
                      {app.referenceNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {app.companyName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {app.portName}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {app.numberOfEmployees}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.payment && (
                          <button
                            type="button"
                            onClick={() => setPreviewingFile({
                              fileName: app.payment?.receiptFileName || 'Remita_Receipt.pdf',
                              documentName: 'Remita Payment Treasury Receipt',
                              fileData: app.payment?.receiptFileData,
                              fileUrl: app.payment?.receiptDocumentUrl,
                              mimeType: 'application/pdf',
                              referenceNumber: app.referenceNumber,
                              documentCategory: 'PAYMENT_RECEIPT',
                              paymentDetails: {
                                receiptReference: app.payment?.receiptReference,
                                rrrNumber: app.bill?.rrrNumber || app.payment?.receiptReference,
                                amountPaidNgn: app.payment?.amountPaidNgn,
                                paymentDate: app.payment?.paymentDate,
                                companyName: app.companyName,
                                portName: app.portName
                              }
                            })}
                            title="Preview Remita payment receipt"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Receipt</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectApplication(app.id)}
                          className="px-2.5 py-1 text-xs font-bold text-[#087443] hover:bg-emerald-50 rounded border border-emerald-300 cursor-pointer"
                        >
                          Open Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal In-Browser File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewingFile)}
        onClose={() => setPreviewingFile(null)}
        file={previewingFile}
      />
    </div>
  );
};
