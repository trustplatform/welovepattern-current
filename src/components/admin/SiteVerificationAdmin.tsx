import React, { useState, useEffect } from 'react';
import { ShieldCheck, Code, Save, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, FileCode, Zap, ExternalLink, RefreshCw } from 'lucide-react';

interface SiteVerificationSettings {
  headCode: string;
  bodyCode: string;
  footerCode: string;
  updatedAt?: string;
}

interface IndexNowStatus {
  configured: boolean;
  host: string;
  keyLocation: string;
  keyMasked: string;
  lastSubmittedAt?: string | null;
  submissionCount: number;
}

const VERIFICATION_PROVIDERS = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    pattern: /google-site-verification/i,
    description: 'HTML Meta Verification'
  },
  {
    id: 'ga',
    name: 'Google Analytics & GTM',
    pattern: /googletagmanager\.com|google-analytics\.com|analytics\.google|gtag\(|ga\(|\bG-[A-Z0-9]+\b|\bUA-[0-9]+|\bGTM-[A-Z0-9]+\b/i,
    description: 'Analytics & Event Tracking'
  },
  {
    id: 'adsense',
    name: 'Google AdSense',
    pattern: /pagead2\.googlesyndication\.com|adsbygoogle|ca-pub-/i,
    description: 'Ad units & script loaders'
  },
  {
    id: 'meta',
    name: 'Meta / Facebook Pixel',
    pattern: /connect\.facebook\.net|facebook\.com\/tr|fbq\(|facebook-domain-verification/i,
    description: 'Pixel events & domain verify'
  },
  {
    id: 'pinterest',
    name: 'Pinterest Tag & Verify',
    pattern: /ct\.pinterest\.com|s\.pinimg\.com|pintrk\(|p:domain_verify/i,
    description: 'Conversions & tag analytics'
  },
  {
    id: 'tiktok',
    name: 'TikTok Pixel',
    pattern: /analytics\.tiktok\.com|ttq\.load|ttq\.page|tiktok-pixel/i,
    description: 'Analytics & event tracking'
  },
  {
    id: 'bing_clarity',
    name: 'Microsoft Clarity & Bing',
    pattern: /clarity\.ms|msvalidate\.01|c\.bing\.com/i,
    description: 'Heatmaps & webmaster verify'
  }
];

export const SiteVerificationAdmin: React.FC = () => {
  const [headCode, setHeadCode] = useState<string>('');
  const [bodyCode, setBodyCode] = useState<string>('');
  const [footerCode, setFooterCode] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  const [indexNowStatus, setIndexNowStatus] = useState<IndexNowStatus | null>(null);
  const [isPingingIndexNow, setIsPingingIndexNow] = useState<boolean>(false);
  const [pingSuccessMessage, setPingSuccessMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadIndexNowStatus = async () => {
    try {
      const res = await fetch('/api/admin/indexnow/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIndexNowStatus(data);
      }
    } catch (err) {
      // ignore
    }
  };

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
    loadIndexNowStatus();
    return () => { isMounted = false; };
  }, []);

  const handleIndexNowPing = async () => {
    setIsPingingIndexNow(true);
    setPingSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/indexnow/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          urls: [
            'https://welovepattern.com/',
            'https://welovepattern.com/patterns',
            'https://welovepattern.com/blog',
            'https://welovepattern.com/tools'
          ]
        })
      });
      if (res.ok) {
        setPingSuccessMessage('IndexNow submission queued successfully for Bing!');
        await loadIndexNowStatus();
        setTimeout(() => setPingSuccessMessage(null), 4000);
      }
    } catch (err) {
      // ignore
    } finally {
      setIsPingingIndexNow(false);
    }
  };

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

      {/* Detected Legitimate Providers Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
            Supported Verification &amp; Tracking Integrations
          </span>
          <span>Automatic CSP Security &amp; Nonce Injection</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {VERIFICATION_PROVIDERS.map((provider) => {
            const combinedCode = `${headCode} ${bodyCode} ${footerCode}`;
            const isActive = provider.pattern.test(combinedCode);
            return (
              <div
                key={provider.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent'
                }`}
                title={provider.description}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span>{provider.name}</span>
                {isActive && (
                  <span className="text-[10px] font-normal opacity-80">(Active)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* IndexNow Instant Search Engine Indexing Banner */}
      <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/10 dark:bg-slate-900/60 p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  IndexNow Instant Search Engine Indexing (Bing &amp; Partners)
                </h3>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Live &amp; Auto-Syncing
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically notifies Bing search engine whenever Patterns, Blog Posts, SEO Articles, Craft Tools, or Site Pages are created, updated, published, unpublished, or deleted.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleIndexNowPing}
            disabled={isPingingIndexNow}
            className="self-start sm:self-center shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPingingIndexNow ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pinging IndexNow...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ping IndexNow Now</span>
              </>
            )}
          </button>
        </div>

        {pingSuccessMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{pingSuccessMessage}</span>
          </div>
        )}

        {indexNowStatus && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification File</span>
              <a
                href={`/${indexNowStatus.keyMasked ? 'indexnow-key.txt' : 'indexnow-key.txt'}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>/indexnow-key.txt</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">IndexNow Key</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold block mt-0.5">
                {indexNowStatus.keyMasked || 'Configured (Active)'}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total URLs Submitted</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px] block mt-0.5">
                {indexNowStatus.submissionCount > 0 ? `${indexNowStatus.submissionCount} URLs Submitted` : 'Active / Ready on next publish'}
              </span>
            </div>
          </div>
        )}
      </div>

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
