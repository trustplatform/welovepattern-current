import React from 'react';
import { ChevronRight, Calendar, ShieldCheck, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SitePage } from '../types';

interface SitePageViewProps {
  page?: SitePage;
  onNavigate: (view: string, param?: string) => void;
}

export const SitePageView: React.FC<SitePageViewProps> = ({ page, onNavigate }) => {
  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h1>
        <p className="text-slate-600 mb-6">The requested information page could not be located.</p>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 bg-[#E96BA8] text-white px-6 py-2.5 rounded-full font-bold hover:bg-pink-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    );
  }

  const formattedDate = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="bg-slate-50/60 min-h-screen pb-20 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-xs sm:text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap py-1">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="hover:text-[#E96BA8] transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-semibold truncate">{page.title}</span>
        </nav>

        {/* Header Hero Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-[#E96BA8] border border-pink-100 rounded-full text-xs font-bold uppercase tracking-wider">
              {page.slug === 'privacy-policy' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Official Document</span>
            </div>

            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Last updated {formattedDate}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {page.title}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {page.slug === 'privacy-policy' && 'Our commitment to maker privacy, transparent data practices, and open-access crafting.'}
            {page.slug === 'terms-of-service' && 'Rules, permissions, and handmade product guidelines for our 100% free crochet library.'}
            {page.slug === 'sitemap' && 'Structured site hierarchy, category indexes, craft calculator links, and schema markup.'}
            {!['privacy-policy', 'terms-of-service', 'sitemap'].includes(page.slug) && (page.seoDescription || 'Official site documentation for WeLovePattern.')}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Free Public Access</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('page', 'privacy-policy');
                }}
                className={`hover:text-[#E96BA8] transition-colors ${page.slug === 'privacy-policy' ? 'font-bold text-[#E96BA8]' : ''}`}
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a
                href="/terms-of-service"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('page', 'terms-of-service');
                }}
                className={`hover:text-[#E96BA8] transition-colors ${page.slug === 'terms-of-service' ? 'font-bold text-[#E96BA8]' : ''}`}
              >
                Terms of Service
              </a>
              <span>•</span>
              <a
                href="/sitemap"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('page', 'sitemap');
                }}
                className={`hover:text-[#E96BA8] transition-colors ${page.slug === 'sitemap' ? 'font-bold text-[#E96BA8]' : ''}`}
              >
                Sitemap & Schema
              </a>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm">
          <div
            className="site-page-prose text-slate-800 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Bottom Footer Back Link */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => onNavigate('patterns')}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#E96BA8] hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Explore Free Crochet Patterns
            </button>
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} WeLovePattern
            </span>
          </div>
        </article>

      </div>
    </div>
  );
};
