import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { BlogEditorModal } from './BlogEditorModal';
import { BlogPreviewModal } from './BlogPreviewModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Globe, 
  AlertTriangle, 
  FolderCheck,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

export const BlogAdmin: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modals
  const [activeEditorPost, setActiveEditorPost] = useState<BlogPost | null>(null);
  const [activePreviewPost, setActivePreviewPost] = useState<BlogPost | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<BlogPost | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Posts from backend API
  // Helper for admin headers
  const getAdminHeaders = (contentType = 'application/json') => {
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;
    return headers;
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blog', {
        credentials: 'include',
        headers: getAdminHeaders('')
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPosts(data);
      } else {
        setError(data.error || 'Failed to fetch blog posts');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Save Post Handler (Create or Update)
  const handleSavePost = async (updatedPost: BlogPost, autoPublish?: boolean) => {
    try {
      let url = '/api/admin/blog';
      let method = 'POST';

      const exists = posts.some(p => p.id === updatedPost.id);
      if (exists) {
        url = `/api/admin/blog/${updatedPost.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: getAdminHeaders('application/json'),
        credentials: 'include',
        body: JSON.stringify(updatedPost)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(exists ? 'Article updated successfully!' : 'New article created!');
        fetchPosts();
        if (autoPublish) {
          setActiveEditorPost(null);
        }
      } else {
        throw new Error(data.error || 'Failed to save article');
      }
    } catch (err: any) {
      alert(err.message || 'Save error');
      throw err;
    }
  };

  // Delete Post Handler
  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(''),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Article deleted');
        setDeleteConfirmPost(null);
        fetchPosts();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert('Delete failed');
    }
  };

  // Duplicate Post Handler
  const handleDuplicatePost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${id}/duplicate`, {
        method: 'POST',
        headers: getAdminHeaders(''),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Article duplicated as draft');
        fetchPosts();
      } else {
        alert(data.error || 'Duplicate failed');
      }
    } catch (err: any) {
      alert('Duplicate error');
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (post: BlogPost) => {
    const isPublish = post.status !== 'published';
    const endpoint = `/api/admin/blog/${post.id}/${isPublish ? 'publish' : 'unpublish'}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAdminHeaders(''),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isPublish ? 'Article published live!' : 'Article set to draft');
        fetchPosts();
      } else {
        alert(data.error || 'Publish toggle failed');
      }
    } catch (err: any) {
      alert('Toggle status error');
    }
  };

  // Create Blank New Post
  const handleCreateNew = () => {
    const newPost: BlogPost = {
      id: `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slug: '',
      title: '',
      excerpt: '',
      content: '<h2>Introduction</h2><p>Write your article content here...</p>',
      category: 'Crochet Guides',
      author: 'WeLovePattern Team',
      authorRole: 'Editorial Maker',
      authorAvatar: '',
      date: new Date().toISOString().split('T')[0],
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Crochet yarn and hooks sample',
      tags: ['crochet', 'tutorial'],
      status: 'draft',
      seoMeta: {
        metaTitle: '',
        metaDescription: '',
        isNoIndex: false,
        isNoFollow: false
      }
    };
    setActiveEditorPost(newPost);
  };

  // Filter & Sort Logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // Calculate Statistics
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const categoriesList = Array.from(new Set(posts.map(p => p.category)));

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-slate-800 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP CMS HEADER STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] flex items-center justify-center font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Articles</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalPosts}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Live</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{publishedCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{draftCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center font-black">
            <FolderCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{categoriesList.length}</h3>
          </div>
        </div>

      </div>

      {/* FILTER & ACTIONS TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, slug, tag, category..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#E96BA8]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPosts}
            className="p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Create New Post Button */}
          <button
            onClick={handleCreateNew}
            className="bg-[#E96BA8] text-white hover:bg-pink-600 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Blog Article</span>
          </button>

        </div>

      </div>

      {/* POSTS TABLE / LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        
        {loading && posts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#E96BA8]" />
            <p className="text-sm">Loading blog CMS data...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 font-bold space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p>{error}</p>
            <button onClick={fetchPosts} className="underline text-xs cursor-pointer">Retry</button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No articles match your filters.</p>
            <button
              onClick={handleCreateNew}
              className="bg-[#E96BA8] text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-5">Article</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Author</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">SEO Score</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredPosts.map(post => {
                  const hasMetaTitle = Boolean(post.seoMeta?.metaTitle || post.title);
                  const hasMetaDesc = Boolean(post.seoMeta?.metaDescription || post.excerpt);
                  const hasAlt = Boolean(post.imageAlt);
                  const seoScore = [hasMetaTitle, hasMetaDesc, hasAlt].filter(Boolean).length; // 0 to 3

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Featured Thumbnail & Title */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.image || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'}
                            alt={post.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          />
                          <div className="truncate space-y-0.5">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                              {post.title || 'Untitled Article'}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400 truncate">
                              /blog/{post.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          post.status === 'published'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                        {post.category || 'General'}
                      </td>

                      {/* Author */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {post.author || 'Editorial'}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {post.date}
                      </td>

                      {/* SEO Score */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                            seoScore === 3
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                          }`}>
                            {seoScore === 3 ? '100% Complete' : `${seoScore}/3 Checks`}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Preview Button */}
                          <button
                            onClick={() => setActivePreviewPost(post)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-sky-500 transition-colors cursor-pointer"
                            title="Preview Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Publish / Unpublish Toggle */}
                          <button
                            onClick={() => handleTogglePublish(post)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer"
                            title={post.status === 'published' ? 'Unpublish to Draft' : 'Publish Live'}
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setActiveEditorPost(post)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-[#E96BA8] transition-colors cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            onClick={() => handleDuplicatePost(post.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-purple-500 transition-colors cursor-pointer"
                            title="Duplicate Article"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmPost(post)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* EDITOR MODAL */}
      {activeEditorPost && (
        <BlogEditorModal
          post={activeEditorPost}
          onSave={handleSavePost}
          onClose={() => setActiveEditorPost(null)}
          onPreview={(postToPreview) => setActivePreviewPost(postToPreview)}
        />
      )}

      {/* PREVIEW MODAL */}
      {activePreviewPost && (
        <BlogPreviewModal
          post={activePreviewPost}
          onClose={() => setActivePreviewPost(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Delete Article?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirmPost.title}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmPost(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(deleteConfirmPost.id)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
