import React from 'react';
import { 
  Bell, 
  BellRing, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  FolderLock, 
  FolderCheck,
  Radio,
  ExternalLink,
  Sparkles,
  Zap,
  Sliders,
  Mail
} from 'lucide-react';
import { EmailAlertConfig } from '../types';

interface HeaderProps {
  currentUrl: string;
  onUrlChange: (newUrl: string) => void;
  isPolling: boolean;
  onTogglePolling: () => void;
  pollingIntervalSeconds?: number;
  onChangePollingInterval?: (sec: number) => void;
  lastChecked: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  browserNotificationsEnabled: boolean;
  onRequestBrowserNotification: () => void;
  onSimulateAlert: () => void;
  totalNoticesCount: number;
  cseNoticesCount: number;
  unreadCount: number;
  onOpenRules: () => void;
  emailConfig: EmailAlertConfig;
  onOpenEmailAlerts: () => void;
  activeTab: 'cse-folder' | 'all-notices' | 'live-monitor' | 'ai-assistant';
  onTabChange: (tab: 'cse-folder' | 'all-notices' | 'live-monitor' | 'ai-assistant') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUrl,
  isPolling,
  onTogglePolling,
  pollingIntervalSeconds = 30,
  onChangePollingInterval,
  lastChecked,
  onRefresh,
  isLoading,
  soundEnabled,
  onToggleSound,
  browserNotificationsEnabled,
  onRequestBrowserNotification,
  onSimulateAlert,
  totalNoticesCount,
  cseNoticesCount,
  unreadCount,
  onOpenRules,
  emailConfig,
  onOpenEmailAlerts,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo and Department Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black shadow-xs">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  NU CSE Notice Tracker
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CSE Dept
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Target:</span>
                <a 
                  href={currentUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 max-w-[240px] sm:max-w-sm truncate font-medium"
                  title={currentUrl}
                >
                  {currentUrl}
                  <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
                </a>
              </p>
            </div>
          </div>

          {/* Quick Real-Time Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Polling Toggle & Cadence */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-xs">
              <button
                id="toggle-live-polling-btn"
                onClick={onTogglePolling}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPolling 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isPolling ? `Auto-monitoring active` : "Auto-monitoring paused"}
              >
                <Radio className={`w-3.5 h-3.5 ${isPolling ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
                <span>{isPolling ? 'Monitor ON' : 'Paused'}</span>
              </button>

              {onChangePollingInterval && (
                <select
                  value={pollingIntervalSeconds}
                  onChange={(e) => onChangePollingInterval(Number(e.target.value))}
                  className="bg-transparent border-l border-slate-200 text-[11px] font-semibold text-slate-700 pl-1.5 pr-2 py-1 focus:outline-none cursor-pointer"
                  title="Change Polling Frequency"
                >
                  <option value={15} className="bg-white text-slate-800">15s</option>
                  <option value={30} className="bg-white text-slate-800">30s</option>
                  <option value={60} className="bg-white text-slate-800">1m</option>
                  <option value={300} className="bg-white text-slate-800">5m</option>
                  <option value={86400} className="bg-white text-slate-800">1 Day</option>
                  <option value={432000} className="bg-white text-slate-800">5 Days</option>
                  <option value={604800} className="bg-white text-slate-800">7 Days</option>
                </select>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={onToggleSound}
              className={`p-2 rounded-lg border text-xs font-medium transition-all shadow-xs ${
                soundEnabled 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
              title={soundEnabled ? 'Alert Chime: Enabled' : 'Alert Chime: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Web Browser Notifications Toggle */}
            <button
              id="browser-notification-btn"
              onClick={onRequestBrowserNotification}
              className={`p-2 rounded-lg border text-xs font-medium transition-all shadow-xs ${
                browserNotificationsEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
              title={browserNotificationsEnabled ? 'Desktop Web Notifications: Allowed' : 'Enable Web Desktop Notifications'}
            >
              {browserNotificationsEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>

            {/* Email Notification Dispatcher Button */}
            <button
              id="email-alerts-btn"
              onClick={onOpenEmailAlerts}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                emailConfig.enabled 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title={`Email Notifications: ${emailConfig.enabled ? `Active for ${emailConfig.recipientEmail}` : 'Disabled'}`}
            >
              <Mail className={`w-3.5 h-3.5 ${emailConfig.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Email Alerts</span>
              {emailConfig.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            {/* Keyword Rule Config */}
            <button
              id="keyword-rules-btn"
              onClick={onOpenRules}
              className="p-2 rounded-lg border bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs shadow-xs"
              title="Configure CSE Department Keywords & Filter Rules"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Simulate Fresh CSE Notice for Instant Alert Check */}
            <button
              id="test-alert-btn"
              onClick={onSimulateAlert}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Simulate a new incoming CSE routine notice to test sound, banner, and folder alert"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Alert</span>
            </button>

            {/* Instant Refresh Button */}
            <button
              id="refresh-notices-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Parsing...' : 'Fetch Now'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicator & Last Sync */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <strong className="text-slate-800 font-semibold">{cseNoticesCount}</strong> CSE Notices Filtered
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Total Scraped: <strong className="text-slate-700">{totalNoticesCount}</strong>
            </span>
            {unreadCount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {unreadCount} Unread Alert{unreadCount > 1 ? 's' : ''}
                </span>
              </>
            )}
            {emailConfig.enabled && (
              <>
                <span className="text-slate-300 hidden md:inline">|</span>
                <button
                  onClick={onOpenEmailAlerts}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                  title="Click to manage email alert settings"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email Alerts: <strong className="font-mono text-slate-800">{emailConfig.recipientEmail}</strong></span>
                </button>
              </>
            )}
          </div>

          <div className="text-slate-500 flex items-center gap-2">
            <span>
              Last Checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex overflow-x-auto space-x-1 py-1 scrollbar-none">
          
          <button
            id="tab-cse-folder-btn"
            onClick={() => onTabChange('cse-folder')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'cse-folder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderCheck className="w-4 h-4 text-emerald-100" />
            <span>📁 CSE Department Folder</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'cse-folder' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {cseNoticesCount}
            </span>
          </button>

          <button
            id="tab-all-notices-btn"
            onClick={() => onTabChange('all-notices')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'all-notices'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderLock className="w-4 h-4 text-slate-400" />
            <span>All NU Examination Notices</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'all-notices' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalNoticesCount}
            </span>
          </button>

          <button
            id="tab-live-monitor-btn"
            onClick={() => onTabChange('live-monitor')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'live-monitor'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>Real-time Alert Monitor & Logs</span>
          </button>

          <button
            id="tab-ai-assistant-btn"
            onClick={() => onTabChange('ai-assistant')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'ai-assistant'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Notice Assistant</span>
          </button>

        </div>
      </div>
    </header>
  );
};
