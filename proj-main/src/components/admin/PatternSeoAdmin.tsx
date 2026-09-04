import React, { useState, useEffect } from 'react';
import { Pattern, PatternSeoArticle } from '../../types';
import { PatternSeoEditorModal } from './PatternSeoEditorModal';
import { PatternSeoPreviewModal } from './PatternSeoPreviewModal';
import { 
  Search, 
  Sparkles, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Filter,
  Check,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { handleImageError } from '../../utils/imageUtils';

interface PatternSeoAdminProps {
  patterns: Pattern[];
}

export const PatternSeoAdmin: React.FC<PatternSeoAdminProps> = ({ patterns }) => {
  const [articles, setArticles] = useState<PatternSeoArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'none'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<PatternSeoArticle | null>(null);
  const [targetPattern, setTargetPattern] = useState<Pattern | null>(null);

  const [previewArticle, setPreviewArticle] = useState<PatternSeoArticle | null>(null);

  // Delete modal state
  const [articleToDelete, setArticleToDelete] = useState<PatternSeoArticle | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Fetch all Pattern SEO articles (Admin endpoint returns both draft and published)
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pattern-seo', {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setArticles(data);
        }
      } else {
        setErrorToast('Failed to fetch pattern SEO articles');
      }
    } catch (err: any) {
      console.error('Error fetching SEO articles:', err);
      setErrorToast(err.message || 'Network error fetching articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Find article for a given pattern
  const getArticleForPattern = (pattern: Pattern): PatternSeoArticle | undefined => {
    return articles.find(
      a => a.patternId === pattern.id || a.patternSlug === pattern.slug || a.patternId === pattern.slug
    );
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (article: PatternSeoArticle) => {
    try {
      const isPublished = article.status === 'published';
      const action = isPublished ? 'unpublish' : 'publish';

      const res = await fetch(`/api/admin/pattern-seo/${article.id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        const updated = {
          ...article,
          status: (isPublished ? 'draft' : 'published') as 'draft' | 'published',
          updatedAt: new Date().toISOString()
        };
        setArticles(prev => prev.map(a => a.id === article.id ? updated : a));
        showToast(`Article ${isPublished ? 'unpublished to draft' : 'published successfully'}!`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update article status', true);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', true);
    }
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/pattern-seo/${articleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
        showToast('SEO Article deleted successfully');
        setArticleToDelete(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete article', true);
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting article', true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle open editor for specific pattern or existing article
  const handleOpenCreateOrEdit = (pattern: Pattern, existingArticle?: PatternSeoArticle) => {
    setTargetPattern(pattern);
    setSelectedArticle(existingArticle || null);
    setIsEditorOpen(true);
  };

  const handleArticleSaved = (saved: PatternSeoArticle) => {
    setArticles(prev => {
      const exists = prev.some(a => a.id === saved.id || a.patternId === saved.patternId);
      if (exists) {
        return prev.map(a => (a.id === saved.id || a.patternId === saved.patternId) ? saved : a);
      }
      return [saved, ...prev];
    });
  };

  // Unique categories
  const categories: string[] = Array.from(new Set(patterns.map(p => p.category))).filter((c): c is string => Boolean(c));

  // Compute Stats
  const totalPatterns = patterns.length;
  const publishedCount = patterns.filter(p => {
    const art = getArticleForPattern(p);
    return art && art.status === 'published';
  }).length;
  const draftCount = patterns.filter(p => {
    const art = getArticleForPattern(p);
    return art && art.status === 'draft';
  }).length;
  const missingCount = totalPatterns - publishedCount - draftCount;
  const coveragePercent = totalPatterns > 0 ? Math.round((publishedCount / totalPatterns) * 100) : 0;

  // Filter patterns
  const filteredPatterns = patterns.filter(p => {
    const article = getArticleForPattern(p);
    
    // Search query matching
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchArticleTitle = article ? article.title.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchSlug && !matchCategory && !matchArticleTitle) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== 'all' && p.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'published') {
      return article && article.status === 'published';
    }
    if (statusFilter === 'draft') {
      return article && article.status === 'draft';
    }
    if (statusFilter === 'none') {
      return !article;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notifications */}
      {successToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Info & Stats Summary */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8]">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Pattern SEO &amp; Helpful Content CMS
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage in-depth helpful maker guides for every pattern. Articles are rendered with SSR above Maker Reviews for optimal Google &amp; Bing rankings.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchArticles}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Content</span>
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Patterns
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalPatterns}
            </span>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              Published Articles
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {publishedCount}
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
              Drafts in Progress
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {draftCount}
            </span>
          </div>

          <div className="bg-pink-50/60 dark:bg-pink-950/30 p-4 rounded-2xl border border-pink-200/60 dark:border-pink-800/40">
            <span className="text-[11px] font-bold text-[#E96BA8] uppercase tracking-wider block mb-1">
              SEO Coverage
            </span>
            <span className="text-2xl font-black text-[#E96BA8]">
              {coveragePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patterns by title, slug, or article keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#E96BA8] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All ({patterns.length})
          </button>
          
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Published ({publishedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Drafts ({draftCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('none')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'none'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            No Article Yet ({missingCount})
          </button>
        </div>
      </div>

      {/* Patterns & SEO Content Table/List */}
      <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
        
        {filteredPatterns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching patterns found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords or filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredPatterns.map(pattern => {
              const article = getArticleForPattern(pattern);
              const isPublished = article?.status === 'published';
              const isDraft = article?.status === 'draft';
              const hasArticle = !!article;

              return (
                <div 
                  key={pattern.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                >
                  {/* Pattern Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={pattern.image}
                      alt={pattern.title}
                      onError={handleImageError}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {pattern.category}
                        </span>

                        {isPublished && (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Published SEO</span>
                          </span>
                        )}

                        {isDraft && (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Draft Article</span>
                          </span>
                        )}

                        {!hasArticle && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-400">
                            No SEO Article
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {pattern.title}
                      </h3>

                      {hasArticle ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                          <span className="text-slate-400">Article Title:</span> {article.title}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Click "Write Article" to craft a helpful search-optimized guide for this pattern.
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Slug: <code className="text-[#E96BA8]">/pattern/{pattern.slug}</code></span>
                        {article?.updatedAt && (
                          <span>• Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    
                    {hasArticle ? (
                      <>
                        {/* Live Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewArticle(article)}
                          title="Preview SEO article layout"
                          className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#E96BA8]" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCreateOrEdit(pattern, article)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Article</span>
                        </button>

                        {/* One-click Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(article)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isPublished
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Delete Article Button */}
                        <button
                          type="button"
                          onClick={() => setArticleToDelete(article)}
                          title="Delete SEO Article"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCreateOrEdit(pattern)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E96BA8] hover:bg-pink-600 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Write SEO Article</span>
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <PatternSeoEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedArticle(null);
            setTargetPattern(null);
          }}
          patterns={patterns}
          initialArticle={selectedArticle}
          targetPattern={targetPattern}
          onSaved={handleArticleSaved}
        />
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <PatternSeoPreviewModal
          isOpen={!!previewArticle}
          onClose={() => setPreviewArticle(null)}
          article={previewArticle}
        />
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete SEO Article?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete the SEO article for <strong>{articleToDelete.patternTitle || articleToDelete.patternId}</strong>? This cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteArticle}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
