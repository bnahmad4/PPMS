import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { PassRecord } from '../../types';
import {
  IdCard,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  RotateCw,
  Download
} from 'lucide-react';
import { downloadFile } from '../common/FilePreviewModal';

export const PassesListView: React.FC = () => {
  const { currentPortId } = useAuth();
  const [passes, setPasses] = useState<PassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPass, setSelectedPass] = useState<PassRecord | null>(null);

  const loadPasses = async () => {
    try {
      setLoading(true);
      const res = await api.getPasses({
        portId: currentPortId !== 'ALL' ? currentPortId : undefined,
        search: searchQuery.trim() || undefined
      });
      setPasses(res.passes || []);
    } catch (err) {
      console.error('Error loading passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasses();
  }, [currentPortId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Issued Port Passes & Identity Cards Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master database of printed RFID badges, biometric access passes, and collection records.
          </p>
        </div>

        <button
          onClick={loadPasses}
          className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Passes Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#087443] text-white font-bold">
              <tr>
                <th className="py-3 px-4">Pass Serial Number</th>
                <th className="py-3 px-4">Pass Holder</th>
                <th className="py-3 px-4">Sponsoring Company</th>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">Valid From - Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Card Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading pass register...</td>
                </tr>
              ) : passes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No passes issued matching criteria.</td>
                </tr>
              ) : (
                passes.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-[#087443]">
                      {pass.serialNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {pass.employeeName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pass.companyName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pass.portName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {pass.validFrom} to {pass.validUntil}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                          pass.status === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {pass.status === 'COLLECTED' ? 'COLLECTED (ACTIVE)' : 'READY FOR PICKUP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPass(pass)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#087443] hover:text-white text-slate-700 font-bold rounded border border-slate-300 text-xs transition-colors"
                      >
                        Digital Badge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Port Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-300">
            {/* NPA Card Layout */}
            <div className="bg-[#087443] p-4 text-white text-center border-b-4 border-[#C9A24D]">
              <img src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="NPA" className="h-12 w-12 mx-auto object-contain rounded-full bg-white p-0.5 shadow-xs mb-1" />
              <div className="text-xs font-black tracking-wider uppercase">NIGERIAN PORTS AUTHORITY</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase">OFFICIAL PORT ACCESS PERMIT</div>
            </div>

            <div className="p-5 text-center space-y-4 bg-slate-50">
              <div className="w-24 h-28 mx-auto bg-slate-200 border-2 border-slate-300 rounded-lg overflow-hidden shadow-xs flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"
                  alt="Holder"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight uppercase">
                  {selectedPass.employeeName}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {selectedPass.companyName}
                </p>
                <div className="font-mono text-xs font-bold text-[#087443] mt-2 bg-emerald-100/70 py-1 px-3 rounded inline-block">
                  {selectedPass.serialNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 rounded border border-slate-200 font-mono text-left">
                <div>
                  <span className="text-slate-400 block">PORT ZONE:</span>
                  <span className="font-bold text-slate-800">{selectedPass.portName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">EXPIRES:</span>
                  <span className="font-bold text-slate-800">{selectedPass.validUntil}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col items-center">
                <div className="p-2 bg-white rounded border border-slate-300 shadow-2xs">
                  <div className="font-mono text-[9px] text-slate-600 select-all max-w-[200px] truncate">
                    {selectedPass.qrToken}
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-1">ISPS COMPLIANT SECURITY CHIP TOKEN</span>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadFile({
                  fileName: `NPA_PortPass_${selectedPass.serialNumber.replace(/\//g, '_')}.html`,
                  documentName: `Official Port Pass - ${selectedPass.employeeName}`,
                  holderName: selectedPass.employeeName,
                  referenceNumber: selectedPass.serialNumber
                })}
                className="flex-1 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Pass</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer"
                title="Print Pass"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPass(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
