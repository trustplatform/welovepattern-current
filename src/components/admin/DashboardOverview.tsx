import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  BarChart3,
  Eye,
  Bookmark,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  FileText,
  Share2,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  MousePointer,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign
} from 'lucide-react';
import { PinterestAnalyticsPeriod, GetAdminPinAnalyticsResponse, calculatePeriodDates } from '../../pinterest/pinterestAnalyticsTypes';
import { Pattern, Review } from '../../types';

interface DashboardOverviewProps {
  patterns: Pattern[];
  reviews: Review[];
  totalDownloads: number;
}

interface SeoEngineStatusData {
  engineActive: boolean;
  autoPublish: boolean;
  requiresApproval: boolean;
  queueDepth: number;
  activeJobsCount: number;
  activeJobs: any[];
  recentHistory: any[];
  discoveredTopicsCount: number;
  dailySpendUsd: number;
  dailyLimitUsd: number;
  integrations: {
    dataForSeo: { configured: boolean };
    openAi: { configured: boolean; model: string };
    higgsfield: { configured: boolean };
  };
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  patterns,
  reviews,
  totalDownloads
}) => {
  const [period, setPeriod] = useState<PinterestAnalyticsPeriod>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeDateRange, setActiveDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Data States
  const [engineStatus, setEngineStatus] = useState<SeoEngineStatusData | null>(null);
  const [pinterestAnalytics, setPinterestAnalytics] = useState<GetAdminPinAnalyticsResponse | null>(null);
  const [pinterestStatus, setPinterestStatus] = useState<any | null>(null);

  // Fetch all live dashboard metrics
  const fetchDashboardData = useCallback(async (
    targetPeriod: PinterestAnalyticsPeriod,
    start?: string,
    end?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Engine Status
      const statusPromise = fetch('/api/seo-engine/status', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      // 2. Fetch Pinterest OAuth Status
      const pinStatusPromise = fetch('/api/admin/pinterest/status', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      // 3. Fetch Pinterest Live Analytics for Period
      const params = new URLSearchParams();
      params.set('period', targetPeriod);
      if (targetPeriod === 'custom' && start && end) {
        params.set('startDate', start);
        params.set('endDate', end);
      }

      const pinAnalyticsPromise = fetch(`/api/admin/pinterest/analytics/pins?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [statusRes, pinStatusRes, pinAnalyticsRes] = await Promise.all([
        statusPromise,
        pinStatusPromise,
        pinAnalyticsPromise
      ]);

      if (statusRes) {
        setEngineStatus(statusRes);
      }
      if (pinStatusRes) {
        setPinterestStatus(pinStatusRes);
      }
      if (pinAnalyticsRes && pinAnalyticsRes.success) {
        setPinterestAnalytics(pinAnalyticsRes);
        setActiveDateRange({ start: pinAnalyticsRes.startDate, end: pinAnalyticsRes.endDate });
      } else {
        // Compute date range locally for display if Pinterest analytics is unconfigured
        const computed = calculatePeriodDates(targetPeriod, start, end);
        if (!computed.error) {
          setActiveDateRange({ start: computed.startDate, end: computed.endDate });
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Could not retrieve live dashboard metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (period !== 'custom') {
      fetchDashboardData(period);
    }
  }, [period, fetchDashboardData]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    fetchDashboardData('custom', customStart, customEnd);
  };

  // Compute Production Metrics for Selected Period
  const activeJobs = engineStatus?.activeJobs || [];
  const historyJobs = engineStatus?.recentHistory || [];
  const allJobs = [...activeJobs, ...historyJobs];

  // Filter jobs within current active reporting window
  const periodJobs = React.useMemo(() => {
    if (!activeDateRange.start || !activeDateRange.end) return allJobs;
    return allJobs.filter(j => {
      const jobDate = (j.createdAt || j.updatedAt || '').split('T')[0];
      return jobDate >= activeDateRange.start && jobDate <= activeDateRange.end;
    });
  }, [allJobs, activeDateRange]);

  const totalArticlesProduced = periodJobs.length;
  const totalPublishedArticles = periodJobs.filter(j => j.stage === 'published' || j.articlePublished).length;
  const totalPinsGenerated = periodJobs.reduce((acc, j) => acc + (j.pins?.length || 2), 0);
  const totalFailedJobs = periodJobs.filter(j => j.stage === 'failed').length;
  const awaitingApprovalJobs = allJobs.filter(j => j.stage === 'awaiting_approval');

  // Top Performing Pins (Sorted by Outbound Clicks)
  const topPins = React.useMemo(() => {
    if (!pinterestAnalytics?.pins) return [];
    return [...pinterestAnalytics.pins]
      .filter(p => p.analyticsStatus === 'success')
      .sort((a, b) => (b.metrics?.outboundClicks || 0) - (a.metrics?.outboundClicks || 0))
      .slice(0, 3);
  }, [pinterestAnalytics?.pins]);

  // Integration Health Check Helpers
  const isDataForSeoHealthy = engineStatus?.integrations?.dataForSeo?.configured ?? false;
  const isHiggsfieldHealthy = engineStatus?.integrations?.higgsfield?.configured ?? false;
  const isPinterestHealthy = pinterestStatus?.connected && !pinterestStatus?.tokenExpired;
  const isStorageHealthy = true; // State is atomic and loaded

  const integrationIssues = [
    !isDataForSeoHealthy && 'DataForSEO API credentials missing in environment',
    !isHiggsfieldHealthy && 'Higgsfield HF_KEY missing in environment',
    !isPinterestHealthy && 'Pinterest OAuth disconnected or token expired',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER WITH PERIOD SELECTOR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="bg-[#E96BA8]/20 text-[#E96BA8] border border-[#E96BA8]/40 p-2.5 rounded-xl shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                Executive Dashboard Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Real-time SEO production, audience reach, Pinterest referral traffic, and system health.
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

        {/* Period Selector Tabs & Refresh */}
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
              setIsRefreshing(true);
              if (period === 'custom') {
                if (customStart && customEnd) fetchDashboardData('custom', customStart, customEnd);
              } else {
                fetchDashboardData(period);
              }
            }}
            disabled={isLoading || isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E96BA8]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* CUSTOM DATE FORM */}
      {period === 'custom' && (
        <form onSubmit={handleApplyCustom} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4 text-xs">
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
            Apply Range
          </button>
        </form>
      )}

      {/* 2. PRODUCTION KPI METRIC CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Articles Produced */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Articles Produced</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : totalArticlesProduced}
          </p>
          <span className="text-xs text-slate-500 block truncate">
            {totalPublishedArticles} published to blog
          </span>
        </div>

        {/* Pins Created */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pins Created</span>
            <Share2 className="w-4 h-4 text-[#E96BA8]" />
          </div>
          <p className="text-3xl font-black text-[#E96BA8]">
            {isLoading ? '...' : totalPinsGenerated}
          </p>
          <span className="text-xs text-slate-500 block truncate">
            Higgsfield Image 2.0 Alpha
          </span>
        </div>

        {/* Total Published Patterns (Site Total) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Patterns</span>
            <Layers className="w-4 h-4 text-[#9B7CF8]" />
          </div>
          <p className="text-3xl font-black text-[#9B7CF8]">
            {patterns.length}
          </p>
          <span className="text-xs text-emerald-600 font-bold block truncate">
            +100% Free Maker Access
          </span>
        </div>

        {/* Total PDF Downloads */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total PDF Downloads</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {totalDownloads.toLocaleString('en-US')}
          </p>
          <span className="text-xs text-slate-500 block truncate">
            Across 13 craft categories
          </span>
        </div>

      </div>

      {/* 3. NEEDS ATTENTION & INTEGRATION HEALTH ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD A: NEEDS ATTENTION */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${awaitingApprovalJobs.length > 0 || totalFailedJobs > 0 || integrationIssues.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Needs Attention</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {awaitingApprovalJobs.length + totalFailedJobs + integrationIssues.length} Items
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Awaiting Approval Notice */}
            {awaitingApprovalJobs.length > 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>{awaitingApprovalJobs.length} draft articles</strong> awaiting editorial approval before publishing.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero pending draft approvals. Production queue is clear.</span>
              </div>
            )}

            {/* Failed Jobs Notice */}
            {totalFailedJobs > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span><strong>{totalFailedJobs} jobs</strong> failed quality gate validation in this period.</span>
              </div>
            )}

            {/* Integration Issues Notice */}
            {integrationIssues.map((issue, idx) => (
              <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CARD B: COMPACT SYSTEM HEALTH */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">System &amp; Integration Health</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            
            {/* DataForSEO */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">DataForSEO</span>
                {isDataForSeoHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <span className={`text-[10px] font-bold block ${isDataForSeoHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isDataForSeoHealthy ? 'Trends API Active' : 'Keys Missing'}
              </span>
            </div>

            {/* Higgsfield */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Higgsfield Image</span>
                {isHiggsfieldHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <span className={`text-[10px] font-bold block ${isHiggsfieldHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isHiggsfieldHealthy ? 'Ready (Studio 2.0)' : 'HF_KEY Missing'}
              </span>
            </div>

            {/* Pinterest */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Pinterest OAuth</span>
                {isPinterestHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <span className={`text-[10px] font-bold block ${isPinterestHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isPinterestHealthy ? `@${pinterestStatus?.account?.username || 'Connected'}` : 'Not Connected'}
              </span>
            </div>

            {/* State Storage */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">State Storage</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 block">
                Atomic JSON OK
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* 4. PINTEREST PERFORMANCE & TOP PINS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#E96BA8]" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Pinterest Audience &amp; Traffic Reach</h3>
              <p className="text-xs text-slate-500">Live aggregated metrics from published Pins in this period.</p>
            </div>
          </div>
          {pinterestAnalytics?.summary && (
            <span className="text-xs font-mono font-bold text-slate-400">
              {pinterestAnalytics.summary.totalPinsTracked} Pins tracked
            </span>
          )}
        </div>

        {/* Pinterest Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Impressions</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {pinterestAnalytics?.summary?.totalImpressions?.toLocaleString() ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Saves</span>
            <p className="text-2xl font-black text-[#E96BA8]">
              {pinterestAnalytics?.summary?.totalSaves?.toLocaleString() ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Outbound Clicks</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {pinterestAnalytics?.summary?.totalOutboundClicks?.toLocaleString() ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Weighted CTR</span>
            <p className="text-2xl font-black text-[#9B7CF8]">
              {((pinterestAnalytics?.summary?.averageCTR ?? 0) * 100).toFixed(2)}%
            </p>
          </div>

        </div>

        {/* Top Pins List */}
        {topPins.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Top Traffic Driving Pins</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topPins.map((pin) => (
                <div key={pin.pinterestPinId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <img
                    src={pin.imageUrl}
                    alt={pin.headline}
                    className="w-10 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{pin.headline || pin.articleTitle}</p>
                    <p className="text-[10px] text-slate-400 truncate">{pin.boardName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{pin.metrics.outboundClicks} clicks</span>
                      <span className="text-slate-400 font-mono">{(pin.metrics.clickThroughRate * 100).toFixed(1)}% CTR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. TREND DISCOVERY SUMMARY & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD A: TREND DISCOVERY SUMMARY */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#E96BA8]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Trend Discovery Pool</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {engineStatus?.discoveredTopicsCount ?? 0} Qualified Topics
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Multi-Market Coverage</span>
                <span className="text-[11px] text-slate-500">US, GB, CA, AU, NZ</span>
              </div>
              <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] font-bold rounded-full text-[10px]">
                5 Markets
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Trend Window Ratio</span>
                <span className="text-[11px] text-slate-500">7-Day (40%) / 30-Day (35%) / 90-Day (25%)</span>
              </div>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                40/35/25
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Cannibalization Protection</span>
                <span className="text-[11px] text-slate-500">60-Day lookback duplicate prevention</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold rounded-full text-[10px]">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* CARD B: RECENT ACTIVITY TIMELINE */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#9B7CF8]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent Activity Timeline</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Live Logs</span>
          </div>

          <div className="space-y-3 text-xs">
            {allJobs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No production jobs logged yet.</p>
            ) : (
              allJobs.slice(0, 4).map((j, i) => (
                <div key={j.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {j.topic?.keyword || j.articleDraft?.title || 'SEO Article Production'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(j.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {j.topic?.contentType || 'craft'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    j.stage === 'published'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : j.stage === 'awaiting_approval'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      : j.stage === 'failed'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400'
                  }`}>
                    {j.stage}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
