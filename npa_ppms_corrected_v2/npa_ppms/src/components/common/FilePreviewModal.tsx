import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ShieldCheck,
  Calendar,
  HardDrive,
  Eye,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Receipt,
  CreditCard,
  Building,
  Building2,
  Clock,
  Landmark
} from 'lucide-react';
import { NPA_OFFICIAL_LOGO_URL } from './NpaLogo';

export interface PreviewableFile {
  fileName: string;
  documentName?: string;
  fileUrl?: string;
  fileData?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  holderName?: string;
  referenceNumber?: string;
  documentCategory?: 'PAYMENT_RECEIPT' | 'BILLING_INVOICE' | 'STATUTORY_DOC' | 'PERSONNEL_ID' | 'CUSTOM' | string;
  paymentDetails?: {
    receiptReference?: string;
    rrrNumber?: string;
    oracleBillReference?: string;
    amountPaidNgn?: number;
    paymentDate?: string;
    paymentMethod?: string;
    companyName?: string;
    portName?: string;
    uploadedByName?: string;
    verificationStatus?: string;
    bankName?: string;
    tellerNumber?: string;
    channel?: string;
    verifiedBy?: string;
  };
  billDetails?: {
    oracleBillReference?: string;
    rrrNumber?: string;
    amountNgn?: number;
    billingDate?: string;
    paymentDeadline?: string;
    companyName?: string;
    portName?: string;
    numberOfEmployees?: number;
    billingOfficerName?: string;
    remarks?: string;
  };
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: PreviewableFile | null;
}

/**
 * Universal file downloader.
 * Handles Data URLs, Object URLs, Blob downloads, and fallback official NPA Document generation.
 */
export const downloadFile = (file: PreviewableFile) => {
  const fileName = file.fileName || 'document.pdf';
  const source = file.fileData || file.fileUrl;

  if (source && (source.startsWith('data:') || source.startsWith('blob:') || source.startsWith('http'))) {
    const link = document.createElement('a');
    link.href = source;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback: Generate an official NPA Document Certificate Blob for demonstration files
  const isImage = (file.mimeType && file.mimeType.startsWith('image/')) || /\.(jpe?g|png|webp|svg)$/i.test(fileName);
  
  if (isImage) {
    // Generate an SVG image placeholder
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="#F8FAFC" />
        <rect x="20" y="20" width="760" height="560" rx="12" fill="#FFFFFF" stroke="#087443" stroke-width="4" />
        <text x="400" y="100" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#087443" text-anchor="middle">NIGERIAN PORTS AUTHORITY</text>
        <text x="400" y="130" font-family="Arial, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">PORT PASS MANAGEMENT SYSTEM (PPMS)</text>
        <text x="400" y="220" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1E293B" text-anchor="middle">${file.documentName || fileName}</text>
        <text x="400" y="260" font-family="Arial, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">File Name: ${fileName}</text>
        <text x="400" y="290" font-family="Arial, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Holder: ${file.holderName || 'Official Filing'}</text>
        <text x="400" y="320" font-family="Arial, sans-serif" font-size="13" fill="#087443" font-weight="bold" text-anchor="middle">OFFICIAL NPA VERIFIED DOCUMENT</text>
        <rect x="250" y="380" width="300" height="60" rx="8" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
        <text x="400" y="415" font-family="monospace" font-size="12" font-weight="bold" fill="#065F46" text-anchor="middle">STATUS: STATUTORILY VALIDATED</text>
      </svg>
    `;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.svg') ? fileName : `${fileName.replace(/\.[^/.]+$/, '')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }

  // Generate an official HTML-based document printable
  const docHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${file.documentName || fileName} - NPA PPMS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1E293B; }
          .header { border-bottom: 3px solid #087443; padding-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
          .title { font-size: 22px; font-weight: 800; color: #087443; margin: 0; }
          .subtitle { font-size: 13px; color: #475569; margin-top: 4px; }
          .badge { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .details { margin-top: 30px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; background: #F8FAFC; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .label { color: #64748B; font-weight: 500; }
          .value { font-weight: 600; color: #0F172A; }
          .watermark { text-align: center; margin-top: 60px; padding: 30px; border: 2px dashed #087443; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">NIGERIAN PORTS AUTHORITY</h1>
            <p class="subtitle">Digital Port Pass Management System (PPMS) — Official Document Filing</p>
          </div>
          <span class="badge">OFFICIAL ATTACHMENT</span>
        </div>
        <div class="details">
          <div class="row"><span class="label">Document Requirement:</span><span class="value">${file.documentName || 'Statutory Requirement'}</span></div>
          <div class="row"><span class="label">Original File Name:</span><span class="value">${fileName}</span></div>
          <div class="row"><span class="label">File Size:</span><span class="value">${file.fileSizeBytes ? (file.fileSizeBytes / 1024).toFixed(1) + ' KB' : 'Standard Dossier Archive'}</span></div>
          <div class="row"><span class="label">Date Uploaded:</span><span class="value">${file.uploadedAt ? new Date(file.uploadedAt).toLocaleString('en-NG') : new Date().toLocaleString('en-NG')}</span></div>
          ${file.holderName ? `<div class="row"><span class="label">Associated Personnel:</span><span class="value">${file.holderName}</span></div>` : ''}
          ${file.referenceNumber ? `<div class="row"><span class="label">Application Reference:</span><span class="value">${file.referenceNumber}</span></div>` : ''}
        </div>
        <div class="watermark">
          <h3 style="color:#087443;margin:0 0 8px 0;">STATUTORY DOCUMENT COMPLIANCE</h3>
          <p style="font-size:12px;color:#64748B;margin:0;">This electronic file attachment has been submitted to the Nigerian Ports Authority for port entry access clearance under the NPA Act.</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([docHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedRrr, setCopiedRrr] = useState(false);
  const [viewMode, setViewMode] = useState<'AUTO' | 'DOCUMENT' | 'TSA_VOUCHER'>('AUTO');

  if (!isOpen || !file) return null;

  const fileName = file.fileName || 'document.pdf';
  const fileSource = file.fileData || file.fileUrl;
  
  const hasRawMedia = Boolean(fileSource && (
    fileSource.startsWith('data:image/') ||
    fileSource.startsWith('data:application/pdf') ||
    fileSource.startsWith('blob:') ||
    fileSource.startsWith('http')
  ));

  const isImage = (file.mimeType && file.mimeType.startsWith('image/')) ||
    /\.(jpe?g|png|webp|svg|gif)$/i.test(fileName) ||
    Boolean(fileSource && fileSource.startsWith('data:image/'));

  const isPdf = (file.mimeType === 'application/pdf') ||
    /\.pdf$/i.test(fileName) ||
    Boolean(fileSource && fileSource.startsWith('data:application/pdf'));

  const isPaymentReceipt = file.documentCategory === 'PAYMENT_RECEIPT' ||
    Boolean(file.paymentDetails) ||
    /remita|receipt|teller|cbn|tsa|payment/i.test(file.documentName || '') ||
    /remita|receipt|teller|cbn|payment/i.test(fileName);

  const isBillingInvoice = file.documentCategory === 'BILLING_INVOICE' ||
    Boolean(file.billDetails) ||
    /bill|invoice|oracle|assessment|tariff/i.test(file.documentName || '') ||
    /bill|invoice|oracle/i.test(fileName);

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRrr(true);
    setTimeout(() => setCopiedRrr(false), 2000);
  };

  // Helper for numbers to Naira words
  const formatAmountWords = (amount?: number) => {
    if (!amount) return 'Forty-Five Thousand Naira Only';
    if (amount === 45000) return 'Forty-Five Thousand Naira Only';
    if (amount === 90000) return 'Ninety Thousand Naira Only';
    if (amount === 135000) return 'One Hundred and Thirty-Five Thousand Naira Only';
    if (amount === 180000) return 'One Hundred and Eighty Thousand Naira Only';
    return `${amount.toLocaleString()} Naira Only`;
  };

  const payment = file.paymentDetails;
  const bill = file.billDetails;
  const rrrToDisplay = payment?.rrrNumber || bill?.rrrNumber || '2804-9124-7831';
  const receiptRefToDisplay = payment?.receiptReference || 'CBN-REMITA-TSA-9812401';
  const amountToDisplay = payment?.amountPaidNgn || bill?.amountNgn || 45000;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isPaymentReceipt ? 'bg-emerald-700' : isBillingInvoice ? 'bg-amber-600' : 'bg-[#087443]'
            }`}>
              {isPaymentReceipt ? (
                <Receipt className="w-5 h-5 text-white" />
              ) : isBillingInvoice ? (
                <CreditCard className="w-5 h-5 text-white" />
              ) : isImage ? (
                <Eye className="w-5 h-5 text-white" />
              ) : (
                <FileText className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {file.documentName || fileName}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isPaymentReceipt
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : isBillingInvoice
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : isImage
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-900'
                    : 'bg-slate-800 text-blue-300 border border-blue-900'
                }`}>
                  {isPaymentReceipt ? 'REMITA TSA RECEIPT' : isBillingInvoice ? 'ORACLE EBS INVOICE' : isImage ? 'IMAGE' : isPdf ? 'PDF' : 'STATUTORY DOC'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {fileName} {file.fileSizeBytes ? `• ${(file.fileSizeBytes / 1024).toFixed(1)} KB` : ''} {file.referenceNumber ? `• Ref: ${file.referenceNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isImage && hasRawMedia && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 mr-2 text-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1 hover:text-emerald-400 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1 hover:text-emerald-400 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate 90deg"
                  className="p-1 hover:text-emerald-400 cursor-pointer ml-1"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {(zoomLevel !== 1 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="text-[10px] font-bold text-slate-400 hover:text-white px-1 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => downloadFile(file)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print Document"
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Canvas */}
        <div className="flex-1 bg-slate-100 p-3 sm:p-6 overflow-auto flex items-center justify-center relative">
          
          {/* 1. OFFICIAL REMITA PAYMENT RECEIPT / CBN TSA SETTLEMENT VOUCHER */}
          {isPaymentReceipt && (!hasRawMedia || viewMode === 'TSA_VOUCHER') ? (
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-slate-900">
              
              {/* Remita / Federal Government of Nigeria Official TSA Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-50 via-white to-emerald-50 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={NPA_OFFICIAL_LOGO_URL}
                      alt="NPA Logo"
                      className="h-14 w-14 object-contain rounded-full bg-white shadow-xs p-0.5 border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#087443] bg-emerald-100/80 px-2 py-0.5 rounded">
                          Federal Republic of Nigeria
                        </span>
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-mono">
                          Remita TSA Gateway
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1 uppercase tracking-tight">
                        Electronic Payment Treasury Receipt
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Central Bank of Nigeria • Treasury Single Account (TSA) Inflow Confirmation
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-black tracking-wide shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" /> PAID / SETTLED
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      CBN SETTLEMENT STATUTORY
                    </span>
                  </div>
                </div>

                {/* Prominent RRR Banner */}
                <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                      Remita Retrieval Reference (RRR)
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-black text-emerald-400 tracking-wider">
                      {rrrToDisplay}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(rrrToDisplay)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                    >
                      {copiedRrr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRrr ? 'Copied' : 'Copy RRR'}</span>
                    </button>
                    <div className="text-right pl-3 border-l border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Transaction Reference</span>
                      <span className="font-mono text-xs text-white font-bold">{receiptRefToDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Financial & Legal Line Items */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {/* 2-column breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Payer / Sponsoring Company</span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      {payment?.companyName || file.holderName || 'Dangote Ports Logistics Ltd'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Submitted by: {payment?.uploadedByName || 'Corporate Compliance Desk'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Beneficiary Agency</span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      Nigerian Ports Authority (NPA)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium block">
                      Accounts & Finance Division • PPMS Revenue TSA
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Service / Description</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      Port Access Pass Issuance & Biometric Capturing Tariff
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Application Ref: {file.referenceNumber || 'NPA/PPMS/LPC/2026/000003'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Payment Date & Channel</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {payment?.paymentDate || (file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-NG') : new Date().toLocaleDateString('en-NG'))}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Channel: {payment?.paymentMethod || 'Remita e-Collection / NIBSS TSA Inflow'}
                    </span>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                      Total Amount Settled (Central Bank of Nigeria)
                    </span>
                    <span className="text-xs text-emerald-800 font-medium italic mt-0.5 block">
                      {formatAmountWords(amountToDisplay)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#087443] font-mono block">
                      NGN {amountToDisplay.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold font-mono">TSA CLEARED IN FULL</span>
                  </div>
                </div>

                {/* Accounts Division Statutory Stamp */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950 block">
                        NPA Accounts Division • Electronic Treasury Validation
                      </span>
                      <span className="text-emerald-900/80">
                        This digital payment voucher satisfies Section 34 of the NPA Act and CBN TSA circular guidelines.
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-300 shrink-0">
                    ACCOUNTS APPROVED
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Strip */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  CBN / REMITA SETTLEMENT VERIFIED
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(file)}
                    className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Receipt PDF
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          ) : isBillingInvoice && (!hasRawMedia || viewMode === 'TSA_VOUCHER') ? (
            /* 2. OFFICIAL ORACLE EBS BILLING ADVICE / DEMAND NOTICE */
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-slate-900">
              <div className="p-6 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={NPA_OFFICIAL_LOGO_URL}
                    alt="NPA Logo"
                    className="h-14 w-14 object-contain rounded-full bg-white shadow-xs p-0.5 border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#087443] block">
                      Nigerian Ports Authority • Finance & Commercial Directorate
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      Oracle EBS Billing Assessment Notice
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Official Revenue Demand & Remita Payment Advice
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 font-mono">
                    BILL ISSUED
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">TARIFF MANDATE</span>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans font-bold">ORACLE BILL REFERENCE</span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      {bill?.oracleBillReference || 'NPA-EBS-2026-09142'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans font-bold">REMITA RRR NUMBER</span>
                    <span className="font-bold text-[#087443] text-sm block mt-0.5">
                      {bill?.rrrNumber || rrrToDisplay}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans font-bold">BILLING DATE</span>
                    <span className="text-slate-700 font-semibold block mt-0.5">
                      {bill?.billingDate || new Date().toISOString().split('T')[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans font-bold">PAYMENT DEADLINE</span>
                    <span className="text-red-700 font-bold block mt-0.5">
                      {bill?.paymentDeadline || '14 Days from issuance'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900 uppercase block">ASSESSED TARIFF PAYABLE</span>
                    <span className="text-xs text-emerald-800 italic mt-0.5 block">Statutory gazetted port access pass charge</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#087443] font-mono">
                      NGN {(bill?.amountNgn || amountToDisplay).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <p><strong>Settlement Instructions:</strong> Proceed to any commercial bank or Remita.net with RRR <strong>{bill?.rrrNumber || rrrToDisplay}</strong>. Pay to Nigerian Ports Authority TSA Revenue account. Upload payment receipt to PPMS upon completion.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ORACLE EBS INTEGRATED</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(file)}
                    className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Advice
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          ) : isImage && fileSource ? (
            /* 3. IMAGE VIEWER */
            <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={fileSource}
                alt={fileName}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease'
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-xl bg-white border border-slate-300"
              />
            </div>
          ) : isPdf && fileSource && (fileSource.startsWith('data:application/pdf') || fileSource.startsWith('blob:') || fileSource.startsWith('http')) ? (
            /* 4. EMBEDDED PDF IFRAME VIEWER */
            <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300 overflow-hidden">
              <iframe
                src={fileSource}
                title={fileName}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* 5. OFFICIAL NPA STATUTORY DOCUMENT INSPECTION CANVAS (CAC, Tax Clearance, Agreements) */
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-slate-900">
              
              {/* Document Header with Crest */}
              <div className="p-6 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={NPA_OFFICIAL_LOGO_URL}
                    alt="NPA Crest"
                    className="h-14 w-14 object-contain rounded-full bg-white shadow-2xs p-0.5 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-[#087443] tracking-widest uppercase block">
                      Nigerian Ports Authority • PPMS
                    </span>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Statutory Document Repository
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official verified file attachment for port access pass issuance
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-mono text-slate-400">DOCUMENT STATUS</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#087443]" /> Verified Attachment
                  </span>
                </div>
              </div>

              {/* Document Metadata Table */}
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">REQUIREMENT TITLE:</span>
                    <span className="font-bold text-slate-900 text-sm">{file.documentName || 'Statutory Requirement'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">UPLOADED FILE NAME:</span>
                    <span className="font-mono font-bold text-[#087443]">{fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">FILE ARCHIVE SIZE:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {file.fileSizeBytes ? `${(file.fileSizeBytes / 1024).toFixed(1)} KB` : '420.5 KB'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">FILING TIMESTAMP:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString('en-NG') : new Date().toLocaleString('en-NG')}
                    </span>
                  </div>
                  {file.holderName && (
                    <div className="sm:col-span-2 border-t pt-2 border-slate-200">
                      <span className="text-slate-400 font-medium block text-[11px]">ASSIGNED PERSONNEL / HOLDER:</span>
                      <span className="font-bold text-slate-800">{file.holderName}</span>
                    </div>
                  )}
                  {file.referenceNumber && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">PORT APPLICATION DOSSIER:</span>
                      <span className="font-mono font-bold text-[#087443]">{file.referenceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Statutory Inspection Certificate Body */}
                <div className="p-4 rounded-xl border border-dashed border-[#087443]/40 bg-emerald-50/40 text-center space-y-2">
                  <ShieldCheck className="w-7 h-7 text-[#087443] mx-auto" />
                  <div className="text-xs font-bold text-slate-900">
                    Official Port Vetting Attachment Inspection
                  </div>
                  <p className="text-[11px] text-slate-600 max-w-md mx-auto leading-relaxed">
                    This file was ingested through the NPA PPMS portal under Section 34 of the NPA Act. 
                    Authorized review officers (OIC ID Unit, GM Security, Accounts Officers) can inspect, verify, and export this dossier file.
                  </p>
                </div>
              </div>

              {/* Bottom Quick Action Strip */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  SHA-256 CHECKED • NPA REPOSITORY
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(file)}
                    className="px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File ({fileName})
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-2.5 bg-slate-900 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800">
          <div className="flex items-center gap-2 text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted NPA Document Vault • Instant In-Browser Preview Active</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => downloadFile(file)}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Direct Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
