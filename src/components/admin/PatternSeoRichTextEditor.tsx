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
  Upload,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface PatternSeoRichTextEditorProps {
  initialValue: string;
  onChange: (htmlContent: string) => void;
  onImageMissingAlt?: (hasMissingAlt: boolean) => void;
}

export const PatternSeoRichTextEditor: React.FC<PatternSeoRichTextEditorProps> = ({
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
    if (typeof window === 'undefined') return;
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

  // Heading format - strictly NO H1 allowed!
  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (val === 'blockquote') {
      execCmd('formatBlock', '<blockquote>');
    } else if (val === 'h2' || val === 'h3' || val === 'h4') {
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
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  // Upload image to Pattern SEO upload endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/admin/pattern-seo/upload', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setImageUrl(data.url);
          if (!imageAlt) {
            setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
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

  // Insert Image into content with mandatory alt text
  const insertImage = () => {
    if (!imageUrl) return;
    const finalAlt = imageAlt.trim() || 'Crochet pattern instructional guide photo';
    const imgHtml = `<img src="${imageUrl}" alt="${finalAlt}" style="max-width: 100%; height: auto; border-radius: 16px; margin: 16px 0; border: 1px solid #e2e8f0;" loading="lazy" />`;

    if (isHtmlMode) {
      const updated = htmlValue + imgHtml;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', imgHtml);
    }

    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
      
      {/* Editor Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 p-2 sm:p-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 select-none">
        
        {/* Headings / Block Dropdown - STRICTLY NO H1 */}
        <select
          onChange={handleHeadingChange}
          defaultValue="p"
          title="Text Style (No H1 allowed in SEO article)"
          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] cursor-pointer mr-1"
        >
          <option value="p">Paragraph &lt;p&gt;</option>
          <option value="h2">Heading 2 &lt;h2&gt;</option>
          <option value="h3">Heading 3 &lt;h3&gt;</option>
          <option value="h4">Heading 4 &lt;h4&gt;</option>
          <option value="blockquote">Quote &lt;blockquote&gt;</option>
        </select>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Inline Formatting */}
        <button
          type="button"
          onClick={() => execCmd('bold')}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('italic')}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('underline')}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('strikeThrough')}
          title="Strikethrough"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCmd('insertUnorderedList')}
          title="Bullet List"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('insertOrderedList')}
          title="Numbered List"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<blockquote>')}
          title="Blockquote"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('insertHorizontalRule')}
          title="Horizontal Line"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Alignments */}
        <button
          type="button"
          onClick={() => execCmd('justifyLeft')}
          title="Align Left"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyCenter')}
          title="Align Center"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyRight')}
          title="Align Right"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyFull')}
          title="Justify"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Insert Link & Image */}
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          title="Insert Link"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#E96BA8] cursor-pointer"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          title="Insert Image (with Alt Text)"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 cursor-pointer flex items-center gap-1"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[11px] font-bold hidden sm:inline">Add Image</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => execCmd('undo')}
          title="Undo"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('redo')}
          title="Redo"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          title="Clear Formatting"
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        {/* Mode Toggle: Visual vs HTML Code */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleHtmlView}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isHtmlMode 
                ? 'bg-[#E96BA8] text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{isHtmlMode ? 'Visual Editor' : 'HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {isHtmlMode ? (
        <textarea
          value={htmlValue}
          onChange={handleHtmlTextareaChange}
          placeholder="Enter clean semantic HTML (<h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <img>, <blockquote>, <hr>)..."
          rows={14}
          className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-900 text-pink-300 focus:outline-none resize-y min-h-[300px]"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="pattern-seo-prose p-4 sm:p-6 min-h-[320px] focus:outline-none text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed bg-white dark:bg-slate-900"
          style={{ minHeight: '320px' }}
        />
      )}

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#E96BA8]" />
              Insert Link
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or /pattern/slug"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Link Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here for yarn guide"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E96BA8] hover:bg-pink-600 rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Insertion & Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              Insert Image with ALT Text
            </h3>

            {uploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {uploadError}
              </div>
            )}

            <div className="space-y-3">
              {/* File upload from PC / Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Upload Image from Device (PC/Mobile)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-dashed border-slate-300 dark:border-slate-600"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading & Optimizing...' : 'Choose File to Upload'}</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="shrink mx-2 text-[10px] uppercase font-bold text-slate-400">Or Paste Image URL</span>
                <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /uploads/pattern-seo/..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Image ALT Text <span className="text-rose-500 font-bold">*Required for SEO</span>
                </label>
                <input
                  type="text"
                  required
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe what is shown in this crochet step image..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setUploadError(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!imageUrl || !imageAlt.trim() || isUploading}
                onClick={insertImage}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl cursor-pointer transition-colors shadow-xs"
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
