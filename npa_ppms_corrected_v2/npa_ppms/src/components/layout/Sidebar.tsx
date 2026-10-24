import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FileCheck2,
  ShieldCheck,
  ReceiptText,
  CreditCard,
  CalendarCheck,
  IdCard,
  BarChart3,
  Settings,
  Mail,
  History,
  Database,
  Building,
  Building2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Anchor
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'applications'
  | 'new_application'
  | 'id_unit_verification'
  | 'security_approval'
  | 'billing'
  | 'payment_verification'
  | 'capturing'
  | 'passes'
  | 'reports'
  | 'smtp_settings'
  | 'audit_trail'
  | 'database_schema'
  | 'company_registration'
  | 'registered_companies';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isMinimized: controlledMinimized,
  onToggleMinimize: controlledToggle
}) => {
  const { hasRole, currentUser } = useAuth();
  const [internalMinimized, setInternalMinimized] = useState(true);

  const isMinimized = controlledMinimized !== undefined ? controlledMinimized : internalMinimized;
  const toggleMinimize = controlledToggle || (() => setInternalMinimized(!internalMinimized));

  const isCompany = hasRole('COMPANY_ADMIN') || hasRole('COMPANY_STAFF');
  const isIdUnit = hasRole('OIC_ID_UNIT');
  const isGmSecurity = hasRole('GM_SECURITY');
  const isBilling = hasRole('TARIFF_BILLING');
  const isAccounts = hasRole('ACCOUNTS_OFFICER');
  const isAdmin = hasRole('SYSTEM_ADMIN') || hasRole('PORT_ADMIN');
  const isAuditor = hasRole('AUDITOR') || hasRole('HQ_SUPERVISOR');

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ElementType;
    visible: boolean;
    badge?: string;
  }> = [
    {
      id: 'dashboard',
      label: isCompany ? 'Company Portal Dashboard' : 'Operations Dashboard',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'applications',
      label: isCompany ? 'My Applications' : (isAdmin || isAuditor) ? 'All Applications (Admin)' : 'My Desk Applications',
      icon: FileText,
      visible: true
    },
    {
      id: 'new_application',
      label: 'New Port Pass Application',
      icon: PlusCircle,
      visible: isCompany || isAdmin
    },
    {
      id: 'company_registration',
      label: 'Company Onboarding',
      icon: Building,
      visible: isCompany || isAdmin
    },
    {
      id: 'registered_companies',
      label: 'Registered Companies',
      icon: Building2,
      visible: isAdmin || isAuditor || isIdUnit
    },
    {
      id: 'id_unit_verification',
      label: 'ID Unit Verification',
      icon: FileCheck2,
      visible: isIdUnit || isAdmin || isAuditor,
      badge: 'Step 1'
    },
    {
      id: 'security_approval',
      label: 'GM Security Clearance',
      icon: ShieldCheck,
      visible: isGmSecurity || isAdmin || isAuditor,
      badge: 'Step 2'
    },
    {
      id: 'billing',
      label: 'Tariff & Billing (Oracle EBS)',
      icon: ReceiptText,
      visible: isBilling || isAdmin || isAuditor,
      badge: 'Step 3'
    },
    {
      id: 'payment_verification',
      label: 'Accounts & Payment Review',
      icon: CreditCard,
      visible: isAccounts || isAdmin || isAuditor,
      badge: 'Step 4'
    },
    {
      id: 'capturing',
      label: 'Biometric Capturing',
      icon: CalendarCheck,
      visible: isIdUnit || isAdmin || isAuditor,
      badge: 'Step 5'
    },
    {
      id: 'passes',
      label: 'Issued Passes & Collection',
      icon: IdCard,
      visible: isIdUnit || isAdmin || isAuditor,
      badge: 'Step 6'
    },
    {
      id: 'reports',
      label: 'NPA Reports & Analytics',
      icon: BarChart3,
      visible: !isCompany && (isIdUnit || isGmSecurity || isBilling || isAccounts || isAdmin || isAuditor)
    },
    {
      id: 'smtp_settings',
      label: 'SMTP & Email Config',
      icon: Mail,
      visible: isAdmin
    },
    {
      id: 'audit_trail',
      label: 'Audit Trail Ledger',
      icon: History,
      visible: isAdmin || isAuditor
    },
    {
      id: 'database_schema',
      label: 'PostgreSQL 46-Table Schema',
      icon: Database,
      visible: isAdmin || isAuditor
    }
  ];

  return (
    <aside
      className={`bg-[#087443] text-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-[#065C35] transition-all duration-300 ease-in-out relative ${
        isMinimized ? 'w-18' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Sub-Banner */}
      <div
        className={`border-b border-[#065C35] bg-[#065C35]/60 transition-all ${
          isMinimized
            ? 'px-2 py-3.5 flex flex-col items-center justify-center gap-1.5'
            : 'px-4 py-3.5 flex items-center justify-between'
        }`}
      >
        {!isMinimized ? (
          <div className="truncate pr-2">
            <p className="text-[10.5px] font-bold text-emerald-200 uppercase tracking-widest truncate">
              NIGERIAN PORTS AUTHORITY
            </p>
            <p className="text-xs text-white/90 font-medium truncate mt-0.5">
              {currentUser?.companyId ? 'Corporate Portal' : 'Command & Administration'}
            </p>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center text-emerald-200"
            title="Nigerian Ports Authority"
          >
            <Anchor className="w-4 h-4 text-emerald-200" />
          </div>
        )}

        <button
          type="button"
          onClick={toggleMinimize}
          className="p-1.5 rounded-md hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
          title={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          aria-label={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        className={`flex-1 py-3 space-y-1 overflow-y-auto ${
          isMinimized ? 'px-2 flex flex-col items-center' : 'px-3'
        }`}
      >
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                className={`transition-all cursor-pointer relative ${
                  isMinimized
                    ? `w-11 h-11 flex items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-white text-[#087443] shadow-md ring-2 ring-emerald-300 font-bold'
                          : 'text-white/85 hover:bg-[#065C35] hover:text-white'
                      }`
                    : `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-white text-[#087443] shadow-md font-bold'
                          : 'text-white/90 hover:bg-[#065C35] hover:text-white'
                      }`
                }`}
              >
                {isMinimized ? (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#087443]' : 'text-emerald-200'}`} />
                    {item.badge && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#087443]" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#087443]' : 'text-emerald-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-[#087443]'
                            : 'bg-emerald-900/60 text-emerald-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
      </nav>

      {/* Bottom Toggle Bar (Footer version text removed; clean collapse control provided) */}
      <div className="p-2 border-t border-[#065C35] bg-[#065C35]/40 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleMinimize}
          className={`flex items-center justify-center gap-2 rounded-lg text-xs font-semibold text-emerald-200 hover:text-white hover:bg-[#065C35] transition-colors cursor-pointer ${
            isMinimized ? 'w-10 h-10' : 'w-full px-3 py-2'
          }`}
          title={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          aria-label={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          {isMinimized ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span>Minimize Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
