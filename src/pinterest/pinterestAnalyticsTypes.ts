/**
 * Pinterest Analytics Client-Safe Types & Pure Date Helpers
 *
 * This module contains ONLY types, interfaces, and pure calculation functions
 * that are 100% safe to import into browser/Vite frontend bundles.
 *
 * It MUST NOT import:
 * - engineStorage
 * - pinterestApi
 * - pinterestOAuth
 * - Node.js modules (fs, path, crypto, process)
 */

export type PinterestPinMetricType =
  | 'IMPRESSION'
  | 'SAVE'
  | 'PIN_CLICK'
  | 'OUTBOUND_CLICK'
  | 'ENGAGEMENT'
  | 'CLOSEUP';

export interface PinAnalyticsSummary {
  impressions: number;
  saves: number;
  pinClicks: number;
  outboundClicks: number;
  engagements: number;
  closeups: number;
  engagementRate: number;      // engagements / impressions (0 to 1)
  clickThroughRate: number;    // outboundClicks / impressions (0 to 1)
}

export interface PinDailyAnalyticsRecord {
  date: string;                // YYYY-MM-DD
  metrics: Partial<Record<PinterestPinMetricType, number>>;
}

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
 * Pure helper to calculate start and end dates (YYYY-MM-DD) based on period and timezone.
 * Safe for both browser and Node.js execution.
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
 * Pure helper to calculate aggregated summary metrics from pin records.
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
