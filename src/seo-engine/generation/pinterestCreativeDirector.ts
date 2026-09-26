/**
 * SEO Content Engine - Pinterest Creative Intelligence Director
 * 
 * DIRECT HIGGSFIELD PINTEREST ARTWORK ARCHITECTURE:
 * - Generates complete, content-aware Pinterest Pin concepts directly with Higgsfield (Marketing Studio Image 2.0 Alpha, 2:3).
 * - Zero local canvas/SVG compositing after Higgsfield.
 * - Higgsfield is given full creative authority over photography, composition, embedded typography, headline, and action CTA.
 * 
 * CORE CREATIVE PRINCIPLES:
 * 1. TOPIC-ADAPTIVE VISUAL CONCEPTS: No rigid, repetitive templates. Dynamically chooses the most compelling
 *    visual format for the topic, search intent, and Pinterest user behavior (e.g., organic editorial collage,
 *    lifestyle with real person, hands-making, close-up craftsmanship, project flat lay, seasonal scene).
 * 2. GENUINE PIN 1 VS PIN 2 DIVERSITY: For every article, Pin 1 and Pin 2 are assigned complementary,
 *    genuinely distinct visual concepts and angles (e.g., Pin 1: multi-project editorial collage vs Pin 2: cozy lifestyle).
 * 3. STRICT TITLE / CTA VISUAL SEPARATION: Headline and action CTA must always occupy separate, dedicated
 *    visual zones with generous breathing room across the photograph.
 * 4. ONE STRONG HEADLINE — ZERO SUBTITLES: No subtitles, secondary descriptive lines, explanatory copy, or bullet points.
 * 5. TRAFFIC-ORIENTED ACTION CTA: Every Pin features ONE clear, prominent action CTA (e.g., "SEE ALL 12 IDEAS →",
 *    "CALCULATE YOUR YARN FREE →") designed with pure editorial typography and natural craft styling (NOT SaaS UI buttons, pills, cards, or badges).
 * 6. TOPIC-AWARE PALETTES & TEXTURES: Colors, borders, textures, and typography adapt to craft, season, and subject.
 */

import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept, PinterestTypographyOverlay } from '../types';
import { GeneratedArticle } from './openAiArticleGenerator';
import { fetchPinterestBoards, NormalizedPinterestBoard } from '../../pinterest/pinterestApi';

export interface BoardResolutionResult {
  success: boolean;
  board?: NormalizedPinterestBoard;
  confidenceScore: number;                  // 0 to 100
  matchType: 'exact' | 'semantic' | 'fallback' | 'none';
  requiresOperatorDecision: boolean;
  reason: string;
  candidateBoards?: { board: NormalizedPinterestBoard; score: number }[];
  isTestFallback?: boolean;
}

export interface BoardResolutionOptions {
  allowTestFallback?: boolean;
}

/** Known craft boards catalog used for offline matching and test-safe fallback */
export const DEFAULT_KNOWN_CRAFT_BOARDS: NormalizedPinterestBoard[] = [
  { id: 'board_blankets', name: 'Crochet Blankets & Afghans' },
  { id: 'board_tutorials', name: 'Crochet Tutorials & Stitches' },
  { id: 'board_tools', name: 'Crochet Tools & Yarn Calculators' },
  { id: 'board_flowers', name: 'Crochet Flowers & Motifs' },
  { id: 'board_amigurumi', name: 'Crochet Amigurumi & Toys' },
  { id: 'board_baby', name: 'Crochet Baby Patterns & Gifts' },
  { id: 'board_clothing', name: 'Crochet Clothing & Wearables' },
  { id: 'board_accessories', name: 'Crochet Bags & Accessories' },
  { id: 'board_decor', name: 'Crochet Home Decor' },
];

/** Semantic synonyms for craft project categories */
const CRAFT_SEMANTIC_TAXONOMY: Record<string, string[]> = {
  blankets: ['blanket', 'blankets', 'afghan', 'afghans', 'throw', 'throws', 'lapghan', 'bedspread', 'granny square'],
  tools: ['tool', 'tools', 'calculator', 'calculators', 'guide', 'guides', 'gauge', 'chart', 'convert', 'yardage', 'tips'],
  flowers: ['flower', 'flowers', 'rose', 'roses', 'floral', 'applique', 'motifs', 'botanical'],
  amigurumi: ['amigurumi', 'toy', 'toys', 'plush', 'plushie', 'doll', 'animal', 'creature', 'stuffed'],
  baby: ['baby', 'infant', 'toddler', 'nursery', 'bootie', 'booties', 'layette', 'baby blanket'],
  clothing: ['sweater', 'cardigan', 'top', 'crop top', 'garment', 'wearable', 'vest', 'pullover'],
  accessories: ['hat', 'beanie', 'scarf', 'shawl', 'cowl', 'headband', 'mittens', 'gloves', 'tote', 'bag'],
  stitches: ['stitch', 'stitches', 'tutorial', 'technique', 'how-to', 'step-by-step', 'beginner', 'learn'],
  decor: ['home decor', 'pillow', 'cushion', 'potholder', 'coaster', 'rug', 'basket'],
};

/**
 * Topic Aesthetic Theme Definition
 */
export interface AestheticTheme {
  themeName: string;
  paletteDescription: string;
  ctaVisualTreatment: string;
  lightingAndMood: string;
}

/**
 * Supported Visual Formats for Pinterest Creative Generation
 */
export type PinterestVisualFormat =
  | 'single_hero_editorial'     // One striking focal handmade craft photograph in lifestyle setting
  | 'editorial_collage'          // 3-5 related crochet ideas organically grouped (NOT a Canva grid)
  | 'lifestyle_person'           // Real woman wearing/using the crochet item in authentic environment
  | 'hands_crafting'             // Maker hands actively crocheting with wooden hooks and textured yarn
  | 'closeup_craftsmanship'      // Macro detail of stitch definition, tension, and yarn texture
  | 'flatlay_projects'           // Overhead flat lay of multiple finished projects and maker tools
  | 'seasonal_scene'             // Atmospheric seasonal environment (e.g. autumn porch or candlelit table)
  | 'multi_project_showcase';    // Curated display of multiple finished handmade items together

/**
 * Derives a rich, topic-specific aesthetic theme, color palette, and CTA visual styling.
 */
export function analyzeTopicAesthetic(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): AestheticTheme {
  const textCorpus = `${topic.keyword} ${article.title} ${article.category || ''} ${packet.craftType || ''}`.toLowerCase();

  // 1. Seasonal / Holiday Themes
  if (/halloween|autumn|fall|pumpkin|spooky|october/i.test(textCorpus)) {
    return {
      themeName: 'Autumn Warmth',
      paletteDescription: 'Warm terracotta, burnt pumpkin orange, deep espresso, and antique linen',
      ctaVisualTreatment: 'warm terracotta and burnt pumpkin organic pigment wash with crisp cream editorial typography',
      lightingAndMood: 'Warm golden autumn afternoon sunlight, cozy harvest textures',
    };
  }

  if (/christmas|holiday|winter|snow|festive|ornament|tree/i.test(textCorpus)) {
    return {
      themeName: 'Festive Botanical',
      paletteDescription: 'Deep forest pine green, cranberry red, winter cream, and warm brass',
      ctaVisualTreatment: 'deep forest pine and winter cream textured paper wash with crisp high-contrast typography',
      lightingAndMood: 'Soft ambient winter morning light, cozy festive ambiance',
    };
  }

  if (/flower|floral|spring|rose|botanical|bloom|garden/i.test(textCorpus)) {
    return {
      themeName: 'Delicate Botanical',
      paletteDescription: 'Soft dusty rose, sage leaf green, warm biscuit, and gentle cream',
      ctaVisualTreatment: 'soft sage leaf and gentle ecru watercolor brush wash with elegant refined typography',
      lightingAndMood: 'Bright, airy spring window light with soft botanical shadows',
    };
  }

  if (/summer|beach|sun|coastal|cotton|light/i.test(textCorpus)) {
    return {
      themeName: 'Fresh Coastal Artisan',
      paletteDescription: 'Warm sand, sunlit ochre, light canvas ecru, and soft seafoam',
      ctaVisualTreatment: 'sunlit ochre and warm canvas texture with high-readability typography',
      lightingAndMood: 'Breezy sunlit craft studio, crisp natural daylight',
    };
  }

  // 2. Format / Category Themes
  if (topic.targetContentFormat === 'tool_focus' || /calculator|gauge|yardage|chart|size|converter/i.test(textCorpus)) {
    return {
      themeName: 'Modern Maker Studio',
      paletteDescription: 'Natural oatmeal, warm terracotta, slate charcoal, and creamy linen',
      ctaVisualTreatment: 'warm terracotta and oatmeal textured wash with sharp editorial legibility',
      lightingAndMood: 'Clean diffused overhead daylight, pristine maker workspace layout',
    };
  }

  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|beginner|tutorial/i.test(textCorpus)) {
    return {
      themeName: 'Calm Studio Craft',
      paletteDescription: 'Soft sage green, warm stone, natural unbleached wool, and muted caramel',
      ctaVisualTreatment: 'soft sage green and ivory artisan paper texture with refined typography',
      lightingAndMood: 'Soft side-lit studio lighting highlighting textured stitch definition',
    };
  }

  if (/amigurumi|toy|doll|plush/i.test(textCorpus)) {
    return {
      themeName: 'Playful Artisan',
      paletteDescription: 'Warm buttercup, dusty pastel peach, soft linen, and cocoa',
      ctaVisualTreatment: 'warm honey-gold and dark cocoa organic wash with clear readability',
      lightingAndMood: 'Cheerful soft natural lighting with gentle warm tones',
    };
  }

  // 3. Default Cohesive Natural Craft Editorial
  return {
    themeName: 'Organic Craft Editorial',
    paletteDescription: 'Warm ecru, rich caramel, soft moss, and natural birch wood',
    ctaVisualTreatment: 'warm caramel and crisp linen textured wash with natural craft styling',
    lightingAndMood: 'Warm natural window light, authentic cozy maker atmosphere',
  };
}

import { TOOLS_DATA } from '../../data/toolsData';

/**
 * Returns a dedicated, highly relevant action CTA strictly mapped to the specific tool.
 * Guarantees zero cross-tool contamination (e.g. Stitch Counter never receives yarn calculator CTA).
 */
export function deriveToolSpecificCta(
  toolSlug?: string,
  toolTitle?: string
): string {
  const slug = (toolSlug || '').toLowerCase().trim();
  const title = (toolTitle || '').toLowerCase().trim();

  // 1. Counters
  if (slug === 'stitch-counter' || title.includes('stitch counter')) {
    return 'TRY STITCH COUNTER →';
  }
  if (slug === 'row-counter' || title.includes('row counter')) {
    return 'USE ROW COUNTER →';
  }
  if (slug === 'crochet-timer' || title.includes('crochet timer') || title.includes('timer')) {
    return 'TRY CROCHET TIMER →';
  }

  // 2. Trackers & Organizers
  if (slug === 'project-tracker' || title.includes('project tracker')) {
    return 'START PROJECT TRACKER →';
  }
  if (slug === 'yarn-stash-organizer' || title.includes('stash organizer')) {
    return 'ORGANIZE YARN STASH →';
  }
  if (slug === 'pattern-pdf-organizer' || title.includes('pdf organizer')) {
    return 'ORGANIZE PATTERN PDFS →';
  }
  if (slug === 'pattern-library' || title.includes('pattern library')) {
    return 'EXPLORE PATTERN LIBRARY →';
  }

  // 3. Calculators
  if (slug === 'gauge-calculator' || title.includes('gauge calculator') || title.includes('gauge swatch')) {
    return 'CALCULATE GAUGE FREE →';
  }
  if (slug === 'yarn-calculator' || title.includes('yarn calculator') || title.includes('yardage calculator')) {
    return 'CALCULATE YARN FREE →';
  }
  if (slug === 'blanket-calculator' || slug === 'blanket-size-calculator' || title.includes('blanket calculator')) {
    return 'CALCULATE BLANKET SIZE →';
  }
  if (slug === 'granny-square-calculator' || title.includes('granny square calculator')) {
    return 'CALCULATE GRANNY SQUARES →';
  }
  if (slug === 'border-calculator' || title.includes('border calculator')) {
    return 'CALCULATE BORDER STITCHES →';
  }
  if (slug === 'yarn-cost-calculator' || title.includes('yarn cost calculator')) {
    return 'CALCULATE PROJECT COST →';
  }
  if (slug === 'selling-price-calculator' || title.includes('selling price') || title.includes('craft pricing')) {
    return 'CALCULATE SELLING PRICE →';
  }

  // 4. Converters
  if (slug === 'us-uk-crochet-pattern-converter' || title.includes('us ↔ uk') || title.includes('pattern converter') || title.includes('us to uk')) {
    return 'CONVERT PATTERN TERMS →';
  }
  if (slug === 'yarn-weight-converter' || title.includes('yarn weight converter')) {
    return 'CONVERT YARN WEIGHTS →';
  }
  if (slug === 'hook-size-converter' || title.includes('hook size converter')) {
    return 'CONVERT HOOK SIZES →';
  }
  if (slug === 'needle-size-converter' || title.includes('needle size converter')) {
    return 'CONVERT NEEDLE SIZES →';
  }

  // 5. References & Checkers
  if (slug === 'yarn-substitute-finder' || title.includes('yarn substitute')) {
    return 'FIND YARN SUBSTITUTES →';
  }
  if (slug === 'pattern-difficulty-checker' || title.includes('difficulty checker') || title.includes('skill level')) {
    return 'CHECK PATTERN LEVEL →';
  }
  if (slug === 'abbreviation-dictionary' || title.includes('abbreviation') || title.includes('glossary')) {
    return 'LOOK UP ABBREVIATIONS →';
  }
  if (slug === 'granny-square-layout-planner' || title.includes('layout planner')) {
    return 'PLAN SQUARE LAYOUT →';
  }

  // Fallback for any other specific tool from catalog
  if (toolTitle) {
    const cleanTitle = toolTitle.replace(/calculator|converter|organizer|tracker|counter|planner/gi, '').trim().toUpperCase();
    if (cleanTitle.length > 0 && cleanTitle.length <= 16) {
      return `USE ${cleanTitle} TOOL →`;
    }
  }

  return 'TRY FREE CRAFT TOOL →';
}

/**
 * Validates that a generated CTA semantically matches the target tool.
 * Rejects mismatched calculation CTAs on counters/converters/organizers.
 */
export function validateToolCtaSemanticMatch(
  cta: string,
  toolSlug?: string,
  toolName?: string
): { valid: boolean; reason?: string } {
  const normalizedCta = cta.toUpperCase().trim();
  const slug = (toolSlug || '').toLowerCase().trim();
  const name = (toolName || '').toLowerCase().trim();

  // Rule 1: Counters MUST NEVER have calculation or conversion CTAs
  if (slug.includes('counter') || slug.includes('timer') || name.includes('counter') || name.includes('timer')) {
    if (/CALCULATE|ESTIMATE|CONVERT|PRICE|COST/i.test(normalizedCta)) {
      return {
        valid: false,
        reason: `Mismatched CTA: Counter tool "${slug || name}" cannot use calculation/conversion CTA "${cta}".`,
      };
    }
  }

  // Rule 2: Converters MUST NEVER have counting or yarn calculation CTAs
  if (slug.includes('converter') || name.includes('converter')) {
    if (/COUNT|CALCULATE YARN|ESTIMATE YARN|PRICE|COST/i.test(normalizedCta)) {
      return {
        valid: false,
        reason: `Mismatched CTA: Converter tool "${slug || name}" cannot use counting/yarn-cost CTA "${cta}".`,
      };
    }
  }

  // Rule 3: Organizers MUST NEVER have calculation or conversion CTAs
  if (slug.includes('organizer') || slug.includes('tracker') || slug.includes('library') || name.includes('organizer') || name.includes('tracker')) {
    if (/CALCULATE|CONVERT/i.test(normalizedCta)) {
      return {
        valid: false,
        reason: `Mismatched CTA: Organizer tool "${slug || name}" cannot use calculation/conversion CTA "${cta}".`,
      };
    }
  }

  // Rule 4: Non-yarn calculators MUST NOT claim to calculate yarn
  if (slug === 'gauge-calculator' && /CALCULATE YARN/i.test(normalizedCta)) {
    return {
      valid: false,
      reason: `Mismatched CTA: Gauge calculator cannot use yarn calculation CTA "${cta}".`,
    };
  }
  if (slug === 'selling-price-calculator' && /CALCULATE YARN/i.test(normalizedCta)) {
    return {
      valid: false,
      reason: `Mismatched CTA: Selling price calculator cannot use yarn calculation CTA "${cta}".`,
    };
  }

  return { valid: true };
}

/**
 * Extracts list count or item count if present in title (e.g. "12 Spooky Projects" -> 12).
 */
function extractListCountFromTitle(title: string): number | null {
  const match = title.match(/\b(\d{1,2})\b/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (num >= 3 && num <= 50) return num;
  }
  return null;
}

/**
 * Generates the most compelling, concise, traffic-driving action CTA for the Pin.
 * Passed as an EXACT immutable string to Higgsfield.
 */
export function buildTrafficOrientedCta(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  pinNumber: number,
  visualFormat: PinterestVisualFormat
): string {
  const title = article.title || '';
  const kw = topic.keyword || '';
  const listCount = extractListCountFromTitle(title);
  const textCorpus = `${kw} ${title} ${article.category || ''}`.toLowerCase();

  // 1. Tool Guide CTAs — Strictly bound to the actual tool identity
  const isTool = topic.contentType === 'tool_guide' || topic.targetContentFormat === 'tool_focus' || Boolean(topic.toolSlug) || /counter|calculator|converter|tracker|organizer|timer|dictionary/i.test(textCorpus);

  if (isTool) {
    let resolvedToolSlug = topic.toolSlug;
    let resolvedToolTitle = '';

    if (resolvedToolSlug) {
      const match = TOOLS_DATA.find(t => t.slug === resolvedToolSlug);
      if (match) resolvedToolTitle = match.title;
    } else {
      // Find matching tool in TOOLS_DATA by text matching
      const match = TOOLS_DATA.find(t => textCorpus.includes(t.slug) || textCorpus.includes(t.title.toLowerCase()));
      if (match) {
        resolvedToolSlug = match.slug;
        resolvedToolTitle = match.title;
      }
    }

    const toolCta = deriveToolSpecificCta(resolvedToolSlug, resolvedToolTitle);

    // Validate semantic alignment
    const validation = validateToolCtaSemanticMatch(toolCta, resolvedToolSlug, resolvedToolTitle);
    if (!validation.valid) {
      console.warn(`[PinterestCreativeDirector] Auto-correcting mismatched CTA: ${validation.reason}`);
      return deriveToolSpecificCta(resolvedToolSlug, resolvedToolTitle);
    }

    return toolCta;
  }

  // 2. Tutorials / Stitch Guides
  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|tutorial/i.test(textCorpus)) {
    return 'SEE FULL TUTORIAL →';
  }

  // 3. Idea Roundups / Pattern Collections / Seasonal Inspo (e.g. "SEE 12 IDEAS →")
  if (listCount) {
    return `SEE ${listCount} IDEAS →`;
  }

  if (/idea|ideas|project|projects|pattern|patterns|inspo|inspiration/i.test(textCorpus)) {
    return 'SEE ALL IDEAS →';
  }

  // 4. Default Craft Article CTAs
  return 'SEE ALL IDEAS →';
}

/**
 * Derives a clean, punchy primary headline for the Pin.
 * Passed as an EXACT immutable string to Higgsfield.
 */
export function buildPrimaryHeadline(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  pinNumber: number
): string {
  const kw = topic.keyword.trim();
  const title = article.title.trim();

  // If keyword is punchy (under 32 chars), use uppercase keyword as primary headline
  if (kw.length >= 8 && kw.length <= 32) {
    return kw.toUpperCase();
  }

  // For tool guides, use tool name
  if (topic.targetContentFormat === 'tool_focus' || topic.contentType === 'tool_guide' || topic.toolSlug) {
    if (topic.toolSlug) {
      const tool = TOOLS_DATA.find(t => t.slug === topic.toolSlug);
      if (tool) {
        return tool.title.toUpperCase();
      }
    }
    return 'CROCHET TOOL GUIDE';
  }

  // For tutorial guides
  if (topic.targetContentFormat === 'tutorial') {
    return 'STEP-BY-STEP CROCHET GUIDE';
  }

  // Otherwise clean, uppercase headline from main title or keyword
  const cleanedTitle = title.split(':')[0].replace(/\b\d+\s+(spooky|easy|cute|free)\b/i, '').trim();
  if (cleanedTitle.length <= 36) {
    return cleanedTitle.toUpperCase();
  }

  return kw.toUpperCase();
}

/**
 * Selects complementary, distinct visual formats for Pin 1 and Pin 2 based on topic and article intent.
 */
export function selectComplementaryVisualFormats(
  topic: DiscoveredTopic,
  article: GeneratedArticle
): { pin1Format: PinterestVisualFormat; pin2Format: PinterestVisualFormat } {
  const textCorpus = `${topic.keyword} ${article.title} ${article.category || ''} ${topic.targetContentFormat || ''}`.toLowerCase();
  const isRoundup = extractListCountFromTitle(article.title) !== null || /ideas|projects|patterns|roundup|collection|inspo/i.test(textCorpus);
  const isTool = topic.targetContentFormat === 'tool_focus' || /calculator|gauge|yardage|counter|converter/i.test(textCorpus);
  const isTutorial = topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|tutorial/i.test(textCorpus);

  if (isRoundup) {
    // Pin 1: Organic editorial collage of 3-5 distinct project ideas
    // Pin 2: Cozy lifestyle scene with real woman wearing/using a project in an authentic environment
    return {
      pin1Format: 'editorial_collage',
      pin2Format: 'lifestyle_person',
    };
  }

  if (isTool) {
    // Pin 1: Overhead flatlay of materials/tools vs Pin 2: Real maker using project
    return {
      pin1Format: 'flatlay_projects',
      pin2Format: 'lifestyle_person',
    };
  }

  if (isTutorial) {
    // Pin 1: Macro stitch detail/craftsmanship vs Pin 2: Hands actively crafting
    return {
      pin1Format: 'closeup_craftsmanship',
      pin2Format: 'hands_crafting',
    };
  }

  // General Craft / Wearable / Blanket / Amigurumi
  if (/sweater|cardigan|hat|scarf|beanie|garment|top/i.test(textCorpus)) {
    return {
      pin1Format: 'lifestyle_person',
      pin2Format: 'closeup_craftsmanship',
    };
  }

  return {
    pin1Format: 'single_hero_editorial',
    pin2Format: 'hands_crafting',
  };
}

/**
 * Builds a dedicated, dynamic Higgsfield prompt enforcing STRICT IMMUTABLE TEXT & EDITORIAL ART DIRECTION:
 * - EXACTLY TWO text elements: Headline and CTA.
 * - Headline: Elegant high-end editorial SERIF typeface (fashion magazine / luxury editorial / Pinterest editorial; sophisticated, feminine, artistic, premium; NOT heavy generic display, NOT cartoon, NOT handwriting; large visual scale).
 * - Text Background: Organic painted brush texture, irregular paper texture, hand-painted pigment shape, subtle fabric/paper layer, or artistic textured stroke closely framing the text (NOT large banners, cards, buttons, badges, pills, or UI panels).
 * - CTA: Strong editorial typography on its own closely sized organic background treatment (does NOT stretch across image), with dynamic placement in suitable negative space (lower left, lower right, side, lower central) with generous breathing room from the headline.
 * - ZERO other text, ZERO subtitles, ZERO decorative words, ZERO buttons/badges.
 */
export function buildHiggsfieldPinPrompt(
  visualFormat: PinterestVisualFormat,
  headline: string,
  cta: string,
  theme: AestheticTheme,
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): string {
  const craftType = packet.craftType || 'crochet';

  const editorialArtDirection = `
EDITORIAL TYPOGRAPHY & ART DIRECTION (RENDER EXACTLY TWO TEXT ELEMENTS):

LITERAL TEXT LOCK — TYPOGRAPHY MUST RENDER THE FOLLOWING STRINGS CHARACTER-FOR-CHARACTER:
HEADLINE — EXACT LITERAL STRING:
"${headline}"

CTA — EXACT LITERAL STRING:
"${cta}"

The words above are not semantic instructions. They are literal visual text.
Do not interpret their meaning.
Do not substitute synonyms.
Do not rewrite them.
Do not improve them.
Do not paraphrase them.
Do not change any individual word.
Do not change punctuation.
Do not replace MORE with ALL.
Do not replace ALL with MORE.
Do not replace the arrow.
Render the exact supplied characters as visible typography.

Before rendering, internally verify that the visible CTA exactly matches the supplied CTA string "${cta}". If the rendered wording differs in any word, it is incorrect.

1. HEADLINE VISUAL STYLING:
   - Placement: Upper area in clean negative space.
   - Typography: Elegant high-end editorial SERIF typeface inspired by luxury fashion magazines and fine Pinterest editorial design. Sophisticated, feminine, refined, and artistic with high visual impact and generous scale. (NOT a heavy generic display font, NOT a playful cartoon font, NOT handwriting).
   - Creative Background: Layered directly behind the headline is a delicate, organic textured background—such as a hand-painted watercolor/pigment wash, torn artisan paper texture, or soft textured brushstroke—sized closely to naturally frame the headline. (NOT a rectangular card, NOT a banner, NOT a UI box).

2. ACTION CTA VISUAL STYLING:
   - Placement: Dynamically positioned in a natural negative-space area (e.g. lower-left, lower-right, or lower-center) with generous breathing room and clear physical separation from the headline. Never attached or placed directly beneath the headline.
   - Typography: Rendered in Montserrat ExtraBold (font-weight 800, uppercase, ~24px visual size, letter spacing 1.2–1.5px, line height 1.0–1.1). Bold, crisp, highly readable on mobile, modern, premium, and confident (${theme.ctaVisualTreatment}).
   - Creative Background: Layered behind the CTA is its own dedicated, compact organic background treatment—such as an artisan textured pigment stroke, irregular paper wash, or soft paint dab—sized closely around the text. (Does NOT stretch across the image; NOT a button, NOT a pill, NOT a rounded button, NOT a badge, NOT a card, NOT a website UI element).

STRICT PROHIBITIONS & FINAL TEXT CONFIRMATION:
- ABSOLUTELY ZERO OTHER TEXT ON THE ENTIRE IMAGE: No subtitles, no secondary descriptions, no bullet points, no website headers, no URLs, no logos.
- NEVER ADD decorative filler words such as "PATTERNS", "PROJECTS", "INSPIRATION", "COZY", "HANDMADE", or any random phrases.
- ZERO UI ELEMENTS: No buttons, badges, pills, cards, panels, boxes, or Canva template graphics. Text backgrounds must feel like natural, artistic, organic painting/paper elements integrated into the photograph.
- Photography must dominate the frame with ample breathing room.
- FINAL CONFIRMED TEXT ELEMENTS TO RENDER (EXACTLY TWO):
  1. HEADLINE: "${headline}"
  2. CTA: "${cta}"`;

  switch (visualFormat) {
    case 'editorial_collage':
      return `Complete editorial Pinterest Pin photograph in 2:3 vertical layout. High-end cohesive craft photography organically showcasing 3 to 4 distinct handmade ${craftType} projects (such as mini amigurumi figures, textured motif coasters, festive pumpkins, and decorative accessories) naturally composed across a rustic textured surface. The composition is one unified, organic photograph—NOT a Canva grid, NOT UI cards, and NOT boxed panels. ${theme.lightingAndMood}, color palette of ${theme.paletteDescription}. Authentic artisan aesthetic.${editorialArtDirection}`;

    case 'lifestyle_person':
      return `Complete editorial Pinterest Pin in 2:3 vertical aspect ratio. Authentic lifestyle craft photography of a real adult woman in a cozy, beautifully lit environment wearing or holding a finished handcrafted ${craftType} piece, photographed with natural depth of field and warm ambient lighting. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. High-resolution real photography dominates the frame.${editorialArtDirection}`;

    case 'hands_crafting':
      return `Complete 2:3 vertical editorial Pinterest Pin photograph. Atmospheric close-up photography of artisan maker hands actively crocheting textured yarn with a smooth wooden ${craftType} hook, surrounded by finished handmade motifs and vintage craft tools on a warm wooden table. ${theme.lightingAndMood}, rich palette of ${theme.paletteDescription}. Authentic handmade atmosphere, immaculate stitch definition.${editorialArtDirection}`;

    case 'closeup_craftsmanship':
      return `Complete editorial Pinterest Pin in 2:3 vertical layout. Macro artisan craft photography highlighting exquisite stitch definition, rich yarn texture, and fine handmade craftsmanship. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. Premium craft magazine editorial photography, photography dominates the composition.${editorialArtDirection}`;

    case 'flatlay_projects':
      return `Complete editorial Pinterest Pin in 2:3 vertical format. Artful overhead flatlay photography of natural wool yarn skeins, smooth wooden hooks, measuring tape, and neat finished ${craftType} swatches and motifs arranged on an antique linen background. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. Clean modern craft aesthetic.${editorialArtDirection}`;

    case 'seasonal_scene':
      return `Complete 2:3 vertical editorial Pinterest Pin. Atmospheric seasonal lifestyle photography of finished hand-crafted ${craftType} pieces in a warm seasonal setting with soft natural light and rich texture. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. Warm cozy aesthetic.${editorialArtDirection}`;

    case 'multi_project_showcase':
      return `Complete editorial Pinterest Pin photograph in 2:3 vertical aspect ratio. An inspiring curated showcase of multiple finished handmade ${craftType} projects elegantly displayed together in a cozy interior setting. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. Organic photography dominates the frame.${editorialArtDirection}`;

    case 'single_hero_editorial':
    default:
      return `Complete editorial Pinterest Pin artwork in 2:3 vertical aspect ratio. Aesthetic lifestyle photography of a finished handmade textured ${craftType} project draped gracefully in cozy natural lighting. ${theme.lightingAndMood}, palette of ${theme.paletteDescription}. Professional Pinterest craft editorial layout.${editorialArtDirection}`;
  }
}

/**
 * Evaluates semantic match score between a candidate board and the topic/category.
 */
function scoreBoardMatch(
  board: NormalizedPinterestBoard,
  topic: DiscoveredTopic,
  articleCategory: string
): number {
  const boardNameLower = board.name.toLowerCase().trim();
  const kwLower = topic.keyword.toLowerCase().trim();
  const catLower = (articleCategory || '').toLowerCase().trim();

  // 1. Exact match (case-insensitive)
  if (boardNameLower === kwLower || boardNameLower.includes(kwLower)) {
    return 100;
  }

  let score = 0;

  // 2. Category matching
  if (catLower && boardNameLower.includes(catLower)) {
    score += 40;
  }

  // 3. Taxonomy semantic matching
  for (const [group, keywords] of Object.entries(CRAFT_SEMANTIC_TAXONOMY)) {
    const topicMatchesGroup = keywords.some(k => kwLower.includes(k) || catLower.includes(k));
    const boardMatchesGroup = keywords.some(k => boardNameLower.includes(k));

    if (topicMatchesGroup && boardMatchesGroup) {
      score += 45;
      break;
    }
  }

  // 4. Content format bonus
  if (topic.targetContentFormat === 'tool_focus' && /tool|guide|tip|calculator/i.test(boardNameLower)) {
    score += 20;
  } else if (topic.targetContentFormat === 'tutorial' && /tutorial|stitch|learn|how/i.test(boardNameLower)) {
    score += 20;
  }

  // 5. General crochet anchor
  if (/crochet|yarn/i.test(boardNameLower)) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Resolves the genuine current Pinterest board using live Pinterest API or provided active board catalog.
 */
export async function resolveRealPinterestBoard(
  topic: DiscoveredTopic,
  articleCategory: string,
  providedBoards?: NormalizedPinterestBoard[],
  options?: BoardResolutionOptions
): Promise<BoardResolutionResult> {
  let boards = providedBoards;

  // If boards not provided, fetch live from Pinterest API
  if (!boards) {
    try {
      const apiResult = await fetchPinterestBoards();
      if (!apiResult.success || !apiResult.boards || apiResult.boards.length === 0) {
        if (DEFAULT_KNOWN_CRAFT_BOARDS && DEFAULT_KNOWN_CRAFT_BOARDS.length > 0) {
          console.warn(`[PinterestCreativeDirector] Live Pinterest API returned no boards (${apiResult.error || 'Empty boards list'}). Falling back to known craft boards catalog.`);
          boards = DEFAULT_KNOWN_CRAFT_BOARDS;
        } else {
          if (options?.allowTestFallback) {
            const testFallbackBoard: NormalizedPinterestBoard = {
              id: 'test_sandbox_fallback_board',
              name: 'Crochet Tools & Yarn Calculators (Test Sandbox)',
            };
            return {
              success: true,
              board: testFallbackBoard,
              confidenceScore: 75,
              matchType: 'fallback',
              requiresOperatorDecision: false,
              isTestFallback: true,
              reason: '[TEST FALLBACK] Pinterest API returned zero boards. Using test sandbox board for creative concept generation.',
            };
          }
          return {
            success: false,
            confidenceScore: 0,
            matchType: 'none',
            requiresOperatorDecision: true,
            reason: `Pinterest API failed or returned zero boards: ${apiResult.error || 'Empty boards list'}. Operator decision required.`,
          };
        }
      } else {
        boards = apiResult.boards;
      }
    } catch (err: any) {
      if (DEFAULT_KNOWN_CRAFT_BOARDS && DEFAULT_KNOWN_CRAFT_BOARDS.length > 0) {
        console.warn(`[PinterestCreativeDirector] Live Pinterest API network error (${err?.message}). Falling back to known craft boards catalog.`);
        boards = DEFAULT_KNOWN_CRAFT_BOARDS;
      } else {
        if (options?.allowTestFallback) {
          const testFallbackBoard: NormalizedPinterestBoard = {
            id: 'test_sandbox_fallback_board',
            name: 'Crochet Tools & Yarn Calculators (Test Sandbox)',
          };
          return {
            success: true,
            board: testFallbackBoard,
            confidenceScore: 75,
            matchType: 'fallback',
            requiresOperatorDecision: false,
            isTestFallback: true,
            reason: `[TEST FALLBACK] Pinterest API network error (${err?.message}). Using test sandbox board for creative concept generation.`,
          };
        }
        return {
          success: false,
          confidenceScore: 0,
          matchType: 'none',
          requiresOperatorDecision: true,
          reason: `Pinterest API network failure: ${err?.message || 'Unknown network error'}. Operator decision required.`,
        };
      }
    }
  }

  if (boards.length === 0) {
    if (options?.allowTestFallback) {
      const testFallbackBoard: NormalizedPinterestBoard = {
        id: 'test_sandbox_fallback_board',
        name: 'Crochet Tools & Yarn Calculators (Test Sandbox)',
      };
      return {
        success: true,
        board: testFallbackBoard,
        confidenceScore: 75,
        matchType: 'fallback',
        requiresOperatorDecision: false,
        isTestFallback: true,
        reason: '[TEST FALLBACK] User has no active boards in connected Pinterest account. Using test sandbox board for creative concept generation.',
      };
    }
    return {
      success: false,
      confidenceScore: 0,
      matchType: 'none',
      requiresOperatorDecision: true,
      reason: 'User has no active boards in connected Pinterest account. Operator decision required.',
    };
  }

  // Score all candidate boards
  const scoredCandidates = boards.map(b => ({
    board: b,
    score: scoreBoardMatch(b, topic, articleCategory),
  }));

  scoredCandidates.sort((a, b) => b.score - a.score);
  const best = scoredCandidates[0];

  // Check for duplicate board names with identical highest score
  const topTies = scoredCandidates.filter(c => c.score === best.score && c.score >= 60);
  if (topTies.length > 1 && topTies[0].board.name === topTies[1].board.name && topTies[0].board.id !== topTies[1].board.id) {
    if (!options?.allowTestFallback) {
      return {
        success: false,
        confidenceScore: best.score,
        matchType: 'semantic',
        requiresOperatorDecision: true,
        reason: `Ambiguity: Found duplicate boards with the exact same name "${best.board.name}" (${topTies.map(t => t.board.id).join(', ')}). Operator decision required to select correct board.`,
        candidateBoards: topTies,
      };
    }
  }

  // Strict confidence threshold: require at least 60% confidence
  if (best.score < 60) {
    if (options?.allowTestFallback) {
      const fallbackCandidates = DEFAULT_KNOWN_CRAFT_BOARDS;
      const scoredFallback = fallbackCandidates.map(b => ({
        board: b,
        score: scoreBoardMatch(b, topic, articleCategory),
      }));
      scoredFallback.sort((a, b) => b.score - a.score);
      const bestFallback = scoredFallback[0] || {
        board: { id: 'board_tools', name: 'Crochet Tools & Yarn Calculators' },
        score: 75,
      };

      return {
        success: true,
        board: bestFallback.board,
        confidenceScore: bestFallback.score,
        matchType: 'fallback',
        requiresOperatorDecision: false,
        isTestFallback: true,
        reason: `[TEST FALLBACK] Low semantic match (<60) on real boards. Selected best catalog board "${bestFallback.board.name}".`,
        candidateBoards: scoredCandidates,
      };
    }

    return {
      success: false,
      confidenceScore: best.score,
      matchType: 'semantic',
      requiresOperatorDecision: true,
      reason: `Low confidence semantic match (${best.score}/100) for topic "${topic.keyword}" with board "${best.board.name}". Operator decision required.`,
      candidateBoards: scoredCandidates,
    };
  }

  return {
    success: true,
    board: best.board,
    confidenceScore: best.score,
    matchType: 'semantic',
    requiresOperatorDecision: false,
    reason: `Confident semantic match (${best.score}/100) with board "${best.board.name}".`,
    candidateBoards: scoredCandidates,
  };
}

/**
 * Convenience synchronous board matcher for test harness and fallback analysis.
 */
export function matchPinterestBoard(
  topic: DiscoveredTopic,
  articleCategory: string,
  providedBoards?: NormalizedPinterestBoard[]
): {
  boardName: string;
  boardId: string;
  confidenceScore: number;
  reason: string;
  success: boolean;
} {
  const candidates = providedBoards && providedBoards.length > 0 ? providedBoards : DEFAULT_KNOWN_CRAFT_BOARDS;
  const scored = candidates.map(b => ({
    board: b,
    score: scoreBoardMatch(b, topic, articleCategory),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (best && best.score > 0) {
    return {
      boardName: best.board.name,
      boardId: best.board.id,
      confidenceScore: best.score,
      reason: `Semantic alignment (${best.score}/100) with category ${articleCategory}`,
      success: true,
    };
  }

  return {
    boardName: 'Crochet Blankets & Afghans',
    boardId: 'default_board',
    confidenceScore: 50,
    reason: 'Default craft board fallback',
    success: true,
  };
}

/**
 * Builds a dedicated, content-aware Hero prompt for Higgsfield (16:9, pure high-res photography).
 */
export function buildHiggsfieldHeroPrompt(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): string {
  const craftType = packet.craftType || 'crochet';

  if (topic.targetContentFormat === 'tool_focus') {
    return `Editorial craft flatlay photography for ${craftType} article "${article.title}". Neatly arranged natural wool yarn skeins, smooth birch wooden crochet hooks, a flexible cloth measuring tape, and a crisp textured gauge swatch on a clean warm linen background. Soft diffused natural window light, warm neutral tones, organic cozy maker workspace, 8k resolution, authentic artisan photography, zero digital noise.`;
  } else if (topic.targetContentFormat === 'tutorial') {
    return `Authentic close-up artisan craft photography for "${article.title}". Maker hands gently working intricate ${craftType} stitches with premium textured yarn, natural wooden hook, soft morning studio light, shallow depth of field, warm cozy maker vibe, immaculate stitch definition, high resolution, organic craft publication aesthetic.`;
  } else {
    return `Warm lifestyle interior photography for "${article.title}". A finished hand-crafted ${craftType} blanket draped gracefully over a comfortable wooden armchair beside a woven basket of cozy yarn cakes, warm sunlight streaming through window, elegant rustic home decor, authentic high-resolution craft photography.`;
  }
}

/**
 * Generates dynamic, content-aware Pinterest creative concepts with dedicated Higgsfield prompts.
 * 
 * STRICT ARCHITECTURAL AND VISUAL STANDARDS:
 * 1. Pin 1 and Pin 2 represent genuinely distinct visual formats, angles, and compositions.
 * 2. Title and CTA must always have separate, dedicated visual zones with clear breathing room.
 * 3. SUBTITLES ARE PERMANENTLY REMOVED: No supporting notes, explanatory copy, or bullet points.
 * 4. CTA is prominent editorial action typography with arrow "→", high contrast, non-SaaS, no badges/pills/buttons.
 * 5. CTA visual style (colors, textures, typography) changes dynamically with topic, craft, and season.
 * 6. NO LOCAL COMPOSITOR: Higgsfield Marketing Studio Image 2.0 Alpha generates the complete final image.
 */
export function generatePinterestCreativeConcepts(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  resolvedBoard: NormalizedPinterestBoard,
  pinsPerArticle = 2
): PinterestCreativeConcept[] {
  const concepts: PinterestCreativeConcept[] = [];
  const destinationUrl = `https://welovepattern.com/blog/${article.slug}`;
  const theme = analyzeTopicAesthetic(topic, article, packet);

  // Determine complementary visual formats for Pin 1 and Pin 2
  const { pin1Format, pin2Format } = selectComplementaryVisualFormats(topic, article);

  for (let pinNum = 1; pinNum <= pinsPerArticle; pinNum++) {
    const visualFormat = pinNum === 1 ? pin1Format : pin2Format;
    const headline = buildPrimaryHeadline(topic, article, pinNum);
    const cta = buildTrafficOrientedCta(topic, article, pinNum, visualFormat);

    const typography: PinterestTypographyOverlay = {
      primaryHeadline: headline,
      ctaBadgeText: cta,
      textContainerStyle: 'soft_comfort_card',
    };

    const compactHiggsfieldPrompt = buildHiggsfieldPinPrompt(
      visualFormat,
      headline,
      cta,
      theme,
      topic,
      article,
      packet
    );

    const conceptAngle = pinNum === 1
      ? (visualFormat === 'editorial_collage'
          ? 'Organic Editorial Multi-Project Showcase'
          : visualFormat === 'flatlay_projects'
          ? 'Materials Flatlay & Direct Practical Solution'
          : visualFormat === 'closeup_craftsmanship'
          ? 'Close-Up Stitch Detail & Technical Clarity'
          : 'Primary Value Angle & Complete Overview')
      : (visualFormat === 'lifestyle_person'
          ? 'Cozy Authentic Lifestyle & Finished Project in Use'
          : visualFormat === 'hands_crafting'
          ? 'Maker Hands in Action & Artisan Technique'
          : 'Secondary Perspective & Troubleshooting Guide');

    concepts.push({
      pinNumber: pinNum,
      conceptAngle,
      visualStyle: {
        imageCount: visualFormat === 'editorial_collage' ? 4 : 1,
        compositionType: visualFormat === 'editorial_collage'
          ? '4_image_grid'
          : visualFormat === 'flatlay_projects'
          ? 'flatlay_materials'
          : visualFormat === 'closeup_craftsmanship'
          ? 'split_2_image'
          : 'lifestyle_scene',
        subjectDescription: `${conceptAngle} for ${article.title}`,
        colorPalette: theme.paletteDescription,
        humanElement: visualFormat === 'lifestyle_person'
          ? 'person_wearing'
          : visualFormat === 'hands_crafting'
          ? 'hands_only'
          : 'none',
      },
      compactHiggsfieldPrompt,
      typographyOverlay: typography,
      destinationUrl,
      targetBoardId: resolvedBoard.id,
      targetBoardName: resolvedBoard.name,
      boardName: resolvedBoard.name,
      publishStatus: 'pending',
    });
  }

  return concepts;
}
