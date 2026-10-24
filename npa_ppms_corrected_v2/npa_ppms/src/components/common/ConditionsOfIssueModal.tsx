import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { ConditionsAcceptance } from '../../types';

interface ConditionsOfIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (acceptance: Omit<ConditionsAcceptance, 'id' | 'applicationId' | 'acceptedAt'>) => void;
  applicantName: string;
}

export const CONDITIONS_TEXT = [
  {
    num: 1,
    title: 'Property of Authority',
    text: 'The Port Pass remains the property of the Nigerian Ports Authority at all times and must be surrendered upon demand by any authorised NPA security officer or law enforcement personnel.'
  },
  {
    num: 2,
    title: 'Non-Transferability',
    text: 'The Port Pass is strictly non-transferable and must only be used by the registered individual to whom it has been issued. Lending, transferring, or allowing another person to use the pass constitutes an immediate offence.'
  },
  {
    num: 3,
    title: 'Conspicuous Display',
    text: 'The Port Pass must be worn conspicuously on the outer garment at chest level at all times whilst within any Nigerian Ports Authority operational area, terminal, jetty, or administrative precinct.'
  },
  {
    num: 4,
    title: 'Operational Area Demarcation',
    text: 'Entry into port operational zones is restricted strictly to designated work areas, berths, and facilities specified on the face of the pass and during authorized operational hours only.'
  },
  {
    num: 5,
    title: 'Mandatory Inspection & Search',
    text: 'The holder must submit to visual inspection, physical search, biometric verification, vehicle search, and bag inspection upon entering, exiting, or moving within any NPA port gate or perimeter.'
  },
  {
    num: 6,
    title: 'Immediate Reporting of Loss',
    text: 'Loss or theft of a Port Pass must be reported immediately to the OIC ID Unit, Port Security Officer (PSO), and the nearest Nigerian Police station with a valid Police Extract obtained within 24 hours.'
  },
  {
    num: 7,
    title: 'Tampering Prohibited',
    text: 'Port passes must not be defaced, altered, laminated, photocopied, duplicated, or electronically spoofed under any circumstances. Damaged passes must be returned for reissuance.'
  },
  {
    num: 8,
    title: 'Maritime Safety & ISPS Compliance',
    text: 'Possession of a Port Pass does not exempt the holder from observing all Nigerian Ports Authority port safety, ISPS Code maritime security regulations, environmental controls, and traffic guidelines.'
  },
  {
    num: 9,
    title: 'Surrender on Duty Termination',
    text: 'The Port Pass must be returned to the NPA ID Unit upon cessation of employment, contract completion, revocation of operating license, or change of designated port duties.'
  },
  {
    num: 10,
    title: 'Unlawful Use & Trespass',
    text: 'Any attempt to use an expired, damaged, revoked, or altered Port Pass constitutes an unlawful trespass and maritime security violation.'
  },
  {
    num: 11,
    title: 'Discretionary Revocation',
    text: 'The Nigerian Ports Authority reserves the absolute discretionary right to suspend, cancel, or revoke any Port Pass without prior notice in the interest of national maritime safety, public order, or security.'
  },
  {
    num: 12,
    title: 'Corporate Liability',
    text: 'Companies and employers shall be jointly and severally liable for any breach of security, smuggling, unauthorized access, or regulatory infraction committed by their sponsored pass holders within port premises.'
  },
  {
    num: 13,
    title: 'Fraud & Criminal Sanction',
    text: 'False declarations, fraudulent document submission, imposture, or tampering with pass records will result in summary cancellation, permanent blacklisting of the sponsoring company, and criminal referral.'
  }
];

export const PROSECUTION_WARNING = `STATUTORY WARNING: Under Section 34 of the Nigerian Ports Authority Act, the Official Secrets Act, the ISPS Code Security Regulations, and the Criminal Code Act of the Federal Republic of Nigeria, any person who falsifies, unlawfully duplicates, impersonates, transfers, or aids in the unauthorized manufacture or procurement of an official Nigerian Ports Authority Port Pass is liable upon conviction to immediate arrest, fine, and imprisonment.`;

export const ConditionsOfIssueModal: React.FC<ConditionsOfIssueModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  applicantName
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedCheckbox, setAgreedCheckbox] = useState(false);
  const [signatureName, setSignatureName] = useState(applicantName || '');
  const [userIp, setUserIp] = useState('102.89.44.120'); // Standard Nigerian IP for audit trace
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (applicantName) setSignatureName(applicantName);
  }, [applicantName]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 25) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  const canSubmit = hasScrolledToBottom && agreedCheckbox && signatureName.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAccept({
      versionCode: 'REVISED_MARCH_2018',
      signatureName: signatureName.trim(),
      signatureData: `DIGITAL_SIGNATURE_${signatureName.toUpperCase().replace(/\s+/g, '_')}_TIMESTAMP_${Date.now()}`,
      ipAddress: userIp,
      scrolledToBottom: true,
      userId: 'current-user'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#087443] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">NPA Conditions of Issue & Prosecution Warning</h2>
              <p className="text-xs text-emerald-100">Official Legal Undertaking • Revised March 2018</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-900/60 text-emerald-200 px-2.5 py-1 rounded font-mono">
            LEGAL VER: 2018-03
          </span>
        </div>

        {/* Scrollable Conditions Text */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700 bg-slate-50/50"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              <strong>Mandatory Scroll Requirement:</strong> You are required to read through the complete official conditions below. The acceptance checkbox will unlock only after you scroll to the bottom of this document.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Conditions Governing Issue and Use of Nigerian Ports Authority Port Passes
            </h3>

            {CONDITIONS_TEXT.map((cond) => (
              <div key={cond.num} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[#087443] text-sm shrink-0">{cond.num}.</span>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm mr-1">{cond.title}:</span>
                    <span className="text-slate-600 text-sm leading-relaxed">{cond.text}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Prosecution Warning Box */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 text-red-800 font-bold mb-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                STATUTORY PROSECUTION WARNING
              </div>
              <p className="text-xs text-red-900 font-mono leading-relaxed">
                {PROSECUTION_WARNING}
              </p>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400">--- END OF OFFICIAL LEGAL STATEMENT ---</span>
            </div>
          </div>
        </div>

        {/* Legal Sign-off Footer */}
        <div className="bg-white border-t border-slate-200 p-5 space-y-4 shrink-0">
          <div className="space-y-3">
            <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolledToBottom ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={agreedCheckbox}
                disabled={!hasScrolledToBottom}
                onChange={(e) => setAgreedCheckbox(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#087443] focus:ring-[#087443] border-slate-300"
              />
              <span className="text-xs text-slate-700 leading-normal">
                I hereby solemnly declare that I have read, understood, and agreed to be bound by the above <strong>13 NPA Conditions of Issue (Revised March 2018)</strong> and the Statutory Prosecution Warning on behalf of my organization and all registered personnel.
              </span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Electronic Signature (Full Legal Name)
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Enter full legal name as authorized signatory"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#087443] focus:ring-1 focus:ring-[#087443] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Timestamp & IP Verification
                </label>
                <div className="text-xs bg-slate-100 border border-slate-200 px-3 py-2 rounded text-slate-600 font-mono flex items-center justify-between">
                  <span>IP: {userIp}</span>
                  <span>{new Date().toLocaleDateString('en-NG')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {!hasScrolledToBottom ? 'Scroll down to enable agreement' : 'All requirements satisfied'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded text-white shadow-xs transition-colors ${
                  canSubmit
                    ? 'bg-[#087443] hover:bg-[#065C35]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Sign & Accept Conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
