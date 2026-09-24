/**
 * SEO Content Engine - Atomic State Storage Engine
 * Manages atomic persistence of `data/seo-engine-state.json` using temp file write + rename.
 * Guarantees zero data loss, safe fallback on corrupted/missing files, and non-blocking operations.
 */

import fs from 'fs';
import path from 'path';
import { DEFAULT_SEO_ENGINE_CONFIG, SEO_ENGINE_STORAGE_PATHS } from '../config';
import { SeoEngineConfig, SeoEngineDailyState, SeoEngineArticleJob } from '../types';

const STATE_FILE_RELATIVE = SEO_ENGINE_STORAGE_PATHS.STATE_FILE;
const STATE_FILE_TMP_RELATIVE = SEO_ENGINE_STORAGE_PATHS.STATE_FILE_TMP;

/** Resolves absolute path to state file from current working directory */
export function getEngineStateFilePath(): string {
  return path.resolve(process.cwd(), STATE_FILE_RELATIVE);
}

/** Resolves absolute path to temporary atomic file */
function getEngineStateTmpFilePath(): string {
  return path.resolve(process.cwd(), STATE_FILE_TMP_RELATIVE);
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

  return {
    version: raw.version || 1,
    config,
    lastRunDate: typeof raw.lastRunDate === 'string' ? raw.lastRunDate : defaults.lastRunDate,
    todayDiscoveredTopics: Array.isArray(raw.todayDiscoveredTopics) ? raw.todayDiscoveredTopics : [],
    activeJobs: Array.isArray(raw.activeJobs) ? raw.activeJobs : [],
    completedJobsHistory: Array.isArray(raw.completedJobsHistory) ? raw.completedJobsHistory : [],
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

/**
 * Updates partial configuration settings atomically and returns the updated state.
 */
export function updateEngineConfig(partial: Partial<SeoEngineConfig>): SeoEngineDailyState {
  const currentState = readEngineState();
  currentState.config = {
    ...currentState.config,
    ...partial,
  };
  writeEngineState(currentState);
  return currentState;
}

/**
 * Adds a new job to the activeJobs array, preventing duplicates by id.
 */
export function addJobToState(job: SeoEngineArticleJob): SeoEngineDailyState {
  const state = readEngineState();
  const existingIdx = state.activeJobs.findIndex(j => j.id === job.id);
  if (existingIdx >= 0) {
    state.activeJobs[existingIdx] = job;
  } else {
    state.activeJobs.push(job);
  }
  writeEngineState(state);
  return state;
}

/**
 * Updates an active job in state by ID using an updater callback.
 */
export function updateJobInState(
  jobId: string,
  updater: (job: SeoEngineArticleJob) => SeoEngineArticleJob
): SeoEngineArticleJob | null {
  const state = readEngineState();
  const index = state.activeJobs.findIndex(j => j.id === jobId);
  if (index === -1) {
    return null;
  }

  const updatedJob = updater(state.activeJobs[index]);
  updatedJob.updatedAt = new Date().toISOString();
  state.activeJobs[index] = updatedJob;

  writeEngineState(state);
  return updatedJob;
}

/**
 * Retrieves a single active job by ID, or null if not found.
 */
export function getJobById(jobId: string): SeoEngineArticleJob | null {
  const state = readEngineState();
  return state.activeJobs.find(j => j.id === jobId) || null;
}
