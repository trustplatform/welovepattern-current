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
import { dispatchScheduledPinterestSlot, dispatchNextOverduePinterestPin } from './publishing/pinterestSlotDispatcher';
import { getLiveBlogPosts } from './publishing/articlePublisher';
import { SeoEngineArticleJob, PinterestCreativeConcept } from './types';

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
 * Strictly verifies if an article job was genuinely and successfully published to live website blog storage.
 * 
 * Strict Invariants:
 * - Failed for ANY reason -> returns false (count = 0)
 * - Incomplete / in-progress -> returns false (count = 0)
 * - Generated but awaiting approval -> returns false (count = 0)
 * - Stage 'failed' / 'filtered_out' -> returns false (count = 0)
 * - Any publication error -> returns false (count = 0)
 * - ONLY returns true if stage is 'completed' (or 'published'), has a valid publishedBlogPostId,
 *   and is confirmed present in live website storage (data/blog-posts.json) with status 'published'.
 */
export function isArticleJobPublished(job: SeoEngineArticleJob, livePosts: any[]): boolean {
  if (!job) return false;
  if (job.stage !== 'completed' && (job.stage as string) !== 'published') {
    return false;
  }
  if (!job.publishedBlogPostId || typeof job.publishedBlogPostId !== 'string' || !job.publishedBlogPostId.trim()) {
    return false;
  }
  if (job.publicationError) {
    return false;
  }
  if (!Array.isArray(livePosts) || livePosts.length === 0) {
    return false;
  }
  const matchingPost = livePosts.find(p =>
    (p.id && p.id === job.publishedBlogPostId) ||
    (p.seoEngineJobId && p.seoEngineJobId === job.id) ||
    (job.publishedSlug && p.slug === job.publishedSlug)
  );
  if (!matchingPost) {
    return false;
  }
  return matchingPost.status === 'published' || matchingPost.status === undefined;
}

/**
 * Strictly verifies if a historical job record was genuinely published to live website blog storage.
 */
export function isHistoricalJobPublished(historyItem: any, livePosts: any[]): boolean {
  if (!historyItem) return false;
  if (historyItem.status !== 'completed' && historyItem.status !== 'published') {
    return false;
  }
  const blogPostId = historyItem.publishedBlogPostId;
  const slug = historyItem.slug || historyItem.publishedSlug;
  if (!blogPostId && !slug) {
    return false;
  }
  if (!Array.isArray(livePosts) || livePosts.length === 0) {
    return false;
  }
  const matchingPost = livePosts.find(p =>
    (blogPostId && p.id === blogPostId) ||
    (historyItem.jobId && p.seoEngineJobId === historyItem.jobId) ||
    (slug && p.slug === slug)
  );
  if (!matchingPost) {
    return false;
  }
  return matchingPost.status === 'published' || matchingPost.status === undefined;
}

/**
 * Strictly checks if a Pinterest pin is genuinely published to Pinterest.
 * Strict rules:
 * - publishStatus MUST be 'published'
 * - pinterestPinId MUST be a non-empty string ID
 */
export function isPinterestPinPublished(pin: PinterestCreativeConcept): boolean {
  return pin?.publishStatus === 'published' && typeof pin?.pinterestPinId === 'string' && pin.pinterestPinId.trim().length > 0;
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

    // Daily quota check: Count ONLY articles that were actually successfully published to the live blog data for this date
    const livePosts = getLiveBlogPosts();
    const publishedArticleKeys = new Set<string>();

    // 1. Count published jobs from activeJobs
    for (const job of state.activeJobs || []) {
      if (job.dateScheduled === dateStr && isArticleJobPublished(job, livePosts)) {
        publishedArticleKeys.add(job.publishedBlogPostId || job.publishedSlug || job.id);
      }
    }

    // 2. Count published jobs from completedJobsHistory
    for (const historyItem of state.completedJobsHistory || []) {
      if (historyItem.date === dateStr && isHistoricalJobPublished(historyItem, livePosts)) {
        publishedArticleKeys.add(historyItem.publishedBlogPostId || historyItem.slug || historyItem.jobId || historyItem.id);
      }
    }

    const todaysArticlesCount = publishedArticleKeys.size;

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
        reason: `Daily articles limit reached (${todaysArticlesCount}/${articlesPerDayLimit} published articles) for date ${dateStr}.`,
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
    let pinDispatchResult = await dispatchScheduledPinterestSlot(timeStr, dateStr);

    // If the exact slot pin was deferred/skipped (e.g. earlier slot was missed), attempt the earliest overdue eligible Pin
    if (!pinDispatchResult.pinPublished && config.autoPublishPinterest !== false) {
      const catchUpResult = await dispatchNextOverduePinterestPin(timeStr, dateStr);
      if (catchUpResult && catchUpResult.pinPublished) {
        pinDispatchResult = catchUpResult;
      }
    }

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

  // -----------------------------------------------------------------
  // C. PINTEREST MISSED-SLOT CATCH-UP (Non-scheduled ticks)
  // -----------------------------------------------------------------
  // If an article finished publishing after its scheduled slot time, or if a slot was missed,
  // dispatch the earliest overdue Pin in strict chronological slot order (at most 1 per tick).
  if (config.autoPublishPinterest !== false) {
    const overduePinResult = await dispatchNextOverduePinterestPin(timeStr, dateStr);
    if (overduePinResult && overduePinResult.pinPublished) {
      return {
        triggered: true,
        action: 'pinterest_publish',
        reason: overduePinResult.reason || `Catch-up dispatched overdue Pin ${overduePinResult.pinNumber} for job ${overduePinResult.jobId}`,
      };
    }
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
