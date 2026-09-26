import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Bookmark,
  MousePointer,
  ExternalLink,
  Sparkles,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  ArrowUpDown,
  Share2,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import {
  PinterestAnalyticsPeriod,
  GetAdminPinAnalyticsResponse,
  EnrichedPinAnalyticsRecord,
  PinAnalyticsAggregatedSummary
} from '../../pinterest/pinterestAnalyticsTypes';

type SortField = 'outboundClicks' | 'saves' | 'impressions' | 'engagementRate' | 'clickThroughRate';

export const PinterestPinAnalyticsSection: React.FC = () => {
  const [period, setPeriod] = useState<PinterestAnalyticsPeriod>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeDateRange, setActiveDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GetAdminPinAnalyticsResponse | null>(null);

  // Sorting & Expanded rows state
  const [sortField, setSortField] = useState<SortField>('outboundClicks');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedPinId, setExpandedPinId] = useState<string | null>(null);

  // Fetch Pin Analytics from API
  const fetchAnalytics = useCallback(async (
    targetPeriod: PinterestAnalyticsPeriod,
    start?: string,
    end?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('period', targetPeriod);
      if (targetPeriod === 'custom' && start && end) {
        params.set('startDate', start);
        params.set('endDate', end);
      }

      const res = await fetch(`/api/admin/pinterest/analytics/pins?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to load Pin analytics (HTTP ${res.status})`);
      }

      setData(json);
      setActiveDateRange({ start: json.startDate, end: json.endDate });
    } catch (err: any) {
      console.error('Pinterest analytics fetch error:', err);
      setError(err?.message || 'Failed to communicate with Pinterest analytics service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch whenever non-custom period changes
  useEffect(() => {
    if (period !== 'custom') {
      fetchAnalytics(period);
    }
  }, [period, fetchAnalytics]);

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setError('Please provide both Start and End dates for custom range.');
      return;
    }
    if (new Date(customStart).getTime() > new Date(customEnd).getTime()) {
      setError('Start Date cannot be after End Date.');
      return;
    }
    fetchAnalytics('custom', customStart, customEnd);
  };

  const handleToggleExpand = (pinId: string) => {
    setExpandedPinId(prev => prev === pinId ? null : pinId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort Pins deterministically
  const sortedPins = React.useMemo(() => {
    if (!data?.pins) return [];
    return [...data.pins].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'outboundClicks') {
        valA = a.metrics?.outboundClicks || 0;
        valB = b.metrics?.outboundClicks || 0;
      } else if (sortField === 'saves') {
        valA = a.metrics?.saves || 0;
        valB = b.metrics?.saves || 0;
      } else if (sortField === 'impressions') {
        valA = a.metrics?.impressions || 0;
        valB = b.metrics?.impressions || 0;
      } else if (sortField === 'engagementRate') {
        valA = a.metrics?.engagementRate || 0;
        valB = b.metrics?.engagementRate || 0;
      } else if (sortField === 'clickThroughRate') {
        valA = a.metrics?.clickThroughRate || 0;
        valB = b.metrics?.clickThroughRate || 0;
      }

      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });
  }, [data?.pins, sortField, sortDirection]);

  // Top Saved Pins (top 3)
  const topSavedPins = React.useMemo(() => {
    if (!data?.pins) return [];
    return [...data.pins]
      .filter(p => (p.metrics?.saves || 0) > 0)
      .sort((a, b) => (b.metrics?.saves || 0) - (a.metrics?.saves || 0))
      .slice(0, 3);
  }, [data?.pins]);

  // Top Traffic Pins (top 3)
  const topTrafficPins = React.useMemo(() => {
    if (!data?.pins) return [];
    return [...data.pins]
      .filter(p => (p.metrics?.outboundClicks || 0) > 0)
      .sort((a, b) => (b.metrics?.outboundClicks || 0) - (a.metrics?.outboundClicks || 0))
      .slice(0, 3);
  }, [data?.pins]);

  const summary: PinAnalyticsAggregatedSummary = data?.summary || {
    totalPinsTracked: 0,
    pinsWithMetrics: 0,
    pinsFailed: 0,
    totalImpressions: 0,
    totalSaves: 0,
    totalPinClicks: 0,
    totalOutboundClicks: 0,
    totalEngagements: 0,
    totalCloseups: 0,
    averageCTR: 0
  };

  return (
    <div className="space-y-6 pt-4 border-t border-stone-200">
      
      {/* 1. HEADER WITH PERIOD SELECTOR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="bg-[#E96BA8]/20 text-[#E96BA8] border border-[#E96BA8]/40 p-2.5 rounded-xl shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                Pinterest Pin Performance
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                See which Pins earn engagement and which Pins bring visitors to WeLovePattern.
              </p>
            </div>
          </div>
          {activeDateRange.start && (
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-[#E96BA8]" />
              <span>Reporting window: <strong className="text-slate-200">{activeDateRange.start}</strong> to <strong className="text-slate-200">{activeDateRange.end}</strong></span>
            </div>
          )}
        </div>

        {/* Date Filter Controls & Refresh */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 w-full md:w-auto">
          <div className="flex flex-wrap items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 text-xs font-bold gap-1">
            {([
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === tab.id
                    ? 'bg-[#E96BA8] text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (period === 'custom') {
                if (customStart && customEnd) fetchAnalytics('custom', customStart, customEnd);
              } else {
                fetchAnalytics(period);
              }
            }}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#E96BA8]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* CUSTOM DATE RANGE PICKER FORM */}
      {period === 'custom' && (
        <form onSubmit={handleApplyCustomDate} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">From Date:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">To Date:</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] hover:opacity-95 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Apply Date Range'}
          </button>
        </form>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start justify-between gap-3 text-rose-800 dark:text-rose-300 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Could not load Pinterest Pin Analytics</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics(period, customStart, customEnd)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. KPI SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Impressions */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Impressions</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : summary.totalImpressions.toLocaleString('en-US')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Pin views in feed</span>
        </div>

        {/* Saves */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saves</span>
            <Bookmark className="w-4 h-4 text-[#E96BA8]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#E96BA8]">
            {isLoading ? '...' : summary.totalSaves.toLocaleString('en-US')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Saved to user boards</span>
        </div>

        {/* Pin Clicks */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pin Clicks</span>
            <MousePointer className="w-4 h-4 text-[#9B7CF8]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#9B7CF8]">
            {isLoading ? '...' : summary.totalPinClicks.toLocaleString('en-US')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Expanded on Pinterest</span>
        </div>

        {/* Outbound Clicks (Traffic) */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Outbound</span>
            <ExternalLink className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : summary.totalOutboundClicks.toLocaleString('en-US')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Direct site visitors</span>
        </div>

        {/* Total Engagements */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Engagements</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : summary.totalEngagements.toLocaleString('en-US')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Total user actions</span>
        </div>

        {/* Average CTR */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg. CTR</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : `${(summary.averageCTR * 100).toFixed(2)}%`}
          </p>
          <span className="text-[10px] text-slate-500 font-medium block truncate">Outbound clicks / views</span>
        </div>

      </div>

      {/* 3. COMPACT TOP INSIGHTS (MOST SAVED VS TOP TRAFFIC) */}
      {!isLoading && data && data.pins.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Most Saved Pins Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#E96BA8]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Most Saved Pins</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">What people like</span>
            </div>

            {topSavedPins.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No saves recorded in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {topSavedPins.map((pin) => (
                  <div key={pin.pinterestPinId} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={pin.imageUrl}
                        alt={pin.headline}
                        className="w-8 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{pin.headline || pin.articleTitle}</p>
                        <p className="text-[11px] text-slate-500 truncate">{pin.boardName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#E96BA8]">{pin.metrics.saves.toLocaleString()} saves</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{(pin.metrics.engagementRate * 100).toFixed(1)}% eng</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Traffic Pins Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Top Traffic Pins</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">What brings visitors</span>
            </div>

            {topTrafficPins.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No outbound clicks recorded in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {topTrafficPins.map((pin) => (
                  <div key={pin.pinterestPinId} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={pin.imageUrl}
                        alt={pin.headline}
                        className="w-8 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{pin.headline || pin.articleTitle}</p>
                        <p className="text-[11px] text-slate-500 truncate">{pin.articleTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{pin.metrics.outboundClicks.toLocaleString()} visitors</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{(pin.metrics.clickThroughRate * 100).toFixed(2)}% CTR</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. MAIN TOP PINS PERFORMANCE TABLE */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm space-y-4">
        
        {/* Table Header & Sort Controls */}
        <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">All Published Pin Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click any Pin row to inspect full creative details, CTA styling, and daily performance logs.</p>
          </div>

          {/* Quick Sort Dropdown / Controls */}
          <div className="flex items-center gap-2 text-xs font-bold self-start sm:self-auto">
            <span className="text-slate-400">Sort by:</span>
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
              {([
                { id: 'outboundClicks', label: 'Outbound Clicks' },
                { id: 'saves', label: 'Saves' },
                { id: 'impressions', label: 'Impressions' },
                { id: 'engagementRate', label: 'Eng. Rate' },
                { id: 'clickThroughRate', label: 'CTR' },
              ] as const).map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleSort(btn.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    sortField === btn.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{btn.label}</span>
                  {sortField === btn.id && (
                    <span className="text-[10px] text-[#E96BA8]">
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#E96BA8]" />
            <p className="text-xs font-bold text-slate-500">Querying live Pinterest Pin analytics...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && (!data || data.pins.length === 0) && (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-[#E96BA8]">
              <Layers className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">No Published Pins with Analytics Yet</h4>
              <p className="text-xs text-slate-500">
                When SEO Engine articles are published to Pinterest with valid Pin IDs, their live views, saves, and outbound traffic metrics will automatically appear here.
              </p>
            </div>
          </div>
        )}

        {/* TABLE CONTENT */}
        {!isLoading && data && data.pins.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Pin Creative</th>
                  <th className="py-3.5 px-4">Article &amp; Category</th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('impressions')}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Impressions</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('saves')}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Saves</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('outboundClicks')}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Outbound</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('engagementRate')}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Eng. Rate</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('clickThroughRate')}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>CTR</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {sortedPins.map((pin) => {
                  const isExpanded = expandedPinId === pin.pinterestPinId;
                  return (
                    <React.Fragment key={pin.pinterestPinId}>
                      <tr
                        onClick={() => handleToggleExpand(pin.pinterestPinId)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-pink-50/40 dark:bg-pink-950/20' : ''
                        }`}
                      >
                        {/* Pin Creative Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={pin.imageUrl}
                              alt={pin.headline}
                              className="w-10 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 shrink-0 shadow-xs border border-slate-200 dark:border-slate-700"
                            />
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  pin.pinNumber === 1
                                    ? 'bg-[#E96BA8]/15 text-[#E96BA8]'
                                    : 'bg-[#9B7CF8]/15 text-[#9B7CF8]'
                                }`}>
                                  Pin {pin.pinNumber}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">#{pin.pinterestPinId.slice(-6)}</span>
                              </div>
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-xs">{pin.headline || 'Custom Handmade Pin'}</p>
                              <p className="text-[11px] text-slate-500 truncate max-w-xs">{pin.boardName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Article Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{pin.articleTitle}</p>
                            <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {pin.category}
                            </span>
                          </div>
                        </td>

                        {/* Impressions */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {pin.metrics.impressions.toLocaleString()}
                        </td>

                        {/* Saves */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-black text-[#E96BA8]">
                          {pin.metrics.saves.toLocaleString()}
                        </td>

                        {/* Outbound Clicks */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {pin.metrics.outboundClicks.toLocaleString()}
                        </td>

                        {/* Engagement Rate */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                          {(pin.metrics.engagementRate * 100).toFixed(1)}%
                        </td>

                        {/* CTR */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {(pin.metrics.clickThroughRate * 100).toFixed(2)}%
                        </td>

                        {/* Expand Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED ROW ACCORDION */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                          <td colSpan={8} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              
                              {/* Creative & Typography Details */}
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h5 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#E96BA8]">
                                  <Sparkles className="w-3.5 h-3.5" /> Creative Specification
                                </h5>
                                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                                  <div><strong className="text-slate-900 dark:text-white">Headline:</strong> {pin.headline}</div>
                                  <div><strong className="text-slate-900 dark:text-white">Action CTA:</strong> <span className="bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] font-bold px-1.5 py-0.5 rounded">{pin.cta}</span></div>
                                  <div><strong className="text-slate-900 dark:text-white">Concept Angle:</strong> {pin.conceptAngle}</div>
                                  <div><strong className="text-slate-900 dark:text-white">Visual Format:</strong> {pin.compositionType}</div>
                                </div>
                              </div>

                              {/* Publishing & Destination Details */}
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h5 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#9B7CF8]">
                                  <Share2 className="w-3.5 h-3.5" /> Target &amp; Links
                                </h5>
                                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                                  <div><strong className="text-slate-900 dark:text-white">Pinterest Pin ID:</strong> <span className="font-mono">{pin.pinterestPinId}</span></div>
                                  <div><strong className="text-slate-900 dark:text-white">Target Board:</strong> {pin.boardName}</div>
                                  <div><strong className="text-slate-900 dark:text-white">Published:</strong> {new Date(pin.publishedAt).toLocaleDateString()}</div>
                                  <div className="pt-1">
                                    <a
                                      href={pin.destinationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[#E96BA8] font-bold hover:underline"
                                    >
                                      <span>View Destination Article</span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Performance Quick Summary */}
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h5 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                                  <TrendingUp className="w-3.5 h-3.5" /> Metrics Summary
                                </h5>
                                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded">
                                    <span className="text-[10px] text-slate-400 block uppercase">Closeups</span>
                                    <strong>{pin.metrics.closeups.toLocaleString()}</strong>
                                  </div>
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded">
                                    <span className="text-[10px] text-slate-400 block uppercase">Pin Clicks</span>
                                    <strong>{pin.metrics.pinClicks.toLocaleString()}</strong>
                                  </div>
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded">
                                    <span className="text-[10px] text-slate-400 block uppercase">Total Eng.</span>
                                    <strong>{pin.metrics.engagements.toLocaleString()}</strong>
                                  </div>
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded">
                                    <span className="text-[10px] text-slate-400 block uppercase">CTR</span>
                                    <strong>{(pin.metrics.clickThroughRate * 100).toFixed(2)}%</strong>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Daily Breakdown Table */}
                            {pin.dailyBreakdown && pin.dailyBreakdown.length > 0 && (
                              <div className="space-y-2">
                                <h6 className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Daily Analytics Breakdown
                                </h6>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                  <table className="w-full text-xs text-left bg-white dark:bg-slate-800">
                                    <thead>
                                      <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 uppercase">
                                        <th className="py-2 px-3">Date</th>
                                        <th className="py-2 px-3 text-right">Impressions</th>
                                        <th className="py-2 px-3 text-right">Saves</th>
                                        <th className="py-2 px-3 text-right">Pin Clicks</th>
                                        <th className="py-2 px-3 text-right">Outbound Clicks</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                                      {pin.dailyBreakdown.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                          <td className="py-1.5 px-3 font-sans font-medium text-slate-900 dark:text-white">{d.date}</td>
                                          <td className="py-1.5 px-3 text-right">{Number(d.metrics.IMPRESSION || 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-3 text-right text-[#E96BA8] font-bold">{Number(d.metrics.SAVE || 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-3 text-right text-[#9B7CF8]">{Number(d.metrics.PIN_CLICK || 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-3 text-right text-emerald-600 font-bold">{Number(d.metrics.OUTBOUND_CLICK || 0).toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
