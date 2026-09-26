/**
 * SEO Content Engine - Dedicated Admin & Operator API Router
 * 
 * Provides production-grade operator observability, lifecycle control,
 * cost accounting, quality gate audits, and test matrix execution.
 * 
 * All state-changing endpoints strictly enforce admin authentication and origin verification.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { readEngineState, writeEngineState, getJobById, updateJobInState } from '../queue/engineStorage';
import { isDataForSeoConfigured } from '../discovery/dataForSeoClient';
import { isOpenAiConfigured } from '../generation/openAiClient';
import { isHiggsfieldConfigured } from '../generation/higgsfieldClient';
import { runTopicDiscoveryPipeline } from '../discovery/topicDiscovery';
import { queueJobForTopic, executeJobLifecycle, recoverInterruptedJobs, createDailyProductionBatch } from '../queue/jobQueueManager';
import { runCompleteQualityGateTestMatrix } from '../test/runQualityGateTestMatrix';
import { getDailySpendUsd, getJobCostBreakdown, CostStorageData } from '../cost/costTracker';
import { SEO_ENGINE_STORAGE_PATHS } from '../config';

export function createSeoEngineRouter(requireAdminAuth: express.RequestHandler): express.Router {
  const router = express.Router();

  // -----------------------------------------------------------------
  // 1. ENGINE STATUS & OBSERVABILITY
  // -----------------------------------------------------------------
  router.get('/status', requireAdminAuth, (req, res) => {
    try {
      recoverInterruptedJobs();
      const state = readEngineState();
      const dailySpendUsd = getDailySpendUsd();

      return res.json({
        success: true,
        engineActive: state.config.engineActive,
        autoPublish: state.config.autoPublish,
        requiresApproval: state.config.requiresApproval,
        queueDepth: state.activeJobs.filter(j => j.stage === 'selected').length,
        activeJobsCount: state.activeJobs.length,
        activeJobs: state.activeJobs,
        recentHistory: state.historicalJobs.slice(-20).reverse(),
        discoveredTopicsCount: state.discoveredTopics.length,
        dailySpendUsd,
        dailyLimitUsd: state.config.dailyCostLimitUsd,
        integrations: {
          dataForSeo: { configured: isDataForSeoConfigured() },
          openAi: { configured: isOpenAiConfigured(), model: state.config.openAiModel },
          higgsfield: { configured: isHiggsfieldConfigured() },
        },
        systemTime: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[SeoEngineRouter] Error fetching status:', err);
      return res.status(500).json({ error: 'Failed to retrieve engine status' });
    }
  });

  // -----------------------------------------------------------------
  // 2. ENGINE CONFIGURATION
  // -----------------------------------------------------------------
  router.get('/config', requireAdminAuth, (req, res) => {
    try {
      const state = readEngineState();
      return res.json({ success: true, config: state.config });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to read configuration' });
    }
  });

  router.post('/config', requireAdminAuth, (req, res) => {
    try {
      const state = readEngineState();
      const updates = req.body || {};

      // 1. Engine & Production
      if (typeof updates.engineActive === 'boolean') {
        state.config.engineActive = updates.engineActive;
      }
      if (typeof updates.articlesPerDay === 'number' && updates.articlesPerDay >= 1 && updates.articlesPerDay <= 20) {
        state.config.articlesPerDay = Math.round(updates.articlesPerDay);
      }
      if (typeof updates.pinsPerDay === 'number' && updates.pinsPerDay >= 1 && updates.pinsPerDay <= 50) {
        state.config.pinsPerDay = Math.round(updates.pinsPerDay);
      }
      if (typeof updates.pinsPerArticle === 'number' && updates.pinsPerArticle >= 1 && updates.pinsPerArticle <= 10) {
        state.config.pinsPerArticle = Math.round(updates.pinsPerArticle);
      }
      if (typeof updates.trendTasksPerDay === 'number' && updates.trendTasksPerDay >= 1 && updates.trendTasksPerDay <= 100) {
        state.config.trendTasksPerDay = Math.round(updates.trendTasksPerDay);
      }
      if (typeof updates.maxConcurrentJobs === 'number' && updates.maxConcurrentJobs >= 1 && updates.maxConcurrentJobs <= 5) {
        state.config.maxConcurrentJobs = Math.round(updates.maxConcurrentJobs);
      }
      if (Array.isArray(updates.activeDays) && updates.activeDays.every((d: any) => typeof d === 'number' && d >= 1 && d <= 7)) {
        state.config.activeDays = updates.activeDays;
      }

      // 2. Publishing
      if (typeof updates.autoPublish === 'boolean') {
        state.config.autoPublish = updates.autoPublish;
      }
      if (typeof updates.autoPublishPinterest === 'boolean') {
        state.config.autoPublishPinterest = updates.autoPublishPinterest;
      }
      if (typeof updates.requiresApproval === 'boolean') {
        state.config.requiresApproval = updates.requiresApproval;
      }

      // 3. Timezone & Schedule
      if (typeof updates.timezone === 'string' && updates.timezone.trim()) {
        state.config.timezone = updates.timezone.trim();
      }
      if (Array.isArray(updates.articlePublishTimes) && updates.articlePublishTimes.every((t: any) => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t))) {
        state.config.articlePublishTimes = updates.articlePublishTimes;
      }
      if (Array.isArray(updates.pinterestPublishTimes) && updates.pinterestPublishTimes.every((t: any) => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t))) {
        state.config.pinterestPublishTimes = updates.pinterestPublishTimes;
      }

      // 4. Article Quality
      if (typeof updates.minWordCount === 'number' && updates.minWordCount >= 300) {
        state.config.minWordCount = Math.round(updates.minWordCount);
      }
      if (typeof updates.maxWordCount === 'number' && updates.maxWordCount >= (state.config.minWordCount || 800)) {
        state.config.maxWordCount = Math.round(updates.maxWordCount);
      }
      if (typeof updates.maxInternalLinks === 'number' && updates.maxInternalLinks >= 1 && updates.maxInternalLinks <= 20) {
        state.config.maxInternalLinks = Math.round(updates.maxInternalLinks);
      }
      if (typeof updates.factualValidationStrict === 'boolean') {
        state.config.factualValidationStrict = updates.factualValidationStrict;
      }
      if (typeof updates.maxRegenerationAttempts === 'number' && updates.maxRegenerationAttempts >= 1 && updates.maxRegenerationAttempts <= 5) {
        state.config.maxRegenerationAttempts = Math.round(updates.maxRegenerationAttempts);
      }
      if (typeof updates.openAiModel === 'string' && updates.openAiModel.trim()) {
        state.config.openAiModel = updates.openAiModel.trim();
      }

      // 5. Safety & Cost
      if (typeof updates.dailyCostLimitUsd === 'number' && updates.dailyCostLimitUsd > 0) {
        state.config.dailyCostLimitUsd = updates.dailyCostLimitUsd;
      }
      if (typeof updates.perJobCostLimitUsd === 'number' && updates.perJobCostLimitUsd > 0) {
        state.config.perJobCostLimitUsd = updates.perJobCostLimitUsd;
      }
      if (typeof updates.estimatedImageCostUsd === 'number' && updates.estimatedImageCostUsd >= 0) {
        state.config.estimatedImageCostUsd = updates.estimatedImageCostUsd;
      }

      // 6. Trend Discovery Intelligence
      if (typeof updates.dataForSeoEnabled === 'boolean') {
        state.config.dataForSeoEnabled = updates.dataForSeoEnabled;
      }
      if (typeof updates.discoveryCountry === 'string' && updates.discoveryCountry.trim()) {
        state.config.discoveryCountry = updates.discoveryCountry.trim();
      }
      if (typeof updates.discoveryLanguage === 'string' && updates.discoveryLanguage.trim()) {
        state.config.discoveryLanguage = updates.discoveryLanguage.trim();
      }
      if (typeof updates.minOpportunityScore === 'number' && updates.minOpportunityScore >= 0 && updates.minOpportunityScore <= 100) {
        state.config.minOpportunityScore = Math.round(updates.minOpportunityScore);
      }
      if (typeof updates.seasonalDiscoveryEnabled === 'boolean') {
        state.config.seasonalDiscoveryEnabled = updates.seasonalDiscoveryEnabled;
      }
      if (typeof updates.gscSeedCatalogEnabled === 'boolean') {
        state.config.gscSeedCatalogEnabled = updates.gscSeedCatalogEnabled;
      }
      if (typeof updates.problemTrendsEnabled === 'boolean') {
        state.config.problemTrendsEnabled = updates.problemTrendsEnabled;
      }
      if (typeof updates.dynamicRelatedQueriesEnabled === 'boolean') {
        state.config.dynamicRelatedQueriesEnabled = updates.dynamicRelatedQueriesEnabled;
      }
      if (typeof updates.curatedSeedsEnabled === 'boolean') {
        state.config.curatedSeedsEnabled = updates.curatedSeedsEnabled;
      }

      // Target markets validation (US, GB, CA, AU, NZ) with deduplication
      if (Array.isArray(updates.targetMarkets)) {
        const allowed = ['US', 'GB', 'CA', 'AU', 'NZ'];
        const filtered = Array.from(new Set(updates.targetMarkets.filter((m: any) => typeof m === 'string' && allowed.includes(m.toUpperCase())))) as ('US' | 'GB' | 'CA' | 'AU' | 'NZ')[];
        if (filtered.length > 0) {
          state.config.targetMarkets = filtered;
        }
      }

      // Trend Windows
      if (typeof updates.freshTrendWindow === 'number' && updates.freshTrendWindow > 0) {
        state.config.freshTrendWindow = Math.round(updates.freshTrendWindow);
      }
      if (typeof updates.recentTrendWindow === 'number' && updates.recentTrendWindow > 0) {
        state.config.recentTrendWindow = Math.round(updates.recentTrendWindow);
      }
      if (typeof updates.historicalTrendWindow === 'number' && updates.historicalTrendWindow > 0) {
        state.config.historicalTrendWindow = Math.round(updates.historicalTrendWindow);
      }

      // Trend Weights (Must sum to ~1.0)
      if (
        typeof updates.freshTrendWeight === 'number' &&
        typeof updates.recentTrendWeight === 'number' &&
        typeof updates.historicalTrendWeight === 'number'
      ) {
        const sum = updates.freshTrendWeight + updates.recentTrendWeight + updates.historicalTrendWeight;
        if (Math.abs(sum - 1.0) < 0.01 && updates.freshTrendWeight >= 0 && updates.recentTrendWeight >= 0 && updates.historicalTrendWeight >= 0) {
          state.config.freshTrendWeight = Math.round(updates.freshTrendWeight * 100) / 100;
          state.config.recentTrendWeight = Math.round(updates.recentTrendWeight * 100) / 100;
          state.config.historicalTrendWeight = Math.round(updates.historicalTrendWeight * 100) / 100;
        }
      }

      writeEngineState(state);
      return res.json({ success: true, config: state.config });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // -----------------------------------------------------------------
  // 3. TOPIC DISCOVERY
  // -----------------------------------------------------------------
  router.get('/discovery/topics', requireAdminAuth, (req, res) => {
    try {
      const state = readEngineState();
      return res.json({
        success: true,
        topics: state.discoveredTopics,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to get discovered topics' });
    }
  });

  router.post('/discovery/run', requireAdminAuth, async (req, res) => {
    try {
      const state = readEngineState();
      const limit = Math.min(10, Math.max(1, Number(req.body?.limit) || 5));

      const newTopics = await runTopicDiscoveryPipeline({
        limit,
        useRealDataForSeo: req.body?.useRealDataForSeo !== false,
      });

      return res.json({
        success: true,
        message: `Discovered ${newTopics.length} qualified topics`,
        topics: newTopics,
      });
    } catch (err: any) {
      console.error('[SeoEngineRouter] Topic discovery failed:', err);
      return res.status(500).json({ error: err?.message || 'Topic discovery failed' });
    }
  });

  // -----------------------------------------------------------------
  // 4. JOB QUEUE & LIFECYCLE
  // -----------------------------------------------------------------
  router.post('/batch/daily', requireAdminAuth, async (req, res) => {
    try {
      const [slot1Job, slot2Job] = await createDailyProductionBatch({
        useRealDataForSeo: req.body?.useRealDataForSeo !== false
      });
      return res.json({
        success: true,
        message: 'Created daily 2-slot production batch (1 Trending Crochet + 1 Tool Guide)',
        batch: {
          slot1_trending_crochet: slot1Job,
          slot2_tool_guide: slot2Job,
        }
      });
    } catch (err: any) {
      console.error('[SeoEngineRouter] Failed to create daily batch:', err);
      return res.status(500).json({ error: err?.message || 'Failed to create daily batch' });
    }
  });

  router.post('/jobs/queue', requireAdminAuth, (req, res) => {
    try {
      const { topicId, keyword } = req.body || {};
      const state = readEngineState();

      let targetTopic = state.discoveredTopics.find(t => t.id === topicId || t.keyword.toLowerCase() === (keyword || '').toLowerCase());
      if (!targetTopic && keyword) {
        const isTool = /calculator|converter|chart|gauge|yardage|counter|pricing/i.test(keyword);
        targetTopic = {
          id: `topic_${Date.now()}`,
          keyword: keyword.trim(),
          contentType: isTool ? 'tool_guide' : 'trending_crochet',
          category: isTool ? 'tools' : 'crochet',
          trendScore: 70,
          trendDirection: 'stable',
          opportunityScore: 75,
          targetContentFormat: isTool ? 'tool_focus' : 'guide',
          targetCategoryUrl: isTool ? '/categories/tools' : '/categories/crochet',
          targetAudienceLevel: 'all_levels',
          searchIntentNotes: 'Manual queued topic',
          discoveredAt: new Date().toISOString(),
          status: 'discovered',
        };
      }

      if (!targetTopic) {
        return res.status(400).json({ error: 'Valid topicId or keyword is required to queue a job' });
      }

      const job = queueJobForTopic(targetTopic, state.config);
      return res.json({ success: true, job });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to queue job' });
    }
  });

  router.get('/jobs/:id', requireAdminAuth, (req, res) => {
    try {
      const job = getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      const costBreakdown = getJobCostBreakdown(req.params.id);
      return res.json({ success: true, job, costBreakdown });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve job details' });
    }
  });

  router.post('/jobs/:id/run', requireAdminAuth, async (req, res) => {
    try {
      const job = await executeJobLifecycle(req.params.id);
      return res.json({ success: true, job });
    } catch (err: any) {
      console.error('[SeoEngineRouter] Error executing job:', err);
      return res.status(500).json({ error: err?.message || 'Failed to execute job' });
    }
  });

  // -----------------------------------------------------------------
  // 5. HUMAN APPROVAL & REJECTION
  // -----------------------------------------------------------------
  router.post('/jobs/:id/approve', requireAdminAuth, (req, res) => {
    try {
      const updated = updateJobInState(req.params.id, j => {
        if (j.stage !== 'awaiting_approval') {
          throw new Error(`Job cannot be approved from current stage: ${j.stage}`);
        }
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Article draft approved by human administrator.',
        });
        return j;
      });
      return res.json({ success: true, job: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Approval failed' });
    }
  });

  router.post('/jobs/:id/reject', requireAdminAuth, (req, res) => {
    try {
      const reason = req.body?.reason || 'Rejected by administrator';
      const updated = updateJobInState(req.params.id, j => {
        j.stage = 'failed';
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `Article draft rejected: ${reason}`,
        });
        return j;
      });
      return res.json({ success: true, job: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Rejection failed' });
    }
  });

  // -----------------------------------------------------------------
  // 6. TEST MATRIX EXECUTION (A through Z)
  // -----------------------------------------------------------------
  router.post('/test/matrix', requireAdminAuth, async (req, res) => {
    try {
      console.log('[SeoEngineRouter] Operator triggered 26-scenario Quality Gate Test Matrix...');
      const matrixResult = await runCompleteQualityGateTestMatrix();
      return res.json({
        success: matrixResult.passed,
        summary: matrixResult,
      });
    } catch (err: any) {
      console.error('[SeoEngineRouter] Test matrix execution failed:', err);
      return res.status(500).json({ error: err?.message || 'Test matrix failed' });
    }
  });

  // -----------------------------------------------------------------
  // 7. COST ACCOUNTING & SPEND REPORT
  // -----------------------------------------------------------------
  router.get('/costs', requireAdminAuth, (req, res) => {
    try {
      const costFile = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.COST_FILE);
      if (!fs.existsSync(costFile)) {
        return res.json({ success: true, totalSpendUsd: 0, records: [] });
      }
      const data: CostStorageData = JSON.parse(fs.readFileSync(costFile, 'utf8'));
      const dailySpendUsd = getDailySpendUsd();

      return res.json({
        success: true,
        dailySpendUsd,
        totalSpendAllTimeUsd: data.totalSpendAllTimeUsd,
        records: data.records.slice(-100).reverse(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to read cost storage' });
    }
  });

  return router;
}
