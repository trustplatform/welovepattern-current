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
import { queueJobForTopic, executeJobLifecycle, recoverInterruptedJobs } from '../queue/jobQueueManager';
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

      // Validate numeric limits
      if (typeof updates.dailyCostLimitUsd === 'number' && updates.dailyCostLimitUsd > 0) {
        state.config.dailyCostLimitUsd = updates.dailyCostLimitUsd;
      }
      if (typeof updates.perJobCostLimitUsd === 'number' && updates.perJobCostLimitUsd > 0) {
        state.config.perJobCostLimitUsd = updates.perJobCostLimitUsd;
      }
      if (typeof updates.articlesPerDay === 'number' && updates.articlesPerDay >= 1 && updates.articlesPerDay <= 10) {
        state.config.articlesPerDay = updates.articlesPerDay;
      }
      if (typeof updates.openAiModel === 'string' && updates.openAiModel.trim()) {
        state.config.openAiModel = updates.openAiModel.trim();
      }
      if (typeof updates.engineActive === 'boolean') {
        state.config.engineActive = updates.engineActive;
      }
      if (typeof updates.requiresApproval === 'boolean') {
        state.config.requiresApproval = updates.requiresApproval;
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
  router.post('/jobs/queue', requireAdminAuth, (req, res) => {
    try {
      const { topicId, keyword } = req.body || {};
      const state = readEngineState();

      let targetTopic = state.discoveredTopics.find(t => t.id === topicId || t.keyword.toLowerCase() === (keyword || '').toLowerCase());
      if (!targetTopic && keyword) {
        targetTopic = {
          id: `topic_${Date.now()}`,
          keyword: keyword.trim(),
          trendScore: 70,
          trendDirection: 'stable',
          opportunityScore: 75,
          targetContentFormat: 'guide',
          targetCategoryUrl: '/categories/crochet-tips',
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
