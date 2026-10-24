import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Eye,
  Download,
  FileText,
  Trash2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { FilePreviewModal, downloadFile, PreviewableFile } from '../common/FilePreviewModal';

interface CompanyRegistrationViewProps {
  onSuccess?: (registeredEmail: string, companyName: string) => void;
  onCancel?: () => void;
}

export const CompanyRegistrationView: React.FC<CompanyRegistrationViewProps> = ({ onSuccess, onCancel }) => {
  const { ports, refreshNotifications } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [authPhoneError, setAuthPhoneError] = useState('');
  const [mdPhoneError, setMdPhoneError] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [primaryPortId, setPrimaryPortId] = useState(ports[0]?.id || '');

  // Uploaded Corporate Documents
  const [cacDoc, setCacDoc] = useState<{ fileName: string; fileData?: string; fileSizeBytes?: number; mimeType?: string } | null>(null);
  const [taxDoc, setTaxDoc] = useState<{ fileName: string; fileData?: string; fileSizeBytes?: number; mimeType?: string } | null>(null);
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  // MD / CEO
  const [mdName, setMdName] = useState('');
  const [mdPhone, setMdPhone] = useState('');

  // Authorised Representative
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  const [cacError, setCacError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [submittedInfo, setSubmittedInfo] = useState<{
    companyName: string;
    email: string;
    companyEmail: string;
    cacNumber: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Auto-close countdown effect when registration succeeds
  React.useEffect(() => {
    if (!submittedInfo || !onSuccess) return;

    if (countdown <= 0) {
      onSuccess(submittedInfo.email, submittedInfo.companyName);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [submittedInfo, countdown, onSuccess]);

  // Accept common Nigerian mobile/landline formats, with or without +234.
  const isValidNigerianPhone = (value: string) => {
    const digits = value.replace(/[\s().-]/g, '');
    return /^(?:(?:\+234|234)(?:70|71|80|81|90|91)\d{8}|0(?:70|71|80|81|90|91)\d{8}|0[1-9]\d{7,9})$/.test(digits);
  };

  const resetForm = () => {
    setCompanyName('');
    setCacNumber('');
    setTinNumber('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setAddress('');
    setMdName('');
    setMdPhone('');
    setMdPhoneError('');
    setAuthName('');
    setAuthEmail('');
    setAuthPhone('');
    setCacDoc(null);
    setTaxDoc(null);
    setCacError(false);
    setSubmittedInfo(null);
    setResult(null);
    setCountdown(5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !cacNumber.trim() || !email.trim() || !authName.trim()) {
      setResult({ success: false, message: 'Please fill all mandatory company identity fields and authorized representative details.' });
      return;
    }

    if (!isValidNigerianPhone(phone)) {
      setPhoneError('Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.');
      setResult({ success: false, message: 'Please correct the corporate phone number before continuing.' });
      return;
    }
    setPhoneError('');
    if (!isValidNigerianPhone(authPhone)) {
      setAuthPhoneError('Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.');
      setResult({ success: false, message: 'Please correct the authorised representative phone number before continuing.' });
      return;
    }
    setAuthPhoneError('');
    if (mdPhone.trim() && !isValidNigerianPhone(mdPhone)) {
      setMdPhoneError('Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.');
      setResult({ success: false, message: 'Please correct the MD / CEO phone number or leave it blank.' });
      return;
    }
    setMdPhoneError('');

    if (!cacDoc) {
      setCacError(true);
      setResult({
        success: false,
        message: 'CAC Certificate of Incorporation is mandatory! In accordance with Nigerian Ports Authority corporate security regulations, you must attach your official CAC Certificate of Incorporation to complete registration.'
      });
      // Scroll to CAC card smoothly
      const cacCard = document.getElementById('cac-upload-section');
      if (cacCard) {
        cacCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);
      setCacError(false);
      const res = await api.registerCompany({
        company: {
          companyName: companyName.trim(),
          cacNumber: cacNumber.trim(),
          tinNumber: tinNumber.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          address: address.trim(),
          mdCeoName: mdName.trim(),
          mdCeoPhone: mdPhone.trim(),
          authRepName: authName.trim(),
          authRepEmail: authEmail.trim() || email.trim(),
          authRepPhone: authPhone.trim(),
          primaryPortId: primaryPortId || ports[0]?.id,
          cacCertificate: cacDoc ? {
            fileName: cacDoc.fileName,
            fileData: cacDoc.fileData,
            fileSizeBytes: cacDoc.fileSizeBytes,
            mimeType: cacDoc.mimeType,
            uploadedAt: new Date().toISOString()
          } : undefined,
          taxClearanceCertificate: taxDoc ? {
            fileName: taxDoc.fileName,
            fileData: taxDoc.fileData,
            fileSizeBytes: taxDoc.fileSizeBytes,
            mimeType: taxDoc.mimeType,
            uploadedAt: new Date().toISOString()
          } : undefined
        },
        userEmail: email.trim(),
        userPhone: authPhone.trim() || phone.trim()
      });

      const submittedCompany = res.company?.companyName || companyName;
      const submittedCac = res.company?.cacNumber || cacNumber;
      const submittedCompanyEmail = res.company?.email || email;
      const submittedLoginEmail = res.user?.email || submittedCompanyEmail;

      setResult({
        success: true,
        message: res.message || `Company "${submittedCompany}" successfully registered and profiled in NPA PPMS. Administrator credentials have been dispatched exclusively to the corporate email: ${submittedCompanyEmail}.`
      });

      setSubmittedInfo({
        companyName: submittedCompany,
        cacNumber: submittedCac,
        companyEmail: submittedCompanyEmail,
        email: submittedLoginEmail
      });
      setCountdown(5);

      // Clean inputs
      setCompanyName('');
      setCacNumber('');
      setTinNumber('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setAddress('');
      setMdName('');
      setMdPhone('');
    setMdPhoneError('');
      setAuthName('');
      setAuthEmail('');
      setAuthPhone('');
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToLogin = () => {
    if (submittedInfo && onSuccess) {
      onSuccess(submittedInfo.email, submittedInfo.companyName);
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Submission Success Dialog */}
      {submittedInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 max-w-lg w-full p-6 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-[#087443] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase tracking-wider">
                Corporate Profiling Confirmed
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Company Profiled Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your corporate entity is now officially registered in the Nigerian Ports Authority PPMS. Under NPA statutory rules, each company is registered <strong>once only</strong>.
              </p>
            </div>

            {/* Exclusive Corporate Email Dispatch Security Callout */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-[#087443]">
                <Mail className="w-4 h-4 shrink-0 text-[#087443]" />
                <span className="text-[12px]">Credentials Dispatched Exclusively to Company Email</span>
              </div>
              <p className="text-[11.5px] text-emerald-950 leading-relaxed">
                In strict compliance with NPA corporate security regulations, your initial portal login credentials and temporary administrator password have been transmitted <strong>exclusively to your registered corporate email:</strong>
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono font-bold text-xs text-[#087443] truncate shadow-2xs">
                {submittedInfo.companyEmail}
              </div>
              <p className="text-[10.5px] text-emerald-800 font-medium">
                🔒 No passwords are displayed on this screen. Please check the corporate inbox at <span className="font-bold underline">{submittedInfo.companyEmail}</span> to retrieve your credentials and sign in.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                <span className="text-slate-500">Registered Entity:</span>
                <span className="font-bold text-slate-900">{submittedInfo.companyName}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                <span className="text-slate-500">CAC Registration:</span>
                <span className="font-mono font-bold text-slate-700">{submittedInfo.cacNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                <span className="text-slate-500">Official Login Username:</span>
                <span className="font-mono font-bold text-[#087443]">{submittedInfo.companyEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Profiling Status:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">ACTIVE & PROFILED</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Returning to portal login in <span className="font-bold text-slate-800 font-mono">{countdown}s</span>...
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleReturnToLogin}
                className="flex-1 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition-colors"
              >
                Proceed to Corporate Sign-In
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Close & Return to Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#087443] text-white p-6 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="NPA"
            className="h-14 w-14 object-contain rounded-full bg-white p-1 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest block">
                Stage 1 • Corporate Onboarding
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                Single Registration Policy
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-1">
              Corporate Entity Registration & NPA Stakeholder Profiling
            </h1>
            <p className="text-xs text-emerald-100 mt-1">
              One-time corporate profiling. Initial portal administrator credentials will be transmitted exclusively to your official company email.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start sm:self-auto text-xs bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg border border-emerald-600/50 cursor-pointer"
          >
            ← Back to Login
          </button>
        )}
      </div>

      {/* Statutory One-Time Registration & Exclusive Email Notice */}
      <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
        <div className="flex items-center gap-2 font-bold text-[#087443]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#087443]" />
          <span>Statutory Policy: You Register a Company ONCE</span>
        </div>
        <p className="text-[11.5px] text-emerald-900 leading-relaxed">
          In accordance with Nigerian Ports Authority corporate security regulations, each corporate entity is registered and profiled <strong>only once</strong> in the NPA PPMS. System records are strictly locked to your CAC Registration Number and Corporate Email.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 pt-0.5">
          <Lock className="w-3.5 h-3.5 text-[#087443] shrink-0" />
          <span>Security Protocol: Initial login credentials and temporary administrator password will be dispatched <strong>EXCLUSIVELY to your official corporate email</strong> upon profiling completion.</span>
        </div>
      </div>

      {result && !submittedInfo && (
        result.message.toLowerCase().includes('already registered') ? (
          <div className="p-4 rounded-xl text-xs bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wide">
                  Company Already Profiled (Single Registration Enforced)
                </h4>
                <p className="text-[11.5px] text-amber-800 mt-1 leading-relaxed">
                  {result.message}
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Under NPA statutory rules, each company can only be registered <strong>once</strong>. If this entity is already registered, please sign in with your corporate credentials.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  if (onSuccess && email.trim()) {
                    onSuccess(email.trim(), companyName.trim() || 'Your Company');
                  } else if (onCancel) {
                    onCancel();
                  }
                }}
                className="px-3.5 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Sign In with Corporate Email ({email.trim() || 'Company Email'})
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
              result.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-red-50 text-red-800 border border-red-300'
            }`}
          >
            {result.success ? <CheckCircle2 className="w-5 h-5 text-[#087443]" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{result.message}</span>
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-none space-y-6">
        {/* Company Basic Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#087443]" />
            Corporate Legal Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Registered Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Niger Maritime Logistics Ltd"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CAC Registration (RC / BN) *</label>
              <input
                type="text"
                value={cacNumber}
                onChange={(e) => setCacNumber(e.target.value)}
                placeholder="e.g. RC-1928401"
                className="w-full text-xs font-mono px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax Identification Number (TIN)</label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="e.g. 21094820-0001"
                className="w-full text-xs font-mono px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Official Corporate Email *</span>
                <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Credentials Recipient
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="corporate@company.ng"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443]"
                required
              />
              <p className="text-[10.5px] text-emerald-800 font-medium mt-1">
                🔒 System login credentials & temporary password will be transmitted <strong>exclusively to this company email</strong>. You register a company once.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Phone Number *</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                onBlur={() => setPhoneError(phone && !isValidNigerianPhone(phone) ? 'Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.' : '')}
                placeholder="08012345678 or +2348012345678"
                aria-invalid={Boolean(phoneError)}
                className="w-full text-xs px-3 py-2 border border-slate-400 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443]"
                required
              />
              {phoneError && <p role="alert" className="mt-1 text-[11px] font-medium text-red-700">{phoneError}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Website URL (Optional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.ng"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Head Office Address *</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full office address and port terminal office if applicable..."
              className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary NPA Port of Operation *</label>
            <select
              value={primaryPortId}
              onChange={(e) => setPrimaryPortId(e.target.value)}
              className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
            >
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statutory Corporate Documents */}
        <div className="space-y-4 pt-3 border-t">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#087443]" />
              Statutory Corporate Documents (CAC & Tax Clearance)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Upload PDF or Image for verification
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CAC Certificate Upload */}
            <div
              id="cac-upload-section"
              className={`p-4 rounded-xl space-y-3 transition-all border-2 ${
                cacDoc
                  ? 'bg-emerald-50/50 border-emerald-500 shadow-2xs'
                  : cacError
                  ? 'bg-red-50/70 border-red-500 shadow-sm ring-2 ring-red-200'
                  : 'bg-amber-50/40 border-amber-400 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <FileText className={`w-4 h-4 ${cacDoc ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <span className="text-xs font-black text-slate-900 tracking-tight">
                    CAC Certificate of Incorporation
                  </span>
                  <span className="text-red-600 font-black text-sm" title="Mandatory field">*</span>
                </div>
                {cacDoc ? (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase tracking-wider flex items-center gap-1 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    Attached & Validated
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 uppercase tracking-wider flex items-center gap-1 shrink-0 self-start sm:self-auto shadow-2xs">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    Mandatory • Required *
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/90 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#087443]" />
                  <span>Statutory Registration Requirement</span>
                </div>
                <p>
                  In accordance with Nigerian Ports Authority port security regulations, an official <strong className="text-slate-900">CAC Certificate of Incorporation (RC / BN)</strong> is <span className="text-red-700 font-bold underline">strictly necessary to provide</span> before corporate profiling can proceed.
                </p>
              </div>

              {cacDoc ? (
                <div className="p-3 bg-white rounded-lg border border-emerald-300 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-[#087443] shrink-0" />
                      <span className="text-xs font-mono text-[#087443] font-bold truncate">
                        {cacDoc.fileName}
                      </span>
                      {cacDoc.fileSizeBytes ? (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          ({(cacDoc.fileSizeBytes / 1024).toFixed(1)} KB)
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      Uploaded File
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreviewingFile({
                        fileName: cacDoc.fileName,
                        documentName: 'CAC Certificate of Incorporation',
                        fileData: cacDoc.fileData,
                        fileUrl: cacDoc.fileData,
                        mimeType: cacDoc.mimeType,
                        fileSizeBytes: cacDoc.fileSizeBytes
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087443]" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile({
                        fileName: cacDoc.fileName,
                        documentName: 'CAC Certificate of Incorporation',
                        fileData: cacDoc.fileData,
                        fileUrl: cacDoc.fileData,
                        mimeType: cacDoc.mimeType,
                        fileSizeBytes: cacDoc.fileSizeBytes
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCacDoc(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-medium rounded-lg border border-slate-300 hover:border-red-300 transition-colors cursor-pointer ml-auto"
                      title="Replace attached CAC document"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Change File</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs hover:shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Upload CAC Certificate of Incorporation *</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setCacDoc({
                              fileName: file.name,
                              fileData: ev.target?.result as string,
                              fileSizeBytes: file.size,
                              mimeType: file.type || 'application/pdf'
                            });
                            setCacError(false);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    Supported file formats: PDF, JPG, PNG (Max 10MB) • Mandatory document
                  </p>
                  {cacError && (
                    <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Mandatory Requirement: You must upload your CAC Certificate of Incorporation to proceed.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tax Clearance Upload */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Tax Clearance / Introduction Letter</span>
                {taxDoc ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">PDF / Image</span>
                )}
              </div>

              {taxDoc ? (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#087443] truncate font-medium">
                    {taxDoc.fileName} {taxDoc.fileSizeBytes ? `(${(taxDoc.fileSizeBytes / 1024).toFixed(1)} KB)` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewingFile({
                        fileName: taxDoc.fileName,
                        documentName: 'Tax Clearance Certificate',
                        fileData: taxDoc.fileData,
                        fileUrl: taxDoc.fileData,
                        mimeType: taxDoc.mimeType,
                        fileSizeBytes: taxDoc.fileSizeBytes
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#087443]" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile({
                        fileName: taxDoc.fileName,
                        documentName: 'Tax Clearance Certificate',
                        fileData: taxDoc.fileData,
                        fileUrl: taxDoc.fileData,
                        mimeType: taxDoc.mimeType,
                        fileSizeBytes: taxDoc.fileSizeBytes
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxDoc(null)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#087443]" />
                    <span>Upload Tax Clearance</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setTaxDoc({
                              fileName: file.name,
                              fileData: ev.target?.result as string,
                              fileSizeBytes: file.size,
                              mimeType: file.type || 'application/pdf'
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MD / CEO Details */}
        <div className="space-y-4 pt-3 border-t">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-[#087443]" />
            Managing Director / CEO Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">MD / CEO Full Name *</label>
              <input
                type="text"
                value={mdName}
                onChange={(e) => setMdName(e.target.value)}
                placeholder="e.g. Chief Olabode George"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">MD / CEO Phone Contact</label>
              <input
                type="tel"
                value={mdPhone}
                onChange={(e) => { setMdPhone(e.target.value); setMdPhoneError(''); }}
                onBlur={() => setMdPhoneError(mdPhone && !isValidNigerianPhone(mdPhone) ? 'Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.' : '')}
                aria-invalid={Boolean(mdPhoneError)}
                placeholder="+234 803 000 0000"
                className={`w-full text-xs px-3 py-2 rounded bg-slate-50 text-slate-900 border ${mdPhoneError ? 'border-red-500' : 'border-slate-500'}`}
              />
              {mdPhoneError && <p role="alert" className="mt-1 text-[11px] font-medium text-red-700">{mdPhoneError}</p>}
            </div>
          </div>
        </div>

        {/* Authorised Representative */}
        <div className="space-y-4 pt-3 border-t">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#087443]" />
            Authorised Port Pass Liaison Officer (Company Admin)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="e.g. Mallam Kabiru Sani"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Liaison Officer Work Email (Optional)
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="liaison@company.ng"
                className="w-full text-xs px-3 py-2 border-slate-400 rounded bg-slate-50 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Contact only. Administrative credentials are dispatched strictly to the Corporate Email above.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Direct Phone Number *</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={authPhone}
                onChange={(e) => { setAuthPhone(e.target.value); setAuthPhoneError(''); }}
                onBlur={() => setAuthPhoneError(authPhone && !isValidNigerianPhone(authPhone) ? 'Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.' : '')}
                placeholder="08012345678 or +2348012345678"
                aria-invalid={Boolean(authPhoneError)}
                className="w-full text-xs px-3 py-2 border border-slate-400 rounded bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[#087443]/20 focus:border-[#087443]"
                required
              />
              {authPhoneError && <p role="alert" className="mt-1 text-[11px] font-medium text-red-700">{authPhoneError}</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-extrabold rounded-lg shadow-md cursor-pointer"
          >
            {submitting ? 'Registering Company...' : 'Complete Corporate Registration'}
          </button>
        </div>
      </form>

      {/* Universal File Preview & Download Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewingFile)}
        onClose={() => setPreviewingFile(null)}
        file={previewingFile}
      />
    </div>
  );
};
