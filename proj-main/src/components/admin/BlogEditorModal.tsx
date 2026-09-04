import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, BlogSeoMeta } from '../../types';
import { BlogRichTextEditor } from './BlogRichTextEditor';
import { 
  X, 
  Save, 
  Send, 
  Eye, 
  Upload, 
  AlertTriangle, 
  Globe, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Share2, 
  ShieldAlert,
  Clock
} from 'lucide-react';

interface BlogEditorModalProps {
  post: BlogPost;
  onSave: (updatedPost: BlogPost, autoPublish?: boolean) => Promise<void>;
  onClose: () => void;
  onPreview: (postToPreview: BlogPost) => void;
}

export const BlogEditorModal: React.FC<BlogEditorModalProps> = ({
  post,
  onSave,
  onClose,
  onPreview
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [formData, setFormData] = useState<BlogPost>({ ...post });
  const [hasMissingAltInContent, setHasMissingAltInContent] = useState<boolean>(false);

  // Autosave states
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Uploading state
  const [isUploadingFeatured, setIsUploadingFeatured] = useState<boolean>(false);
  const [featuredUploadError, setFeaturedUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate slug from title automatically if slug is empty or matches previous title slug
  const handleTitleChange = (titleVal: string) => {
    const slugified = titleVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      title: titleVal,
      slug: prev.slug === '' || prev.slug === post.slug ? slugified : prev.slug,
      seoMeta: {
        ...prev.seoMeta,
        metaTitle: prev.seoMeta?.metaTitle || `${titleVal} | WeLovePattern Blog`,
        ogTitle: prev.seoMeta?.ogTitle || titleVal,
        twitterTitle: prev.seoMeta?.twitterTitle || titleVal
      }
    }));
  };

  // Debounced Autosave (saves as draft if not published)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setAutosaveState('saving');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await onSave(formData);
        setAutosaveState('saved');
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        setAutosaveState('error');
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [formData]);

  // Featured Image Upload
  const handleFeaturedImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingFeatured(true);
    setFeaturedUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        const res = await fetch('/api/admin/blog/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          setFormData(prev => ({
            ...prev,
            image: data.url,
            imageAlt: prev.imageAlt || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
          }));
        } else {
          setFeaturedUploadError(data.error || 'Failed to upload featured image');
        }
        setIsUploadingFeatured(false);
      };
      reader.onerror = () => {
        setFeaturedUploadError('Failed to read image file');
        setIsUploadingFeatured(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFeaturedUploadError(err.message || 'Upload error');
      setIsUploadingFeatured(false);
    }
  };

  const handlePublishToggle = async (publish: boolean) => {
    const updated = {
      ...formData,
      status: publish ? ('published' as const) : ('draft' as const),
      updatedAt: new Date().toISOString()
    };
    setFormData(updated);
    await onSave(updated, true);
  };

  // SEO Fields Helper
  const updateSeo = (field: keyof BlogSeoMeta, value: any) => {
    setFormData(prev => ({
      ...prev,
      seoMeta: {
        ...prev.seoMeta,
        [field]: value
      }
    }));
  };

  // Calculate ALT warnings
  const missingFeaturedAlt = !formData.imageAlt || !formData.imageAlt.trim();
  const totalAltWarnings = (missingFeaturedAlt ? 1 : 0) + (hasMissingAltInContent ? 1 : 0);

  const metaTitleLen = (formData.seoMeta?.metaTitle || formData.title || '').length;
  const metaDescLen = (formData.seoMeta?.metaDescription || formData.excerpt || '').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* HEADER */}
        <div className="bg-slate-950 text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                formData.status === 'published' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {formData.status === 'published' ? 'Published Article' : 'Draft Article'}
              </span>

              {/* Autosave Indicator */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5 ml-2">
                {autosaveState === 'saving' && (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> Saving draft...
                  </span>
                )}
                {autosaveState === 'saved' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                  </span>
                )}
                {autosaveState === 'error' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Save failed
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black mt-1 text-white truncate max-w-lg">
              {formData.title || 'New Blog Article'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPreview(formData)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Preview</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-100 dark:bg-slate-950 px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-white dark:bg-slate-900 text-[#E96BA8] shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Content & Media</span>
            </button>

            <button
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-white dark:bg-slate-900 text-[#E96BA8] shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>SEO & Social Sharing</span>
              {(metaTitleLen === 0 || metaDescLen === 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </div>

          {/* ALT WARNING BADGE */}
          {totalAltWarnings > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{totalAltWarnings} ALT text field(s) empty</span>
            </div>
          )}
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: CONTENT & MEDIA */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Master the Single Crochet Stitch Step by Step"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-sm">
                    <span className="text-slate-400 text-xs font-mono mr-1">/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="master-single-crochet"
                      className="w-full bg-transparent border-none outline-none font-mono text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Crochet Guides">Crochet Guides</option>
                    <option value="Stitches & Techniques">Stitches & Techniques</option>
                    <option value="Yarn & Supplies">Yarn & Supplies</option>
                    <option value="Free Patterns">Free Patterns</option>
                    <option value="Yarn Calculator">Yarn Calculator</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="WeLovePattern Team"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    value={formData.date ? formData.date.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Read Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime || ''}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="5 min read"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

              </div>

              {/* Featured Image Management */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#E96BA8]" /> Featured Image
                  </h4>
                  {missingFeaturedAlt && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-300">
                      <AlertTriangle className="w-3 h-3" /> Missing ALT Text
                    </span>
                  )}
                </div>

                {featuredUploadError && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{featuredUploadError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Image Preview Card */}
                  <div className="sm:col-span-1 h-36 bg-slate-200 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 relative flex items-center justify-center">
                    {formData.image ? (
                      <img src={formData.image} alt={formData.imageAlt || 'Featured'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">No image set</span>
                    )}
                  </div>

                  {/* Upload Controls & Fields */}
                  <div className="sm:col-span-2 space-y-3">
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="Image URL https://..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#E96BA8] text-white hover:bg-pink-600 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingFeatured ? 'Uploading...' : 'Upload'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFeaturedImageUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Image ALT Text (Required for SEO)
                        </label>
                        <input
                          type="text"
                          value={formData.imageAlt || ''}
                          onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                          placeholder="e.g. Single crochet stitch swatch with pink yarn"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Image Caption (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.imageCaption || ''}
                          onChange={(e) => setFormData({ ...formData, imageCaption: e.target.value })}
                          placeholder="e.g. Photo by WeLovePattern Studio"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Article Excerpt / Summary
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Brief 1-2 sentence overview shown in blog cards and search results..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#E96BA8]"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Article Body Content
                </label>
                <BlogRichTextEditor
                  initialValue={formData.content}
                  onChange={(newHtml) => setFormData(prev => ({ ...prev, content: newHtml }))}
                  onImageMissingAlt={(missing) => setHasMissingAltInContent(missing)}
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.tags ? formData.tags.join(', ') : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="crochet, beginner, stitch-guide, yarn"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

            </div>
          )}

          {/* TAB 2: SEO & SOCIAL SHARING */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              
              {/* Google Search Live Preview Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-sky-500" /> Live Google Search Snippet Preview
                </h4>
                
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 font-sans">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="truncate">https://welovepattern.com › blog › {formData.slug || 'article-slug'}</span>
                  </div>
                  <h3 className="text-blue-600 dark:text-blue-400 font-medium text-base hover:underline cursor-pointer truncate">
                    {formData.seoMeta?.metaTitle || formData.title || 'Article Title | WeLovePattern Blog'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {formData.seoMeta?.metaDescription || formData.excerpt || 'Article meta description will appear here...'}
                  </p>
                </div>
              </div>

              {/* Meta Title & Meta Description */}
              <div className="space-y-4">
                
                {/* Meta Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-black uppercase text-slate-500 dark:text-slate-400">
                      SEO Meta Title
                    </label>
                    <span className={`font-mono text-[11px] ${
                      metaTitleLen >= 50 && metaTitleLen <= 60 ? 'text-emerald-500 font-bold' : 'text-amber-500'
                    }`}>
                      {metaTitleLen} / 60 chars (Recommended: 50-60)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.seoMeta?.metaTitle || ''}
                    onChange={(e) => updateSeo('metaTitle', e.target.value)}
                    placeholder={`${formData.title || 'Article Title'} | WeLovePattern Blog`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-black uppercase text-slate-500 dark:text-slate-400">
                      SEO Meta Description
                    </label>
                    <span className={`font-mono text-[11px] ${
                      metaDescLen >= 140 && metaDescLen <= 160 ? 'text-emerald-500 font-bold' : 'text-amber-500'
                    }`}>
                      {metaDescLen} / 160 chars (Recommended: 140-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.seoMeta?.metaDescription || ''}
                    onChange={(e) => updateSeo('metaDescription', e.target.value)}
                    placeholder="Provide a compelling 150 character summary including target keywords for search engines..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                {/* Keywords & Canonical URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seoMeta?.metaKeywords || ''}
                      onChange={(e) => updateSeo('metaKeywords', e.target.value)}
                      placeholder="crochet, single crochet stitch, crochet tutorial"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      value={formData.seoMeta?.canonicalUrl || ''}
                      onChange={(e) => updateSeo('canonicalUrl', e.target.value)}
                      placeholder={`https://welovepattern.com/blog/${formData.slug || ''}`}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

              </div>

              {/* Open Graph & Twitter Cards */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-purple-500" /> Open Graph & Social Media Sharing (FB & Twitter)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">OG Title</label>
                    <input
                      type="text"
                      value={formData.seoMeta?.ogTitle || ''}
                      onChange={(e) => updateSeo('ogTitle', e.target.value)}
                      placeholder={formData.title}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">OG Image URL</label>
                    <input
                      type="text"
                      value={formData.seoMeta?.ogImage || ''}
                      onChange={(e) => updateSeo('ogImage', e.target.value)}
                      placeholder={formData.image}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Robots & Search Engine Indexing Controls */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Search Engine Indexing Directives
                </h4>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.seoMeta?.isNoIndex || false}
                      onChange={(e) => updateSeo('isNoIndex', e.target.checked)}
                      className="w-4 h-4 text-[#E96BA8] rounded border-slate-300 focus:ring-[#E96BA8]"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Hide from Google Search (<code className="text-amber-500">noindex</code>)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.seoMeta?.isNoFollow || false}
                      onChange={(e) => updateSeo('isNoFollow', e.target.checked)}
                      className="w-4 h-4 text-[#E96BA8] rounded border-slate-300 focus:ring-[#E96BA8]"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Do not follow links (<code className="text-amber-500">nofollow</code>)
                    </span>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-slate-950 p-4 sm:p-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Save as Draft */}
            <button
              type="button"
              onClick={() => handlePublishToggle(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Save as Draft</span>
            </button>

            {/* Publish / Unpublish Button */}
            {formData.status === 'published' ? (
              <button
                type="button"
                onClick={() => handlePublishToggle(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Unpublish (Set to Draft)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublishToggle(true)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Publish Post</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
