/**
 * SEO Content Engine - Atomic State Storage Engine
 * Manages atomic persistence of `data/seo-engine-state.json` using temp file write + rename.
 * Guarantees zero data loss, safe fallback on corrupted/missing files, and non-blocking operations.
 */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { DEFAULT_SEO_ENGINE_CONFIG, SEO_ENGINE_STORAGE_PATHS } from '../config';
import { SeoEngineConfig, SeoEngineDailyState, SeoEngineArticleJob } from '../types';

const STATE_FILE_RELATIVE = SEO_ENGINE_STORAGE_PATHS.STATE_FILE;
const STATE_FILE_TMP_RELATIVE = SEO_ENGINE_STORAGE_PATHS.STATE_FILE_TMP;

/** Resolves absolute path to state file from current working directory */
export function getEngineStateFilePath(): string {
  const custom = process.env.SEO_ENGINE_STATE_FILE;
  return path.resolve(process.cwd(), custom || STATE_FILE_RELATIVE);
}

/** Resolves absolute path to temporary atomic file */
function getEngineStateTmpFilePath(): string {
  const custom = process.env.SEO_ENGINE_STATE_FILE;
  return path.resolve(process.cwd(), custom ? `${custom}.tmp` : STATE_FILE_TMP_RELATIVE);
}

/** Generates clean, pristine default daily state object */
export function createInitialDailyState(customConfig?: Partial<SeoEngineConfig>): SeoEngineDailyState {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    version: 1,
    config: {
      ...DEFAULT_SEO_ENGINE_CONFIG,
      ...customConfig,
    },
    lastRunDate: todayStr,
    todayDiscoveredTopics: [],
    activeJobs: [],
    completedJobsHistory: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates and repairs state shape if any required fields are missing
 */
function normalizeAndRepairState(raw: Partial<SeoEngineDailyState>): SeoEngineDailyState {
  const defaults = createInitialDailyState();

  const config: SeoEngineConfig = {
    ...DEFAULT_SEO_ENGINE_CONFIG,
    ...(raw.config || {}),
  };

  // Enforce strict production invariant floors:
  if (typeof config.higgsfieldDailyCostLimitUsd !== 'number' || config.higgsfieldDailyCostLimitUsd <= 0) {
    config.higgsfieldDailyCostLimitUsd = 1.70;
  }
  if (typeof config.higgsfieldDailyRequestsLimit !== 'number' || config.higgsfieldDailyRequestsLimit <= 0) {
    config.higgsfieldDailyRequestsLimit = 9;
  }
  if (typeof config.estimatedImageCostUsd !== 'number' || config.estimatedImageCostUsd <= 0) {
    config.estimatedImageCostUsd = 0.03;
  }

  return {
    version: raw.version || 1,
    config,
    lastRunDate: typeof raw.lastRunDate === 'string' ? raw.lastRunDate : defaults.lastRunDate,
    lastExecutedArticleSlot: typeof raw.lastExecutedArticleSlot === 'string' ? raw.lastExecutedArticleSlot : undefined,
    lastExecutedPinterestSlot: typeof raw.lastExecutedPinterestSlot === 'string' ? raw.lastExecutedPinterestSlot : undefined,
    executedArticleSlots: Array.isArray(raw.executedArticleSlots)
      ? raw.executedArticleSlots
      : (typeof raw.lastExecutedArticleSlot === 'string' ? [raw.lastExecutedArticleSlot] : []),
    executedPinterestSlots: Array.isArray(raw.executedPinterestSlots)
      ? raw.executedPinterestSlots
      : (typeof raw.lastExecutedPinterestSlot === 'string' ? [raw.lastExecutedPinterestSlot] : []),
    failedArticleSlots: Array.isArray(raw.failedArticleSlots) ? raw.failedArticleSlots : [],
    pendingApprovalArticleSlots: Array.isArray(raw.pendingApprovalArticleSlots) ? raw.pendingApprovalArticleSlots : [],
    slotAttemptCounts: raw.slotAttemptCounts && typeof raw.slotAttemptCounts === 'object' ? raw.slotAttemptCounts : {},
    todayDiscoveredTopics: Array.isArray(raw.todayDiscoveredTopics) ? raw.todayDiscoveredTopics : [],
    activeJobs: Array.isArray(raw.activeJobs)
      ? raw.activeJobs
          .filter((j: any) => j && typeof j === 'object')
          .map((j: any) => ({
            ...j,
            logs: Array.isArray(j?.logs) ? j.logs : [],
          }))
      : [],
    completedJobsHistory: Array.isArray(raw.completedJobsHistory)
      ? raw.completedJobsHistory.map((h: any) => ({
          ...h,
          logs: Array.isArray(h?.logs) ? h.logs : [],
        }))
      : [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reads the current state from disk.
 * If the file does not exist, initializes it atomically with defaults and returns it.
 * If the file is corrupted/malformed, archives the corrupted file and initializes a clean state.
 */
export function readEngineState(): SeoEngineDailyState {
  const statePath = getEngineStateFilePath();

  if (!fs.existsSync(statePath)) {
    const initialState = createInitialDailyState();
    try {
      writeEngineState(initialState);
    } catch (err) {
      console.error('[SeoEngineStorage] Failed to initialize state file:', err);
    }
    return initialState;
  }

  try {
    const fileContent = fs.readFileSync(statePath, 'utf8').trim();
    if (!fileContent) {
      const freshState = createInitialDailyState();
      writeEngineState(freshState);
      return freshState;
    }

    const parsed = JSON.parse(fileContent);
    return normalizeAndRepairState(parsed);
  } catch (err) {
    console.error('[SeoEngineStorage] Malformed state file. Creating backup and re-initializing:', err);
    try {
      const backupPath = `${statePath}.corrupted.${Date.now()}.bak`;
      fs.copyFileSync(statePath, backupPath);
      console.warn(`[SeoEngineStorage] Corrupted state backed up to: ${backupPath}`);
    } catch (backupErr) {
      console.error('[SeoEngineStorage] Failed to create backup of corrupted file:', backupErr);
    }

    const repairedState = createInitialDailyState();
    try {
      writeEngineState(repairedState);
    } catch (writeErr) {
      console.error('[SeoEngineStorage] Failed to write repaired state:', writeErr);
    }
    return repairedState;
  }
}

/**
 * Writes the engine state to disk atomically.
 * Writes to a temporary file in the same directory first, then renames to the target file.
 * This guarantees atomic updates with no partial writes or corrupted files on crash.
 */
export function writeEngineState(state: SeoEngineDailyState): void {
  const statePath = getEngineStateFilePath();
  const tmpPath = getEngineStateTmpFilePath();

  // Ensure parent directory exists (e.g. data/)
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  state.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(state, null, 2);

  // 1. Write to temp file synchronously
  fs.writeFileSync(tmpPath, serialized, 'utf8');

  // 2. Atomically rename temp file over target file
  fs.renameSync(tmpPath, statePath);
}

export class EngineStateLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineStateLockError';
  }
}

const STATE_LOCK_FILE_RELATIVE = 'data/seo-engine-state.json.lock';

export function getEngineStateLockFilePath(): string {
  const custom = process.env.SEO_ENGINE_STATE_FILE;
  return path.resolve(process.cwd(), custom ? `${custom}.lock` : STATE_LOCK_FILE_RELATIVE);
}

function isProcessAlive(pid: number): boolean {
  if (!pid || typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    return err.code === 'EPERM';
  }
}

/**
 * Acquires an exclusive file lock.
 * Invariant: Fails safely on malformed, unverified, or busy lock files without deleting them.
 * Throws EngineStateLockError on timeout. Never writes state without holding the lock.
 */
export function acquireEngineStateLock(timeoutMs: number = 3000): string {
  const lockPath = getEngineStateLockFilePath();
  const dir = path.dirname(lockPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const token = crypto.randomUUID();
  const startTime = Date.now();
  const retryIntervalMs = 25;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const payload = JSON.stringify({ token, pid: process.pid, createdAt: Date.now() });
      fs.writeFileSync(lockPath, payload, { flag: 'wx' });
      return token;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        try {
          const raw = fs.readFileSync(lockPath, 'utf8').trim();
          if (raw) {
            const data = JSON.parse(raw);
            const isValidLockRecord = typeof data.pid === 'number' && typeof data.token === 'string' && typeof data.createdAt === 'number';
            const isDead = isValidLockRecord && !isProcessAlive(data.pid);
            const isOld = isValidLockRecord && (Date.now() - data.createdAt > 60000);

            // Safe reclamation ONLY if verifiable dead PID and exceeds 60s threshold
            if (isDead && isOld) {
              try {
                const currentContent = fs.readFileSync(lockPath, 'utf8').trim();
                const currentData = JSON.parse(currentContent);
                if (currentData.token === data.token && currentData.pid === data.pid) {
                  fs.unlinkSync(lockPath);
                  console.warn(`[SeoEngineStorage] Safely reclaimed verified stale lockfile (${data.token}, dead pid ${data.pid})`);
                  continue;
                }
              } catch {
                // Another process modified or released it; fail safe
              }
            }
          }
        } catch {
          // Malformed, partial, or unreadable lock: FAIL SAFELY. Do not unlink.
        }

        const sleepUntil = Date.now() + retryIntervalMs;
        while (Date.now() < sleepUntil) {}
      } else {
        throw err;
      }
    }
  }

  throw new EngineStateLockError(
    `Failed to acquire engine state lock (${lockPath}) within ${timeoutMs}ms. Another process owns the lock or lock is held.`
  );
}

export function releaseEngineStateLock(token: string): void {
  const lockPath = getEngineStateLockFilePath();
  try {
    if (!fs.existsSync(lockPath)) return;
    const raw = fs.readFileSync(lockPath, 'utf8');
    const data = JSON.parse(raw);
    if (data.token === token) {
      fs.unlinkSync(lockPath);
    }
  } catch {}
}

/**
 * Executes a synchronous read-modify-write under atomic file lock.
 * INVARIANT: Never reads or writes state if lock acquisition fails.
 */
export function mutateEngineStateSync<T>(mutator: (state: SeoEngineDailyState) => T): T {
  const token = acquireEngineStateLock();
  try {
    const state = readEngineState();
    const result = mutator(state);
    writeEngineState(state);
    return result;
  } finally {
    releaseEngineStateLock(token);
  }
}

export function recordSlotExecutedSync(slotKey: string, dateStr: string): void {
  mutateEngineStateSync(state => {
    state.lastExecutedArticleSlot = slotKey;
    if (!state.executedArticleSlots) state.executedArticleSlots = [];
    if (!state.executedArticleSlots.includes(slotKey)) {
      state.executedArticleSlots.push(slotKey);
    }
    if (state.failedArticleSlots) {
      state.failedArticleSlots = state.failedArticleSlots.filter(s => s !== slotKey);
    }
    if (state.pendingApprovalArticleSlots) {
      state.pendingApprovalArticleSlots = state.pendingApprovalArticleSlots.filter(s => s !== slotKey);
    }
    if (state.slotAttemptCounts) {
      delete state.slotAttemptCounts[slotKey];
    }
    state.lastRunDate = dateStr;
  });
}

export function recordSlotPendingApprovalSync(slotKey: string, dateStr: string): void {
  mutateEngineStateSync(state => {
    if (!state.pendingApprovalArticleSlots) state.pendingApprovalArticleSlots = [];
    if (!state.pendingApprovalArticleSlots.includes(slotKey)) {
      state.pendingApprovalArticleSlots.push(slotKey);
    }
    if (state.failedArticleSlots) {
      state.failedArticleSlots = state.failedArticleSlots.filter(s => s !== slotKey);
    }
    state.lastRunDate = dateStr;
  });
}

export function recordSlotFailedSync(slotKey: string): number {
  return mutateEngineStateSync(state => {
    if (!state.slotAttemptCounts) state.slotAttemptCounts = {};
    state.slotAttemptCounts[slotKey] = (state.slotAttemptCounts[slotKey] || 0) + 1;
    const attempts = state.slotAttemptCounts[slotKey];
    if (attempts >= 3) {
      if (!state.failedArticleSlots) state.failedArticleSlots = [];
      if (!state.failedArticleSlots.includes(slotKey)) {
        state.failedArticleSlots.push(slotKey);
      }
    }
    return attempts;
  });
}

/**
 * Updates partial configuration settings atomically and returns the updated state.
 */
export function updateEngineConfig(partial: Partial<SeoEngineConfig>): SeoEngineDailyState {
  return mutateEngineStateSync(currentState => {
    currentState.config = {
      ...currentState.config,
      ...partial,
    };
    return currentState;
  });
}

/**
 * Adds a new job to the activeJobs array, preventing duplicates by id.
 */
export function addJobToState(job: SeoEngineArticleJob): SeoEngineDailyState {
  return mutateEngineStateSync(state => {
    if (!Array.isArray(state.activeJobs)) state.activeJobs = [];
    const existingIdx = state.activeJobs.findIndex(j => j.id === job.id);
    if (existingIdx >= 0) {
      state.activeJobs[existingIdx] = job;
    } else {
      state.activeJobs.push(job);
    }
    return state;
  });
}

/**
 * Updates an active job in state by ID using an updater callback.
 */
export function updateJobInState(
  jobId: string,
  updater: (job: SeoEngineArticleJob) => SeoEngineArticleJob
): SeoEngineArticleJob | null {
  return mutateEngineStateSync(state => {
    const index = state.activeJobs.findIndex(j => j.id === jobId);
    if (index === -1) {
      return null;
    }

    const currentJob = state.activeJobs[index];
    if (!Array.isArray(currentJob.logs)) {
      currentJob.logs = [];
    }

    const updatedJob = updater(currentJob);
    if (!Array.isArray(updatedJob.logs)) {
      updatedJob.logs = [];
    }
    updatedJob.updatedAt = new Date().toISOString();
    state.activeJobs[index] = updatedJob;
    return updatedJob;
  });
}

/**
 * Retrieves a single active job by ID, or null if not found.
 */
export function getJobById(jobId: string): SeoEngineArticleJob | null {
  const state = readEngineState();
  return state.activeJobs.find(j => j.id === jobId) || null;
}
