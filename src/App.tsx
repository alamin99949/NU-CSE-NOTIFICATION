import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { CseFolderView } from './components/CseFolderView';
import { AllNoticesView } from './components/AllNoticesView';
import { LiveMonitor } from './components/LiveMonitorDrawer';
import { AiAssistantView } from './components/AiAssistantView';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { KeywordRulesModal } from './components/KeywordRulesModal';
import { EmailAlertModal } from './components/EmailAlertModal';
import { AlertToast } from './components/AlertToast';
import { Notice, MonitorLog, CseRule, EmailAlertConfig, EmailDispatchLog } from './types';
import { 
  fetchNoticesFromApi, 
  triggerSimulatedNotice, 
  getSavedFolderIds, 
  toggleSaveInFolder,
  fetchEmailConfig,
  saveEmailConfig,
  sendTestEmail,
  dispatchEmailAlert
} from './services/api';
import { playAlertSound } from './utils/sound';
import { 
  FolderCheck, 
  Radio, 
  BellRing, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Globe,
  RefreshCw,
  Sliders,
  ExternalLink,
  Mail
} from 'lucide-react';

const DEFAULT_CSE_RULES: CseRule[] = [
  { id: '1', keyword: 'CSE', enabled: true, weight: 100 },
  { id: '2', keyword: 'সিএসই', enabled: true, weight: 100 },
  { id: '3', keyword: 'সি.এস.ই', enabled: true, weight: 100 },
  { id: '4', keyword: 'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং', enabled: true, weight: 100 },
  { id: '5', keyword: 'কম্পিউটার সাইন্স', enabled: true, weight: 100 },
  { id: '6', keyword: 'বি.এসসি ইন সিএসই', enabled: true, weight: 100 },
  { id: '7', keyword: 'Computer Science & Engineering', enabled: true, weight: 100 },
  { id: '8', keyword: 'Computer Science and Engineering', enabled: true, weight: 100 },
  { id: '9', keyword: 'B.Sc in CSE', enabled: true, weight: 100 },
  { id: '10', keyword: 'B.Sc. in CSE', enabled: true, weight: 100 },
  { id: '11', keyword: 'BSc in CSE', enabled: true, weight: 95 },
  { id: '12', keyword: 'B.Sc (Hons) in CSE', enabled: true, weight: 95 },
  { id: '8', keyword: 'ECE', enabled: true, weight: 80 },
  { id: '9', keyword: 'Information Technology', enabled: true, weight: 75 },
  { id: '10', keyword: 'B.Sc Professional', enabled: true, weight: 70 },
];

export default function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.nu.ac.bd/examination-notice.php');
  const [activeTab, setActiveTab] = useState<'cse-folder' | 'all-notices' | 'live-monitor' | 'ai-assistant'>('cse-folder');
  
  // Notices data
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [savedNoticeIds, setSavedNoticeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorWarning, setErrorWarning] = useState<string | null>(null);
  
  // Real-time monitor state
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState<number>(30);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(false);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  
  // Email Alert state
  const [emailConfig, setEmailConfig] = useState<EmailAlertConfig>({
    enabled: true,
    recipientEmail: 'alaminb949@gmail.com',
    notifyOnAllCse: true,
    notifyOnRoutine: true,
    notifyOnFormFillup: true,
    notifyOnResult: true,
    notifyOnLabViva: true,
    selectedSemester: 'all',
    includePdfLink: true,
    includeAiSummary: true,
    frequency: 'instant'
  });
  const [dispatchLogs, setDispatchLogs] = useState<EmailDispatchLog[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Modals & Popups
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [activeAlertToast, setActiveAlertToast] = useState<Notice | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [rules, setRules] = useState<CseRule[]>(DEFAULT_CSE_RULES);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Initialize saved notices, email config, and notification permission on mount
  useEffect(() => {
    setSavedNoticeIds(getSavedFolderIds());

    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }

    // Load server email configuration
    fetchEmailConfig()
      .then(res => {
        if (res.config) setEmailConfig(res.config);
        if (res.logs) setDispatchLogs(res.logs);
      })
      .catch(e => console.warn('Could not load email configuration:', e));
  }, []);

  // Filter CSE notices based on active keyword rules
  const cseNotices = useMemo(() => {
    const activeKeywords = rules.filter(r => r.enabled).map(r => r.keyword.toLowerCase());
    
    return allNotices.filter((notice) => {
      if (notice.isCse) return true;
      const titleLower = notice.title.toLowerCase();
      return activeKeywords.some(kw => titleLower.includes(kw));
    });
  }, [allNotices, rules]);

  // Request browser Web Notification permissions
  const handleRequestBrowserNotification = async () => {
    if (!('Notification' in window)) {
      alert('Desktop notifications are not supported in your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationsEnabled(true);
        new Notification('NU CSE Alert System', {
          body: 'Real-time alerts enabled! You will be notified instantly when a new CSE notice is published.',
          icon: '/favicon.ico',
        });
      } else {
        setBrowserNotificationsEnabled(false);
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  // Dispatch real-time alert notifications (sound, web banner, and instant email)
  const dispatchAlert = useCallback((notice: Notice) => {
    // 1. Play Web Audio chime
    if (soundEnabled) {
      playAlertSound('urgent');
    }

    // 2. Trigger browser web notification if allowed
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 NU CSE Notice: ${notice.category}`, {
          body: notice.title,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser notification trigger failed:', e);
      }
    }

    // 3. Show floating interactive toast
    setActiveAlertToast(notice);

    // 4. Increment unread badge
    setUnreadCount(prev => prev + 1);

    // 5. Automatically dispatch email notification if email alert is enabled
    if (emailConfig.enabled && emailConfig.recipientEmail) {
      // Check semester filter
      const semesterMatches = emailConfig.selectedSemester === 'all' || 
        notice.semester === emailConfig.selectedSemester;

      // Check category filter
      let categoryMatches = emailConfig.notifyOnAllCse;
      if (notice.category === 'Routine' && emailConfig.notifyOnRoutine) categoryMatches = true;
      if (notice.category === 'Form Fill-up' && emailConfig.notifyOnFormFillup) categoryMatches = true;
      if (notice.category === 'Result' && emailConfig.notifyOnResult) categoryMatches = true;
      if (notice.category === 'Practical & Viva' && emailConfig.notifyOnLabViva) categoryMatches = true;

      if (semesterMatches && categoryMatches) {
        dispatchEmailAlert(notice, emailConfig.recipientEmail)
          .then((res) => {
            if (res.log) {
              setDispatchLogs(prev => [res.log, ...prev]);
            }
            const emailLog: MonitorLog = {
              id: `em-log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'alert',
              message: `📧 Email Alert dispatched to ${emailConfig.recipientEmail} for "${notice.title.slice(0, 45)}..."`,
              newCseCount: 1,
            };
            setLogs(prev => [emailLog, ...prev.slice(0, 49)]);
          })
          .catch(e => console.warn('Email dispatch failed:', e));
      }
    }

    // 6. Append to monitor event log
    const newLog: MonitorLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'alert',
      message: `[ALERT] New CSE notification detected: "${notice.title.slice(0, 50)}..."`,
      newCseCount: cseNotices.length + 1,
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, [soundEnabled, browserNotificationsEnabled, cseNotices.length, emailConfig]);

  // Load notices from NU Examination Notice page
  const loadNotices = useCallback(async (isInitial = false) => {
    setIsLoading(true);
    try {
      const data = await fetchNoticesFromApi(currentUrl);
      
      setAllNotices(prev => {
        // Detect if any fresh notice arrived
        if (!isInitial && prev.length > 0) {
          const prevIds = new Set(prev.map(p => p.id));
          const newItems = data.notices.filter(n => !prevIds.has(n.id) && n.isCse);
          if (newItems.length > 0) {
            dispatchAlert(newItems[0]);
          }
        }
        return data.notices;
      });

      setLastChecked(new Date());
      setErrorWarning(null);

      // Append sync log
      const syncLog: MonitorLog = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'sync',
        message: `Synced ${data.total} NU examination notices (${data.cseCount} CSE department notices)`,
        totalNotices: data.total,
        newCseCount: data.cseCount,
      };
      setLogs(prev => [syncLog, ...prev.slice(0, 49)]);

    } catch (err: any) {
      // In case of complete client-side network disconnect
      setErrorWarning(`Network sync notice: Using offline cached National University examination notices.`);
      
      const errLog: MonitorLog = {
        id: `err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        message: `Connection re-sync active: ${err?.message || 'Host standby'}`,
      };
      setLogs(prev => [errLog, ...prev.slice(0, 49)]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUrl, dispatchAlert]);

  // Initial load
  useEffect(() => {
    loadNotices(true);
  }, []);

  // Polling interval timer
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      loadNotices(false);
    }, pollingIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [isPolling, pollingIntervalSeconds, loadNotices]);

  // Toggle bookmark in CSE Folder
  const handleToggleSave = (noticeId: string) => {
    toggleSaveInFolder(noticeId);
    setSavedNoticeIds(getSavedFolderIds());
  };

  // Simulate a new CSE examination notice (e.g. for testing alerts)
  const handleSimulateAlert = async (semester = '8th Semester', type = 'Routine') => {
    try {
      const simulatedNotice = await triggerSimulatedNotice(semester, type);
      setAllNotices(prev => [simulatedNotice, ...prev]);
      dispatchAlert(simulatedNotice);
    } catch (e) {
      console.warn('Simulation failed:', e);
    }
  };

  // Keyword rules handlers
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleAddRule = (keyword: string) => {
    const newRule: CseRule = {
      id: `rule-${Date.now()}`,
      keyword,
      enabled: true,
      weight: 90,
    };
    setRules(prev => [...prev, newRule]);
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleResetRules = () => {
    setRules(DEFAULT_CSE_RULES);
  };

  const handleSaveEmailConfig = async (newConfig: EmailAlertConfig) => {
    const res = await saveEmailConfig(newConfig);
    if (res.config) setEmailConfig(res.config);
  };

  const handleSendTestEmail = async (email: string, semester?: string) => {
    const res = await sendTestEmail(email, semester);
    if (res.log) {
      setDispatchLogs(prev => [res.log, ...prev]);
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Main Navigation Bar */}
      <Header
        currentUrl={currentUrl}
        onUrlChange={setCurrentUrl}
        isPolling={isPolling}
        onTogglePolling={() => setIsPolling(prev => !prev)}
        pollingIntervalSeconds={pollingIntervalSeconds}
        onChangePollingInterval={setPollingIntervalSeconds}
        lastChecked={lastChecked}
        onRefresh={() => loadNotices(false)}
        isLoading={isLoading}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        browserNotificationsEnabled={browserNotificationsEnabled}
        onRequestBrowserNotification={handleRequestBrowserNotification}
        onSimulateAlert={() => handleSimulateAlert('8th Semester', 'Routine')}
        totalNoticesCount={allNotices.length}
        cseNoticesCount={cseNotices.length}
        unreadCount={unreadCount}
        onOpenRules={() => setIsRulesModalOpen(true)}
        emailConfig={emailConfig}
        onOpenEmailAlerts={() => setIsEmailModalOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'cse-folder') setUnreadCount(0);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Notice Target Information Strip */}
        {errorWarning && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{errorWarning}</span>
            </div>
            <button
              onClick={() => loadNotices(false)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab 1: CSE Department Folder (Primary Requested View) */}
        {activeTab === 'cse-folder' && (
          <CseFolderView
            notices={cseNotices}
            savedNoticeIds={savedNoticeIds}
            onToggleSave={handleToggleSave}
            onSelectNotice={(n) => setSelectedNotice(n)}
            onOpenAiSummary={(n) => setSelectedNotice(n)}
            onOpenEmailAlerts={() => setIsEmailModalOpen(true)}
          />
        )}

        {/* Tab 2: All Loaded NU Examination Notices */}
        {activeTab === 'all-notices' && (
          <AllNoticesView
            notices={allNotices}
            onSelectNotice={(n) => setSelectedNotice(n)}
            onGoToCseFolder={() => setActiveTab('cse-folder')}
            onToggleSave={handleToggleSave}
            savedNoticeIds={savedNoticeIds}
          />
        )}

        {/* Tab 3: Real-Time Polling Monitor & Logs */}
        {activeTab === 'live-monitor' && (
          <LiveMonitor
            isPolling={isPolling}
            onTogglePolling={() => setIsPolling(prev => !prev)}
            pollingIntervalSeconds={pollingIntervalSeconds}
            onChangePollingInterval={setPollingIntervalSeconds}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSimulateNotice={handleSimulateAlert}
            lastChecked={lastChecked}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            browserNotificationsEnabled={browserNotificationsEnabled}
            onRequestBrowserNotification={handleRequestBrowserNotification}
          />
        )}

        {/* Tab 4: AI Notice Assistant */}
        {activeTab === 'ai-assistant' && (
          <AiAssistantView
            cseNotices={cseNotices}
            onSelectNotice={(n) => setSelectedNotice(n)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">NU CSE Notice Tracker & Alert System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Target Link: <a href={currentUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-medium hover:underline">nu.ac.bd/examination-notice.php</a></span>
            <span>•</span>
            <span>Dept: Computer Science & Engineering</span>
          </div>
        </div>
      </footer>

      {/* Notice Detail & AI Breakdown Modal */}
      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        isSaved={selectedNotice ? savedNoticeIds.includes(selectedNotice.id) : false}
        onToggleSave={handleToggleSave}
      />

      {/* Keyword Rules Config Modal */}
      <KeywordRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        onToggleRule={handleToggleRule}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
        onResetDefaults={handleResetRules}
      />

      {/* Real-time Alert Toast Notification */}
      <AlertToast
        notice={activeAlertToast}
        onClose={() => setActiveAlertToast(null)}
        onOpenNotice={(n) => setSelectedNotice(n)}
        onGoToFolder={() => setActiveTab('cse-folder')}
      />

      {/* Email Alert Configuration and History Modal */}
      <EmailAlertModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        emailConfig={emailConfig}
        onSaveConfig={handleSaveEmailConfig}
        dispatchLogs={dispatchLogs}
        onSendTestEmail={handleSendTestEmail}
      />

    </div>
  );
}
