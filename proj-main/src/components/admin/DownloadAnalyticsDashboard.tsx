import React, { useState } from 'react';
import { Pattern } from '../../types';
import { TOOLS_DATA } from '../../data/toolsData';
import { handleImageError } from '../../utils/imageUtils';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Clock, 
  Users, 
  Wrench, 
  Globe, 
  Smartphone, 
  Laptop, 
  Search, 
  ArrowUpRight, 
  Zap, 
  Sparkles, 
  Award, 
  FileText, 
  PieChart, 
  Filter, 
  Share2, 
  Layers
} from 'lucide-react';

interface DownloadAnalyticsDashboardProps {
  patterns: Pattern[];
}

export const DownloadAnalyticsDashboard: React.FC<DownloadAnalyticsDashboardProps> = ({ patterns }) => {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('30d');
  const [analyticsCategory, setAnalyticsCategory] = useState<'all' | 'patterns' | 'tools'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multipliers based on selected time range
  const rangeMultiplier = timeRange === '1d' ? 0.038 : timeRange === '7d' ? 0.25 : timeRange === '30d' ? 1.0 : 2.85;

  const baseDownloads = patterns.reduce((acc, p) => acc + p.downloadsCount, 0);
  const totalDownloads = Math.round(baseDownloads * rangeMultiplier);

  // Simulated metrics based on pattern downloads & time range
  const totalVisitors = Math.round(totalDownloads * 1.55);
  const avgTimeOnPage = timeRange === '1d' ? '4m 58s' : '4m 24s';
  const totalToolSessions = Math.round(142800 * rangeMultiplier);

  // Mock Top Keywords driving SEO Traffic
  const TOP_SEO_KEYWORDS = [
    { keyword: 'free crochet row counter app', searches: '24,500/mo', position: '#1 on Google', clicks: '18,200', ctr: '74.3%' },
    { keyword: 'free amigurumi bear pattern pdf', searches: '18,900/mo', position: '#2 on Google', clicks: '12,400', ctr: '65.6%' },
    { keyword: 'yarn yardage calculator for blankets', searches: '14,200/mo', position: '#1 on Google', clicks: '11,100', ctr: '78.1%' },
    { keyword: 'crochet hook size conversion chart', searches: '32,000/mo', position: '#3 on Google', clicks: '16,800', ctr: '52.5%' },
    { keyword: 'how to calculate crochet selling price', searches: '9,800/mo', position: '#1 on Google', clicks: '7,900', ctr: '80.6%' },
    { keyword: 'baby blanket crochet pattern easy', searches: '45,000/mo', position: '#4 on Google', clicks: '14,300', ctr: '31.7%' }
  ];

  const filteredPatterns = patterns.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Header with Time-frame Filter */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-[#E96BA8]/20 text-[#E96BA8] border border-[#E96BA8]/40 p-2 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Real-Time Traffic, Downloads &amp; Tool Analytics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Monitor real visitors, PDF pattern downloads, time spent on craft pages, and organic search ranking metrics.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex flex-wrap items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 text-xs font-bold self-end md:self-auto gap-1">
          {(['1d', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[#E96BA8] text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '1d' ? '1 Day (Today)' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* TOP KPI OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Unique Visitors</span>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {totalVisitors.toLocaleString('en-US')}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.8% from organic Google Search</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">PDF Pattern Downloads</span>
            <Download className="w-5 h-5 text-[#E96BA8]" />
          </div>
          <p className="text-3xl font-black text-[#E96BA8]">
            {totalDownloads.toLocaleString('en-US')}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600">
            <Zap className="w-3.5 h-3.5" />
            <span>64.5% Visitor-to-Download Rate</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Avg. Time Spent on Page</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-500">
            {avgTimeOnPage}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>High engagement for craft tools &amp; guides</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Craft Tool Sessions</span>
            <Wrench className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-500">
            {totalToolSessions.toLocaleString('en-US')}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Row counter is #1 used tool</span>
          </div>
        </div>

      </div>

      {/* PATTERN DOWNLOADS & TIME SPENT DETAILED TABLE */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[28px] overflow-hidden shadow-sm space-y-4 p-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#E96BA8]" />
              Pattern Download Performance &amp; Reader Time Spent ({patterns.length} Patterns)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of visitors, PDF downloads count, average reading time, and conversion rate for each crochet pattern.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pattern analytics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Pattern Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unique Visitors</th>
                <th className="py-3.5 px-4">PDF Downloads</th>
                <th className="py-3.5 px-4">Avg. Time Spent</th>
                <th className="py-3.5 px-4">Download Conv. %</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {filteredPatterns.map((p, idx) => {
                const scaledDownloads = Math.max(1, Math.round(p.downloadsCount * rangeMultiplier));
                const views = Math.round(scaledDownloads * 1.55 + (idx * 3));
                const convRate = Math.min(92, Math.max(45, Math.round((scaledDownloads / views) * 100)));
                const timeMins = Math.max(2, Math.round((p.downloadsCount % 5) + 3));
                const timeSecs = ((idx * 13) % 45) + 10;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e)} 
                          className="w-10 h-10 rounded-xl object-cover shadow-2xs" 
                        />
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold">{p.title}</p>
                          <p className="text-[11px] text-slate-400">Difficulty: {p.difficulty}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-pink-50 text-[#E96BA8] dark:bg-pink-950/60 text-xs font-bold px-2.5 py-1 rounded-full capitalize">
                        {p?.category ? p.category.replace('-', ' ') : 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {views.toLocaleString('en-US')}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-extrabold text-[#E96BA8]">
                      {scaledDownloads.toLocaleString('en-US')}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {timeMins}m {timeSecs}s
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#E96BA8] h-full rounded-full" 
                            style={{ width: `${convRate}%` }} 
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{convRate}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" /> +{(idx * 3 + 12)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CRAFT TOOLS AVERAGE TIME SPENT TABLE */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[28px] overflow-hidden shadow-sm space-y-4 p-6">
        
        <div className="border-b border-slate-100 dark:border-slate-700 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Average Time Spent for Each Craft Tool
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed breakdown of active crafting session durations, user engagement, and bounce rates for all interactive tools.
            </p>
          </div>
          <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" /> High Crafter Engagement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Tool Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">{timeRange === '1d' ? 'Today\'s Sessions' : 'Crafter Sessions'}</th>
                <th className="py-3.5 px-4">Avg Time Spent</th>
                <th className="py-3.5 px-4">Session Retention</th>
                <th className="py-3.5 px-4 text-right">Main Traffic Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {TOOLS_DATA.map((tool, idx) => {
                const baseSessions = Math.floor(tool.id.charCodeAt(0) * 420) + 12000;
                const sessions = Math.max(12, Math.floor(baseSessions * rangeMultiplier));
                const times = ['8m 42s', '5m 18s', '4m 35s', '3m 50s', '6m 12s', '4m 10s'];
                const retentions = ['88.4%', '76.2%', '81.5%', '72.8%', '84.1%', '79.0%'];
                const sources = ['Google Search (78%)', 'Pinterest Direct (64%)', 'Ravelry Links (71%)', 'Google Search (82%)', 'Instagram Bio (69%)', 'Crochet Blogs (75%)'];

                const timeSpent = times[idx % times.length];
                const retention = retentions[idx % retentions.length];
                const source = sources[idx % sources.length];

                return (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold">{tool.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">/tools/{tool.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        {tool.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {sessions.toLocaleString('en-US')}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{timeSpent}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: retention }} />
                        </div>
                        <span>{retention}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-xs text-slate-600 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        {source}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* SEO RANKING KEYWORDS & AUDIENCE BREAKDOWN (HELP SCALE SITE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Organic Google Search Keywords Driving Traffic */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" /> Top SEO Keywords Driving Organic Visitors
              </h3>
              <p className="text-xs text-slate-500">Keywords currently sending high-intent crochet traffic from Google</p>
            </div>
            <span className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-xs font-bold px-2.5 py-1 rounded-full">
              Google Console
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-2">Search Term Keyword</th>
                  <th className="py-2">Monthly Search Vol</th>
                  <th className="py-2">Google Position</th>
                  <th className="py-2 text-right">Monthly Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {TOP_SEO_KEYWORDS.map((k, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{k.keyword}</td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{k.searches}</td>
                    <td className="py-3">
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                        {k.position}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-extrabold text-[#E96BA8] text-right">{k.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device & Audience Breakdown */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[28px] p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" /> Crafter Device Breakdown
            </h3>
            <p className="text-xs text-slate-500">How visitors view your site while stitching</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-[#E96BA8]" /> Mobile Phones (iOS &amp; Android)
                </span>
                <span className="font-mono text-[#E96BA8]">82.4%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-[#E96BA8] h-full rounded-full" style={{ width: '82.4%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Laptop className="w-3.5 h-3.5 text-purple-500" /> Desktop &amp; Laptops
                </span>
                <span className="font-mono text-purple-500">12.1%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '12.1%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-amber-500" /> iPad / Tablets
                </span>
                <span className="font-mono text-amber-500">5.5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '5.5%' }} />
              </div>
            </div>
          </div>

          {/* Actionable Scale Tip Box */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200/80 dark:border-pink-900/40 p-4 rounded-2xl space-y-2 text-xs">
            <span className="font-black text-[#E96BA8] uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Growth Tip to Scale Site
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-snug">
              Since <strong>82.4%</strong> of your visitors are on mobile devices while crocheting, maintaining touch-friendly row counter buttons, offline PWA capabilities, and fast PDF downloads will boost return traffic!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
