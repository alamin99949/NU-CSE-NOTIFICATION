import React from 'react';
import { Zap, X, ArrowRight, FolderCheck } from 'lucide-react';
import { Notice } from '../types';

interface AlertToastProps {
  notice: Notice | null;
  onClose: () => void;
  onOpenNotice: (notice: Notice) => void;
  onGoToFolder: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  notice,
  onClose,
  onOpenNotice,
  onGoToFolder,
}) => {
  if (!notice) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-slate-900">
        {/* Toast Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Zap className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                🚨 NEW CSE NOTICE ALERT
              </h4>
              <span className="text-[10px] text-slate-500">
                Routed automatically into CSE Department Folder
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Title */}
        <p 
          onClick={() => {
            onOpenNotice(notice);
            onClose();
          }}
          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 cursor-pointer leading-snug"
        >
          {notice.title}
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {notice.semester || 'CSE Department'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onGoToFolder();
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 shadow-xs"
            >
              <FolderCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Open Folder</span>
            </button>

            <button
              onClick={() => {
                onOpenNotice(notice);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
