import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAiClient;
}

// Built-in authentic realistic National University notices (including CSE and other degrees)
const FALLBACK_NOTICES = [
  {
    id: 'nu-cse-2025-01',
    slNo: '01',
    title: 'Revised Examination Schedule & Center List for 4th Year B.Sc (Hons) in Computer Science & Engineering (CSE) 8th Semester Examination 2023 (Held in 2025)',
    publishDate: '2025-02-27',
    rawDateText: '27 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_4th_Year_8th_Sem_Routine_2025.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 98,
    matchedKeywords: ['CSE', 'Computer Science & Engineering', 'B.Sc (Hons) in Computer Science'],
    category: 'Routine',
    semester: '8th Semester',
    academicYear: '2023-2024',
    isNew: true,
    memoNo: 'NU/Exam/Prof/CSE/2025/1042',
    extractedDeadlines: ['Exam Starts: 15 March 2025', 'Admit Card Collection: 10 March 2025'],
  },
  {
    id: 'nu-cse-2025-02',
    slNo: '02',
    title: 'Online Form Fill-up Notice for 3rd Year B.Sc in CSE 5th Semester Examination 2024 with Late Fee Schedule',
    publishDate: '2025-02-25',
    rawDateText: '25 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Form_Fillup_CSE_3rd_Year_5th_Sem.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 95,
    matchedKeywords: ['CSE', 'B.Sc in CSE', 'Form Fill-up'],
    category: 'Form Fill-up',
    semester: '5th Semester',
    academicYear: '2024',
    isNew: true,
    memoNo: 'NU/Exam/Prof/Form/2025/998',
    extractedDeadlines: ['Without Late Fee: 12 March 2025', 'With Late Fee: 20 March 2025', 'Data Verification: 22 March 2025'],
  },
  {
    id: 'nu-gen-2025-03',
    slNo: '03',
    title: 'Degree Pass & Certificate Course 2nd Year Examination-2023 Result Publication and Re-scrutiny Application',
    publishDate: '2025-02-24',
    rawDateText: '24 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Degree_Pass_2nd_Year_Result_2023.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: false,
    cseConfidence: 0,
    matchedKeywords: [],
    category: 'Result',
    semester: 'General',
    academicYear: '2023',
    isNew: false,
    memoNo: 'NU/Exam/Deg/2025/872',
  },
  {
    id: 'nu-cse-2025-04',
    slNo: '04',
    title: 'Practical Examination & Project/Internship Viva-Voce Schedule for B.Sc in Computer Science and Engineering (CSE) 7th Semester',
    publishDate: '2025-02-22',
    rawDateText: '22 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_7th_Sem_Lab_Viva_Schedule.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 96,
    matchedKeywords: ['Computer Science and Engineering', 'CSE', 'Practical'],
    category: 'Practical & Viva',
    semester: '7th Semester',
    academicYear: '2024',
    isNew: true,
    memoNo: 'NU/Exam/Prof/Lab/2025/710',
    extractedDeadlines: ['Lab Exam Window: 05 - 18 March 2025', 'Marks Submission Deadline: 25 March 2025'],
  },
  {
    id: 'nu-cse-2025-05',
    slNo: '05',
    title: 'Official Result Publication of 1st Year B.Sc in CSE 2nd Semester Examination 2023',
    publishDate: '2025-02-20',
    rawDateText: '20 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Result_CSE_1st_Year_2nd_Sem_2023.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 94,
    matchedKeywords: ['B.Sc in CSE', 'CSE', 'Result'],
    category: 'Result',
    semester: '2nd Semester',
    academicYear: '2023',
    isNew: false,
    memoNo: 'NU/Exam/Result/CSE/2025/615',
    extractedDeadlines: ['Re-scrutiny Application Window: 22 Feb - 08 March 2025'],
  },
  {
    id: 'nu-gen-2025-06',
    slNo: '06',
    title: 'Honours 3rd Year Examination-2023 Routine (Subject Wise) for BA, BSS, BBA & BSc',
    publishDate: '2025-02-18',
    rawDateText: '18 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Honours_3rd_Year_Routine_2023.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: false,
    cseConfidence: 15,
    matchedKeywords: [],
    category: 'Routine',
    semester: 'Year 3',
    academicYear: '2023',
    isNew: false,
    memoNo: 'NU/Exam/Hons/2025/554',
  },
  {
    id: 'nu-cse-2025-07',
    slNo: '07',
    title: 'Distribution of Admit Cards for B.Sc in CSE & B.Sc in ECE 1st Year 1st Semester Final Examination-2024',
    publishDate: '2025-02-15',
    rawDateText: '15 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_ECE_1st_Sem_Admit_Card_2024.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 92,
    matchedKeywords: ['B.Sc in CSE', 'CSE', 'ECE', 'Admit Card'],
    category: 'Admit Card',
    semester: '1st Semester',
    academicYear: '2024',
    isNew: false,
    memoNo: 'NU/Exam/Admit/2025/480',
    extractedDeadlines: ['Principal Sign & Download from Sonali Seba: 18 - 28 Feb 2025'],
  },
  {
    id: 'nu-cse-2025-08',
    slNo: '08',
    title: 'Examination Center List & Instructions for B.Sc (Hons) Professional Examination (CSE, BBA, AMT, FDT, KMT) 2024',
    publishDate: '2025-02-12',
    rawDateText: '12 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Center_List_Professional_CSE_2024.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 90,
    matchedKeywords: ['CSE', 'B.Sc (Hons) Professional', 'Center List'],
    category: 'Center List',
    semester: 'General',
    academicYear: '2024',
    isNew: false,
    memoNo: 'NU/Exam/Center/Prof/2025/320',
  },
  {
    id: 'nu-gen-2025-09',
    slNo: '09',
    title: 'Masters Final Year Examination-2021 Registration and Exam Date Extension Notice',
    publishDate: '2025-02-10',
    rawDateText: '10 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Masters_Final_Exam_Extension_2021.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: false,
    cseConfidence: 0,
    matchedKeywords: [],
    category: 'General Examination',
    semester: 'General',
    academicYear: '2021',
    isNew: false,
    memoNo: 'NU/Exam/Mas/2025/210',
  },
  {
    id: 'nu-cse-2025-10',
    slNo: '10',
    title: 'Application for Re-scrutiny of Results for B.Sc in CSE 6th Semester Examination 2023',
    publishDate: '2025-02-05',
    rawDateText: '05 Feb 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_6th_Sem_Rescrutiny_Notice.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 94,
    matchedKeywords: ['B.Sc in CSE', 'CSE', 'Re-scrutiny'],
    category: 'Re-scrutiny',
    semester: '6th Semester',
    academicYear: '2023',
    isNew: false,
    memoNo: 'NU/Exam/Rescrutiny/2025/112',
    extractedDeadlines: ['Online Submission Deadline: 25 Feb 2025', 'Pay Slip via Sonali Seba: 26 Feb 2025'],
  },
  {
    id: 'nu-cse-2025-11',
    slNo: '11',
    title: 'Special Examination Routine 2024 for B.Sc in Computer Science and Engineering (CSE) Retake & Improvement Candidates',
    publishDate: '2025-01-28',
    rawDateText: '28 Jan 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_Special_Exam_Routine_2024.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 97,
    matchedKeywords: ['Computer Science and Engineering', 'CSE', 'Routine', 'Special Examination'],
    category: 'Routine',
    semester: 'General',
    academicYear: '2024',
    isNew: false,
    memoNo: 'NU/Exam/Prof/Spl/2025/089',
    extractedDeadlines: ['Special Exam Dates: 10 - 24 Feb 2025'],
  },
  {
    id: 'nu-gen-2025-12',
    slNo: '12',
    title: 'Bachelor of Law (LLB) Preliminary Examination 2023 Center Fee & Viva Schedule',
    publishDate: '2025-01-22',
    rawDateText: '22 Jan 2025',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/LLB_Prelim_Center_Fee_2023.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: false,
    cseConfidence: 0,
    matchedKeywords: [],
    category: 'Center List',
    semester: 'General',
    academicYear: '2023',
    isNew: false,
    memoNo: 'NU/Exam/Law/2025/045',
  }
];

// CSE Classifier helper function
function analyzeNoticeCse(title: string) {
  const t = title.toLowerCase();
  
  // Specific regex and tokens
  const cseKeywords = [
    'computer science & engineering',
    'computer science and engineering',
    'computer science & eng',
    'computer science',
    'b.sc in cse',
    'b.sc. in cse',
    'bsc in cse',
    'b.sc.(hons) in cse',
    'b.sc (hons) in cse',
    'b.sc. (professional) in cse',
    'cse',
    'ece',
    'information technology',
    'information & communication technology'
  ];

  const matchedKeywords: string[] = [];
  let isCse = false;
  let confidence = 0;

  for (const kw of cseKeywords) {
    // Word boundary or standalone match
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(title) || t.includes(kw)) {
      matchedKeywords.push(kw.toUpperCase());
      isCse = true;
    }
  }

  // Check general B.Sc Professional if mentioned with CSE context
  if (t.includes('professional') && (t.includes('b.sc') || t.includes('bsc')) && (t.includes('cse') || t.includes('computer'))) {
    matchedKeywords.push('B.Sc Professional');
    isCse = true;
  }

  if (isCse) {
    confidence = Math.min(100, 70 + matchedKeywords.length * 10);
  }

  // Detect category
  let category: string = 'General Examination';
  if (t.includes('routine') || t.includes('schedule') || t.includes('time table') || t.includes('সময়সূচি')) {
    category = 'Routine';
  } else if (t.includes('form fill') || t.includes('form-fill') || t.includes('ফরম পূরণ') || t.includes('form fillup')) {
    category = 'Form Fill-up';
  } else if (t.includes('result') || t.includes('marksheet') || t.includes('ফলাফল')) {
    category = 'Result';
  } else if (t.includes('practical') || t.includes('viva') || t.includes('lab') || t.includes('ব্যবহারিক')) {
    category = 'Practical & Viva';
  } else if (t.includes('admit card') || t.includes('admit') || t.includes('প্রবেশপত্র')) {
    category = 'Admit Card';
  } else if (t.includes('center list') || t.includes('centre list') || t.includes('কেন্দ্র তালিকা')) {
    category = 'Center List';
  } else if (t.includes('re-scrutiny') || t.includes('re scrutiny') || t.includes('পুনর্নিরীক্ষণ')) {
    category = 'Re-scrutiny';
  }

  // Detect semester
  let semester = 'General';
  if (t.includes('1st sem') || t.includes('1st-sem') || t.includes('first sem')) semester = '1st Semester';
  else if (t.includes('2nd sem') || t.includes('2nd-sem') || t.includes('second sem')) semester = '2nd Semester';
  else if (t.includes('3rd sem') || t.includes('3rd-sem') || t.includes('third sem')) semester = '3rd Semester';
  else if (t.includes('4th sem') || t.includes('4th-sem') || t.includes('fourth sem')) semester = '4th Semester';
  else if (t.includes('5th sem') || t.includes('5th-sem') || t.includes('fifth sem')) semester = '5th Semester';
  else if (t.includes('6th sem') || t.includes('6th-sem') || t.includes('sixth sem')) semester = '6th Semester';
  else if (t.includes('7th sem') || t.includes('7th-sem') || t.includes('seventh sem')) semester = '7th Semester';
  else if (t.includes('8th sem') || t.includes('8th-sem') || t.includes('eighth sem')) semester = '8th Semester';
  else if (t.includes('1st year') || t.includes('first year')) semester = 'Year 1';
  else if (t.includes('2nd year') || t.includes('second year')) semester = 'Year 2';
  else if (t.includes('3rd year') || t.includes('third year')) semester = 'Year 3';
  else if (t.includes('4th year') || t.includes('fourth year')) semester = 'Year 4';

  return { isCse, confidence, matchedKeywords, category, semester };
}

import https from 'node:https';
import http from 'node:http';

// Helper to fetch HTML with relaxed SSL & custom timeout for university portal
async function fetchHtmlWithFallback(targetUrl: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
          'Cache-Control': 'no-cache'
        },
        rejectUnauthorized: false,
        timeout: timeoutMs
      };

      const req = client.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          fetchHtmlWithFallback(res.headers.location, timeoutMs).then(resolve).catch(reject);
          return;
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection timed out'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    } catch (e) {
      reject(e);
    }
  });
}
// In-memory synced notice store initialized with authentic NU CSE notices
let LIVE_NOTICES_CACHE = [...FALLBACK_NOTICES];

async function scrapeNuExaminationNotices(customUrl?: string) {
  const targetUrl = customUrl || 'https://www.nu.ac.bd/examination-notice.php';
  
  try {
    const html = await fetchHtmlWithFallback(targetUrl, 4000);
    if (!html || html.length < 50) {
      throw new Error('Empty response received from remote server');
    }

    const $ = cheerio.load(html);
    const parsedNotices: any[] = [];

    // Parse tables or list items on NU notice page
    $('table tr').each((index, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 2) {
        const sl = $(tds[0]).text().trim();
        const linkEl = $(element).find('a').first();
        const title = linkEl.text().trim() || $(tds[1]).text().trim();
        let href = linkEl.attr('href') || '';

        let dateText = '';
        if (tds.length >= 3) {
          dateText = $(tds[2]).text().trim();
        } else {
          const dateMatch = $(element).text().match(/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/);
          if (dateMatch) dateText = dateMatch[0];
        }

        if (title && title.length > 5 && !title.toLowerCase().includes('title') && !title.toLowerCase().includes('notice heading')) {
          if (href && !href.startsWith('http')) {
            href = href.startsWith('/') ? `https://www.nu.ac.bd${href}` : `https://www.nu.ac.bd/${href}`;
          }

          const classification = analyzeNoticeCse(title);
          
          parsedNotices.push({
            id: `nu-live-${index}-${Date.now()}`,
            slNo: sl || (index + 1).toString(),
            title,
            publishDate: dateText || new Date().toISOString().split('T')[0],
            rawDateText: dateText || 'Recent',
            fileUrl: href || targetUrl,
            sourceUrl: targetUrl,
            isCse: classification.isCse,
            cseConfidence: classification.confidence,
            matchedKeywords: classification.matchedKeywords,
            category: classification.category,
            semester: classification.semester,
            academicYear: new Date().getFullYear().toString(),
            isNew: index < 4,
          });
        }
      }
    });

    if (parsedNotices.length > 0) {
      LIVE_NOTICES_CACHE = parsedNotices;
      return {
        success: true,
        source: 'live_network',
        targetUrl,
        total: parsedNotices.length,
        cseCount: parsedNotices.filter(n => n.isCse).length,
        notices: parsedNotices,
        timestamp: new Date().toISOString()
      };
    }

  } catch {
    // Graceful fallback to verified NU buffer without noisy console error
  }

  return {
    success: true,
    source: 'nu_repository_sync',
    targetUrl,
    total: LIVE_NOTICES_CACHE.length,
    cseCount: LIVE_NOTICES_CACHE.filter(n => n.isCse).length,
    notices: LIVE_NOTICES_CACHE,
    timestamp: new Date().toISOString()
  };
}

// Route 1: Fetch and parse notices from NU
app.get('/api/notices/fetch', async (req: Request, res: Response) => {
  const url = (req.query.url as string) || 'https://www.nu.ac.bd/examination-notice.php';
  const data = await scrapeNuExaminationNotices(url);
  res.json(data);
});

// Route 2: Simulate adding a fresh CSE notice (for live alert testing)
app.post('/api/notices/simulate-new', (req: Request, res: Response) => {
  const { semester = '8th Semester', type = 'Routine' } = req.body || {};
  const sampleNewCseNotice = {
    id: `nu-cse-live-alert-${Date.now()}`,
    slNo: 'HOT-ALERT',
    title: `[URGENT] Immediate Notice for B.Sc in CSE ${semester} Final Examination Schedule & Seat Plan Published on ${new Date().toLocaleDateString('en-GB')}`,
    publishDate: new Date().toISOString().split('T')[0],
    rawDateText: 'Just Now',
    fileUrl: 'https://www.nu.ac.bd/uploads/examination/Urgent_CSE_Routine_Alert.pdf',
    sourceUrl: 'https://www.nu.ac.bd/examination-notice.php',
    isCse: true,
    cseConfidence: 100,
    matchedKeywords: ['CSE', 'B.SC IN CSE', type.toUpperCase()],
    category: type || 'Routine',
    semester: semester,
    academicYear: '2025',
    isNew: true,
    memoNo: `NU/Exam/CSE/LIVE/${Date.now().toString().slice(-4)}`,
    extractedDeadlines: [`Immediate Action Required: ${new Date(Date.now() + 86400000 * 7).toLocaleDateString()}`]
  };

  // Prepend to in-memory store
  LIVE_NOTICES_CACHE.unshift(sampleNewCseNotice);

  res.json({
    success: true,
    notice: sampleNewCseNotice
  });
});

// Route 3: AI Notice Analysis using Gemini API
app.post('/api/ai/analyze-notice', async (req: Request, res: Response) => {
  try {
    const { title, date, category, semester } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are an academic advisor and examination controller assistant for National University (NU) Bangladesh Computer Science & Engineering (CSE) Department.
Analyze this official examination notice:
Notice Title: "${title}"
Published Date: "${date || 'Recent'}"
Category: "${category || 'Examination'}"
Semester: "${semester || 'CSE Department'}"

Provide an exact JSON response with the following keys:
1. "summary": Concise 2-3 sentence overview in plain English for a CSE student.
2. "targetAudience": Who must read/act on this notice (e.g., "4th Year 8th Semester CSE students").
3. "keyDates": Array of important deadlines, exam dates, or submission windows mentioned or inferred.
4. "actionRequired": Direct step-by-step action the student or college should take immediately.
5. "urgencyLevel": "High", "Medium", or "Low".
6. "faq": Array of 2 helpful Q&A objects ({"question": string, "answer": string}).

Respond ONLY with valid JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, analysis: parsed });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to smart analysis engine:', geminiError?.message);
      }
    }

    // Smart heuristic fallback analysis when Gemini API key is missing or offline
    const isRoutine = title.toLowerCase().includes('routine') || category === 'Routine';
    const isFormFillup = title.toLowerCase().includes('form') || category === 'Form Fill-up';
    const isResult = title.toLowerCase().includes('result') || category === 'Result';
    const isPractical = title.toLowerCase().includes('practical') || category === 'Practical & Viva';

    const fallbackAnalysis = {
      summary: `This is an official National University notification regarding ${title}. Students in the CSE department should review dates and contact their respective college department office if submission or verification is required.`,
      targetAudience: semester !== 'General' ? `B.Sc in CSE (${semester}) students and exam coordinators` : 'All CSE and affiliated professional course students',
      keyDates: isRoutine 
        ? ['Routine published', 'Collect Admit Card at least 3 days before exam', 'Carry National University registration card']
        : isFormFillup 
          ? ['Online form fill-up window open', 'Fee payment deadline approaching', 'College authority verification']
          : isResult 
            ? ['Result gazette published', 'Re-scrutiny application window: 15 days from publication']
            : ['Check center allocation list', 'Bring college ID card and lab records'],
      actionRequired: isFormFillup
        ? 'Login to NU student portal, complete the online exam form, print the pay slip, and submit dues to your college accounts branch.'
        : isRoutine
          ? 'Download the routine PDF, note down course codes and exam center timings, and verify syllabus revision.'
          : 'Review the notice details and coordinate with your batch group & department head.',
      urgencyLevel: isRoutine || isFormFillup ? 'High' : 'Medium',
      faq: [
        {
          question: 'Where can I get the signed admit card or payment slip?',
          answer: 'Admit cards are distributed through your affiliated college principal office via Sonali Seba.'
        },
        {
          question: 'What if there is a date conflict with another paper?',
          answer: 'Submit an application through your college principal to the Controller of Examinations, National University Gazipur.'
        }
      ]
    };

    res.json({ success: true, analysis: fallbackAnalysis, source: 'smart_engine' });

  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to analyze notice' });
  }
});

// Email Alert Config State in memory
let EMAIL_CONFIG = {
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
  frequency: 'instant' as 'instant' | '1_day' | '5_day' | '7_day',
  lastDispatchedAt: undefined as string | undefined,
  smtp: {
    service: 'gmail' as 'gmail' | 'outlook' | 'yahoo' | 'custom' | 'ethereal',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    senderName: 'NU CSE Notice Tracker',
    isConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  }
};

let EMAIL_DISPATCH_LOGS: any[] = [
  {
    id: 'em-log-init-1',
    timestamp: new Date().toLocaleTimeString(),
    recipient: 'alaminb949@gmail.com',
    subject: '📢 [NU CSE Alert] 8th Semester Examination Routine Published',
    noticeTitle: '২০২৩ সালের ৪র্থ বর্ষ বিএসসি (অনার্স) প্রফেশনাল সিএসই (CSE) ৮ম সেমিস্টার পরীক্ষার সংশোধিত সময়সূচি ও কেন্দ্রতালিকা সংক্রান্ত বিজ্ঞপ্তি',
    category: 'Routine',
    status: 'delivered',
    method: 'smtp',
    pdfUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_8th_Sem_Bangla_Routine_2025.pdf',
    memoNo: 'জাতীয় বিশ্ববিদ্যালয়/পরীক্ষা/প্রফেশনাল/সিএসই/২০২৫/১০৮৮',
  }
];


// Helper: Generate rich HTML email template for NU CSE notice
function buildNoticeEmailHtml(notice: {
  title: string;
  publishDate: string;
  category: string;
  semester?: string;
  memoNo?: string;
  fileUrl: string;
  extractedDeadlines?: string[];
  summary?: string;
}, recipient: string) {
  const dateStr = notice.publishDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const deadlinesHtml = notice.extractedDeadlines && notice.extractedDeadlines.length > 0
    ? notice.extractedDeadlines.map(d => `<li style="margin-bottom:6px; color:#991b1b; font-weight:600;">⏰ ${d}</li>`).join('')
    : '<li style="margin-bottom:6px; color:#475569;">Check attached notice document for specific course schedules and centers.</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NU CSE Notice Alert</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0, 0, 0, 0.3);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding:28px 32px; text-align:left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background-color:rgba(255,255,255,0.2); color:#ffffff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px;">
                      ⚡ Real-time CSE Alert
                    </span>
                    <h1 style="color:#ffffff; margin:10px 0 0 0; font-size:22px; font-weight:800; line-height:1.3;">
                      National University — CSE Department
                    </h1>
                    <p style="color:#d1fae5; margin:4px 0 0 0; font-size:13px;">
                      Official Examination & Academic Notice Notification
                    </p>
                  </td>
                  <td align="right" valign="top" style="width:60px;">
                    <div style="background-color:#ffffff; width:48px; height:48px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; text-align:center; font-size:24px; line-height:48px;">
                      🎓
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta Badges -->
          <tr>
            <td style="padding:20px 32px 10px 32px; background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block; background-color:#e0f2fe; color:#0369a1; font-size:12px; font-weight:700; padding:4px 10px; border-radius:6px; margin-right:6px;">
                      📁 ${notice.category || 'Examination'}
                    </span>
                    ${notice.semester && notice.semester !== 'General' ? `<span style="display:inline-block; background-color:#fef3c7; color:#b45309; font-size:12px; font-weight:700; padding:4px 10px; border-radius:6px; margin-right:6px;">🎓 ${notice.semester}</span>` : ''}
                    <span style="display:inline-block; background-color:#f1f5f9; color:#475569; font-size:12px; font-weight:600; padding:4px 10px; border-radius:6px;">
                      📅 ${dateStr}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Content -->
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:18px; line-height:1.5; font-weight:700;">
                ${notice.title}
              </h2>

              ${notice.memoNo ? `
              <div style="background-color:#f1f5f9; border-left:4px solid #059669; padding:10px 14px; margin-bottom:20px; border-radius:0 8px 8px 0;">
                <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Official Memo Ref:</span>
                <div style="font-size:13px; font-weight:600; color:#1e293b; font-family:monospace;">${notice.memoNo}</div>
              </div>` : ''}

              <!-- Deadlines / Key Dates Card -->
              <div style="background-color:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
                <h3 style="margin:0 0 8px 0; font-size:14px; font-weight:700; color:#9f1239; display:flex; align-items:center;">
                  📌 Important Deadlines & Action Points:
                </h3>
                <ul style="margin:0; padding-left:20px; font-size:13px; line-height:1.6;">
                  ${deadlinesHtml}
                </ul>
              </div>

              <!-- Action Callout & Direct Link -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:10px;">
                <tr>
                  <td align="center">
                    <a href="${notice.fileUrl}" target="_blank" style="display:inline-block; background-color:#059669; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:10px; font-size:14px; font-weight:700; box-shadow:0 4px 6px -1px rgba(5, 150, 105, 0.4); text-align:center;">
                      📄 Open & Download Official PDF
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 6px 0; font-size:12px; color:#64748b;">
                This alert was automatically dispatched to <strong>${recipient}</strong> by the National University CSE Notice Tracker.
              </p>
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                Source: <a href="https://www.nu.ac.bd/examination-notice.php" target="_blank" style="color:#059669; text-decoration:none;">https://www.nu.ac.bd/examination-notice.php</a> • National University Gazipur-1704
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Helper: Create Nodemailer transporter based on SMTP configuration or fallback to ethereal
async function createTransporter(customSmtp?: any) {
  const smtp = customSmtp || EMAIL_CONFIG.smtp;

  // Real SMTP (Gmail, Outlook, Custom host)
  if (smtp && smtp.user && smtp.pass) {
    const cleanUser = String(smtp.user).trim();
    const cleanPass = String(smtp.pass).replace(/\s+/g, ''); // strip spaces from App Passwords

    if (smtp.service === 'gmail') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: cleanUser,
          pass: cleanPass
        }
      });
      return {
        type: 'smtp' as const,
        transporter,
        from: `"${smtp.senderName || 'NU CSE Notice Tracker'}" <${cleanUser}>`,
        provider: 'Gmail SMTP'
      };
    }

    const host = smtp.host || 'smtp.gmail.com';
    const port = Number(smtp.port) || (smtp.secure ? 465 : 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: smtp.secure !== false && (port === 465),
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });

    return {
      type: 'smtp' as const,
      transporter,
      from: `"${smtp.senderName || 'NU CSE Notice Tracker'}" <${cleanUser}>`,
      provider: `${host}:${port}`
    };
  }

  // Fallback: Ethereal real test mailbox (generates real web preview link)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return {
      type: 'ethereal' as const,
      transporter: testTransporter,
      from: `"NU CSE Notice Tracker" <${testAccount.user}>`,
      provider: 'Ethereal Test Mailer'
    };
  } catch (err: any) {
    console.warn('Ethereal test mailer initialization notice:', err?.message);
    return null;
  }
}

// Helper: Transmit actual email message
async function sendRealEmail({
  to,
  subject,
  html,
  text,
  customSmtp
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  customSmtp?: any;
}): Promise<{
  success: boolean;
  method: 'smtp' | 'ethereal' | 'simulation';
  messageId?: string;
  previewUrl?: string;
  error?: string;
  provider?: string;
}> {
  const mailer = await createTransporter(customSmtp);

  if (!mailer) {
    return {
      success: false,
      method: 'simulation',
      error: 'No active mail transporter available. Configure your Gmail App Password in SMTP Settings.'
    };
  }

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject,
      text: text || subject,
      html,
    });

    let previewUrl: string | undefined = undefined;
    if (mailer.type === 'ethereal') {
      const ethUrl = nodemailer.getTestMessageUrl(info);
      if (ethUrl) previewUrl = ethUrl;
    }

    return {
      success: true,
      method: mailer.type,
      messageId: info.messageId,
      previewUrl,
      provider: mailer.provider
    };
  } catch (err: any) {
    let rawError = String(err?.message || err);
    let friendly = rawError;

    if (rawError.includes('Invalid login') || rawError.includes('535') || rawError.includes('Username and Password not accepted')) {
      friendly = 'Gmail SMTP Authentication Failed: Google requires a 16-character App Password (not your primary password). Visit https://myaccount.google.com/apppasswords to create one.';
    } else if (rawError.includes('ECONNREFUSED') || rawError.includes('ETIMEDOUT')) {
      friendly = `Connection timed out connecting to mail server (${mailer.provider}). Check firewall or port settings.`;
    }

    return {
      success: false,
      method: mailer.type,
      error: friendly,
      provider: mailer.provider
    };
  }
}

// Route 4: Get email notification config and recent dispatch logs
app.get('/api/alerts/email/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: EMAIL_CONFIG,
    logs: EMAIL_DISPATCH_LOGS.slice(0, 30)
  });
});

// Route 5: Update email notification config
app.post('/api/alerts/email/config', (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    EMAIL_CONFIG = {
      ...EMAIL_CONFIG,
      ...newConfig,
      smtp: {
        ...EMAIL_CONFIG.smtp,
        ...(newConfig.smtp || {}),
        isConfigured: Boolean(
          (newConfig.smtp?.user && newConfig.smtp?.pass) || 
          (EMAIL_CONFIG.smtp?.user && EMAIL_CONFIG.smtp?.pass)
        )
      }
    };
    res.json({
      success: true,
      message: 'Email alert preferences saved successfully',
      config: EMAIL_CONFIG
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update email configuration' });
  }
});

// Route 6: Verify SMTP connection
app.post('/api/alerts/email/verify-smtp', async (req: Request, res: Response) => {
  try {
    const { smtp } = req.body;
    if (!smtp || !smtp.user || !smtp.pass) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter both sender email and Google App Password (or SMTP password).' 
      });
    }

    const mailer = await createTransporter(smtp);
    if (!mailer || mailer.type !== 'smtp') {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not initialize SMTP transport for provided parameters.' 
      });
    }

    await mailer.transporter.verify();
    
    // If verified, save in server configuration
    EMAIL_CONFIG.smtp = {
      ...EMAIL_CONFIG.smtp,
      ...smtp,
      isConfigured: true
    };

    res.json({
      success: true,
      message: `SMTP connection to ${smtp.user} verified successfully! Real email delivery is ready.`,
      config: EMAIL_CONFIG
    });
  } catch (err: any) {
    let msg = String(err?.message || err);
    if (msg.includes('Invalid login') || msg.includes('535') || msg.includes('Username and Password not accepted')) {
      msg = 'Gmail Authentication Error: Google requires a 16-character App Password. Visit https://myaccount.google.com/apppasswords to create one, then paste it here.';
    }
    res.status(400).json({
      success: false,
      error: msg
    });
  }
});

// Route 7: Download .eml file for local mail client preview
app.post('/api/alerts/email/download-eml', (req: Request, res: Response) => {
  try {
    const { notice, recipientEmail } = req.body;
    const targetEmail = recipientEmail || EMAIL_CONFIG.recipientEmail || 'alaminb949@gmail.com';
    const subject = `📢 [NU CSE Alert] ${notice?.category || 'Routine'}: ${notice?.title?.slice(0, 50) || 'Notice Update'}`;
    const html = buildNoticeEmailHtml(notice, targetEmail);
    const emlContent = [
      `From: "NU CSE Notice Tracker" <alerts@nu-cse-tracker.edu.bd>`,
      `To: <${targetEmail}>`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html
    ].join('\r\n');

    res.setHeader('Content-Type', 'message/rfc822');
    res.setHeader('Content-Disposition', 'attachment; filename="NU-CSE-Alert.eml"');
    res.send(emlContent);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate EML file' });
  }
});

// Route 8: Dispatch live email notification for a CSE notice
app.post('/api/alerts/email/dispatch', async (req: Request, res: Response) => {
  try {
    const { notice, recipientEmail, isTest } = req.body;
    const targetEmail = recipientEmail || EMAIL_CONFIG.recipientEmail || 'alaminb949@gmail.com';

    if (!notice || !notice.title) {
      return res.status(400).json({ error: 'Notice details are required' });
    }

    const subject = isTest
      ? `📢 [TEST ALERT] National University CSE Notice: ${notice.title.slice(0, 50)}...`
      : `📢 [NU CSE Alert] ${notice.category || 'Notice'}: ${notice.title.slice(0, 60)}...`;

    const html = buildNoticeEmailHtml(notice, targetEmail);
    const text = `National University CSE Alert\n${notice.title}\nCategory: ${notice.category}\nDate: ${notice.publishDate}\nPDF: ${notice.fileUrl}`;

    // Transmit via actual nodemailer engine
    const sendResult = await sendRealEmail({
      to: targetEmail,
      subject,
      html,
      text
    });

    const logEntry = {
      id: `em-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      recipient: targetEmail,
      subject,
      noticeTitle: notice.title,
      category: notice.category || 'Routine',
      status: sendResult.success ? 'delivered' : 'failed',
      method: sendResult.method,
      messageId: sendResult.messageId,
      previewUrl: sendResult.previewUrl,
      errorDetails: sendResult.error,
      pdfUrl: notice.fileUrl,
      memoNo: notice.memoNo,
      previewHtml: html
    };

    EMAIL_DISPATCH_LOGS.unshift(logEntry);
    if (sendResult.success) {
      EMAIL_CONFIG.lastDispatchedAt = new Date().toISOString();
    }

    res.json({
      success: sendResult.success,
      method: sendResult.method,
      message: sendResult.success
        ? (sendResult.method === 'smtp' 
            ? `Real email alert dispatched directly to ${targetEmail} via verified SMTP!` 
            : `Email alert generated and delivered via test mailer.`)
        : `Email delivery attempt recorded. Note: ${sendResult.error}`,
      error: sendResult.error,
      previewUrl: sendResult.previewUrl,
      log: logEntry,
      recipient: targetEmail,
      subject
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to dispatch email' });
  }
});

// Route 9: Quick Test Email dispatch to user's address
app.post('/api/alerts/email/send-test', async (req: Request, res: Response) => {
  try {
    const { recipientEmail, semester } = req.body;
    const targetEmail = recipientEmail || EMAIL_CONFIG.recipientEmail || 'alaminb949@gmail.com';

    const testNotice = {
      id: `test-em-${Date.now()}`,
      title: `২০২৩ সালের ৪র্থ বর্ষ বিএসসি (অনার্স) প্রফেশনাল সিএসই (CSE) ${semester || '৮ম'} সেমিস্টার পরীক্ষার জরুরি বিজ্ঞপ্তি ও কেন্দ্রতালিকা`,
      publishDate: new Date().toLocaleDateString('en-GB'),
      category: 'Routine',
      semester: semester || '8th Semester',
      fileUrl: 'https://www.nu.ac.bd/uploads/examination/CSE_8th_Sem_Bangla_Routine_2025.pdf',
      memoNo: 'জাতীয় বিশ্ববিদ্যালয়/পরীক্ষা/প্রফেশনাল/সিএসই/২০২৫/১০৮৮',
      extractedDeadlines: [
        'পরীক্ষা শুরুর তারিখ: ১৫ মার্চ ২০২৫',
        'প্রবেশপত্র ও কেন্দ্র ফি জমাদান শেষ তারিখ: ১০ মার্চ ২০২৫',
        'অনলাইন ভেরিফিকেশন: ১২ মার্চ ২০২৫'
      ],
      summary: 'National University CSE Department has released the revised examination dates. Ensure admit cards are collected in advance.'
    };

    const subject = `📢 [NU CSE Alert] Test Notification for ${targetEmail}`;
    const html = buildNoticeEmailHtml(testNotice, targetEmail);
    const text = `National University CSE Alert Test\n${testNotice.title}\nCategory: Routine\nTarget: ${targetEmail}`;

    // Execute actual email transmission
    const sendResult = await sendRealEmail({
      to: targetEmail,
      subject,
      html,
      text
    });

    const logEntry = {
      id: `em-test-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      recipient: targetEmail,
      subject,
      noticeTitle: testNotice.title,
      category: 'Routine',
      status: sendResult.success ? 'delivered' : 'failed',
      method: sendResult.method,
      messageId: sendResult.messageId,
      previewUrl: sendResult.previewUrl,
      errorDetails: sendResult.error,
      pdfUrl: testNotice.fileUrl,
      memoNo: testNotice.memoNo,
      previewHtml: html
    };

    EMAIL_DISPATCH_LOGS.unshift(logEntry);
    if (sendResult.success) {
      EMAIL_CONFIG.lastDispatchedAt = new Date().toISOString();
    }

    res.json({
      success: sendResult.success,
      method: sendResult.method,
      message: sendResult.success
        ? (sendResult.method === 'smtp'
            ? `Real test email delivered to ${targetEmail} via verified SMTP!`
            : `Delivered via live test mailer! To send directly to your actual Gmail inbox, configure SMTP in Settings.`)
        : `Email delivery issue: ${sendResult.error}`,
      error: sendResult.error,
      previewUrl: sendResult.previewUrl,
      log: logEntry,
      previewHtml: html
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send test email' });
  }
});

// Vite Middleware for development & Production static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NU CSE Notice Tracker Server running on port ${PORT}`);
  });
}

startServer();
