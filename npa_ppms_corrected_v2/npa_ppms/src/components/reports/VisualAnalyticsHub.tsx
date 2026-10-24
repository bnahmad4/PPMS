import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  PieChart,
  HardDrive
} from 'lucide-react';
import { ReportSummaryStats } from '../../types';

interface VisualAnalyticsHubProps {
  summary: ReportSummaryStats;
  selectedPortId?: string;
  onSelectPort?: (portId: string) => void;
}

export const VisualAnalyticsHub: React.FC<VisualAnalyticsHubProps> = ({
  summary,
  selectedPortId,
  onSelectPort
}) => {
  const collectionRate = summary.totalRevenueNgn + summary.totalPendingRevenueNgn > 0
    ? ((summary.totalRevenueNgn / (summary.totalRevenueNgn + summary.totalPendingRevenueNgn)) * 100).toFixed(1)
    : '100.0';

  const pipelineStages = [
    { label: '1. Submission', count: summary.totalApplications, color: 'bg-slate-500' },
    { label: '2. ID Unit Vetting', count: summary.pendingIdUnit, color: 'bg-amber-500' },
    { label: '3. GM Security Review', count: summary.pendingGmSecurity, color: 'bg-indigo-500' },
    { label: '4. Tariff Billing', count: summary.pendingBilling, color: 'bg-blue-500' },
    { label: '5. Remita Payment Review', count: summary.paymentReview, color: 'bg-emerald-600' },
    { label: '6. Biometrics Capturing', count: summary.capturingScheduled, color: 'bg-cyan-500' },
    { label: '7. Passes Ready', count: summary.passesReady, color: 'bg-teal-500' },
    { label: '8. Collected Active Cards', count: summary.completed, color: 'bg-[#087443]' }
  ];

  const maxPortCount = Math.max(...summary.byPort.map(p => p.count), 1);
  const maxMonthlyCount = Math.max(...summary.monthlyTrend.map(m => m.applicationsCount), 1);

  return (
    <div className="space-y-6">
      {/* Executive Key Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Dossiers</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">
            {summary.totalApplications}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> All Ports Combined
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Passes Issued</span>
            <ShieldCheck className="w-4 h-4 text-[#087443]" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-[#087443]">
            {summary.totalPassesIssued}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            RFID Encrypted Cards
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Remita TSA Cleared</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black font-mono text-blue-900">
            NGN {summary.totalRevenueNgn.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
            CBN Settlement Verified
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Pending Collections</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-black font-mono text-amber-900">
            NGN {summary.totalPendingRevenueNgn.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
            In Assessment / Review
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Avg SLA Velocity</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-950">
            {summary.avgTurnaroundHours}h
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            Submission to Collection
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 text-xs font-semibold">
            <span>Collection Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-teal-900">
            {collectionRate}%
          </div>
          <span className="text-[10px] text-teal-600 font-medium mt-0.5 block">
            Treasury Efficiency
          </span>
        </div>
      </div>

      {/* Middle Row: Port Distribution & Workflow Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Port Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#087443]" />
                Applications & Revenue by NPA Port Complex
              </h3>
              <p className="text-xs text-slate-500">Relative throughput across the 6 port commands</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Total: {summary.totalApplications}</span>
          </div>

          <div className="space-y-3 pt-1">
            {summary.byPort.map(p => {
              const pct = summary.totalApplications > 0
                ? ((p.count / summary.totalApplications) * 100).toFixed(1)
                : '0.0';
              const widthPct = Math.max((p.count / maxPortCount) * 100, 3);
              const isSelected = selectedPortId === p.portId;

              return (
                <div
                  key={p.portId}
                  onClick={() => onSelectPort && onSelectPort(isSelected ? 'ALL' : p.portId)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#087443] bg-emerald-50/50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#087443] bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        {p.portCode}
                      </span>
                      <span className="font-semibold text-slate-800">{p.portName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="font-mono text-[11px] text-slate-500">
                        NGN {p.revenueNgn.toLocaleString()}
                      </span>
                      <span className="font-mono font-bold text-slate-900 min-w-8">
                        {p.count} ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.count > 0 ? 'bg-[#087443]' : 'bg-slate-300'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Stage Pipeline Funnel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                Dossier Workflow Pipeline Funnel
              </h3>
              <p className="text-xs text-slate-500">Active queue stages across statutory vetting</p>
            </div>
            <span className="text-[11px] font-mono text-[#087443] font-bold">Live Status</span>
          </div>

          <div className="space-y-2 pt-1">
            {pipelineStages.map((stage, idx) => {
              const pct = summary.totalApplications > 0
                ? ((stage.count / summary.totalApplications) * 100).toFixed(1)
                : '0.0';

              return (
                <div key={stage.label} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 min-w-44">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="font-semibold text-slate-800">{stage.label}</span>
                  </div>

                  <div className="flex-1 max-w-48 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className={`h-full ${stage.color}`}
                      style={{ width: `${Math.min(parseFloat(pct) || 0, 100)}%` }}
                    />
                  </div>

                  <div className="font-mono font-bold text-slate-800 text-right min-w-16">
                    {stage.count} <span className="text-slate-400 text-[10px] font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Monthly Throughput Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#087443]" />
                Monthly PPMS Issuance & Revenue Growth
              </h3>
              <p className="text-xs text-slate-500">Volume and verified revenue performance (Past 5 Months)</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-4 h-48 items-end">
            {summary.monthlyTrend.map(m => {
              const barHeightPct = Math.max((m.applicationsCount / maxMonthlyCount) * 100, 12);
              return (
                <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {m.applicationsCount}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden flex flex-col justify-end" style={{ height: `${barHeightPct}%` }}>
                    <div className="w-full bg-gradient-to-t from-[#087443] to-emerald-500 rounded-t-lg h-full transition-all duration-300" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 mt-2 text-center font-mono">
                    {m.month.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {(m.revenueNgn / 1000).toFixed(0)}k
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-700" />
              Category Volume Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution across concession groups</p>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {summary.byCategory.map(c => (
              <div key={c.categoryId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="font-medium text-slate-800 truncate max-w-44" title={c.categoryName}>
                  {c.categoryName}
                </span>
                <span className="font-mono font-bold text-[#087443] shrink-0">
                  {c.count} applications
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
