/**
 * SEO Content Engine - Asynchronous DataForSEO Google Trends Client
 * 
 * Implements the asynchronous task_post -> task_get polling pattern for Google Trends.
 * 
 * SECURITY:
 * Credentials (DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD) are strictly read from process.env on the server.
 * Credentials are NEVER exposed to browser bundles, API responses, or system logs.
 */

export interface DataForSeoTrendItem {
  keyword: string;
  trendScore: number;                         // 0-100 normalized trend momentum
  trendDirection: 'rising' | 'stable' | 'breakout';
  interestOverTime?: { date: string; value: number }[];
  relatedQueries?: string[];
}

export interface DataForSeoTrendsResult {
  isReady: boolean;
  taskId: string;
  items: DataForSeoTrendItem[];
  notConfigured?: boolean;
  costUsd?: number;
  error?: string;
}

import { recordCostTransaction } from '../cost/costTracker';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3';
const REQUEST_TIMEOUT_MS = 30000;

/** Checks if DataForSEO credentials are provided in server environment */
export function isDataForSeoConfigured(): boolean {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  return Boolean(login && password && login.trim() !== '' && password.trim() !== '');
}

/** Generates HTTP Basic Auth header safely */
function getAuthHeader(): string | null {
  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) return null;

  const credentials = `${login}:${password}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Submits an asynchronous Google Trends Explore task to DataForSEO.
 * Returns the task ID to be polled later.
 */
export async function createGoogleTrendsTask(
  keywords: string[],
  options?: {
    locationCode?: number;                    // e.g. 2840 for US
    languageCode?: string;                    // e.g. "en"
  }
): Promise<{ taskId: string } | null> {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return null;
  }

  // Google Trends explore endpoint takes max 5 keywords per task
  const batch = keywords.slice(0, 5);
  const locationCode = options?.locationCode ?? 2840; // Default US
  const languageCode = options?.languageCode ?? 'en';

  const taskItem: Record<string, any> = {
    keywords: batch,
    location_code: locationCode,
    language_code: languageCode,
    type: 'web',
    time_range: 'past_90_days', // Past 90 days for reliable trend momentum
  };

  if (batch.length === 1) {
    taskItem.item_types = ['google_trends_graph', 'google_trends_queries_list'];
  }

  const payload = [taskItem];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${DATAFORSEO_BASE_URL}/keywords_data/google_trends/explore/task_post`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[DataForSEO] task_post responded with HTTP ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    const task = data?.tasks?.[0];
    if (task && task.id) {
      const taskCost = typeof task.cost === 'number' ? task.cost : (typeof data?.cost === 'number' ? data.cost : 0.005);
      recordCostTransaction({
        provider: 'dataforseo',
        operation: 'google_trends_task_post',
        unitsConsumed: batch.length,
        costUsd: taskCost,
        meta: { taskId: task.id, keywords: batch }
      });
      return { taskId: task.id };
    }

    if (task && task.status_message) {
      console.warn(`[DataForSEO] task_post status: ${task.status_message}`);
    }

    return null;
  } catch (err: any) {
    const safeMsg = err?.message?.replace(/Basic\s+[a-zA-Z0-9+/=]+/g, '[REDACTED_AUTH]') || 'Unknown error';
    console.error('[DataForSEO] Network error during task_post:', safeMsg);
    return null;
  }
}

/**
 * Retrieves the status and result of a previously submitted Google Trends task.
 */
export async function getGoogleTrendsTaskResult(taskId: string): Promise<DataForSeoTrendsResult> {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return { isReady: false, taskId, items: [], notConfigured: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${DATAFORSEO_BASE_URL}/keywords_data/google_trends/explore/task_get/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { isReady: false, taskId, items: [], error: `HTTP ${response.status}` };
    }

    const data: any = await response.json();
    const task = data?.tasks?.[0];

    if (!task) {
      return { isReady: false, taskId, items: [], error: 'Task not found in DataForSEO response' };
    }

    const taskCost = typeof task.cost === 'number' ? task.cost : (typeof data?.cost === 'number' ? data.cost : 0);

    // Status code 20000 = Success, task completed
    if (task.status_code === 20000 && Array.isArray(task.result) && task.result.length > 0) {
      const items: DataForSeoTrendItem[] = [];

      for (const res of task.result) {
        const keywordsList: string[] = Array.isArray(res.keywords) && res.keywords.length > 0
          ? res.keywords
          : [res.keyword || task.data?.keywords?.[0] || ''];

        const itemsArr = res.items || [];
        const graphItem = itemsArr.find((i: any) => i.type === 'google_trends_graph' && Array.isArray(i.data));
        const queriesItem = itemsArr.find((i: any) => i.type === 'google_trends_queries_list' && Array.isArray(i.data));

        keywordsList.forEach((kw: string, kwIdx: number) => {
          let avgScore = 0; // Truly 0 if no historical search volume is detected
          const interestPoints: { date: string; value: number }[] = [];

          if (graphItem && Array.isArray(graphItem.data)) {
            let total = 0;
            let count = 0;
            for (const pt of graphItem.data) {
              const rawVal = pt.values?.[kwIdx];
              const val = (rawVal === null || rawVal === undefined || isNaN(Number(rawVal))) ? 0 : Number(rawVal);
              total += val;
              count++;
              interestPoints.push({
                date: pt.date_from || '',
                value: val
              });
            }
            if (count > 0) avgScore = Math.round(total / count);
          }

          const relatedQueries: string[] = [];
          if (queriesItem && Array.isArray(queriesItem.data)) {
            for (const rq of queriesItem.data) {
              if (rq.query && typeof rq.query === 'string') {
                relatedQueries.push(rq.query);
              }
            }
          }

          // Determine trend direction
          let trendDirection: 'rising' | 'stable' | 'breakout' = 'stable';
          if (interestPoints.length >= 4) {
            const recent = interestPoints.slice(-2).reduce((acc, p) => acc + p.value, 0) / 2;
            const earlier = interestPoints.slice(0, 2).reduce((acc, p) => acc + p.value, 0) / 2;
            if (recent > earlier * 1.4 && recent > 20) trendDirection = 'rising';
            if (recent > 80 && earlier < 35) trendDirection = 'breakout';
          }

          items.push({
            keyword: kw,
            trendScore: Math.min(100, Math.max(0, avgScore)),
            trendDirection,
            interestOverTime: interestPoints,
            relatedQueries: relatedQueries.slice(0, 8)
          });
        });
      }

      if (taskCost > 0) {
        recordCostTransaction({
          provider: 'dataforseo',
          operation: 'google_trends_task_get',
          unitsConsumed: items.length,
          costUsd: taskCost,
          meta: { taskId }
        });
      }

      return { isReady: true, taskId, items, costUsd: taskCost };
    }

    // Status code 40100 / 40602 = Task still in queue / processing
    if (task.status_code === 40100 || task.status_code === 40602 || (task.status_message && /in queue|processing/i.test(task.status_message))) {
      return { isReady: false, taskId, items: [] };
    }

    return {
      isReady: false,
      taskId,
      items: [],
      error: task.status_message || `DataForSEO status ${task.status_code}`
    };
  } catch (err: any) {
    return {
      isReady: false,
      taskId,
      items: [],
      error: err?.message || 'Network failure reading task result'
    };
  }
}

/**
 * Polls a DataForSEO task with timeout and configurable intervals.
 */
export async function pollGoogleTrendsTask(
  taskId: string,
  maxWaitMs: number = 30000,
  pollIntervalMs: number = 3000
): Promise<DataForSeoTrendsResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getGoogleTrendsTaskResult(taskId);
    if (result.isReady || result.error || result.notConfigured) {
      return result;
    }
    // Wait interval before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return {
    isReady: false,
    taskId,
    items: [],
    error: `Polling timed out after ${maxWaitMs / 1000}s`
  };
}
