import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, Check, RotateCcw } from 'lucide-react';
import { CseRule } from '../types';

interface KeywordRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CseRule[];
  onToggleRule: (id: string) => void;
  onAddRule: (keyword: string) => void;
  onDeleteRule: (id: string) => void;
  onResetDefaults: () => void;
}

export const KeywordRulesModal: React.FC<KeywordRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  onResetDefaults,
}) => {
  const [newKeyword, setNewKeyword] = useState<string>('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      onAddRule(newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              CSE Detection Keyword Rules
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white">
          <p className="text-xs text-slate-600 leading-relaxed">
            Notices containing any active keywords below are automatically isolated from the National University exam feed and routed directly into your <strong>CSE Department Folder</strong> with instant alerts.
          </p>

          {/* Add New Keyword Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. CSE-412, B.Sc in IT, Data Communication..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </button>
          </form>

          {/* Keyword Rule List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Match Patterns ({rules.filter(r => r.enabled).length} Enabled)
            </h4>
            
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all shadow-xs ${
                    rule.enabled 
                      ? 'bg-slate-50 border-emerald-200 text-slate-900' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        rule.enabled 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold">{rule.keyword}</span>
                  </div>

                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onResetDefaults}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Rules</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
