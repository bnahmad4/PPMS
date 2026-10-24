import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SmtpSettings, EmailNotificationLog, EmailTemplate } from '../../types';
import {
  Mail,
  Server,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Send,
  Eye,
  Search,
  X,
  FileCode,
  ShieldCheck,
  Building2,
  Lock,
  Info
} from 'lucide-react';

export const SmtpSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [logs, setLogs] = useState<EmailNotificationLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Provider Mode: 'GMAIL' or 'ON_PREMISE'
  const [providerMode, setProviderMode] = useState<'GMAIL' | 'ON_PREMISE'>('GMAIL');

  // Test Console
  const [testRecipient, setTestRecipient] = useState('hasyakb01@gmail.com');
  const [testNote, setTestNote] = useState('Real-time production dispatch verification');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // On-prem auth toggle
  const [onPremRequiresAuth, setOnPremRequiresAuth] = useState(true);

  // Navigation Tabs: 'config', 'logs', 'templates'
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'templates'>('config');

  // Log Filtering & Inspection
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailNotificationLog[] | null | any>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [smtpRes, logsRes, tplsRes] = await Promise.all([
        api.getSmtpSettings(),
        api.getEmailLogs(),
        api.getEmailTemplates()
      ]);
      setSettings(smtpRes.settings);
      setLogs(logsRes.logs);
      setTemplates(tplsRes.templates);

      // Detect current mode
      if (smtpRes.settings?.host?.toLowerCase().includes('gmail')) {
        setProviderMode('GMAIL');
      } else {
        setProviderMode('ON_PREMISE');
        setOnPremRequiresAuth(!!smtpRes.settings?.username);
      }
    } catch (err) {
      console.error('Error loading SMTP settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectProvider = (mode: 'GMAIL' | 'ON_PREMISE') => {
    setProviderMode(mode);
    setTestResult(null);

    if (!settings) return;

    if (mode === 'GMAIL') {
      setSettings({
        ...settings,
        host: 'smtp.gmail.com',
        port: 587,
        encryptionType: 'STARTTLS',
        senderName: settings.senderName || 'Nigerian Ports Authority - PPMS',
        senderEmail: settings.senderEmail?.includes('@gmail.com') ? settings.senderEmail : (settings.username?.includes('@gmail.com') ? settings.username : 'ppms-notifications@gmail.com')
      });
    } else {
      setSettings({
        ...settings,
        host: settings.host === 'smtp.gmail.com' ? 'mail.nigerianports.gov.ng' : settings.host,
        port: settings.port || 587,
        encryptionType: 'STARTTLS',
        senderName: settings.senderName || 'Nigerian Ports Authority - PPMS',
        senderEmail: settings.senderEmail?.includes('@gmail.com') ? 'ppms-notifications@nigerianports.gov.ng' : settings.senderEmail
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      const payload: Partial<SmtpSettings> = {
        ...settings,
        // If on-premise without authentication, clear username/password
        ...(providerMode === 'ON_PREMISE' && !onPremRequiresAuth ? { username: '', passwordEncrypted: '' } : {})
      };

      const res = await api.updateSmtpSettings(payload);
      setSettings(res.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings) return;
    try {
      setTestLoading(true);
      setTestResult(null);
      const configToTest = {
        ...settings,
        ...(providerMode === 'ON_PREMISE' && !onPremRequiresAuth ? { username: '', passwordEncrypted: '' } : {})
      };
      const res = await api.testSmtpConnection(configToTest);
      setTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) return;
    try {
      setTestLoading(true);
      setTestResult(null);
      const res = await api.sendTestEmail(testRecipient.trim(), testNote);
      setTestResult({
        success: res.success,
        message: res.message
      });
      // Refresh logs to show the new real-time record
      const updatedLogs = await api.getEmailLogs();
      setLogs(updatedLogs.logs);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Real-time dispatch failed'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = logStatusFilter === 'ALL' || log.status === logStatusFilter;
    if (!matchesFilter) return false;
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      log.recipientEmail.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.eventCode.toLowerCase().includes(q) ||
      (log.applicationReference && log.applicationReference.toLowerCase().includes(q))
    );
  });

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center justify-center gap-3">
        <RotateCw className="w-8 h-8 animate-spin text-[#087443]" />
        <span>Initializing Real-Time SMTP Gateway...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#087443] text-white p-6 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest">
              Communications Subsystem • Production Engine
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME DISPATCH ONLY
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mt-1">
            SMTP Real-Time Electronic Mail Engine
          </h1>
          <p className="text-xs text-emerald-100 mt-1">
            Real-time notifications for biometric appointments, security approvals, Oracle billing advice, and pass issuance.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#065C35] p-1 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'config' ? 'bg-white text-[#087443] shadow-xs' : 'text-emerald-100 hover:text-white'
            }`}
          >
            Server Settings
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'logs' ? 'bg-white text-[#087443] shadow-xs' : 'text-emerald-100 hover:text-white'
            }`}
          >
            Delivery Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
              activeTab === 'templates' ? 'bg-white text-[#087443] shadow-xs' : 'text-emerald-100 hover:text-white'
            }`}
          >
            Templates ({templates.length})
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#087443]" />
          Real-time SMTP configuration updated successfully! Outgoing dispatches will use these parameters.
        </div>
      )}

      {/* TAB 1: SMTP CONFIGURATION & TEST CONSOLE */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Streamlined Provider Selector (Gmail vs On-Premise) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Active Mail Transport Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Gmail */}
                <button
                  type="button"
                  onClick={() => handleSelectProvider('GMAIL')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    providerMode === 'GMAIL'
                      ? 'border-[#087443] bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${providerMode === 'GMAIL' ? 'bg-[#087443] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">Google Workspace / Gmail</span>
                      {providerMode === 'GMAIL' && (
                        <span className="w-2 h-2 rounded-full bg-[#087443]"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Cloud SMTP relay via <code className="font-mono text-[#087443] text-[10.5px]">smtp.gmail.com</code> (Port 587/465)
                    </p>
                  </div>
                </button>

                {/* Option 2: On-Premise */}
                <button
                  type="button"
                  onClick={() => handleSelectProvider('ON_PREMISE')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    providerMode === 'ON_PREMISE'
                      ? 'border-[#087443] bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${providerMode === 'ON_PREMISE' ? 'bg-[#087443] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">On-Premise NPA Server</span>
                      {providerMode === 'ON_PREMISE' && (
                        <span className="w-2 h-2 rounded-full bg-[#087443]"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Internal NPA Exchange, Postfix, or corporate port mail relay
                    </p>
                  </div>
                </button>
              </div>

              {/* Provider Quick Guidance Info */}
              {providerMode === 'GMAIL' ? (
                <div className="mt-3.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <p className="font-bold text-blue-950">How to configure Gmail for real-time delivery:</p>
                    <p className="text-blue-800">
                      Use a <strong>16-character Google App Password</strong> (not your normal login password). Generate it via: <em>Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords</em>. Enter your Gmail address in Username and the App Password in Password.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-start gap-2.5">
                  <Server className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <p className="font-bold text-emerald-950">On-Premise Mail Server Configuration:</p>
                    <p className="text-emerald-800">
                      Specify your local or intranet mail host (e.g. <code className="font-mono text-emerald-900 font-bold">mail.nigerianports.gov.ng</code> or IP). Supports standard Port 25, Submission Port 587, and secure SMTPS Port 465. If running an open internal relay, uncheck authentication.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Server Configuration Form */}
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#087443]" />
                  {providerMode === 'GMAIL' ? 'Google Workspace / Gmail Credentials' : 'On-Premise Server Parameters'}
                </h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  settings.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {settings.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SMTP Host */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SMTP Host Server *
                  </label>
                  <input
                    type="text"
                    value={settings.host}
                    onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                    placeholder={providerMode === 'GMAIL' ? 'smtp.gmail.com' : 'mail.nigerianports.gov.ng'}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    required
                  />
                </div>

                {/* Port */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SMTP Port *
                  </label>
                  <select
                    value={settings.port}
                    onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  >
                    <option value={587}>Port 587 (STARTTLS - Standard Submission)</option>
                    <option value={465}>Port 465 (SSL / Direct Secure TLS)</option>
                    <option value={25}>Port 25 (Standard Internal Relay / Unencrypted)</option>
                  </select>
                </div>

                {/* Encryption */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Encryption Protocol *
                  </label>
                  <select
                    value={settings.encryptionType}
                    onChange={(e) => setSettings({ ...settings, encryptionType: e.target.value as any })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  >
                    <option value="STARTTLS">STARTTLS (Standard Secure Handshake)</option>
                    <option value="TLS">TLS (Implicit SSL Socket)</option>
                    <option value="NONE">None (Internal Unencrypted Relay)</option>
                  </select>
                </div>

                {/* On-Premise Auth Toggle (only if on-prem) */}
                {providerMode === 'ON_PREMISE' && (
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onPremRequiresAuth}
                        onChange={(e) => setOnPremRequiresAuth(e.target.checked)}
                        className="w-4 h-4 text-[#087443] rounded"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Server Requires Authentication (Username/Password)
                      </span>
                    </label>
                  </div>
                )}

                {/* Username */}
                {(providerMode === 'GMAIL' || onPremRequiresAuth) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {providerMode === 'GMAIL' ? 'Gmail / Workspace Address *' : 'SMTP Username'}
                    </label>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                      placeholder={providerMode === 'GMAIL' ? 'portal-notifications@gmail.com' : 'smtp-service@nigerianports.gov.ng'}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                      required={providerMode === 'GMAIL'}
                    />
                  </div>
                )}

                {/* Password / App Secret */}
                {(providerMode === 'GMAIL' || onPremRequiresAuth) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {providerMode === 'GMAIL' ? '16-Character Google App Password *' : 'SMTP Password'}
                    </label>
                    <input
                      type="password"
                      value={settings.passwordEncrypted}
                      onChange={(e) => setSettings({ ...settings, passwordEncrypted: e.target.value })}
                      placeholder={providerMode === 'GMAIL' ? 'abcd efgh ijkl mnop' : '••••••••••••'}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                      required={providerMode === 'GMAIL'}
                    />
                  </div>
                )}

                {/* Sender Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender From Email Address *
                  </label>
                  <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                    placeholder="ppms-notifications@nigerianports.gov.ng"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                    required
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.senderName}
                    onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                    placeholder="Nigerian Ports Authority - PPMS"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                {/* Reply-To */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={settings.replyToEmail || ''}
                    onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                    placeholder="support-ppms@nigerianports.gov.ng"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#087443]"
                  />
                </div>
              </div>

              {/* Bottom Submit Controls */}
              <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#087443] rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Enable Real-Time Email Broadcasts
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={testLoading}
                    onClick={handleTestConnection}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-extrabold rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Test Console: Real-Time Dispatch Verification */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#087443]" />
                Real-Time Test Email Dispatch
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sends an authentic test message in real time through the configured {providerMode === 'GMAIL' ? 'Gmail' : 'On-Premise'} gateway to verify actual inbox delivery.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Recipient Email Address:
                    </label>
                    <button
                      type="button"
                      onClick={() => setTestRecipient('hasyakb01@gmail.com')}
                      className="text-[10.5px] text-[#087443] hover:underline font-bold cursor-pointer"
                    >
                      Use hasyakb01@gmail.com
                    </button>
                  </div>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#087443]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test Note:
                  </label>
                  <input
                    type="text"
                    value={testNote}
                    onChange={(e) => setTestNote(e.target.value)}
                    placeholder="Production test verification"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <button
                  type="button"
                  disabled={testLoading || !testRecipient.trim()}
                  onClick={handleSendTestEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#087443] hover:bg-[#065C35] disabled:opacity-50 text-white text-xs font-extrabold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${testLoading ? 'animate-pulse' : ''}`} />
                  {testLoading ? 'Dispatching Real-Time Email...' : 'Send Live Test Email'}
                </button>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-lg text-xs font-medium space-y-1.5 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-50 text-amber-950 border border-amber-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-[#087443]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>{testResult.success ? 'Real-Time Delivery Successful' : 'Delivery Notice'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#087443]" />
                Live Statutory Events Triggered
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>Port Pass Submission Confirmation</li>
                <li>GM Security Clearance Alerts</li>
                <li>Oracle EBS Billing Advice & Remita RRR</li>
                <li>Payment Receipt & Verification</li>
                <li>Biometric Capturing Appointment Notice</li>
                <li>Port Pass Ready for Collection</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL DELIVERY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
          {/* Controls Bar */}
          <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Real-Time Delivery Logs ({filteredLogs.length})
              </h2>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLogStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${logStatusFilter === 'ALL' ? 'bg-[#087443] text-white' : 'text-slate-600'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setLogStatusFilter('SENT')}
                  className={`px-2 py-0.5 rounded ${logStatusFilter === 'SENT' ? 'bg-[#087443] text-white' : 'text-slate-600'}`}
                >
                  Sent
                </button>
                <button
                  type="button"
                  onClick={() => setLogStatusFilter('FAILED')}
                  className={`px-2 py-0.5 rounded ${logStatusFilter === 'FAILED' ? 'bg-red-700 text-white' : 'text-slate-600'}`}
                >
                  Failed
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter recipient, ref, or event..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md w-56 font-mono focus:ring-1 focus:ring-[#087443]"
                />
              </div>
              <button
                onClick={loadAll}
                className="text-xs font-bold text-[#087443] hover:underline flex items-center gap-1 cursor-pointer bg-white px-3 py-1 rounded border border-slate-200"
              >
                <RotateCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#087443] text-white font-bold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp (WAT)</th>
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Event Code</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Application Ref</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No matching email delivery logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.dispatchedAt).toLocaleString('en-NG')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {log.recipientEmail}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.eventCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700 max-w-xs truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#087443] font-bold">
                        {log.applicationReference || '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[11px] font-bold cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#087443]" />
              Official NPA Port Pass Notification Templates ({templates.length})
            </h2>
            <span className="text-xs text-slate-500">Live templates dispatched via On-Premise or Gmail</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900 truncate">{tpl.title}</div>
                  <span className="font-mono text-[10px] bg-[#087443] text-white px-2 py-0.5 rounded shrink-0">
                    {tpl.eventCode}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Subject: </span>
                  <span className="font-mono text-slate-800 text-[11px]">{tpl.subject}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-sans bg-white p-2.5 rounded border border-slate-200 max-h-20 overflow-y-auto leading-relaxed">
                  {tpl.plainTextBody}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Email Log Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#087443] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm font-extrabold">Electronic Mail Dispatch Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-white hover:bg-[#065C35] p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Status</span>
                  <span className={`inline-block font-extrabold mt-0.5 px-2 py-0.5 rounded text-[11px] ${
                    selectedLog.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Event Code</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">{selectedLog.eventCode}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Dispatched Timestamp</span>
                  <span className="font-mono text-slate-700 block mt-0.5">{new Date(selectedLog.dispatchedAt).toLocaleString('en-NG')} (WAT)</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Application Reference</span>
                  <span className="font-mono font-bold text-[#087443] block mt-0.5">{selectedLog.applicationReference || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Recipient Address</span>
                <div className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                  {selectedLog.recipientEmail}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Header</span>
                <div className="font-medium text-slate-900 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                  {selectedLog.subject}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SMTP Message Identifier</span>
                <div className="font-mono text-[10px] text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 truncate">
                  {selectedLog.smtpMessageId || 'Confirmed live handshake'}
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
                  <span className="font-bold block">Delivery Error:</span>
                  {selectedLog.errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
