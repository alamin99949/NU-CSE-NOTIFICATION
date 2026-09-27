import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  Clock, 
  FileDown, 
  ExternalLink, 
  Share2, 
  CheckCircle2, 
  Bookmark, 
  BookmarkCheck, 
  AlertTriangle, 
  HelpCircle,
  Copy
} from 'lucide-react';
import { Notice, AiNoticeAnalysis } from '../types';
import { analyzeNoticeWithAi } from '../services/api';

interface NoticeDetailModalProps {
  notice: Notice | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  notice,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  const [analysis, setAnalysis] = useState<AiNoticeAnalysis | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  useEffect(() => {
    if (notice) {
      // Auto trigger AI analysis for deep breakdown
      setIsLoadingAi(true);
      analyzeNoticeWithAi(notice)
        .then((res) => {
          setAnalysis(res);
          setIsLoadingAi(false);
        })
        .catch((err) => {
          console.warn('AI analysis error:', err);
          setIsLoadingAi(false);
        });
    } else {
      setAnalysis(null);
    }
  }, [notice]);

  if (!notice) return null;

  const handleCopyNotice = () => {
    const formatted = `📢 *NATIONAL UNIVERSITY BANGLADESH - CSE NOTICE*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 *Title:* ${notice.title}\n📅 *Published Date:* ${notice.publishDate}\n📂 *Category:* ${notice.category}\n🎓 *Semester:* ${notice.semester || 'CSE Department'}\n\n📝 *Key Summary:*\n${analysis?.summary || 'Official notification for CSE department candidates.'}\n\n⚡ *Action Required:*\n${analysis?.actionRequired || 'Check routine & collect admit card from college office.'}\n\n🔗 *Official PDF Link:* ${notice.fileUrl}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    navigator.clipboard.writeText(formatted);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
              notice.isCse 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {notice.isCse ? 'CSE Department Notice' : 'General Notice'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Published: {notice.publishDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(notice.id)}
              className={`p-2 rounded-xl transition-colors ${
                isSaved ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
              title={isSaved ? "Saved in CSE Starred folder" : "Star notice"}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Main Title */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {notice.title}
            </h2>
            {notice.memoNo && (
              <p className="text-xs text-slate-500 font-mono mt-1">
                Official Reference: {notice.memoNo}
              </p>
            )}
          </div>

          {/* Quick Meta Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Category</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{notice.category}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Semester</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{notice.semester || 'CSE Department'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Department Confidence</span>
              <span className="font-bold text-emerald-700 mt-0.5 block font-mono">{notice.cseConfidence}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Source Document</span>
              <span className="font-bold text-slate-800 mt-0.5 block truncate">PDF Attachment</span>
            </div>
          </div>

          {/* AI Comprehensive Breakdown */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  AI Advisor & Routine Breakdown
                </h3>
              </div>
              {isLoadingAi ? (
                <span className="text-[11px] font-medium text-emerald-700 animate-pulse">
                  Analyzing document...
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {analysis?.urgencyLevel ? `${analysis.urgencyLevel} Urgency` : 'Analyzed'}
                </span>
              )}
            </div>

            {isLoadingAi ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Parsing notice text for examination dates and deadlines...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4 text-xs">
                {/* Executive Summary */}
                <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-xs">
                  <h4 className="font-bold text-slate-800 mb-1">Executive Summary:</h4>
                  <p className="text-slate-600 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Target Audience & Direct Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-400 block text-[11px] font-medium mb-1">Target Audience:</span>
                    <p className="font-semibold text-slate-800">{analysis.targetAudience}</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-400 block text-[11px] font-medium mb-1">Immediate Action Required:</span>
                    <p className="font-semibold text-emerald-800">{analysis.actionRequired}</p>
                  </div>
                </div>

                {/* Important Dates / Schedule */}
                {analysis.keyDates && analysis.keyDates.length > 0 && (
                  <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 shadow-xs">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Deadlines & Exam Dates:</span>
                    </h4>
                    <ul className="space-y-1 pl-4 list-disc text-amber-800">
                      {analysis.keyDates.map((date, idx) => (
                        <li key={idx} className="font-medium">{date}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Frequently Asked Questions */}
                {analysis.faq && analysis.faq.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>Student Guidance & FAQs:</span>
                    </h4>
                    <div className="space-y-2">
                      {analysis.faq.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-800">Q: {item.question}</p>
                          <p className="text-slate-600 mt-1 leading-relaxed">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs">
                AI summary could not be retrieved. You can inspect the attached PDF file directly.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNotice}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedText ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Close
            </button>

            <a
              href={notice.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Open Official PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
