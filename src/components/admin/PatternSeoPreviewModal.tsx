import React from 'react';
import { PatternSeoArticle } from '../../types';
import { PatternSeoArticleSection } from '../PatternSeoArticleSection';
import { X, ExternalLink, Sparkles, Eye } from 'lucide-react';

interface PatternSeoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: PatternSeoArticle;
}

export const PatternSeoPreviewModal: React.FC<PatternSeoPreviewModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-[#E96BA8]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Article Preview
                </h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  article.status === 'published'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                }`}>
                  {article.status === 'published' ? 'Published' : 'Draft Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This shows exactly how the SEO article appears on the Pattern Detail page before Maker Reviews.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Viewport Container */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Mock Context Note */}
          <div className="text-xs font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 p-3 rounded-xl flex items-center justify-between">
            <span>↓ Pattern Instructions section ends above ↓</span>
            <span className="font-bold text-[#E96BA8]">SEO Helpful Article Section</span>
            <span>↓ Maker Reviews section begins below ↓</span>
          </div>

          {/* Actual Article Component */}
          <PatternSeoArticleSection article={article} isPreview={true} />

        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-800 px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};
