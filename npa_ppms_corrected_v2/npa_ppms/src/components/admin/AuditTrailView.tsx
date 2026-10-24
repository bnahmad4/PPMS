import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditTrailEntry } from '../../types';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  RotateCw,
  Lock
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.entityName.toLowerCase().includes(q) ||
      (l.entityId && l.entityId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Immutable System Audit Trail
            </h1>
            <span className="text-[10px] bg-emerald-100 text-[#087443] font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3" /> TAMPER-EVIDENT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 34 NDPA & Statutory Port Access Compliance Ledger. Every approval, billing entry, and file upload is permanently recorded.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit trail by action, officer, entity ID..."
          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#087443] text-white font-bold">
              <tr>
                <th className="py-2.5 px-4">Timestamp (WAT)</th>
                <th className="py-2.5 px-4">Action Code</th>
                <th className="py-2.5 px-4">Responsible User</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4">Context Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No audit events found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString('en-NG')}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#087443]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {log.entityName} {log.entityId ? `(#${log.entityId})` : ''}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
