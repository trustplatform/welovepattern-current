/**
 * Live DataForSEO Google Trends Discovery Test Runner
 * 
 * Verifies live connectivity, task submission, and result retrieval from DataForSEO
 * without invoking OpenAI, without generating articles, and without modifying blog data.
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  isDataForSeoConfigured,
  getGoogleTrendsTaskResult,
  DataForSeoTrendItem
} from '../discovery/dataForSeoClient';
import { scoreTopicOpportunity, ScoredTopicBreakdown } from '../discovery/opportunityScorer';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3';

export interface DataForSeoTestResult {
  endpointPost: string;
  endpointGet: string;
  httpStatusPost: number;
  statusCodePost: number;
  statusMessagePost: string;
  taskId: string;
  taskAccepted: boolean;
  httpStatusGet?: number;
  statusCodeGet?: number;
  statusMessageGet?: string;
  retrievedSuccessfully: boolean;
  totalTrendResults: number;
  trendItems: DataForSeoTrendItem[];
  scoredTopics: {
    keyword: string;
    trendScore: number;
    trendDirection: string;
    opportunityScore: number;
    scoreBreakdown: ScoredTopicBreakdown;
  }[];
  mockDataUsed: boolean;
  openAiCalled: boolean;
  published: boolean;
  warnings: string[];
}

export async function runDataForSeoDiscoveryTest(existingTaskId?: string): Promise<DataForSeoTestResult> {
  const warnings: string[] = [];

  if (!isDataForSeoConfigured()) {
    throw new Error('DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are not configured in environment.');
  }

  const login = process.env.DATAFORSEO_LOGIN!.trim();
  const password = process.env.DATAFORSEO_PASSWORD!.trim();
  const authHeader = `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

  const postEndpoint = `${DATAFORSEO_BASE_URL}/keywords_data/google_trends/explore/task_post`;
  let taskId = existingTaskId || '';
  let httpStatusPost = 200;
  let statusCodePost = 20000;
  let statusMessagePost = 'Task Reused / Created';

  if (!taskId) {
    const payload = [
      {
        keywords: ['crochet blanket'],
        location_code: 2840, // United States
        language_code: 'en',
        type: 'web',
        time_range: 'past_90_days',
        item_types: ['google_trends_graph', 'google_trends_queries_list']
      }
    ];

    console.log(`[DataForSEO Test] Submitting POST to: ${postEndpoint}`);
    const postResponse = await fetch(postEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    httpStatusPost = postResponse.status;
    if (!postResponse.ok) {
      throw new Error(`DataForSEO task_post returned HTTP error ${httpStatusPost}: ${postResponse.statusText}`);
    }

    const postData: any = await postResponse.json();
    const task = postData?.tasks?.[0];

    statusCodePost = postData?.status_code || task?.status_code || 0;
    statusMessagePost = postData?.status_message || task?.status_message || 'Unknown';
    taskId = task?.id;

    if (!taskId) {
      throw new Error(`DataForSEO did not return a task ID. Response: ${JSON.stringify(postData)}`);
    }
  }

  console.log(`[DataForSEO Test] Using Task ID: ${taskId}`);

  const getEndpoint = `${DATAFORSEO_BASE_URL}/keywords_data/google_trends/explore/task_get/${taskId}`;
  let retrievedSuccessfully = false;
  let trendItems: DataForSeoTrendItem[] = [];
  let httpStatusGet = 0;
  let statusCodeGet = 0;
  let statusMessageGet = '';

  // Poll for up to 150 seconds (DataForSEO standard queue typically processes in 30-90 seconds)
  const maxAttempts = 30;
  const pollIntervalMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[DataForSEO Test] Polling task_get (attempt ${attempt}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const getResponse = await fetch(getEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    httpStatusGet = getResponse.status;
    if (!getResponse.ok) {
      warnings.push(`task_get returned HTTP ${httpStatusGet} on attempt ${attempt}`);
      continue;
    }

    const getData: any = await getResponse.json();
    const taskGetObj = getData?.tasks?.[0];
    statusCodeGet = getData?.status_code || taskGetObj?.status_code || 0;
    statusMessageGet = taskGetObj?.status_message || getData?.status_message || '';

    // If completed
    if (taskGetObj && taskGetObj.status_code === 20000 && Array.isArray(taskGetObj.result) && taskGetObj.result.length > 0) {
      console.log('[DataForSEO Test] Result retrieved successfully!');
      retrievedSuccessfully = true;

      // Parse with the standard project parser
      const parsed = await getGoogleTrendsTaskResult(taskId);
      trendItems = parsed.items;
      break;
    } else if (taskGetObj?.status_code === 40100 || taskGetObj?.status_code === 40602 || /in queue|processing/i.test(statusMessageGet)) {
      console.log(`[DataForSEO Test] Task still queued (${statusMessageGet})...`);
    } else {
      console.log(`[DataForSEO Test] Status code ${taskGetObj?.status_code}: ${statusMessageGet}`);
    }
  }

  if (!retrievedSuccessfully) {
    warnings.push(`Task did not finalize within ${maxAttempts * pollIntervalMs / 1000}s. Last status: ${statusMessageGet}`);
  }

  // Opportunity Scoring from the real DataForSEO returned data
  const scoredTopics: {
    keyword: string;
    trendScore: number;
    trendDirection: string;
    opportunityScore: number;
    scoreBreakdown: ScoredTopicBreakdown;
  }[] = [];

  // Collect all real keywords and related queries returned by Google Trends
  const candidateKeywords: { keyword: string; trendScore: number; trendDirection: string }[] = [];

  for (const item of trendItems) {
    candidateKeywords.push({
      keyword: item.keyword,
      trendScore: item.trendScore,
      trendDirection: item.trendDirection
    });

    if (item.relatedQueries && item.relatedQueries.length > 0) {
      for (const rq of item.relatedQueries) {
        candidateKeywords.push({
          keyword: rq,
          trendScore: item.trendScore,
          trendDirection: item.trendDirection
        });
      }
    }
  }

  // Score each real candidate keyword using the opportunity scorer
  for (const cand of candidateKeywords) {
    const scoreBreakdown = scoreTopicOpportunity(cand.keyword, {
      searchTrendSignal: cand.trendScore
    });

    if (!scoreBreakdown.isFilteredOut) {
      scoredTopics.push({
        keyword: cand.keyword,
        trendScore: cand.trendScore,
        trendDirection: cand.trendDirection,
        opportunityScore: scoreBreakdown.totalOpportunityScore,
        scoreBreakdown
      });
    }
  }

  // Sort descending by opportunity score
  scoredTopics.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    endpointPost: postEndpoint,
    endpointGet: getEndpoint,
    httpStatusPost,
    statusCodePost,
    statusMessagePost,
    taskId,
    taskAccepted: true,
    httpStatusGet,
    statusCodeGet,
    statusMessageGet,
    retrievedSuccessfully,
    totalTrendResults: trendItems.length,
    trendItems,
    scoredTopics: scoredTopics.slice(0, 10), // Top 10 real topics
    mockDataUsed: false,
    openAiCalled: false,
    published: false,
    warnings
  };
}
