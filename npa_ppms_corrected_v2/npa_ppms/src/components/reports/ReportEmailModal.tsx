import React, { useState } from 'react';
import { Mail, Send, X, CheckCircle2, AlertCircle, ExternalLink, Paperclip, ShieldCheck, User } from 'lucide-react';
import { api } from '../../api/client';

interface ReportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportSummary: {
    totalRecords: number;
    totalRevenueNgn?: number;
    period: string;
    portScope?: string;
  };
  csvContent?: string;
  csvFilename?: string;
}

export const ReportEmailModal: React.FC<ReportEmailModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportSummary,
  csvContent,
  csvFilename
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [attachCsv, setAttachCsv] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ message: string; previewUrl?: string } | null>(null);

  if (!isOpen) return null;

  const quickRecipients = [
    { label: 'Accounts / Treasury', email: 'accounts.lagos@nigerianports.gov.ng' },
    { label: 'GM Security Division', email: 'gm.security@nigerianports.gov.ng' },
    { label: 'OIC ID Unit HQ', email: 'idunit.lpc@nigerianports.gov.ng' },
    { label: 'Internal Audit', email: 'audit@nigerianports.gov.ng' }
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address');
      return;
    }

    try {
      setSending(true);
      setError(null);
      const res = await api.sendReportEmail({
        recipientEmail,
        reportTitle,
        reportSummary,
        notes: notes.trim() || undefined,
        csvContent: attachCsv ? csvContent : undefined,
        csvFilename: attachCsv ? csvFilename : undefined
      });

      if (res.success) {
        setSuccessResult({
          message: res.message || 'Report email successfully dispatched via SMTP gateway.',
          previewUrl: res.previewUrl
        });
      } else {
        setError(res.message || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting SMTP relay.');
    } finally {
      setSending(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#087443] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Direct SMTP Report Notification</h3>
              <p className="text-xs text-white/80">Transmit live executive digest via Nigerian Ports Authority SMTP</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-[#087443] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Report Dispatched Successfully!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                {successResult.message}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>RECIPIENT:</span>
                <span className="font-bold text-slate-800">{recipientEmail}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>REPORT:</span>
                <span className="font-bold text-slate-800">{reportTitle}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>RECORDS:</span>
                <span className="font-bold text-emerald-700">{reportSummary.totalRecords} Rows</span>
              </div>
            </div>

            {successResult.previewUrl && (
              <a
                href={successResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Open Ethereal Live Web Inbox Preview
              </a>
            )}

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-800 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Scope card */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-[#087443] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Executive Report Scope</span>
              </div>
              <p className="text-slate-700 font-medium">
                {reportTitle} • {reportSummary.portScope || 'All Port Complexes'}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                <span>{reportSummary.totalRecords} Records</span>
                {reportSummary.totalRevenueNgn != null && (
                  <span>NGN {reportSummary.totalRevenueNgn.toLocaleString()}</span>
                )}
                <span>Period: {reportSummary.period}</span>
              </div>
            </div>

            {/* Quick recipient pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quick NPA Stakeholder Directory
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickRecipients.map((rec) => (
                  <button
                    key={rec.email}
                    type="button"
                    onClick={() => setRecipientEmail(rec.email)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      recipientEmail === rec.email
                        ? 'bg-[#087443] text-white border-[#087443] font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. general.manager@nigerianports.gov.ng"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443] focus:border-transparent outline-hidden bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Remarks / Executive Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Remarks / Transmittal Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add official forwarding instructions, audit observation, or management comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443] focus:border-transparent outline-hidden bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            {/* Attach CSV checkbox */}
            {csvContent && (
              <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={attachCsv}
                  onChange={(e) => setAttachCsv(e.target.checked)}
                  className="rounded text-[#087443] focus:ring-[#087443] w-4 h-4 cursor-pointer"
                />
                <Paperclip className="w-4 h-4 text-slate-500" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Attach Clean CSV Data Export</span>
                  <span className="text-slate-500 block text-[11px]">({csvFilename || 'npa_report_export.csv'})</span>
                </div>
              </label>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#087443] hover:bg-[#065C35] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
