import React, { useState, useEffect } from 'react';
import { ShieldCheck, Code, Save, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, FileCode } from 'lucide-react';

interface SiteVerificationSettings {
  headCode: string;
  bodyCode: string;
  footerCode: string;
  updatedAt?: string;
}

export const SiteVerificationAdmin: React.FC = () => {
  const [headCode, setHeadCode] = useState<string>('');
  const [bodyCode, setBodyCode] = useState<string>('');
  const [footerCode, setFooterCode] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/site-verification', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.settings) {
            setHeadCode(data.settings.headCode || '');
            setBodyCode(data.settings.bodyCode || '');
            setFooterCode(data.settings.footerCode || '');
            setUpdatedAt(data.settings.updatedAt);
          }
        } else {
          if (isMounted) {
            setStatusMessage({ type: 'error', text: 'Failed to load site verification settings.' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatusMessage({ type: 'error', text: 'Server connection error loading verification settings.' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/site-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ headCode, bodyCode, footerCode })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: 'Site verification and tracking codes saved successfully!' });
        if (data.settings?.updatedAt) {
          setUpdatedAt(data.settings.updatedAt);
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save verification settings.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to server while saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to clear all verification & tracking codes?')) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/site-verification', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHeadCode('');
        setBodyCode('');
        setFooterCode('');
        setUpdatedAt(undefined);
        setStatusMessage({ type: 'success', text: 'All verification codes cleared successfully.' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to clear verification settings.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to server while deleting settings.' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[24px] p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-[#E96BA8] animate-spin" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading Site Verification Settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[28px] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-6 h-6 text-[#E96BA8]" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Site Verification &amp; Tracking Codes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add meta tags, scripts, and verification codes for Google Search Console, Analytics, AdSense, Meta Pixel, Pinterest, and Bing.
          </p>
        </div>

        {updatedAt && (
          <div className="text-right text-xs text-slate-400 dark:text-slate-500">
            <span>Last Updated: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {new Date(updatedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Field A: HEAD CODE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-[#9B7CF8]" />
              <span>A. HEAD Code (&lt;head&gt; ... &lt;/head&gt;)</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              Injected before &lt;/head&gt;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste HTML meta tags, verification scripts, or tracking snippets (e.g., Google Search Console <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">&lt;meta name="google-site-verification" ...&gt;</code>, Google Analytics, Pinterest Verification).
          </p>
          <textarea
            rows={6}
            value={headCode}
            onChange={(e) => setHeadCode(e.target.value)}
            placeholder={`<!-- Example: Google Search Console Verification -->\n<meta name="google-site-verification" content="YOUR_VERIFICATION_TOKEN" />\n\n<!-- Example: Google Analytics (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>`}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8] leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Field B: BODY CODE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-[#E96BA8]" />
              <span>B. BODY Start Code (Immediately after &lt;body&gt;)</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              Injected after &lt;body&gt;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste code that must appear immediately after the opening <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">&lt;body&gt;</code> tag (e.g., Google Tag Manager noscript fallback iframe).
          </p>
          <textarea
            rows={5}
            value={bodyCode}
            onChange={(e) => setBodyCode(e.target.value)}
            placeholder={`<!-- Example: Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8] leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Field C: FOOTER CODE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-sky-500" />
              <span>C. FOOTER / BODY-END Code (Immediately before &lt;/body&gt;)</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              Injected before &lt;/body&gt;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste non-blocking scripts, chat widgets, or conversion tracking pixels that should load at the bottom of the page before <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">&lt;/body&gt;</code>.
          </p>
          <textarea
            rows={5}
            value={footerCode}
            onChange={(e) => setFooterCode(e.target.value)}
            placeholder={`<!-- Example: Footer Tracking Script -->\n<script>\n  console.log("Site Verification Footers Loaded");\n</script>`}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8] leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/60">
          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className="w-full sm:w-auto bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] hover:opacity-95 text-white font-bold py-3.5 px-8 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Verification Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Verification Settings</span>
              </>
            )}
          </button>

          {(headCode.trim() || bodyCode.trim() || footerCode.trim()) && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Code</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
