import React, { useState } from 'react';
import { Application, ApplicationDocument } from '../../types';
import { api } from '../../api/client';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';
import {
  X,
  AlertTriangle,
  FileText,
  Users,
  Upload,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCw,
  Building2,
  ArrowRight
} from 'lucide-react';

interface EditAndResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onResubmitted: (updatedApp: Application) => void;
}

export const EditAndResubmitModal: React.FC<EditAndResubmitModalProps> = ({
  isOpen,
  onClose,
  application,
  onResubmitted
}) => {
  if (!isOpen) return null;

  // Active section tab
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'EMPLOYEES' | 'JUSTIFICATION'>('DOCUMENTS');

  // Form states
  const [justification, setJustification] = useState(application.justification || '');
  const [resubmissionNotes, setResubmissionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<Array<{
    id?: string;
    requirementCode: string;
    documentName: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    fileData?: string;
    fileUrl?: string;
    isReplaced?: boolean;
  }>>(() => {
    return (application.documents || []).map(d => ({
      id: d.id,
      requirementCode: d.requirementCode,
      documentName: d.documentName,
      fileName: d.fileName,
      fileSizeBytes: d.fileSizeBytes || 1024 * 120,
      mimeType: d.mimeType || 'application/pdf',
      fileData: d.fileData,
      fileUrl: d.fileUrl,
      isReplaced: false
    }));
  });

  // Additional new document upload state
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<{
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    fileData: string;
  } | null>(null);

  // Employees roster state
  const [employees, setEmployees] = useState<Array<{
    id?: string;
    fullName: string;
    position: string;
    phone: string;
    email: string;
    idType: 'NIN' | 'INTERNATIONAL_PASSPORT' | 'DRIVERS_LICENCE' | 'VOTERS_CARD';
    idReference: string;
    passportPhotoUrl?: string;
  }>>(() => {
    return (application.employees || []).map(e => ({
      id: e.id,
      fullName: e.fullName || '',
      position: e.position || '',
      phone: e.phone || '',
      email: e.email || '',
      idType: (e.idType as any) || 'NIN',
      idReference: e.idReference || '',
      passportPhotoUrl: e.passportPhotoUrl
    }));
  });

  // Preview state
  const [previewingFile, setPreviewingFile] = useState<PreviewableFile | null>(null);

  // Handle replacing existing document
  const handleReplaceFile = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File ${file.name} exceeds the 10MB statutory limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDocuments(prev => prev.map((doc, idx) => {
        if (idx !== index) return doc;
        return {
          ...doc,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/pdf',
          fileData: reader.result as string,
          isReplaced: true
        };
      }));
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle adding an additional new document
  const handleNewDocFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File ${file.name} exceeds the 10MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewDocFile({
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        fileData: reader.result as string
      });
      if (!newDocName) {
        setNewDocName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = () => {
    if (!newDocName.trim() || !newDocFile) {
      setErrorMessage('Please provide a document description and select a file to upload.');
      return;
    }

    setDocuments(prev => [
      ...prev,
      {
        requirementCode: 'ADDITIONAL_SUPPORTING_DOC',
        documentName: newDocName.trim(),
        fileName: newDocFile.fileName,
        fileSizeBytes: newDocFile.fileSizeBytes,
        mimeType: newDocFile.mimeType,
        fileData: newDocFile.fileData,
        isReplaced: true
      }
    ]);

    setNewDocName('');
    setNewDocFile(null);
    setErrorMessage(null);
  };

  // Employees helpers
  const handleEmployeeChange = (index: number, field: string, value: string) => {
    setEmployees(prev => prev.map((emp, idx) => idx === index ? { ...emp, [field]: value } : emp));
  };

  const handleAddEmployee = () => {
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

  const handleRemoveEmployee = (index: number) => {
    if (employees.length <= 1) {
      setErrorMessage('Application must contain at least 1 employee.');
      return;
    }
    setEmployees(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit resubmission to backend
  const handleSubmitResubmission = async () => {
    // Validate employees
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (!emp.fullName.trim()) {
        setActiveTab('EMPLOYEES');
        setErrorMessage(`Employee #${i + 1} must have a valid full name.`);
        return;
      }
      if (!emp.idReference.trim()) {
        setActiveTab('EMPLOYEES');
        setErrorMessage(`Employee #${i + 1} (${emp.fullName}) must have an identification reference number.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await api.resubmitApplication(application.id, {
        justification,
        employees,
        documents,
        resubmissionNotes: resubmissionNotes.trim() || 'Addressed officer instructions and updated requested documentation.'
      });

      if (res.success && res.application) {
        onResubmitted(res.application);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resubmit application. Please verify server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#087443] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-800/80 text-emerald-100 px-2.5 py-0.5 rounded">
                Dossier Correction & Resubmission
              </span>
              <span className="text-xs text-emerald-200 font-bold">
                {application.referenceNumber}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight mt-1">
              Edit & Resubmit Application for Statutory Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Officer Instruction Banner (Always in sight) */}
          <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-2 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>OIC ID Unit Inspecting Officer's Correction Instructions:</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-300 font-medium text-slate-900 whitespace-pre-wrap leading-relaxed shadow-2xs">
              {application.correctionNotes || 'Please inspect attached statutory certificates, corporate licenses, or employee bio-data, make requested corrections, and resubmit for statutory vetting.'}
            </div>
            <p className="text-[11px] text-amber-800">
              Please rectify the points mentioned above by replacing files or editing personnel details before submitting.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-800 flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'DOCUMENTS'
                  ? 'border-[#087443] text-[#087443]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Statutory Documents ({documents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'EMPLOYEES'
                  ? 'border-[#087443] text-[#087443]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personnel Bio-Data ({employees.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('JUSTIFICATION')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'JUSTIFICATION'
                  ? 'border-[#087443] text-[#087443]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Justification & Officer Notes</span>
            </button>
          </div>

          {/* TAB 1: DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Attached Statutory Document Files
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Replace expired or deficient files with verified new PDF or Image copies.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      doc.isReplaced
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 shrink-0 ${doc.isReplaced ? 'text-emerald-700' : 'text-slate-600'}`} />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {doc.documentName}
                          </span>
                          {doc.isReplaced && (
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                              NEW FILE SELECTED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                          <span className="truncate max-w-xs">{doc.fileName}</span>
                          <span>•</span>
                          <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Instant In-Browser Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewingFile({
                            fileName: doc.fileName,
                            documentName: doc.documentName,
                            fileData: doc.fileData,
                            fileUrl: doc.fileUrl,
                            fileSizeBytes: doc.fileSizeBytes,
                            mimeType: doc.mimeType,
                            referenceNumber: application.referenceNumber,
                            documentCategory: 'STATUTORY_DOC'
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Preview</span>
                        </button>

                        {/* Replace File Button */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-400 transition-colors cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{doc.isReplaced ? 'Change File' : 'Replace File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleReplaceFile(idx, e)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Additional Document Box */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Add Additional Statutory or Clarification Document
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Document Title / Description *
                    </label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="e.g. Revised FIRS TCC Verification Barcode"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Select File (PDF, PNG, JPG max 10MB) *
                    </label>
                    <label className="flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 text-xs text-slate-600">
                      <span className="truncate">{newDocFile ? newDocFile.fileName : 'Choose file...'}</span>
                      <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleNewDocFileSelect}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    disabled={!newDocFile || !newDocName.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEES */}
          {activeTab === 'EMPLOYEES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Authorized Personnel Roster ({employees.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify names, official designations, and national identity numbers (NIN).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEmployee}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Personnel</span>
                </button>
              </div>

              <div className="space-y-4">
                {employees.map((emp, idx) => (
                  <div key={emp.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Personnel #{idx + 1}
                      </span>
                      {employees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmployee(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Remove employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={emp.fullName}
                          onChange={(e) => handleEmployeeChange(idx, 'fullName', e.target.value)}
                          placeholder="e.g. Ibrahim Adeyemi"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Official Designation *
                        </label>
                        <input
                          type="text"
                          value={emp.position}
                          onChange={(e) => handleEmployeeChange(idx, 'position', e.target.value)}
                          placeholder="e.g. Operations Coordinator"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          ID Document Type *
                        </label>
                        <select
                          value={emp.idType}
                          onChange={(e) => handleEmployeeChange(idx, 'idType', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        >
                          <option value="NIN">National Identity Number (NIN)</option>
                          <option value="INTERNATIONAL_PASSPORT">Nigerian International Passport</option>
                          <option value="DRIVERS_LICENCE">FRSC Driver's Licence</option>
                          <option value="VOTERS_CARD">INEC Voter's Card</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          ID Reference Number *
                        </label>
                        <input
                          type="text"
                          value={emp.idReference}
                          onChange={(e) => handleEmployeeChange(idx, 'idReference', e.target.value)}
                          placeholder="e.g. 74928103948"
                          className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={emp.phone}
                          onChange={(e) => handleEmployeeChange(idx, 'phone', e.target.value)}
                          placeholder="e.g. +234 803 123 4567"
                          className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Official Email Address
                        </label>
                        <input
                          type="email"
                          value={emp.email}
                          onChange={(e) => handleEmployeeChange(idx, 'email', e.target.value)}
                          placeholder="e.g. employee@company.com"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: JUSTIFICATION & OFFICER NOTES */}
          {activeTab === 'JUSTIFICATION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operational Justification for Port Access:
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State the core operational rationale for personnel requiring access to port quays..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Applicant Explanation of Corrections Made *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Click suggestion to auto-fill
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 text-[11px] mb-2">
                  <button
                    type="button"
                    onClick={() => setResubmissionNotes('Uploaded renewed 2026 FIRS Tax Clearance Certificate with verified e-TCC clearance code.')}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                  >
                    + Updated Tax Clearance Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => setResubmissionNotes('Corrected national identity numbers (NIN) and designations for personnel in accordance with inspector observations.')}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                  >
                    + Corrected Personnel NIN & Bio-data
                  </button>
                  <button
                    type="button"
                    onClick={() => setResubmissionNotes('Replaced expired operating permit with valid 2026 NPA operational license and terminal agreement.')}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                  >
                    + Attached 2026 NPA Operating License
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={resubmissionNotes}
                  onChange={(e) => setResubmissionNotes(e.target.value)}
                  placeholder="Detail the corrections you have made for the inspecting OIC ID Unit officer..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#087443]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Resubmission will advance status to <strong className="text-slate-800">PENDING_ID_UNIT_VERIFICATION</strong> and alert inspecting officers.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmitResubmission}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Resubmitting Dossier...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resubmit to ID Unit for Verification</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Universal File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewingFile)}
        onClose={() => setPreviewingFile(null)}
        file={previewingFile}
      />
    </div>
  );
};
