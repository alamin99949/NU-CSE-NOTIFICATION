import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  X, 
  Send, 
  CheckCircle2, 
  BellRing, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  AlertCircle,
  Eye,
  Settings2,
  KeyRound,
  Download,
  Server,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { EmailAlertConfig, EmailDispatchLog, SmtpConfig } from '../types';
import { verifySmtpConfig } from '../services/api';

interface EmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailConfig: EmailAlertConfig;
  onSaveConfig: (config: EmailAlertConfig) => Promise<void>;
  dispatchLogs: EmailDispatchLog[];
  onSendTestEmail: (email: string, semester?: string) => Promise<{ 
    success: boolean; 
    previewHtml?: string; 
    message?: string; 
    error?: string;
    previewUrl?: string;
    method?: string;
  }>;
}

export const EmailAlertModal: React.FC<EmailAlertModalProps> = ({
  isOpen,
  onClose,
  emailConfig,
  onSaveConfig,
  dispatchLogs,
  onSendTestEmail,
}) => {
  const [formConfig, setFormConfig] = useState<EmailAlertConfig>(emailConfig);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(
    emailConfig.smtp || {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      senderName: 'NU CSE Notice Tracker',
      isConfigured: false,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isVerifyingSmtp, setIsVerifyingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    previewHtml?: string;
    previewUrl?: string;
    error?: string;
  } | null>(null);
  const [smtpResult, setSmtpResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'smtp' | 'quick-send' | 'preview' | 'history'>('settings');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    setFormConfig(emailConfig);
    if (emailConfig.smtp) {
      setSmtpConfig(emailConfig.smtp);
    }
  }, [emailConfig]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const merged: EmailAlertConfig = {
        ...formConfig,
        smtp: {
          ...smtpConfig,
          isConfigured: Boolean(smtpConfig.user && smtpConfig.pass)
        }
      };
      await onSaveConfig(merged);
      setTestResult({
        success: true,
        message: `Preferences saved! Alerts will be sent to ${merged.recipientEmail}`
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Could not save email settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifySmtp = async () => {
    setIsVerifyingSmtp(true);
    setSmtpResult(null);
    try {
      const res = await verifySmtpConfig(smtpConfig);
      if (res.success) {
        setSmtpResult({ success: true, message: res.message || 'SMTP credentials verified successfully!' });
        setSmtpConfig(prev => ({ ...prev, isConfigured: true }));
      } else {
        setSmtpResult({ success: false, message: res.error || 'SMTP verification failed.' });
      }
    } catch (err: any) {
      setSmtpResult({ success: false, message: err?.message || 'SMTP verification call failed.' });
    } finally {
      setIsVerifyingSmtp(false);
    }
  };

  const handleTriggerTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await onSendTestEmail(formConfig.recipientEmail, formConfig.selectedSemester);
      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || `Test email dispatched to ${formConfig.recipientEmail}!`,
          previewHtml: res.previewHtml,
          previewUrl: res.previewUrl
        });
        if (res.previewHtml) {
          setPreviewHtml(res.previewHtml);
        }
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Email delivery failed.',
          error: res.error,
          previewHtml: res.previewHtml
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Failed to send test email: ' + (err?.message || 'Network error')
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Open Gmail Web Compose with pre-filled content
  const handleOpenInGmail = () => {
    const target = formConfig.recipientEmail || 'alaminb949@gmail.com';
    const subject = encodeURIComponent(`📢 [NU CSE Alert] 8th Semester Exam Routine & Centre List Notice`);
    const body = encodeURIComponent(
      `Official National University CSE Examination Alert:\n\n` +
      `Title: ২০২৩ সালের ৪র্থ বর্ষ বিএসসি (অনার্স) প্রফেশনাল সিএসই (CSE) ৮ম সেমিস্টার পরীক্ষার সংশোধিত সময়সূচি ও কেন্দ্রতালিকা সংক্রান্ত বিজ্ঞপ্তি\n` +
      `Category: Routine\n` +
      `Semester: ${formConfig.selectedSemester === 'all' ? '8th Semester' : formConfig.selectedSemester}\n` +
      `Official PDF Link: https://www.nu.ac.bd/uploads/examination/CSE_8th_Sem_Bangla_Routine_2025.pdf\n\n` +
      `Dispatched by National University CSE Notice Tracker.`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(target)}&su=${subject}&body=${body}`, '_blank');
  };

  // Download RFC822 .eml file
  const handleDownloadEml = async () => {
    try {
      const res = await fetch('/api/alerts/email/download-eml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: formConfig.recipientEmail,
          notice: {
            title: '২০২৩ সালের ৪র্থ বর্ষ বিএসসি (অনার্স) প্রফেশনাল সিএসই (CSE) ৮ম সেমিস্টার পরীক্ষার সংশোধিত সময়সূচি',
            category: 'Routine',
            fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_8th_Sem_Bangla_Routine_2025.pdf',
            memoNo: 'NU/Exam/Prof/CSE/2025/1088'
          }
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NU-CSE-Alert-${formConfig.recipientEmail}.eml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Could not download EML: ' + err?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Dialog with Crisp White Background */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  CSE Email Alert Dispatcher
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  smtpConfig.isConfigured 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {smtpConfig.isConfigured ? '🟢 Real SMTP Ready' : '🟡 Test/Setup Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct notifications to <strong className="text-slate-700">{formConfig.recipientEmail}</strong> for National University CSE notices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Alert Settings</span>
          </button>
          
          <button
            onClick={() => setActiveTab('smtp')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'smtp'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>SMTP Delivery Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('quick-send')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'quick-send'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Direct Send & Webmail</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Email Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sent Logs ({dispatchLogs.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          
          {testResult && (
            <div className={`p-3.5 rounded-xl text-xs flex flex-col gap-1.5 border shadow-xs ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.error && (
                <div className="text-[11px] text-rose-700 bg-white/70 p-2 rounded-lg border border-rose-100 mt-1">
                  <strong>Issue:</strong> {testResult.error}
                </div>
              )}
              {testResult.previewUrl && (
                <div className="mt-1">
                  <a 
                    href={testResult.previewUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline bg-white px-2.5 py-1 rounded-md border border-indigo-200"
                  >
                    <span>View Delivered Email in Live Web Mailbox</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: General Alert Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Main Toggle & Recipient Address */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Automatic Email Notifications</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Send email alert immediately when a new notice matching CSE or সিএসই is parsed
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConfig.enabled}
                      onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Recipient Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="alaminb949@gmail.com"
                      value={formConfig.recipientEmail}
                      onChange={(e) => setFormConfig({ ...formConfig, recipientEmail: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono shadow-xs"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Verified recipient address for CSE examination alerts</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Active Target
                    </span>
                  </div>
                </div>
              </div>

              {/* Notice Trigger Categories */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Notice Categories to Trigger Email:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs">
                    <input
                      type="checkbox"
                      checked={formConfig.notifyOnRoutine}
                      onChange={(e) => setFormConfig({ ...formConfig, notifyOnRoutine: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-800 font-medium">📅 Exam Routines & Schedules</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs">
                    <input
                      type="checkbox"
                      checked={formConfig.notifyOnFormFillup}
                      onChange={(e) => setFormConfig({ ...formConfig, notifyOnFormFillup: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-800 font-medium">📝 Online Form Fill-up Notices</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs">
                    <input
                      type="checkbox"
                      checked={formConfig.notifyOnResult}
                      onChange={(e) => setFormConfig({ ...formConfig, notifyOnResult: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-800 font-medium">📊 Examination Results & Re-scrutiny</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs">
                    <input
                      type="checkbox"
                      checked={formConfig.notifyOnLabViva}
                      onChange={(e) => setFormConfig({ ...formConfig, notifyOnLabViva: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-800 font-medium">🧪 Practical & Viva Voce Schedules</span>
                  </label>

                </div>
              </div>

              {/* Semester Filtering */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Semester Filter:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Receive alerts for all semesters or target your specific term
                  </p>
                </div>
                <select
                  value={formConfig.selectedSemester}
                  onChange={(e) => setFormConfig({ ...formConfig, selectedSemester: e.target.value })}
                  className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
                >
                  <option value="all">All Semesters (1st to 8th + Year)</option>
                  <option value="8th Semester">8th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="1st Semester">1st Semester</option>
                </select>
              </div>

              {/* Polling Frequency Options (Every 1 Day, 5 Day, 7 Day) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Polling Frequency Cadence:</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select how often notices are checked and alerts dispatched
                  </p>
                </div>
                <select
                  value={formConfig.frequency}
                  onChange={(e) => setFormConfig({ ...formConfig, frequency: e.target.value as any })}
                  className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 font-medium shadow-xs"
                >
                  <option value="instant">⚡ Instant Real-Time (Immediate alert upon publish)</option>
                  <option value="1_day">📅 Every 1 Day (Daily Check & Dispatch)</option>
                  <option value="5_day">📆 Every 5 Days (5-Day Digest)</option>
                  <option value="7_day">🗓️ Every 7 Days (Weekly Digest)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTriggerTest}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-bounce' : ''}`} />
                  <span>{isSendingTest ? 'Sending Test...' : `Send Test Alert to ${formConfig.recipientEmail}`}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: SMTP Configuration */}
          {activeTab === 'smtp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span>Direct SMTP Delivery Setup (Send to Real Gmail Inbox)</span>
                  </h4>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    smtpConfig.isConfigured 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {smtpConfig.isConfigured ? '✓ Configured' : 'Setup Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To deliver real emails directly into <strong>{formConfig.recipientEmail}</strong>, enter your Gmail sender account and a 16-character Google App Password.
                </p>

                {/* Instructions Accordion/Box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>How to get a Gmail App Password in 1 minute:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px] text-amber-800">
                    <li>Go to your Google Account at <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-700">myaccount.google.com/security</a>.</li>
                    <li>Ensure <strong>2-Step Verification</strong> is turned ON.</li>
                    <li>Search or click <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-700">App Passwords</a>.</li>
                    <li>Create an app name (e.g. &ldquo;NU CSE Tracker&rdquo;) and copy the generated <strong>16-character code</strong> into the field below.</li>
                  </ol>
                </div>

                {smtpResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    smtpResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {smtpResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                    <span>{smtpResult.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Service / Provider:
                    </label>
                    <select
                      value={smtpConfig.service || 'gmail'}
                      onChange={(e) => setSmtpConfig({ 
                        ...smtpConfig, 
                        service: e.target.value as any,
                        host: e.target.value === 'gmail' ? 'smtp.gmail.com' : (e.target.value === 'outlook' ? 'smtp-mail.outlook.com' : smtpConfig.host),
                        port: e.target.value === 'gmail' ? 465 : 587
                      })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="gmail">Google Gmail (smtp.gmail.com)</option>
                      <option value="outlook">Microsoft Outlook / Office 365</option>
                      <option value="custom">Custom SMTP Server</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Name:
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.senderName || 'NU CSE Notice Tracker'}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                      placeholder="NU CSE Notice Tracker"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Email (Gmail Address):
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.user || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      placeholder="your.gmail@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Google App Password (16 characters):
                    </label>
                    <input
                      type="password"
                      value={smtpConfig.pass || ''}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {smtpConfig.service === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SMTP Host:
                      </label>
                      <input
                        type="text"
                        value={smtpConfig.host || ''}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                        placeholder="smtp.example.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SMTP Port:
                      </label>
                      <input
                        type="number"
                        value={smtpConfig.port || 465}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                        placeholder="465 or 587"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleVerifySmtp}
                    disabled={isVerifyingSmtp || !smtpConfig.user || !smtpConfig.pass}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSmtp ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingSmtp ? 'Testing Connection...' : 'Verify Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save SMTP Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Quick Direct Dispatch & Gmail Webmail */}
          {activeTab === 'quick-send' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Instant Dispatch & Zero-Setup Delivery Options</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If you don&apos;t want to enter an App Password, you can immediately send CSE notifications directly to yourself using Google Gmail Web or download a standard .eml file.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Option 1: Gmail Web Compose */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">Direct via Gmail Web</h5>
                          <span className="text-[10px] text-slate-500 font-medium">No App Password required</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Opens a pre-filled Gmail compose window addressed to <strong>{formConfig.recipientEmail}</strong> with the latest CSE notice and PDF link.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenInGmail}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Gmail Web</span>
                    </button>
                  </div>

                  {/* Option 2: Download .eml file */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">Download Notice Email (.eml)</h5>
                          <span className="text-[10px] text-slate-500 font-medium">Standard RFC822 file</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Downloads an email file that opens in Apple Mail, Outlook, Thunderbird, or Windows Mail with 1 click.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadEml}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .eml File</span>
                    </button>
                  </div>
                </div>

                {/* Option 3: Backend Dispatcher */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Trigger Backend Dispatcher Test</h5>
                    <p className="text-[11px] text-slate-500">Sends test message through the server transporter engine</p>
                  </div>
                  <button
                    onClick={handleTriggerTest}
                    disabled={isSendingTest}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSendingTest ? 'Sending...' : 'Send Test Alert'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Email HTML Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <strong>Recipient:</strong> <span className="text-emerald-700 font-mono">{formConfig.recipientEmail}</span>
                </div>
                <div>
                  <strong>Sender:</strong> <span>{smtpConfig.senderName || 'NU CSE Notice Tracker'} &lt;{smtpConfig.user || 'alerts@nu-cse-tracker.edu.bd'}&gt;</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                {previewHtml ? (
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-96 border-0 bg-white"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    Click &ldquo;Send Test Alert&rdquo; in settings to generate an interactive HTML preview.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Sent Logs & Delivery Status */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Recent Dispatched Email Notifications</span>
                <span className="text-emerald-700 font-semibold">{dispatchLogs.length} Total Dispatched</span>
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No email alerts dispatched yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {dispatchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {log.status === 'delivered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{log.subject}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] truncate">
                        {log.noticeTitle}
                      </p>

                      {log.errorDetails && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                          <strong>Delivery Note:</strong> {log.errorDetails}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>To: <strong className="text-slate-700">{log.recipient}</strong></span>
                        <div className="flex items-center gap-2">
                          {log.previewUrl && (
                            <a
                              href={log.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              <span>View in Mailbox</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {log.pdfUrl && (
                            <a 
                              href={log.pdfUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>PDF Attached</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
