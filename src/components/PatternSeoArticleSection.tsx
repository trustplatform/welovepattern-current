import React from 'react';
import { PatternSeoArticle } from '../types';
import { sanitizePatternSeoHtml } from '../utils/sanitizeHtml';
import { BookOpen, User, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';

interface PatternSeoArticleSectionProps {
  article: PatternSeoArticle;
  isPreview?: boolean;
}

export const PatternSeoArticleSection: React.FC<PatternSeoArticleSectionProps> = ({ 
  article, 
  isPreview = false 
}) => {
  if (!article || (!isPreview && article.status !== 'published')) {
    return null;
  }

  const sanitizedContent = sanitizePatternSeoHtml(article.content || '');
  const formattedDate = article.updatedAt 
    ? new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <article 
      id="pattern-seo-article"
      className="bg-white dark:bg-slate-800 p-6 sm:p-8 lg:p-10 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-6 shadow-xs"
    >
      {/* Header Badge & Meta info */}
      <div className="space-y-3 border-b border-slate-100 dark:border-slate-700/60 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-pink-50 dark:bg-pink-950/60 text-[#E96BA8] border border-pink-200/60 dark:border-pink-800/60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Helpful Maker Guide &amp; Tips</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E96BA8]" />
              <span>{article.author || 'WeLovePattern'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Updated {formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Primary Article Title - Semantic H2 (H1 is reserved for Pattern title) */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          {article.title}
        </h2>
      </div>

      {/* Featured Image if present */}
      {article.featuredImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900">
          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt || article.title}
            onError={handleImageError}
            loading="lazy"
            className="w-full max-h-[420px] object-cover"
          />
          {article.featuredImageAlt && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-slate-900/90 text-center italic border-t border-slate-200/60 dark:border-slate-800">
              {article.featuredImageAlt}
            </p>
          )}
        </div>
      )}

      {/* Semantic Rich Content Container */}
      <div 
        className="pattern-seo-prose text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 font-normal"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Trust & Craft Guarantee Box */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50/60 via-purple-50/40 to-slate-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border border-pink-100 dark:border-slate-700/80 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[#E96BA8]/10 dark:bg-[#E96BA8]/20 flex items-center justify-center text-[#E96BA8] shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Tested &amp; Verified by Crochet Makers
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All tips and steps in this guide have been crafted and reviewed to ensure accurate stitch counts, easy yarn pairing, and stress-free crafting for everyone.
          </p>
        </div>
      </div>
    </article>
  );
};
