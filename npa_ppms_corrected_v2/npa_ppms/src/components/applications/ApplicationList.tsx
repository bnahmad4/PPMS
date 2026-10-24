import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Application, WorkflowStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileText,
  RotateCw,
  Building,
  Anchor,
  Receipt,
  CreditCard,
  CheckCircle2,
  Download,
  ShieldCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';

interface ApplicationListProps {
  onSelectApplication: (id: string) => void;
  onNewApplication: () => void;
  presetStatusFilter?: string;
  title?: string;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  onSelectApplication,
  onNewApplication,
  presetStatusFilter,
  title = 'Port Pass Applications'
}) => {
  const { currentPortId, ports, hasRole } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(presetStatusFilter || 'ALL');
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications({
        portId: currentPortId !== 'ALL' ? currentPortId : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [currentPortId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const isCompany = hasRole('COMPANY_ADMIN') || hasRole('COMPANY_STAFF');
  const isIdUnit = hasRole('OIC_ID_UNIT');
  const isGmSecurity = hasRole('GM_SECURITY');
  const isBilling = hasRole('TARIFF_BILLING');
  const isAccounts = hasRole('ACCOUNTS_OFFICER');
  const isAdmin = hasRole('SYSTEM_ADMIN') || hasRole('PORT_ADMIN') || hasRole('AUDITOR') || hasRole('HQ_SUPERVISOR');
  const isPaymentReviewView = presetStatusFilter === 'PAYMENT_UNDER_REVIEW' || title.toLowerCase().includes('payment') || title.toLowerCase().includes('accounts');

  return (
    <div className="space-y-5">
      {/* Action Bar & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            {isPaymentReviewView && (
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded">
                STEP 4: TREASURY AUDIT
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPaymentReviewView
              ? 'Accounts & Finance Division verification queue. Preview Remita receipts and corporate documents without downloading.'
              : 'Real-time tracking of Nigerian Ports Authority electronic pass applications.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadApplications}
            className="p-2 border border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            title="Refresh list"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {isCompany && (
            <button
              onClick={onNewApplication}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              New Application
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ref, Company, or Employee..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443] outline-hidden"
          />
        </form>

        {/* Status Dropdown Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 shrink-0">Workflow Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-1 focus:ring-[#087443]"
          >
            {isBilling && !isAdmin ? (
              <>
                <option value="ALL">All Dossiers at Billing Point</option>
                <option value="PENDING_BILLING">Pending Oracle EBS Billing (Step 3)</option>
                <option value="BILL_ISSUED">Bill Issued / Awaiting Payment</option>
                <option value="PAYMENT_UNDER_REVIEW">Payment In Review</option>
                <option value="READY_FOR_SCHEDULING">Paid & Cleared for Capturing</option>
              </>
            ) : isGmSecurity && !isAdmin ? (
              <>
                <option value="ALL">All Dossiers at Security Point</option>
                <option value="PENDING_GM_SECURITY_APPROVAL">Pending Security Clearance (Step 2)</option>
                <option value="RETURNED_TO_ID_UNIT">Referred Back to ID Unit</option>
                <option value="PENDING_BILLING">Security Cleared (At Billing)</option>
                <option value="REJECTED">Declined by GM Security</option>
              </>
            ) : isAccounts && !isAdmin ? (
              <>
                <option value="ALL">All Dossiers at Accounts Point</option>
                <option value="PAYMENT_UNDER_REVIEW">Payment Under Review (Step 4)</option>
                <option value="BILL_ISSUED">Billed / Awaiting Payment Upload</option>
                <option value="READY_FOR_SCHEDULING">Payment Confirmed</option>
                <option value="PAYMENT_REJECTED">Payment Declined</option>
              </>
            ) : isIdUnit && !isAdmin ? (
              <>
                <option value="ALL">All Dossiers at ID Unit Desks</option>
                <option value="PENDING_ID_UNIT_VERIFICATION,RETURNED_TO_ID_UNIT">Active Verification Queue (Pending & Returned from GM)</option>
                <option value="PENDING_ID_UNIT_VERIFICATION">Pending ID Unit Verification (Step 1)</option>
                <option value="RETURNED_TO_ID_UNIT">Referred Back by GM Security (Action Needed)</option>
                <option value="RETURNED_FOR_CORRECTION">Returned to Company for Correction</option>
                <option value="READY_FOR_SCHEDULING">Ready for Capturing Scheduling (Step 5)</option>
                <option value="CAPTURING_SCHEDULED">Capturing Scheduled</option>
                <option value="PASS_READY_FOR_COLLECTION">Pass Ready for Collection (Step 6)</option>
                <option value="COLLECTED">Collected & Closed (Step 7)</option>
                <option value="REJECTED">Rejected</option>
              </>
            ) : (
              <>
                <option value="ALL">All Statuses</option>
                <option value="PENDING_ID_UNIT_VERIFICATION">Pending ID Unit Verification (Step 1)</option>
                <option value="RETURNED_TO_ID_UNIT">Referred Back to ID Unit</option>
                <option value="PENDING_GM_SECURITY_APPROVAL">Pending GM Security Approval (Step 2)</option>
                <option value="PENDING_BILLING">Pending Oracle EBS Billing (Step 3)</option>
                <option value="BILL_ISSUED">Bill Issued / Awaiting Payment</option>
                <option value="PAYMENT_UNDER_REVIEW">Payment Under Review (Step 4)</option>
                <option value="READY_FOR_SCHEDULING">Ready for Capturing Scheduling (Step 5)</option>
                <option value="CAPTURING_SCHEDULED">Capturing Scheduled</option>
                <option value="PASS_READY_FOR_COLLECTION">Pass Ready for Collection (Step 6)</option>
                <option value="COLLECTED">Collected & Closed (Step 7)</option>
                <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
                <option value="REJECTED">Rejected</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#087443] text-white select-none">
              <tr>
                <th className="py-3 px-4 font-bold">Reference Number</th>
                <th className="py-3 px-4 font-bold">Sponsoring Company</th>
                <th className="py-3 px-4 font-bold">Port Location</th>
                {isPaymentReviewView ? (
                  <>
                    <th className="py-3 px-4 font-bold">Remita RRR & Oracle Ref</th>
                    <th className="py-3 px-4 font-bold">Amount Paid</th>
                    <th className="py-3 px-4 font-bold">Attached Evidence</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold text-center">Personnel</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Submitted Date</th>
                  </>
                )}
                <th className="py-3 px-4 font-bold text-right">Actions & Previews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={isPaymentReviewView ? 7 : 8} className="py-12 text-center text-slate-400 font-medium">
                    Loading records from NPA database...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={isPaymentReviewView ? 7 : 8} className="py-12 text-center text-slate-400">
                    No applications found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const receiptName = app.payment?.receiptFileName || 'Remita_Payment_Receipt.pdf';
                  const rrr = app.bill?.rrrNumber || app.payment?.receiptReference || 'N/A';
                  const amount = app.payment?.amountPaidNgn || app.bill?.amountNgn || 0;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#087443]">
                        {app.referenceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {app.companyName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {app.portName}
                      </td>

                      {isPaymentReviewView ? (
                        <>
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-[#087443] block">RRR: {rrr}</span>
                            <span className="text-[10px] text-slate-500 block">Bill: {app.bill?.oracleBillReference || 'NPA-EBS'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                            NGN {amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-emerald-950">
                              <Receipt className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="text-[11px] font-medium truncate max-w-[130px]" title={receiptName}>
                                {receiptName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {app.payment?.paymentDate || 'Today'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-slate-600">
                            {app.categoryName}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {app.numberOfEmployees}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString('en-NG')
                              : 'Draft'}
                          </td>
                        </>
                      )}

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Instant Preview of Remita Payment Receipt */}
                          {app.payment && (
                            <button
                              type="button"
                              onClick={() => setPreviewingFile({
                                fileName: receiptName,
                                documentName: 'Remita Payment Treasury Receipt',
                                fileData: app.payment?.receiptFileData,
                                fileUrl: app.payment?.receiptDocumentUrl,
                                mimeType: 'application/pdf',
                                referenceNumber: app.referenceNumber,
                                uploadedAt: app.payment?.createdAt,
                                documentCategory: 'PAYMENT_RECEIPT',
                                paymentDetails: {
                                  receiptReference: app.payment?.receiptReference,
                                  rrrNumber: rrr,
                                  oracleBillReference: app.bill?.oracleBillReference,
                                  amountPaidNgn: amount,
                                  paymentDate: app.payment?.paymentDate,
                                  paymentMethod: app.payment?.paymentMethod || 'Remita TSA Online Gateway',
                                  companyName: app.companyName,
                                  portName: app.portName,
                                  uploadedByName: app.payment?.uploadedByName
                                }
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                              title="Preview attached Remita receipt without downloading"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Preview Receipt</span>
                            </button>
                          )}

                          {/* Quick Preview of Corporate Documents */}
                          {app.documents && app.documents.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const doc = app.documents[0];
                                setPreviewingFile({
                                  fileName: doc.fileName,
                                  documentName: doc.documentName,
                                  fileData: doc.fileData,
                                  fileUrl: doc.fileUrl,
                                  fileSizeBytes: doc.fileSizeBytes,
                                  mimeType: doc.mimeType,
                                  referenceNumber: app.referenceNumber,
                                  uploadedAt: doc.uploadedAt,
                                  documentCategory: 'STATUTORY_DOC'
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                              title="Preview corporate documents (CAC, Tax Clearance)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Docs ({app.documents.length})</span>
                            </button>
                          )}

                          {/* Quick Edit & Resubmit for Returned Applications */}
                          {app.status === 'RETURNED_FOR_CORRECTION' && isCompany && (
                            <button
                              type="button"
                              onClick={() => onSelectApplication(app.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                              title="Edit documents and resubmit corrected dossier to ID Unit"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Edit & Resubmit</span>
                            </button>
                          )}

                          {/* Quick Action for Applications Returned by GM Security to ID Unit */}
                          {app.status === 'RETURNED_TO_ID_UNIT' && isIdUnit && (
                            <button
                              type="button"
                              onClick={() => onSelectApplication(app.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                              title="Review GM Security observations and return to company or re-verify"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Act on Return</span>
                            </button>
                          )}

                          {/* Open Dossier */}
                          <button
                            onClick={() => onSelectApplication(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>{isPaymentReviewView ? 'Verify Payment' : 'View Dossier'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Counter Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{applications.length}</strong> total application dossiers</span>
          <span className="font-mono">NPA PPMS • Accounts & Treasury Division</span>
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
