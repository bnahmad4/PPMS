import React from 'react';
import { Application } from '../../types';
import { NpaLogo } from './NpaLogo';
import { Printer, X, ShieldAlert, CheckCircle } from 'lucide-react';

interface PrintableAcknowledgementProps {
  application: Application;
  onClose: () => void;
}

export const PrintableAcknowledgement: React.FC<PrintableAcknowledgementProps> = ({ application, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-300 print:m-0 print:border-none print:shadow-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold">Official NPA Port Pass Application Slip</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-xs font-bold rounded text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="p-8 space-y-6 text-slate-900 font-sans">
          {/* Header */}
          <div className="border-b-2 border-[#087443] pb-4 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="NPA Crest" className="h-16 w-16 object-contain rounded-full shadow-2xs" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#087443] uppercase">
                  NIGERIAN PORTS AUTHORITY
                </h1>
                <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                  DIGITAL PORT PASS MANAGEMENT SYSTEM (PPMS)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Official Application Acknowledgement & Security Verification Slip
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">DOCUMENT SERIAL</span>
              <span className="text-sm font-mono font-bold text-[#087443] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {application.referenceNumber}
              </span>
            </div>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium block">Sponsoring Company:</span>
              <span className="font-bold text-slate-900 text-sm">{application.companyName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Assigned Port Location:</span>
              <span className="font-bold text-slate-900">{application.portName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Customer Category:</span>
              <span className="font-bold text-slate-900">{application.categoryName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Permit Type:</span>
              <span className="font-bold text-slate-900">{application.passTypeName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Submission Date:</span>
              <span className="font-bold text-slate-900 font-mono">
                {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-NG') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Conditions Acceptance:</span>
              <span className="font-bold text-[#087443] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Digitally Executed
              </span>
            </div>
          </div>

          {/* Personnel Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Registered Personnel Schedule ({application.employees.length})
            </h3>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#087443] text-white">
                  <tr>
                    <th className="py-2 px-3 font-semibold">#</th>
                    <th className="py-2 px-3 font-semibold">Passport</th>
                    <th className="py-2 px-3 font-semibold">Full Legal Name</th>
                    <th className="py-2 px-3 font-semibold">Designation</th>
                    <th className="py-2 px-3 font-semibold">Identity Reference</th>
                    <th className="py-2 px-3 font-semibold">Capturing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {application.employees.map((emp, i) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3">
                        <img
                          src={emp.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={emp.fullName}
                          className="w-9 h-11 object-cover rounded bg-slate-200 border border-slate-300"
                        />
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{emp.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">{emp.position}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{emp.idType}: {emp.idReference}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{emp.capturingStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Barcode & Security Stamp Verification */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-mono text-xl tracking-[0.25em] font-extrabold text-slate-800 select-all">
                ||||| | |||| ||| ||||||| ||| |||||
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                AUTH TOKEN: {application.referenceNumber.replace(/[\/-]/g, '')}
              </span>
            </div>

            <div className="text-right text-xs">
              <div className="font-semibold text-slate-800">OIC ID Unit Counterfoil</div>
              <div className="text-[11px] text-slate-500">Security & Biometrics Control</div>
              <div className="text-[10px] font-mono text-[#087443] mt-1 font-bold">VERIFIED VIA PPMS v3.0</div>
            </div>
          </div>

          {/* Statutory Security Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-relaxed">
            <strong>CRITICAL SECURITY NOTICE:</strong> This acknowledgement slip is an administrative tracking reference only. It does <strong>NOT</strong> grant entry or physical access into any Nigerian Ports Authority operational port gate, quay, or terminal prior to completion of security vetting, Oracle billing payment verification, biometric capturing, and collection of the official physical Port Pass.
          </div>
        </div>
      </div>
    </div>
  );
};
