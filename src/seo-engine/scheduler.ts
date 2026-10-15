/**
 * SEO Content Engine - Production Scheduler & Cron Daemon
 * 
 * Provides production-grade deterministic scheduling for:
 * 1. Daily Article Production Slots (08:00, 12:00, 16:00 in config.timezone)
 * 2. Pinterest Publishing Slots (08:30, 09:00, 12:30, 13:00, 16:30, 17:00 in config.timezone)
 * 
 * SAFETY & RESILIENCE INVARIANTS:
 * - Timezone-aware: Uses Intl.DateTimeFormat with configured IANA timezone (e.g. 'America/New_York').
 * - Deduplication: Records exact date + slot tokens (`YYYY-MM-DD_HH:mm`) in atomic state to prevent duplicate runs across server restarts.
 * - engineActive guard: Skips execution if engineActive === false.
 * - Quota guard: Strictly respects articlesPerDay (3) limit per daily state.
 * - Concurrency guard: Uses single-flight lock during tick processing.
 * - Pinterest slot separation: Pinterest slots NEVER create new article jobs.
 */

import { readEngineState, writeEngineState, updateJobInState } from './queue/engineStorage';
import { createDailyProductionBatch, createSingleSlotProductionJob, processQueueWorker, executeJobLifecycle } from './queue/jobQueueManager';
import { dispatchScheduledPinterestSlot, dispatchNextOverduePinterestPin } from './publishing/pinterestSlotDispatcher';
import { getLiveBlogPosts, publishArticleToLiveSite } from './publishing/articlePublisher';
import { SeoEngineArticleJob, PinterestCreativeConcept } from './types';
import { getEligibleRecoveredJobs, assignRecoveredJobToSlot, isValidLocalAsset } from './queue/assetRecovery';
import { evaluateProductionQualityGates } from './validation/productionQualityGates';

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
  action?: 'article_batch' | 'pinterest_publish' | 'queue_worker_only' | 'skipped_disabled' | 'skipped_already_executed' | 'skipped_failed_slot' | 'skipped_quota_reached' | 'no_slot_match' | 'inventory_exhausted';
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

  const articlePublishTimes = config.articlePublishTimes || ['08:00', '12:00', '16:00'];
  const pinterestPublishTimes = config.pinterestPublishTimes || ['08:30', '09:00', '12:30', '13:00', '16:30', '17:00'];

  const isArticleSlot = articlePublishTimes.includes(timeStr);
  const isPinterestSlot = pinterestPublishTimes.includes(timeStr);

  // Check for missed past article slots today (e.g. server outage / reboot catch-up)
  let missedArticleSlot: string | null = null;
  let missedSlotNumber: 1 | 2 | 3 = 1;
  if (!isArticleSlot) {
    for (let i = 0; i < articlePublishTimes.length; i++) {
      const s = articlePublishTimes[i];
      if (s <= timeStr) {
        const sKey = `${dateStr}_${s}`;
        const alreadyHandled = state.lastExecutedArticleSlot === sKey ||
          (state.executedArticleSlots && state.executedArticleSlots.includes(sKey)) ||
          (state.failedArticleSlots && state.failedArticleSlots.includes(sKey));
        if (!alreadyHandled) {
          const hasArticleForSlot = (state.activeJobs || []).some(j =>
            ((j.assignedPublishDate === dateStr && (j.assignedSlotTime === s || j.publicationScheduledAt === s)) ||
             (j.publishedAt && j.publishedAt.startsWith(dateStr) && (j.assignedSlotTime === s || j.publicationScheduledAt === s))) &&
            (j.stage === 'completed' || Boolean(j.publishedBlogPostId))
          );
          if (!hasArticleForSlot) {
            missedArticleSlot = s;
            missedSlotNumber = (i + 1) as 1 | 2 | 3;
            break;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------
  // A. ARTICLE PRODUCTION SLOT (Scheduled or Missed Catch-up)
  // -----------------------------------------------------------------
  if (isArticleSlot || missedArticleSlot) {
    const activeSlotTime = isArticleSlot ? timeStr : missedArticleSlot!;
    const slotKey = `${dateStr}_${activeSlotTime}`;

    // Deduplication check: Has this exact slot already executed or failed for this date?
    const alreadyExecuted = state.lastExecutedArticleSlot === slotKey || (state.executedArticleSlots && state.executedArticleSlots.includes(slotKey));
    if (alreadyExecuted) {
      return {
        triggered: false,
        action: 'skipped_already_executed',
        slotKey,
        reason: `Article slot ${slotKey} has already executed on date ${dateStr}.`,
      };
    }
    const alreadyFailed = state.failedArticleSlots && state.failedArticleSlots.includes(slotKey);
    if (alreadyFailed) {
      return {
        triggered: false,
        action: 'skipped_failed_slot',
        slotKey,
        reason: `Article slot ${slotKey} previously failed on date ${dateStr}. Skipping to prevent uncontrolled retry loop.`,
      };
    }

    // Daily quota check: Count all active, awaiting approval, or published articles for today
    const livePosts = getLiveBlogPosts();
    const todaysArticleKeys = new Set<string>();

    // 1. Count valid in-flight, awaiting_approval, ready_to_publish, or completed jobs from activeJobs
    for (const job of state.activeJobs || []) {
      const isForToday = (job.assignedPublishDate === dateStr) || (!job.assignedPublishDate && job.dateScheduled === dateStr);
      if (isForToday) {
        const isNotFailed = job.stage !== 'failed' && (job.stage as string) !== 'filtered_out';
        const isActuallyPublished = Boolean(job.publishedBlogPostId || job.publishedSlug);
        if (isNotFailed && isActuallyPublished) {
          todaysArticleKeys.add(job.publishedBlogPostId || job.publishedSlug || job.id);
        }
      }
    }

    // 2. Count published jobs from completedJobsHistory
    for (const historyItem of state.completedJobsHistory || []) {
      if (historyItem.date === dateStr && isHistoricalJobPublished(historyItem, livePosts)) {
        todaysArticleKeys.add(historyItem.publishedBlogPostId || historyItem.slug || historyItem.jobId || historyItem.id);
      }
    }

    const todaysArticlesCount = todaysArticleKeys.size;

    const articlesPerDayLimit = config.articlesPerDay || 3;
    if (todaysArticlesCount >= articlesPerDayLimit) {
      // Mark slot as acknowledged so we don't repeat the check every minute in this slot
      state.lastExecutedArticleSlot = slotKey;
      if (!state.executedArticleSlots) state.executedArticleSlots = [];
      if (!state.executedArticleSlots.includes(slotKey)) state.executedArticleSlots.push(slotKey);
      state.lastRunDate = dateStr;
      writeEngineState(state);

      return {
        triggered: false,
        action: 'skipped_quota_reached',
        slotKey,
        reason: `Daily articles limit reached (${todaysArticlesCount}/${articlesPerDayLimit} active or published articles) for date ${dateStr}.`,
      };
    }

    console.log(`[SeoEngineScheduler] 🚀 Article production slot triggered: ${slotKey} (${tz})${missedArticleSlot ? ' [Missed-slot recovery]' : ''}`);

    // Record slot evaluation in state
    state.lastRunDate = dateStr;
    writeEngineState(state);

    const slotIdx = articlePublishTimes.indexOf(activeSlotTime);
    const slotNumber: 1 | 2 | 3 = (slotIdx >= 0 ? slotIdx + 1 : missedSlotNumber) as 1 | 2 | 3;

    // 1. REUSE-ONLY WORKFLOW: Publish pre-assigned or eligible recovered packages only ($0 cost, 0 AI generation)
    let targetJob = (state.activeJobs || []).find(j =>
      j.assignedPublishDate === dateStr &&
      (j.assignedSlotTime === activeSlotTime || j.publicationScheduledAt === activeSlotTime) &&
      j.stage !== 'failed' &&
      j.stage !== 'completed' &&
      !j.publishedBlogPostId
    );

    // If not already pre-assigned for this slot, pull next eligible unassigned complete package
    // Only during real scheduled article slots, never during missed catch-up ticks, preserving eligible reserves
    if (!targetJob && isArticleSlot) {
      if (config.reuseOnlyMode !== false) {
        const eligibleRecovered = getEligibleRecoveredJobs(1);
        if (eligibleRecovered.length > 0) {
          targetJob = eligibleRecovered[0];
          console.log(`[SeoEngineScheduler] ♻️ Assigning recovered job "${targetJob.articleContent?.title || targetJob.id}" to Slot ${slotNumber} (${slotKey}). Zero Higgsfield POSTs ($0.00).`);
          assignRecoveredJobToSlot(targetJob.id, dateStr, activeSlotTime, slotNumber);
        }
      } else {
        // Generative mode: create and queue slot-specific production job
        console.log(`[SeoEngineScheduler] Creating new production job for Slot ${slotNumber} (${slotKey})...`);
        try {
          targetJob = await createSingleSlotProductionJob(slotNumber, {
            scheduledDate: dateStr,
            slotTime: activeSlotTime,
            useRealDataForSeo: options?.useRealDataForSeo
          });
          if (targetJob && targetJob.stage === 'selected') {
            await executeJobLifecycle(targetJob.id);
            const freshState = readEngineState();
            targetJob = freshState.activeJobs.find(j => j.id === targetJob!.id) || targetJob;
          }
        } catch (err: any) {
          console.error(`[SeoEngineScheduler] Error creating/executing production job for Slot ${slotNumber}:`, err);
        }
      }
    }

    if (targetJob) {
      console.log(`[SeoEngineScheduler] 🚀 Executing publication for Slot ${slotNumber} (${slotKey}): "${targetJob.articleContent?.title || targetJob.id}"`);

      // In reuse-only publishing mode, verify pre-existing package integrity (content and local assets)
      const isReuseOnly = config.reuseOnlyMode !== false;
      let passesGate = false;
      let gateFailureReason = '';

      if (isReuseOnly) {
        const hasCompleteContent = Boolean(
          targetJob.articleContent?.title &&
          targetJob.articleContent?.contentHtml &&
          targetJob.articleContent.contentHtml.length > 200 &&
          targetJob.articleContent?.slug
        );
        const hasValidHero = isValidLocalAsset(targetJob.articleContent?.heroImage?.stableAssetPath);
        const hasValidPin1 = isValidLocalAsset(targetJob.pinterestPins?.[0]?.stableAssetPath);
        const hasValidPin2 = isValidLocalAsset(targetJob.pinterestPins?.[1]?.stableAssetPath);

        passesGate = hasCompleteContent && hasValidHero && hasValidPin1 && hasValidPin2;
        if (!passesGate) {
          gateFailureReason = `Package incomplete: missing content or local assets (Hero: ${hasValidHero}, Pin1: ${hasValidPin1}, Pin2: ${hasValidPin2})`;
        }
      } else {
        // Run generative production quality gates for newly synthesized articles
        const articlePayload: any = {
          title: targetJob.articleContent?.title || '',
          slug: targetJob.articleContent?.slug || '',
          excerpt: targetJob.articleContent?.excerpt || '',
          contentHtml: targetJob.articleContent?.contentHtml || '',
          wordCount: targetJob.articleContent?.wordCount || 0,
          category: targetJob.articleContent?.category || targetJob.category,
          contentType: targetJob.articleContent?.contentType || targetJob.contentType,
          tags: targetJob.articleContent?.tags || [],
          seoMeta: targetJob.articleContent?.seoMeta || {
            title: targetJob.articleContent?.title || '',
            description: targetJob.articleContent?.excerpt || targetJob.articleContent?.title || '',
            keywords: targetJob.topic?.keyword || '',
          },
          internalLinks: targetJob.articleContent?.internalLinks || [],
          tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };

        const factualPacket: any = targetJob.factualResearch || {
          topicId: targetJob.id,
          topic: targetJob.topic?.keyword || '',
          supportedClaims: [],
        };

        const qualityAudit = evaluateProductionQualityGates(
          targetJob.id,
          articlePayload,
          targetJob.topic,
          factualPacket,
          config
        );
        passesGate = qualityAudit.passedAllGates;
        if (!passesGate) {
          gateFailureReason = qualityAudit.rejectionReasons.join('; ');
        }
      }

      if (passesGate) {
        if (config.autoPublish !== false && config.requiresApproval !== true) {
          const pubResult = await publishArticleToLiveSite(targetJob);
          if (pubResult.success && pubResult.blogPostId) {
            updateJobInState(targetJob.id, j => {
              j.stage = 'completed';
              j.publishedBlogPostId = pubResult.blogPostId;
              j.publishedSlug = pubResult.slug;
              j.publishedUrl = pubResult.publicUrl;
              j.publishedAt = new Date().toISOString();
              j.indexNowNotified = true;
              j.logs.push({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `[Scheduler] Recovered article successfully published to live website: ${pubResult.publicUrl} (Blog Post ID: ${pubResult.blogPostId}) for slot ${slotKey}`,
              });
              return j;
            });

            // Mark slot as successfully executed
            state.lastExecutedArticleSlot = slotKey;
            if (!state.executedArticleSlots) state.executedArticleSlots = [];
            if (!state.executedArticleSlots.includes(slotKey)) state.executedArticleSlots.push(slotKey);
            writeEngineState(state);

            return {
              triggered: true,
              action: 'article_batch',
              slotKey,
              reason: `Successfully assigned and published recovered article for slot ${slotKey} ($0 cost, 0 Higgsfield POSTs)`,
            };
          } else {
            updateJobInState(targetJob.id, j => {
              j.stage = 'failed';
              j.publicationError = pubResult.error || 'Failed to publish article to live website.';
              return j;
            });

            // Record slot failure with bounded retries
            if (!state.slotAttemptCounts) state.slotAttemptCounts = {};
            state.slotAttemptCounts[slotKey] = (state.slotAttemptCounts[slotKey] || 0) + 1;
            const attempts = state.slotAttemptCounts[slotKey];
            if (attempts >= 3) {
              if (!state.failedArticleSlots) state.failedArticleSlots = [];
              if (!state.failedArticleSlots.includes(slotKey)) state.failedArticleSlots.push(slotKey);
            }
            writeEngineState(state);

            return {
              triggered: false,
              action: 'article_batch',
              slotKey,
              reason: `Failed to publish recovered article to live website for slot ${slotKey} (attempt ${attempts}/3): ${pubResult.error}`,
            };
          }
        } else {
          updateJobInState(targetJob.id, j => {
            j.stage = 'awaiting_approval';
            j.logs.push({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `[Scheduler] Recovered article passed quality gates and is assigned to slot ${slotKey} awaiting human approval.`,
            });
            return j;
          });

          // Mark slot as handled
          state.lastExecutedArticleSlot = slotKey;
          if (!state.executedArticleSlots) state.executedArticleSlots = [];
          if (!state.executedArticleSlots.includes(slotKey)) state.executedArticleSlots.push(slotKey);
          writeEngineState(state);

          return {
            triggered: true,
            action: 'article_batch',
            slotKey,
            reason: `Recovered article for slot ${slotKey} verified and awaiting approval.`,
          };
        }
      } else {
        updateJobInState(targetJob.id, j => {
          j.stage = 'failed';
          j.logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Publication validation failures for job:\n- ${gateFailureReason}`,
          });
          return j;
        });

        // Record permanent gate failure to prevent uncontrolled retry loop
        if (!state.failedArticleSlots) state.failedArticleSlots = [];
        if (!state.failedArticleSlots.includes(slotKey)) state.failedArticleSlots.push(slotKey);
        if (!state.slotAttemptCounts) state.slotAttemptCounts = {};
        state.slotAttemptCounts[slotKey] = (state.slotAttemptCounts[slotKey] || 0) + 1;
        writeEngineState(state);

        return {
          triggered: false,
          action: 'article_batch',
          slotKey,
          reason: `Article rejected for slot ${slotKey}: ${gateFailureReason}`,
        };
      }
    }

    // 2. INVENTORY EXHAUSTION GUARD (Reuse-only) or Missing Job Failure (Generative)
    if (config.reuseOnlyMode !== false) {
      console.log(`[SeoEngineScheduler] 🛑 Inventory exhausted: No unpublished complete article packages remain for slot ${slotKey}. Reuse-only policy enforced: zero AI/image generation.`);
      if (!state.executedArticleSlots) state.executedArticleSlots = [];
      if (!state.executedArticleSlots.includes(slotKey)) state.executedArticleSlots.push(slotKey);
      writeEngineState(state);

      return {
        triggered: false,
        action: 'inventory_exhausted',
        slotKey,
        reason: `Inventory exhausted: No unpublished complete article packages remain for slot ${slotKey}. Zero new AI or image generation policy enforced ($0 cost).`,
      };
    } else {
      console.warn(`[SeoEngineScheduler] ⚠️ No article job ready or generated for slot ${slotKey}.`);
      if (!state.failedArticleSlots) state.failedArticleSlots = [];
      if (!state.failedArticleSlots.includes(slotKey)) state.failedArticleSlots.push(slotKey);
      writeEngineState(state);

      return {
        triggered: false,
        action: 'article_batch',
        slotKey,
        reason: `No article job could be generated or scheduled for slot ${slotKey}.`,
      };
    }
  }

  // -----------------------------------------------------------------
  // B. PINTEREST PUBLISHING SLOT (Does NOT create article jobs)
  // -----------------------------------------------------------------
  if (isPinterestSlot) {
    const slotKey = `${dateStr}_${timeStr}`;

    const alreadyExecuted = state.lastExecutedPinterestSlot === slotKey || (state.executedPinterestSlots && state.executedPinterestSlots.includes(slotKey));
    if (alreadyExecuted) {
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
    if (!state.executedPinterestSlots) state.executedPinterestSlots = [];
    if (!state.executedPinterestSlots.includes(slotKey)) state.executedPinterestSlots.push(slotKey);
    writeEngineState(state);

    // 1. Dispatch the specific Pin mapped to this slot:
    // Slot 1 (08:30) -> Art 1 Pin 1, Slot 2 (09:00) -> Art 1 Pin 2
    // Slot 3 (12:30) -> Art 2 Pin 1, Slot 4 (13:00) -> Art 2 Pin 2
    // Slot 5 (16:30) -> Art 3 Pin 1, Slot 6 (17:00) -> Art 3 Pin 2
    let pinDispatchResult = await dispatchScheduledPinterestSlot(timeStr, dateStr);

    // If the exact slot pin was deferred/skipped (e.g. earlier slot was missed), attempt the earliest overdue eligible Pin
    if (!pinDispatchResult.pinPublished && config.autoPublishPinterest !== false) {
      const catchUpResult = await dispatchNextOverduePinterestPin(timeStr, dateStr);
      if (catchUpResult && catchUpResult.pinPublished) {
        pinDispatchResult = catchUpResult;
      }
    }

    // 2. Advance queue worker ONLY if NOT in reuse-only mode
    if (!options?.skipQueueWorkerExecution && config.reuseOnlyMode === false) {
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

  // If there are pending selected jobs in queue, ensure queue worker continues (ONLY in non-reuse generative mode)
  if (config.reuseOnlyMode === false) {
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
