import { Notice, AiNoticeAnalysis } from '../types';

export interface FetchResponse {
  success: boolean;
  source: string;
  targetUrl: string;
  total: number;
  cseCount: number;
  notices: Notice[];
  warning?: string;
  timestamp: string;
}

export async function fetchNoticesFromApi(customUrl?: string): Promise<FetchResponse> {
  const url = customUrl ? `/api/notices/fetch?url=${encodeURIComponent(customUrl)}` : '/api/notices/fetch';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch notices: ${res.statusText}`);
  }
  return await res.json();
}

export async function analyzeNoticeWithAi(notice: Partial<Notice>): Promise<AiNoticeAnalysis> {
  const res = await fetch('/api/ai/analyze-notice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: notice.title,
      date: notice.publishDate || notice.rawDateText,
      category: notice.category,
      semester: notice.semester,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to analyze notice with AI');
  }

  const data = await res.json();
  return data.analysis;
}

export async function triggerSimulatedNotice(semester: string, type: string): Promise<Notice> {
  const res = await fetch('/api/notices/simulate-new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ semester, type }),
  });

  if (!res.ok) {
    throw new Error('Failed to simulate notice');
  }

  const data = await res.json();
  return data.notice;
}

// Local Storage helpers for user preferences and custom saved folder items
const SAVED_FOLDER_KEY = 'nu_cse_saved_folder_notices';
const READ_NOTICES_KEY = 'nu_cse_read_notices';

// Email Alerting API methods
export async function fetchEmailConfig() {
  const res = await fetch('/api/alerts/email/config');
  if (!res.ok) throw new Error('Failed to load email configuration');
  return await res.json();
}

export async function saveEmailConfig(config: any) {
  const res = await fetch('/api/alerts/email/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save email configuration');
  return await res.json();
}

export async function sendTestEmail(recipientEmail: string, semester?: string) {
  const res = await fetch('/api/alerts/email/send-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, semester })
  });
  if (!res.ok) throw new Error('Failed to send test email');
  return await res.json();
}

export async function dispatchEmailAlert(notice: Notice, recipientEmail?: string) {
  const res = await fetch('/api/alerts/email/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notice, recipientEmail })
  });
  if (!res.ok) throw new Error('Failed to dispatch email alert');
  return await res.json();
}

export async function verifySmtpConfig(smtp: any) {
  const res = await fetch('/api/alerts/email/verify-smtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smtp })
  });
  return await res.json();
}

const CUSTOM_RULES_KEY = 'nu_cse_custom_rules';
const MONITOR_LOGS_KEY = 'nu_cse_monitor_logs';

export function getSavedFolderIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_FOLDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveInFolder(noticeId: string): boolean {
  const ids = getSavedFolderIds();
  const index = ids.indexOf(noticeId);
  let isSaved = false;
  if (index > -1) {
    ids.splice(index, 1);
    isSaved = false;
  } else {
    ids.push(noticeId);
    isSaved = true;
  }
  localStorage.setItem(SAVED_FOLDER_KEY, JSON.stringify(ids));
  return isSaved;
}

export function getReadNoticeIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNoticeAsRead(noticeId: string) {
  const ids = getReadNoticeIds();
  if (!ids.includes(noticeId)) {
    ids.push(noticeId);
    localStorage.setItem(READ_NOTICES_KEY, JSON.stringify(ids));
  }
}
