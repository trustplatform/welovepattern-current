import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit3, 
  Eye, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  Globe, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { SitePage } from '../../types';
import { PageEditorModal } from './PageEditorModal';
import { DEFAULT_SITE_PAGES } from '../../data/defaultSitePages';

export const PagesAdmin: React.FC = () => {
  const [pages, setPages] = useState<SitePage[]>(DEFAULT_SITE_PAGES);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<SitePage | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPages(data);
        } else {
          setPages(DEFAULT_SITE_PAGES);
        }
      } else {
        // Fallback to public endpoint if admin route needs it
        const pubRes = await fetch('/api/pages');
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          if (Array.isArray(pubData) && pubData.length > 0) {
            setPages(pubData);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching site pages:', err);
      setErrorMessage('Failed to load site pages from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleEditClick = (page: SitePage) => {
    setSelectedPage(page);
    setIsEditorOpen(true);
  };

  const handleSaveSuccess = (updatedPage: SitePage) => {
    setPages(prev => prev.map(p => (p.id === updatedPage.id || p.slug === updatedPage.slug) ? updatedPage : p));
    showToast(`Page "${updatedPage.title}" updated and saved successfully!`);
  };

  const filteredPages = pages.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.seoDescription && p.seoDescription.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900/90 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-emerald-500/40 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-900/90 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-red-500/40 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E96BA8]/10 text-[#E96BA8] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Footer & Legal CMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Site Information & Legal Pages
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Manage content, rich text formatting, and search engine metadata for <code className="bg-white/80 px-1 py-0.5 rounded text-pink-700 font-mono">/privacy-policy</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-pink-700 font-mono">/terms-of-service</code>, and <code className="bg-white/80 px-1 py-0.5 rounded text-pink-700 font-mono">/sitemap</code>. Stored persistently in <code className="bg-white/80 px-1 py-0.5 rounded text-slate-700 font-mono">data/site-pages.json</code>.
            </p>
          </div>

          <button
            onClick={fetchPages}
            disabled={loading}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:border-[#E96BA8] text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E96BA8]' : 'text-slate-500'}`} />
            <span>Reload Pages</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-pink-500/10">
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Managed Pages</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{pages.length}</span>
            <span className="text-[11px] text-slate-400">All saved in JSON store</span>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Search Engine Status</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {pages.filter(p => !p.isNoIndex).length} Indexed
            </span>
            <span className="text-[11px] text-slate-400">SSR HTML enabled</span>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Security & XSS</span>
            <span className="text-2xl font-extrabold text-[#E96BA8] mt-1 block">Sanitized</span>
            <span className="text-[11px] text-slate-400">Strict AST XSS shield</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#E96BA8]"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredPages.length} of {pages.length} pages
        </div>
      </div>

      {/* Pages Card Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPages.map((page) => {
          const formattedDate = page.updatedAt
            ? new Date(page.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : 'Default';

          return (
            <div
              key={page.id || page.slug}
              className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs hover:border-[#E96BA8]/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#E96BA8] flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {page.title}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono font-bold rounded-full">
                    /{page.slug}
                  </span>
                  {page.isNoIndex ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                      noindex
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      index, follow
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                  {page.seoDescription || (page.content ? page.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : 'No description available')}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Updated: {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    SEO Title: <strong className="text-slate-700 font-medium truncate max-w-xs">{page.seoTitle || `${page.title} | WeLovePattern`}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="View live public page in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Public Page</span>
                </a>

                <button
                  onClick={() => handleEditClick(page)}
                  className="px-5 py-2 bg-[#E96BA8] hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Content</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {selectedPage && isEditorOpen && (
        <PageEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedPage(null);
          }}
          page={selectedPage}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};
