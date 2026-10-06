/**
 * SEO Content Engine - Dedicated Local Asset Recovery & Preservation System
 * 
 * Recovers previously generated, paid Higgsfield assets from local storage
 * with ZERO new API calls, ZERO additional cost, and ZERO credit consumption.
 * 
 * SAFETY & RESILIENCE INVARIANTS:
 * - Deterministic Waterfall:
 *   1. Existing In-State Valid Asset Check
 *   2. Exact Prompt-Hash Deterministic Filename Check
 *   3. Verified Forensic Slot Mapping
 *   4. Unique Exact Slug Prefix Check (Strict Single Match)
 * - Ambiguity Protection: Topics with multiple ambiguous visual variants (e.g. Halloween test sets)
 *   are NEVER auto-attached.
 * - Test/Benchmark Protection: Benchmark fixture images are never attached to production jobs.
 * - Physical Integrity: Verifies `fs.existsSync` and `fs.statSync().size > 100`.
 * - Workflow Preservation: Verifies article completeness before transitioning job stage.
 * - Idempotency: Running recovery multiple times is completely idempotent.
 */

import fs from 'fs';
import path from 'path';
import { SeoEngineArticleJob, PinterestCreativeConcept } from '../types';
import { SEO_ENGINE_STORAGE_PATHS } from '../config';
import { generateStableImageFilename } from '../generation/higgsfieldClient';
import { readEngineState, writeEngineState } from './engineStorage';

export interface RecoveredSlotAsset {
  slotType: 'hero' | 'pin_1' | 'pin_2';
  stableAssetPath: string;
  stablePublicUrl: string;
  fileSizeBytes: number;
  matchType: 'in_state' | 'prompt_hash' | 'forensic_exact' | 'unique_slug';
}

export interface JobRecoveryResult {
  jobId: string;
  recovered: boolean;
  heroRecovered: boolean;
  pin1Recovered: boolean;
  pin2Recovered: boolean;
  allAssetsReady: boolean;
  previousStage: string;
  newStage: string;
  reasons: string[];
  recoveredAssets: RecoveredSlotAsset[];
}

/**
 * Benchmark / test pattern blacklist to prevent attaching benchmark artifacts to production jobs.
 */
const BENCHMARK_EXCLUSIONS = [
  '-literal-lock-',
  '-medium-quality-',
  '-editorial-serif-',
  '-fullprompt-',
  '-single-pin-v3-',
  '-test-pin-',
  '-jewel-tone-pin-',
];

/**
 * Known exact forensic slot bindings for pre-rendered production jobs.
 * Maps exact keywords, tool slugs, or article slugs to verified Hero, Pin 1, and Pin 2 disk assets.
 */
const FORENSIC_EXACT_JOB_BINDINGS: {
  matchKeywords: string[];
  matchSlugs: string[];
  heroFilename: string;
  pin1Filename: string;
  pin2Filename: string;
}[] = [
  // Crochet Blanket Border Calculator (job_2026-10-04_lvcypd)
  {
    matchKeywords: ['crochet blanket border calculator', 'blanket border calculator', 'border-calculator'],
    matchSlugs: ['master-your-crochet-blanket-borders', 'crochet-blanket-border-calculator'],
    heroFilename: 'crochet-blanket-border-calculator-accura-23758683d7.jpg',
    pin1Filename: 'crochet-blanket-border-calculator-accura-d9574b01b9.jpg',
    pin2Filename: 'crochet-blanket-border-calculator-accura-f2847c3b96.jpg',
  },
  // Crochet Blanket Yarn Calculator (job_2026-10-01_8se4rp)
  {
    matchKeywords: ['how to use a crochet blanket yarn calculator', 'crochet blanket yarn calculator', 'blanket-calculator'],
    matchSlugs: ['how-to-use-a-crochet-blanket-yarn-calculator', 'crochet-blanket-yarn-calculator'],
    heroFilename: 'crochet-blanket-yarn-calculator-accurate-5f2ef4f0d5.jpg',
    pin1Filename: 'crochet-blanket-yarn-calculator-accurate-13ec052033.jpg',
    pin2Filename: 'crochet-blanket-yarn-calculator-accurate-83ef1d8770.jpg',
  },
  // Crochet Gauge Calculator Tool (job_2026-09-28_g1urxo)
  {
    matchKeywords: ['crochet gauge calculator', 'gauge-calculator', 'crochet gauge calculator tool'],
    matchSlugs: ['mastering-your-crochet-gauge', 'mastering-crochet-gauge'],
    heroFilename: 'mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg',
    pin1Filename: 'mastering-crochet-gauge-your-ultimate-ca-e1844b9974.jpg',
    pin2Filename: 'mastering-crochet-gauge-your-ultimate-ca-f3ea9cf368.jpg',
  },
  // Online Stitch Counter Tool (job_2026-10-03_ciui3h)
  {
    matchKeywords: ['stitch counter online', 'online stitch counter', 'stitch-counter'],
    matchSlugs: ['mastering-your-crochet-projects-with-an-online-stitch-counter', 'mastering-crochet-with-our-online-stitch'],
    heroFilename: 'mastering-crochet-with-our-online-stitch-431a461a51.jpg',
    pin1Filename: 'mastering-crochet-with-our-online-stitch-5dec2bd6a6.jpg',
    pin2Filename: 'mastering-crochet-with-our-online-stitch-9a57400e28.jpg',
  },
];

/**
 * Validates whether a file exists and meets minimum valid image criteria (> 100 bytes).
 */
export function isValidLocalAsset(filePath?: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false;
  try {
    let clean = filePath;
    if (clean.startsWith('/www/wwwroot/welovepattern.com/')) {
      clean = clean.replace('/www/wwwroot/welovepattern.com/', '');
    }

    let resolved = path.isAbsolute(clean) ? clean : path.resolve(process.cwd(), clean);
    if (!fs.existsSync(resolved)) {
      resolved = path.resolve(process.cwd(), clean.replace(/^\/+/, ''));
      if (!fs.existsSync(resolved)) {
        return false;
      }
    }
    const stat = fs.statSync(resolved);
    return stat.isFile() && stat.size > 100;
  } catch {
    return false;
  }
}

/**
 * Resolves a clean relative file path and public URL from a disk filename and target folder.
 */
function buildAssetMetadata(targetFolder: 'blog' | 'pinterest', filename: string): {
  assetPath: string;
  publicUrl: string;
  size: number;
} {
  const relativeDir = targetFolder === 'blog'
    ? SEO_ENGINE_STORAGE_PATHS.BLOG_IMAGES_DIR
    : SEO_ENGINE_STORAGE_PATHS.SEO_PINS_DIR;
  const fullPath = path.resolve(process.cwd(), relativeDir, filename);
  const publicDir = relativeDir.startsWith('public/') ? relativeDir.substring('public/'.length) : relativeDir;
  const publicUrl = `/${publicDir}/${filename}`;
  const size = fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0;
  return { assetPath: fullPath, publicUrl, size };
}

/**
 * Checks if a filename is marked as a benchmark/test asset.
 */
function isBenchmarkAsset(filename: string): boolean {
  return BENCHMARK_EXCLUSIONS.some(ex => filename.includes(ex));
}

/**
 * Scans a folder for all files matching a slug prefix.
 */
function getMatchingDiskFiles(targetFolder: 'blog' | 'pinterest', slugPrefix: string): string[] {
  const dir = path.resolve(process.cwd(), targetFolder === 'blog' ? SEO_ENGINE_STORAGE_PATHS.BLOG_IMAGES_DIR : SEO_ENGINE_STORAGE_PATHS.SEO_PINS_DIR);
  if (!fs.existsSync(dir)) return [];
  const cleanPrefix = slugPrefix.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 35);
  return fs.readdirSync(dir).filter(f => {
    if (!f.endsWith('.jpg') && !f.endsWith('.png')) return false;
    if (isBenchmarkAsset(f)) return false;
    return f.startsWith(cleanPrefix);
  });
}

/**
 * Checks if a job matches one of the known forensic bindings.
 */
function findForensicBinding(job: SeoEngineArticleJob) {
  const kw = (job.topic?.keyword || '').toLowerCase().trim();
  const toolSlug = (job.topic?.toolSlug || '').toLowerCase().trim();
  const articleSlug = (job.articleContent?.slug || '').toLowerCase().trim();

  for (const binding of FORENSIC_EXACT_JOB_BINDINGS) {
    if (binding.matchKeywords.some(k => kw === k || kw.includes(k) || toolSlug === k)) {
      return binding;
    }
    if (articleSlug && binding.matchSlugs.some(s => articleSlug.startsWith(s) || s.startsWith(articleSlug))) {
      return binding;
    }
  }
  return null;
}

/**
 * Deterministically finds the candidate Hero image for a job.
 */
export function resolveHeroAsset(job: SeoEngineArticleJob): RecoveredSlotAsset | null {
  const existingHero = job.articleContent?.heroImage;

  // Level 1: In-State exact check
  if (existingHero?.stableAssetPath && isValidLocalAsset(existingHero.stableAssetPath)) {
    const meta = buildAssetMetadata('blog', path.basename(existingHero.stableAssetPath));
    return {
      slotType: 'hero',
      stableAssetPath: meta.assetPath,
      stablePublicUrl: meta.publicUrl,
      fileSizeBytes: meta.size,
      matchType: 'in_state',
    };
  }

  const slug = job.articleContent?.slug || job.topic?.keyword?.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || '';
  const prompt = existingHero?.prompt || '';

  // Level 2: Exact Prompt-Hash Check
  if (slug && prompt) {
    const expectedFilename = generateStableImageFilename(slug, prompt);
    const blogDir = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.BLOG_IMAGES_DIR);
    const expectedPath = path.join(blogDir, expectedFilename);
    if (isValidLocalAsset(expectedPath)) {
      const meta = buildAssetMetadata('blog', expectedFilename);
      return {
        slotType: 'hero',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'prompt_hash',
      };
    }
  }

  // Level 3: Forensic exact mapping by keyword/slug
  const binding = findForensicBinding(job);
  if (binding) {
    const meta = buildAssetMetadata('blog', binding.heroFilename);
    if (isValidLocalAsset(meta.assetPath)) {
      return {
        slotType: 'hero',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'forensic_exact',
      };
    }
  }

  // Ambiguity Guard: Check if multiple variant files exist in directory matching topic keywords
  const blogDir = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.BLOG_IMAGES_DIR);
  if (fs.existsSync(blogDir)) {
    const allBlogFiles = fs.readdirSync(blogDir);
    const kwTokens = (job.topic?.keyword || '').toLowerCase().split(/\s+/).filter(t => t.length > 4);
    if (kwTokens.length > 0) {
      const topicMatches = allBlogFiles.filter(f => kwTokens.some(tok => f.includes(tok)));
      if (topicMatches.length > 1) {
        // Multi-variant ambiguous topic family (e.g. Halloween): reject auto-attachment
        return null;
      }
    }
  }

  // Level 4: Unique exact slug prefix check (Strict 1 Candidate)
  const cleanPrefix = slug.slice(0, 35);
  const candidateFiles = getMatchingDiskFiles('blog', cleanPrefix);
  if (candidateFiles.length === 1) {
    const filename = candidateFiles[0];
    const meta = buildAssetMetadata('blog', filename);
    if (isValidLocalAsset(meta.assetPath)) {
      return {
        slotType: 'hero',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'unique_slug',
      };
    }
  }

  // Ambiguous candidates (> 1) or none found: return null
  return null;
}

/**
 * Deterministically finds the candidate Pin 1 or Pin 2 image for a job.
 */
export function resolvePinAsset(
  job: SeoEngineArticleJob,
  pinSlot: 1 | 2
): RecoveredSlotAsset | null {
  const pinIndex = pinSlot - 1;
  const existingPin = job.pinterestPins?.[pinIndex];

  // Level 1: In-State exact check
  if (existingPin?.stableAssetPath && isValidLocalAsset(existingPin.stableAssetPath)) {
    const meta = buildAssetMetadata('pinterest', path.basename(existingPin.stableAssetPath));
    return {
      slotType: pinSlot === 1 ? 'pin_1' : 'pin_2',
      stableAssetPath: meta.assetPath,
      stablePublicUrl: meta.publicUrl,
      fileSizeBytes: meta.size,
      matchType: 'in_state',
    };
  }

  const slug = job.articleContent?.slug || job.topic?.keyword?.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || '';
  const prompt = existingPin?.compactHiggsfieldPrompt || '';

  // Level 2: Exact Prompt-Hash Check
  if (slug && prompt) {
    const expectedFilename = generateStableImageFilename(`${slug}-pin-${pinSlot}`, prompt);
    const pinsDir = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.SEO_PINS_DIR);
    const expectedPath = path.join(pinsDir, expectedFilename);
    if (isValidLocalAsset(expectedPath)) {
      const meta = buildAssetMetadata('pinterest', expectedFilename);
      return {
        slotType: pinSlot === 1 ? 'pin_1' : 'pin_2',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'prompt_hash',
      };
    }
  }

  // Level 3: Forensic exact mapping
  const binding = findForensicBinding(job);
  if (binding) {
    const targetFilename = pinSlot === 1 ? binding.pin1Filename : binding.pin2Filename;
    const meta = buildAssetMetadata('pinterest', targetFilename);
    if (isValidLocalAsset(meta.assetPath)) {
      return {
        slotType: pinSlot === 1 ? 'pin_1' : 'pin_2',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'forensic_exact',
      };
    }
  }

  // Ambiguity Guard: Check if multiple variant files exist in directory matching topic keywords
  const pinsDir = path.resolve(process.cwd(), SEO_ENGINE_STORAGE_PATHS.SEO_PINS_DIR);
  if (fs.existsSync(pinsDir)) {
    const allPinFiles = fs.readdirSync(pinsDir);
    const kwTokens = (job.topic?.keyword || '').toLowerCase().split(/\s+/).filter(t => t.length > 4);
    if (kwTokens.length > 0) {
      const topicMatches = allPinFiles.filter(f => kwTokens.some(tok => f.includes(tok)));
      if (topicMatches.length > 2) {
        // Multi-variant ambiguous topic family: reject auto-attachment
        return null;
      }
    }
  }

  // Level 4: Explicit Slot Prefix Match `${cleanPrefix}-pin-${pinSlot}`
  const cleanPrefix = slug.slice(0, 35);
  const candidateFiles = getMatchingDiskFiles('pinterest', `${cleanPrefix}-pin-${pinSlot}`);
  if (candidateFiles.length === 1) {
    const filename = candidateFiles[0];
    const meta = buildAssetMetadata('pinterest', filename);
    if (isValidLocalAsset(meta.assetPath)) {
      return {
        slotType: pinSlot === 1 ? 'pin_1' : 'pin_2',
        stableAssetPath: meta.assetPath,
        stablePublicUrl: meta.publicUrl,
        fileSizeBytes: meta.size,
        matchType: 'unique_slug',
      };
    }
  }

  // Ambiguous candidates (> 1) or none found: return null
  return null;
}

/**
 * Recovers all missing local assets for a single job and updates state deterministically.
 * Guarantees zero Higgsfield API calls and zero cost transactions.
 */
export function recoverJobLocalAssets(job: SeoEngineArticleJob): JobRecoveryResult {
  const previousStage = job.stage;
  const recoveredAssets: RecoveredSlotAsset[] = [];
  const reasons: string[] = [];

  // Verify article content completeness
  const hasCompleteArticle = Boolean(
    job.articleContent &&
    typeof job.articleContent.title === 'string' &&
    job.articleContent.title.trim().length > 0 &&
    typeof job.articleContent.contentHtml === 'string' &&
    job.articleContent.contentHtml.trim().length > 200 &&
    typeof job.articleContent.slug === 'string' &&
    job.articleContent.slug.trim().length > 0 &&
    typeof job.articleContent.wordCount === 'number' &&
    job.articleContent.wordCount > 0
  );

  // 1. Recover Hero Asset
  const heroAsset = resolveHeroAsset(job);
  let heroRecovered = false;
  if (heroAsset) {
    recoveredAssets.push(heroAsset);
    heroRecovered = true;
    if (job.articleContent) {
      job.articleContent.heroImage = {
        prompt: job.articleContent.heroImage?.prompt || 'Recovered craft photography hero image',
        compactPrompt: job.articleContent.heroImage?.compactPrompt || 'Recovered craft photography hero image',
        stableAssetPath: heroAsset.stableAssetPath,
        stablePublicUrl: heroAsset.stablePublicUrl,
        status: 'ready',
      };
    }
    reasons.push(`Recovered Hero asset: ${path.basename(heroAsset.stableAssetPath)} (${heroAsset.matchType})`);
  } else {
    reasons.push('Hero asset could not be deterministically recovered.');
  }

  // 2. Recover Pin 1 & Pin 2 Assets
  if (!job.pinterestPins || job.pinterestPins.length < 2) {
    job.pinterestPins = [
      {
        pinNumber: 1,
        conceptAngle: 'Primary Craft Concept',
        visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Craft tool', colorPalette: 'natural', humanElement: 'none' },
        compactHiggsfieldPrompt: 'Craft tool in action',
        typographyOverlay: { primaryHeadline: job.articleContent?.title || job.topic?.keyword || 'Crochet Tool Guide', ctaBadgeText: 'EXPLORE GUIDE →' },
        destinationUrl: `https://welovepattern.com/blog/${job.articleContent?.slug || ''}`,
        publishStatus: 'pending',
      } as PinterestCreativeConcept,
      {
        pinNumber: 2,
        conceptAngle: 'Technical Layflat Concept',
        visualStyle: { imageCount: 1, compositionType: 'flatlay_materials', subjectDescription: 'Craft tool flatlay', colorPalette: 'warm', humanElement: 'hands_only' },
        compactHiggsfieldPrompt: 'Craft tool flatlay',
        typographyOverlay: { primaryHeadline: job.articleContent?.title || job.topic?.keyword || 'Crochet Tool Guide', ctaBadgeText: 'EXPLORE GUIDE →' },
        destinationUrl: `https://welovepattern.com/blog/${job.articleContent?.slug || ''}`,
        publishStatus: 'pending',
      } as PinterestCreativeConcept,
    ];
  }

  const pin1Asset = resolvePinAsset(job, 1);
  let pin1Recovered = false;
  if (pin1Asset && job.pinterestPins[0]) {
    recoveredAssets.push(pin1Asset);
    pin1Recovered = true;
    job.pinterestPins[0].stableAssetPath = pin1Asset.stableAssetPath;
    job.pinterestPins[0].stablePublicUrl = pin1Asset.stablePublicUrl;
    job.pinterestPins[0].publishStatus = 'image_ready';
    reasons.push(`Recovered Pin 1 asset: ${path.basename(pin1Asset.stableAssetPath)} (${pin1Asset.matchType})`);
  } else {
    reasons.push('Pin 1 asset could not be deterministically recovered.');
  }

  const pin2Asset = resolvePinAsset(job, 2);
  let pin2Recovered = false;
  if (pin2Asset && job.pinterestPins[1]) {
    recoveredAssets.push(pin2Asset);
    pin2Recovered = true;
    job.pinterestPins[1].stableAssetPath = pin2Asset.stableAssetPath;
    job.pinterestPins[1].stablePublicUrl = pin2Asset.stablePublicUrl;
    job.pinterestPins[1].publishStatus = 'image_ready';
    reasons.push(`Recovered Pin 2 asset: ${path.basename(pin2Asset.stableAssetPath)} (${pin2Asset.matchType})`);
  } else {
    reasons.push('Pin 2 asset could not be deterministically recovered.');
  }

  const allAssetsReady = heroRecovered && pin1Recovered && pin2Recovered;
  let newStage = previousStage;

  // Workflow transition guard: Only transition if complete article AND all 3 assets exist
  if (hasCompleteArticle && allAssetsReady) {
    if (previousStage === 'failed' || previousStage === 'generating_images') {
      newStage = 'awaiting_approval';
      job.stage = newStage;
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `[AssetRecovery] All 3 visual assets recovered locally ($0 cost). Job transitioned from ${previousStage} to ${newStage}.`,
      });
    }
  }

  return {
    jobId: job.id,
    recovered: recoveredAssets.length > 0,
    heroRecovered,
    pin1Recovered,
    pin2Recovered,
    allAssetsReady,
    previousStage,
    newStage,
    reasons,
    recoveredAssets,
  };
}

/**
 * Runs asset recovery across all active jobs in state.
 */
export function recoverAllActiveJobAssets(): JobRecoveryResult[] {
  const state = readEngineState();
  const results: JobRecoveryResult[] = [];
  let modified = false;

  for (const job of state.activeJobs || []) {
    const res = recoverJobLocalAssets(job);
    if (res.recovered) {
      results.push(res);
      modified = true;
    }
  }

  if (modified) {
    writeEngineState(state);
  }

  return results;
}

/**
 * Returns all unassigned recovered jobs that have complete articles and all 3 local assets on disk.
 * Sorted chronologically (oldest first).
 */
export function getEligibleRecoveredJobs(limit: number = 1): SeoEngineArticleJob[] {
  const state = readEngineState();
  const candidates: SeoEngineArticleJob[] = [];

  for (const job of state.activeJobs || []) {
    // 1. Must not already be published
    if (job.stage === 'completed' || job.publishedBlogPostId || job.publishedSlug) {
      continue;
    }

    // 2. Must not already be assigned to a publish date
    if (job.assignedPublishDate) {
      continue;
    }

    // 3. Must have complete article content
    const hasCompleteArticle = Boolean(
      job.articleContent &&
      typeof job.articleContent.title === 'string' &&
      job.articleContent.title.trim().length > 0 &&
      typeof job.articleContent.contentHtml === 'string' &&
      job.articleContent.contentHtml.trim().length > 200 &&
      typeof job.articleContent.slug === 'string' &&
      job.articleContent.slug.trim().length > 0 &&
      typeof job.articleContent.wordCount === 'number' &&
      job.articleContent.wordCount > 0
    );

    if (!hasCompleteArticle) {
      continue;
    }

    // 4. Must have all 3 valid local assets on disk
    const hasValidHero = isValidLocalAsset(job.articleContent?.heroImage?.stableAssetPath);
    const hasValidPin1 = isValidLocalAsset(job.pinterestPins?.[0]?.stableAssetPath);
    const hasValidPin2 = isValidLocalAsset(job.pinterestPins?.[1]?.stableAssetPath);

    if (hasValidHero && hasValidPin1 && hasValidPin2) {
      candidates.push(job);
    }
  }

  // Sort deterministically: oldest first
  candidates.sort((a, b) => (a.createdAt || a.dateScheduled || a.id).localeCompare(b.createdAt || b.dateScheduled || b.id));

  return candidates.slice(0, limit);
}

/**
 * Assigns a recovered job to a specific production article slot and sets corresponding Pinterest slot times.
 */
export function assignRecoveredJobToSlot(
  jobId: string,
  dateStr: string,
  slotTime: string,
  slotNumber: 1 | 2
): SeoEngineArticleJob | null {
  const state = readEngineState();
  const job = state.activeJobs?.find(j => j.id === jobId);
  if (!job) return null;

  job.assignedPublishDate = dateStr;
  job.assignedSlotTime = slotTime;
  job.publicationScheduledAt = slotTime;

  if (job.pinterestPins && job.pinterestPins.length >= 2) {
    if (slotNumber === 1) {
      job.pinterestPins[0].assignedSlotTime = '09:00';
      job.pinterestPins[0].scheduledTime = '09:00';
      job.pinterestPins[1].assignedSlotTime = '13:00';
      job.pinterestPins[1].scheduledTime = '13:00';
    } else {
      job.pinterestPins[0].assignedSlotTime = '17:00';
      job.pinterestPins[0].scheduledTime = '17:00';
      job.pinterestPins[1].assignedSlotTime = '21:00';
      job.pinterestPins[1].scheduledTime = '21:00';
    }
  }

  job.logs.push({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `[AssetRecovery] Assigned recovered job to Article Slot ${slotNumber} (${slotTime} on ${dateStr}). Pinterest Pins assigned to ${slotNumber === 1 ? '09:00 & 13:00' : '17:00 & 21:00'}.`,
  });

  writeEngineState(state);
  return job;
}

