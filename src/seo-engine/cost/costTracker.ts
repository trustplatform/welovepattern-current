/**
 * SEO Content Engine - Dedicated Cost Control & Accounting Tracker
 * 
 * Prevents runaway API costs across DataForSEO, OpenAI, and Higgsfield.
 * Records usage per operation, computes daily totals, and enforces hard budget stops.
 * 
 * ATOMIC STORAGE & CORRUPTION RESILIENCY:
 * Persists to `data/seo-engine-costs.json` using synchronous atomic rename.
 * Never wipes corrupted files to zero without preserving and recovering previous data.
 * 
 * CONCURRENCY PROTECTION:
 * Implements in-flight budget reservations to prevent concurrent operations
 * from exceeding daily or per-job budget limits.
 */

import fs from 'fs';
import path from 'path';
import { CostRecordItem, SeoEngineConfig } from '../types';
import { DEFAULT_SEO_ENGINE_CONFIG, SEO_ENGINE_STORAGE_PATHS } from '../config';

export interface CostStorageData {
  version: number;
  totalSpendAllTimeUsd: number;
  records: CostRecordItem[];
  updatedAt: string;
}

interface ActiveReservation {
  jobId: string;
  amountUsd: number;
  expiresAt: number;
}

const COST_FILE = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.COST_FILE);
const COST_FILE_TMP = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.COST_FILE_TMP);
const RESERVATION_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL for in-flight jobs

// In-memory state protections
let inMemoryLastKnownStorage: CostStorageData | null = null;
const activeReservations = new Map<string, ActiveReservation>();

/**
 * Validates that a cost amount is a valid, positive, finite number.
 * Explicitly rejects NaN, Infinity, -Infinity, null, undefined, 0, and negative numbers.
 */
export function isValidCostAmount(val: any): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !isNaN(val) && val > 0;
}

/**
 * Salvages corrupted cost storage without resetting spent amounts to zero.
 */
function salvageCorruptedFile(rawText: string, filePath: string): CostStorageData {
  // 1. Create immediate backup of corrupted file
  try {
    const backupPath = `${filePath}.corrupted.${Date.now()}.bak`;
    fs.copyFileSync(filePath, backupPath);
    console.error(`[CostTracker] Preserved corrupted cost file to: ${backupPath}`);
  } catch (backupErr) {
    console.error('[CostTracker] Failed to create backup of corrupted file:', backupErr);
  }

  // 2. Check in-memory last known good storage first
  if (inMemoryLastKnownStorage && isValidCostAmount(inMemoryLastKnownStorage.totalSpendAllTimeUsd)) {
    console.warn(`[CostTracker] Recovered cost state from memory ($${inMemoryLastKnownStorage.totalSpendAllTimeUsd.toFixed(3)} spend).`);
    return {
      version: inMemoryLastKnownStorage.version || 1,
      totalSpendAllTimeUsd: inMemoryLastKnownStorage.totalSpendAllTimeUsd,
      records: [...inMemoryLastKnownStorage.records],
      updatedAt: new Date().toISOString(),
    };
  }

  // 3. Attempt regex extraction of spend values from corrupted raw text
  let maxFoundSpend = 0;
  const totalMatch = rawText.match(/"totalSpendAllTimeUsd"\s*:\s*([0-9.]+)/);
  if (totalMatch && Number.isFinite(parseFloat(totalMatch[1]))) {
    maxFoundSpend = Math.max(maxFoundSpend, parseFloat(totalMatch[1]));
  }

  const recordCostsRegex = /"costUsd"\s*:\s*([0-9.]+)/g;
  let rm: RegExpExecArray | null;
  let sumCosts = 0;
  while ((rm = recordCostsRegex.exec(rawText)) !== null) {
    const val = parseFloat(rm[1]);
    if (isValidCostAmount(val)) {
      sumCosts += val;
    }
  }
  maxFoundSpend = Math.max(maxFoundSpend, sumCosts);

  // 4. Attempt recovery from any previous valid backup file in directory
  try {
    const dir = path.dirname(filePath);
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('seo-engine-costs') && f.endsWith('.bak'))
      .sort()
      .reverse();

    for (const bFile of files) {
      try {
        const bContent = fs.readFileSync(path.join(dir, bFile), 'utf8');
        const bParsed = JSON.parse(bContent);
        if (typeof bParsed.totalSpendAllTimeUsd === 'number' && Number.isFinite(bParsed.totalSpendAllTimeUsd)) {
          if (bParsed.totalSpendAllTimeUsd > maxFoundSpend) {
            maxFoundSpend = bParsed.totalSpendAllTimeUsd;
          }
          if (Array.isArray(bParsed.records) && bParsed.records.length > 0) {
            return {
              version: bParsed.version || 1,
              totalSpendAllTimeUsd: maxFoundSpend,
              records: bParsed.records,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      } catch {
        // try next backup
      }
    }
  } catch {
    // continue
  }

  console.warn(`[CostTracker] Corrupted file salvaged with spend floor: $${maxFoundSpend.toFixed(3)}.`);
  return {
    version: 1,
    totalSpendAllTimeUsd: maxFoundSpend,
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

function ensureCostFileExists(): CostStorageData {
  const dir = path.dirname(COST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(COST_FILE)) {
    const initial: CostStorageData = {
      version: 1,
      totalSpendAllTimeUsd: 0,
      records: [],
      updatedAt: new Date().toISOString(),
    };
    writeCostStorage(initial);
    return initial;
  }

  let raw = '';
  try {
    raw = fs.readFileSync(COST_FILE, 'utf8').trim();
    if (!raw) {
      const initial: CostStorageData = {
        version: 1,
        totalSpendAllTimeUsd: inMemoryLastKnownStorage?.totalSpendAllTimeUsd || 0,
        records: inMemoryLastKnownStorage?.records || [],
        updatedAt: new Date().toISOString(),
      };
      writeCostStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const validTotal = typeof parsed.totalSpendAllTimeUsd === 'number' && Number.isFinite(parsed.totalSpendAllTimeUsd) && parsed.totalSpendAllTimeUsd >= 0
      ? parsed.totalSpendAllTimeUsd
      : (inMemoryLastKnownStorage?.totalSpendAllTimeUsd || 0);

    const validRecords = Array.isArray(parsed.records)
      ? parsed.records.filter((r: any) => r && isValidCostAmount(r.costUsd))
      : [];

    const storage: CostStorageData = {
      version: parsed.version || 1,
      totalSpendAllTimeUsd: validTotal,
      records: validRecords,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    inMemoryLastKnownStorage = { ...storage, records: [...storage.records] };
    return storage;
  } catch (err) {
    console.error('[CostTracker] Failed to read/parse cost file. Initiating recovery:', err);
    const salvaged = salvageCorruptedFile(raw, COST_FILE);
    writeCostStorage(salvaged);
    return salvaged;
  }
}

function writeCostStorage(data: CostStorageData): void {
  const dir = path.dirname(COST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  data.updatedAt = new Date().toISOString();
  inMemoryLastKnownStorage = { ...data, records: [...data.records] };
  fs.writeFileSync(COST_FILE_TMP, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(COST_FILE_TMP, COST_FILE);
}

/**
 * Computes today's settled spend in USD.
 */
export function getDailySpendUsd(dateIso?: string): number {
  const targetDate = dateIso || new Date().toISOString().split('T')[0];
  const storage = ensureCostFileExists();
  return storage.records
    .filter(r => r.timestamp.startsWith(targetDate) && isValidCostAmount(r.costUsd))
    .reduce((sum, r) => sum + r.costUsd, 0);
}

/**
 * Computes the total in-flight budget reservations for pending jobs.
 * Cleans up any expired reservations older than RESERVATION_TTL_MS.
 */
export function getActiveReservationsUsd(excludeJobId?: string): number {
  const now = Date.now();
  let totalReserved = 0;

  for (const [key, res] of activeReservations.entries()) {
    if (now > res.expiresAt) {
      activeReservations.delete(key);
    } else if (key !== excludeJobId) {
      totalReserved += res.amountUsd;
    }
  }

  return Math.round(totalReserved * 100000) / 100000;
}

/**
 * Releases an in-flight budget reservation for a job.
 */
export function releaseBudgetReservation(jobId: string): void {
  if (jobId) {
    activeReservations.delete(jobId);
  }
}

/**
 * Clears all active budget reservations.
 */
export function clearAllBudgetReservations(): void {
  activeReservations.clear();
}

/**
 * Checks whether an incoming operation is permitted under budget limits.
 * Accounts for both settled disk costs and active in-flight job reservations.
 * If permitted and a jobId is provided, registers an in-flight reservation.
 */
export function isBudgetPermitted(
  estimatedAdditionUsd: number,
  config: SeoEngineConfig = DEFAULT_SEO_ENGINE_CONFIG,
  jobId?: string,
  reserve: boolean = Boolean(jobId)
): { permitted: boolean; reason?: string } {
  // 1. Strict input validation
  if (!isValidCostAmount(estimatedAdditionUsd)) {
    return {
      permitted: false,
      reason: `Rejected invalid cost estimate: ${estimatedAdditionUsd}. Cost estimate must be a positive finite number.`,
    };
  }

  const dailyLimit = isValidCostAmount(config.dailyCostLimitUsd) ? config.dailyCostLimitUsd : DEFAULT_SEO_ENGINE_CONFIG.dailyCostLimitUsd;
  const perJobLimit = isValidCostAmount(config.perJobCostLimitUsd) ? config.perJobCostLimitUsd : DEFAULT_SEO_ENGINE_CONFIG.perJobCostLimitUsd;

  // 2. Concurrency check: Account for settled spend + in-flight reservations from other jobs
  const settledDaily = getDailySpendUsd();
  const inFlightReservedOther = getActiveReservationsUsd(jobId);
  const totalCommittedDaily = Math.round((settledDaily + inFlightReservedOther) * 100000) / 100000;
  const projectedDaily = Math.round((totalCommittedDaily + estimatedAdditionUsd) * 100000) / 100000;

  if (projectedDaily > dailyLimit) {
    return {
      permitted: false,
      reason: `Daily cost cap reached ($${settledDaily.toFixed(3)} settled + $${inFlightReservedOther.toFixed(3)} in-flight reserved, projected $${projectedDaily.toFixed(3)} exceeds limit of $${dailyLimit.toFixed(2)})`,
    };
  }

  // 3. Per-job budget limit check
  if (jobId) {
    const storage = ensureCostFileExists();
    const currentJobSpend = storage.records
      .filter(r => r.jobId === jobId && isValidCostAmount(r.costUsd))
      .reduce((sum, r) => sum + r.costUsd, 0);

    const projectedJobSpend = Math.round((currentJobSpend + estimatedAdditionUsd) * 100000) / 100000;
    if (projectedJobSpend > perJobLimit) {
      return {
        permitted: false,
        reason: `Job cost cap reached ($${currentJobSpend.toFixed(3)} spent on job ${jobId}, projected $${projectedJobSpend.toFixed(3)} exceeds limit of $${perJobLimit.toFixed(2)})`,
      };
    }

    // 4. Atomically record/update the reservation for this job
    if (reserve) {
      activeReservations.set(jobId, {
        jobId,
        amountUsd: estimatedAdditionUsd,
        expiresAt: Date.now() + RESERVATION_TTL_MS,
      });
    }
  }

  return { permitted: true };
}

/**
 * Records an API cost transaction atomically.
 * Validates inputs strictly, prevents NaN contamination, and releases/deducts in-flight reservations.
 */
export function recordCostTransaction(record: Omit<CostRecordItem, 'id' | 'timestamp'>): CostRecordItem {
  // 1. Strict validation: reject NaN, Infinity, negative, zero, null, undefined
  if (!isValidCostAmount(record.costUsd)) {
    throw new Error(`[CostTracker] Rejected invalid cost value: ${record.costUsd}. Cost must be a positive finite number.`);
  }

  const sanitizedCost = Math.round(record.costUsd * 100000) / 100000;
  const storage = ensureCostFileExists();
  const newRecord: CostRecordItem = {
    ...record,
    costUsd: sanitizedCost,
    id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  storage.records.push(newRecord);
  storage.totalSpendAllTimeUsd = Math.round((storage.totalSpendAllTimeUsd + sanitizedCost) * 100000) / 100000;

  // 2. Adjust active in-flight reservation for this job
  if (record.jobId && activeReservations.has(record.jobId)) {
    const res = activeReservations.get(record.jobId)!;
    if (res.amountUsd <= sanitizedCost) {
      activeReservations.delete(record.jobId);
    } else {
      res.amountUsd = Math.round((res.amountUsd - sanitizedCost) * 100000) / 100000;
      res.expiresAt = Date.now() + RESERVATION_TTL_MS;
    }
  }

  // 3. Preserve today's records during historical truncation
  const todayStr = new Date().toISOString().split('T')[0];
  if (storage.records.length > 2000) {
    const todayRecords = storage.records.filter(r => r.timestamp.startsWith(todayStr));
    const olderRecords = storage.records.filter(r => !r.timestamp.startsWith(todayStr));
    const keptOlder = olderRecords.slice(-Math.max(500, 2000 - todayRecords.length));
    storage.records = [...keptOlder, ...todayRecords];
  }

  writeCostStorage(storage);
  return newRecord;
}

/**
 * Retrieves a cost breakdown for a specific job.
 */
export function getJobCostBreakdown(jobId: string): {
  dataForSeoCostUsd: number;
  openAiCostUsd: number;
  higgsfieldCostUsd: number;
  totalCostUsd: number;
} {
  const storage = ensureCostFileExists();
  const jobRecords = storage.records.filter(r => r.jobId === jobId && isValidCostAmount(r.costUsd));

  let dataForSeo = 0;
  let openAi = 0;
  let higgsfield = 0;

  for (const rec of jobRecords) {
    if (rec.provider === 'dataforseo') dataForSeo += rec.costUsd;
    if (rec.provider === 'openai') openAi += rec.costUsd;
    if (rec.provider === 'higgsfield') higgsfield += rec.costUsd;
  }

  return {
    dataForSeoCostUsd: Math.round(dataForSeo * 10000) / 10000,
    openAiCostUsd: Math.round(openAi * 10000) / 10000,
    higgsfieldCostUsd: Math.round(higgsfield * 10000) / 10000,
    totalCostUsd: Math.round((dataForSeo + openAi + higgsfield) * 10000) / 10000,
  };
}

