/**
 * SEO Content Engine - Topic Discovery Pipeline Orchestrator
 * 
 * Pipeline:
 * DataForSEO Google Trends (or verified seed pool)
 * → topic discovery
 * → opportunity scoring
 * → 60-day deduplication
 * → persistent atomic state storage
 */

import { DiscoveredTopic, DataForSeoTrendItem } from '../types';
import { GSC_SEED_KEYWORDS } from './gscSeedCatalog';
import { isDataForSeoConfigured, createGoogleTrendsTask, getGoogleTrendsTaskResult } from './dataForSeoClient';
import { scoreDiscoveredTopic } from './opportunityScorer';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { CONTENT_ENGINE_LIMITS } from '../config';

export interface RunDiscoveryOptions {
  limit?: number;
  useRealDataForSeo?: boolean;
}

/**
 * Runs the topic discovery pipeline end-to-end.
 */
export async function runTopicDiscoveryPipeline(options: RunDiscoveryOptions = {}): Promise<DiscoveredTopic[]> {
  const limit = options.limit || 5;
  const state = readEngineState();

  // 1. Gather historical keywords to prevent cannibalization
  const lookbackMs = CONTENT_ENGINE_LIMITS.DUPLICATE_CHECK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - lookbackMs;

  const recentKeywords = new Set<string>();
  for (const job of state.historicalJobs) {
    if (new Date(job.date).getTime() > cutoffTime) {
      recentKeywords.add(job.keyword.toLowerCase().trim());
    }
  }
  for (const job of state.activeJobs) {
    recentKeywords.add(job.topic.keyword.toLowerCase().trim());
  }

  // 2. Filter seed candidates
  const availableSeeds = GSC_SEED_KEYWORDS.filter(
    s => !recentKeywords.has(s.keyword.toLowerCase().trim())
  );

  const candidateKeywords = availableSeeds.slice(0, Math.min(limit * 2, 10)).map(s => s.keyword);
  const trendDataMap = new Map<string, DataForSeoTrendItem>();

  // 3. Query DataForSEO Google Trends if configured and enabled
  if (options.useRealDataForSeo !== false && isDataForSeoConfigured() && candidateKeywords.length > 0) {
    try {
      const batch = candidateKeywords.slice(0, 5);
      const postResult = await createGoogleTrendsTask(batch);

      if (postResult && postResult.taskId) {
        // Poll for task completion (up to 5 attempts, 3s backoff)
        for (let i = 0; i < 5; i++) {
          await new Promise(res => setTimeout(res, 3000));
          const getResult = await getGoogleTrendsTaskResult(postResult.taskId);
          if (getResult.isReady && getResult.items.length > 0) {
            for (const item of getResult.items) {
              trendDataMap.set(item.keyword.toLowerCase(), item);
            }
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn('[TopicDiscovery] DataForSEO trend query encountered error, proceeding with seed baseline:', err?.message || err);
    }
  }

  // 4. Score all candidates using opportunity scoring engine
  const scoredTopics: DiscoveredTopic[] = [];
  for (const kw of candidateKeywords) {
    const trendItem = trendDataMap.get(kw.toLowerCase());
    const scored = scoreDiscoveredTopic(kw, trendItem);

    if (scored.opportunityScore >= (state.config.minOpportunityScore || 65)) {
      scoredTopics.push(scored);
    }
  }

  // Sort by opportunity score descending
  scoredTopics.sort((a, b) => b.opportunityScore - a.opportunityScore);
  const selectedTopics = scoredTopics.slice(0, limit);

  // 5. Update engine state atomically
  if (selectedTopics.length > 0) {
    const existingTopics = state.discoveredTopics || [];
    const newTopics = selectedTopics.filter(t => !existingTopics.some(e => e.keyword.toLowerCase() === t.keyword.toLowerCase()));
    state.discoveredTopics = [...newTopics, ...existingTopics].slice(0, 50);
    writeEngineState(state);
  }

  return selectedTopics;
}
