import React, { useState } from 'react';
import { InAppNotification } from '../../types';
import {
  Bell,
  X,
  Mail,
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Building2,
  Send
} from 'lucide-react';

interface NotificationDetailModalProps {
  notification: InAppNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onViewApplication?: (applicationId: string) => void;
  recipientEmail?: string;
  onToggleReadStatus?: (notificationId: string, currentReadState: boolean) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onViewApplication,
  recipientEmail,
  onToggleReadStatus
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !notification) return null;

  const handleCopyRef = () => {
    if (notification.applicationReference) {
      navigator.clipboard.writeText(notification.applicationReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenApplication = () => {
    if (notification.applicationId && onViewApplication) {
      onViewApplication(notification.applicationId);
      onClose();
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        full: d.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        relative: getRelativeTimeString(d)
      };
    } catch {
      return { full: dateStr, relative: '' };
    }
  };

  const getRelativeTimeString = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const timeInfo = formatTimestamp(notification.createdAt);

  // Determine icon & theme accent based on notification title/type
  const isSecurity = notification.title.toLowerCase().includes('security') || notification.title.toLowerCase().includes('clearance');
  const isPayment = notification.title.toLowerCase().includes('payment') || notification.title.toLowerCase().includes('bill');
  const isAppointment = notification.title.toLowerCase().includes('appointment') || notification.title.toLowerCase().includes('capturing');
  const isPass = notification.title.toLowerCase().includes('pass') || notification.title.toLowerCase().includes('ready');
  const isRejection = notification.title.toLowerCase().includes('reject') || notification.title.toLowerCase().includes('return');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-title"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden text-slate-900 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lighter Green Ambient Halo behind modal border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 via-teal-300/20 to-emerald-500/20 rounded-2xl blur-lg pointer-events-none -z-10" />

        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#087443] to-[#0b8b52] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
              {isSecurity ? (
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
              ) : isRejection ? (
                <AlertCircle className="w-5 h-5 text-amber-200" />
              ) : (
                <Bell className="w-5 h-5 text-emerald-200" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                Official NPA Portal Alert
              </span>
              <h2 id="notification-title" className="text-sm font-bold text-white tracking-tight">
                Notification Details
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                notification.isRead
                  ? 'bg-emerald-950/40 text-emerald-100 border-emerald-400/30'
                  : 'bg-amber-400 text-slate-900 font-extrabold border-amber-300 animate-pulse'
              }`}
            >
              {notification.isRead ? 'Read' : 'New / Unread'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Close details"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Notification Title & Timestamp */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#087443]" />
              <span className="font-medium text-slate-600">{timeInfo.full}</span>
              {timeInfo.relative && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#087443] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {timeInfo.relative}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {notification.title}
            </h3>
          </div>

          {/* Delivery Channels Banner (In-App + Email Confirmed) */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#087443]" />
              Multi-Channel Statutory Transmission Record
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-100 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">In-App Notification</div>
                  <div className="text-[10px] text-slate-500">Delivered to PPMS inbox</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-100 text-slate-700">
                <Mail className="w-4 h-4 text-[#087443] shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                    SMTP Email Dispatched
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate" title={recipientEmail || 'Registered user email'}>
                    {recipientEmail ? `To: ${recipientEmail}` : 'Sent to registered email'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Message Content */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#087443]" />
              Official Notification Message
            </label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
              {notification.message}
            </div>
          </div>

          {/* Associated Application Context Card (if available) */}
          {(notification.applicationReference || notification.applicationId) && (
            <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-200/90 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#087443] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Associated Port Pass Application
                </span>
                {notification.applicationId && onViewApplication && (
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Dossier Linked
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-emerald-100">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Reference Number</div>
                  <div className="font-mono text-sm font-extrabold text-[#087443] tracking-wide">
                    {notification.applicationReference || notification.applicationId}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notification.applicationReference && (
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy Reference Number"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Ref</span>
                        </>
                      )}
                    </button>
                  )}

                  {notification.applicationId && onViewApplication && (
                    <button
                      type="button"
                      onClick={handleOpenApplication}
                      className="px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            {onToggleReadStatus && (
              <button
                type="button"
                onClick={() => onToggleReadStatus(notification.id, notification.isRead)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                {notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>

            {notification.applicationId && onViewApplication && (
              <button
                type="button"
                onClick={handleOpenApplication}
                className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Application Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
