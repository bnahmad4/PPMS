import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, newPassword?: string) => void;
  initialEmail?: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = ''
}) => {
  // Stages: 'REQUEST' -> 'VERIFY' -> 'SUCCESS'
  const [stage, setStage] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');

  // Input states
  const [identifier, setIdentifier] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Response metadata from request step
  const [maskedEmail, setMaskedEmail] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(15);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Request Password Reset Code
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please provide your registered corporate email or CAC registration number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword(cleanId);
      if (res.success) {
        setMaskedEmail(res.maskedEmail || res.email);
        setTargetEmail(res.email);
        setCompanyName(res.companyName || '');
        setPreviewCode(res.previewCode || '');
        setExpiresInMinutes(res.expiresInMinutes || 15);
        if (res.previewCode) {
          setCode(res.previewCode);
        }
        setResendCooldown(30);
        setStage('VERIFY');
      } else {
        setError(res.message || 'Unable to locate account. Please verify your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process request. Please ensure the email or CAC number is correct.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Code
  const handleResend = async () => {
    if (resendCooldown > 0 || !targetEmail) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword(targetEmail);
      if (res.success) {
        setPreviewCode(res.previewCode || '');
        if (res.previewCode) {
          setCode(res.previewCode);
        }
        setResendCooldown(45);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCode) {
      setError('Please enter the 6-digit verification PIN received in your email.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setError('Passwords do not match. Please re-enter both password fields accurately.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: targetEmail || identifier.trim(),
        code: cleanCode,
        newPassword: cleanPass
      });

      if (res.success) {
        setStage('SUCCESS');
      } else {
        setError(res.message || 'Failed to reset password. Please check your verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess(targetEmail || identifier, newPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-emerald-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-850 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
                <KeyRound className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Password Recovery
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                    Self-Service
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/80">
                  Nigerian Ports Authority • Corporate Credential Management
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-600/40 text-[11px] font-medium">
            <div className={`flex items-center gap-1.5 ${stage === 'REQUEST' ? 'text-white font-bold' : 'text-emerald-200/70'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${stage === 'REQUEST' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-900/60 text-emerald-200'}`}>1</span>
              <span>Find Account</span>
            </div>
            <div className={`flex items-center gap-1.5 ${stage === 'VERIFY' ? 'text-white font-bold' : 'text-emerald-200/70'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${stage === 'VERIFY' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-900/60 text-emerald-200'}`}>2</span>
              <span>Verify & Reset</span>
            </div>
            <div className={`flex items-center gap-1.5 ${stage === 'SUCCESS' ? 'text-white font-bold' : 'text-emerald-200/70'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${stage === 'SUCCESS' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-900/60 text-emerald-200'}`}>3</span>
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STAGE 1: ACCOUNT LOOKUP & PIN DISPATCH */}
          {stage === 'REQUEST' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-[#087443]" />
                  NPA Corporate Security Rule:
                </div>
                <p className="text-[11px] text-emerald-800">
                  Password reset verification PINs are dispatched strictly to the official corporate email address bound to your company's profile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Corporate Email or CAC Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. dangote@portlogistics.ng or RC-109283"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden font-medium text-slate-900"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can enter your registered corporate email address or official CAC Registration Number.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending PIN...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification PIN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STAGE 2: VERIFY PIN & SET NEW PASSWORD */}
          {stage === 'VERIFY' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-[#087443]" />
                    PIN Dispatched via SMTP
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    Valid for {expiresInMinutes} mins
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Verification PIN sent to <strong className="font-mono text-emerald-950">{maskedEmail}</strong>
                  {companyName && <span> ({companyName})</span>}.
                </p>
              </div>

              {/* Developer / Testing PIN Quick Reference */}
              {previewCode && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs flex items-center justify-between text-blue-900">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px]">Testing PIN (Auto-Filled):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(previewCode)}
                    className="font-mono font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded text-xs cursor-pointer"
                    title="Click to fill PIN"
                  >
                    {previewCode}
                  </button>
                </div>
              )}

              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Security Verification PIN *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.35em] font-mono text-base font-bold pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Corporate Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443] outline-hidden font-medium text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className={`w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 outline-hidden font-medium text-slate-900 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:ring-[#087443]/20 focus:border-[#087443]'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStage('REQUEST')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Change Email / CAC
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend PIN'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !code || !newPassword || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STAGE 3: SUCCESS CONFIRMATION */}
          {stage === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-[#087443] shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Password Reset Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your corporate access credentials have been securely updated in the NPA Port Pass Management System.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-left text-xs space-y-1.5 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-bold text-slate-900">{targetEmail}</span>
                </div>
                {companyName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Company:</span>
                    <span className="font-bold text-slate-900">{companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-700 font-bold">ACTIVE & READY</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In with New Password</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>NPA Security & Clearance Bureau</span>
          <span>Port Pass Management System</span>
        </div>

      </div>
    </div>
  );
};
