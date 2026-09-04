import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Mail, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  description = 'Check out this amazing free crochet pattern!',
  imageUrl,
  url
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title} - ${description}`);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
      shareLink: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      description: 'Send directly to WhatsApp chats or status'
    },
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#0f67d9] text-white',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      shareLink: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      description: 'Post to your newsfeed or groups'
    },
    {
      name: 'Pinterest',
      color: 'bg-[#E60023] hover:bg-[#cc001f] text-white',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
      ),
      shareLink: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl || '')}&description=${encodedTitle}`,
      description: 'Pin to your crochet boards'
    },
    {
      name: 'X (Twitter)',
      color: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white',
      badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      shareLink: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      description: 'Tweet to your followers'
    },
    {
      name: 'Reddit',
      color: 'bg-[#FF4500] hover:bg-[#e03d00] text-white',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.363.043-.538A1.758 1.758 0 0 1 4 12.002c0-.968.786-1.754 1.754-1.754.463 0 .883.18 1.189.484 1.192-.851 2.842-1.411 4.66-1.487l.951-4.463 3.193.673a1.252 1.252 0 0 1 .263-.711zM9.25 12a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm5.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.637 3.963a.4.4 0 0 0-.07.558c.451.625 1.606 1.146 2.957 1.146 1.35 0 2.506-.521 2.957-1.146a.4.4 0 0 0-.648-.466c-.303.42-1.23.812-2.309.812-1.08 0-2.006-.392-2.309-.812a.4.4 0 0 0-.58-.092z"/>
        </svg>
      ),
      shareLink: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      description: 'Share to r/crochet or craft subreddits'
    },
    {
      name: 'Email',
      color: 'bg-slate-700 hover:bg-slate-800 text-white',
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      icon: <Mail className="w-5 h-5" />,
      shareLink: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      description: 'Send via your email client'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden z-10 space-y-0 transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/80 text-[#E96BA8] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Share Pattern
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spread the creativity with fellow crafters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Preview Card (if image/title provided) */}
        {imageUrl && (
          <div className="px-5 sm:px-6 pt-4 pb-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <img
                src={imageUrl}
                alt={title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-[#E96BA8] uppercase tracking-wider block">
                  Free Crochet Pattern
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Social Platforms Grid */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Share directly to
            </span>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="text-xs font-bold text-[#E96BA8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>More options</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  // For email or links, let standard action run
                }}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${platform.color}`}
              >
                {platform.icon}
                <span className="truncate">{platform.name}</span>
              </a>
            ))}
          </div>

          {/* Copy Direct Link Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#E96BA8] hover:bg-pink-600 text-white shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E96BA8]" />
          <span>Thanks for sharing free crochet patterns with the community!</span>
        </div>

      </div>
    </div>
  );
};
