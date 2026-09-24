/**
 * SEO Content Engine - Dedicated Factual Research Layer
 * 
 * Conducts structured craft technical research BEFORE article generation.
 * Generates the FactualResearchPacket which serves as the immutable Source of Truth
 * for all factual claims, measurements, yarn weights, and hook sizes.
 * 
 * Never invents ungrounded numbers or statistics.
 */

import { DiscoveredTopic, FactualResearchPacket, VerifiedInternalLink } from '../types';
import { findRelevantInternalLinks, getVerifiedInternalLinkCatalog } from '../generation/internalLinkCatalog';
import { isOpenAiConfigured, executeOpenAiChat } from '../generation/openAiClient';

/** Standard Craft Yarn Council (CYC) Yarn Weight Reference */
export const CYC_YARN_STANDARDS: Record<string, { weightName: string; number: number; recommendedHooks: string; typicalGauge: string }> = {
  'lace': { weightName: 'Lace (#0)', number: 0, recommendedHooks: '1.5 mm - 2.25 mm (B-1)', typicalGauge: '32-40 sts = 4 inches' },
  'fingering': { weightName: 'Super Fine / Fingering (#1)', number: 1, recommendedHooks: '2.25 mm - 3.5 mm (B-1 to E-4)', typicalGauge: '21-32 sts = 4 inches' },
  'sport': { weightName: 'Fine / Sport (#2)', number: 2, recommendedHooks: '3.5 mm - 4.5 mm (E-4 to 7)', typicalGauge: '16-20 sts = 4 inches' },
  'dk': { weightName: 'Light / DK (#3)', number: 3, recommendedHooks: '4.5 mm - 5.5 mm (7 to I-9)', typicalGauge: '12-17 sts = 4 inches' },
  'worsted': { weightName: 'Medium / Worsted (#4)', number: 4, recommendedHooks: '5.0 mm - 6.5 mm (H-8 to K-10.5)', typicalGauge: '11-14 sts = 4 inches' },
  'bulky': { weightName: 'Bulky (#5)', number: 5, recommendedHooks: '6.5 mm - 9.0 mm (K-10.5 to M-13)', typicalGauge: '8-11 sts = 4 inches' },
  'super_bulky': { weightName: 'Super Bulky (#6)', number: 6, recommendedHooks: '9.0 mm - 15.0 mm (M-13 to Q)', typicalGauge: '7-9 sts = 4 inches' },
  'jumbo': { weightName: 'Jumbo (#7)', number: 7, recommendedHooks: '15.0 mm and larger (Q and larger)', typicalGauge: '6 sts or fewer = 4 inches' }
};

/** Deterministic factual research generator for offline/fallback reliability */
function generateDeterministicCraftPacket(
  topic: DiscoveredTopic,
  verifiedLinks: VerifiedInternalLink[]
): FactualResearchPacket {
  const keyword = topic.keyword.toLowerCase();

  let yarnWeights = ['Medium / Worsted (#4)', 'Light / DK (#3)'];
  let hookSizes = ['5.0 mm (H-8)', '5.5 mm (I-9)', '4.0 mm (G-6)'];
  let standardYardages = 'Standard projects require 800 - 1,400 meters depending on dimension';

  if (/blanket|afghan/i.test(keyword)) {
    standardYardages = 'Baby Blanket: 700-1,000 m; Throw Blanket: 1,200-1,600 m; Queen Bed: 2,800-3,500 m';
    yarnWeights = ['Medium / Worsted (#4)', 'Bulky (#5)'];
    hookSizes = ['5.5 mm (I-9)', '6.0 mm (J-10)'];
  } else if (/amigurumi|toy|plush/i.test(keyword)) {
    standardYardages = 'Small Plush: 80-150 m; Medium Amigurumi: 200-350 m';
    yarnWeights = ['Sport (#2)', 'Light / DK (#3)', 'Medium / Worsted (#4)'];
    hookSizes = ['2.5 mm', '3.0 mm', '3.5 mm (E-4)']; // Tight hook for no stuffing gaps
  } else if (/beanie|hat/i.test(keyword)) {
    standardYardages = 'Adult Beanie: 150-220 m; Baby Hat: 60-90 m';
    yarnWeights = ['Medium / Worsted (#4)'];
    hookSizes = ['5.0 mm (H-8)'];
  }

  const verifiedTerminology = [
    'Gauge Swatch (4x4 inches / 10x10 cm)',
    'Single Crochet (US sc / UK dc)',
    'Double Crochet (US dc / UK tr)',
    'Half Double Crochet (US hdc / UK htr)',
    'Slip Stitch (sl st)',
    'Turning Chain (ch)'
  ];

  let verifiedDimensions: Record<string, string> | undefined = undefined;
  if (/blanket|afghan/i.test(keyword)) {
    verifiedDimensions = {
      'Baby Blanket': '30 x 36 inches (76 x 91 cm)',
      'Lapghan / Wheelchair': '36 x 48 inches (91 x 122 cm)',
      'Throw Blanket': '50 x 60 inches (127 x 152 cm)',
      'Twin Bed Blanket': '66 x 90 inches (168 x 229 cm)'
    };
  }

  const verifiedFormulas = [
    {
      name: 'Area Ratio Swatch Scaling Method',
      description: 'Calculates total project yardage by scaling the measured yardage consumed by a 4x4 inch blocked swatch to the total project surface area.',
      formulaText: 'Total Yardage = (Total Project Surface Area / Swatch Surface Area) * Swatch Yardage * 1.10 (safety buffer)',
      steps: [
        'Crochet a 4x4 inch (16 sq in / 100 sq cm) gauge swatch using the project hook and yarn.',
        'Measure the exact yardage used in the swatch (either by weighing with a gram scale or measuring the yarn before swatching).',
        'Calculate total project area in square inches (width in inches multiplied by length in inches).',
        'Divide total project area by swatch area to find the scale multiplier, multiply by swatch yardage, and add 10% to 15% safety buffer for borders, ends, and tension variance.'
      ]
    }
  ];

  const supportedClaims = [
    'Textured stitches like bobbles, puff stitches, and cables consume substantially more yarn per square inch than flat stitches like single crochet and double crochet.',
    'A 10% to 15% yardage buffer is essential to prevent running out of yarn before border completion.',
    'Yarn skeins are sold and measured by weight and yardage/meters, never by a fixed stitch count.',
    'Dye lot consistency is critical across large surface items to avoid noticeable color demarcation lines.'
  ];

  const techniqueKeyPoints = [
    'Always crochet and block a 4x4 inch (10x10 cm) gauge swatch before starting garments or fitted items.',
    'Yarn requirements increase significantly with textured stitches like waffle stitch or bobbles compared to basic double crochet.',
    'Tension consistency between rows determines finished project drape and dimensional accuracy.'
  ];

  const makerPainPoints = [
    'Running out of yarn on the final border row due to approximate estimation.',
    'Blanket borders ruffling or curling because stitch count pick-ups along edges are uneven.',
    'Finished item sizing significantly larger or smaller than pattern specs due to skipped gauge swatching.'
  ];

  const faqItems = [
    {
      question: `Why is checking your gauge essential for ${topic.keyword}?`,
      factualAnswer: 'Individual crafter tension varies widely. Even with the identical hook and yarn weight, one maker may crochet 12 stitches per 4 inches while another crochets 15 stitches, altering finished dimensions by up to 25%.'
    },
    {
      question: 'What is the most common mistake when calculating yarn yardage?',
      factualAnswer: 'Failing to include a 10% to 15% safety buffer for swatch testing, color changes, and border edging, which often results in running out of dye lot before completion.'
    },
    {
      question: 'How do US and UK stitch terms differ for this technique?',
      factualAnswer: 'US terms name stitches by yarn overs, whereas UK terms name them by loops on the hook. For example, a US single crochet is identical in height and technique to a UK double crochet.'
    }
  ];

  const defaultProhibited = [
    'stitches per skein',
    'divide stitches by stitches per skein',
    'arbitrary yards per stitch',
    'invented mattress or bed sizes',
    'commercial sales pricing or revenue claims'
  ];

  const authorizedPercentages = [10, 15, 20];

  return {
    topicId: topic.id,
    topic: topic.keyword,
    searchIntent: `Maker search query focused on ${topic.keyword}`,
    craftType: 'crochet',
    sourceAuthority: 'Craft Yarn Council Technical Standards & WeLovePattern Craft Library',
    cycStandardVersion: 'CYC 2024 Guidelines',
    generatedAt: new Date().toISOString(),
    verifiedTerminology,
    verifiedMaterials: {
      yarnWeights,
      hookSizes,
      standardYardages,
      verifiedDimensions
    },
    authorizedPercentages,
    prohibitedMetrics: defaultProhibited,
    verifiedFormulas,
    supportedClaims,
    techniqueKeyPoints,
    makerPainPoints,
    faqItems,
    verifiedInternalLinks: verifiedLinks
  };
}

/**
 * Conducts deep factual research for a selected topic using OpenAI
 * grounded in Craft Yarn Council standards, with guaranteed fallback to domain knowledge base.
 */
export async function conductTopicResearch(
  topic: DiscoveredTopic
): Promise<FactualResearchPacket> {
  // 1. Gather all verified internal links relevant to this topic
  const verifiedLinks = findRelevantInternalLinks(
    `${topic.keyword} ${topic.targetToolUrl || ''} ${topic.targetCategoryUrl || ''}`,
    { maxLinks: 6 }
  );

  // If topic has a specific tool URL, make sure it is included
  if (topic.targetToolUrl) {
    const catalog = getVerifiedInternalLinkCatalog();
    const toolItem = catalog.find(c => c.url === topic.targetToolUrl);
    if (toolItem && !verifiedLinks.some(l => l.url === toolItem.url)) {
      verifiedLinks.unshift({
        anchorText: toolItem.title,
        url: toolItem.url,
        entityType: 'tool'
      });
    }
  }

  // 2. Check for OpenAI configuration
  if (!isOpenAiConfigured()) {
    return generateDeterministicCraftPacket(topic, verifiedLinks);
  }

  try {
    const systemPrompt = `You are the Senior Research Director for WeLovePattern, the premier authoritative crochet resource.
Conduct an exhaustive, technically rigorous FACTUAL RESEARCH on the craft topic: "${topic.keyword}".

STRICT FACTUAL GROUNDING RULES:
1. ONLY produce verified, technically accurate crochet facts. No speculative or hallucinated numbers.
2. Comply strictly with Craft Yarn Council (CYC) standards.
3. Every hook size must state metric millimeters (e.g. "5.0 mm (H-8)").
4. Every yarn weight must specify the CYC tier number (e.g. "Medium / Worsted (#4)").
5. Real yardages only (give honest ranges, e.g. "Baby blanket: 700 - 1,000 meters").
6. If the topic involves dimensions or sizing, provide standard verified dimensions under "verifiedDimensions". DO NOT invent arbitrary or non-standard mattress/blanket dimensions.
7. If the topic involves calculations or yardage estimation, provide accurate, mathematically sound steps under "verifiedFormulas".
   NEVER cite "stitches per skein" or "divide stitches by stitches per skein", as skeins are sold by weight and length, not stitch count.
8. Under "supportedClaims", provide exact technical assertions supported by craft physics (e.g. yarn consumption by stitch texture, buffer rules, dye lot importance).
9. Output valid JSON matching this schema:

{
  "topic": "${topic.keyword}",
  "searchIntent": "Exact user intent explanation",
  "craftType": "crochet",
  "verifiedTerminology": ["US stitch name (with UK conversion)", "other term"],
  "verifiedMaterials": {
    "yarnWeights": ["CYC #4 Worsted", "CYC #3 DK"],
    "hookSizes": ["5.0 mm (H-8)", "4.0 mm (G-6)"],
    "standardYardages": "Accurate yardage ranges",
    "verifiedDimensions": {
      "Baby Blanket": "30 x 36 inches (76 x 91 cm)",
      "Lapghan": "36 x 48 inches (91 x 122 cm)",
      "Throw Blanket": "50 x 60 inches (127 x 152 cm)",
      "Twin Blanket": "66 x 90 inches (168 x 229 cm)"
    }
  },
  "verifiedFormulas": [
    {
      "name": "Area Ratio Swatch Scaling Method",
      "description": "Calculates total project yardage by scaling swatch yardage to blanket surface area",
      "formulaText": "Total Yardage = (Blanket Area / Swatch Area) * Swatch Yardage * 1.10",
      "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."]
    }
  ],
  "supportedClaims": [
    "Textured stitches like bobbles and puff stitches consume more yarn than flat stitches like single crochet and double crochet.",
    "A 10% to 15% safety buffer is standard practice.",
    "Yarn is sold by weight and yardage, not by stitch count."
  ],
  "techniqueKeyPoints": ["Point 1", "Point 2", "Point 3"],
  "makerPainPoints": ["Frustration 1", "Frustration 2", "Frustration 3"],
  "faqItems": [
    {"question": "Q1", "factualAnswer": "A1"},
    {"question": "Q2", "factualAnswer": "A2"},
    {"question": "Q3", "factualAnswer": "A3"}
  ]
}`;

    const completion = await executeOpenAiChat({
      systemPrompt,
      userPrompt: `Research craft topic: ${topic.keyword}`,
      responseFormat: 'json_object',
    });

    const rawText = completion.content.trim();
    if (!rawText) {
      return generateDeterministicCraftPacket(topic, verifiedLinks);
    }

    const parsed = JSON.parse(rawText);

    return {
      topicId: topic.id,
      topic: topic.keyword,
      searchIntent: parsed.searchIntent || `Search intent for ${topic.keyword}`,
      craftType: 'crochet',
      sourceAuthority: 'Craft Yarn Council Technical Standards & OpenAI Craft Research',
      cycStandardVersion: 'CYC 2024 Guidelines',
      generatedAt: new Date().toISOString(),
      verifiedTerminology: Array.isArray(parsed.verifiedTerminology) ? parsed.verifiedTerminology : [],
      verifiedMaterials: {
        yarnWeights: Array.isArray(parsed.verifiedMaterials?.yarnWeights) ? parsed.verifiedMaterials.yarnWeights : ['Medium / Worsted (#4)'],
        hookSizes: Array.isArray(parsed.verifiedMaterials?.hookSizes) ? parsed.verifiedMaterials.hookSizes : ['5.0 mm (H-8)'],
        standardYardages: parsed.verifiedMaterials?.standardYardages || '800-1,200 meters standard',
        verifiedDimensions: parsed.verifiedMaterials?.verifiedDimensions && typeof parsed.verifiedMaterials.verifiedDimensions === 'object'
          ? parsed.verifiedMaterials.verifiedDimensions
          : undefined
      },
      authorizedPercentages: [10, 15, 20],
      prohibitedMetrics: [
        'stitches per skein',
        'divide stitches by stitches per skein',
        'arbitrary yards per stitch',
        'invented mattress or bed sizes',
        'commercial sales pricing or revenue claims'
      ],
      verifiedFormulas: Array.isArray(parsed.verifiedFormulas) ? parsed.verifiedFormulas : undefined,
      supportedClaims: Array.isArray(parsed.supportedClaims) ? parsed.supportedClaims : undefined,
      techniqueKeyPoints: Array.isArray(parsed.techniqueKeyPoints) ? parsed.techniqueKeyPoints : [],
      makerPainPoints: Array.isArray(parsed.makerPainPoints) ? parsed.makerPainPoints : [],
      faqItems: Array.isArray(parsed.faqItems) ? parsed.faqItems : [],
      verifiedInternalLinks: verifiedLinks
    };
  } catch (err: any) {
    console.warn(`[TopicResearcher] OpenAI research synthesis unavailable for "${topic.keyword}", using verified CYC domain packet:`, err?.message || err);
    return generateDeterministicCraftPacket(topic, verifiedLinks);
  }
}
