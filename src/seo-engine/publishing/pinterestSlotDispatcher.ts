/**
 * SEO Content Engine - Pinterest Slot Dispatcher
 * 
 * Maps 6 daily Pinterest publishing slots to exact Pins across today's 3 published articles:
 * Slot 1 (08:30): Article 1, Pin 1
 * Slot 2 (09:00): Article 1, Pin 2
 * Slot 3 (12:30): Article 2, Pin 1
 * Slot 4 (13:00): Article 2, Pin 2
 * Slot 5 (16:30): Article 3, Pin 1
 * Slot 6 (17:00): Article 3, Pin 2
 * 
 * SAFETY & IDEMPOTENCY:
 * - Selects exactly ONE unpublished Pin corresponding to the active slot.
 * - Verifies the parent article is already published.
 * - Verifies the local image file exists.
 * - Dispatches the Pin via the existing Pinterest API integration.
 * - Records returned Pinterest Pin ID and ISO timestamp.
 * - Does not publish if autoPublishPinterest === false.
 */

import fs from 'fs';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { publishPinToPinterest, PublishPinResult } from './pinterestPublisher';
import { getPinterestAuthRecord } from '../../pinterest/pinterestOAuth';
import { getLiveBlogPosts } from './articlePublisher';
import { isValidLocalAsset } from '../queue/assetRecovery';

export function isPinterestConnected(): boolean {
  const useSandbox = process.env.PINTEREST_USE_SANDBOX === 'true';
  if (useSandbox) {
    return Boolean(process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim());
  }
  const authRecord = getPinterestAuthRecord();
  return Boolean(authRecord && authRecord.accessToken);
}

export interface DispatchPinterestSlotResult {
  triggered: boolean;
  pinPublished: boolean;
  slotIndex?: number;
  jobId?: string;
  pinNumber?: number;
  pinterestPinId?: string;
  reason?: string;
  error?: string;
}

/**
 * Dispatches the specific Pin scheduled for the current Pinterest slot.
 */
export async function dispatchScheduledPinterestSlot(
  slotTime: string,
  targetDateStr: string
): Promise<DispatchPinterestSlotResult> {
  const state = readEngineState();
  const config = state.config;

  if (!config.engineActive) {
    return { triggered: false, pinPublished: false, reason: 'Engine is inactive.' };
  }

  if (config.autoPublishPinterest === false) {
    return { triggered: false, pinPublished: false, reason: 'autoPublishPinterest is disabled.' };
  }

  const pinterestPublishTimes = config.pinterestPublishTimes || ['08:30', '09:00', '12:30', '13:00', '16:30', '17:00'];
  const slotIndex = pinterestPublishTimes.indexOf(slotTime);

  if (slotIndex === -1) {
    return { triggered: false, pinPublished: false, reason: `Time ${slotTime} is not a configured Pinterest slot.` };
  }

  // Filter today's jobs (matching assignedPublishDate or fallback dateScheduled)
  const todaysJobs = state.activeJobs
    .filter(j => (j.assignedPublishDate === targetDateStr) || (!j.assignedPublishDate && j.dateScheduled === targetDateStr))
    .sort((a, b) => {
      const timeA = a.assignedSlotTime || a.publicationScheduledAt || '';
      const timeB = b.assignedSlotTime || b.publicationScheduledAt || '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

  if (todaysJobs.length === 0) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `No active jobs found for date ${targetDateStr}.`,
    };
  }

  // Enforce HARD daily Pinterest cap: max configured published pins per calendar day
  let publishedPinsToday = 0;
  for (const j of todaysJobs) {
    for (const p of (j.pinterestPins || [])) {
      if (p.publishStatus === 'published' && p.pinterestPinId) {
        publishedPinsToday++;
      }
    }
  }

  if (publishedPinsToday >= pinterestPublishTimes.length) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Daily Pinterest publishing limit reached (${publishedPinsToday}/${pinterestPublishTimes.length} pins published) for date ${targetDateStr}.`,
    };
  }

  // Exact 1-to-1 slot mapping across 6 daily Pinterest slots:
  // Slot 0 (08:30) -> Article 1 (08:00 slot), Pin 1
  // Slot 1 (09:00) -> Article 1 (08:00 slot), Pin 2
  // Slot 2 (12:30) -> Article 2 (12:00 slot), Pin 1
  // Slot 3 (13:00) -> Article 2 (12:00 slot), Pin 2
  // Slot 4 (16:30) -> Article 3 (16:00 slot), Pin 1
  // Slot 5 (17:00) -> Article 3 (16:00 slot), Pin 2
  const targetArticleIndex = Math.floor(slotIndex / 2);
  const targetPinIndex = slotIndex % 2;
  const articlePublishTimes = config.articlePublishTimes || ['08:00', '12:00', '16:00'];
  const targetArticleSlotTime = articlePublishTimes[targetArticleIndex] || (targetArticleIndex === 0 ? '08:00' : targetArticleIndex === 1 ? '12:00' : '16:00');

  // Deterministically match article job for this Pinterest slot:
  // 1. By pin assignedSlotTime or scheduledTime (e.g. 08:30)
  // 2. By parent article assignedSlotTime (e.g. 08:00)
  // 3. By positional index in today's sorted jobs
  let job = todaysJobs.find(j =>
    j.pinterestPins?.some(p => p.assignedSlotTime === slotTime || p.scheduledTime === slotTime)
  );

  if (!job) {
    job = todaysJobs.find(j =>
      j.assignedSlotTime === targetArticleSlotTime || j.publicationScheduledAt === targetArticleSlotTime
    );
  }

  if (!job) {
    job = todaysJobs[targetArticleIndex];
  }

  if (!job) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Article ${targetArticleIndex + 1} does not exist for Pinterest Slot ${slotIndex + 1} (${slotTime}).`,
    };
  }

  // Resolve target pin on the job (matching this slot time or targetPinIndex)
  let pin = job.pinterestPins?.find(p => p.assignedSlotTime === slotTime || p.scheduledTime === slotTime);
  if (!pin) {
    pin = job.pinterestPins?.[targetPinIndex];
  }

  if (!pin) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      reason: `Pin ${targetPinIndex + 1} not configured on article "${job.articleContent?.title || job.id}".`,
    };
  }

  // 1. Verify Article is Strictly Published and Live on the Website
  const livePosts = getLiveBlogPosts();
  const isParentLive = livePosts.some(p =>
    (job.publishedBlogPostId && p.id === job.publishedBlogPostId) ||
    (p.seoEngineJobId && p.seoEngineJobId === job.id) ||
    (job.articleContent?.slug && p.slug === job.articleContent.slug) ||
    (job.publishedSlug && p.slug === job.publishedSlug)
  );

  if (job.stage !== 'completed' || !job.publishedBlogPostId || Boolean(job.publicationError) || !isParentLive) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Parent article "${job.articleContent?.title || job.id}" is not yet confirmed live on website. Pin publication deferred.`,
    };
  }

  // 2. Local asset check
  if (!isValidLocalAsset(pin.stableAssetPath)) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Pin ${pin.pinNumber} local image asset is missing or invalid on disk.`,
    };
  }

  // 3. Idempotency Check
  if (pin.publishStatus === 'published' && pin.pinterestPinId) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      pinterestPinId: pin.pinterestPinId,
      reason: `Pin ${pin.pinNumber} for job ${job.id} is already published (Pin ID: ${pin.pinterestPinId}).`,
    };
  }

  // 3. Pre-flight Check: Pinterest connection
  if (!isPinterestConnected()) {
    console.log(`[PinterestSlotDispatcher] ℹ️ Pinterest account is not connected. Deferring live Pin dispatch for Slot ${slotIndex + 1} (${slotTime}) until connected in Admin Settings.`);
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: 'Pinterest account is not connected. Please connect Pinterest in Admin Settings.',
    };
  }

  // 4. Pre-flight Check: Target Board ID assigned
  if (!pin.targetBoardId) {
    console.log(`[PinterestSlotDispatcher] ℹ️ Pin ${pin.pinNumber} for job ${job.id} has no target Pinterest board assigned. Deferring live Pin dispatch for Slot ${slotIndex + 1} (${slotTime}) until a board is assigned.`);
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: 'No suitable Pinterest board assigned. Pin publication safely deferred until board assignment.',
    };
  }

  console.log(`[PinterestSlotDispatcher] 📌 Dispatching Slot ${slotIndex + 1} (${slotTime}) -> Job ${job.id}, Pin ${pin.pinNumber}...`);

  // 5. Dispatch to Pinterest API
  const pubResult: PublishPinResult = await publishPinToPinterest(job, pin);

  if (pubResult.success && pubResult.pinId) {
    updateJobInState(job.id, j => {
      const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
      if (p) {
        p.publishStatus = 'published';
        p.pinterestPinId = pubResult.pinId;
        p.scheduledTime = slotTime;
        p.publishedAt = new Date().toISOString();
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Pinterest Slot ${slotTime} published Pin ${pin.pinNumber} (Pinterest Pin ID: ${pubResult.pinId}).`,
      });
      return j;
    });

    return {
      triggered: true,
      pinPublished: true,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      pinterestPinId: pubResult.pinId,
      reason: `Successfully published Pin ${pin.pinNumber} for job ${job.id}`,
    };
  } else {
    updateJobInState(job.id, j => {
      const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
      if (p) {
        p.publishStatus = 'failed';
        p.errorMessage = pubResult.error || 'Pinterest API dispatch failed';
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Pinterest Slot ${slotTime} failed for Pin ${pin.pinNumber}: ${pubResult.error}`,
      });
      return j;
    });

    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      error: pubResult.error,
      reason: `Failed to publish Pin ${pin.pinNumber}: ${pubResult.error}`,
    };
  }
}

/**
 * In strict 1-to-1 slot architecture, catch-up bundling is disabled to prevent
 * multi-pin bursts and ensure exactly 1 pin is dispatched per slot.
 */
export async function dispatchNextOverduePinterestPin(
  currentTimeStr: string,
  targetDateStr: string
): Promise<DispatchPinterestSlotResult | null> {
  const state = readEngineState();
  const config = state.config;
  if (!config.engineActive || config.autoPublishPinterest === false) return null;

  const slots = config.pinterestPublishTimes || ['08:30', '09:00', '12:30', '13:00', '16:30', '17:00'];
  const eligibleSlots = slots.filter(s => s <= currentTimeStr);
  if (eligibleSlots.length === 0) return null;

  const jobs = state.activeJobs
    .filter(j => j.assignedPublishDate === targetDateStr || (!j.assignedPublishDate && j.dateScheduled === targetDateStr))
    .sort((a, b) => ((a.assignedSlotTime || a.publicationScheduledAt || '')).localeCompare(b.assignedSlotTime || b.publicationScheduledAt || ''));

  const articlePublishTimes = config.articlePublishTimes || ['08:00', '12:00', '16:00'];

  for (const slot of eligibleSlots) {
    const idx = slots.indexOf(slot);
    const articleIndex = Math.floor(idx / 2);
    const pinIndex = idx % 2;
    const targetArticleSlotTime = articlePublishTimes[articleIndex] || (articleIndex === 0 ? '08:00' : articleIndex === 1 ? '12:00' : '16:00');

    let job = jobs.find(j => j.pinterestPins?.some(p => p.assignedSlotTime === slot || p.scheduledTime === slot));
    if (!job) {
      job = jobs.find(j => j.assignedSlotTime === targetArticleSlotTime || j.publicationScheduledAt === targetArticleSlotTime);
    }
    if (!job) {
      job = jobs[articleIndex];
    }

    let pin = job?.pinterestPins?.find(p => p.assignedSlotTime === slot || p.scheduledTime === slot);
    if (!pin) {
      pin = job?.pinterestPins?.[pinIndex];
    }

    if (!job || !pin || pin.publishStatus === 'published' || pin.pinterestPinId) continue;
    if (job.stage !== 'completed' || !job.publishedBlogPostId || job.publicationError) continue;
    const result = await dispatchScheduledPinterestSlot(slot, targetDateStr);
    if (result.pinPublished) return result;
  }
  return null;
}
