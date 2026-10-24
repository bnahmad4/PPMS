import React from 'react';
import { WorkflowStatus } from '../../types';

interface StatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (st: WorkflowStatus) => {
    switch (st) {
      case 'DRAFT':
        return {
          label: 'Draft',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400'
        };
      case 'SUBMITTED':
      case 'PENDING_ID_UNIT_VERIFICATION':
        return {
          label: 'Pending ID Unit Verification',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          label: 'Returned for Correction',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'ID_UNIT_VERIFIED':
      case 'PENDING_GM_SECURITY_APPROVAL':
        return {
          label: 'Pending GM Security Approval',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500'
        };
      case 'RETURNED_TO_ID_UNIT':
        return {
          label: 'Returned to ID Unit',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'GM_SECURITY_APPROVED':
      case 'PENDING_BILLING':
        return {
          label: 'Pending Billing',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600'
        };
      case 'BILL_ISSUED':
      case 'AWAITING_PAYMENT':
        return {
          label: 'Awaiting Payment',
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500'
        };
      case 'PAYMENT_EVIDENCE_SUBMITTED':
      case 'PAYMENT_UNDER_REVIEW':
        return {
          label: 'Payment Under Review',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'PAYMENT_CONFIRMED':
      case 'READY_FOR_SCHEDULING':
        return {
          label: 'Ready for Scheduling',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-600'
        };
      case 'CAPTURING_SCHEDULED':
        return {
          label: 'Capturing Scheduled',
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          dot: 'bg-cyan-600'
        };
      case 'CAPTURING_COMPLETED':
      case 'AWAITING_PASS_PRODUCTION':
        return {
          label: 'Pass In Production',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-600'
        };
      case 'PASS_READY_FOR_COLLECTION':
        return {
          label: 'Ready for Collection',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
          dot: 'bg-emerald-600'
        };
      case 'COLLECTED':
      case 'CLOSED':
        return {
          label: 'Pass Collected',
          bg: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
          dot: 'bg-slate-600'
        };
      case 'REJECTED':
      case 'PAYMENT_REJECTED':
        return {
          label: 'Rejected',
          bg: 'bg-red-50 text-red-800 border-red-200',
          dot: 'bg-red-500'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-slate-100 text-slate-500 border-slate-200',
          dot: 'bg-slate-400'
        };
      default:
        return {
          label: String(status).replace(/_/g, ' '),
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
