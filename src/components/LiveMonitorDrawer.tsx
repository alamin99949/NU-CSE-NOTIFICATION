import React, { useState } from 'react';
import { 
  Radio, 
  Clock, 
  Zap, 
  Volume2, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Trash2, 
  Activity
} from 'lucide-react';
import { MonitorLog } from '../types';
import { playAlertSound } from '../utils/sound';

interface LiveMonitorProps {
  isPolling: boolean;
  onTogglePolling: () => void;
  pollingIntervalSeconds: number;
  onChangePollingInterval: (sec: number) => void;
  logs: MonitorLog[];
  onClearLogs: () => void;
  onSimulateNotice: (semester: string, type: string) => void;
  lastChecked: Date | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  browserNotificationsEnabled: boolean;
  onRequestBrowserNotification: () => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  isPolling,
  onTogglePolling,
  pollingIntervalSeconds,
  onChangePollingInterval,
  logs,
  onClearLogs,
  onSimulateNotice,
  soundEnabled,
  onToggleSound,
  browserNotificationsEnabled,
  onRequestBrowserNotification,
}) => {
  const [testSemester, setTestSemester] = useState<string>('8th Semester');
  const [testType, setTestType] = useState<string>('Routine');

  return (
    <div className="space-y-6">
      {/* Live Monitor Status Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border shadow-xs ${
              isPolling 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <Radio className={`w-7 h-7 ${isPolling ? 'animate-pulse text-emerald-600' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPolling ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <h2 className="text-xl font-bold text-slate-900">
                  {isPolling ? 'Real-Time Alert Monitor: ACTIVE' : 'Real-Time Alert Monitor: PAUSED'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuously scrapes National University notice board, parses HTML for CSE keywords, and dispatches instant alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePolling}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                isPolling 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPolling ? 'Pause Auto-Check' : 'Start Auto-Check'}</span>
            </button>
          </div>
        </div>

        {/* Polling Controls Grid */}
        <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
            <label className="text-slate-700 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Polling Frequency
            </label>
            <select
              value={pollingIntervalSeconds}
              onChange={(e) => onChangePollingInterval(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-2 font-semibold focus:outline-none focus:border-emerald-600 shadow-xs"
            >
              <option value={15}>Every 15 Seconds (Rapid Check)</option>
              <option value={30}>Every 30 Seconds (Default Real-Time)</option>
              <option value={60}>Every 1 Minute</option>
              <option value={300}>Every 5 Minutes</option>
              <option value={1800}>Every 30 Minutes</option>
              <option value={3600}>Every 1 Hour</option>
              <option value={86400}>Every 1 Day (Daily Check)</option>
              <option value={432000}>Every 5 Days</option>
              <option value={604800}>Every 7 Days (Weekly Check)</option>
            </select>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
            <label className="text-slate-700 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              Sound Chime
            </label>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onToggleSound}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                  soundEnabled 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
              <button
                onClick={() => playAlertSound('urgent')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold shadow-xs"
              >
                Test Chime 🔔
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
            <label className="text-slate-700 font-bold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              Web Desktop Alerts
            </label>
            <div className="pt-1">
              <button
                onClick={onRequestBrowserNotification}
                className={`w-full py-1.5 px-3 rounded-lg font-bold border text-center transition-colors shadow-xs ${
                  browserNotificationsEnabled 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {browserNotificationsEnabled ? '✓ Notifications Allowed' : 'Enable Web Notification API'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator: Trigger Live Alert */}
      <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Simulate Fresh CSE Notice Publication
            </h3>
          </div>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
            Real-time Alert Test
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Trigger a simulated live examination notice for your selected CSE semester to verify audio chimes, desktop notifications, unread badges, email alerts, and auto-sorting into the CSE Department Folder.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">Target Semester:</label>
            <select
              value={testSemester}
              onChange={(e) => setTestSemester(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 shadow-xs"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="3rd Semester">3rd Semester</option>
              <option value="4th Semester">4th Semester</option>
              <option value="5th Semester">5th Semester</option>
              <option value="6th Semester">6th Semester</option>
              <option value="7th Semester">7th Semester</option>
              <option value="8th Semester">8th Semester</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">Notice Type:</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 shadow-xs"
            >
              <option value="Routine">Exam Routine</option>
              <option value="Form Fill-up">Form Fill-up Notice</option>
              <option value="Result">Result Gazette</option>
              <option value="Practical & Viva">Practical & Viva</option>
              <option value="Admit Card">Admit Card Distribution</option>
            </select>
          </div>

          <button
            onClick={() => onSimulateNotice(testSemester, testType)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ml-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Emit Real-time Alert Now</span>
          </button>
        </div>
      </div>

      {/* Monitor Activity Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Monitoring & Polling Event History
            </h3>
          </div>

          <button
            onClick={onClearLogs}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No events logged yet. Active monitoring updates will appear here in real-time.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  {log.type === 'alert' ? (
                    <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                  ) : log.type === 'error' ? (
                    <span className="p-1 rounded bg-red-50 text-red-700 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <div>
                    <p className="font-semibold text-slate-800">{log.message}</p>
                    {log.newCseCount !== undefined && (
                      <span className="text-[11px] text-emerald-700 font-mono font-medium">
                        CSE Notices in folder: {log.newCseCount}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
