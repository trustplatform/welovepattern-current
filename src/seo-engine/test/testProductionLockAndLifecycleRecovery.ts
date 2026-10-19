/**
 * Production Regression Test Suite:
 * - Safe Engine State File Locking & Concurrency
 * - Single Publication Owner Execution
 * - Durable Source Reconciliation (activeJobs, completedJobsHistory, blog-posts.json)
 * - Daily 3-Article & 6-Pinterest Pipeline Preservation
 */

import fs from 'fs';
import path from 'path';
import {
  acquireEngineStateLock,
  releaseEngineStateLock,
  mutateEngineStateSync,
  readEngineState,
  writeEngineState,
  getEngineStateLockFilePath,
  EngineStateLockError,
  recordSlotExecutedSync,
} from '../queue/engineStorage';
import { evaluateSchedulerTick } from '../scheduler';
import { checkContentCannibalization } from '../validation/productionQualityGates';
import { getLiveBlogPosts } from '../publishing/articlePublisher';

async function runProductionLockAndLifecycleTests() {
  console.log('=== STARTING PRODUCTION LOCK, LIFECYCLE & RECONCILIATION TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  // Backup original state
  const originalState = readEngineState();
  const lockPath = getEngineStateLockFilePath();

  try {
    // -----------------------------------------------------------------
    // TEST 1: Lock acquisition and successful release
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: Basic Lock Acquisition and Release ---');
    const token1 = acquireEngineStateLock(1000);
    assert(Boolean(token1), '1a. Lock successfully acquired with valid token');
    assert(fs.existsSync(lockPath), '1b. Lock file physically exists on disk');

    const lockPayload = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    assert(lockPayload.token === token1, '1c. Lock file records acquired token');
    assert(lockPayload.pid === process.pid, '1d. Lock file records current process PID');

    releaseEngineStateLock(token1);
    assert(!fs.existsSync(lockPath), '1e. Lock file unlinked after release');

    // -----------------------------------------------------------------
    // TEST 2: Lock Contention Timeout & Invariant: Never Write State Without Lock
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Lock Contention Timeout & Zero Write Invariant ---');
    // Acquire lock directly with token
    const heldToken = acquireEngineStateLock(1000);
    let errorThrown: any = null;
    let mutatorExecuted = false;

    const stateBeforeContention = readEngineState();
    const probeValue = `probe_${Date.now()}`;

    try {
      // Attempt mutateEngineStateSync with short timeout while lock is held by another token
      mutateEngineStateSync(state => {
        mutatorExecuted = true;
        (state as any)._probe = probeValue;
      });
    } catch (err: any) {
      errorThrown = err;
    }

    assert(Boolean(errorThrown), '2a. Mutate throws when lock cannot be acquired within deadline');
    assert(errorThrown instanceof EngineStateLockError, '2b. Throws specific EngineStateLockError');
    assert(!mutatorExecuted, '2c. Mutator callback was NEVER executed');

    // Verify disk state was NOT modified
    const stateAfterContention = readEngineState();
    assert((stateAfterContention as any)._probe !== probeValue, '2d. State was NOT written to disk without lock');

    // Release held lock
    releaseEngineStateLock(heldToken);
    assert(!fs.existsSync(lockPath), '2e. Held lock cleanly released');

    // -----------------------------------------------------------------
    // TEST 3: Cannot Release Lock Owned by Another Process / Token
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Process Cannot Release Lock Owned by Another Token ---');
    const foreignToken = 'foreign-uuid-token-xyz';
    fs.writeFileSync(lockPath, JSON.stringify({
      token: foreignToken,
      pid: 99999999, // dummy foreign PID
      createdAt: Date.now(),
    }), 'utf8');

    // Attempt to release with a different token
    releaseEngineStateLock('my-wrong-token-abc');
    assert(fs.existsSync(lockPath), '3a. Foreign lock was NOT unlinked when releasing with wrong token');

    // Clean up test lock
    releaseEngineStateLock(foreignToken);
    assert(!fs.existsSync(lockPath), '3b. Foreign lock released only when matching token is provided');

    // -----------------------------------------------------------------
    // TEST 4: Malformed or Partial Lockfile Fails Safely Without Deletion
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Malformed Lockfile Fails Safely ---');
    fs.writeFileSync(lockPath, '{"broken_json": true, partial', 'utf8');

    let malformedErr: any = null;
    try {
      acquireEngineStateLock(200); // 200ms short timeout
    } catch (err) {
      malformedErr = err;
    }

    assert(Boolean(malformedErr), '4a. Lock acquisition times out on malformed lockfile');
    assert(malformedErr instanceof EngineStateLockError, '4b. Error is EngineStateLockError');
    assert(fs.existsSync(lockPath), '4c. Malformed lockfile was NOT deleted or reclaimed blindly');

    // Clean up manually for subsequent tests
    fs.unlinkSync(lockPath);

    // -----------------------------------------------------------------
    // TEST 5: Verified Stale Lock Reclamation (Dead PID + >60s old)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Safe Reclamation of Verified Stale Lock ---');
    const staleToken = 'stale-token-dead-pid';
    fs.writeFileSync(lockPath, JSON.stringify({
      token: staleToken,
      pid: 2147483640, // definitely dead PID on Linux
      createdAt: Date.now() - 70000, // 70 seconds old (>60s threshold)
    }), 'utf8');

    const freshToken = acquireEngineStateLock(1000);
    assert(freshToken !== staleToken, '5a. Acquired fresh token after reclaiming verified dead lock');
    assert(fs.existsSync(lockPath), '5b. Lock file exists with fresh ownership');

    const freshData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    assert(freshData.token === freshToken, '5c. Lockfile now holds fresh token');
    releaseEngineStateLock(freshToken);

    // -----------------------------------------------------------------
    // TEST 6: Gate 6 Cannibalization Self-Exclusion
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Gate 6 Cannibalization Self-Exclusion ---');
    const livePosts = getLiveBlogPosts();
    if (livePosts.length > 0) {
      const samplePost = livePosts[0];
      // Test without exclusion: should detect collision
      const collisionCheck = checkContentCannibalization(samplePost.slug, samplePost.title, 'sample keyword');
      assert(collisionCheck.hasCollision === true, '6a. Exact slug/title collides when self-exclusion is NOT provided');

      // Test with self-exclusion by jobId
      const selfExcludedJob = checkContentCannibalization(samplePost.slug, samplePost.title, 'sample keyword', {
        excludeJobId: samplePost.seoEngineJobId,
      });
      assert(selfExcludedJob.hasCollision === false, '6b. Has NO collision when excludeJobId matches own job ID');

      // Test with self-exclusion by blogPostId
      const selfExcludedPostId = checkContentCannibalization(samplePost.slug, samplePost.title, 'sample keyword', {
        excludeBlogPostId: samplePost.id,
      });
      assert(selfExcludedPostId.hasCollision === false, '6c. Has NO collision when excludeBlogPostId matches own blog post ID');
    } else {
      console.log('Skipping 6a-c: No live posts found in test environment.');
    }

    // -----------------------------------------------------------------
    // TEST 7: Durable Reconciliation for Already Published Articles
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Durable Reconciliation for Already Published Articles ---');
    // Ensure state where slot is marked as failed, but post is live on website
    mutateEngineStateSync(state => {
      state.config.engineActive = true;
      state.config.timezone = 'America/New_York';
      state.failedArticleSlots = ['2026-10-19_08:00'];
      state.executedArticleSlots = [];
      state.lastExecutedArticleSlot = undefined;
    });

    // Tick scheduler at 08:00 EDT (12:00 UTC) on 2026-10-19
    const oct19Tick = await evaluateSchedulerTick(new Date('2026-10-19T12:00:00.000Z'), {
      useRealDataForSeo: false,
      skipQueueWorkerExecution: true,
    });

    assert(oct19Tick.triggered === true, '7a. Slot triggers and reconciles live published article');
    assert(oct19Tick.reason?.includes('confirmed published on live website') || oct19Tick.action === 'article_batch', '7b. Acknowledged live publication');

    const stateAfterReconciliation = readEngineState();
    assert(
      stateAfterReconciliation.executedArticleSlots?.includes('2026-10-19_08:00'),
      '7c. Slot key is recorded in executedArticleSlots'
    );
    assert(
      !stateAfterReconciliation.failedArticleSlots?.includes('2026-10-19_08:00'),
      '7d. Slot key is removed from failedArticleSlots'
    );

    // -----------------------------------------------------------------
    // TEST 8: Failure in One Slot Does NOT Block Subsequent Slots
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Independent Daily Slots (Failure in Slot 1 Does Not Block Slot 2) ---');
    mutateEngineStateSync(state => {
      state.config.engineActive = true;
      state.config.articlesPerDay = 3;
      state.failedArticleSlots = ['2026-10-25_08:00']; // Slot 1 failed
      state.executedArticleSlots = [];
      state.lastExecutedArticleSlot = undefined;
      state.activeJobs = [];
    });

    // Now tick Slot 2 (12:00 EDT = 16:00 UTC) on the same date
    const slot2Tick = await evaluateSchedulerTick(new Date('2026-10-25T16:00:00.000Z'), {
      useRealDataForSeo: false,
      skipQueueWorkerExecution: true,
    });

    assert(slot2Tick.triggered === true, '8a. Slot 2 triggers successfully despite Slot 1 failure');
    assert(slot2Tick.slotKey === '2026-10-25_12:00', '8b. Slot 2 executed with slotKey 2026-10-25_12:00');

    const stateAfterSlot2 = readEngineState();
    assert(stateAfterSlot2.executedArticleSlots?.includes('2026-10-25_12:00'), '8c. Slot 2 recorded in executedArticleSlots');
    assert(stateAfterSlot2.failedArticleSlots?.includes('2026-10-25_08:00'), '8d. Slot 1 remains isolated in failedArticleSlots without polluting Slot 2');

  } finally {
    // Restore original state
    writeEngineState(originalState);
    if (fs.existsSync(lockPath)) {
      try { fs.unlinkSync(lockPath); } catch {}
    }
  }

  console.log(`\n===============================================================`);
  console.log(`PRODUCTION REGRESSION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runProductionLockAndLifecycleTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
