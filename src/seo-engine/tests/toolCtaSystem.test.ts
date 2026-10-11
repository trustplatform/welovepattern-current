/**
 * Deterministic Test Suite for Tool-Specific CTA & Semantic Validation System
 * 
 * STRICT COMPLIANCE:
 * - 0 OpenAI API calls
 * - 0 Higgsfield calls
 * - 0 image generations
 * - 0 file data modifications
 */

import { TOOLS_DATA, getToolBySlug, getToolByUrl } from '../../data/toolsData';
import { buildToolCtaHtml, injectToolCta, hasToolCta, injectInternalLinks } from '../generation/internalLinkInjector';
import { validateToolGuideRequirements } from '../validation/productionQualityGates';
import { DiscoveredTopic, FactualResearchPacket, ToolItem } from '../types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: any) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (errorDetail) console.error('    Details:', errorDetail);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log('\n==================================================');
console.log('RUNNING TOOL CTA & SEMANTIC VALIDATION TEST SUITE');
console.log('==================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Tool Registry & Metadata Integrity
// ----------------------------------------------------
console.log('GROUP 1: Tool Registry & Metadata Integrity');

assert(TOOLS_DATA.length >= 19, `Tools registry contains all 19+ tools (Found: ${TOOLS_DATA.length})`);

for (const tool of TOOLS_DATA) {
  assert(
    typeof tool.actionType === 'string' && tool.actionType.length > 0,
    `Tool "${tool.slug}" has required actionType ("${tool.actionType}")`
  );
  assert(
    typeof tool.actionLabel === 'string' && tool.actionLabel.length > 0,
    `Tool "${tool.slug}" has required actionLabel ("${tool.actionLabel}")`
  );
  assert(
    typeof tool.actionVerb === 'string' && tool.actionVerb.length > 0,
    `Tool "${tool.slug}" has required actionVerb ("${tool.actionVerb}")`
  );
}

// Check helper lookups
const yarnCalc = getToolBySlug('yarn-calculator');
assert(yarnCalc !== undefined && yarnCalc.slug === 'yarn-calculator', 'getToolBySlug("yarn-calculator") resolves correctly');
assert(getToolByUrl('/tools/yarn-calculator')?.slug === 'yarn-calculator', 'getToolByUrl("/tools/yarn-calculator") resolves correctly');
assert(getToolBySlug('gauge-calculator')?.actionLabel === "Let's Calculate Gauge →", 'Gauge Calculator actionLabel matches approved metadata');
assert(getToolBySlug('yarn-weight-converter')?.actionLabel === "Let's Convert Yarn Weights →", 'Yarn Weight Converter actionLabel matches approved metadata');
assert(getToolBySlug('stitch-counter')?.actionLabel === "Start Counting Stitches →", 'Stitch Counter actionLabel matches approved metadata');

// ----------------------------------------------------
// TEST GROUP 2: CTA Generation & Deterministic HTML
// ----------------------------------------------------
console.log('\nGROUP 2: Tool-Specific CTA Generation');

const yarnCalcTool = getToolBySlug('yarn-calculator')!;
const yarnCalcHtml = buildToolCtaHtml(yarnCalcTool);
assert(yarnCalcHtml.includes('/tools/yarn-calculator'), 'Yarn Calculator CTA contains canonical route /tools/yarn-calculator');
assert(yarnCalcHtml.includes("Let's Calculate Yarn →"), 'Yarn Calculator CTA contains tool-specific action label "Let\'s Calculate Yarn →"');
assert(yarnCalcHtml.includes('Interactive WeLovePattern Tool'), 'Yarn Calculator CTA contains WeLovePattern badge');
assert(yarnCalcHtml.includes('Yarn Calculator'), 'Yarn Calculator CTA contains tool title');

const yarnWeightTool = getToolBySlug('yarn-weight-converter')!;
const yarnWeightHtml = buildToolCtaHtml(yarnWeightTool);
assert(yarnWeightHtml.includes('/tools/yarn-weight-converter'), 'Yarn Weight Converter CTA contains canonical route /tools/yarn-weight-converter');
assert(yarnWeightHtml.includes("Let's Convert Yarn Weights →"), 'Yarn Weight Converter CTA contains "Let\'s Convert Yarn Weights →"');

const stitchCounterTool = getToolBySlug('stitch-counter')!;
const stitchCounterHtml = buildToolCtaHtml(stitchCounterTool);
assert(stitchCounterHtml.includes('/tools/stitch-counter'), 'Stitch Counter CTA contains canonical route /tools/stitch-counter');
assert(stitchCounterHtml.includes('Start Counting Stitches →'), 'Stitch Counter CTA contains "Start Counting Stitches →"');

// ----------------------------------------------------
// TEST GROUP 3: Idempotency & Insertion Logic
// ----------------------------------------------------
console.log('\nGROUP 3: CTA Idempotency & Insertion Positioning');

const baseArticleHtml = `
<h2>How to Estimate Yarn for Your Blanket</h2>
<p>Estimating yarn requires understanding gauge swatches and blanket dimensions.</p>
<h2>Step-by-Step Swatch Calculation</h2>
<p>Measure your swatch to calculate total yardage accurately.</p>
<h2>Frequently Asked Questions</h2>
<h3>How much buffer should I add?</h3>
<p>Always add a 10% to 15% safety buffer for borders and weaving in ends.</p>
`;

const injectedFirstPass = injectToolCta(baseArticleHtml, yarnCalcTool);
assert(hasToolCta(injectedFirstPass, 'yarn-calculator'), 'First pass injects tool CTA');
assert(injectedFirstPass.includes('welovepattern-tool-cta'), 'HTML contains welovepattern-tool-cta class');

// Position verification: should be placed BEFORE Frequently Asked Questions
const faqIndex = injectedFirstPass.indexOf('<h2>Frequently Asked Questions</h2>');
const ctaIndex = injectedFirstPass.indexOf('welovepattern-tool-cta');
assert(ctaIndex !== -1 && ctaIndex < faqIndex, 'Tool CTA is placed naturally BEFORE FAQ section');

// Idempotency check: running injectToolCta again should not add a second CTA box
const injectedSecondPass = injectToolCta(injectedFirstPass, yarnCalcTool);
assert(injectedSecondPass === injectedFirstPass, 'injectToolCta is strictly idempotent (identical string returned on duplicate call)');

const ctaOccurrences = (injectedSecondPass.match(/welovepattern-tool-cta/g) || []).length;
assert(ctaOccurrences === 1, `Exactly 1 CTA block exists after re-injection (Found: ${ctaOccurrences})`);

// ----------------------------------------------------
// TEST GROUP 4: trending_crochet Isolation
// ----------------------------------------------------
console.log('\nGROUP 4: trending_crochet Isolation');

const trendArticleHtml = `
<h2>How to Crochet a Classic Bucket Hat</h2>
<p>This beginner-friendly guide walks through crocheting a ribbed bucket hat.</p>
<h2>Materials and Hook Sizes</h2>
<p>Use worsted weight yarn with a 5.0 mm hook.</p>
<h2>Frequently Asked Questions</h2>
<p>FAQ answers here.</p>
`;

const trendInjection = injectInternalLinks(trendArticleHtml, [
  { anchorText: 'worsted weight yarn', url: '/category/accessories', entityType: 'category' }
], {
  contentType: 'trending_crochet',
  currentArticleSlug: 'crochet-bucket-hat-guide'
});

assert(!hasToolCta(trendInjection.html), 'trending_crochet article NEVER receives a tool CTA box');
assert(!trendInjection.html.includes('welovepattern-tool-cta'), 'No tool CTA class in trending_crochet');

// ----------------------------------------------------
// TEST GROUP 5: Tool Guide Production Quality Gate Validation
// ----------------------------------------------------
console.log('\nGROUP 5: Semantic Tool Guide Validation');

const validTopic: DiscoveredTopic = {
  id: 'topic_yarn_calc',
  keyword: 'calculate yarn for crochet blanket',
  contentType: 'tool_guide',
  category: 'tools',
  opportunityScore: 90,
  toolSlug: 'yarn-calculator',
  targetToolUrl: '/tools/yarn-calculator',
  status: 'writing'
};

const fullValidArticleHtml = `
<h2>How to Calculate Yarn for a Crochet Blanket</h2>
<p>Calculating yarn accurately prevents running out mid-project. Using the WeLovePattern Yarn Calculator simplifies project planning.</p>
<h2>Manual Swatch Calculation Formula</h2>
<p>To calculate your yardage manually, measure a 4x4 inch gauge swatch.</p>
${buildToolCtaHtml(yarnCalcTool)}
<h2>Frequently Asked Questions</h2>
<h3>Why calculate before starting?</h3>
<p>Accurate estimation prevents dye lot mismatch issues.</p>
`;

const validValidation = validateToolGuideRequirements(fullValidArticleHtml, validTopic);
assert(validValidation.isValid, 'Valid tool guide article passes all tool requirements');
assert(validValidation.errors.length === 0, 'Zero errors on valid tool guide');

// Negative Test 1: Missing tool link
const missingLinkHtml = fullValidArticleHtml.replace(/href="\/tools\/yarn-calculator"/g, 'href="/other-page"');
const missingLinkValidation = validateToolGuideRequirements(missingLinkHtml, validTopic);
assert(!missingLinkValidation.isValid, 'Missing tool URL is rejected');
assert(missingLinkValidation.errors.some(e => e.includes('Missing required tool link')), 'Explicit error reported for missing tool link');

// Negative Test 2: Missing CTA box
const missingCtaHtml = `
<h2>How to Calculate Yarn for a Crochet Blanket</h2>
<p>You can use the WeLovePattern Yarn Calculator at <a href="/tools/yarn-calculator">Yarn Calculator</a>.</p>
<h2>Calculation Steps</h2>
<p>Steps here.</p>
`;
const missingCtaValidation = validateToolGuideRequirements(missingCtaHtml, validTopic);
assert(!missingCtaValidation.isValid, 'Missing dedicated CTA box is rejected');
assert(missingCtaValidation.errors.some(e => e.includes('Missing required WeLovePattern Tool CTA')), 'Explicit error reported for missing CTA component');

// Negative Test 3: Missing tool identity mention
const missingIdentityHtml = `
<h2>How to Estimate Yardage</h2>
<p>Here are some craft steps and <a href="/tools/yarn-calculator">link</a>.</p>
${buildToolCtaHtml(yarnCalcTool).replace(/Yarn Calculator/g, 'Generic Tool')}
`;
const missingIdentityValidation = validateToolGuideRequirements(missingIdentityHtml, validTopic);
assert(!missingIdentityValidation.isValid, 'Missing tool identity name is rejected');
assert(missingIdentityValidation.errors.some(e => e.includes('explicitly mention the tool identity')), 'Explicit error reported for missing tool identity');

// ----------------------------------------------------
// TEST GROUP 6: Future-Proof Semantic Action Validation
// ----------------------------------------------------
console.log('\nGROUP 6: Future-Proof Semantic Action Validation');

// Modifying actionLabel wording (e.g. "Calculate Your Blanket Yarn Now →")
// MUST NOT break validation as long as tool, URL, actionType ('calculator'), and semantic actions match.
const customActionCtaHtml = buildToolCtaHtml(yarnCalcTool).replace(
  "Let's Calculate Yarn →",
  "Calculate Your Blanket Yarn Now →"
);

const customActionArticleHtml = `
<h2>How to Calculate Yarn for a Crochet Blanket</h2>
<p>Calculating yarn accurately is easy with the WeLovePattern Yarn Calculator.</p>
<h2>Manual Calculation Steps</h2>
<p>Calculate your swatch yardage to get your total estimate.</p>
${customActionCtaHtml}
<h2>Frequently Asked Questions</h2>
<p>FAQ answers here.</p>
`;

const futureProofValidation = validateToolGuideRequirements(customActionArticleHtml, validTopic);
assert(
  futureProofValidation.isValid,
  'Changing actionLabel wording does NOT invalidate article when tool, URL, and action semantics remain valid'
);

console.log(`\n==================================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`==================================================\n`);
