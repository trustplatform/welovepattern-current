import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Quote, 
  Minus, 
  RotateCcw, 
  RotateCw, 
  RemoveFormatting, 
  Code, 
  Eye, 
  Heading as HeadingIcon,
  Upload,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface BlogRichTextEditorProps {
  initialValue: string;
  onChange: (htmlContent: string) => void;
  onImageMissingAlt?: (hasMissingAlt: boolean) => void;
}

export const BlogRichTextEditor: React.FC<BlogRichTextEditorProps> = ({
  initialValue,
  onChange,
  onImageMissingAlt
}) => {
  const [htmlValue, setHtmlValue] = useState<string>(initialValue);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');

  // Image Modal
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialValue
  useEffect(() => {
    setHtmlValue(initialValue || '');
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (initialValue || '')) {
        editorRef.current.innerHTML = initialValue || '';
      }
    }
  }, [initialValue]);

  // Check for missing alt text in content images
  useEffect(() => {
    if (!htmlValue) {
      if (onImageMissingAlt) onImageMissingAlt(false);
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlValue, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));
    const missingAlt = images.some(img => !img.getAttribute('alt') || !img.getAttribute('alt')?.trim());
    if (onImageMissingAlt) {
      onImageMissingAlt(missingAlt);
    }
  }, [htmlValue, onImageMissingAlt]);

  // Execute standard DOM editor command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML;
      setHtmlValue(updated);
      onChange(updated);
    }
  };

  // Heading format
  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (val === 'blockquote') {
      execCmd('formatBlock', '<blockquote>');
    } else {
      execCmd('formatBlock', `<${val}>`);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML;
      setHtmlValue(updated);
      onChange(updated);
    }
  };

  const handleHtmlTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlValue(val);
    onChange(val);
  };

  const toggleHtmlView = () => {
    if (isHtmlMode) {
      setIsHtmlMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlValue;
        }
      }, 50);
    } else {
      setIsHtmlMode(true);
    }
  };

  // Insert Link
  const insertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http') || linkUrl.startsWith('/') ? linkUrl : `https://${linkUrl}`;
    const text = linkText || linkUrl;
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #E96BA8; text-decoration: underline; font-weight: bold;">${text}</a>`;

    if (isHtmlMode) {
      const updated = htmlValue + linkHtml;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', linkHtml);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Handle direct file upload for article inline image
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

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
          setImageUrl(data.url);
          if (!imageAlt) setImageAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        } else {
          setUploadError(data.error || 'Failed to upload image');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Upload error');
      setIsUploading(false);
    }
  };

  // Insert Image into content
  const insertImage = () => {
    if (!imageUrl) return;

    let imgHtml = '';
    if (imageCaption && imageCaption.trim()) {
      imgHtml = `<figure style="margin: 20px 0; text-align: center;"><img src="${imageUrl}" alt="${imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 16px; border: 1px solid #e2e8f0;" /><figcaption style="font-size: 13px; color: #64748b; margin-top: 8px; font-style: italic;">${imageCaption}</figcaption></figure>`;
    } else {
      imgHtml = `<img src="${imageUrl}" alt="${imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 16px; margin: 20px 0; border: 1px solid #e2e8f0;" />`;
    }

    if (isHtmlMode) {
      const updated = htmlValue + '\n' + imgHtml;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', imgHtml);
    }
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setUploadError(null);
  };

  // Horizontal divider
  const insertDivider = () => {
    if (isHtmlMode) {
      const updated = htmlValue + '\n<hr style="border: 0; border-top: 2px dashed #e2e8f0; margin: 24px 0;" />\n';
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHorizontalRule');
    }
  };

  // Stats
  const textOnly = htmlValue.replace(/<[^>]*>/g, ' ');
  const words = textOnly.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlValue, 'text/html');
  const imagesList = Array.from(doc.querySelectorAll('img'));
  const missingAltCount = imagesList.filter(img => !img.getAttribute('alt') || !img.getAttribute('alt')?.trim()).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-0">
      
      {/* TOOLBAR */}
      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-200">
        
        {/* Headings */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs">
          <HeadingIcon className="w-4 h-4 text-[#E96BA8]" />
          <select
            onChange={handleHeadingChange}
            disabled={isHtmlMode}
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer pr-1"
            defaultValue="p"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1 (H1)</option>
            <option value="h2">Heading 2 (H2)</option>
            <option value="h3">Heading 3 (H3)</option>
            <option value="blockquote">Blockquote</option>
          </select>
        </div>

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-800 mx-1" />

        {/* Basic Text Formatting */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('italic')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('underline')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Link, Image, Divider */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4 text-sky-500" />
          </button>

          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4 text-purple-500" />
          </button>

          <button
            type="button"
            onClick={insertDivider}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Clear & Undo/Redo */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('undo')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('redo')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHtmlView}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isHtmlMode
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
            }`}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-purple-500" />
                <span>Raw HTML</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* CANVAS */}
      <div className="relative min-h-[300px] bg-white dark:bg-slate-900">
        {isHtmlMode ? (
          <textarea
            value={htmlValue}
            onChange={handleHtmlTextareaChange}
            className="w-full h-[320px] p-5 font-mono text-xs text-purple-300 bg-slate-950 border-none outline-none resize-y leading-relaxed"
            placeholder="<div>Enter raw HTML code here...</div>"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="w-full min-h-[300px] max-h-[480px] overflow-y-auto p-6 outline-none prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed font-sans text-sm sm:text-base space-y-3"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      {/* FOOTER STATS & ALT WARNING */}
      <div className="bg-slate-950 text-slate-300 p-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#E96BA8]" />
            <span className="font-bold text-white">{wordCount}</span>
            <span className="text-slate-400">words</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <span className="text-slate-400">Images in article:</span>
            <span className="font-bold text-white">{imagesList.length}</span>
          </div>
        </div>

        {missingAltCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning: {missingAltCount} article image(s) missing ALT text for SEO</span>
          </div>
        )}
      </div>

      {/* LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-sky-500" /> Insert Link
              </h4>
              <button type="button" onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target URL</label>
                <input
                  type="text"
                  placeholder="/patterns or https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Anchor Text</label>
                <input
                  type="text"
                  placeholder="Free Crochet Patterns"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 cursor-pointer shadow-md"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" /> Insert Article Image
              </h4>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            {uploadError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* File Upload Trigger */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Upload File from Device</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-[#E96BA8] transition-colors bg-slate-50 dark:bg-slate-950/50"
                >
                  <Upload className="w-6 h-6 text-[#E96BA8] mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isUploading ? 'Uploading Image...' : 'Click to select image file'}
                  </p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, WEBP, GIF (Max 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Or Image URL</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">SEO ALT Text (Recommended)</label>
                <input
                  type="text"
                  placeholder="e.g. Single crochet stitch sample with pink yarn"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Figure 1: Foundation chain loops"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertImage}
                disabled={!imageUrl || isUploading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 cursor-pointer shadow-md disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
