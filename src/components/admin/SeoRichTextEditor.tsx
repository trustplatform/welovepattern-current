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
  Table as TableIcon, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Smile, 
  Palette, 
  Highlighter, 
  Code, 
  Eye, 
  RotateCcw, 
  RotateCw, 
  RemoveFormatting, 
  Sparkles, 
  Check, 
  Heading as HeadingIcon,
  HelpCircle,
  FileText
} from 'lucide-react';

interface SeoRichTextEditorProps {
  initialValue: string;
  onChange: (htmlContent: string) => void;
  toolTitle?: string;
}

export const SeoRichTextEditor: React.FC<SeoRichTextEditorProps> = ({
  initialValue,
  onChange,
  toolTitle = 'Craft Tool'
}) => {
  const [htmlValue, setHtmlValue] = useState<string>(initialValue);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');

  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize initial content
  useEffect(() => {
    setHtmlValue(initialValue);
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue;
      }
    }
  }, [initialValue]);

  // Execute standard editor commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML;
      setHtmlValue(updated);
      onChange(updated);
    }
  };

  // Format Headings H1 to H6 or Paragraph
  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value; // e.g. 'h1', 'h2', 'p', 'blockquote'
    if (format === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (format === 'blockquote') {
      execCmd('formatBlock', '<blockquote>');
    } else {
      execCmd('formatBlock', `<${format}>`);
    }
  };

  // Handle direct typing in WYSIWYG container
  const handleInput = () => {
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML;
      setHtmlValue(updated);
      onChange(updated);
    }
  };

  // Handle raw HTML textarea edits
  const handleHtmlTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlValue(val);
    onChange(val);
  };

  // Switch between Visual & HTML Source View
  const toggleHtmlView = () => {
    if (isHtmlMode) {
      // Switching back to Visual
      setIsHtmlMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlValue;
        }
      }, 50);
    } else {
      // Switching to Raw HTML
      setIsHtmlMode(true);
    }
  };

  // Insert Table
  const insertTable = () => {
    if (tableRows <= 0 || tableCols <= 0) return;
    let tableHtml = '<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 16px 0;">\n<thead>\n<tr style="background-color: #f8fafc; font-weight: bold;">\n';
    
    for (let c = 1; c <= tableCols; c++) {
      tableHtml += `  <th>Header ${c}</th>\n`;
    }
    tableHtml += '</tr>\n</thead>\n<tbody>\n';

    for (let r = 1; r <= tableRows; r++) {
      tableHtml += '<tr>\n';
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `  <td>Data ${r}-${c}</td>\n`;
      }
      tableHtml += '</tr>\n';
    }
    tableHtml += '</tbody>\n</table>\n<p></p>';

    if (isHtmlMode) {
      const updated = htmlValue + '\n' + tableHtml;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', tableHtml);
    }
    setShowTableModal(false);
  };

  // Insert Link
  const insertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
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

  // Insert Image
  const insertImage = () => {
    if (!imageUrl) return;
    const imgHtml = `<img src="${imageUrl}" alt="${imageAlt || 'Crochet Tool Illustration'}" style="max-width: 100%; height: auto; border-radius: 16px; margin: 16px 0; border: 1px solid #e2e8f0;" />`;

    if (isHtmlMode) {
      const updated = htmlValue + imgHtml;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', imgHtml);
    }
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Insert Emoji
  const insertEmoji = (emoji: string) => {
    if (isHtmlMode) {
      const updated = htmlValue + emoji;
      setHtmlValue(updated);
      onChange(updated);
    } else {
      execCmd('insertHTML', emoji);
    }
    setShowEmojiPicker(false);
  };

  // Color options
  const TEXT_COLORS = [
    { name: 'Brand Pink', color: '#E96BA8' },
    { name: 'Deep Purple', color: '#8B5CF6' },
    { name: 'Emerald Green', color: '#10B981' },
    { name: 'Amber Gold', color: '#F59E0B' },
    { name: 'Sky Blue', color: '#3B82F6' },
    { name: 'Rose Red', color: '#EF4444' },
    { name: 'Dark Slate', color: '#0F172A' },
    { name: 'Medium Slate', color: '#475569' }
  ];

  const BG_COLORS = [
    { name: 'Soft Pink', color: '#fce7f3' },
    { name: 'Soft Amber', color: '#fef3c7' },
    { name: 'Soft Green', color: '#d1fae5' },
    { name: 'Soft Blue', color: '#dbeafe' },
    { name: 'Soft Purple', color: '#f3e8ff' },
    { name: 'None/Clear', color: 'transparent' }
  ];

  const CRAFT_EMOJIS = [
    '🧶', '🪡', '✂️', '📏', '🧵', '📐', '📝', '✨', 
    '💡', '🏷️', '💰', '📊', '🏆', '⭐', '❓', '💬', 
    '🛍️', '📦', '🎁', '🎀', '🎯', '🚀', '🔍', '📈'
  ];

  // Calculate SEO Stats & Word Count
  const textContent = htmlValue.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 200));

  const h1Count = (htmlValue.match(/<h1/gi) || []).length;
  const h2Count = (htmlValue.match(/<h2/gi) || []).length;
  const h3Count = (htmlValue.match(/<h3/gi) || []).length;
  const h4Count = (htmlValue.match(/<h4/gi) || []).length;
  const h5Count = (htmlValue.match(/<h5/gi) || []).length;
  const h6Count = (htmlValue.match(/<h6/gi) || []).length;
  const tableCount = (htmlValue.match(/<table/gi) || []).length;
  const linkCount = (htmlValue.match(/<a/gi) || []).length;
  const imgCount = (htmlValue.match(/<img/gi) || []).length;

  // Calculate SEO Score out of 100
  let seoScore = 0;
  if (wordCount >= 250) seoScore += 30;
  else if (wordCount >= 100) seoScore += 15;

  if (h2Count >= 1) seoScore += 20;
  if (h3Count >= 1) seoScore += 15;
  if (tableCount >= 1) seoScore += 15;
  if (linkCount >= 1 || imgCount >= 1) seoScore += 10;
  if (htmlValue.toLowerCase().includes('crochet') || htmlValue.toLowerCase().includes('yarn')) seoScore += 10;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg space-y-0">
      
      {/* EDITOR TOOLBAR */}
      <div className="bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-200">
        
        {/* Headings H1 to H6 Dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs">
          <HeadingIcon className="w-4 h-4 text-[#E96BA8]" />
          <select
            onChange={handleHeadingChange}
            disabled={isHtmlMode}
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer pr-1"
            defaultValue="p"
          >
            <option value="p">Paragraph (Normal Text)</option>
            <option value="h1">Heading 1 (H1 - Main Title)</option>
            <option value="h2">Heading 2 (H2 - Section Title)</option>
            <option value="h3">Heading 3 (H3 - Subtitle)</option>
            <option value="h4">Heading 4 (H4 - Minor Title)</option>
            <option value="h5">Heading 5 (H5 - Small Heading)</option>
            <option value="h6">Heading 6 (H6 - Tiny Heading)</option>
            <option value="blockquote">Blockquote (Highlight Box)</option>
          </select>
        </div>

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-800 mx-1" />

        {/* Inline Formatting Group */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => execCmd('bold')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('italic')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('underline')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('strikeThrough')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Alignment Group */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => execCmd('justifyLeft')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('justifyCenter')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('justifyRight')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('justifyFull')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists Group */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => execCmd('insertUnorderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('insertOrderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Colors & Palette Popovers */}
        <div className="relative flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => { setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); }}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer flex items-center gap-1"
            title="Text Color"
          >
            <Palette className="w-4 h-4 text-[#E96BA8]" />
          </button>

          <button
            onClick={() => { setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); }}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer flex items-center gap-1"
            title="Text Background Highlight"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
          </button>

          {/* Text Color Picker Popover */}
          {showColorPicker && (
            <div className="absolute top-10 left-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl w-48 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Choose Text Color</span>
              <div className="grid grid-cols-4 gap-1.5">
                {TEXT_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { execCmd('foreColor', c.color); setShowColorPicker(false); }}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Background Highlight Picker Popover */}
          {showBgColorPicker && (
            <div className="absolute top-10 left-8 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl w-48 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Text Highlight Color</span>
              <div className="grid grid-cols-3 gap-1.5">
                {BG_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { execCmd('hiliteColor', c.color); setShowBgColorPicker(false); }}
                    className="w-10 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer text-[10px] font-bold text-slate-800 transition-transform hover:scale-105 flex items-center justify-center"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {c.color === 'transparent' ? 'Clear' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insert Table, Link, Image, Emoji */}
        <div className="relative flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => setShowTableModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert HTML Table"
          >
            <TableIcon className="w-4 h-4 text-emerald-500" />
          </button>

          <button
            onClick={() => setShowLinkModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert Hyperlink"
          >
            <LinkIcon className="w-4 h-4 text-sky-500" />
          </button>

          <button
            onClick={() => setShowImageModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert SEO Image"
          >
            <ImageIcon className="w-4 h-4 text-purple-500" />
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-[#E96BA8] transition-colors cursor-pointer"
            title="Insert Emojis"
          >
            <Smile className="w-4 h-4 text-amber-500" />
          </button>

          {/* Emoji Popover */}
          {showEmojiPicker && (
            <div className="absolute top-10 right-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl w-56 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Craft &amp; SEO Emojis</span>
              <div className="grid grid-cols-6 gap-1 text-base">
                {CRAFT_EMOJIS.map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertEmoji(e)}
                    className="p-1.5 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg transition-transform hover:scale-125 cursor-pointer text-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear Formatting, Undo, Redo */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => execCmd('removeFormat')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('undo')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => execCmd('redo')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* WYSIWYG vs RAW HTML SOURCE VIEW TOGGLE */}
          <button
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
                <span>Switch to WYSIWYG Visual</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-purple-500" />
                <span>HTML Code View</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* EDITOR CANVAS AREA */}
      <div className="relative min-h-[340px] bg-white dark:bg-slate-900">
        {isHtmlMode ? (
          /* RAW HTML CODE EDITOR MODE */
          <textarea
            value={htmlValue}
            onChange={handleHtmlTextareaChange}
            className="w-full h-[380px] p-5 font-mono text-xs text-purple-300 bg-slate-950 border-none outline-none resize-y leading-relaxed"
            placeholder="<div>Enter raw HTML code here...</div>"
          />
        ) : (
          /* WYSIWYG VISUAL EDITABLE CONTAINER */
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="w-full min-h-[340px] max-h-[500px] overflow-y-auto p-6 outline-none prose dark:prose-invert max-w-none focus:ring-0 text-slate-800 dark:text-slate-100 leading-relaxed font-sans text-sm sm:text-base space-y-3"
            style={{ minHeight: '340px' }}
          />
        )}
      </div>

      {/* SEO ANALYTICS & STATS FOOTER BAR */}
      <div className="bg-slate-950 text-slate-300 p-4 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#E96BA8]" />
            <span className="font-bold text-white">{wordCount}</span>
            <span className="text-slate-400">Words</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{readingTimeMins}</span>
            <span className="text-slate-400">min read</span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Headers:</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-pink-300 font-mono">H1:{h1Count}</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-purple-300 font-mono">H2:{h2Count}</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono">H3:{h3Count}</span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Rich Elements:</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">Tables:{tableCount}</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">Links:{linkCount}</span>
          </div>
        </div>

        {/* SEO Score Badge */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Google SEO Score:</span>
          <div className={`px-3 py-1 rounded-full font-black text-xs flex items-center gap-1 ${
            seoScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
            seoScore >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
            'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seoScore} / 100 ({seoScore >= 80 ? 'Excellent' : seoScore >= 50 ? 'Good' : 'Needs Optimization'})</span>
          </div>
        </div>

      </div>

      {/* INSERT TABLE MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-[#E96BA8]" /> Insert Custom HTML Table
              </h4>
              <button onClick={() => setShowTableModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Rows Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Columns Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={insertTable}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 cursor-pointer shadow-md"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSERT LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-sky-500" /> Insert SEO Hyperlink
              </h4>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Link URL</label>
                <input
                  type="text"
                  placeholder="https://welovepattern.com/patterns/free-blanket"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Display Text (Anchor Text)</label>
                <input
                  type="text"
                  placeholder="Free Crochet Blanket Patterns"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 cursor-pointer shadow-md"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSERT IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" /> Insert Image with SEO Alt Tag
              </h4>
              <button onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
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
                <label className="text-xs font-bold text-slate-500 block mb-1">SEO Alt Text (Description)</label>
                <input
                  type="text"
                  placeholder="Crochet gauge swatch measuring tape guide"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E96BA8] text-white hover:bg-pink-600 cursor-pointer shadow-md"
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
