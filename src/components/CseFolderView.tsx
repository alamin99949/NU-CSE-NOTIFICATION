import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderCheck, 
  FileText, 
  Calendar, 
  Clock, 
  FileDown, 
  ExternalLink, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Filter, 
  Tag, 
  AlertCircle,
  Share2,
  CheckCircle2,
  Download,
  GraduationCap,
  Layers,
  Mail
} from 'lucide-react';
import { Notice } from '../types';

interface CseFolderViewProps {
  notices: Notice[];
  savedNoticeIds: string[];
  onToggleSave: (id: string) => void;
  onSelectNotice: (notice: Notice) => void;
  onOpenAiSummary: (notice: Notice) => void;
  onOpenEmailAlerts?: () => void;
}

export const CseFolderView: React.FC<CseFolderViewProps> = ({
  notices,
  savedNoticeIds,
  onToggleSave,
  onSelectNotice,
  onOpenAiSummary,
  onOpenEmailAlerts,
}) => {
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sub-folder definitions with counters
  const subFolders = useMemo(() => {
    return [
      { id: 'all', name: 'All CSE Notices', icon: FolderCheck, count: notices.length },
      { id: 'Routine', name: 'Exam Routines', icon: Calendar, count: notices.filter(n => n.category === 'Routine').length },
      { id: 'Form Fill-up', name: 'Form Fill-up', icon: FileText, count: notices.filter(n => n.category === 'Form Fill-up').length },
      { id: 'Result', name: 'Results & Gazette', icon: GraduationCap, count: notices.filter(n => n.category === 'Result').length },
      { id: 'Practical & Viva', name: 'Practical & Viva', icon: Layers, count: notices.filter(n => n.category === 'Practical & Viva').length },
      { id: 'Admit Card', name: 'Admit & Center', icon: Tag, count: notices.filter(n => n.category === 'Admit Card' || n.category === 'Center List').length },
      { id: 'saved', name: 'Starred Notices', icon: Bookmark, count: notices.filter(n => savedNoticeIds.includes(n.id)).length },
    ];
  }, [notices, savedNoticeIds]);

  const semesters = [
    'all',
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester',
  ];

  // Filter logic
  const filteredNotices = useMemo(() => {
    return notices
      .filter((notice) => {
        // Sub-folder filter
        if (selectedSubFolder === 'saved') {
          if (!savedNoticeIds.includes(notice.id)) return false;
        } else if (selectedSubFolder === 'Admit Card') {
          if (notice.category !== 'Admit Card' && notice.category !== 'Center List') return false;
        } else if (selectedSubFolder !== 'all') {
          if (notice.category !== selectedSubFolder) return false;
        }

        // Semester filter
        if (selectedSemester !== 'all') {
          if (notice.semester !== selectedSemester) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = notice.title.toLowerCase().includes(q);
          const matchesMemo = notice.memoNo?.toLowerCase().includes(q);
          const matchesKw = notice.matchedKeywords?.some(k => k.toLowerCase().includes(q));
          if (!matchesTitle && !matchesMemo && !matchesKw) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        } else {
          return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
        }
      });
  }, [notices, selectedSubFolder, selectedSemester, searchQuery, sortBy, savedNoticeIds]);

  const handleShare = (notice: Notice) => {
    const text = `📢 *National University CSE Notice:*\n${notice.title}\n📅 Date: ${notice.publishDate}\n🔗 PDF: ${notice.fileUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(notice.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredNotices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `NU_CSE_Notices_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Folder Header Breadcrumb & Department Stats Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600 shadow-xs">
              <FolderCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span>National University Notice Archive</span>
                <span>/</span>
                <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  📁 CSE Department Folder
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Computer Science & Engineering Notice Repository
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically filtered & segregated from National University Examination Notice Board (nu.ac.bd/examination-notice.php)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenEmailAlerts && (
              <button
                onClick={onOpenEmailAlerts}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                title="Configure instant email notifications to your inbox"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Alerts</span>
              </button>
            )}
            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Export filtered CSE notices list as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export List</span>
            </button>
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span>Total in Folder:</span>
              <span className="text-white bg-emerald-600 px-2 py-0.5 rounded-full text-xs font-mono">
                {notices.length}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Folders Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {subFolders.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedSubFolder === sub.id;
            return (
              <button
                key={sub.id}
                id={`subfolder-${sub.id}`}
                onClick={() => setSelectedSubFolder(sub.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}>
                    {sub.count}
                  </span>
                </div>
                <span className="text-xs font-semibold mt-2 truncate">{sub.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Semester Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="cse-folder-search"
              type="text"
              placeholder="Search CSE notices, routines, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Sort:</label>
            <select
              id="cse-folder-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600 shadow-xs"
            >
              <option value="newest">Newest Published First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Semester Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Semester:
          </span>
          {semesters.map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <button
                key={sem}
                id={`semester-chip-${sem}`}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {sem === 'all' ? 'All Semesters' : sem}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No CSE Notices Found in this Category</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try clearing your search keyword or switching to &ldquo;All Semesters&rdquo; / &ldquo;All CSE Notices&rdquo; folder tab.
          </p>
          <button
            onClick={() => {
              setSelectedSubFolder('all');
              setSelectedSemester('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredNotices.map((notice) => {
            const isSaved = savedNoticeIds.includes(notice.id);
            const isCopied = copiedId === notice.id;

            return (
              <div
                key={notice.id}
                id={`notice-card-${notice.id}`}
                className={`group relative bg-white hover:bg-slate-50/70 border transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs ${
                  notice.isNew 
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Row: Category Tag, Confidence, Date, and Save Bookmark */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      notice.category === 'Routine'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : notice.category === 'Form Fill-up'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : notice.category === 'Result'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : notice.category === 'Practical & Viva'
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : notice.category === 'Admit Card'
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {notice.category}
                    </span>

                    {/* Semester Pill */}
                    {notice.semester && notice.semester !== 'General' && (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {notice.semester}
                      </span>
                    )}

                    {/* Match tag */}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      ✓ CSE Match ({notice.cseConfidence}%)
                    </span>

                    {notice.isNew && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-200 animate-pulse">
                        NEW ALERT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {notice.publishDate}
                    </span>
                    <button
                      id={`save-notice-${notice.id}`}
                      onClick={() => onToggleSave(notice.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSaved 
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 border border-amber-200' 
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isSaved ? "Remove from Starred CSE Notices" : "Star and Save in Folder"}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Title & Body */}
                <div>
                  <h3 
                    onClick={() => onSelectNotice(notice)}
                    className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                  >
                    {notice.title}
                  </h3>

                  {notice.memoNo && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Memo No: {notice.memoNo}
                    </p>
                  )}

                  {/* Extracted Key Deadlines */}
                  {notice.extractedDeadlines && notice.extractedDeadlines.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {notice.extractedDeadlines.map((deadline, dIdx) => (
                        <span 
                          key={dIdx} 
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          {deadline}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Matched Keywords Tags */}
                  {notice.matchedKeywords && notice.matchedKeywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-400">Keywords:</span>
                      {notice.matchedKeywords.map((kw, kIdx) => (
                        <span key={kIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* View Details & AI Analysis */}
                    <button
                      id={`view-details-${notice.id}`}
                      onClick={() => onSelectNotice(notice)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Details & Breakdown</span>
                    </button>

                    {/* AI Smart Summary button */}
                    <button
                      id={`ai-summary-${notice.id}`}
                      onClick={() => onOpenAiSummary(notice)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI Guidance</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share / Copy Announcement */}
                    <button
                      id={`share-btn-${notice.id}`}
                      onClick={() => handleShare(notice)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                      title="Copy notice details for WhatsApp / Messenger group"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px] font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Share</span>
                        </>
                      )}
                    </button>

                    {/* Direct Official PDF Link */}
                    <a
                      id={`pdf-link-${notice.id}`}
                      href={notice.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-600" />
                      <span>Open PDF</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
