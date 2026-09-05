import React, { useState, useEffect } from 'react';
import { Pattern } from '../../types';
import {
  X,
  Download,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { SafePinterestStatus } from '../../types';

interface PinterestPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: Pattern | null;
}

export const PinterestPinModal: React.FC<PinterestPinModalProps> = ({
  isOpen,
  onClose,
  pattern,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pinUrl, setPinUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pinterestStatus, setPinterestStatus] = useState<SafePinterestStatus | null>(null);
  const [isConnectingPinterest, setIsConnectingPinterest] = useState(false);

  // Fetch Pinterest OAuth connection status
  const fetchPinterestStatus = async () => {
    try {
      const res = await fetch('/api/admin/pinterest/status');
      if (res.ok) {
        const data: SafePinterestStatus = await res.json();
        setPinterestStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch Pinterest connection status:', err);
    }
  };

  // Check if a pin was already rendered for this pattern
  useEffect(() => {
    if (!isOpen || !pattern) {
      setPinUrl(null);
      setError(null);
      setSuccessMessage(null);
      return;
    }

    let isMounted = true;
    fetchPinterestStatus();

    const checkExistingPin = async () => {
      setIsCheckingStatus(true);
      try {
        const res = await fetch(`/api/admin/patterns/${pattern.id}/pin-status`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.exists && data.pinUrl) {
            setPinUrl(`${data.pinUrl}?t=${Date.now()}`);
          }
        }
      } catch (err) {
        console.warn('Could not check existing pin status:', err);
      } finally {
        if (isMounted) setIsCheckingStatus(false);
      }
    };

    checkExistingPin();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PINTEREST_AUTH_SUCCESS') {
        setIsConnectingPinterest(false);
        fetchPinterestStatus();
      } else if (event.data?.type === 'PINTEREST_AUTH_ERROR') {
        setIsConnectingPinterest(false);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, pattern]);

  const handleConnectPinterest = async () => {
    setIsConnectingPinterest(true);
    try {
      const res = await fetch('/api/admin/pinterest/auth-url');
      const data = await res.json();
      if (res.ok && data.url) {
        window.open(data.url, 'pinterest_oauth', 'width=600,height=750,status=no,resizable=yes');
      } else {
        setError(data.error || 'Failed to start Pinterest authorization');
        setIsConnectingPinterest(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to Pinterest');
      setIsConnectingPinterest(false);
    }
  };

  if (!isOpen || !pattern) return null;

  const handleGeneratePin = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/patterns/${pattern.id}/generate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate Pinterest pin');
      }

      setPinUrl(`${data.pinUrl}?t=${Date.now()}`);
      setSuccessMessage(data.message || 'Template A Pin generated successfully!');
    } catch (err: any) {
      console.error('Error generating Pinterest pin:', err);
      setError(err?.message || 'An unexpected error occurred while generating the pin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pinUrl) return;
    const a = document.createElement('a');
    a.href = pinUrl;
    a.download = `pinterest-pin-${pattern.slug || pattern.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="pinterest-pin-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div
        id="pinterest-pin-modal-dialog"
        className="bg-slate-50 dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-black text-sm">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pinterest Pin Generator
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                  Template A (1000 × 1500)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pattern: <strong className="font-semibold text-slate-700 dark:text-slate-200">{pattern.title}</strong>
              </p>
            </div>
          </div>

          <button
            id="close-pinterest-modal-btn"
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Status / Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3 text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-bold">Pin Generation Failed</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePin}
                disabled={isGenerating}
                className="px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold flex-1">{successMessage}</p>
            </div>
          )}

          {/* Pinterest OAuth Connection Status Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {pinterestStatus?.connected && !pinterestStatus?.isExpired
                    ? 'Pinterest Connected'
                    : 'Pinterest Account'}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {pinterestStatus?.connected && !pinterestStatus?.isExpired
                    ? `Authorized account: @${pinterestStatus?.account?.username || 'WeLovePattern'}`
                    : 'Connect your account to enable direct pin publishing'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pinterestStatus?.connected && !pinterestStatus?.isExpired ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectPinterest}
                  disabled={isConnectingPinterest}
                  className="px-3 py-1.5 font-bold text-[11px] text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isConnectingPinterest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect Pinterest</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Grid Layout: Left Info & Controls, Right Pin Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Pattern Specs & Actions */}
            <div className="md:col-span-6 space-y-4">
              {/* Pattern Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Source Pattern Data
                </h4>

                <div className="flex gap-3 items-center">
                  <img
                    src={pattern.image}
                    alt={pattern.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {pattern.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pattern.subtitle || pattern.description || 'No subtitle provided'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {pattern.difficulty || 'Easy'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {pattern.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gallery check */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Template A Gallery Images ({pattern.gallery && pattern.gallery.length > 0 ? pattern.gallery.length : 1} available):
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                      <img
                        src={pattern.gallery?.[0] || pattern.image}
                        alt="Slot 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                      <img
                        src={pattern.gallery?.[1] || pattern.gallery?.[0] || pattern.image}
                        alt="Slot 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                      <img
                        src={pattern.gallery?.[2] || pattern.gallery?.[1] || pattern.gallery?.[0] || pattern.image}
                        alt="Slot 3"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Template A Spec Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  Template A Specifications
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Standard 2:3 Pinterest aspect ratio (<strong>1000 × 1500 px</strong>)</li>
                  <li>Official base frame (<code className="text-[11px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">template-a.png</code>)</li>
                  <li>Hero main photo with rounded corner masking</li>
                  <li>3 secondary showcase gallery thumbnails</li>
                  <li>High-contrast auto-fitted typography &amp; difficulty badge</li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="generate-pinterest-pin-btn"
                  type="button"
                  onClick={handleGeneratePin}
                  disabled={isGenerating}
                  className="w-full py-3 px-5 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering Pin with Template A...</span>
                    </>
                  ) : pinUrl ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate Pin (Template A)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Pinterest Pin (Template A)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Pin Visual Preview */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span>Pin Output Preview</span>
                  </div>
                  {pinUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      1000 × 1500 px
                    </span>
                  )}
                </div>

                {/* Preview Frame */}
                <div className="relative w-full max-w-[280px] aspect-[2/3] bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-md">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Rendering Pin...
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Compositing main image, 3 gallery slots, and typography with Sharp.
                      </p>
                    </div>
                  ) : isCheckingStatus ? (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <p className="text-xs">Checking existing pin...</p>
                    </div>
                  ) : pinUrl ? (
                    <img
                      src={pinUrl}
                      alt={`Pinterest Pin for ${pattern.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        No Pin Generated Yet
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Click "Generate Pinterest Pin" to render Template A.
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview Actions */}
                {pinUrl && !isGenerating && (
                  <div className="w-full max-w-[280px] grid grid-cols-2 gap-2 mt-3">
                    <button
                      id="download-pin-btn"
                      type="button"
                      onClick={handleDownload}
                      className="py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <a
                      id="open-full-pin-link"
                      href={pinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Full Size</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white dark:bg-slate-800 px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>Saved to <code className="text-[11px] font-mono">public/generated/pinterest/</code></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
