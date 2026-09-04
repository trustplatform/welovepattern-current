import React, { useState, useEffect } from 'react';
import { getToolSeoArticle } from '../../data/toolSeoArticles';
import { BookOpen, Sparkles, HelpCircle, Share2, Copy, Check } from 'lucide-react';
import { sanitizePatternSeoHtml } from '../../utils/sanitizeHtml';

interface ToolSeoArticleViewProps {
  toolSlug: string;
  toolTitle: string;
}

export const ToolSeoArticleView: React.FC<ToolSeoArticleViewProps> = ({
  toolSlug,
  toolTitle
}) => {
  const [articleHtml, setArticleHtml] = useState<string>(() => sanitizePatternSeoHtml(getToolSeoArticle(toolSlug)));
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const html = getToolSeoArticle(toolSlug);
    setArticleHtml(sanitizePatternSeoHtml(html));
  }, [toolSlug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 my-8">
      
      {/* Header section for SEO Article */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-[#E96BA8] flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {toolTitle} — User Guide &amp; Expert Reference
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Complete instructions, reference tables, FAQs, and stitching tips for Google search optimization
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-end sm:self-auto"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-[#E96BA8]" />}
          <span>{copied ? 'Tool URL Copied!' : 'Share Tool Guide'}</span>
        </button>
      </div>

      {/* Render rich SEO Article content */}
      <div 
        className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-sm sm:text-base space-y-4
          [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#E96BA8] [&_h3]:mt-5 [&_h3]:mb-2
          [&_p]:text-slate-600 [&_p]:dark:text-slate-300 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
          [&_li]:text-slate-600 [&_li]:dark:text-slate-300
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:rounded-2xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-slate-200 [&_table]:dark:border-slate-800
          [&_th]:bg-slate-50 [&_th]:dark:bg-slate-800/80 [&_th]:p-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:text-slate-700 [&_th]:dark:text-slate-200
          [&_td]:p-3 [&_td]:border-t [&_td]:border-slate-200 [&_td]:dark:border-slate-800 [&_td]:text-xs [&_td]:sm:text-sm
          [&_blockquote]:border-l-4 [&_blockquote]:border-[#E96BA8] [&_blockquote]:bg-pink-50/50 [&_blockquote]:dark:bg-pink-950/20 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:my-4"
        dangerouslySetInnerHTML={{ __html: articleHtml }}
      />

    </div>
  );
};
