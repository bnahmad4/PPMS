import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CustomerCategory, PassType, Port, ConditionsAcceptance } from '../../types';
import { ConditionsOfIssueModal } from '../common/ConditionsOfIssueModal';
import {
  Building2,
  Users,
  FileUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileCheck,
  Camera,
  Image as ImageIcon,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import { FilePreviewModal, downloadFile, PreviewableFile } from '../common/FilePreviewModal';

interface NewApplicationWizardProps {
  onSuccess: (appId: string) => void;
  onCancel: () => void;
  onReturnToLogin?: (referenceNumber: string) => void;
}

export const NewApplicationWizard: React.FC<NewApplicationWizardProps> = ({
  onSuccess,
  onCancel,
  onReturnToLogin
}) => {
  const { currentUser, ports } = useAuth();

  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [passTypes, setPassTypes] = useState<PassType[]>([]);
  const [loading, setLoading] = useState(true);

  // Post-submission state
  const [submittedApp, setSubmittedApp] = useState<{ id: string; referenceNumber: string } | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Wizard Steps: 1: Port & Category, 2: Employees, 3: Documents, 4: Conditions & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedPortId, setSelectedPortId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string>('');
  const [validityMonths, setValidityMonths] = useState<number>(12);
  const [justification, setJustification] = useState<string>('');

  // Employees List
  const [employees, setEmployees] = useState<Array<{
    fullName: string;
    position: string;
    phone: string;
    email: string;
    idType: 'NIN' | 'INTERNATIONAL_PASSPORT' | 'DRIVERS_LICENCE' | 'VOTERS_CARD';
    idReference: string;
    passportPhotoUrl?: string;
  }>>([
    {
      fullName: '',
      position: '',
      phone: '',
      email: '',
      idType: 'NIN',
      idReference: ''
    }
  ]);

  // Documents uploaded
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, {
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    requirementCode: string;
    documentName: string;
    fileData?: string;
  }>>({});

  // Active file preview state
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  // Conditions of issue acceptance state
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  const [conditionsAcceptance, setConditionsAcceptance] = useState<Omit<ConditionsAcceptance, 'id' | 'applicationId' | 'acceptedAt'> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, ptsRes] = await Promise.all([
          api.getCategories(),
          api.getPassTypes()
        ]);
        setCategories(catsRes.categories);
        setPassTypes(ptsRes.passTypes);

        if (ports.length > 0) setSelectedPortId(ports[0].id);
        if (catsRes.categories.length > 0) setSelectedCategoryId(catsRes.categories[0].id);
        if (ptsRes.passTypes.length > 0) setSelectedPassTypeId(ptsRes.passTypes[0].id);
      } catch (err) {
        console.error('Failed to load wizard lookup data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ports]);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  // Add / Remove Employee
  const addEmployee = () => {
    setEmployees(prev => [
      ...prev,
      {
        fullName: '',
        position: '',
        phone: '',
        email: '',
        idType: 'NIN',
        idReference: ''
      }
    ]);
  };

  const removeEmployee = (index: number) => {
    if (employees.length <= 1) return;
    setEmployees(prev => prev.filter((_, i) => i !== index));
  };

  const updateEmployee = (index: number, field: string, value: string) => {
    setEmployees(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle employee passport photo upload
  const handlePassportUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMessage('Passport photograph size must not exceed 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateEmployee(index, 'passportPhotoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Document upload handler
  const handleFileUpload = (reqCode: string, docName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds the 10MB maximum limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        setUploadedDocs(prev => ({
          ...prev,
          [reqCode]: {
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'application/pdf',
            requirementCode: reqCode,
            documentName: docName,
            fileData: fileData
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUploadedDoc = (reqCode: string) => {
    setUploadedDocs(prev => {
      const copy = { ...prev };
      delete copy[reqCode];
      return copy;
    });
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!selectedPortId || !selectedCategoryId || !selectedPassTypeId) {
      setErrorMessage('Please select port location, customer category, and pass type.');
      return false;
    }
    if (!justification.trim()) {
      setErrorMessage('Operational justification is required.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  // Step 2 Validation (Each employee form MUST carry their passport)
  const validateStep2 = () => {
    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];
      if (!e.fullName.trim() || !e.position.trim() || !e.phone.trim() || !e.idReference.trim()) {
        setErrorMessage(`Please fill all required text fields for Employee #${i + 1}.`);
        return false;
      }
      if (!e.passportPhotoUrl || !e.passportPhotoUrl.trim()) {
        setErrorMessage(`Employee #${i + 1} (${e.fullName || 'Unnamed'}): Passport photograph is mandatory. Each employee form must carry their passport photograph.`);
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!activeCategory) return true;
    for (const req of activeCategory.requirements) {
      if (req.isMandatory && !uploadedDocs[req.code]) {
        setErrorMessage(`Mandatory document "${req.documentName}" has not been uploaded.`);
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  };

  // Auto-close countdown effect when application is submitted and onReturnToLogin is enabled
  React.useEffect(() => {
    if (!submittedApp || !onReturnToLogin) return;

    if (countdown <= 0) {
      onReturnToLogin(submittedApp.referenceNumber);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [submittedApp, countdown, onReturnToLogin]);

  const handleResetForAnotherSubmission = () => {
    setCurrentStep(1);
    setEmployees([
      {
        fullName: '',
        position: '',
        phone: '',
        email: '',
        idType: 'NIN',
        idReference: '',
        passportPhotoUrl: ''
      }
    ]);
    setUploadedDocs({});
    setConditionsAcceptance(null);
    setJustification('Standard corporate port operations access clearance.');
    setSubmittedApp(null);
    setErrorMessage(null);
    setCountdown(5);
  };

  // Final Submission
  const handleSubmitApplication = async () => {
    if (!conditionsAcceptance) {
      setErrorMessage('Official NPA Conditions of Issue must be accepted prior to application submission.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const docsArray = Object.values(uploadedDocs);

      const payload = {
        companyId: currentUser?.companyId || 'comp-dangote',
        portId: selectedPortId,
        categoryId: selectedCategoryId,
        passTypeId: selectedPassTypeId,
        validityPeriodMonths: validityMonths,
        numberOfEmployees: employees.length,
        justification,
        employees,
        documents: docsArray,
        conditionsAcceptance,
        isDraft: false
      };

      const res = await api.createApplication(payload);
      if (res.success && res.application) {
        setSubmittedApp({
          id: res.application.id,
          referenceNumber: res.application.referenceNumber
        });
        setCountdown(5);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading NPA Port Pass application configuration...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* Submission Success Dialog */}
      {submittedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-[#087443] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your port pass application dossier has been received and routed for statutory verification.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
              <div className="text-[10px] font-mono text-emerald-800 uppercase tracking-widest font-bold">
                Official Reference Number
              </div>
              <div className="text-base font-black font-mono text-[#087443]">
                {submittedApp.referenceNumber}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Status: <span className="font-bold">PENDING ID UNIT VERIFICATION</span>
              </div>
            </div>

            {onReturnToLogin && (
              <p className="text-[11px] text-slate-400">
                Closing and returning to login in <span className="font-bold text-slate-700 font-mono">{countdown}s</span>...
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {onReturnToLogin && (
                <button
                  type="button"
                  onClick={() => onReturnToLogin(submittedApp.referenceNumber)}
                  className="w-full py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition-colors"
                >
                  Close & Return to Login
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetForAnotherSubmission}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Submit Another Application
                </button>

                <button
                  type="button"
                  onClick={() => onSuccess(submittedApp.id)}
                  className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  View Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#087443] text-white p-6 rounded-xl shadow-xs">
        <h1 className="text-xl font-extrabold tracking-tight">New Port Pass Application</h1>
        <p className="text-xs text-emerald-100 mt-1">
          Complete the statutory multi-step application workflow for Nigerian Ports Authority access permits.
        </p>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-emerald-600/60 text-xs">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-white font-bold' : 'text-emerald-300'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 1 ? 'bg-white text-[#087443]' : currentStep > 1 ? 'bg-emerald-300 text-[#087443]' : 'bg-emerald-800'}`}>1</span>
            <span className="hidden sm:inline">Category & Port</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-white font-bold' : 'text-emerald-300'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 2 ? 'bg-white text-[#087443]' : currentStep > 2 ? 'bg-emerald-300 text-[#087443]' : 'bg-emerald-800'}`}>2</span>
            <span className="hidden sm:inline">Employees ({employees.length})</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-white font-bold' : 'text-emerald-300'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 3 ? 'bg-white text-[#087443]' : currentStep > 3 ? 'bg-emerald-300 text-[#087443]' : 'bg-emerald-800'}`}>3</span>
            <span className="hidden sm:inline">Documents</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-white font-bold' : 'text-emerald-300'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 4 ? 'bg-white text-[#087443]' : 'bg-emerald-800'}`}>4</span>
            <span className="hidden sm:inline">Legal Acceptance</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Port, Category & Pass Type */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#087443]" />
            Step 1: Port Location & Customer Category Classification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target NPA Port Location *
              </label>
              <select
                value={selectedPortId}
                onChange={(e) => setSelectedPortId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443]"
              >
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — {p.state} State
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer Category *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setUploadedDocs({});
                }}
                className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {activeCategory && (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  {activeCategory.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Permit / Pass Type *
              </label>
              <select
                value={selectedPassTypeId}
                onChange={(e) => setSelectedPassTypeId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443]"
              >
                {passTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} (Max {pt.maxValidityDays} Days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Requested Validity Period
              </label>
              <select
                value={validityMonths}
                onChange={(e) => setValidityMonths(parseInt(e.target.value))}
                className="w-full text-xs font-medium px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443]"
              >
                <option value={12}>12 Months (Standard Annual Permit)</option>
                <option value={6}>6 Months (Half-Year Operational Tag)</option>
                <option value={1}>1 Month (Temporary Work Assignment)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Operational Justification & Duties in Port *
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State the specific cargo handling, shipping, surveying, or logistics duties to be performed inside port facilities..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443] focus:border-[#087443]"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#087443] text-white text-xs font-bold rounded-lg hover:bg-[#065C35] transition-colors"
            >
              Continue to Employee Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Multi-Employee Details */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#087443]" />
                Step 2: Employee Information
              </h2>
              <p className="text-xs text-slate-500">
                You can add multiple employees under this single corporate application batch.
              </p>
            </div>
            <button
              type="button"
              onClick={addEmployee}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-[#087443] border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100"
            >
              <Plus className="w-4 h-4" />
              Add Another Employee
            </button>
          </div>

          <div className="space-y-6">
            {employees.map((emp, index) => (
              <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 relative">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="text-xs font-bold text-[#087443]">
                    Employee #{index + 1}
                  </span>
                  {employees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmployee(index)}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={emp.fullName}
                      onChange={(e) => updateEmployee(index, 'fullName', e.target.value)}
                      placeholder="e.g. Babatunde Adeyemi"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Designation / Position *
                    </label>
                    <input
                      type="text"
                      value={emp.position}
                      onChange={(e) => updateEmployee(index, 'position', e.target.value)}
                      placeholder="e.g. Senior Clearing Officer"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      value={emp.phone}
                      onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={emp.email}
                      onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                      placeholder="employee@company.ng"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Identification Type *
                    </label>
                    <select
                      value={emp.idType}
                      onChange={(e) => updateEmployee(index, 'idType', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="INTERNATIONAL_PASSPORT">International Passport</option>
                      <option value="DRIVERS_LICENCE">FRSC Driver's Licence</option>
                      <option value="VOTERS_CARD">INEC Voter's Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ID Document Number *
                    </label>
                    <input
                      type="text"
                      value={emp.idReference}
                      onChange={(e) => updateEmployee(index, 'idReference', e.target.value)}
                      placeholder="e.g. NIN-89301928471"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>
                </div>

                {/* Passport Photograph Section */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Passport Preview Thumbnail */}
                      <div className="w-16 h-20 bg-slate-200 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center shrink-0 relative group shadow-2xs">
                        {emp.passportPhotoUrl ? (
                          <>
                            <img
                              src={emp.passportPhotoUrl}
                              alt={`Passport of ${emp.fullName || 'Employee'}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] text-white font-bold">Change</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-1 text-slate-400">
                            <Camera className="w-5 h-5 mx-auto mb-0.5 text-slate-400" />
                            <span className="text-[9px] font-semibold block leading-tight">No Photo</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-[#087443]" />
                            Employee Passport Photograph *
                          </label>
                          {emp.passportPhotoUrl ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#087443]" /> Photo Attached
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Standard 2x2 white-background portrait photo for port security verification and physical pass badge printing. (Max 3MB).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
                      {emp.passportPhotoUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewingFile({
                              fileName: `${emp.fullName ? emp.fullName.replace(/\s+/g, '_') : `employee_${index + 1}`}_passport.jpg`,
                              documentName: `Passport Photograph - ${emp.fullName || `Employee #${index + 1}`}`,
                              fileData: emp.passportPhotoUrl,
                              fileUrl: emp.passportPhotoUrl,
                              mimeType: 'image/jpeg',
                              holderName: emp.fullName
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#087443]" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFile({
                              fileName: `${emp.fullName ? emp.fullName.replace(/\s+/g, '_') : `employee_${index + 1}`}_passport.jpg`,
                              documentName: `Passport Photograph - ${emp.fullName || `Employee #${index + 1}`}`,
                              fileData: emp.passportPhotoUrl,
                              fileUrl: emp.passportPhotoUrl,
                              mimeType: 'image/jpeg',
                              holderName: emp.fullName
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </>
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{emp.passportPhotoUrl ? 'Change Photo' : 'Upload Passport'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={(e) => handlePassportUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#087443] text-white text-xs font-bold rounded-lg hover:bg-[#065C35] transition-colors"
            >
              Continue to Document Uploads
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Category Document Uploads */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-[#087443]" />
              Step 3: Document Checklist for {activeCategory?.name}
            </h2>
            <p className="text-xs text-slate-500">
              Upload all required documents according to NPA category requirements. (Accepted: PDF, JPG, PNG • Max: 5MB per file).
            </p>
          </div>

          <div className="space-y-3">
            {activeCategory?.requirements.map((req) => {
              const uploaded = uploadedDocs[req.code];
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    uploaded
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{req.documentName}</span>
                      {req.isMandatory && (
                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-semibold">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Formats: {req.allowedFormats} • Maximum size: {req.maxSizeMb} MB
                    </div>
                    {uploaded && (
                      <div className="text-xs text-[#087443] font-medium flex items-center gap-1.5 mt-1.5">
                        <FileCheck className="w-4 h-4" />
                        <span>Uploaded: {uploaded.fileName} ({(uploaded.fileSizeBytes / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2 flex-wrap">
                    {uploaded && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewingFile({
                            fileName: uploaded.fileName,
                            documentName: req.documentName,
                            fileData: uploaded.fileData,
                            fileUrl: uploaded.fileData,
                            mimeType: uploaded.mimeType,
                            fileSizeBytes: uploaded.fileSizeBytes
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#087443]" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile({
                            fileName: uploaded.fileName,
                            documentName: req.documentName,
                            fileData: uploaded.fileData,
                            fileUrl: uploaded.fileData,
                            mimeType: uploaded.mimeType,
                            fileSizeBytes: uploaded.fileSizeBytes
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadedDoc(req.code)}
                          title="Remove document"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploaded ? 'Replace' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(req.code, req.documentName, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep3()) setCurrentStep(4);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#087443] text-white text-xs font-bold rounded-lg hover:bg-[#065C35] transition-colors"
            >
              Proceed to Legal Conditions of Issue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Legal Conditions Acceptance & Submission */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#087443]" />
              Step 4: Statutory Legal Undertaking & Submission
            </h2>
            <p className="text-xs text-slate-500">
              Review application summary and complete mandatory electronic execution of NPA Conditions of Issue.
            </p>
          </div>

          {/* Application Summary Box */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Port Location:</span>
              <span className="font-bold text-slate-900">{ports.find(p => p.id === selectedPortId)?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-bold text-slate-900">{activeCategory?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registered Employees:</span>
              <span className="font-bold text-[#087443]">{employees.length} Personnel</span>
            </div>
            <div>
              <span className="text-slate-500 block">Documents Uploaded:</span>
              <span className="font-bold text-slate-900">{Object.keys(uploadedDocs).length} Files</span>
            </div>
          </div>

          {/* Uploaded Documents Verification Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#087443]" />
                Attached Category Documents ({Object.keys(uploadedDocs).length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click to preview or download
              </span>
            </h3>

            {Object.keys(uploadedDocs).length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                No documents uploaded yet. Please ensure all mandatory documents are attached.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.values(uploadedDocs).map((doc) => (
                  <div key={doc.requirementCode} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">{doc.documentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {doc.fileName} • {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingFile({
                          fileName: doc.fileName,
                          documentName: doc.documentName,
                          fileData: doc.fileData,
                          fileUrl: doc.fileData,
                          mimeType: doc.mimeType,
                          fileSizeBytes: doc.fileSizeBytes
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#087443] text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#087443]" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile({
                          fileName: doc.fileName,
                          documentName: doc.documentName,
                          fileData: doc.fileData,
                          fileUrl: doc.fileData,
                          mimeType: doc.mimeType,
                          fileSizeBytes: doc.fileSizeBytes
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions of Issue Status Box */}
          <div className="p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#087443]" />
                Official NPA Conditions of Issue & Prosecution Warning (Revised March 2018)
              </h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Mandatory scroll-through and digital signature required under Nigerian law.
              </p>
              {conditionsAcceptance ? (
                <div className="mt-2 text-xs font-semibold text-[#087443] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#087443]" />
                  <span>Digitally Executed by: <strong>{conditionsAcceptance.signatureName}</strong> (IP: {conditionsAcceptance.ipAddress})</span>
                </div>
              ) : (
                <span className="inline-block mt-2 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                  Status: Pending Signature Acceptance
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsConditionsModalOpen(true)}
              className="px-4 py-2 bg-[#087443] text-white text-xs font-bold rounded-lg hover:bg-[#065C35] shrink-0 shadow-xs"
            >
              {conditionsAcceptance ? 'Review / Re-Sign' : 'Review & Sign Conditions'}
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              disabled={!conditionsAcceptance || isSubmitting}
              onClick={handleSubmitApplication}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold rounded-lg text-white shadow-md transition-all ${
                conditionsAcceptance && !isSubmitting
                  ? 'bg-[#087443] hover:bg-[#065C35] cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Submitting to OIC ID Unit...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Formal Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Conditions of Issue Modal */}
      <ConditionsOfIssueModal
        isOpen={isConditionsModalOpen}
        onClose={() => setIsConditionsModalOpen(false)}
        onAccept={(acceptance) => {
          setConditionsAcceptance(acceptance);
          setErrorMessage(null);
        }}
        applicantName={currentUser?.fullName || ''}
      />

      {/* Universal File Preview & Download Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewingFile)}
        onClose={() => setPreviewingFile(null)}
        file={previewingFile}
      />
    </div>
  );
};
