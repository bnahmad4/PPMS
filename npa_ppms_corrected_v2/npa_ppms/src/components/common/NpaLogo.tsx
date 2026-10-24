import React from 'react';

export const NPA_OFFICIAL_LOGO_URL = 'https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3';

interface NpaLogoProps {
  className?: string;
  variant?: 'full' | 'emblem';
  showSubtitle?: boolean;
}

export const NpaLogo: React.FC<NpaLogoProps> = ({
  className = 'h-12 w-auto',
  variant = 'full',
  showSubtitle = true
}) => {
  if (variant === 'emblem') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={NPA_OFFICIAL_LOGO_URL}
          alt="Nigerian Ports Authority Crest"
          className="h-12 w-12 object-contain rounded-full bg-white p-0.5"
          referrerPolicy="no-referrer"
        />
        {showSubtitle && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-tight">NIGERIAN PORTS AUTHORITY</span>
            <span className="text-[10px] font-medium text-emerald-200 tracking-wider">PORT PASS MANAGEMENT SYSTEM</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={NPA_OFFICIAL_LOGO_URL}
        alt="Nigerian Ports Authority"
        className={`${className} object-contain rounded-full shadow-2xs`}
        referrerPolicy="no-referrer"
      />
      {showSubtitle && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold tracking-tight text-[#087443] dark:text-emerald-400 leading-tight">
            NIGERIAN PORTS AUTHORITY
          </span>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 tracking-wider">
            PORT PASS MANAGEMENT SYSTEM
          </span>
        </div>
      )}
    </div>
  );
};
