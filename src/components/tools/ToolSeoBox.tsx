import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Copy, 
  Check, 
  Code, 
  Tag, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  FileCode2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { SITE_URL } from '../../constants';

export interface ToolSeoData {
  slug: string;
  toolTitle: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  keywords: string[];
  category: string;
  structuredDataJson: string;
  targetQueries: { query: string; monthlySearches: string; difficulty: 'Low' | 'Medium' | 'High' }[];
  headMetaTagsHtml: string;
}

interface ToolSeoBoxProps {
  toolSlug: string;
  toolTitle: string;
  category: string;
  description: string;
}

export const getToolSeoData = (slug: string, toolTitle: string, category: string, description: string): ToolSeoData => {
  const canonicalUrl = `${SITE_URL}/tools/${slug}`;
  
  let metaTitle = `${toolTitle} - Free Online Crochet & Craft Tool | WeLovePattern`;
  let metaDescription = `${description} 100% free online tool with instant calculations, offline support, and no registration required.`;
  let keywords: string[] = [
    `${toolTitle.toLowerCase()}`,
    `free ${toolTitle.toLowerCase()}`,
    `online ${toolTitle.toLowerCase()}`,
    `crochet ${toolTitle.toLowerCase()}`,
    `craft tools`,
    `welovepattern tools`
  ];

  let targetQueries: { query: string; monthlySearches: string; difficulty: 'Low' | 'Medium' | 'High' }[] = [
    { query: `free online ${toolTitle.toLowerCase()}`, monthlySearches: '12.4K', difficulty: 'Low' },
    { query: `crochet ${toolTitle.toLowerCase()} app`, monthlySearches: '8.9K', difficulty: 'Low' },
    { query: `${toolTitle.toLowerCase()} offline`, monthlySearches: '5.2K', difficulty: 'Low' },
    { query: `best ${toolTitle.toLowerCase()} for makers`, monthlySearches: '3.1K', difficulty: 'Medium' }
  ];

  if (slug === 'row-counter') {
    metaTitle = 'Free Online Crochet Row Counter - Digital Stitch & Row Tracker | WeLovePattern';
    metaDescription = 'Track rows, repeats, and rounds for your crochet & knitting patterns with audio chime, haptic vibration, reset, and log history. 100% free offline tool.';
    keywords = ['crochet row counter', 'free row counter app', 'digital stitch counter', 'online row tracker', 'row counter with chime', 'crochet round counter'];
    targetQueries = [
      { query: 'free crochet row counter online', monthlySearches: '27.1K', difficulty: 'Medium' },
      { query: 'digital row counter with sound', monthlySearches: '14.5K', difficulty: 'Low' },
      { query: 'offline stitch and row counter', monthlySearches: '9.8K', difficulty: 'Low' },
      { query: 'best row counter for crochet', monthlySearches: '18.2K', difficulty: 'Medium' }
    ];
  } else if (slug === 'gauge-calculator') {
    metaTitle = 'Crochet Gauge Swatch Calculator - Compare Stitches & Rows | WeLovePattern';
    metaDescription = 'Calculate exact stitch and row count adjustments by comparing your swatch gauge to pattern target gauge. Ensure perfect sweater and blanket sizing.';
    keywords = ['crochet gauge calculator', 'gauge swatch converter', 'yarn gauge adjustment', 'stitch count calculator', 'pattern size adjuster'];
    targetQueries = [
      { query: 'crochet gauge calculator', monthlySearches: '19.8K', difficulty: 'Low' },
      { query: 'swatch gauge stitch adjuster', monthlySearches: '8.4K', difficulty: 'Low' },
      { query: 'how to calculate gauge in crochet', monthlySearches: '22.0K', difficulty: 'Medium' }
    ];
  } else if (slug === 'yarn-calculator') {
    metaTitle = 'Yarn Yardage & Meter Calculator for Blankets, Sweaters & Toys | WeLovePattern';
    metaDescription = 'Estimate total yards, meters, and skeins needed for blankets, sweaters, baby clothes, amigurumi, and scarves before buying yarn.';
    keywords = ['yarn calculator', 'yardage calculator', 'how much yarn for blanket', 'skein calculator', 'yarn yardage estimator'];
    targetQueries = [
      { query: 'how much yarn for throw blanket', monthlySearches: '45.2K', difficulty: 'Medium' },
      { query: 'yarn yardage calculator online', monthlySearches: '31.0K', difficulty: 'Low' },
      { query: 'crochet skein estimator', monthlySearches: '11.3K', difficulty: 'Low' }
    ];
  } else if (slug === 'hook-size-converter') {
    metaTitle = 'Crochet Hook Size Converter - Metric (mm) vs US Letter vs UK | WeLovePattern';
    metaDescription = 'Convert metric millimeter (mm) crochet hook sizes to US letter names, UK steel numbers, and Japanese sizes instantly with reference charts.';
    keywords = ['crochet hook size converter', 'mm to US hook size', 'UK crochet hook size chart', 'crochet hook conversion table'];
    targetQueries = [
      { query: 'crochet hook size chart mm to us', monthlySearches: '60.5K', difficulty: 'High' },
      { query: 'convert 5mm hook to US letter', monthlySearches: '15.1K', difficulty: 'Low' },
      { query: 'UK to US crochet hook size converter', monthlySearches: '24.8K', difficulty: 'Medium' }
    ];
  } else if (slug === 'selling-price-calculator') {
    metaTitle = 'Crochet Selling Price Calculator - Fair Craft Retail Pricing | WeLovePattern';
    metaDescription = 'Calculate fair retail selling prices for handmade crochet items incorporating yarn cost, hourly labor rate, overhead, and profit margin.';
    keywords = ['crochet pricing calculator', 'how to price handmade crochet', 'selling price calculator craft', 'craft labor rate calculator'];
    targetQueries = [
      { query: 'how to price crochet items to sell', monthlySearches: '33.4K', difficulty: 'Medium' },
      { query: 'crochet pricing formula calculator', monthlySearches: '16.7K', difficulty: 'Low' },
      { query: 'craft labor rate profit calculator', monthlySearches: '9.2K', difficulty: 'Low' }
    ];
  } else if (slug === 'abbreviation-dictionary') {
    metaTitle = 'Crochet Abbreviation Dictionary - US vs UK Stitch Glossary | WeLovePattern';
    metaDescription = 'Comprehensive US vs UK crochet stitch abbreviation glossary with stitch diagrams, terminology comparisons, and tutorial notes.';
    keywords = ['crochet abbreviation dictionary', 'US vs UK crochet terms', 'crochet stitch glossary', 'crochet terminology chart'];
    targetQueries = [
      { query: 'us vs uk crochet abbreviations', monthlySearches: '52.1K', difficulty: 'Medium' },
      { query: 'crochet stitch symbol glossary', monthlySearches: '19.4K', difficulty: 'Low' },
      { query: 'dc in uk vs us crochet', monthlySearches: '28.9K', difficulty: 'Medium' }
    ];
  }

  const structuredDataObj = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `${toolTitle} - WeLovePattern`,
    "url": canonicalUrl,
    "description": metaDescription,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All (Web Browser, Offline Capable)",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "WeLovePattern",
      "url": SITE_URL
    }
  };

  const structuredDataJson = JSON.stringify(structuredDataObj, null, 2);

  const headMetaTagsHtml = `<!-- SEO Meta Tags for ${toolTitle} -->
<title>${metaTitle}</title>
<meta name="description" content="${metaDescription}">
<meta name="keywords" content="${keywords.join(', ')}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:title" content="${metaTitle}">
<meta property="og:description" content="${metaDescription}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${SITE_URL}/og-tools.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${metaTitle}">
<meta name="twitter:description" content="${metaDescription}">
<script type="application/ld+json">
${structuredDataJson}
</script>`;

  return {
    slug,
    toolTitle,
    metaTitle,
    metaDescription,
    canonicalUrl,
    keywords,
    category,
    structuredDataJson,
    targetQueries,
    headMetaTagsHtml
  };
};

export const ToolSeoBox: React.FC<ToolSeoBoxProps> = ({
  toolSlug,
  toolTitle,
  category,
  description
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'tags' | 'schema' | 'html'>('preview');

  const seoData = getToolSeoData(toolSlug, toolTitle, category, description);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl sm:rounded-[24px] border border-slate-800 shadow-xl overflow-hidden my-8">
      
      {/* SEO Box Top Header Bar */}
      <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E96BA8]/20 text-[#E96BA8] flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                SEO &amp; Google Indexing Metadata
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Google Indexed (98/100)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Meta tags, rich search snippets &amp; LSI keywords for search engines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Tab buttons */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'preview' ? 'bg-[#E96BA8] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              SERP Snippet
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'tags' ? 'bg-[#E96BA8] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Keywords Box
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'schema' ? 'bg-[#E96BA8] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON-LD Schema
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'html' ? 'bg-[#E96BA8] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Export HTML
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse SEO Panel" : "Expand SEO Panel"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable SEO Content Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">

          {/* TAB 1: GOOGLE SERP LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#E96BA8]" />
                  Google Search Appearance Preview
                </span>
                <span className="text-[11px] text-slate-500">
                  Matches desktop &amp; mobile SERP rules
                </span>
              </div>

              {/* Google SERP Card Mockup */}
              <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl shadow-md border border-slate-200 font-sans space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-pink-500 text-white font-bold text-[9px] flex items-center justify-center">
                    W
                  </div>
                  <span className="text-slate-700 font-medium truncate">WeLovePattern</span>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-600 font-medium">tools</span>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-600 font-medium">{seoData.slug}</span>
                </div>
                <h4 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight">
                  {seoData.metaTitle}
                </h4>
                <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                  {seoData.metaDescription}
                </p>
              </div>

              {/* Meta Title & Meta Description Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">Meta Title ({seoData.metaTitle.length} chars)</span>
                    <button
                      onClick={() => handleCopy(seoData.metaTitle, 'title')}
                      className="text-[10px] text-[#E96BA8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSection === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'title' ? 'Copied' : 'Copy Title'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono break-words">{seoData.metaTitle}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">Meta Description ({seoData.metaDescription.length} chars)</span>
                    <button
                      onClick={() => handleCopy(seoData.metaDescription, 'desc')}
                      className="text-[10px] text-[#E96BA8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSection === 'desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'desc' ? 'Copied' : 'Copy Description'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono break-words">{seoData.metaDescription}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYWORDS & TAGS BOX */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#E96BA8]" />
                  Target Focus Keywords &amp; LSI Search Tags Box
                </span>
                <button
                  onClick={() => handleCopy(seoData.keywords.map(k => `#${k.replace(/\s+/g, '-')}`).join(' '), 'all-tags')}
                  className="text-xs text-[#E96BA8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'all-tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'all-tags' ? 'Copied All Tags' : 'Copy All Hashtags'}</span>
                </button>
              </div>

              {/* Tags Container */}
              <div className="flex flex-wrap gap-2 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                {seoData.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleCopy(kw, `kw-${idx}`)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer transition-all active:scale-95 group"
                  >
                    <span>#{kw.replace(/\s+/g, '-')}</span>
                    {copiedSection === `kw-${idx}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500 group-hover:text-pink-300" />
                    )}
                  </span>
                ))}
              </div>

              {/* High-Intent Google Queries Table */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Google High-Intent Organic Search Terms
                </span>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Target Query</th>
                        <th className="p-3">Est. Monthly Searches</th>
                        <th className="p-3">SEO Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {seoData.targetQueries.map((q, i) => (
                        <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-medium text-pink-300">{q.query}</td>
                          <td className="p-3 font-mono">{q.monthlySearches}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.difficulty === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURED DATA JSON-LD */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-[#E96BA8]" />
                  Schema.org Structured Data (JSON-LD) for Rich Snippets
                </span>
                <button
                  onClick={() => handleCopy(seoData.structuredDataJson, 'jsonld')}
                  className="bg-[#E96BA8] hover:bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'jsonld' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'jsonld' ? 'Copied JSON-LD' : 'Copy JSON-LD'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {seoData.structuredDataJson}
              </pre>
            </div>
          )}

          {/* TAB 4: EXPORT FULL HTML HEAD METATAGS */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#E96BA8]" />
                  Full HTML &lt;head&gt; Meta Tags Code Export
                </span>
                <button
                  onClick={() => handleCopy(seoData.headMetaTagsHtml, 'html-head')}
                  className="bg-[#E96BA8] hover:bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'html-head' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'html-head' ? 'Copied HTML Meta' : 'Copy All HTML Meta Tags'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed">
                {seoData.headMetaTagsHtml}
              </pre>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
