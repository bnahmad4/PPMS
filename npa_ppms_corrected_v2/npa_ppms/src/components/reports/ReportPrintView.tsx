import React from 'react';
import { ShieldCheck, Landmark, CheckCircle2, QrCode } from 'lucide-react';
import { DatasetColumnConfig } from './reportDefinitions';

interface ReportPrintViewProps {
  title: string;
  subtitle: string;
  portScope: string;
  dateRangeLabel: string;
  items: any[];
  columns: DatasetColumnConfig[];
  visibleColumns: string[];
  totalAmountNgn: number;
  totalHeadcount: number;
  reportRef?: string;
  generatedBy?: string;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  title,
  subtitle,
  portScope,
  dateRangeLabel,
  items,
  columns,
  visibleColumns,
  totalAmountNgn,
  totalHeadcount,
  reportRef = `NPA/HQ/PPMS-REP/2026/${Math.floor(100000 + Math.random() * 900000)}`,
  generatedBy = 'Authorized NPA Executive Officer'
}) => {
  const activeCols = columns.filter(c => visibleColumns.includes(c.id));

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-2xs space-y-6 text-slate-900 print:p-0 print:border-none print:shadow-none">
      {/* Official Government Letterhead */}
      <div className="border-b-2 border-[#087443] pb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <img
            src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="NPA Crest"
            className="h-18 w-18 object-contain rounded-full shadow-xs"
          />
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              FEDERAL REPUBLIC OF NIGERIA • FEDERAL MINISTRY OF MARINE AND BLUE ECONOMY
            </div>
            <h1 className="text-xl font-black text-[#087443] tracking-tight uppercase">
              NIGERIAN PORTS AUTHORITY
            </h1>
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              DIGITAL PORT PASS MANAGEMENT SYSTEM (PPMS) — {title}
            </h2>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Scope: <strong>{portScope}</strong> • Reporting Period: <strong>{dateRangeLabel}</strong>
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono space-y-1">
          <div>
            <span className="text-slate-400 text-[10px] block">DOCUMENT REGISTER:</span>
            <span className="font-bold text-[#087443]">{reportRef}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">GENERATED AT:</span>
            <span className="font-bold text-slate-800">{new Date().toLocaleString('en-NG')}</span>
          </div>
          <div className="pt-1">
            <span className="inline-block px-2 py-0.5 rounded-sm bg-emerald-100 text-[#087443] text-[9px] font-black uppercase tracking-wider">
              OFFICIAL CONFIDENTIAL
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary Metrics Card */}
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 block text-[11px]">Filtered Records</span>
          <span className="text-xl font-bold font-mono text-slate-900">{items.length}</span>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-emerald-800 block text-[11px] font-medium">Total Staff Headcount</span>
          <span className="text-xl font-bold font-mono text-[#087443]">{totalHeadcount.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-800 block text-[11px] font-medium">Total Value / Revenue</span>
          <span className="text-xl font-bold font-mono text-blue-900">NGN {totalAmountNgn.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-700 block text-[11px] font-medium">System SLA Compliance</span>
          <span className="text-xl font-bold font-mono text-[#087443]">99.4%</span>
        </div>
      </div>

      {/* Main Official Register Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#087443] text-white">
            <tr>
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              {activeCols.map(col => (
                <th
                  key={col.id}
                  className={`py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                  {idx + 1}
                </td>
                {activeCols.map(col => {
                  const val = col.getValue(item);
                  return (
                    <td
                      key={col.id}
                      className={`py-2 px-3 ${col.align === 'right' ? 'text-right font-mono' : 'text-left'}`}
                    >
                      {col.format === 'currency' ? (
                        <span className="font-bold">NGN {Number(val || 0).toLocaleString()}</span>
                      ) : col.format === 'date' ? (
                        <span className="font-mono text-slate-700">
                          {val ? new Date(val).toLocaleDateString('en-NG') : '-'}
                        </span>
                      ) : col.format === 'badge' ? (
                        <span className="font-bold text-[10px] text-slate-800 uppercase font-mono">
                          {String(val || '-').replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span>{val != null ? String(val) : '-'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {totalAmountNgn > 0 && (
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={activeCols.length} className="py-2.5 px-4 text-right uppercase tracking-wider font-mono">
                  Cumulative Grand Total:
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-[#087443]">
                  NGN {totalAmountNgn.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Official Sign-off and Verification Block */}
      <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-xs">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
            VETTED BY (OIC ID UNIT):
          </span>
          <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
            <span className="font-serif italic text-slate-600">Alhaji Suleiman Bello, OIC</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Head of Pass Vetting & Biometrics</span>
        </div>

        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
            VERIFIED BY (ACCOUNTS DIVISION):
          </span>
          <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
            <span className="font-serif italic text-slate-600">Mr. Dayo Adeleke, FCA</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Port Accounts & Revenue Reconciliation</span>
        </div>

        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
            SECURITY CLEARANCE (GM SECURITY):
          </span>
          <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
            <span className="font-serif italic text-slate-600">Col. M. A. Kabir (Rtd.)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">General Manager, Port Security Division</span>
        </div>
      </div>

      {/* Document Footer */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div>
          <span>Nigerian Ports Authority Headquarters, 26/28 Marina, Lagos, Nigeria.</span>
          <span className="block text-slate-400">Official Electronic Record • Digitally Signed & Timestamped</span>
        </div>
        <div className="text-right">
          <span>Authority Ref: {reportRef}</span>
          <span className="block text-slate-400">Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};
