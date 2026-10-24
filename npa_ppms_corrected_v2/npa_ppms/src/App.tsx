import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { ApplicationList } from './components/applications/ApplicationList';
import { NewApplicationWizard } from './components/applications/NewApplicationWizard';
import { ApplicationDetailView } from './components/applications/ApplicationDetailView';
import { SmtpSettingsView } from './components/admin/SmtpSettingsView';
import { CapturingCalendarView } from './components/capturing/CapturingCalendarView';
import { PassesListView } from './components/passes/PassesListView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditTrailView } from './components/admin/AuditTrailView';
import { DatabaseSchemaView } from './components/admin/DatabaseSchemaView';
import { CompanyRegistrationView } from './components/company/CompanyRegistrationView';
import { RegisteredCompaniesView } from './components/admin/RegisteredCompaniesView';

interface MainLayoutProps {
  onReturnToLoginWithRef: (refNumber: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onReturnToLoginWithRef }) => {
  const { hasRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const isCompany = hasRole('COMPANY_ADMIN') || hasRole('COMPANY_STAFF');
  const isIdUnit = hasRole('OIC_ID_UNIT');
  const isGmSecurity = hasRole('GM_SECURITY');
  const isBilling = hasRole('TARIFF_BILLING');
  const isAccounts = hasRole('ACCOUNTS_OFFICER');
  const isAdmin = hasRole('SYSTEM_ADMIN') || hasRole('PORT_ADMIN');
  const isAuditor = hasRole('AUDITOR') || hasRole('HQ_SUPERVISOR');

  const isTabAllowed = (tab: NavTab): boolean => {
    if (tab === 'dashboard' || tab === 'applications') return true;
    if (tab === 'new_application' || tab === 'company_registration') return isCompany || isAdmin;
    if (tab === 'registered_companies') return isAdmin || isAuditor || isIdUnit;
    if (tab === 'id_unit_verification') return isIdUnit || isAdmin || isAuditor;
    if (tab === 'security_approval') return isGmSecurity || isAdmin || isAuditor;
    if (tab === 'billing') return isBilling || isAdmin || isAuditor;
    if (tab === 'payment_verification') return isAccounts || isAdmin || isAuditor;
    if (tab === 'capturing') return isIdUnit || isAdmin || isAuditor;
    if (tab === 'passes') return isIdUnit || isAdmin || isAuditor;
    if (tab === 'reports') return !isCompany && (isIdUnit || isGmSecurity || isBilling || isAccounts || isAdmin || isAuditor);
    if (tab === 'smtp_settings') return isAdmin;
    if (tab === 'audit_trail') return isAdmin || isAuditor;
    if (tab === 'database_schema') return isAdmin || isAuditor;
    return false;
  };

  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('npa_sidebar_minimized');
      return saved !== null ? saved === 'true' : true; // Default to minimized as requested
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('npa_sidebar_minimized', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleSelectApplication = (id: string) => {
    setSelectedApplicationId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedApplicationId(null);
  };

  const handleNewAppSuccess = (appId: string) => {
    setSelectedApplicationId(appId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        onSelectApplication={handleSelectApplication}
        isSidebarMinimized={isSidebarMinimized}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedApplicationId(null);
          }}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* If viewing a single application dossier */}
          {selectedApplicationId ? (
            <ApplicationDetailView
              applicationId={selectedApplicationId}
              onBack={handleBackFromDetail}
            />
          ) : !isTabAllowed(activeTab) ? (
            <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✕
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Access Restricted: Outside Assigned Operational Mandate
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your currently active profile (<strong className="text-slate-800">{currentUser?.roles[0]?.replace(/_/g, ' ')}</strong>) is not authorized to access this module. Under NPA PPMS security guidelines, personnel may only interact with modules directly relevant to their statutory responsibilities.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-5 py-2.5 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Return to Authorized Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'applications' && (
                <ApplicationList
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                />
              )}

              {activeTab === 'new_application' && (
                <NewApplicationWizard
                  onSuccess={handleNewAppSuccess}
                  onCancel={() => setActiveTab('applications')}
                  onReturnToLogin={onReturnToLoginWithRef}
                />
              )}

              {activeTab === 'company_registration' && (
                <CompanyRegistrationView
                  onSuccess={() => setActiveTab('dashboard')}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'registered_companies' && (
                <RegisteredCompaniesView
                  onRegisterNew={() => setActiveTab('company_registration')}
                  onSelectApplication={handleSelectApplication}
                />
              )}

              {activeTab === 'id_unit_verification' && (
                <ApplicationList
                  title="OIC ID Unit Verification Queue (Step 1)"
                  presetStatusFilter="PENDING_ID_UNIT_VERIFICATION,RETURNED_TO_ID_UNIT"
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                />
              )}

              {activeTab === 'security_approval' && (
                <ApplicationList
                  title="GM Security Clearances Queue (Step 2)"
                  presetStatusFilter="PENDING_GM_SECURITY_APPROVAL"
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                />
              )}

              {activeTab === 'billing' && (
                <ApplicationList
                  title="Tariff & Billing (Oracle EBS) Queue (Step 3)"
                  presetStatusFilter="PENDING_BILLING"
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                />
              )}

              {activeTab === 'payment_verification' && (
                <ApplicationList
                  title="Accounts Division Payment Review (Step 4)"
                  presetStatusFilter="PAYMENT_UNDER_REVIEW"
                  onSelectApplication={handleSelectApplication}
                  onNewApplication={() => setActiveTab('new_application')}
                />
              )}

              {activeTab === 'capturing' && (
                <CapturingCalendarView />
              )}

              {activeTab === 'passes' && (
                <PassesListView />
              )}

              {activeTab === 'reports' && (
                <ReportsView />
              )}

              {activeTab === 'smtp_settings' && (
                <SmtpSettingsView />
              )}

              {activeTab === 'audit_trail' && (
                <AuditTrailView />
              )}

              {activeTab === 'database_schema' && (
                <DatabaseSchemaView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [registeredSuccessMsg, setRegisteredSuccessMsg] = useState<string | null>(null);
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const [initialMode, setInitialMode] = useState<'LOGIN' | 'TRACK'>('LOGIN');
  const [initialTrackRef, setInitialTrackRef] = useState<string>('');

  const handleRegistrationSuccess = (regEmail: string, compName: string) => {
    setShowRegistration(false);
    setRegisteredSuccessMsg(`Company "${compName}" successfully profiled! Portal administrator credentials have been dispatched exclusively to your corporate email (${regEmail}). Under NPA statutory policy, companies are registered once only. Please sign in with your corporate credentials.`);
    setPrefillEmail(regEmail);
    setInitialMode('LOGIN');
  };

  const handleReturnToLoginFromNewApp = (referenceNumber: string) => {
    logout();
    setInitialTrackRef(referenceNumber);
    setInitialMode('TRACK');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <img src="https://tse2.mm.bing.net/th/id/OIP.QLUNJKfhgBVW5ovF4KvUhwHaHz?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="NPA" className="h-16 w-16 mx-auto object-contain rounded-full shadow-md animate-pulse" />
          <p className="text-xs font-bold text-[#087443]">Loading NPA Port Pass Management System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showRegistration) {
      return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
          <CompanyRegistrationView
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistration(false)}
          />
        </div>
      );
    }

    return (
      <LoginPage
        onRegisterCompany={() => {
          setRegisteredSuccessMsg(null);
          setShowRegistration(true);
        }}
        registeredSuccessMsg={registeredSuccessMsg}
        onClearRegisteredMsg={() => setRegisteredSuccessMsg(null)}
        prefillEmail={prefillEmail}
        initialMode={initialMode}
        initialTrackRef={initialTrackRef}
      />
    );
  }

  return <MainLayout onReturnToLoginWithRef={handleReturnToLoginFromNewApp} />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
