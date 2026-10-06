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

import fs from 'fs';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { publishPinToPinterest, PublishPinResult } from './pinterestPublisher';
import { SeoEngineArticleJob, PinterestCreativeConcept } from '../types';
import { getPinterestAuthRecord } from '../../pinterest/pinterestOAuth';

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

  const pinterestPublishTimes = config.pinterestPublishTimes || ['09:00', '13:00', '17:00', '21:00'];
  const slotIndex = pinterestPublishTimes.indexOf(slotTime);

  if (slotIndex === -1) {
    return { triggered: false, pinPublished: false, reason: `Time ${slotTime} is not a configured Pinterest slot.` };
  }

  // Filter today's jobs (matching assignedPublishDate or fallback dateScheduled)
  const todaysJobs = state.activeJobs
    .filter(j => (j.assignedPublishDate === targetDateStr) || (!j.assignedPublishDate && j.dateScheduled === targetDateStr))
    .sort((a, b) => {
      const timeA = a.assignedSlotTime || (a.publicationScheduledAt === '16:00' ? '16:00' : '08:00');
      const timeB = b.assignedSlotTime || (b.publicationScheduledAt === '16:00' ? '16:00' : '08:00');
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

  // Enforce HARD daily Pinterest cap: max 4 published pins per calendar day
  let publishedPinsToday = 0;
  for (const j of todaysJobs) {
    for (const p of (j.pinterestPins || [])) {
      if (p.publishStatus === 'published' && p.pinterestPinId) {
        publishedPinsToday++;
      }
    }
  }

  if (publishedPinsToday >= 4) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Daily Pinterest publishing limit reached (${publishedPinsToday}/4 pins published) for date ${targetDateStr}.`,
    };
  }

  // Exact 1-to-1 slot mapping:
  // Slot 0 (09:00) -> Article 1 (08:00 slot), Pin 1
  // Slot 1 (13:00) -> Article 1 (08:00 slot), Pin 2
  // Slot 2 (17:00) -> Article 2 (16:00 slot), Pin 1
  // Slot 3 (21:00) -> Article 2 (16:00 slot), Pin 2
  const targetArticleIndex = slotIndex < 2 ? 0 : 1;
  const targetPinIndex = slotIndex % 2;

  const job = todaysJobs[targetArticleIndex];
  if (!job) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Article ${targetArticleIndex + 1} does not exist for Pinterest Slot ${slotIndex + 1} (${slotTime}).`,
    };
  }

  const pin = job.pinterestPins?.[targetPinIndex];
  if (!pin) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      reason: `Pin ${targetPinIndex + 1} not configured on article "${job.articleContent?.title || job.id}".`,
    };
  }

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

  // 2. Local asset check
  if (!pin.stableAssetPath || !fs.existsSync(pin.stableAssetPath) || fs.statSync(pin.stableAssetPath).size < 100) {
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
  _currentTimeStr: string,
  _targetDateStr: string
): Promise<DispatchPinterestSlotResult | null> {
  // Strict invariant: Never use catch-up to create a second publication or bundle multiple pins.
  return null;
}

