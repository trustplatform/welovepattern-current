/**
 * Pinterest Pin Analytics Aggregation Module
 *
 * Reads stored Pins from the SEO Engine state, queries Pinterest Analytics via fetchPinAnalytics(),
 * links metrics directly to parent Articles, and returns a clean, normalized structure.
 */

import { readEngineState } from '../seo-engine/queue/engineStorage';
import { fetchPinAnalytics, PinAnalyticsSummary, PinDailyAnalyticsRecord } from './pinterestApi';
import { SeoEngineArticleJob, PinterestCreativeConcept, SeoEngineDailyState } from '../seo-engine/types';

export interface EnrichedPinAnalyticsRecord {
  // Pin Identity
  pinterestPinId: string;
  jobId: string;
  pinNumber: number;
  publishedAt: string;

  // Parent Article Details
  articleTitle: string;
  articleSlug: string;
  category: string;

  // Creative & Visual Concept
  headline: string;
  cta: string;
  conceptAngle: string;
  compositionType: string;
  imageUrl: string;
  boardName: string;
  targetBoardId: string;
  destinationUrl: string;

  // Analytics Status & Metrics
  analyticsStatus: 'success' | 'unavailable' | 'failed';
  errorMessage?: string;
  metrics: PinAnalyticsSummary;
  dailyBreakdown: PinDailyAnalyticsRecord[];
}

export interface GetPinAnalyticsOptions {
  state?: SeoEngineDailyState; // Allows injecting custom/mock state for testing
  fetchFn?: typeof fetchPinAnalytics; // Allows mocking the API fetcher
}

export interface GetPinAnalyticsResult {
  success: boolean;
  startDate: string;
  endDate: string;
  totalPinsTracked: number;
  pinsWithMetrics: number;
  pinsFailed: number;
  pins: EnrichedPinAnalyticsRecord[];
}

interface StagingPinEntry {
  pin: PinterestCreativeConcept;
  job: SeoEngineArticleJob;
}

/**
 * Aggregates Pinterest analytics for all published Pins stored in the SEO Engine state.
 */
export async function getPinAnalytics(
  startDate: string,
  endDate: string,
  options: GetPinAnalyticsOptions = {}
): Promise<GetPinAnalyticsResult> {
  const state = options.state || readEngineState();
  const fetcher = options.fetchFn || fetchPinAnalytics;

  // 1. Gather all jobs across active and completed histories
  const allJobs: SeoEngineArticleJob[] = [
    ...(state.activeJobs || []),
    ...(Array.isArray((state as any).completedJobsHistory) ? (state as any).completedJobsHistory : [])
  ];

  // 2. Extract and deduplicate valid published pins with a pinterestPinId
  const uniquePinsMap = new Map<string, StagingPinEntry>();

  for (const job of allJobs) {
    const pins = Array.isArray(job.pinterestPins) ? job.pinterestPins : [];
    for (const pin of pins) {
      if (pin && pin.publishStatus === 'published' && pin.pinterestPinId && pin.pinterestPinId.trim()) {
        const cleanId = pin.pinterestPinId.trim();
        // Deduplicate: preserve the first occurrence if seen multiple times
        if (!uniquePinsMap.has(cleanId)) {
          uniquePinsMap.set(cleanId, { pin, job });
        }
      }
    }
  }

  const entries = Array.from(uniquePinsMap.values());
  const enrichedPins: EnrichedPinAnalyticsRecord[] = [];

  // Default empty metrics template for failed / unavailable pins
  const emptyMetrics: PinAnalyticsSummary = {
    impressions: 0,
    saves: 0,
    pinClicks: 0,
    outboundClicks: 0,
    engagements: 0,
    closeups: 0,
    engagementRate: 0,
    clickThroughRate: 0,
  };

  let pinsWithMetrics = 0;
  let pinsFailed = 0;

  // 3. For every valid published Pin, query Pinterest Analytics concurrently
  const fetchPromises = entries.map(async ({ pin, job }) => {
    const cleanId = pin.pinterestPinId!.trim();
    const publishedAt = job.updatedAt || job.dateScheduled || new Date().toISOString();

    const recordBase: Omit<EnrichedPinAnalyticsRecord, 'analyticsStatus' | 'errorMessage' | 'metrics' | 'dailyBreakdown'> = {
      pinterestPinId: cleanId,
      jobId: job.id,
      pinNumber: pin.pinNumber || 1,
      publishedAt,
      articleTitle: job.articleContent?.title || job.topic?.keyword || 'Untitled Article',
      articleSlug: job.articleContent?.slug || '',
      category: job.category || job.articleContent?.category || 'crochet',
      headline: pin.typographyOverlay?.primaryHeadline || '',
      cta: pin.typographyOverlay?.ctaBadgeText || '',
      conceptAngle: pin.conceptAngle || '',
      compositionType: pin.visualStyle?.compositionType || 'single_hero',
      imageUrl: pin.stablePublicUrl || pin.stableAssetPath || '',
      boardName: pin.targetBoardName || pin.boardName || 'Crochet Patterns',
      targetBoardId: pin.targetBoardId || '',
      destinationUrl: pin.destinationUrl || '',
    };

    try {
      const analyticsRes = await fetcher(cleanId, startDate, endDate);

      if (analyticsRes.success && analyticsRes.summary) {
        pinsWithMetrics++;
        return {
          ...recordBase,
          analyticsStatus: 'success' as const,
          metrics: analyticsRes.summary,
          dailyBreakdown: analyticsRes.dailyBreakdown || [],
        };
      } else {
        pinsFailed++;
        return {
          ...recordBase,
          analyticsStatus: 'failed' as const,
          errorMessage: analyticsRes.error || 'Failed to retrieve metrics from Pinterest',
          metrics: emptyMetrics,
          dailyBreakdown: [],
        };
      }
    } catch (err: any) {
      pinsFailed++;
      return {
        ...recordBase,
        analyticsStatus: 'failed' as const,
        errorMessage: err?.message || 'Unexpected error fetching Pin metrics',
        metrics: emptyMetrics,
        dailyBreakdown: [],
      };
    }
  });

  const results = await Promise.all(fetchPromises);
  enrichedPins.push(...results);

  return {
    success: true,
    startDate,
    endDate,
    totalPinsTracked: enrichedPins.length,
    pinsWithMetrics,
    pinsFailed,
    pins: enrichedPins,
  };
}

export type PinterestAnalyticsPeriod = 'today' | 'yesterday' | '7d' | 'this_month' | 'last_month' | 'custom';

export interface PinAnalyticsAggregatedSummary {
  totalPinsTracked: number;
  pinsWithMetrics: number;
  pinsFailed: number;
  totalImpressions: number;
  totalSaves: number;
  totalPinClicks: number;
  totalOutboundClicks: number;
  totalEngagements: number;
  totalCloseups: number;
  averageCTR: number;
}

export interface GetAdminPinAnalyticsResponse {
  success: boolean;
  period: PinterestAnalyticsPeriod;
  startDate: string;
  endDate: string;
  summary: PinAnalyticsAggregatedSummary;
  pins: EnrichedPinAnalyticsRecord[];
}

/**
 * Calculates start and end dates (YYYY-MM-DD) based on period and timezone.
 */
export function calculatePeriodDates(
  period: PinterestAnalyticsPeriod,
  customStart?: string,
  customEnd?: string,
  timeZone: string = 'America/New_York'
): { startDate: string; endDate: string; error?: string } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (period === 'custom') {
    if (!customStart || !customEnd) {
      return {
        startDate: '',
        endDate: '',
        error: 'Both startDate and endDate are required for custom period in YYYY-MM-DD format.'
      };
    }

    if (!dateRegex.test(customStart) || !dateRegex.test(customEnd)) {
      return {
        startDate: '',
        endDate: '',
        error: 'Invalid date format. Expected YYYY-MM-DD.'
      };
    }

    if (new Date(customStart).getTime() > new Date(customEnd).getTime()) {
      return {
        startDate: '',
        endDate: '',
        error: `startDate (${customStart}) cannot be after endDate (${customEnd}).`
      };
    }

    return { startDate: customStart, endDate: customEnd };
  }

  // Format date helper respecting configured timezone
  const getZonedDate = (d: Date): { year: number; month: number; day: number; str: string } => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const str = formatter.format(d); // Returns YYYY-MM-DD
    const [year, month, day] = str.split('-').map(Number);
    return { year, month, day, str };
  };

  const now = new Date();
  const currentZoned = getZonedDate(now);

  const formatParts = (y: number, m: number, d: number): string => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  if (period === 'today') {
    return { startDate: currentZoned.str, endDate: currentZoned.str };
  }

  if (period === 'yesterday') {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yStr = getZonedDate(yesterday).str;
    return { startDate: yStr, endDate: yStr };
  }

  if (period === '7d') {
    const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startStr = getZonedDate(past7).str;
    return { startDate: startStr, endDate: currentZoned.str };
  }

  if (period === 'this_month') {
    const startStr = formatParts(currentZoned.year, currentZoned.month, 1);
    return { startDate: startStr, endDate: currentZoned.str };
  }

  if (period === 'last_month') {
    const prevMonth = currentZoned.month === 1 ? 12 : currentZoned.month - 1;
    const prevYear = currentZoned.month === 1 ? currentZoned.year - 1 : currentZoned.year;
    // Last day of previous month
    const daysInLastMonth = new Date(prevYear, prevMonth, 0).getDate();
    const startStr = formatParts(prevYear, prevMonth, 1);
    const endStr = formatParts(prevYear, prevMonth, daysInLastMonth);
    return { startDate: startStr, endDate: endStr };
  }

  return { startDate: currentZoned.str, endDate: currentZoned.str };
}

/**
 * Calculates aggregated summary metrics from pin records.
 */
export function calculateAggregatedSummary(pins: EnrichedPinAnalyticsRecord[]): PinAnalyticsAggregatedSummary {
  let totalImpressions = 0;
  let totalSaves = 0;
  let totalPinClicks = 0;
  let totalOutboundClicks = 0;
  let totalEngagements = 0;
  let totalCloseups = 0;
  let pinsWithMetrics = 0;
  let pinsFailed = 0;

  for (const pin of pins) {
    if (pin.analyticsStatus === 'success' && pin.metrics) {
      pinsWithMetrics++;
      totalImpressions += pin.metrics.impressions || 0;
      totalSaves += pin.metrics.saves || 0;
      totalPinClicks += pin.metrics.pinClicks || 0;
      totalOutboundClicks += pin.metrics.outboundClicks || 0;
      totalEngagements += pin.metrics.engagements || 0;
      totalCloseups += pin.metrics.closeups || 0;
    } else if (pin.analyticsStatus === 'failed') {
      pinsFailed++;
    }
  }

  // Safe weighted average CTR = totalOutboundClicks / totalImpressions
  const averageCTR = totalImpressions > 0
    ? Math.round((totalOutboundClicks / totalImpressions) * 10000) / 10000
    : 0;

  return {
    totalPinsTracked: pins.length,
    pinsWithMetrics,
    pinsFailed,
    totalImpressions,
    totalSaves,
    totalPinClicks,
    totalOutboundClicks,
    totalEngagements,
    totalCloseups,
    averageCTR,
  };
}

