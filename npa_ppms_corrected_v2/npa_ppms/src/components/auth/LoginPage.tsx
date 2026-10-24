import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Application, WorkflowLog } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { NpaLogo } from '../common/NpaLogo';
import { PasswordResetModal } from './PasswordResetModal';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  CheckCircle2,
  Search,
  Clock,
  Calendar,
  User,
  FileCheck2,
  Anchor,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

interface LoginPageProps {
  onRegisterCompany?: () => void;
  registeredSuccessMsg?: string | null;
  onClearRegisteredMsg?: () => void;
  prefillEmail?: string;
  initialMode?: 'LOGIN' | 'TRACK';
  initialTrackRef?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onRegisterCompany,
  registeredSuccessMsg,
  onClearRegisteredMsg,
  prefillEmail,
  initialMode,
  initialTrackRef
}) => {
  const { login } = useAuth();

  // Mode: 'LOGIN' | 'TRACK'
  const [activeMode, setActiveMode] = useState<'LOGIN' | 'TRACK'>(initialMode || 'LOGIN');

  // Authentication State
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Application Tracking State
  const [trackQuery, setTrackQuery] = useState(initialTrackRef || '');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedApp, setTrackedApp] = useState<Application | null>(null);
  const [trackedLogs, setTrackedLogs] = useState<WorkflowLog[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);

  React.useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  React.useEffect(() => {
    if (initialMode) setActiveMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    if (initialTrackRef) {
      setTrackQuery(initialTrackRef);
      handleTrackSubmit(undefined, initialTrackRef);
    }
  }, [initialTrackRef]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both your official Email/Username and Password.');
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrackSubmit = async (e?: React.FormEvent, customRef?: string) => {
    if (e) e.preventDefault();
    const query = (customRef !== undefined ? customRef : trackQuery).trim();
    if (!query) {
      setTrackError('Please enter an Application Reference Number (e.g. NPA/PPMS/LPC/2026/000001).');
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackError(null);
      setTrackedApp(null);
      setTrackedLogs([]);

      const res = await api.trackApplication(query);
      if (res.success && res.application) {
        setTrackedApp(res.application);
        setTrackedLogs(res.workflowLogs || []);
      } else {
        setTrackError('Application not found. Please verify the reference number.');
      }
    } catch (err: any) {
      setTrackError(err.message || 'Application not found with the reference number provided.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Helper to compute progress percentage along 7 workflow stages
  const getStageStep = (status: string) => {
    switch (status) {
      case 'DRAFT': return 1;
      case 'PENDING_ID_UNIT_VERIFICATION':
      case 'RETURNED_FOR_CORRECTION':
      case 'REJECTED_BY_ID_UNIT': return 2;
      case 'PENDING_GM_SECURITY_APPROVAL':
      case 'REJECTED_BY_GM_SECURITY': return 3;
      case 'PENDING_BILLING': return 4;
      case 'BILL_ISSUED':
      case 'PAYMENT_UNDER_REVIEW':
      case 'PAYMENT_CONFIRMED': return 5;
      case 'PENDING_CAPTURING_SCHEDULE':
      case 'CAPTURING_SCHEDULED':
      case 'AWAITING_PASS_PRODUCTION': return 6;
      case 'PASS_READY_FOR_COLLECTION':
      case 'COLLECTED': return 7;
      default: return 2;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c5332] via-[#107044] to-[#0e633c] flex flex-col justify-between selection:bg-[#087443] selection:text-white relative overflow-x-hidden font-sans">
      {/* Background Seaport Imagery with Luminous Lighter Green Atmospheric Overlays */}
      <div className="fixed inset-0 z-0">
        <img
          src="/src/assets/images/npa_port_backdrop_1792344868227.jpg"
          alt="Nigerian Ports Authority Seaport Container Terminal"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out brightness-110 contrast-90"
          referrerPolicy="no-referrer"
        />
        {/* Soft, light emerald-green maritime wash */}
        <div className="absolute inset-0 bg-emerald-950/25 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-emerald-700/15 to-teal-800/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-300/35 via-teal-200/20 to-transparent pointer-events-none" />
        {/* Luminous, light green ambient aura centered right behind the login card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[650px] bg-gradient-to-br from-emerald-300/50 via-teal-200/45 to-emerald-400/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="max-w-4xl w-full">
          {activeMode === 'LOGIN' ? (
            /* =================== REDESIGNED LOGIN VIEW =================== */
            <div className="relative max-w-lg mx-auto">
              {/* Distinctive Lighter Green Ambient Halo & Shadow behind login card */}
              <div className="absolute -inset-6 bg-gradient-to-r from-emerald-300/80 via-teal-200/75 to-emerald-400/80 rounded-3xl blur-3xl opacity-95 pointer-events-none -z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200/90 via-teal-100/70 to-emerald-300/80 rounded-2xl blur-xl opacity-90 pointer-events-none -z-10" />
              <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_28px_-12px_rgba(15,23,42,0.22)] border border-slate-200 ring-1 ring-slate-200/70 overflow-hidden">
                {/* Card Banner */}
                <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-white border-b border-emerald-100/80">
                  <div className="flex justify-center mb-3">
                    <NpaLogo className="h-14 w-auto" showSubtitle={false} />
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Sign In to PPMS Portal
                  </h1>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Access official port pass issuance, review queues, and permit management.
                </p>

                {/* Quick Track Switcher Pill */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500">Submitted an application already?</span>
                  <button
                    type="button"
                    onClick={() => setActiveMode('TRACK')}
                    className="text-xs font-bold text-[#087443] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Track Status Online <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4">
                {registeredSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center justify-between gap-2 font-medium shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087443]" />
                      <span>{registeredSuccessMsg}</span>
                    </div>
                    {onClearRegisteredMsg && (
                      <button
                        type="button"
                        onClick={onClearRegisteredMsg}
                        className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address or Username *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. dangote@portlogistics.ng or officer@nigerianports.gov.ng"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden font-medium text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden font-medium text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#087443] border-slate-300 focus:ring-[#087443]"
                    />
                    <span className="text-slate-600 font-medium">Keep me signed in</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-[#087443] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {authLoading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to PPMS</span>
                    </>
                  )}
                </button>

                {/* Company Registration Section */}
                <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700">New Maritime Stakeholder or Port Operator?</p>
                  <p className="text-[11px] text-slate-500">
                    Register your company once. Administrator credentials are sent exclusively to your corporate email.
                  </p>
                  {onRegisterCompany ? (
                    <button
                      type="button"
                      onClick={onRegisterCompany}
                      className="inline-flex items-center gap-1.5 font-bold text-[#087443] hover:underline cursor-pointer pt-1"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Register Company (One-Time Statutory Profiling)</span>
                    </button>
                  ) : (
                    <span className="font-bold text-[#087443]">Company Registration Available Online</span>
                  )}
                </div>
              </form>
            </div>
          </div>
          ) : (
            /* =================== APPLICATION TRACKING VIEW =================== */
            <div className="relative max-w-2xl mx-auto">
              {/* Distinctive Lighter Green Ambient Halo & Shadow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-emerald-300/80 via-teal-200/75 to-emerald-400/80 rounded-3xl blur-3xl opacity-90 pointer-events-none -z-10" />
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200/90 via-teal-100/70 to-emerald-300/80 rounded-2xl blur-xl opacity-90 pointer-events-none -z-10" />
              <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_28px_-12px_rgba(15,23,42,0.22)] border border-slate-200 ring-1 ring-slate-200/70 overflow-hidden">
                {/* Tracking Header */}
                <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-white border-b border-emerald-100/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
                      alt="NPA"
                      className="h-10 w-10 rounded-full object-contain shadow-2xs shrink-0"
                    />
                    <div className="flex items-center gap-1.5 text-[#087443]">
                      <Search className="w-4 h-4" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Public Pass Tracking Portal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMode('LOGIN')}
                    className="text-xs font-bold text-[#087443] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Back to Login <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h1 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                  Track Port Pass Application Status
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your official NPA PPMS Reference Number or Corporate ID to inspect real-time progress across all 7 statutory stages.
                </p>

                {/* Tracking Search Input */}
                <form onSubmit={handleTrackSubmit} className="mt-5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        placeholder="e.g. NPA/PPMS/LPC/2026/000001"
                        className="w-full text-xs font-mono font-medium pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden text-slate-900 uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={trackingLoading}
                      className="px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {trackingLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Track Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </div>

              {/* Tracking Results Area */}
              <div className="p-6 sm:p-8">
                {trackError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-3 font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                    <span>{trackError}</span>
                  </div>
                )}

                {trackedApp ? (
                  <div className="space-y-6">
                    {/* Top Summary Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase">OFFICIAL REFERENCE</div>
                        <div className="text-base font-black font-mono text-[#087443]">
                          {trackedApp.referenceNumber}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {trackedApp.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {trackedApp.portName} • {trackedApp.categoryName}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">CURRENT STATUS</div>
                        <StatusBadge status={trackedApp.status} />
                      </div>
                    </div>

                    {/* Visual 7-Stage Workflow Pipeline */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#087443]" />
                          Statutory Approval Stage Progress
                        </span>
                        <span className="text-xs font-bold font-mono text-[#087443]">
                          Step {getStageStep(trackedApp.status)} of 7
                        </span>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {[
                          { step: 1, label: 'Creation' },
                          { step: 2, label: 'ID Unit' },
                          { step: 3, label: 'GM Security' },
                          { step: 4, label: 'Billing' },
                          { step: 5, label: 'Accounts' },
                          { step: 6, label: 'Capturing' },
                          { step: 7, label: 'Ready/Issued' },
                        ].map((s) => {
                          const currentStep = getStageStep(trackedApp.status);
                          const isCompleted = s.step < currentStep;
                          const isCurrent = s.step === currentStep;

                          return (
                            <div key={s.step} className="text-center">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isCompleted
                                    ? 'bg-[#087443]'
                                    : isCurrent
                                    ? 'bg-[#C9A24D]'
                                    : 'bg-slate-200'
                                }`}
                              />
                              <span
                                className={`text-[9px] mt-1.5 block truncate font-medium ${
                                  isCurrent
                                    ? 'text-[#087443] font-bold'
                                    : isCompleted
                                    ? 'text-slate-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personnel List with Passports */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Registered Personnel Schedule ({trackedApp.employees?.length || 0})</span>
                        <span className="text-[10px] text-slate-500">Each employee carries passport photo</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {trackedApp.employees?.map((emp) => (
                          <div key={emp.id} className="p-3 flex items-center gap-3 bg-white">
                            <img
                              src={emp.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={emp.fullName}
                              className="w-9 h-11 object-cover rounded bg-slate-200 border border-slate-300 shrink-0"
                            />
                            <div className="flex-1 text-xs">
                              <div className="font-bold text-slate-900">{emp.fullName}</div>
                              <div className="text-[11px] text-slate-500">{emp.position}</div>
                              <div className="text-[10px] font-mono text-slate-600">
                                {emp.idType}: {emp.idReference}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {emp.capturingStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Workflow Audit Trail History */}
                    {trackedLogs.length > 0 && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#087443]" />
                          Official Workflow Activity Trail
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {trackedLogs.map((log) => (
                            <div key={log.id} className="text-xs p-2.5 rounded bg-white border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-900">{log.responsibleUserName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 italic">"{log.remarks}"</div>
                              <div className="text-[10px] text-[#087443] font-semibold">
                                Transitioned to: {log.newStatus.replace(/_/g, ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !trackingLoading && (
                  <div className="text-center py-8 text-slate-400 space-y-2">
                    <Search className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">
                      Enter a reference number above to view live approval status, billing status, and biometric schedule.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Official Self-Service Corporate Password Recovery Modal */}
      <PasswordResetModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        onSuccess={(resetEmail, newPass) => {
          setEmail(resetEmail);
          if (newPass) setPassword(newPass);
          setShowForgotModal(false);
        }}
      />

      {/* Official NPA System Accreditation Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-emerald-100/90">
        <p className="font-semibold text-white drop-shadow-sm">
          Federal Republic of Nigeria • Nigerian Ports Authority (NPA)
        </p>
        <p className="text-[11px] text-emerald-200/80 mt-0.5 drop-shadow-sm font-medium">
          Digital Port Pass Management System (PPMS) • Certified Secure Enterprise Portal
        </p>
      </footer>
    </div>
  );
};
