export type NoticeCategory = 
  | 'Routine'
  | 'Form Fill-up'
  | 'Result'
  | 'Practical & Viva'
  | 'Admit Card'
  | 'Center List'
  | 'General Examination'
  | 'Re-scrutiny';

export type SemesterTag = 
  | '1st Semester'
  | '2nd Semester'
  | '3rd Semester'
  | '4th Semester'
  | '5th Semester'
  | '6th Semester'
  | '7th Semester'
  | '8th Semester'
  | 'Year 1'
  | 'Year 2'
  | 'Year 3'
  | 'Year 4'
  | 'General';

export interface Notice {
  id: string;
  slNo?: string | number;
  title: string;
  publishDate: string; // e.g. "2025-02-28" or formatted
  rawDateText?: string;
  fileUrl: string;
  sourceUrl: string;
  isCse: boolean;
  cseConfidence: number; // 0 to 100
  matchedKeywords: string[];
  category: NoticeCategory;
  semester?: SemesterTag;
  academicYear?: string;
  isNew?: boolean;
  savedInFolder?: boolean;
  read?: boolean;
  important?: boolean;
  memoNo?: string;
  summary?: string;
  extractedDeadlines?: string[];
}

export interface MonitorLog {
  id: string;
  timestamp: string;
  type: 'check' | 'alert' | 'error' | 'sync';
  message: string;
  newCseCount?: number;
  totalNotices?: number;
}

export interface FilterOptions {
  searchQuery: string;
  onlyCse: boolean;
  category: string;
  semester: string;
  folderCategory: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
  sortBy: 'date_desc' | 'date_asc' | 'title';
}

export interface CseRule {
  id: string;
  keyword: string;
  enabled: boolean;
  isRegex?: boolean;
  weight: number;
}

export interface AiNoticeAnalysis {
  summary: string;
  targetAudience: string;
  keyDates: string[];
  actionRequired: string;
  urgencyLevel: 'High' | 'Medium' | 'Low';
  faq: { question: string; answer: string }[];
}

export interface SmtpConfig {
  service?: 'gmail' | 'outlook' | 'yahoo' | 'custom' | 'ethereal';
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  senderName?: string;
  isConfigured?: boolean;
}

export interface EmailAlertConfig {
  enabled: boolean;
  recipientEmail: string;
  notifyOnAllCse: boolean;
  notifyOnRoutine: boolean;
  notifyOnFormFillup: boolean;
  notifyOnResult: boolean;
  notifyOnLabViva: boolean;
  selectedSemester: string; // 'all' or '1st Semester' ...
  includePdfLink: boolean;
  includeAiSummary: boolean;
  frequency: 'instant' | '1_day' | '5_day' | '7_day';
  lastDispatchedAt?: string;
  smtp?: SmtpConfig;
}

export interface EmailDispatchLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  noticeTitle: string;
  category: string;
  status: 'delivered' | 'simulated' | 'queued' | 'failed';
  method?: 'smtp' | 'ethereal' | 'direct_preview' | 'simulation';
  previewUrl?: string;
  errorDetails?: string;
  messageId?: string;
  pdfUrl?: string;
  previewHtml?: string;
  memoNo?: string;
}

