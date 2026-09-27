/**
 * SEO Content Engine - Production Scheduler & Cron Daemon
 * 
 * Provides production-grade deterministic scheduling for:
 * 1. Daily Article Production Slots (e.g. 08:00, 12:00, 16:00, 20:00 in config.timezone)
 * 2. Pinterest Publishing Slots (e.g. 09:00, 13:00, 17:00, 21:00 in config.timezone)
 * 
 * SAFETY & RESILIENCE INVARIANTS:
 * - Timezone-aware: Uses Intl.DateTimeFormat with configured IANA timezone (e.g. 'America/New_York').
 * - Deduplication: Records exact date + slot tokens (`YYYY-MM-DD_HH:mm`) in atomic state to prevent duplicate runs across server restarts.
 * - engineActive guard: Skips execution if engineActive === false.
 * - Quota guard: Strictly respects articlesPerDay (2) limit per daily state.
 * - Concurrency guard: Uses single-flight lock during tick processing.
 * - Pinterest slot separation: Pinterest slots NEVER create new article jobs.
 */

import { readEngineState, writeEngineState } from './queue/engineStorage';
import { createDailyProductionBatch, processQueueWorker } from './queue/jobQueueManager';
import { dispatchScheduledPinterestSlot } from './publishing/pinterestSlotDispatcher';

let schedulerIntervalTimer: NodeJS.Timeout | null = null;
let isTickRunning = false;

export interface TimezoneSlotInfo {
  dateStr: string; // YYYY-MM-DD in target timezone
  timeStr: string; // HH:mm in target timezone
  dayOfWeek: number; // 1 (Mon) .. 7 (Sun)
}

/**
 * Deterministically formats any Date object into the date, time, and day-of-week for a specific IANA timezone.
 * Robust against DST transitions.
 */
export function getTimeInTimezone(date: Date, timeZone: string = 'America/New_York'): TimezoneSlotInfo {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(date);
    let year = '';
    let month = '';
    let day = '';
    let hour = '';
    let minute = '';
    let weekdayStr = '';

    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'weekday') weekdayStr = part.value;
    }

    // Adjust hour if format returns 24
    if (hour === '24') hour = '00';

    const dayMap: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7,
    };

    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      dayOfWeek: dayMap[weekdayStr] || 1,
    };
  } catch (err) {
    // Fallback to UTC if invalid timezone string
    console.warn(`[SeoEngineScheduler] Invalid timezone "${timeZone}", falling back to UTC:`, err);
    const iso = date.toISOString();
    return {
      dateStr: iso.split('T')[0],
      timeStr: iso.split('T')[1].substring(0, 5),
      dayOfWeek: date.getUTCDay() === 0 ? 7 : date.getUTCDay(),
    };
  }
}

export interface SchedulerTickResult {
  triggered: boolean;
  action?: 'article_batch' | 'pinterest_publish' | 'queue_worker_only' | 'skipped_disabled' | 'skipped_already_executed' | 'skipped_quota_reached' | 'no_slot_match';
  slotKey?: string;
  reason?: string;
}

/**
 * Evaluates whether the current clock time matches an article or Pinterest slot, and executes the pipeline if appropriate.
 * Can be called with an explicit simulated Date for deterministic unit testing.
 */
export async function evaluateSchedulerTick(
  simulatedDate?: Date,
  options?: { useRealDataForSeo?: boolean; skipQueueWorkerExecution?: boolean }
): Promise<SchedulerTickResult> {
  const state = readEngineState();
  const config = state.config;

  // 1. Engine Active Check
  if (!config.engineActive) {
    return { triggered: false, action: 'skipped_disabled', reason: 'Engine is inactive (config.engineActive is false)' };
  }

  const now = simulatedDate || new Date();
  const tz = config.timezone || 'America/New_York';
  const { dateStr, timeStr, dayOfWeek } = getTimeInTimezone(now, tz);

  // Check active days (default Monday-Sunday: [1, 2, 3, 4, 5, 6, 7])
  const activeDays = config.activeDays || [1, 2, 3, 4, 5, 6, 7];
  if (!activeDays.includes(dayOfWeek)) {
    return { triggered: false, reason: `Day of week ${dayOfWeek} is not in activeDays` };
  }

  const articlePublishTimes = config.articlePublishTimes || ['08:00', '12:00', '16:00', '20:00'];
  const pinterestPublishTimes = config.pinterestPublishTimes || ['09:00', '13:00', '17:00', '21:00'];

  const isArticleSlot = articlePublishTimes.includes(timeStr);
  const isPinterestSlot = pinterestPublishTimes.includes(timeStr);

  // -----------------------------------------------------------------
  // A. ARTICLE PRODUCTION SLOT
  // -----------------------------------------------------------------
  if (isArticleSlot) {
    const slotKey = `${dateStr}_${timeStr}`;

    // Deduplication check: Has this exact slot already executed for this date?
    if (state.lastExecutedArticleSlot === slotKey) {
      return {
        triggered: false,
        action: 'skipped_already_executed',
        slotKey,
        reason: `Article slot ${slotKey} has already executed on date ${dateStr}.`,
      };
    }

    // Daily quota check: Have we already reached articlesPerDay (default: 2) for this date?
    const todaysArticlesCount = (state.activeJobs || []).filter(j => j.dateScheduled === dateStr).length +
      (state.completedJobsHistory || []).filter(j => j.date === dateStr).length;

    const articlesPerDayLimit = config.articlesPerDay || 2;
    if (todaysArticlesCount >= articlesPerDayLimit) {
      // Mark slot as acknowledged so we don't repeat the check every minute in this slot
      state.lastExecutedArticleSlot = slotKey;
      state.lastRunDate = dateStr;
      writeEngineState(state);

      return {
        triggered: false,
        action: 'skipped_quota_reached',
        slotKey,
        reason: `Daily articles limit reached (${todaysArticlesCount}/${articlesPerDayLimit}) for date ${dateStr}.`,
      };
    }

    console.log(`[SeoEngineScheduler] 🚀 Article production slot triggered: ${slotKey} (${tz})`);

    // Record slot execution atomically in state
    state.lastExecutedArticleSlot = slotKey;
    state.lastRunDate = dateStr;
    writeEngineState(state);

    // Trigger REAL 2-slot production batch (Trend Discovery -> Slot 1 + Slot 2 -> Queue)
    try {
      await createDailyProductionBatch({
        useRealDataForSeo: options?.useRealDataForSeo
      });

      // Run queue worker to process newly queued jobs (maxConcurrentJobs = 1) unless explicitly skipped for test mode
      if (!options?.skipQueueWorkerExecution) {
        await processQueueWorker();
      }

      return {
        triggered: true,
        action: 'article_batch',
        slotKey,
        reason: `Successfully triggered and processed 2-slot article batch for slot ${slotKey}`,
      };
    } catch (err: any) {
      console.error(`[SeoEngineScheduler] Error running article batch for slot ${slotKey}:`, err);
      return {
        triggered: false,
        action: 'article_batch',
        slotKey,
        reason: `Article batch execution encountered error: ${err?.message || err}`,
      };
    }
  }

  // -----------------------------------------------------------------
  // B. PINTEREST PUBLISHING SLOT (Does NOT create article jobs)
  // -----------------------------------------------------------------
  if (isPinterestSlot) {
    const slotKey = `${dateStr}_${timeStr}`;

    if (state.lastExecutedPinterestSlot === slotKey) {
      return {
        triggered: false,
        action: 'skipped_already_executed',
        slotKey,
        reason: `Pinterest slot ${slotKey} has already executed on date ${dateStr}.`,
      };
    }

    console.log(`[SeoEngineScheduler] 📌 Pinterest publishing slot triggered: ${slotKey} (${tz})`);

    // Record slot execution atomically in state
    state.lastExecutedPinterestSlot = slotKey;
    writeEngineState(state);

    // 1. Dispatch the specific Pin mapped to this slot (09:00 -> Pin 1, 13:00 -> Pin 2, 17:00 -> Pin 3, 21:00 -> Pin 4)
    const pinDispatchResult = await dispatchScheduledPinterestSlot(timeStr, dateStr);

    // 2. Also advance queue worker (only processes existing queued/awaiting jobs) unless skipped in test
    if (!options?.skipQueueWorkerExecution) {
      await processQueueWorker();
    }

    return {
      triggered: true,
      action: 'pinterest_publish',
      slotKey,
      reason: pinDispatchResult.reason || `Processed Pinterest publishing for slot ${slotKey}`,
    };
  }

  // If there are pending selected jobs in queue, ensure queue worker continues
  const hasPendingJobs = (state.activeJobs || []).some(j => j.stage === 'selected');
  if (hasPendingJobs) {
    if (!options?.skipQueueWorkerExecution) {
      await processQueueWorker();
    }
    return {
      triggered: true,
      action: 'queue_worker_only',
      reason: 'Processed pending queue jobs during non-scheduled tick',
    };
  }

  return {
    triggered: false,
    action: 'no_slot_match',
    reason: `Current time ${timeStr} does not match any article or pinterest slots.`,
  };
}

/**
 * Starts the production background interval timer (running every 60 seconds).
 */
export function startSeoEngineScheduler(): void {
  if (schedulerIntervalTimer) {
    console.log('[SeoEngineScheduler] Scheduler is already running.');
    return;
  }

  console.log('[SeoEngineScheduler] Starting autonomous SEO Engine scheduler ticker (interval: 60s)...');

  // Initial immediate tick evaluation on boot
  evaluateSchedulerTick().catch(err => {
    console.error('[SeoEngineScheduler] Initial boot tick error:', err);
  });

  // Background 60-second ticker
  schedulerIntervalTimer = setInterval(async () => {
    if (isTickRunning) {
      return; // Skip if previous tick is still in flight
    }

    isTickRunning = true;
    try {
      await evaluateSchedulerTick();
    } catch (err) {
      console.error('[SeoEngineScheduler] Tick error:', err);
    } finally {
      isTickRunning = false;
    }
  }, 60 * 1000);
}

/**
 * Stops the scheduler interval timer (used for graceful shutdown or tests).
 */
export function stopSeoEngineScheduler(): void {
  if (schedulerIntervalTimer) {
    clearInterval(schedulerIntervalTimer);
    schedulerIntervalTimer = null;
    console.log('[SeoEngineScheduler] Autonomous SEO Engine scheduler ticker stopped.');
  }
}
