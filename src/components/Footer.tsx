import React from 'react';
import { Heart, Send, CheckCircle2, Download, Loader2, AlertCircle, Info } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = React.useState('');
  const [statusState, setStatusState] = React.useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = React.useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setStatusState('error');
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    setStatusState('loading');
    setStatusMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, source: 'Homepage Newsletter' })
      });

      const data = await res.json();

      if (data.success) {
        setStatusState('success');
        setStatusMessage("Thanks! You're subscribed.");
        setEmail('');
      } else if (data.alreadySubscribed) {
        setStatusState('already');
        setStatusMessage("You're already subscribed.");
      } else {
        setStatusState('error');
        setStatusMessage(data.error || "Please enter a valid email address.");
      }
    } catch (err) {
      setStatusState('error');
      setStatusMessage("Server connection error. Please try again.");
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-200 pt-16 pb-12 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-slate-800 p-8 sm:p-10 rounded-[24px] border border-pink-500/30 mb-16 text-center max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 bg-[#E96BA8]/20 text-[#E96BA8] rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Weekly Crochet Patterns
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Get Fresh Free Patterns Delivered to Your Inbox
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-6">
            Join 45,000+ crafters! Receive newly released patterns, yarn sales, and craft calculator tips every Friday morning.
          </p>
          
          {statusState === 'success' || statusState === 'already' ? (
            <div className={`px-6 py-4 rounded-full max-w-md mx-auto flex items-center justify-center gap-2 font-bold text-sm animate-fadeIn border ${
              statusState === 'success'
                ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/50'
                : 'bg-amber-900/60 text-amber-200 border-amber-500/50'
            }`}>
              {statusState === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          ) : (
            <div className="space-y-3 max-w-md mx-auto">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  disabled={statusState === 'loading'}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (statusState === 'error') setStatusState('idle');
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-[#E96BA8] text-base disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={statusState === 'loading'}
                  className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-7 py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md text-base disabled:opacity-50"
                >
                  {statusState === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {statusState === 'error' && (
                <div className="bg-rose-900/50 border border-rose-500/40 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E96BA8] flex items-center justify-center text-white text-xl shadow-md">
                🧶
              </div>
              <span className="text-2xl font-bold text-white">WeLovePattern</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              The world’s largest collection of 100% free crochet patterns, yarn calculators, row counters, and craft tools built for makers of all ages.
            </p>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs text-pink-400">
              Popular Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {['blankets', 'amigurumi', 'granny-squares', 'baby', 'flowers', 'accessories'].map((cat) => (
                <li key={cat}>
                  <a
                    href={`/category/${cat}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('categories', cat);
                    }}
                    className="text-slate-400 hover:text-white capitalize transition-colors cursor-pointer text-left decoration-none block"
                  >
                    • {cat.replace('-', ' ')} Crochet Patterns
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Craft Tools */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs text-purple-400">
              Essential Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Row Counter (Offline)', id: 'row-counter' },
                { label: 'Yarn Calculator', id: 'yarn-calculator' },
                { label: 'Gauge Swatch Calculator', id: 'gauge-calculator' },
                { label: 'Hook Size Converter', id: 'hook-size-converter' },
                { label: 'Selling Price Calculator', id: 'selling-price-calculator' },
                { label: 'Abbreviation Dictionary', id: 'abbreviation-dictionary' }
              ].map((tool) => (
                <li key={tool.id}>
                  <a
                    href={`/tools/${tool.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('tools', tool.id);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left decoration-none block"
                  >
                    • {tool.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Community */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs text-pink-400">
              Makers Community
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('blog');
                  }}
                  className="hover:text-white transition-colors cursor-pointer decoration-none block"
                >
                  • Crochet Tips & Guides Blog
                </a>
              </li>
              <li>• WCAG AA Accessible Interface</li>
              <li>• Offline-First App Capability</li>
              <li>• 100% Free - No Subscription Required</li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 WeLovePattern. Crafted with <Heart className="w-3.5 h-3.5 text-[#E96BA8] inline mx-1 fill-current" /> for makers worldwide.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('page', 'privacy-policy');
              }}
              className="text-slate-400 hover:text-[#E96BA8] transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('page', 'terms-of-service');
              }}
              className="text-slate-400 hover:text-[#E96BA8] transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a
              href="/sitemap"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('page', 'sitemap');
              }}
              className="text-slate-400 hover:text-[#E96BA8] transition-colors cursor-pointer"
            >
              Sitemap &amp; Schema
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
