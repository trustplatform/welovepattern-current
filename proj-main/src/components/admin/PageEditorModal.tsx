import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Save, 
  Eye, 
  FileText, 
  Settings, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Code, 
  RemoveFormatting, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Globe, 
  AlertCircle, 
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';
import { SitePage } from '../../types';
import { DEFAULT_SITE_PAGES } from '../../data/defaultSitePages';

interface PageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: SitePage;
  onSaveSuccess: (updatedPage: SitePage) => void;
}

export const PageEditorModal: React.FC<PageEditorModalProps> = ({
  isOpen,
  onClose,
  page,
  onSaveSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'preview'>('editor');
  
  // Form states
  const [title, setTitle] = useState(page.title);
  const [contentHtml, setContentHtml] = useState(page.content);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || '');
  const [canonicalUrl, setCanonicalUrl] = useState(page.canonicalUrl || '');
  const [isNoIndex, setIsNoIndex] = useState(Boolean(page.isNoIndex));

  // Editor states
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state on page change
  useEffect(() => {
    setTitle(page.title);
    setContentHtml(page.content);
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setCanonicalUrl(page.canonicalUrl || '');
    setIsNoIndex(Boolean(page.isNoIndex));
    setErrorMsg(null);

    if (editorRef.current && !isHtmlMode) {
      editorRef.current.innerHTML = page.content;
    }
  }, [page, isOpen]);

  // Synchronize HTML with contentEditable when switching from HTML mode back to WYSIWYG
  useEffect(() => {
    if (!isHtmlMode && editorRef.current) {
      if (editorRef.current.innerHTML !== contentHtml) {
        editorRef.current.innerHTML = contentHtml;
      }
    }
  }, [isHtmlMode]);

  if (!isOpen) return null;

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML;
      setContentHtml(updated);
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    if (val === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (val === 'blockquote') {
      execCmd('formatBlock', '<blockquote>');
    } else {
      execCmd('formatBlock', `<${val}>`);
    }
    e.target.value = '';
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    if (linkText.trim()) {
      const safeHref = linkUrl.trim().startsWith('http') || linkUrl.trim().startsWith('mailto:') || linkUrl.trim().startsWith('/')
        ? linkUrl.trim()
        : `https://${linkUrl.trim()}`;
      const linkHtml = `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      execCmd('createLink', linkUrl.trim());
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  const handleResetToDefault = () => {
    const defaultPage = DEFAULT_SITE_PAGES.find(p => p.id === page.id || p.slug === page.slug);
    if (defaultPage) {
      if (window.confirm('Reset this page content and SEO metadata to default template? Unsaved changes will be lost.')) {
        setTitle(defaultPage.title);
        setContentHtml(defaultPage.content);
        setSeoTitle(defaultPage.seoTitle || '');
        setSeoDescription(defaultPage.seoDescription || '');
        setCanonicalUrl(defaultPage.canonicalUrl || '');
        setIsNoIndex(Boolean(defaultPage.isNoIndex));
        if (editorRef.current) {
          editorRef.current.innerHTML = defaultPage.content;
        }
      }
    }
  };

  const handleSave = async () => {
    let finalContent = contentHtml;
    if (editorRef.current && !isHtmlMode) {
      finalContent = editorRef.current.innerHTML;
    }

    if (!title.trim()) {
      setErrorMsg('Page title cannot be empty.');
      return;
    }

    if (!finalContent.trim()) {
      setErrorMsg('Page content cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        content: finalContent,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        canonicalUrl: canonicalUrl.trim(),
        isNoIndex: Boolean(isNoIndex)
      };

      const res = await fetch(`/api/admin/pages/${page.id || page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success && data.page) {
        onSaveSuccess(data.page);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to save page changes.');
      }
    } catch (err: any) {
      console.error('Error saving page:', err);
      setErrorMsg(err.message || 'Network error while saving page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#E96BA8] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Edit Page: {title || page.title}
                </h2>
                <span className="px-2.5 py-0.5 bg-slate-200/80 text-slate-700 text-xs font-mono font-bold rounded-full">
                  /{page.slug}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Persistent storage in <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700 font-mono">data/site-pages.json</code> with full SSR support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              title="Reset to default template"
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Template</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-4 bg-white">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Content & Text Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'seo'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>SEO & Meta Tags</span>
            {isNoIndex && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">
                noindex
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (editorRef.current && !isHtmlMode) {
                setContentHtml(editorRef.current.innerHTML);
              }
              setActiveTab('preview');
            }}
            className={`py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          
          {/* TAB 1: CONTENT & RICH TEXT EDITOR */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Page Display Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 font-semibold text-base focus:outline-none focus:border-[#E96BA8] shadow-2xs"
                />
              </div>

              {/* Rich Text Editor Container */}
              <div className="border border-slate-300 rounded-2xl bg-white shadow-xs overflow-hidden">
                {/* Toolbar */}
                <div className="p-2 border-b border-slate-200 bg-slate-100/80 flex flex-wrap items-center gap-1.5 text-slate-700">
                  {/* Headings Selector */}
                  <select
                    disabled={isHtmlMode}
                    onChange={handleHeadingChange}
                    defaultValue=""
                    className="bg-white border border-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>Format Block</option>
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1 (H1)</option>
                    <option value="h2">Heading 2 (H2)</option>
                    <option value="h3">Heading 3 (H3)</option>
                    <option value="blockquote">Quote Block</option>
                  </select>

                  <div className="h-5 w-px bg-slate-300 mx-1" />

                  {/* Inline Formatting */}
                  <button
                    type="button"
                    title="Bold (Ctrl+B)"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('bold')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Italic (Ctrl+I)"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('italic')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Underline (Ctrl+U)"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('underline')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Strikethrough"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('strikeThrough')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-slate-300 mx-1" />

                  {/* Lists */}
                  <button
                    type="button"
                    title="Bullet List"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('insertUnorderedList')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <List className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Numbered List"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('insertOrderedList')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Blockquote"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('formatBlock', '<blockquote>')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-slate-300 mx-1" />

                  {/* Links */}
                  <button
                    type="button"
                    title="Insert Link"
                    disabled={isHtmlMode}
                    onClick={() => setShowLinkModal(true)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Clear Formatting"
                    disabled={isHtmlMode}
                    onClick={() => execCmd('removeFormat')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RemoveFormatting className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-slate-300 mx-1" />

                  {/* HTML Source Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isHtmlMode && editorRef.current) {
                        setContentHtml(editorRef.current.innerHTML);
                      }
                      setIsHtmlMode(!isHtmlMode);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isHtmlMode
                        ? 'bg-[#E96BA8] text-white border-[#E96BA8]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{isHtmlMode ? 'WYSIWYG View' : 'HTML Source'}</span>
                  </button>
                </div>

                {/* Editor Content Surface */}
                {isHtmlMode ? (
                  <textarea
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    rows={16}
                    className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 focus:outline-none resize-y"
                    placeholder="Enter raw HTML content here..."
                  />
                ) : (
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={() => {
                      if (editorRef.current) {
                        setContentHtml(editorRef.current.innerHTML);
                      }
                    }}
                    className="site-page-prose p-6 min-h-[360px] max-h-[500px] overflow-y-auto focus:outline-none bg-white text-slate-800"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SEO & METADATA */}
          {activeTab === 'seo' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#E96BA8]" />
                  <span>Search Engine Optimization (SEO) Metadata</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Customized title, meta description, and robot indexing instructions rendered via Server-Side Rendering (SSR).
                </p>

                {/* SEO Title */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      SEO Title (Meta Title)
                    </label>
                    <span className={`text-xs ${seoTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {seoTitle.length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`${title} | WeLovePattern`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#E96BA8]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Appears as the clickable headline in Google and Bing search results.</p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Meta Description
                    </label>
                    <span className={`text-xs ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {seoDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Brief description of this page for search engine snippet..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#E96BA8]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Target 120-160 characters for optimal snippet display.</p>
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Canonical URL Override
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`https://welovepattern.com/${page.slug}`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#E96BA8]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave blank to use default <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">https://welovepattern.com/{page.slug}</code>.</p>
                </div>

                {/* NoIndex Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      Search Engine Indexing
                    </label>
                    <p className="text-xs text-slate-500">
                      {isNoIndex ? 'Currently set to noindex, nofollow (Search engines will ignore this page)' : 'Currently set to index, follow (Recommended for public pages)'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNoIndex}
                      onChange={(e) => setIsNoIndex(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* Google Search Snippet Simulation */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Google Search Snippet Preview
                </h4>
                <div className="font-sans max-w-xl">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                    <span className="font-medium text-slate-800">WeLovePattern</span>
                    <span>›</span>
                    <span>{page.slug}</span>
                  </div>
                  <div className="text-[#1a0dab] font-medium text-lg leading-tight hover:underline cursor-pointer truncate">
                    {seoTitle || `${title} | WeLovePattern`}
                  </div>
                  <div className="text-[#4d5156] text-xs leading-relaxed mt-1 line-clamp-2">
                    {seoDescription || `Read ${title} on WeLovePattern. 100% free crochet patterns, craft calculators, and maker guides.`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <span className="px-3 py-1 bg-pink-50 text-[#E96BA8] border border-pink-100 rounded-full text-xs font-bold uppercase tracking-wider">
                  Live Preview Mode
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
                  {title}
                </h1>
                <p className="text-xs text-slate-400">
                  Simulated visitor rendering with active typography formatting
                </p>
              </div>

              <div
                className="site-page-prose text-slate-800 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isNoIndex && <span className="text-amber-600 font-bold mr-2">⚠️ noindex active</span>}
            <span>HTML content will be sanitized on save</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-7 py-2.5 rounded-full bg-[#E96BA8] hover:bg-pink-600 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Publish Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#E96BA8]" />
              Insert Hyperlink
            </h3>
            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link URL (href)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="https://welovepattern.com/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#E96BA8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Anchor Text (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Read full guide"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#E96BA8]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#E96BA8] text-white text-xs font-bold hover:bg-pink-600 shadow-xs"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
