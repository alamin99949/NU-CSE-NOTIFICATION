import React, { useState, useMemo } from 'react';
import { 
  FolderCheck, 
  Search, 
  FileDown, 
  ExternalLink, 
  ArrowRight, 
  Clock, 
  SlidersHorizontal,
} from 'lucide-react';
import { Notice } from '../types';

interface AllNoticesViewProps {
  notices: Notice[];
  onSelectNotice: (notice: Notice) => void;
  onGoToCseFolder: () => void;
  onToggleSave: (id: string) => void;
  savedNoticeIds: string[];
}

export const AllNoticesView: React.FC<AllNoticesViewProps> = ({
  notices,
  onSelectNotice,
  onGoToCseFolder,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'cse_only' | 'other_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const cseCount = useMemo(() => notices.filter(n => n.isCse).length, [notices]);
  const otherCount = useMemo(() => notices.filter(n => !n.isCse).length, [notices]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    notices.forEach(n => set.add(n.category));
    return ['all', ...Array.from(set)];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      if (filterMode === 'cse_only' && !notice.isCse) return false;
      if (filterMode === 'other_only' && notice.isCse) return false;
      if (selectedCategory !== 'all' && notice.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = notice.title.toLowerCase().includes(q);
        const matchMemo = notice.memoNo?.toLowerCase().includes(q);
        if (!matchTitle && !matchMemo) return false;
      }

      return true;
    });
  }, [notices, filterMode, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Description Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                MASTER FEED
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                National University Examination Notices (All Departments)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Parsed from <code className="text-emerald-700 font-mono font-medium">https://www.nu.ac.bd/examination-notice.php</code>. CSE items are highlighted and automatically curated into your CSE Folder.
            </p>
          </div>

          <button
            onClick={onGoToCseFolder}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all whitespace-nowrap self-start md:self-auto"
          >
            <FolderCheck className="w-4 h-4" />
            <span>Open CSE Department Folder ({cseCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <button
            id="filter-all-btn"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'all'
                ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All Notices ({notices.length})
          </button>

          <button
            id="filter-cse-only-btn"
            onClick={() => setFilterMode('cse_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              filterMode === 'cse_only'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CSE Department Only ({cseCount})</span>
          </button>

          <button
            id="filter-other-btn"
            onClick={() => setFilterMode('other_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterMode === 'other_only'
                ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Other Degrees ({otherCount})
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            id="all-notices-search"
            type="text"
            placeholder="Search all National University notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 shadow-xs"
          >
            <option value="all">All Notice Types</option>
            {categories.filter(c => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Feed List */}
      <div className="space-y-3">
        {filteredNotices.map((notice) => {
          return (
            <div
              key={notice.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                notice.isCse
                  ? 'bg-white border-emerald-300 ring-1 ring-emerald-500/20 hover:border-emerald-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Info Column */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.slNo && (
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      #{notice.slNo}
                    </span>
                  )}

                  {notice.isCse ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <FolderCheck className="w-3.5 h-3.5 text-emerald-600" />
                      In CSE Folder
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      General Degree
                    </span>
                  )}

                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {notice.category}
                  </span>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {notice.publishDate}
                  </span>
                </div>

                <h3 
                  onClick={() => onSelectNotice(notice)}
                  className={`text-sm sm:text-base cursor-pointer leading-snug transition-colors ${
                    notice.isCse 
                      ? 'text-slate-900 hover:text-emerald-700 font-bold' 
                      : 'text-slate-800 hover:text-slate-950 font-medium'
                  }`}
                >
                  {notice.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                <button
                  onClick={() => onSelectNotice(notice)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-xs"
                >
                  Inspect
                </button>

                <a
                  href={notice.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {notice.isCse && (
                  <button
                    onClick={onGoToCseFolder}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all"
                  >
                    <span>Folder</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
