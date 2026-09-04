import React, { useState, useEffect, useRef } from 'react';
import { Pattern, PatternSeoArticle } from '../../types';
import { PatternSeoRichTextEditor } from './PatternSeoRichTextEditor';
import { PatternSeoPreviewModal } from './PatternSeoPreviewModal';
import { 
  X, 
  Save, 
  Eye, 
  Send, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Globe,
  Tag,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { handleImageError } from '../../utils/imageUtils';

interface PatternSeoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patterns: Pattern[];
  initialArticle?: PatternSeoArticle | null;
  targetPattern?: Pattern | null;
  onSaved: (article: PatternSeoArticle) => void;
}

export const PatternSeoEditorModal: React.FC<PatternSeoEditorModalProps> = ({
  isOpen,
  onClose,
  patterns,
  initialArticle,
  targetPattern,
  onSaved
}) => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>(
    initialArticle?.patternId || targetPattern?.id || (patterns.length > 0 ? patterns[0].id : '')
  );

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [author, setAuthor] = useState<string>('WeLovePattern');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string>('');
  
  // Advanced SEO meta fields
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [canonicalUrl, setCanonicalUrl] = useState<string>('');
  const [showSeoMeta, setShowSeoMeta] = useState<boolean>(false);

  // Status & UI States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [hasMissingAltInContent, setHasMissingAltInContent] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or article changes
  useEffect(() => {
    if (isOpen) {
      if (initialArticle) {
        setSelectedPatternId(initialArticle.patternId);
        setTitle(initialArticle.title || '');
        setContent(initialArticle.content || '');
        setAuthor(initialArticle.author || 'WeLovePattern');
        setStatus(initialArticle.status || 'published');
        setFeaturedImage(initialArticle.featuredImage || '');
        setFeaturedImageAlt(initialArticle.featuredImageAlt || '');
        setSeoTitle(initialArticle.seoTitle || '');
        setSeoDescription(initialArticle.seoDescription || '');
        setKeywords(initialArticle.keywords || '');
        setCanonicalUrl(initialArticle.canonicalUrl || '');
      } else if (targetPattern) {
        setSelectedPatternId(targetPattern.id);
        setTitle(`How to Crochet the ${targetPattern.title}: Helpful Maker Guide & Tips`);
        setContent(`<h2>How to Crochet the ${targetPattern.title}</h2><p>Welcome to the comprehensive maker guide for the <strong>${targetPattern.title}</strong>. Whether you are crafting this for yourself, as a gift, or for a craft fair, follow these curated tips and step-by-step notes for a flawless finish.</p><h2>Recommended Yarn &amp; Tension Tips</h2><h3>Selecting the Best Fiber</h3><p>For this project, using ${targetPattern.yarnWeight || 'worsted weight'} yarn ensures great stitch definition and soft texture.</p><h3>Hook Sizing Advice</h3><p>We recommend using a ${targetPattern.hookSize || '5.0 mm'} crochet hook to match the pattern gauge.</p><h2>Frequently Asked Questions</h2><h3>What skill level is needed?</h3><p>This pattern is rated as <strong>${targetPattern.difficulty}</strong>, making it approachable with clear row-by-row instructions.</p>`);
        setAuthor('WeLovePattern');
        setStatus('published');
        setFeaturedImage(targetPattern.image || '');
        setFeaturedImageAlt(`Completed handmade ${targetPattern.title} crochet project`);
        setSeoTitle(`How to Crochet ${targetPattern.title} - Guide & Tips`);
        setSeoDescription(`Learn how to crochet the ${targetPattern.title} with expert tips on materials, tension, stitch techniques, and assembly.`);
        setKeywords(targetPattern.tags ? targetPattern.tags.join(', ') : '');
        setCanonicalUrl('');
      } else {
        const first = patterns[0];
        setSelectedPatternId(first ? first.id : '');
        setTitle(first ? `How to Crochet the ${first.title}` : '');
        setContent('');
        setAuthor('WeLovePattern');
        setStatus('draft');
        setFeaturedImage('');
        setFeaturedImageAlt('');
        setSeoTitle('');
        setSeoDescription('');
        setKeywords('');
        setCanonicalUrl('');
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialArticle, targetPattern, patterns]);

  if (!isOpen) return null;

  const currentPattern = patterns.find(p => p.id === selectedPatternId);

  // Handle Image Upload for Featured Image
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image exceeds maximum 5MB size limit');
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/admin/pattern-seo/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64Data, fileName: file.name })
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setFeaturedImage(data.url);
          if (!featuredImageAlt) {
            setFeaturedImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
        } else {
          setErrorMessage(data.error || 'Failed to upload featured image');
        }
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read image file');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload error');
      setIsUploadingImage(false);
    }
  };

  // Construct current article object for preview or saving
  const buildArticlePayload = (targetStatus: 'draft' | 'published'): PatternSeoArticle => {
    return {
      id: initialArticle?.id || `seo_${selectedPatternId}_${Date.now().toString(36)}`,
      patternId: selectedPatternId,
      patternSlug: currentPattern?.slug || '',
      patternTitle: currentPattern?.title || '',
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || 'WeLovePattern',
      featuredImage: featuredImage.trim(),
      featuredImageAlt: featuredImageAlt.trim(),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      keywords: keywords.trim(),
      canonicalUrl: canonicalUrl.trim(),
      status: targetStatus,
      createdAt: initialArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    if (!selectedPatternId) {
      setErrorMessage('Please select a target pattern for this SEO article');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Article Title is required');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Article Content is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = buildArticlePayload(targetStatus);

    try {
      const endpoint = initialArticle?.id 
        ? `/api/admin/pattern-seo/${initialArticle.id}` 
        : `/api/admin/pattern-seo`;
      
      const method = initialArticle?.id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && (data.article || data.success)) {
        const saved = data.article || payload;
        setSuccessMessage(`SEO Article ${targetStatus === 'published' ? 'published' : 'saved as draft'} successfully!`);
        onSaved(saved);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to save SEO article');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving SEO article');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreviewArticle = buildArticlePayload(status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-[#E96BA8]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {initialArticle ? 'Edit Pattern SEO Content' : 'Create Pattern SEO Content'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helpful articles render seamlessly above Maker Reviews with SSR &amp; rich semantic markup.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {hasMissingAltInContent && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>One or more images in your article content is missing ALT text. Please add ALT descriptions for full search engine accessibility.</span>
            </div>
          )}

          {/* Target Pattern Selector & Status Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Target Pattern <span className="text-[#E96BA8]">*</span>
              </label>
              <select
                value={selectedPatternId}
                disabled={!!initialArticle}
                onChange={(e) => setSelectedPatternId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8] cursor-pointer disabled:opacity-70"
              >
                {patterns.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category}) - /pattern/{p.slug}
                  </option>
                ))}
              </select>
              {currentPattern && (
                <p className="text-[11px] text-slate-400">
                  Target URL: <code className="text-[#E96BA8]">/pattern/{currentPattern.slug}</code>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Article Status
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    status === 'draft'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    status === 'published'
                      ? 'bg-[#E96BA8] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Published
                </button>
              </div>
            </div>

          </div>

          {/* Article Title & Author */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Article Main Heading (Renders as H2) <span className="text-[#E96BA8]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Crochet the Cozy Sunburst Granny Square Blanket"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Author Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="WeLovePattern"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
              />
            </div>
          </div>

          {/* Featured Image & Alt Text */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#E96BA8]" />
                Featured Article Image (Optional)
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFeaturedImageUpload}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#E96BA8] hover:text-pink-600 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingImage ? 'Uploading...' : 'Upload Image from Device'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /uploads/pattern-seo/..."
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Image ALT text description (e.g. Handmade crochet blanket folded)"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>
            </div>

            {featuredImage && (
              <div className="relative w-full max-h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                <img
                  src={featuredImage}
                  alt={featuredImageAlt || 'Preview'}
                  onError={handleImageError}
                  className="w-full h-36 object-cover"
                />
              </div>
            )}
          </div>

          {/* Article Rich Text Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Article Rich Content <span className="text-[#E96BA8]">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Semantic H2, H3, H4, Lists &amp; Formatting (No H1)
              </span>
            </div>

            <PatternSeoRichTextEditor
              initialValue={content}
              onChange={(updated) => setContent(updated)}
              onImageMissingAlt={(missing) => setHasMissingAltInContent(missing)}
            />
          </div>

          {/* Collapsible SEO Meta & Tags Accordion */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/40">
            <button
              type="button"
              onClick={() => setShowSeoMeta(!showSeoMeta)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E96BA8]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Search Engine Metadata (SEO Title, Meta Description, Keywords, Canonical)
                </span>
              </div>
              {showSeoMeta ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showSeoMeta && (
              <div className="p-4 pt-0 space-y-4 border-t border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      SEO Title (Overrides default pattern page title if set)
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="e.g. How to Crochet Cute Sunburst Blanket - Free Tutorial"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Target Keywords (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="crochet blanket guide, sunburst granny square, puff stitch tips"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Meta Description (150-160 characters recommended for search snippets)
                  </label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Step-by-step crochet guide with materials, yarn weights, and expert assembly tips..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Custom Canonical URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://welovepattern.com/pattern/slug"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-[#E96BA8]" />
            <span>Live Preview</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('draft')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('published')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E96BA8] hover:bg-pink-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Publish Article'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Embedded Live Preview Modal */}
      {isPreviewOpen && (
        <PatternSeoPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          article={currentPreviewArticle}
        />
      )}
    </div>
  );
};
