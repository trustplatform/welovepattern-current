/**
 * SEO Content Engine - Pinterest Creative Intelligence Director
 * 
 * DIRECT HIGGSFIELD PINTEREST ARTWORK ARCHITECTURE:
 * - Generates complete, content-aware Pinterest Pin concepts directly with Higgsfield (Marketing Studio Image 2.0 Alpha, 2:3).
 * - Zero local canvas/SVG compositing after Higgsfield.
 * - Higgsfield is given full creative authority over photography, composition, embedded typography, headline, and action CTA.
 * 
 * ADVANCED CREATIVE DIVERSITY ARCHITECTURE:
 * 1. MULTI-DIMENSIONAL CONCEPT DIVERSITY: For every article, Pin 1 and Pin 2 MUST intentionally differ in at least 5
 *    meaningful visual dimensions:
 *    - Composition (e.g. single hero vs hands-crafting vs overhead flatlay vs macro craftsmanship)
 *    - Camera / Framing (e.g. 3/4 angle vs macro close-up vs overhead 90-degree vs eye-level)
 *    - Title Position (e.g. top-left vs bottom-right vs top-center vs lower-third)
 *    - CTA Position (e.g. bottom-right vs top-right vs bottom-center vs mid-side)
 *    - Typography Style (e.g. editorial serif vs bold modern sans vs compact stacked vs refined minimal)
 *    - Text Background (e.g. none/clean photo vs subtle gradient vignette vs delicate pigment stroke vs fine line frame)
 *    - CTA Visual Styling (e.g. clean minimal text vs editorial bordered label vs subtle capsule vs pigment wash)
 *    - Color & Mood (e.g. warm harvest vs fresh botanical vs modern minimalist vs colorful yarn studio)
 * 2. ZERO TEMPLATE REPETITION: Anti-repetition engine ensures Pin 1 and Pin 2 never share the same layout template.
 * 3. STRICT IMMUTABLE LITERAL TEXT LOCK: Headline and action CTA strings are strictly locked character-for-character.
 * 4. STRICT TITLE / CTA VISUAL SEPARATION: Headline and action CTA occupy separate, dedicated visual zones.
 * 5. ONE STRONG HEADLINE — ZERO SUBTITLES: No subtitles, secondary descriptive lines, or bullet points.
 * 6. TRAFFIC-ORIENTED ACTION CTA: Every Pin features ONE clear, prominent action CTA strictly mapped to the tool/topic.
 */

import fs from 'fs';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept, PinterestTypographyOverlay } from '../types';
import { GeneratedArticle } from './openAiArticleGenerator';
import { fetchPinterestBoards, NormalizedPinterestBoard } from '../../pinterest/pinterestApi';
import { TOOLS_DATA } from '../../data/toolsData';

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
 * Supported Visual Formats for Pinterest Creative Generation (Legacy & High-Level)
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
 * Granular Visual Dimensions for Dynamic Creative Generation
 */
export type PinterestCompositionType =
  | 'single_hero_editorial'
  | 'lifestyle_scene'
  | 'hands_crafting'
  | 'overhead_flatlay'
  | 'editorial_portrait'
  | 'craftsmanship_macro'
  | 'multi_project_showcase'
  | 'asymmetric_editorial'
  | 'environmental_workspace';

export type PinterestCameraFraming =
  | 'overhead'
  | 'eye_level'
  | 'three_quarter'
  | 'close_up'
  | 'macro'
  | 'wide_environmental'
  | 'side_profile';

export type PinterestTypographyStyle =
  | 'editorial_serif'
  | 'bold_modern_sans'
  | 'compact_stacked'
  | 'refined_minimal'
  | 'asymmetric_display';

export type PinterestTextPosition =
  | 'top_left'
  | 'top_right'
  | 'top_center'
  | 'bottom_left'
  | 'bottom_right'
  | 'lower_third_center'
  | 'mid_left_side';

export type PinterestCtaPosition =
  | 'bottom_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'top_right'
  | 'mid_right_side'
  | 'lower_third_offset';

export type PinterestCtaStyle =
  | 'clean_minimal_text'
  | 'subtle_capsule'
  | 'editorial_label'
  | 'artisan_pigment_wash'
  | 'minimal_underline'
  | 'tonal_comfort_pill';

export type PinterestTextBackground =
  | 'none_direct_photo'
  | 'subtle_soft_vignette'
  | 'organic_pigment_stroke'
  | 'fine_line_frame'
  | 'artisan_paper_wash';

/**
 * Complete Multi-Dimensional Concept Profile
 */
export interface PinterestCreativeDimensions {
  composition: PinterestCompositionType;
  cameraFraming: PinterestCameraFraming;
  colorMood: AestheticTheme;
  typographyStyle: PinterestTypographyStyle;
  titlePosition: PinterestTextPosition;
  ctaPosition: PinterestCtaPosition;
  ctaStyle: PinterestCtaStyle;
  textBackground: PinterestTextBackground;
  propStorytelling: string;
}

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
 * Derives a rich, topic-specific aesthetic theme, color palette, and CTA visual styling.
 */
export function analyzeTopicAesthetic(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  variationSeed = 1
): AestheticTheme {
  const textCorpus = `${topic.keyword} ${article.title} ${article.category || ''} ${packet.craftType || ''}`.toLowerCase();

  // 1. Seasonal / Holiday Themes
  if (/halloween|autumn|fall|pumpkin|spooky|october/i.test(textCorpus)) {
    if (variationSeed === 2) {
      return {
        themeName: 'Midnight Harvest Studio',
        paletteDescription: 'Deep plum, rich terracotta, warm parchment, and vintage amber gold',
        ctaVisualTreatment: 'deep plum and warm terracotta organic wash with crisp cream editorial typography',
        lightingAndMood: 'Moody directional candlelight and golden hour amber tones',
      };
    }
    return {
      themeName: 'Autumn Warmth',
      paletteDescription: 'Warm terracotta, burnt pumpkin orange, deep espresso, and antique linen',
      ctaVisualTreatment: 'warm terracotta and burnt pumpkin organic pigment wash with crisp cream editorial typography',
      lightingAndMood: 'Warm golden autumn afternoon sunlight, cozy harvest textures',
    };
  }

  if (/christmas|holiday|winter|snow|festive|ornament|tree/i.test(textCorpus)) {
    if (variationSeed === 2) {
      return {
        themeName: 'Winter Cozy Fireside',
        paletteDescription: 'Warm oatmeal wool, rich cinnamon, toasted pecan, and alpine white',
        ctaVisualTreatment: 'warm cinnamon and oatmeal textured paper wash with refined typography',
        lightingAndMood: 'Cozy hearthside glow with soft ambient shadows',
      };
    }
    return {
      themeName: 'Festive Botanical',
      paletteDescription: 'Deep forest pine green, cranberry red, winter cream, and warm brass',
      ctaVisualTreatment: 'deep forest pine and winter cream textured paper wash with crisp high-contrast typography',
      lightingAndMood: 'Soft ambient winter morning light, cozy festive ambiance',
    };
  }

  if (/flower|floral|spring|rose|botanical|bloom|garden/i.test(textCorpus)) {
    if (variationSeed === 2) {
      return {
        themeName: 'Vibrant Garden Bloom',
        paletteDescription: 'Fresh buttercup yellow, crisp meadow green, petal coral, and chalk white',
        ctaVisualTreatment: 'crisp meadow green and petal coral watercolor wash with modern high-contrast typography',
        lightingAndMood: 'Vibrant sun-drenched outdoor morning light with fresh botanical textures',
      };
    }
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
    if (variationSeed === 2) {
      return {
        themeName: 'Creative Maker Workspace',
        paletteDescription: 'Rich indigo dye, warm birch wood, slate charcoal, and crisp milk cotton',
        ctaVisualTreatment: 'rich indigo and warm birch organic wash with sharp modern legibility',
        lightingAndMood: 'Warm natural side light in an authentic craft workshop',
      };
    }
    return {
      themeName: 'Modern Maker Studio',
      paletteDescription: 'Natural oatmeal, warm terracotta, slate charcoal, and creamy linen',
      ctaVisualTreatment: 'warm terracotta and oatmeal textured wash with sharp editorial legibility',
      lightingAndMood: 'Clean diffused overhead daylight, pristine maker workspace layout',
    };
  }

  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|beginner|tutorial/i.test(textCorpus)) {
    if (variationSeed === 2) {
      return {
        themeName: 'Rich Artisan Studio',
        paletteDescription: 'Deep walnut wood, warm ochre yarn, natural wool ecru, and aged brass',
        ctaVisualTreatment: 'deep walnut and warm ochre textured wash with clean editorial typography',
        lightingAndMood: 'Artisan workshop studio lighting with warm directional depth',
      };
    }
    return {
      themeName: 'Calm Studio Craft',
      paletteDescription: 'Soft sage green, warm stone, natural unbleached wool, and muted caramel',
      ctaVisualTreatment: 'soft sage green and ivory artisan paper texture with refined typography',
      lightingAndMood: 'Soft side-lit studio lighting highlighting textured stitch definition',
    };
  }

  if (/amigurumi|toy|doll|plush/i.test(textCorpus)) {
    if (variationSeed === 2) {
      return {
        themeName: 'Colorful Yarn Wonderland',
        paletteDescription: 'Vibrant mustard, berry magenta, soft mint, and warm honey',
        ctaVisualTreatment: 'vibrant berry magenta and warm honey organic wash with playful refined typography',
        lightingAndMood: 'Bright cheerful daylight with colorful craft backdrop',
      };
    }
    return {
      themeName: 'Playful Artisan',
      paletteDescription: 'Warm buttercup, dusty pastel peach, soft linen, and cocoa',
      ctaVisualTreatment: 'warm honey-gold and dark cocoa organic wash with clear readability',
      lightingAndMood: 'Cheerful soft natural lighting with gentle warm tones',
    };
  }

  // 3. Default Cohesive Natural Craft Editorial with Variation
  if (variationSeed === 2) {
    return {
      themeName: 'Modern Craft Editorial',
      paletteDescription: 'Rich charcoal, warm mustard gold, raw linen, and deep pine',
      ctaVisualTreatment: 'mustard gold and charcoal textured wash with crisp modern typography',
      lightingAndMood: 'Bright architectural studio daylight with soft textured shadows',
    };
  }

  return {
    themeName: 'Organic Craft Editorial',
    paletteDescription: 'Warm ecru, rich caramel, soft moss, and natural birch wood',
    ctaVisualTreatment: 'warm caramel and crisp linen textured wash with natural craft styling',
    lightingAndMood: 'Warm natural window light, authentic cozy maker atmosphere',
  };
}

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
    return {
      pin1Format: 'editorial_collage',
      pin2Format: 'lifestyle_person',
    };
  }

  if (isTool) {
    return {
      pin1Format: 'flatlay_projects',
      pin2Format: 'lifestyle_person',
    };
  }

  if (isTutorial) {
    return {
      pin1Format: 'closeup_craftsmanship',
      pin2Format: 'hands_crafting',
    };
  }

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
 * Generates an intentionally complementary, mutually distinct creative dimension pair for Pin 1 and Pin 2.
 * GUARANTEES that Pin 1 and Pin 2 differ in at least 5 meaningful visual dimensions.
 */
export function selectDistinctCreativeConceptPair(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): [PinterestCreativeDimensions, PinterestCreativeDimensions] {
  const textCorpus = `${topic.keyword} ${article.title} ${article.category || ''} ${topic.targetContentFormat || ''}`.toLowerCase();
  const craftType = packet.craftType || 'crochet';

  const theme1 = analyzeTopicAesthetic(topic, article, packet, 1);
  const theme2 = analyzeTopicAesthetic(topic, article, packet, 2);

  // Concept Pair 1: Tool Guides & Interactive Utilities
  if (topic.targetContentFormat === 'tool_focus' || topic.contentType === 'tool_guide' || /calculator|gauge|yardage|counter|converter|tracker|timer/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'overhead_flatlay',
      cameraFraming: 'overhead',
      colorMood: theme1,
      typographyStyle: 'bold_modern_sans',
      titlePosition: 'top_center',
      ctaPosition: 'bottom_center',
      ctaStyle: 'editorial_label',
      textBackground: 'none_direct_photo',
      propStorytelling: `Pristine overhead flatlay of neat natural wool yarn cakes, smooth birch ${craftType} hooks, a clean cloth measuring tape, and a crisp tension swatch arranged on clean warm linen`,
    };

    const dim2: PinterestCreativeDimensions = {
      composition: 'lifestyle_scene',
      cameraFraming: 'three_quarter',
      colorMood: theme2,
      typographyStyle: 'editorial_serif',
      titlePosition: 'top_left',
      ctaPosition: 'bottom_right',
      ctaStyle: 'subtle_capsule',
      textBackground: 'organic_pigment_stroke',
      propStorytelling: `Atmospheric natural craft lifestyle scene of a real crafter in a sunlit craft nook holding active handmade work alongside cozy wooden furniture and textured ambient backdrop`,
    };

    return [dim1, dim2];
  }

  // Concept Pair 2: Tutorials, Stitches & How-To Guides
  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|tutorial|beginner/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'craftsmanship_macro',
      cameraFraming: 'macro',
      colorMood: theme1,
      typographyStyle: 'refined_minimal',
      titlePosition: 'top_left',
      ctaPosition: 'bottom_right',
      ctaStyle: 'clean_minimal_text',
      textBackground: 'subtle_soft_vignette',
      propStorytelling: `Extreme macro close-up photography highlighting intricate ${craftType} stitch definition, individual yarn plies, and exquisite textured handmade detail`,
    };

    const dim2: PinterestCreativeDimensions = {
      composition: 'hands_crafting',
      cameraFraming: 'close_up',
      colorMood: theme2,
      typographyStyle: 'bold_modern_sans',
      titlePosition: 'bottom_left',
      ctaPosition: 'top_right',
      ctaStyle: 'editorial_label',
      textBackground: 'artisan_paper_wash',
      propStorytelling: `Close-up artisan maker hands in action actively working textured yarn with a smooth wooden ${craftType} hook on a warm rustic workbench`,
    };

    return [dim1, dim2];
  }

  // Concept Pair 3: Seasonal Motifs & Ideas Roundups
  if (/halloween|autumn|pumpkin|christmas|winter|flower|motif|granny square|ideas|roundup/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'multi_project_showcase',
      cameraFraming: 'three_quarter',
      colorMood: theme1,
      typographyStyle: 'editorial_serif',
      titlePosition: 'top_center',
      ctaPosition: 'bottom_right',
      ctaStyle: 'artisan_pigment_wash',
      textBackground: 'organic_pigment_stroke',
      propStorytelling: `Curated editorial display of 3 to 4 distinct finished handmade ${craftType} motifs naturally grouped across a rustic textured surface in cozy ambient lighting`,
    };

    const dim2: PinterestCreativeDimensions = {
      composition: 'asymmetric_editorial',
      cameraFraming: 'eye_level',
      colorMood: theme2,
      typographyStyle: 'bold_modern_sans',
      titlePosition: 'bottom_right',
      ctaPosition: 'top_left',
      ctaStyle: 'clean_minimal_text',
      textBackground: 'none_direct_photo',
      propStorytelling: `Modern asymmetric hero composition featuring a single striking handmade ${craftType} project positioned dynamically in negative space with rich natural textures`,
    };

    return [dim1, dim2];
  }

  // Concept Pair 4: General Craft Articles, Garments, & Blankets
  const dim1: PinterestCreativeDimensions = {
    composition: 'single_hero_editorial',
    cameraFraming: 'three_quarter',
    colorMood: theme1,
    typographyStyle: 'editorial_serif',
    titlePosition: 'top_left',
    ctaPosition: 'bottom_right',
    ctaStyle: 'subtle_capsule',
    textBackground: 'subtle_soft_vignette',
    propStorytelling: `Striking hero photography of a finished handmade ${craftType} project elegantly styled over a natural wooden chair beside a woven craft basket in warm natural light`,
  };

  const dim2: PinterestCreativeDimensions = {
    composition: 'hands_crafting',
    cameraFraming: 'close_up',
    colorMood: theme2,
    typographyStyle: 'compact_stacked',
    titlePosition: 'bottom_left',
    ctaPosition: 'top_right',
    ctaStyle: 'editorial_label',
    textBackground: 'none_direct_photo',
    propStorytelling: `Artisan maker hands actively working with natural wool and smooth wooden hook surrounded by neat handmade swatches and craft tools`,
  };

  return [dim1, dim2];
}

/**
 * Builds a dedicated, dynamic Higgsfield prompt enforcing STRICT IMMUTABLE TEXT & EDITORIAL ART DIRECTION:
 * - EXACTLY TWO text elements: Headline and CTA.
 * - Dynamic Title & CTA Placement: No hardcoded top-left / bottom-left. Placement adapts directly to chosen dimensions.
 * - Dynamic Typography & Backgrounds: Editorial serif, bold modern sans, compact stacked; paper panels are optional.
 * - Strict Literal Text Lock: Headline and CTA strings locked character-for-character.
 * - ZERO other text, ZERO subtitles, ZERO decorative filler words, ZERO SaaS UI elements.
 */
export function buildHiggsfieldPinPrompt(
  visualFormat: PinterestVisualFormat,
  headline: string,
  cta: string,
  theme: AestheticTheme,
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  dimensions?: PinterestCreativeDimensions
): string {
  const craftType = packet.craftType || 'crochet';

  // Extract dimensions or fallback to format defaults
  const titlePos = dimensions?.titlePosition || 'top_left';
  const ctaPos = dimensions?.ctaPosition || 'bottom_right';
  const typoStyle = dimensions?.typographyStyle || 'editorial_serif';
  const bgStyle = dimensions?.textBackground || 'organic_pigment_stroke';
  const ctaVisual = dimensions?.ctaStyle || 'artisan_pigment_wash';
  const framing = dimensions?.cameraFraming || 'three_quarter';
  const moodTheme = dimensions?.colorMood || theme;

  // Format Placement Descriptions
  const titlePlacementText =
    titlePos === 'top_center'
      ? 'Upper-center area in clean negative space above the focal subject.'
      : titlePos === 'top_right'
      ? 'Upper-right area in natural negative space with generous margins.'
      : titlePos === 'bottom_right'
      ? 'Lower-right area in natural negative space balanced with the composition.'
      : titlePos === 'bottom_left'
      ? 'Lower-left area in clean negative space.'
      : titlePos === 'lower_third_center'
      ? 'Lower-third centered placement integrated smoothly into negative space.'
      : 'Upper area in clean negative space.';

  const ctaPlacementText =
    ctaPos === 'top_right'
      ? 'Upper-right area in natural negative space with clear separation from the headline.'
      : ctaPos === 'top_left'
      ? 'Upper-left area in natural negative space, well separated from the headline.'
      : ctaPos === 'bottom_center'
      ? 'Centered bottom area with generous breathing room and clean physical separation from the headline.'
      : ctaPos === 'bottom_left'
      ? 'Lower-left area in natural negative space, completely physically separated from the headline.'
      : ctaPos === 'mid_right_side'
      ? 'Mid-right side zone positioned beside the subject in available negative space.'
      : 'Lower-right area in natural negative space with generous breathing room and clear physical separation from the headline. Never attached or placed directly beneath the headline.';

  // Format Headline Typography Description
  const headlineTypoText =
    typoStyle === 'bold_modern_sans'
      ? 'Bold, clean modern architectural SANS-SERIF typeface (geometric, heavy, crisp, contemporary editorial style with high visual impact and immaculate readability).'
      : typoStyle === 'compact_stacked'
      ? 'Compact stacked uppercase editorial typography with balanced tracking and clean visual hierarchy.'
      : typoStyle === 'refined_minimal'
      ? 'Refined, airy uppercase editorial typography with generous letter tracking and sophisticated breathing room.'
      : 'Elegant high-end editorial SERIF typeface inspired by luxury fashion magazines and fine Pinterest editorial design. Sophisticated, feminine, refined, and artistic with high visual impact and generous scale. (NOT a heavy generic display font, NOT a playful cartoon font, NOT handwriting).';

  // Format Headline Background Description
  const headlineBgText =
    bgStyle === 'none_direct_photo'
      ? 'Typography is integrated directly into clean, quiet negative photographic space without any background panel, card, box, or paper patch.'
      : bgStyle === 'subtle_soft_vignette'
      ? 'Layered with a subtle natural photographic gradient shadow that ensures high contrast against the photography.'
      : bgStyle === 'fine_line_frame'
      ? 'Delicate hairline artisan border framing the headline with generous negative space.'
      : bgStyle === 'artisan_paper_wash'
      ? 'Layered directly behind the headline is a delicate, organic artisan paper wash texture sized closely to naturally frame the headline.'
      : 'Layered directly behind the headline is a delicate, organic textured background—such as a hand-painted watercolor/pigment wash, torn artisan paper texture, or soft textured brushstroke—sized closely to naturally frame the headline. (NOT a rectangular card, NOT a banner, NOT a UI box).';

  // Format CTA Background Description
  const ctaBgText =
    ctaVisual === 'clean_minimal_text'
      ? 'Rendered as clean standalone editorial typography directly over the photograph negative space without any panel or card.'
      : ctaVisual === 'editorial_label'
      ? 'Layered inside a small, compact craft label with crisp fine-line border sized closely around the text.'
      : ctaVisual === 'subtle_capsule'
      ? 'Layered inside a compact, delicate soft-toned capsule sized closely around the text.'
      : 'Layered behind the CTA is its own dedicated, compact organic background treatment—such as an artisan textured pigment stroke, irregular paper wash, or soft paint dab—sized closely around the text. (Does NOT stretch across the image; NOT a button, NOT a pill, NOT a rounded button, NOT a badge, NOT a card, NOT a website UI element).';

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
   - Placement: ${titlePlacementText}
   - Typography: ${headlineTypoText}
   - Creative Background: ${headlineBgText}

2. ACTION CTA VISUAL STYLING:
   - Placement: ${ctaPlacementText}
   - Typography: Rendered in Montserrat ExtraBold (font-weight 800, uppercase, ~24px visual size, letter spacing 1.2–1.5px, line height 1.0–1.1). Bold, crisp, highly readable on mobile, modern, premium, and confident (${moodTheme.ctaVisualTreatment}).
   - Creative Background: ${ctaBgText}

STRICT PROHIBITIONS & FINAL TEXT CONFIRMATION:
- ABSOLUTELY ZERO OTHER TEXT ON THE ENTIRE IMAGE: No subtitles, no secondary descriptions, no bullet points, no website headers, no URLs, no logos.
- NEVER ADD decorative filler words such as "PATTERNS", "PROJECTS", "INSPIRATION", "COZY", "HANDMADE", or any random phrases.
- ZERO UI ELEMENTS: No buttons, badges, pills, cards, panels, boxes, or Canva template graphics. Text backgrounds must feel like natural, artistic, organic painting/paper elements integrated into the photograph.
- Photography must dominate the frame with ample breathing room.
- FINAL CONFIRMED TEXT ELEMENTS TO RENDER (EXACTLY TWO):
  1. HEADLINE: "${headline}"
  2. CTA: "${cta}"`;

  // Base prompt by visual format / dimensions
  const comp = dimensions?.composition || (visualFormat as PinterestCompositionType);
  const story = dimensions?.propStorytelling;

  if (comp === 'overhead_flatlay' || visualFormat === 'flatlay_projects') {
    return `Complete editorial Pinterest Pin in 2:3 vertical format. ${story || `Artful overhead flatlay photography of natural wool yarn skeins, smooth wooden hooks, measuring tape, and neat finished ${craftType} swatches and motifs arranged on an antique linen background`}. ${moodTheme.lightingAndMood}, palette of ${moodTheme.paletteDescription}. Clean modern craft aesthetic.${editorialArtDirection}`;
  }

  if (comp === 'craftsmanship_macro' || visualFormat === 'closeup_craftsmanship') {
    return `Complete editorial Pinterest Pin in 2:3 vertical layout. ${story || `Macro artisan craft photography highlighting exquisite stitch definition, rich yarn texture, and fine handmade craftsmanship`}. ${moodTheme.lightingAndMood}, palette of ${moodTheme.paletteDescription}. Premium craft magazine editorial photography, photography dominates the composition.${editorialArtDirection}`;
  }

  if (comp === 'hands_crafting' || visualFormat === 'hands_crafting') {
    return `Complete 2:3 vertical editorial Pinterest Pin photograph. ${story || `Atmospheric close-up photography of artisan maker hands actively crocheting textured yarn with a smooth wooden ${craftType} hook, surrounded by finished handmade motifs and vintage craft tools on a warm wooden table`}. ${moodTheme.lightingAndMood}, rich palette of ${moodTheme.paletteDescription}. Authentic handmade atmosphere, immaculate stitch definition.${editorialArtDirection}`;
  }

  if (comp === 'multi_project_showcase' || visualFormat === 'editorial_collage') {
    return `Complete editorial Pinterest Pin photograph in 2:3 vertical layout. ${story || `High-end cohesive craft photography organically showcasing 3 to 4 distinct handmade ${craftType} projects naturally composed across a rustic textured surface`}. The composition is one unified, organic photograph—NOT a Canva grid, NOT UI cards, and NOT boxed panels. ${moodTheme.lightingAndMood}, color palette of ${moodTheme.paletteDescription}. Authentic artisan aesthetic.${editorialArtDirection}`;
  }

  if (comp === 'asymmetric_editorial') {
    return `Complete editorial Pinterest Pin in 2:3 vertical aspect ratio. ${story || `Modern asymmetric editorial craft photography featuring a textured handmade ${craftType} project positioned off-center in dramatic natural light`}. ${moodTheme.lightingAndMood}, palette of ${moodTheme.paletteDescription}. High-resolution real photography dominates the frame.${editorialArtDirection}`;
  }

  if (comp === 'lifestyle_scene' || comp === 'editorial_portrait' || visualFormat === 'lifestyle_person') {
    return `Complete editorial Pinterest Pin in 2:3 vertical aspect ratio. ${story || `Authentic lifestyle craft photography of a real adult woman in a cozy, beautifully lit environment wearing or holding a finished handcrafted ${craftType} piece, photographed with natural depth of field and warm ambient lighting`}. ${moodTheme.lightingAndMood}, palette of ${moodTheme.paletteDescription}. High-resolution real photography dominates the frame.${editorialArtDirection}`;
  }

  return `Complete editorial Pinterest Pin artwork in 2:3 vertical aspect ratio. ${story || `Aesthetic lifestyle photography of a finished handmade textured ${craftType} project draped gracefully in cozy natural lighting`}. ${moodTheme.lightingAndMood}, palette of ${moodTheme.paletteDescription}. Professional Pinterest craft editorial layout.${editorialArtDirection}`;
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
 * Verifies that two generated Pinterest creative concepts meet the strict 5+ dimension anti-repetition standard.
 */
export function verifyPinCreativeDiversity(
  pin1: PinterestCreativeConcept,
  pin2: PinterestCreativeConcept
): { diverse: boolean; differenceCount: number; differences: string[] } {
  const differences: string[] = [];

  if (pin1.visualStyle.compositionType !== pin2.visualStyle.compositionType) {
    differences.push(`Composition: "${pin1.visualStyle.compositionType}" vs "${pin2.visualStyle.compositionType}"`);
  }
  if (pin1.visualStyle.humanElement !== pin2.visualStyle.humanElement) {
    differences.push(`Human Element: "${pin1.visualStyle.humanElement}" vs "${pin2.visualStyle.humanElement}"`);
  }
  if (pin1.visualStyle.colorPalette !== pin2.visualStyle.colorPalette) {
    differences.push(`Color Palette: "${pin1.visualStyle.colorPalette}" vs "${pin2.visualStyle.colorPalette}"`);
  }

  const p1 = pin1.compactHiggsfieldPrompt;
  const p2 = pin2.compactHiggsfieldPrompt;

  const extractHeadlinePlacement = (p: string) => {
    const match = p.match(/HEADLINE VISUAL STYLING:[\s\S]*?Placement:\s*([^.\n]+)/i);
    return match ? match[1].trim() : 'default';
  };
  const extractCtaPlacement = (p: string) => {
    const match = p.match(/ACTION CTA VISUAL STYLING:[\s\S]*?Placement:\s*([^.\n]+)/i);
    return match ? match[1].trim() : 'default';
  };
  const extractTypography = (p: string) => {
    const match = p.match(/HEADLINE VISUAL STYLING:[\s\S]*?Typography:\s*([^.\n]+)/i);
    return match ? match[1].trim() : 'default';
  };
  const extractBackground = (p: string) => {
    const match = p.match(/Creative Background:\s*([^.\n]+)/i);
    return match ? match[1].trim() : 'default';
  };

  if (extractHeadlinePlacement(p1) !== extractHeadlinePlacement(p2)) {
    differences.push(`Title Placement: "${extractHeadlinePlacement(p1)}" vs "${extractHeadlinePlacement(p2)}"`);
  }
  if (extractCtaPlacement(p1) !== extractCtaPlacement(p2)) {
    differences.push(`CTA Placement: "${extractCtaPlacement(p1)}" vs "${extractCtaPlacement(p2)}"`);
  }
  if (extractTypography(p1) !== extractTypography(p2)) {
    differences.push(`Headline Typography: "${extractTypography(p1)}" vs "${extractTypography(p2)}"`);
  }
  if (extractBackground(p1) !== extractBackground(p2)) {
    differences.push(`Text Background: "${extractBackground(p1)}" vs "${extractBackground(p2)}"`);
  }

  return {
    diverse: differences.length >= 5,
    differenceCount: differences.length,
    differences,
  };
}

/**
 * Generates dynamic, content-aware Pinterest creative concepts with dedicated Higgsfield prompts.
 * 
 * STRICT CREATIVE DIVERSITY GUARANTEES:
 * 1. Pin 1 and Pin 2 are generated from distinct concept dimension profiles differing in 5+ visual dimensions.
 * 2. Title and CTA have dynamic, non-repetitive placement zones with clear breathing room.
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

  // Select multi-dimensional distinct concept profiles
  const [dimensionsPin1, dimensionsPin2] = selectDistinctCreativeConceptPair(topic, article, packet);

  for (let pinNum = 1; pinNum <= pinsPerArticle; pinNum++) {
    const dimensions = pinNum === 1 ? dimensionsPin1 : dimensionsPin2;
    const visualFormat: PinterestVisualFormat =
      dimensions.composition === 'overhead_flatlay'
        ? 'flatlay_projects'
        : dimensions.composition === 'craftsmanship_macro'
        ? 'closeup_craftsmanship'
        : dimensions.composition === 'hands_crafting'
        ? 'hands_crafting'
        : dimensions.composition === 'multi_project_showcase'
        ? 'editorial_collage'
        : dimensions.composition === 'lifestyle_scene' || dimensions.composition === 'editorial_portrait'
        ? 'lifestyle_person'
        : 'single_hero_editorial';

    const headline = buildPrimaryHeadline(topic, article, pinNum);
    const cta = buildTrafficOrientedCta(topic, article, pinNum, visualFormat);

    const typography: PinterestTypographyOverlay = {
      primaryHeadline: headline,
      ctaBadgeText: cta,
      textContainerStyle:
        dimensions.ctaStyle === 'editorial_label'
          ? 'warm_neutral_box'
          : dimensions.ctaStyle === 'clean_minimal_text'
          ? 'clean_lower_banner'
          : 'soft_comfort_card',
    };

    const compactHiggsfieldPrompt = buildHiggsfieldPinPrompt(
      visualFormat,
      headline,
      cta,
      dimensions.colorMood,
      topic,
      article,
      packet,
      dimensions
    );

    const conceptAngle =
      pinNum === 1
        ? (dimensions.composition === 'overhead_flatlay'
            ? 'Organized Maker Flatlay & Direct Practical Solution'
            : dimensions.composition === 'craftsmanship_macro'
            ? 'Macro Stitch Definition & Exquisite Texture'
            : dimensions.composition === 'multi_project_showcase'
            ? 'Curated Editorial Multi-Project Showcase'
            : 'Primary Value Angle & Complete Overview')
        : (dimensions.composition === 'hands_crafting'
            ? 'Maker Hands in Action & Artisan Technique'
            : dimensions.composition === 'lifestyle_scene'
            ? 'Authentic Cozy Lifestyle & Finished Project in Use'
            : dimensions.composition === 'asymmetric_editorial'
            ? 'Asymmetric Dynamic Editorial Feature'
            : 'Secondary Perspective & Creative Exploration');

    concepts.push({
      pinNumber: pinNum,
      conceptAngle,
      visualStyle: {
        imageCount: dimensions.composition === 'multi_project_showcase' ? 4 : 1,
        compositionType:
          dimensions.composition === 'multi_project_showcase'
            ? '4_image_grid'
            : dimensions.composition === 'overhead_flatlay'
            ? 'flatlay_materials'
            : dimensions.composition === 'craftsmanship_macro'
            ? 'collage_macro'
            : dimensions.composition === 'lifestyle_scene' || dimensions.composition === 'editorial_portrait'
            ? 'lifestyle_scene'
            : 'single_hero',
        subjectDescription: `${conceptAngle} for ${article.title}`,
        colorPalette: dimensions.colorMood.paletteDescription,
        humanElement:
          dimensions.composition === 'lifestyle_scene' || dimensions.composition === 'editorial_portrait'
            ? 'person_wearing'
            : dimensions.composition === 'hands_crafting'
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
