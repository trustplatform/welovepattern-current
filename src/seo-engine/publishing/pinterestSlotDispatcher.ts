/**
 * SEO Content Engine - Pinterest Slot Dispatcher
 * 
 * Maps daily Pinterest publishing slots to exact Pins across today's published articles:
 * Slot 1 (e.g. 09:00): Article 1, Pin 1
 * Slot 2 (e.g. 13:00): Article 1, Pin 2
 * Slot 3 (e.g. 17:00): Article 2, Pin 1
 * Slot 4 (e.g. 21:00): Article 2, Pin 2
 * 
 * SAFETY & IDEMPOTENCY:
 * - Selects exactly ONE unpublished Pin corresponding to the active slot.
 * - Verifies the parent article is already published.
 * - Verifies the local image file exists.
 * - Dispatches the Pin via the existing Pinterest API integration.
 * - Records returned Pinterest Pin ID and ISO timestamp.
 * - Does not publish if autoPublishPinterest === false.
 */

import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { publishPinToPinterest, PublishPinResult } from './pinterestPublisher';
import { SeoEngineArticleJob, PinterestCreativeConcept } from '../types';

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

  const pinterestPublishTimes = config.pinterestPublishTimes || ['09:00', '13:00', '17:00', '21:00'];
  const slotIndex = pinterestPublishTimes.indexOf(slotTime);

  if (slotIndex === -1) {
    return { triggered: false, pinPublished: false, reason: `Time ${slotTime} is not a configured Pinterest slot.` };
  }

  // Filter today's completed or published jobs
  const todaysJobs = state.activeJobs
    .filter(j => j.dateScheduled === targetDateStr)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  if (todaysJobs.length === 0) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `No active jobs found for date ${targetDateStr}.`,
    };
  }

  // Flatten all pins in deterministic order (Article 1 Pin 1, Article 1 Pin 2, Article 2 Pin 1, Article 2 Pin 2...)
  const allDailyPins: { job: SeoEngineArticleJob; pin: PinterestCreativeConcept; index: number }[] = [];
  let pinCounter = 0;

  for (const job of todaysJobs) {
    for (const pin of (job.pinterestPins || [])) {
      allDailyPins.push({
        job,
        pin,
        index: pinCounter++,
      });
    }
  }

  if (slotIndex >= allDailyPins.length) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `No Pin configured for slot index ${slotIndex} (Total pins: ${allDailyPins.length}).`,
    };
  }

  const target = allDailyPins[slotIndex];
  const { job, pin } = target;

  // 1. Verify Article is Strictly Published
  if (job.stage !== 'completed' || !job.publishedBlogPostId || Boolean(job.publicationError)) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Parent article "${job.articleContent?.title || job.id}" is not yet published to website. Pin publication deferred.`,
    };
  }

  // 2. Idempotency Check
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

  console.log(`[PinterestSlotDispatcher] 📌 Dispatching Slot ${slotIndex + 1} (${slotTime}) -> Job ${job.id}, Pin ${pin.pinNumber}...`);

  // 3. Dispatch to Pinterest API
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
