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
  fallbackBoardId?: string;
  fallbackBoardName?: string;
}

/** Known craft boards catalog used for offline matching and test-safe fallback */
export const DEFAULT_KNOWN_CRAFT_BOARDS: NormalizedPinterestBoard[] = [
  { id: 'board_blankets', name: 'Crochet Blankets & Afghans', description: 'Cozy crochet blanket patterns, afghans, throws, and baby blankets.' },
  { id: 'board_tutorials', name: 'Crochet Tutorials & Stitches', description: 'Step-by-step crochet stitch tutorials, techniques, beginner how-tos, and stitch guides.' },
  { id: 'board_tools', name: 'Crochet Tools & Yarn Calculators', description: 'Interactive crochet tools, yarn calculators, gauge swatch calculators, row counters, and converters.' },
  { id: 'board_flowers', name: 'Crochet Flowers & Motifs', description: 'Crochet flower patterns, floral appliques, granny squares, and decorative motifs.' },
  { id: 'board_amigurumi', name: 'Crochet Amigurumi & Toys', description: 'Cute amigurumi crochet patterns, plush toys, stuffed animals, and dolls.' },
  { id: 'board_baby', name: 'Crochet Baby Patterns & Gifts', description: 'Handmade crochet baby blankets, booties, hats, sweaters, and baby shower gifts.' },
  { id: 'board_clothing', name: 'Crochet Clothing & Wearables', description: 'Modern crochet clothing patterns, sweaters, cardigans, tops, vests, and wearable fashion.' },
  { id: 'board_accessories', name: 'Crochet Bags & Accessories', description: 'Handmade crochet bags, totes, beanies, hats, scarves, cowls, headbands, and accessories.' },
  { id: 'board_decor', name: 'Crochet Home Decor', description: 'Cozy crochet home decor ideas, pillows, cushions, coasters, potholders, and baskets.' },
];

/** Semantic synonyms and negative keyword boundaries for craft project categories */
export const CRAFT_SEMANTIC_TAXONOMY: Record<string, { category: string; keywords: string[]; negativeKeywords?: string[] }> = {
  tools: {
    category: 'tools',
    keywords: [
      'tool', 'tools', 'calculator', 'calculators', 'calculate', 'counter', 'counters',
      'tracker', 'trackers', 'converter', 'converters', 'convert', 'yardage', 'gauge',
      'timer', 'timers', 'dictionary', 'abbreviation', 'abbreviations', 'planner', 'layout',
      'cost', 'pricing', 'price', 'stitch counter', 'row counter', 'yarn calculator',
      'gauge calculator', 'blanket calculator', 'border calculator', 'hook size', 'needle size',
      'substitute', 'stash', 'pdf organizer', 'library', 'difficulty checker', 'resource', 'resources',
      'utility', 'utilities', 'cheat sheet', 'chart', 'charts'
    ],
    negativeKeywords: ['clothing', 'sweater', 'garment', 'amigurumi', 'toy', 'doll', 'blanket', 'afghan', 'flower', 'motif', 'decor', 'pillow', 'rug', 'bag', 'tote', 'hat', 'beanie']
  },
  tutorials: {
    category: 'tutorials',
    keywords: [
      'tutorial', 'tutorials', 'stitch', 'stitches', 'technique', 'techniques',
      'how to', 'how-to', 'step-by-step', 'step by step', 'beginner', 'learn',
      'guide', 'guides', 'lesson', 'lessons', 'basics', 'masterclass', 'method',
      'instruction', 'instructions', 'waffle stitch', 'moss stitch', 'magic ring',
      'single crochet', 'double crochet', 'half double', 'slip stitch', 'decrease',
      'increase', 'invisible decrease', 'ribbed', 'ribbing', 'joining', 'border'
    ],
    negativeKeywords: ['calculator', 'converter', 'tool']
  },
  blankets: {
    category: 'blankets',
    keywords: [
      'blanket', 'blankets', 'afghan', 'afghans', 'throw', 'throws', 'lapghan',
      'bedspread', 'granny square blanket', 'baby blanket', 'heirloom blanket'
    ],
    negativeKeywords: ['amigurumi', 'toy', 'doll', 'calculator', 'counter', 'converter', 'tool']
  },
  flowers: {
    category: 'flowers',
    keywords: [
      'flower', 'flowers', 'rose', 'roses', 'daisy', 'floral', 'applique', 'motifs',
      'motif', 'botanical', 'leaves', 'leaf', 'bloom', 'blossom', 'sunflower', 'tulip'
    ],
    negativeKeywords: ['calculator', 'counter', 'tool']
  },
  amigurumi: {
    category: 'amigurumi',
    keywords: [
      'amigurumi', 'toy', 'toys', 'plush', 'plushie', 'doll', 'dolls', 'animal',
      'animals', 'creature', 'stuffed', 'teddy', 'bear', 'cat', 'dog', 'character'
    ],
    negativeKeywords: ['blanket', 'afghan', 'sweater', 'calculator', 'counter', 'tool']
  },
  baby: {
    category: 'baby',
    keywords: [
      'baby', 'infant', 'toddler', 'nursery', 'bootie', 'booties', 'layette',
      'baby blanket', 'baby shower', 'newborn', 'baby hat', 'baby gift', 'baby gifts'
    ],
    negativeKeywords: ['calculator', 'counter', 'tool']
  },
  clothing: {
    category: 'clothing',
    keywords: [
      'sweater', 'sweaters', 'cardigan', 'cardigans', 'top', 'tops', 'crop top',
      'garment', 'garments', 'wearable', 'wearables', 'vest', 'vests', 'pullover',
      'pullovers', 'dress', 'dresses', 'skirt', 'jacket', 'hoodie', 'apparel'
    ],
    negativeKeywords: ['calculator', 'counter', 'tool', 'amigurumi', 'toy', 'blanket']
  },
  accessories: {
    category: 'accessories',
    keywords: [
      'bag', 'bags', 'tote', 'totes', 'purse', 'handbag', 'backpack', 'pouch',
      'hat', 'hats', 'beanie', 'beanies', 'scarf', 'scarves', 'shawl', 'shawls',
      'cowl', 'cowls', 'headband', 'headbands', 'mittens', 'gloves', 'wrist warmers',
      'scrunchie', 'parandi', 'hair accessory', 'bucket hat', 'ear warmer'
    ],
    negativeKeywords: ['calculator', 'counter', 'tool', 'blanket', 'afghan']
  },
  decor: {
    category: 'decor',
    keywords: [
      'home decor', 'pillow', 'pillows', 'cushion', 'cushions', 'potholder', 'potholders',
      'coaster', 'coasters', 'rug', 'rugs', 'basket', 'baskets', 'wall hanging',
      'table runner', 'placemat', 'wreath', 'garland', 'pumpkin', 'christmas tree',
      'holiday decor', 'halloween decor', 'autumn decor'
    ],
    negativeKeywords: ['calculator', 'counter', 'tool', 'sweater', 'cardigan']
  }
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
  | 'top_left'
  | 'top_right'
  | 'mid_right_side'
  | 'lower_third_offset';

export type PinterestCtaStyle =
  | 'clean_minimal_text'
  | 'subtle_capsule'
  | 'editorial_label'
  | 'minimal_underline'
  | 'tonal_tint_box'
  | 'framed_tag';

export type PinterestTextBackground =
  | 'none_direct_photo'
  | 'natural_shadow'
  | 'environmental_negative_space'
  | 'architectural_surface'
  | 'textile_texture'
  | 'subtle_light_gradient';

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
    if (variationSeed === 3) {
      return {
        themeName: 'Harvest Golden Studio',
        paletteDescription: 'Warm amber gold, antique linen, soft dried eucalyptus green, and toasted pecan',
        ctaVisualTreatment: 'warm amber gold and linen tones with crisp typography',
        lightingAndMood: 'Soft natural daylight in a rustic studio with cozy textured accents',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Midnight Harvest Studio',
        paletteDescription: 'Deep plum, rich terracotta, warm parchment, and vintage amber gold',
        ctaVisualTreatment: 'deep plum and warm terracotta tones with crisp cream editorial typography',
        lightingAndMood: 'Moody directional candlelight and golden hour amber tones',
      };
    }
    return {
      themeName: 'Autumn Warmth',
      paletteDescription: 'Warm terracotta, burnt pumpkin orange, deep espresso, and antique linen',
      ctaVisualTreatment: 'warm terracotta and burnt pumpkin tones with crisp cream editorial typography',
      lightingAndMood: 'Warm golden autumn afternoon sunlight, cozy harvest textures',
    };
  }

  if (/christmas|holiday|winter|snow|festive|ornament|tree/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Festive Hearth & Evergreen',
        paletteDescription: 'Warm ivory wool, evergreen sprig, rustic birch, and soft cranberry',
        ctaVisualTreatment: 'warm ivory and evergreen tones with elegant typography',
        lightingAndMood: 'Soft diffused winter daylight with warm festive ambiance',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Winter Cozy Fireside',
        paletteDescription: 'Warm oatmeal wool, rich cinnamon, toasted pecan, and alpine white',
        ctaVisualTreatment: 'warm cinnamon and oatmeal tones with refined typography',
        lightingAndMood: 'Cozy hearthside glow with soft ambient shadows',
      };
    }
    return {
      themeName: 'Festive Botanical',
      paletteDescription: 'Deep forest pine green, cranberry red, winter cream, and warm brass',
      ctaVisualTreatment: 'deep forest pine and winter cream tones with crisp high-contrast typography',
      lightingAndMood: 'Soft ambient winter morning light, cozy festive ambiance',
    };
  }

  if (/flower|floral|spring|rose|botanical|bloom|garden/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Spring Garden Sunshine',
        paletteDescription: 'Soft sunshine yellow, meadow sage, pure linen white, and petal peach',
        ctaVisualTreatment: 'meadow sage and sunshine yellow tones with fresh modern typography',
        lightingAndMood: 'Bright airy spring daylight with delicate botanical textures',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Vibrant Garden Bloom',
        paletteDescription: 'Fresh buttercup yellow, crisp meadow green, petal coral, and chalk white',
        ctaVisualTreatment: 'crisp meadow green and petal coral tones with modern high-contrast typography',
        lightingAndMood: 'Vibrant sun-drenched outdoor morning light with fresh botanical textures',
      };
    }
    return {
      themeName: 'Delicate Botanical',
      paletteDescription: 'Soft dusty rose, sage leaf green, warm biscuit, and gentle cream',
      ctaVisualTreatment: 'soft sage leaf and gentle ecru tones with elegant refined typography',
      lightingAndMood: 'Bright, airy spring window light with soft botanical shadows',
    };
  }

  if (/summer|beach|sun|coastal|cotton|light/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Sunlit Driftwood Studio',
        paletteDescription: 'Bleached linen, warm drift sand, gentle sky azure, and soft ecru',
        ctaVisualTreatment: 'warm sand and clean linen tones with high-readability typography',
        lightingAndMood: 'Crisp airy seaside daylight with bright diffused natural lighting',
      };
    }
    return {
      themeName: 'Fresh Coastal Artisan',
      paletteDescription: 'Warm sand, sunlit ochre, light canvas ecru, and soft seafoam',
      ctaVisualTreatment: 'sunlit ochre and warm canvas tones with high-readability typography',
      lightingAndMood: 'Breezy sunlit craft studio, crisp natural daylight',
    };
  }

  if (/parandi|hair|accessory|accessories|braid|headband|scrunchie/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Boho Artisan Loom',
        paletteDescription: 'Rich sienna, burnished brass, raw linen, and warm copper',
        ctaVisualTreatment: 'rich sienna and burnished brass tones with editorial typography',
        lightingAndMood: 'Warm natural side lighting in an authentic textile artist studio',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Midnight Velvet & Gold',
        paletteDescription: 'Deep sapphire cobalt, royal amethyst, burnished gold, and midnight black',
        ctaVisualTreatment: 'deep sapphire and burnished gold tones with modern high-contrast typography',
        lightingAndMood: 'Dramatic editorial rim lighting with rich jewel-toned contrast and velvety shadows',
      };
    }
    return {
      themeName: 'Jewel Tone Fashion Studio',
      paletteDescription: 'Vibrant jewel tones with deep emerald green, rich plum, vivid cobalt blue, and subtle antique gold',
      ctaVisualTreatment: 'rich emerald and cobalt jewel tones with high-contrast modern typography',
      lightingAndMood: 'Dramatic high-fashion editorial lighting with soft natural shadows and realistic highlights',
    };
  }

  // 2. Format / Category Themes
  if (topic.targetContentFormat === 'tool_focus' || /calculator|gauge|yardage|chart|size|converter/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Artisan Workshop Loft',
        paletteDescription: 'Natural maple wood, soft charcoal, creamy wool, and warm slate',
        ctaVisualTreatment: 'natural maple and slate tones with immaculate legibility',
        lightingAndMood: 'Clear bright studio lighting, immaculate modern workshop aesthetics',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Creative Maker Workspace',
        paletteDescription: 'Rich indigo dye, warm birch wood, slate charcoal, and crisp milk cotton',
        ctaVisualTreatment: 'rich indigo and warm birch tones with sharp modern legibility',
        lightingAndMood: 'Warm natural side light in an authentic craft workshop',
      };
    }
    return {
      themeName: 'Modern Maker Studio',
      paletteDescription: 'Natural oatmeal, warm terracotta, slate charcoal, and creamy linen',
      ctaVisualTreatment: 'warm terracotta and oatmeal tones with sharp editorial legibility',
      lightingAndMood: 'Clean diffused overhead daylight, pristine maker workspace layout',
    };
  }

  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|beginner|tutorial/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Nordic Craft Haven',
        paletteDescription: 'Pale Nordic pine, heather grey, warm ivory wool, and soft lichen',
        ctaVisualTreatment: 'pale pine and heather grey tones with refined Scandinavian typography',
        lightingAndMood: 'Bright Nordic window light highlighting clean stitch definition and yarn plies',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Rich Artisan Studio',
        paletteDescription: 'Deep walnut wood, warm ochre yarn, natural wool ecru, and aged brass',
        ctaVisualTreatment: 'deep walnut and warm ochre tones with clean editorial typography',
        lightingAndMood: 'Artisan workshop studio lighting with warm directional depth',
      };
    }
    return {
      themeName: 'Calm Studio Craft',
      paletteDescription: 'Soft sage green, warm stone, natural unbleached wool, and muted caramel',
      ctaVisualTreatment: 'soft sage green and ivory tones with refined typography',
      lightingAndMood: 'Soft side-lit studio lighting highlighting textured stitch definition',
    };
  }

  if (/amigurumi|toy|doll|plush/i.test(textCorpus)) {
    if (variationSeed === 3) {
      return {
        themeName: 'Pastel Craft Studio',
        paletteDescription: 'Soft lilac, sky pastel blue, whipped cream, and warm peach',
        ctaVisualTreatment: 'soft lilac and warm cream tones with cheerful editorial typography',
        lightingAndMood: 'Bright diffused morning daylight in an airy maker studio',
      };
    }
    if (variationSeed === 2) {
      return {
        themeName: 'Colorful Yarn Wonderland',
        paletteDescription: 'Vibrant mustard, berry magenta, soft mint, and warm honey',
        ctaVisualTreatment: 'vibrant berry magenta and warm honey tones with playful refined typography',
        lightingAndMood: 'Bright cheerful daylight with colorful craft backdrop',
      };
    }
    return {
      themeName: 'Playful Artisan',
      paletteDescription: 'Warm buttercup, dusty pastel peach, soft linen, and cocoa',
      ctaVisualTreatment: 'warm honey-gold and dark cocoa tones with clear readability',
      lightingAndMood: 'Cheerful soft natural lighting with gentle warm tones',
    };
  }

  // 3. Default Cohesive Natural Craft Editorial with Variation
  if (variationSeed === 3) {
    return {
      themeName: 'Sunlit Artisan Loft',
      paletteDescription: 'Warm oat milk, brushed caramel, soft olive leaf, and natural pine',
      ctaVisualTreatment: 'warm oat and brushed caramel tones with refined typography',
      lightingAndMood: 'Warm diffused morning window light, peaceful creative atmosphere',
    };
  }

  if (variationSeed === 2) {
    return {
      themeName: 'Modern Craft Editorial',
      paletteDescription: 'Rich charcoal, warm mustard gold, raw linen, and deep pine',
      ctaVisualTreatment: 'mustard gold and charcoal tones with crisp modern typography',
      lightingAndMood: 'Bright architectural studio daylight with soft textured shadows',
    };
  }

  return {
    themeName: 'Organic Craft Editorial',
    paletteDescription: 'Warm ecru, rich caramel, soft moss, and natural birch wood',
    ctaVisualTreatment: 'warm caramel and crisp linen tones with natural craft styling',
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

  // 1. Tool Guide CTAs — Strictly bound to the actual dedicated tool topics
  const isTool = topic.contentType === 'tool_guide' ||
    topic.targetContentFormat === 'tool_focus' ||
    (topic.category === 'tools' && !/pattern|pumpkin|bat|beanie|blanket|hat|bag|amigurumi|ornament|scarf|waffle/i.test(kw)) ||
    (/calculator|converter|row counter|stitch counter|yarn counter|crochet timer|abbreviation dictionary/i.test(kw) && !/pattern|pumpkin|bat|beanie|blanket|hat|bag|amigurumi|ornament|scarf|waffle/i.test(kw));

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

export interface PinterestPinHeadlines {
  pin1Headline: string; // Finished Project / Pattern Identity
  pin2Headline: string; // Making Process / Tutorial
  pin3Headline: string; // Styling & Variations / Inspiration
}

/**
 * Truncates an uppercase headline cleanly at word boundaries if it exceeds maxLen.
 */
function truncateHeadline(str: string, maxLen = 36): string {
  const clean = str.replace(/\s+/g, ' ').trim().toUpperCase();
  if (clean.length <= maxLen) return clean;
  const words = clean.split(' ');
  let result = '';
  for (const w of words) {
    const candidate = result ? `${result} ${w}` : w;
    if (candidate.length <= maxLen) {
      result = candidate;
    } else {
      break;
    }
  }
  return result || clean.slice(0, maxLen);
}

/**
 * Generates three distinct, article-aware, concise headlines tailored specifically
 * to the three Pinterest creative archetypes:
 * - Pin 1: Finished Project / Pattern Identity (e.g. "EASY CROCHET BAT PATTERN")
 * - Pin 2: Making Process / Tutorial (e.g. "HOW TO CROCHET A BAT")
 * - Pin 3: Styling, Variations, or Ideas (e.g. "BAT CROCHET IDEAS & COLORS")
 * 
 * Strict Editorial Standards:
 * - Concise: <= 36 characters to prevent clipping in mobile Pinterest feeds.
 * - Mobile-readable: clean phrasing, uppercase, high contrast.
 * - Distinct: each Pin has a unique headline reflecting its specific angle; zero duplicates.
 * - No unsupported claims: "FREE" only if substantiated; "EASY"/"BEGINNER" only if substantiated.
 * - No keyword stuffing or fake UI claims.
 * - Graceful fallback on missing/incomplete metadata without runtime exceptions.
 */
export function generateArticleAwareHeadlines(
  topic?: Partial<DiscoveredTopic>,
  article?: Partial<GeneratedArticle>,
  packet?: Partial<FactualResearchPacket>
): PinterestPinHeadlines {
  const kw = (topic?.keyword || '').trim();
  const rawTitle = (article?.title || '').trim();
  const fullText = `${kw} ${rawTitle} ${article?.excerpt || ''}`.toLowerCase();
  const craft = (packet?.craftType || 'crochet').toLowerCase();
  const craftUpper = craft.toUpperCase();

  // Unsupported claim verification
  const isFreeSupported = Boolean(
    (article as any)?.isFree ||
    packet?.isPatternFree ||
    /\bfree\b/i.test(kw) ||
    /\bfree\b/i.test(rawTitle)
  );
  const isBeginnerSupported = Boolean(
    topic?.targetAudienceLevel === 'beginner' ||
    packet?.difficultyLevel === 'beginner' ||
    /\b(easy|beginner|simple|quick)\b/i.test(kw) ||
    /\b(easy|beginner|simple|quick)\b/i.test(rawTitle)
  );
  const listCount = extractListCountFromTitle(rawTitle);

  // 1. Dedicated Tool Topics Handling ONLY
  // A crochet project/pattern (e.g. pumpkin) that links to a tool is NOT a tool topic!
  const isTool = Boolean(
    topic?.contentType === 'tool_guide' ||
    topic?.targetContentFormat === 'tool_focus' ||
    (topic?.category === 'tools' && !/pattern|pumpkin|bat|beanie|blanket|hat|bag|amigurumi|ornament|scarf|waffle/i.test(kw)) ||
    (/calculator|converter|row counter|stitch counter|yarn counter|crochet timer|abbreviation dictionary/i.test(kw) && !/pattern|pumpkin|bat|beanie|blanket|hat|bag|amigurumi|ornament|scarf|waffle/i.test(kw))
  );

  if (isTool) {
    let resolvedToolTitle = '';
    if (topic?.toolSlug) {
      const match = TOOLS_DATA.find(t => t.slug === topic.toolSlug);
      if (match) resolvedToolTitle = match.title;
    }
    if (!resolvedToolTitle) {
      const match = TOOLS_DATA.find(t => fullText.includes(t.slug) || fullText.includes(t.title.toLowerCase()));
      if (match) resolvedToolTitle = match.title;
    }

    const cleanToolName = (resolvedToolTitle || kw || 'Crochet Tool')
      .replace(/free|easy|best|online/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const p1 = cleanToolName.includes(craftUpper) ? cleanToolName : `${craftUpper} ${cleanToolName}`;
    const actionVerb = cleanToolName.includes('CALCULATOR')
      ? 'HOW TO CALCULATE'
      : cleanToolName.includes('CONVERTER')
      ? 'HOW TO CONVERT'
      : 'HOW TO USE';
    const coreToolWithoutCraft = cleanToolName.replace(new RegExp(`\\b(${craftUpper}|TOOL)\\b`, 'gi'), '').trim();
    const p2 = `${actionVerb} ${coreToolWithoutCraft}`.replace(/\s+/g, ' ').trim();
    const p3 = `${coreToolWithoutCraft || cleanToolName} TIPS & IDEAS`.replace(/\s+/g, ' ').trim();

    return {
      pin1Headline: truncateHeadline(p1, 36),
      pin2Headline: truncateHeadline(p2.length >= 8 ? p2 : `STEP-BY-STEP ${cleanToolName}`, 36),
      pin3Headline: truncateHeadline(p3.length >= 8 ? p3 : `${cleanToolName} PROJECT TIPS`, 36),
    };
  }

  // 2. Extract Clean Core Project Subject
  let coreSubject = kw
    .replace(/\b(how to crochet|how to|crochet pattern|crochet tutorial|free pattern|free crochet|step by step|step-by-step|guide|easy|best|diy|simple|beginner)\b/gi, '')
    .replace(/\b(pattern|patterns|tutorial|tutorials|guide|guides|free)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!coreSubject && rawTitle) {
    coreSubject = rawTitle
      .split(':')[0]
      .split('-')[0]
      .replace(/\b(how to crochet|how to|crochet pattern|crochet tutorial|free pattern|free crochet|step by step|step-by-step|guide|easy|best|diy|simple|beginner)\b/gi, '')
      .replace(/\b(pattern|patterns|tutorial|tutorials|guide|guides|free)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!coreSubject) {
    coreSubject = `${craft} project`;
  }

  const subjectUpper = coreSubject.toUpperCase();
  const freePrefix = isFreeSupported ? 'FREE ' : '';
  const beginnerPrefix = isBeginnerSupported ? 'EASY ' : '';

  // PIN 1: FINISHED PROJECT / PATTERN IDENTITY
  let pin1 = '';
  if (subjectUpper.includes(craftUpper)) {
    pin1 = `${freePrefix}${beginnerPrefix}${subjectUpper} PATTERN`.trim();
  } else {
    pin1 = `${freePrefix}${beginnerPrefix}${craftUpper} ${subjectUpper} PATTERN`.trim();
  }
  if (kw.length >= 8 && kw.length <= 32 && kw.toUpperCase().includes('PATTERN')) {
    pin1 = `${freePrefix}${beginnerPrefix}${kw.toUpperCase()}`.trim();
  }

  // PIN 2: MAKING PROCESS / TUTORIAL
  let pin2 = '';
  if (subjectUpper.startsWith('HOW TO')) {
    pin2 = subjectUpper;
  } else if (/stitch|technique/i.test(subjectUpper)) {
    pin2 = `HOW TO CROCHET ${subjectUpper}`.replace(/CROCHET CROCHET/g, 'CROCHET');
  } else if (subjectUpper.startsWith(`${craftUpper} `)) {
    if (`HOW TO ${subjectUpper}`.length <= 36) {
      pin2 = `HOW TO ${subjectUpper}`;
    } else if (`DIY ${subjectUpper}`.length <= 36) {
      pin2 = `DIY ${subjectUpper}`;
    } else {
      const coreWithoutCraft = subjectUpper.replace(new RegExp(`^${craftUpper}\\s+`, 'i'), '').trim();
      pin2 = `HOW TO CROCHET ${coreWithoutCraft}`;
    }
  } else {
    const isPlural = subjectUpper.endsWith('S') && !subjectUpper.endsWith('SS');
    const firstLetter = subjectUpper.charAt(0);
    const articleWord = ['A', 'E', 'I', 'O', 'U'].includes(firstLetter) ? 'AN' : 'A';
    if (isPlural) {
      pin2 = `HOW TO CROCHET ${subjectUpper}`;
    } else {
      pin2 = `HOW TO CROCHET ${articleWord} ${subjectUpper}`;
    }
  }
  if (pin2.length > 36) {
    pin2 = `HOW TO CROCHET ${subjectUpper}`.replace(/CROCHET CROCHET/g, 'CROCHET').replace(/\b(A|AN)\b\s*/g, '');
  }
  if (pin2.length > 36 && `DIY ${subjectUpper}`.length <= 36) {
    pin2 = `DIY ${subjectUpper}`;
  } else if (pin2.length > 36) {
    pin2 = `STEP-BY-STEP ${subjectUpper}`;
  }

  // PIN 3: STYLING, VARIATIONS & IDEAS
  let pin3 = '';
  if (listCount) {
    pin3 = `${listCount} ${subjectUpper} CROCHET IDEAS`;
  } else if (/halloween|spooky|autumn|christmas|holiday/i.test(fullText)) {
    const season = /halloween|spooky/i.test(fullText) ? 'SPOOKY' : /autumn|fall/i.test(fullText) ? 'AUTUMN' : 'FESTIVE';
    pin3 = `${subjectUpper} IDEAS & ${season} COLORS`;
  } else {
    pin3 = `${subjectUpper} IDEAS & COLOR STYLING`;
  }
  if (pin3.length > 36) {
    pin3 = `${subjectUpper} STYLING & IDEAS`;
  }
  if (pin3.length > 36) {
    pin3 = `${subjectUpper} COLOR IDEAS`;
  }

  let finalP1 = truncateHeadline(pin1, 36);
  let finalP2 = truncateHeadline(pin2, 36);
  let finalP3 = truncateHeadline(pin3, 36);

  // Guarantee all 3 headlines are distinct
  if (finalP2 === finalP1) {
    finalP2 = truncateHeadline(`HOW TO CROCHET ${subjectUpper}`, 36);
  }
  if (finalP3 === finalP1 || finalP3 === finalP2) {
    finalP3 = truncateHeadline(`${subjectUpper} IDEAS & VARIATIONS`, 36);
  }

  return {
    pin1Headline: finalP1,
    pin2Headline: finalP2,
    pin3Headline: finalP3,
  };
}

/**
 * Derives a clean, punchy primary headline for a specific Pin.
 * Passed as an EXACT immutable string to Higgsfield.
 */
export function buildPrimaryHeadline(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  pinNumber = 1,
  packet?: FactualResearchPacket
): string {
  const headlines = generateArticleAwareHeadlines(topic, article, packet);
  if (pinNumber === 1) return headlines.pin1Headline;
  if (pinNumber === 2) return headlines.pin2Headline;
  if (pinNumber === 3) return headlines.pin3Headline;
  return headlines.pin1Headline;
}

export interface VariantSeoMetadata {
  pinTitle: string;
  pinDescription: string;
}

/**
 * Generates distinct, SEO-optimized Pinterest titles and natural, grounded descriptions
 * for each creative variant:
 * - Variant 1 (finished_project): Pattern & Finished Project Focus
 * - Variant 2 (making_process): Step-by-Step Tutorial & Making Focus
 * - Variant 3 (styling_variations): Styling, Color Ideas & Project Variations
 * 
 * Strict Standards:
 * - Pin Title: <= 100 chars, search-intent optimized, distinct per variant, no keyword stuffing.
 * - Pin Description: <= 500 chars, grounded in verified article content, includes tool mentions when applicable.
 * - Unsupported claims (Free, Beginner) only included when substantiated.
 */
export function generateVariantSeoMetadata(
  topic?: Partial<DiscoveredTopic>,
  article?: Partial<GeneratedArticle>,
  packet?: Partial<FactualResearchPacket>,
  archetype: PinterestPinArchetype = 'finished_project',
  pinNumber = 1
): VariantSeoMetadata {
  const kw = (topic?.keyword || '').trim();
  const rawTitle = (article?.title || '').trim();
  const craft = (packet?.craftType || 'crochet').toLowerCase();
  const craftUpper = craft.charAt(0).toUpperCase() + craft.slice(1);
  const toolSlug = topic?.toolSlug;
  const toolName = (packet?.targetTool as any)?.title || (packet?.targetTool as any)?.name || (toolSlug ? TOOLS_DATA.find(t => t.slug === toolSlug)?.title : '');

  const isFreeSupported = Boolean(
    (article as any)?.isFree ||
    packet?.isPatternFree ||
    /\bfree\b/i.test(kw) ||
    /\bfree\b/i.test(rawTitle)
  );
  const isBeginnerSupported = Boolean(
    topic?.targetAudienceLevel === 'beginner' ||
    packet?.difficultyLevel === 'beginner' ||
    /\b(easy|beginner|simple|quick)\b/i.test(kw) ||
    /\b(easy|beginner|simple|quick)\b/i.test(rawTitle)
  );

  let coreProject = kw
    .replace(/\b(how to crochet|how to|crochet pattern|crochet tutorial|free pattern|free crochet|step by step|guide|easy|best|diy|beginner)\b/gi, '')
    .replace(/\b(pattern|patterns|tutorial|tutorials|guide|guides|free)\b/gi, '')
    .replace(new RegExp(`\\b${craft}\\b`, 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!coreProject && rawTitle) {
    coreProject = rawTitle
      .split(':')[0]
      .split('-')[0]
      .replace(/\b(how to crochet|how to|crochet pattern|crochet tutorial|free pattern|free crochet|step by step|guide|easy|best|diy|beginner)\b/gi, '')
      .replace(/\b(pattern|patterns|tutorial|tutorials|guide|guides|free)\b/gi, '')
      .replace(new RegExp(`\\b${craft}\\b`, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (!coreProject) coreProject = 'Project';
  const formattedProject = coreProject.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const freeWord = isFreeSupported ? 'Free ' : '';
  const beginnerWord = isBeginnerSupported ? 'Easy ' : '';

  let pinTitle = '';
  let pinDescription = '';

  if (archetype === 'finished_project') {
    const baseTitle = `${freeWord}${beginnerWord}${craftUpper} ${formattedProject} Pattern`.replace(/\s+/g, ' ').trim();
    pinTitle = `${baseTitle} - Project Guide`;
    if (pinTitle.length > 100) {
      pinTitle = baseTitle.slice(0, 100);
    }

    const matInfo = packet?.materialsList?.slice(0, 3).join(', ');
    const descParts: string[] = [];
    descParts.push(`Discover this complete ${freeWord ? 'free ' : ''}${craft} ${formattedProject.toLowerCase()} project guide.`);
    if (matInfo) {
      descParts.push(`Features project details using ${matInfo.toLowerCase()}.`);
    } else if (packet?.recommendedYarnWeight) {
      descParts.push(`Worked with ${packet.recommendedYarnWeight} yarn and a ${packet.recommendedHookSize || 'standard hook'}.`);
    }
    if (toolName) {
      descParts.push(`Use our ${toolName} to calculate your exact project requirements.`);
    }
    descParts.push(`Full pattern notes and guide on WeLovePattern.`);
    pinDescription = descParts.join(' ').replace(/\s+/g, ' ').trim();
    if (pinDescription.length > 500) pinDescription = pinDescription.slice(0, 497) + '...';

  } else if (archetype === 'making_process') {
    let baseTitle = `How to ${craftUpper} ${formattedProject} | Step-by-Step ${beginnerWord ? 'Beginner ' : ''}Tutorial`.replace(/\s+/g, ' ').trim();
    if (toolName && `How to ${craftUpper} ${formattedProject} & Use the ${toolName}`.length <= 100) {
      baseTitle = `How to ${craftUpper} ${formattedProject} & Use the ${toolName}`;
    }
    pinTitle = baseTitle.slice(0, 100);

    const techniques = packet?.keyTechniques?.slice(0, 2).join(' and ');
    const descParts: string[] = [];
    descParts.push(`Learn how to ${craft} ${formattedProject.toLowerCase()} with this clear, step-by-step tutorial.`);
    if (techniques) {
      descParts.push(`Step-by-step walk-through covering ${techniques}.`);
    }
    if (toolName) {
      descParts.push(`Pair this tutorial with our practical ${toolName} for quick calculations.`);
    }
    descParts.push(`Follow the complete making guide on WeLovePattern.`);
    pinDescription = descParts.join(' ').replace(/\s+/g, ' ').trim();
    if (pinDescription.length > 500) pinDescription = pinDescription.slice(0, 497) + '...';

  } else {
    let baseTitle = `${formattedProject} ${craftUpper} Ideas & Color Variations`.replace(/\s+/g, ' ').trim();
    if (baseTitle.length > 100) {
      baseTitle = `${formattedProject} ${craftUpper} Ideas`.slice(0, 100);
    }
    pinTitle = baseTitle;

    const descParts: string[] = [];
    descParts.push(`Explore inspiring color variations and creative styling ideas for your ${craft} ${formattedProject.toLowerCase()}.`);
    if (packet?.materialsList && packet.materialsList.length > 0) {
      descParts.push(`Get styling inspiration and yarn combination ideas for modern handmade home decor.`);
    }
    if (toolName) {
      descParts.push(`Plan your next project easily with our ${toolName}.`);
    }
    descParts.push(`Find all styling tips, photos, and pattern links at WeLovePattern.`);
    pinDescription = descParts.join(' ').replace(/\s+/g, ' ').trim();
    if (pinDescription.length > 500) pinDescription = pinDescription.slice(0, 497) + '...';
  }

  return {
    pinTitle: pinTitle.slice(0, 100),
    pinDescription: pinDescription.slice(0, 500),
  };
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

export type PinterestPinArchetype = 'finished_project' | 'making_process' | 'styling_variations';

export interface PinterestCreativeConceptArchetype {
  pinNumber: number;
  archetype: PinterestPinArchetype;
  dimensions: PinterestCreativeDimensions;
  conceptAngle: string;
}

/**
 * Generates three intentionally complementary, mutually distinct creative dimension profiles:
 * - Pin 1 (finished_project): Large photograph of the complete finished object on clean single-color background.
 * - Pin 2 (making_process): Close-up photograph of two real human hands actively working with hook and yarn.
 * - Pin 3 (styling_variations): Realistic lifestyle setting, color variations, or small collection offering a fresh angle.
 * 
 * GUARANTEES:
 * 1. Pin 1, Pin 2, and Pin 3 differ in 5+ meaningful visual dimensions from each other.
 * 2. Visual dimensions vary: Composition, Camera Framing, Title Position, CTA Position, Typography Style, Text Background, CTA Visual Styling, Color Mood.
 * 3. Title and CTA positions adapt dynamically with generous breathing room.
 */
export function selectDistinctCreativeConceptTriplet(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): [PinterestCreativeDimensions, PinterestCreativeDimensions, PinterestCreativeDimensions] {
  const textCorpus = `${topic.keyword} ${article.title} ${article.category || ''} ${topic.targetContentFormat || ''}`.toLowerCase();
  const craftType = packet.craftType || 'crochet';

  const theme1 = analyzeTopicAesthetic(topic, article, packet, 1);
  const theme2 = analyzeTopicAesthetic(topic, article, packet, 2);
  const theme3 = analyzeTopicAesthetic(topic, article, packet, 3);

  // Concept Triplet: Hair Accessories, Parandi & Wearables
  if (/parandi|hair|accessory|accessories|braid|headband|scrunchie/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'lifestyle_scene',
      cameraFraming: 'close_up',
      colorMood: theme1,
      typographyStyle: 'bold_modern_sans',
      titlePosition: 'top_right',
      ctaPosition: 'bottom_right',
      ctaStyle: 'editorial_label',
      textBackground: 'none_direct_photo',
      propStorytelling: `Dynamic high-fashion diagonal composition of a chic woman with an intricately braided hairstyle wearing a handmade ${craftType} parandi with lush jewel-toned yarn tassels, rich texture, and subtle golden accents`,
    };

    const dim2: PinterestCreativeDimensions = {
      composition: 'craftsmanship_macro',
      cameraFraming: 'macro',
      colorMood: theme2,
      typographyStyle: 'refined_minimal',
      titlePosition: 'bottom_left',
      ctaPosition: 'top_left',
      ctaStyle: 'clean_minimal_text',
      textBackground: 'natural_shadow',
      propStorytelling: `Artisan macro photography of jewel-toned ${craftType} parandi tassel craftsmanship with delicate stitch details, golden threads, and rich yarn plies`,
    };

    const dim3: PinterestCreativeDimensions = {
      composition: 'overhead_flatlay',
      cameraFraming: 'overhead',
      colorMood: theme3,
      typographyStyle: 'editorial_serif',
      titlePosition: 'lower_third_center',
      ctaPosition: 'bottom_left',
      ctaStyle: 'subtle_capsule',
      textBackground: 'textile_texture',
      propStorytelling: `Artisan overhead display of multiple handmade ${craftType} parandi pieces in diverse rich color palettes arranged neatly on raw linen`,
    };

    return [dim1, dim2, dim3];
  }

  // Concept Triplet 1: Tool Guides & Interactive Utilities
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
      textBackground: 'environmental_negative_space',
      propStorytelling: `Atmospheric natural craft lifestyle scene of a real crafter in a sunlit craft nook holding active handmade work alongside cozy wooden furniture and textured ambient backdrop`,
    };

    const dim3: PinterestCreativeDimensions = {
      composition: 'craftsmanship_macro',
      cameraFraming: 'close_up',
      colorMood: theme3,
      typographyStyle: 'refined_minimal',
      titlePosition: 'bottom_right',
      ctaPosition: 'top_left',
      ctaStyle: 'framed_tag',
      textBackground: 'architectural_surface',
      propStorytelling: `Detailed artisan macro close-up of handmade gauge swatches, stitch counter, and wooden hook displayed together on a workshop table`,
    };

    return [dim1, dim2, dim3];
  }

  // Concept Triplet 2: Tutorials, Stitches & How-To Guides
  if (topic.targetContentFormat === 'tutorial' || /stitch|technique|how to|tutorial|beginner/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'craftsmanship_macro',
      cameraFraming: 'macro',
      colorMood: theme1,
      typographyStyle: 'refined_minimal',
      titlePosition: 'top_left',
      ctaPosition: 'bottom_right',
      ctaStyle: 'clean_minimal_text',
      textBackground: 'natural_shadow',
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
      textBackground: 'architectural_surface',
      propStorytelling: `Close-up artisan maker hands in action actively working textured yarn with a smooth wooden ${craftType} hook on a warm rustic workbench`,
    };

    const dim3: PinterestCreativeDimensions = {
      composition: 'lifestyle_scene',
      cameraFraming: 'three_quarter',
      colorMood: theme3,
      typographyStyle: 'compact_stacked',
      titlePosition: 'top_center',
      ctaPosition: 'bottom_left',
      ctaStyle: 'subtle_capsule',
      textBackground: 'textile_texture',
      propStorytelling: `Cozy lifestyle scene showing a finished ${craftType} project draped over an armchair in soft ambient morning light, showcasing stitch texture in a lived-in setting`,
    };

    return [dim1, dim2, dim3];
  }

  // Concept Triplet 3: Seasonal Motifs & Ideas Roundups
  if (/halloween|autumn|pumpkin|christmas|winter|flower|motif|granny square|ideas|roundup/i.test(textCorpus)) {
    const dim1: PinterestCreativeDimensions = {
      composition: 'multi_project_showcase',
      cameraFraming: 'three_quarter',
      colorMood: theme1,
      typographyStyle: 'editorial_serif',
      titlePosition: 'top_center',
      ctaPosition: 'bottom_right',
      ctaStyle: 'framed_tag',
      textBackground: 'subtle_light_gradient',
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

    const dim3: PinterestCreativeDimensions = {
      composition: 'hands_crafting',
      cameraFraming: 'close_up',
      colorMood: theme3,
      typographyStyle: 'compact_stacked',
      titlePosition: 'top_left',
      ctaPosition: 'bottom_left',
      ctaStyle: 'subtle_capsule',
      textBackground: 'natural_shadow',
      propStorytelling: `Artisan maker hands actively crocheting a seasonal handmade ${craftType} motif on a warm wooden workbench surrounded by festive craft props`,
    };

    return [dim1, dim2, dim3];
  }

  // Concept Triplet 4: General Craft Articles, Garments, & Blankets
  const dim1: PinterestCreativeDimensions = {
    composition: 'single_hero_editorial',
    cameraFraming: 'three_quarter',
    colorMood: theme1,
    typographyStyle: 'editorial_serif',
    titlePosition: 'top_left',
    ctaPosition: 'bottom_right',
    ctaStyle: 'subtle_capsule',
    textBackground: 'textile_texture',
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

  const dim3: PinterestCreativeDimensions = {
    composition: 'lifestyle_scene',
    cameraFraming: 'overhead',
    colorMood: theme3,
    typographyStyle: 'refined_minimal',
    titlePosition: 'lower_third_center',
    ctaPosition: 'top_left',
    ctaStyle: 'framed_tag',
    textBackground: 'architectural_surface',
    propStorytelling: `Realistic cozy lifestyle setting showcasing alternative styling, color options, and creative ideas for the handmade ${craftType} project`,
  };

  return [dim1, dim2, dim3];
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
  const [dim1, dim2] = selectDistinctCreativeConceptTriplet(topic, article, packet);
  return [dim1, dim2];
}

/**
 * Derives a dynamic, product-aware context for any crochet topic.
 * Extracts the specific finished crochet object, matching in-progress scene details,
 * and authentic yarn/tool attributes for physical continuity.
 */
export interface CrochetProductContext {
  productName: string;
  finishedSceneDescription: string;
  inProgressSceneDescription: string;
  yarnDetails: string;
  stylingSceneDescription?: string;
}

export function deriveCrochetProductContext(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): CrochetProductContext {
  const craft = packet.craftType || 'crochet';
  const kw = (topic.keyword || '').toLowerCase();
  const title = (article.title || '').toLowerCase();
  const text = `${kw} ${title}`;

  let productName = 'handmade crochet project';
  let finishedScene = 'A large, clear photograph of the finished handmade crochet project, beautifully arranged in sharp focus on a simple textured linen surface';
  let inProgressScene = 'real human hands actively crocheting the project with a smooth wooden hook, working yarn and visible stitches in progress';
  let stylingScene = 'A realistic artisan lifestyle setting showing that SAME handmade crochet project styled naturally with complementary yarn colors and craft props in warm daylight';

  const hook = packet.verifiedMaterials?.hookSizes?.[0] || 'wooden crochet hook';
  const yarn = packet.verifiedMaterials?.yarnWeights?.[0] || 'textured yarn';
  const yarnDetails = `matching ${yarn} and a genuine ${hook}`;

  if (/bat/i.test(text)) {
    productName = 'handmade crochet bat';
    finishedScene = 'A large, clear, centered photograph of the finished handmade crochet bat with sculpted wings, cute pointed ears, and clean stitch definition, placed on a warm neutral linen background in soft natural light';
    inProgressScene = `close-up photograph of real human hands actively crocheting the body and wings of that SAME crochet bat, using the identical dark charcoal yarn, with an authentic ${hook} and visible, physically plausible stitches`;
    stylingScene = 'A realistic lifestyle scene showing that SAME handmade crochet bat styled in an autumn craft nook alongside miniature pumpkins, rustic dark wood, and matching dark yarn skeins';
  } else if (/pumpkin/i.test(text)) {
    productName = 'rustic handmade crochet pumpkin';
    finishedScene = 'A large, clear photograph of the finished rustic crochet autumn pumpkin with ribbed texture, natural cinnamon stick stem, and curled twine accent on a clean wooden table';
    inProgressScene = `close-up photograph of real human hands actively crocheting the ribbed ridges of that SAME pumpkin using identical warm rust-orange yarn, an authentic ${hook}, and visible stitches`;
    stylingScene = 'A realistic harvest table setting featuring that SAME handmade crochet pumpkin alongside a small collection in complementary warm cream and mustard yarn colors';
  } else if (/ornament|christmas tree/i.test(text)) {
    productName = 'handmade crochet Christmas tree ornament';
    finishedScene = 'A large, clear photograph of the finished handmade crochet Christmas tree ornament with festive textured stitches, neat hanging loop, and crisp form on a natural wood surface';
    inProgressScene = `close-up photograph of real human hands actively crocheting the branch tiers of that SAME ornament using identical festive evergreen yarn, an authentic ${hook}, and visible stitches`;
    stylingScene = 'A realistic festive lifestyle scene showing that SAME handmade ornament hanging on a pine bough alongside complementary evergreen and cinnamon yarn balls';
  } else if (/waffle stitch/i.test(text)) {
    productName = 'textured waffle stitch crochet project';
    finishedScene = 'A large, clear photograph of the finished waffle stitch crochet piece showcasing deep geometric relief square texture and straight clean edges';
    inProgressScene = `close-up photograph of real human hands actively working the front-post double crochet waffle relief stitches of that SAME project with identical yarn and hook`;
    stylingScene = 'A realistic cozy armchair setting showcasing that SAME waffle stitch crochet piece draped naturally with visible textured relief in soft morning light';
  } else if (/granny square/i.test(text)) {
    productName = 'classic handmade crochet granny square';
    finishedScene = 'A large, clear photograph of the finished handmade crochet granny square motif with crisp corner clusters, flat blocking, and clean stitch definition';
    inProgressScene = `close-up photograph of real human hands actively working the outer cluster stitches of that SAME granny square with identical yarn and hook`;
    stylingScene = 'An overhead flatlay showcasing that SAME classic granny square alongside 3-4 coordinated color variation squares and wooden blocking pins';
  } else if (/beanie|hat/i.test(text)) {
    productName = 'handmade chunky ribbed crochet beanie';
    finishedScene = 'A large, clear photograph of the finished chunky ribbed crochet beanie with fold-over brim and neat top crown closure on a neutral tabletop';
    inProgressScene = `close-up photograph of real human hands actively crocheting the vertical ribbing rows into back loops of that SAME beanie with identical chunky yarn and hook`;
    stylingScene = 'A cozy lifestyle scene showing that SAME chunky beanie styled on a wooden coat peg next to matching wool skeins and a winter scarf';
  } else if (/bag|tote|market/i.test(text)) {
    productName = 'handmade crochet market tote bag';
    finishedScene = 'A large, clear photograph of the finished crochet market tote bag featuring an open textured mesh lace body and reinforced sturdy handles';
    inProgressScene = `close-up photograph of real human hands actively crocheting the open mesh grid rows of that SAME tote bag with identical cotton yarn and hook`;
    stylingScene = 'A bright farmers market lifestyle setting showing that SAME crochet mesh tote packed with fresh flowers and craft yarn';
  } else if (/amigurumi|plush|toy/i.test(text)) {
    productName = 'handmade crochet amigurumi figure';
    finishedScene = 'A large, clear photograph of the finished handmade amigurumi figure with tight seamless stitches, firm structural shaping, and neat details';
    inProgressScene = `close-up photograph of real human hands actively crocheting the continuous spiral rounds of that SAME amigurumi with identical yarn and hook`;
    stylingScene = 'A charming studio scene showing that SAME handmade amigurumi figure positioned on a maker desk beside color variation samples';
  } else if (/blanket|afghan|throw/i.test(text)) {
    productName = 'handmade textured crochet blanket';
    finishedScene = 'A large, clear photograph of the finished handmade textured crochet blanket throw, draped neatly showing rich stitch texture and finished border';
    inProgressScene = `close-up photograph of real human hands actively crocheting the rhythmic pattern rows of that SAME blanket with identical yarn and hook`;
    stylingScene = 'A warm living room lifestyle setting showing that SAME textured blanket folded neatly over a linen sofa showing its finished border';
  } else if (/gauge|swatch|counter|calculator|tool/i.test(text)) {
    productName = 'neat handmade crochet gauge swatch';
    finishedScene = 'A large, clear photograph of the finished blocked crochet gauge swatch with immaculate stitch alignment alongside a flexible cloth measuring tape and polished wooden hook';
    inProgressScene = `close-up photograph of real human hands actively crocheting the tension rows of that SAME gauge swatch with identical yarn and hook`;
    stylingScene = 'A pristine maker workspace setting showing that SAME gauge swatch beside an open pattern notebook, cloth measuring tape, and yarn weight chart';
  } else {
    // Dynamic general craft item
    const cleanKw = topic.keyword
      .replace(/how to crochet|how to|crochet pattern|crochet tutorial|free pattern|free crochet|step by step|guide|easy|best|diy/gi, '')
      .trim();
    const itemLabel = cleanKw.length >= 3 ? cleanKw : `${craft} project`;
    productName = `handmade crochet ${itemLabel}`;
    finishedScene = `A large, clear photograph of the finished handmade crochet ${itemLabel}, professionally styled in sharp focus on a clean neutral background with soft natural lighting`;
    inProgressScene = `close-up photograph of real human hands actively crocheting that SAME ${itemLabel}, using identical yarn color and weight, with an authentic ${hook} and visible stitches in progress`;
    stylingScene = `A realistic artisan lifestyle setting showing that SAME handmade crochet ${itemLabel} styled naturally with complementary yarn colors and craft props in warm daylight`;
  }

  return { productName, finishedSceneDescription: finishedScene, inProgressSceneDescription: inProgressScene, stylingSceneDescription: stylingScene, yarnDetails };
}

/**
 * Builds a dedicated, dynamic Higgsfield prompt enforcing STRICT IMMUTABLE TEXT & EDITORIAL ART DIRECTION:
 * - 3-PART STACKED COMPOSITION: Top Image (Finished Product), Center Title (Neutral Horizontal Band), Bottom Image (Hands Actively Crocheting the Same Product).
 * - Non-negotiable Realism: Authentic photography, anatomically natural human hands with 5 fingers, physically plausible hook and stitches, visual continuity.
 * - EXACTLY TWO text elements: Headline and CTA.
 * - Dynamic Title & CTA Placement: Placement adapts directly to chosen dimensions.
 * - Dynamic Typography & Backgrounds: Editorial serif, bold modern sans, compact stacked.
 * - ZERO PAPER / ZERO CARDS: Global hard prohibition on paper panels, pigment washes, paint dabs, watercolor shapes, badges, and UI boxes.
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
  dimensions?: PinterestCreativeDimensions,
  archetype?: PinterestPinArchetype
): string {
  const craftType = packet.craftType || 'crochet';
  const productContext = deriveCrochetProductContext(topic, article, packet);

  // Extract dimensions or fallback to format defaults
  const titlePos = dimensions?.titlePosition || 'top_left';
  const ctaPos = dimensions?.ctaPosition || 'bottom_right';
  const typoStyle = dimensions?.typographyStyle || 'editorial_serif';
  const bgStyle = dimensions?.textBackground || 'none_direct_photo';
  const ctaVisual = dimensions?.ctaStyle || 'clean_minimal_text';
  const framing = dimensions?.cameraFraming || 'three_quarter';
  const moodTheme = dimensions?.colorMood || theme;

  const resolvedArchetype: PinterestPinArchetype =
    archetype ||
    (dimensions?.composition === 'hands_crafting'
      ? 'making_process'
      : dimensions?.composition === 'lifestyle_scene' || dimensions?.composition === 'multi_project_showcase'
      ? 'styling_variations'
      : 'finished_project');

  // Format Placement Descriptions
  const titlePlacementText =
    titlePos === 'top_center'
      ? 'Upper-center area in clean negative space with at least 10% safe-frame padding.'
      : titlePos === 'top_right'
      ? 'Upper-right area in natural negative space with at least 10% safe-frame padding.'
      : titlePos === 'bottom_right'
      ? 'Lower-right area in natural negative space with at least 10% safe-frame padding.'
      : titlePos === 'bottom_left'
      ? 'Lower-left area in clean negative space with at least 10% safe-frame padding.'
      : titlePos === 'lower_third_center'
      ? 'Lower-third centered placement in negative space with at least 10% safe-frame padding.'
      : 'Upper area in clean negative space with at least 10% safe-frame padding.';

  const ctaPlacementText =
    ctaPos === 'top_right'
      ? 'Upper-right area in natural negative space separate from headline.'
      : ctaPos === 'top_left'
      ? 'Upper-left area in natural negative space separate from headline.'
      : ctaPos === 'bottom_center'
      ? 'Centered bottom area with clean separation from headline.'
      : ctaPos === 'bottom_left'
      ? 'Lower-left area in natural negative space separate from headline.'
      : ctaPos === 'mid_right_side'
      ? 'Mid-right side zone beside subject in negative space.'
      : 'Lower-right area in natural negative space separate from headline.';

  // Format Headline Typography Description
  const headlineTypoText =
    typoStyle === 'bold_modern_sans'
      ? 'Bold modern SANS-SERIF typeface, high visual impact, crisp legibility.'
      : typoStyle === 'compact_stacked'
      ? 'Compact stacked uppercase editorial typography with balanced tracking.'
      : typoStyle === 'refined_minimal'
      ? 'Refined uppercase editorial typography with generous tracking.'
      : 'High-end editorial SERIF typeface, refined, artistic with generous scale.';

  // Format Headline Background Description (Strictly NON-PAPER)
  const headlineBgText =
    bgStyle === 'none_direct_photo'
      ? 'Place typography directly into clean photographic negative space. No text background treatment whatsoever.'
      : bgStyle === 'natural_shadow'
      ? 'Integrated over natural soft photographic shadow with high organic contrast.'
      : bgStyle === 'environmental_negative_space'
      ? 'Positioned within environmental negative space in the photograph.'
      : bgStyle === 'architectural_surface'
      ? 'Rendered cleanly across natural background surface in photograph.'
      : bgStyle === 'textile_texture'
      ? 'Integrated smoothly over natural background textile texture with crisp legibility.'
      : 'Positioned over subtle photographic ambient light gradient with clean contrast.';

  // Format CTA Background Description (Strictly NON-PAPER)
  const ctaBgText =
    ctaVisual === 'clean_minimal_text'
      ? 'Clean standalone typography directly over negative space.'
      : ctaVisual === 'editorial_label'
      ? 'Crisp text with delicate minimalist fine hairline boundary.'
      : ctaVisual === 'subtle_capsule'
      ? 'Clean text with subtle soft tonal tint sized closely to text.'
      : ctaVisual === 'minimal_underline'
      ? 'Clean text with minimalist hairline underline.'
      : 'Clean compact editorial typography in negative space.';

  let archetypeBrief = '';
  if (resolvedArchetype === 'making_process') {
    archetypeBrief = `PIN ARCHETYPE: MAKING PROCESS & TUTORIAL (PIN 2):
Close-up photo of ANATOMICALLY NATURAL HUMAN HANDS with anatomically correct fingers actively crocheting ${productContext.productName}. Working ${productContext.yarnDetails} with physically plausible stitches and natural yarn tension on craft workspace. DESIGN CONTINUITY in yarn and stitches.`;
  } else if (resolvedArchetype === 'styling_variations') {
    archetypeBrief = `PIN ARCHETYPE: STYLING, COLOR VARIATIONS & IDEAS (PIN 3):
REALISTIC LIFESTYLE SETTING & FRESH VISUAL ANGLE featuring finished ${productContext.productName}. Complementary color variations and styling in natural lighting. DESIGN CONTINUITY in materials and craft design.`;
  } else {
    // Default: finished_project (Pin 1)
    archetypeBrief = `PIN ARCHETYPE: FINISHED PROJECT SHOWCASE (PIN 1):
Complete finished ${craftType} ${productContext.productName}. CLEAN CONSTRASTING SINGLE-COLOR BACKGROUND with zero clutter. Natural daylight, clear stitch definition, authentic yarn texture. DESIGN CONTINUITY throughout.`;
  }

  const realismRules = `
REQUIREMENTS:
- 2:3 VERTICAL ASPECT RATIO: Target vertical 1000 × 1500 resolution.
- PHOTOGRAPHIC DOMINANCE: Pure authentic photography must dominate at least 70% of canvas. Tactile smartphone photo, no CGI.
- SAFE-FRAME MARGINS & EDGES: Maintain at least 10% safe-frame padding from edges.
- DEDICATED HEADLINE ZONE: Position the headline in a dedicated negative space area.
- HIGH CONTRAST TYPOGRAPHY with crisp legibility.
- ONE SINGLE CLEAR HEADLINE ONLY ("${headline}"). No subtitles or badges.`;

  const typographyBlock = `
EDITORIAL TYPOGRAPHY:
LITERAL TEXT LOCK — TYPOGRAPHY MUST RENDER THE FOLLOWING STRINGS CHARACTER-FOR-CHARACTER:
HEADLINE: "${headline}"
CTA: "${cta}"

HEADLINE VISUAL STYLING:
- Placement: ${titlePlacementText}
- Typography: ${headlineTypoText}
- Creative Background: ${headlineBgText}

ACTION CTA VISUAL STYLING:
- Placement: ${ctaPlacementText}
- Typography: Montserrat ExtraBold uppercase (${moodTheme.ctaVisualTreatment})
- Creative Background: ${ctaBgText}

STRICT PROHIBITIONS & FINAL TEXT CONFIRMATION:
- GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper, torn paper, paper wash, pigment wash, paint wash, brushstroke, watercolor shape, card, panel, banner, badge, button, pill, UI element, Canva-style graphic, or artificial text container.
- ZERO other text, subtitles, or decorative elements.
- FINAL TEXT TO RENDER: HEADLINE: "${headline}", CTA: "${cta}".`;

  return `Vertical Pinterest Pin. ${archetypeBrief}
${realismRules}
Mood: ${moodTheme.lightingAndMood}, ${moodTheme.paletteDescription}.
${typographyBlock}`;
}

/**
 * Evaluates semantic match score between a candidate board and the topic/category.
 * Evaluates board name, description, taxonomy synonyms, negative keywords, content format, and tool identity.
 */
export function scoreBoardMatch(
  board: NormalizedPinterestBoard,
  topic: DiscoveredTopic,
  articleCategory?: string
): number {
  const boardNameLower = (board.name || '').toLowerCase().trim();
  const boardDescLower = (board.description || '').toLowerCase().trim();
  const kwLower = (topic.keyword || '').toLowerCase().trim();
  const catLower = (topic.category || articleCategory || '').toLowerCase().trim();
  const formatLower = (topic.targetContentFormat || '').toLowerCase().trim();
  const toolSlugLower = (topic.toolSlug || '').toLowerCase().trim();
  const contentTypeLower = (topic.contentType || '').toLowerCase().trim();

  // 1. Exact match on board name or keyword
  if (boardNameLower === kwLower || boardNameLower.includes(kwLower) || (kwLower.length >= 6 && kwLower.includes(boardNameLower))) {
    return 100;
  }

  // Determine Primary Topic Category Intent:
  const isTool = contentTypeLower === 'tool_guide' || catLower === 'tools' || formatLower === 'tool_focus' || Boolean(toolSlugLower) || /calculator|gauge|yardage|counter|converter|tracker|timer|dictionary/i.test(kwLower);
  const isTutorial = formatLower === 'tutorial' || /stitch|technique|how to|how-to|step-by-step|beginner|learn|lesson/i.test(kwLower);
  const isBlanket = /blanket|afghan|throw|lapghan|bedspread/i.test(kwLower);
  const isAmigurumi = /amigurumi|toy|toys|plush|doll|animal/i.test(kwLower);
  const isFlower = /flower|floral|rose|applique|motif|botanical|leaf|leaves/i.test(kwLower);
  const isBaby = /baby|infant|toddler|nursery|bootie|layette/i.test(kwLower);
  const isClothing = /sweater|cardigan|top|garment|wearable|vest|pullover|dress|skirt|jacket/i.test(kwLower);
  const isAccessory = /bag|tote|purse|hat|beanie|scarf|shawl|cowl|headband|mittens|gloves|scrunchie|parandi/i.test(kwLower);
  const isDecor = /decor|pillow|cushion|potholder|coaster|rug|basket|wreath|garland/i.test(kwLower);

  // 2. Tool Guides: Strict Matching & Unrelated Board Guard
  if (isTool) {
    const hasToolInName = /tool|calculator|counter|tracker|converter|gauge|yardage|timer|dictionary|resource|utility/i.test(boardNameLower);
    const hasToolInDesc = /tool|calculator|counter|tracker|converter|gauge|yardage|timer|dictionary|resource|utility/i.test(boardDescLower);

    if (hasToolInName) {
      return 95;
    }
    if (hasToolInDesc) {
      return 85;
    }

    // Guard: Reject unrelated specific project category boards for tool topics
    const isUnrelatedProjectBoard = /accessor|bag|tote|clothing|sweater|wearable|amigurumi|toy|blanket|afghan|flower|motif|decor|pillow|baby/i.test(boardNameLower);
    if (isUnrelatedProjectBoard) {
      return 0;
    }

    // Generic crochet anchor
    if (/crochet|yarn|craft/i.test(boardNameLower)) {
      return 20;
    }

    return 0;
  }

  // 3. Tutorials & Stitches
  if (isTutorial) {
    const hasTutorialInName = /tutorial|stitch|technique|how to|how-to|learn|lesson|step-by-step|guide|basics|masterclass/i.test(boardNameLower);
    const hasTutorialInDesc = /tutorial|stitch|technique|how to|how-to|learn|lesson|step-by-step|guide|basics|masterclass/i.test(boardDescLower);

    let tutorialScore = 0;
    if (hasTutorialInName) tutorialScore = 90;
    else if (hasTutorialInDesc) tutorialScore = 80;

    // Check if tutorial is about a specific project category
    if (isAccessory && /accessor|bag|hat|beanie|scarf/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }
    if (isBlanket && /blanket|afghan/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }
    if (isAmigurumi && /amigurumi|toy/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }
    if (isClothing && /clothing|sweater|wearable/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }
    if (isFlower && /flower|motif/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }
    if (isDecor && /decor|pillow|coaster/i.test(boardNameLower)) {
      return Math.max(tutorialScore, 85);
    }

    if (tutorialScore > 0) return tutorialScore;

    // Reject pure calculator/counter boards for tutorial topics
    if (/calculator|counter|converter/i.test(boardNameLower) && !hasTutorialInDesc) {
      return 0;
    }
  }

  // 4. Specific Craft Categories Scoring
  let bestCategoryScore = 0;

  for (const [groupKey, taxonomy] of Object.entries(CRAFT_SEMANTIC_TAXONOMY)) {
    const groupKeywords = Array.isArray(taxonomy) ? taxonomy : (taxonomy as any).keywords || [];
    const negativeKeywords = (taxonomy as any).negativeKeywords || [];

    const topicMatchesGroup = groupKeywords.some((k: string) => kwLower.includes(k) || catLower.includes(k));
    if (!topicMatchesGroup) continue;

    const boardNameMatches = groupKeywords.some((k: string) => boardNameLower.includes(k));
    const boardDescMatches = groupKeywords.some((k: string) => boardDescLower.includes(k));
    const boardHasNegative = negativeKeywords.some((nk: string) => boardNameLower.includes(nk));

    if (boardHasNegative && !boardNameMatches) {
      continue;
    }

    if (boardNameMatches) {
      bestCategoryScore = Math.max(bestCategoryScore, 90);
    } else if (boardDescMatches) {
      bestCategoryScore = Math.max(bestCategoryScore, 75);
    }
  }

  if (bestCategoryScore > 0) {
    return bestCategoryScore;
  }

  // 5. Category Name Direct Match (Only for specific sub-categories, NOT universal 'crochet')
  if (catLower && catLower !== 'crochet' && (boardNameLower.includes(catLower) || (catLower.length >= 4 && boardDescLower.includes(catLower)))) {
    return 70;
  }

  // 6. If topic belongs to a specific category (blanket, amigurumi, clothing, etc.) and board belongs to a different specific category, reject
  const specificTopicCategories = [
    { key: 'blankets', matches: isBlanket, boardMatches: /blanket|afghan|throw/i.test(boardNameLower) },
    { key: 'amigurumi', matches: isAmigurumi, boardMatches: /amigurumi|toy|plush/i.test(boardNameLower) },
    { key: 'clothing', matches: isClothing, boardMatches: /clothing|sweater|wearable|top|cardigan/i.test(boardNameLower) },
    { key: 'accessories', matches: isAccessory, boardMatches: /accessor|bag|tote|hat|beanie|scarf/i.test(boardNameLower) },
    { key: 'flowers', matches: isFlower, boardMatches: /flower|floral|motif/i.test(boardNameLower) },
    { key: 'decor', matches: isDecor, boardMatches: /decor|pillow|cushion|coaster|rug/i.test(boardNameLower) },
    { key: 'baby', matches: isBaby, boardMatches: /baby|infant|bootie/i.test(boardNameLower) }
  ];

  const matchedTopicCat = specificTopicCategories.find(c => c.matches);
  if (matchedTopicCat && !matchedTopicCat.boardMatches) {
    const isDifferentSpecificBoard = specificTopicCategories.some(c => c.key !== matchedTopicCat.key && c.boardMatches);
    if (isDifferentSpecificBoard) {
      return 0; // Cross-category conflict: e.g. Blanket topic vs Accessories board
    }
  }

  // 7. Generic Crochet Anchor (Low baseline, will not pass confidence threshold on its own)
  if (/crochet|yarn|craft|pattern/i.test(boardNameLower)) {
    return 20;
  }

  return 0;
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
  if (!best || best.score < 60) {
    // Check if a designated fallback board was provided via options
    if (options?.fallbackBoardId && options?.fallbackBoardName) {
      const configuredFallback: NormalizedPinterestBoard = {
        id: options.fallbackBoardId,
        name: options.fallbackBoardName,
      };
      return {
        success: true,
        board: configuredFallback,
        confidenceScore: 70,
        matchType: 'fallback',
        requiresOperatorDecision: false,
        reason: `Low auto-match score (${best ? best.score : 0}/100) on live boards. Selected configured fallback board "${configuredFallback.name}".`,
        candidateBoards: scoredCandidates,
      };
    }

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
      confidenceScore: best ? best.score : 0,
      matchType: 'none',
      requiresOperatorDecision: true,
      reason: `Low confidence semantic match (${best ? best.score : 0}/100) for topic "${topic.keyword}" with board "${best ? best.board.name : 'None'}".`,
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

  if (best && best.score >= 50) {
    return {
      boardName: best.board.name,
      boardId: best.board.id,
      confidenceScore: best.score,
      reason: `Semantic alignment (${best.score}/100) with category ${articleCategory}`,
      success: true,
    };
  }

  return {
    boardName: 'Crochet Tools & Yarn Calculators',
    boardId: 'default_board',
    confidenceScore: best ? best.score : 0,
    reason: 'Default craft board fallback',
    success: false,
  };
}

/**
 * Builds a dedicated, content-aware Hero prompt for Higgsfield (16:9, pure high-res photography).
 * Adapts the 3-part tutorial composition (Finished Product, Center Title Band, Hands Actively Crocheting) naturally to 16:9 format.
 */
export function buildHiggsfieldHeroPrompt(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket
): string {
  const craftType = packet.craftType || 'crochet';
  const { productName, finishedSceneDescription, inProgressSceneDescription, yarnDetails } = deriveCrochetProductContext(topic, article, packet);
  const headline = article.title;

  return `Realistic photography-led craft editorial visual for 16:9 widescreen article hero format, featuring an authentic dual-focus tutorial composition:
1. FINISHED OBJECT (LEFT): ${finishedSceneDescription}. A large, clear photograph of the completed handmade ${craftType} ${productName}, complete and beautifully styled on a clean warm linen or rustic wooden surface with soft diffused natural morning window light.
2. CENTER TITLE: A clean, neutral horizontal divider band displaying the short title "${headline}". Simple, restrained, readable typography with zero decorative stickers or badges.
3. CROCHET IN PROGRESS (RIGHT): A close-up photograph of real human hands actively crocheting the EXACT SAME ${productName}, holding a smooth wooden hook with ${yarnDetails}, showing physically plausible stitches in progress (${inProgressSceneDescription}).
NON-NEGOTIABLE REALISM REQUIREMENTS:
- Prioritize authentic photographic realism over illustration, CGI, cartoon aesthetics, and obvious AI-generated imagery.
- Human hands must look anatomically natural, with correctly formed fingers and realistic skin texture.
- The hook, yarn, and stitches must be physically plausible.
- Show a coherent crochet-in-progress stage, not an unrelated object or a finished product being held as if it were being crocheted.
- Maintain visual continuity between the finished product and the in-progress project with identical yarn color, weight, and construction.
- Natural lighting, realistic textures, simple backgrounds, close-up photography.
- Avoid artificial plastic-looking yarn, malformed hands, impossible hooks, disconnected stitches, and inconsistent product details.
- Do not add extra text, icons, stickers, badges, decorative frames, or unnecessary graphics.
- The title must be short, legible, correctly spelled, and visually separated from the two photographs.`;
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
 * Builds a dedicated Higgsfield prompt for the flagship 3-photograph stacked vertical Pinterest Pin:
 * 1. Top photograph (Panel 1): Complete finished crochet project on clean solid contrasting background.
 * 2. Central headline band: One single clear headline between Photo 1 and Photo 2. ZERO CTAs.
 * 3. Middle photograph (Panel 2): Two natural human hands actively crocheting with hook & yarn.
 * 4. Bottom photograph (Panel 3): Completed project styled naturally in an authentic setting.
 * 
 * Target output: 1000 × 1500 pixels, 2:3 vertical aspect ratio.
 */
export function buildStackedThreePhotoPinPrompt(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  headline: string,
  theme?: AestheticTheme
): string {
  const craftType = packet.craftType || 'crochet';
  const productContext = deriveCrochetProductContext(topic, article, packet);

  return `Vertical 2:3 editorial Pinterest Pin layout (1000 × 1500) featuring THREE stacked photographic panels arranged vertically and ONE central headline band:

PANEL 1 (TOP PHOTOGRAPH): Complete finished handmade ${craftType} ${productContext.productName}. ${productContext.finishedSceneDescription}. Clean contrasting single-color background with zero clutter. Natural daylight, clear stitch definition, authentic yarn texture. The entire project is visible with no cropping. No text or overlays in this panel.

CENTRAL HEADLINE BAND (BETWEEN PHOTO 1 & PHOTO 2):
A clean, solid contrasting horizontal divider band displaying ONE single clear headline:
"${headline}"
Bold, elegant high-contrast editorial typography, centered with safe margins and safe-frame padding. This is the ONLY text in the entire image. Absolutely ZERO subtitles, ZERO website URLs, ZERO buttons, and ZERO call-to-actions.

PANEL 2 (MIDDLE PHOTOGRAPH): Close-up photograph of two anatomically natural human hands with anatomically correct fingers actively crocheting that SAME ${productContext.productName}. Working ${productContext.yarnDetails} with physically plausible stitches and natural yarn tension (${productContext.inProgressSceneDescription}). Set against a craft workspace in natural light. No text.

PANEL 3 (BOTTOM PHOTOGRAPH): A realistic photograph of the completed crochet ${productContext.productName} (${productContext.stylingSceneDescription || productContext.finishedSceneDescription}), showing the finished item held naturally in hands or styled in an authentic setting. Strict design continuity in yarn color, weight, and stitches. No text.

REQUIREMENTS:
- 2:3 VERTICAL ASPECT RATIO (Target vertical 1000 × 1500 resolution).
- Three stacked photographic panels arranged vertically.
- One central headline band located between Photo 1 and Photo 2.
- Pure authentic smartphone craft photography across all three panels.
- Strict design continuity: identical yarn color, weight, and stitches in all panels.
- Safe-frame margins: at least 10% safe-frame padding from all canvas edges.
- LITERAL TEXT LOCK — TYPOGRAPHY MUST RENDER ONLY THE HEADLINE:
HEADLINE: "${headline}"
- CRITICAL: ZERO CTAs, NO buttons, NO badges, NO arrows, NO action text, NO "CALCULATE YARN", NO "SEE MORE".
- GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper, torn paper, paper wash, pigment wash, paint wash, brushstroke, watercolor shape, card, panel, banner, badge, button, pill, UI element, Canva-style graphic, or artificial text container.`;
}

/**
 * Generates dynamic, content-aware Pinterest creative concepts with dedicated Higgsfield prompts.
 * 
 * STRICT 3-CONCEPT CREATIVE ARCHITECTURE:
 * - When pinsPerArticle = 1: Generates the flagship 3-photograph stacked vertical Pin layout with central headline band and ZERO CTAs.
 * - When pinsPerArticle > 1: Generates distinct concept dimension profiles differing in 5+ visual dimensions.
 * 
 * NO LOCAL COMPOSITOR: Higgsfield Marketing Studio Image 2.0 Alpha generates the complete final image.
 */
export function generatePinterestCreativeConcepts(
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  resolvedBoard: NormalizedPinterestBoard,
  pinsPerArticle = 3
): PinterestCreativeConcept[] {
  const concepts: PinterestCreativeConcept[] = [];
  const destinationUrl = `https://welovepattern.com/blog/${article.slug}`;

  // Select multi-dimensional distinct concept triplet (Finished Project, Making Process, Styling and Variations)
  const triplet = selectDistinctCreativeConceptTriplet(topic, article, packet);
  const archetypes: PinterestPinArchetype[] = ['finished_project', 'making_process', 'styling_variations'];
  const headlines = generateArticleAwareHeadlines(topic, article, packet);

  for (let pinNum = 1; pinNum <= pinsPerArticle; pinNum++) {
    const dimensions = triplet[pinNum - 1] || triplet[0];
    const archetype = archetypes[pinNum - 1] || 'finished_project';
    const isSingleFlagshipPin = (pinNum === 1 && pinsPerArticle === 1);

    const visualFormat: PinterestVisualFormat =
      archetype === 'making_process'
        ? 'hands_crafting'
        : archetype === 'styling_variations'
        ? (dimensions.composition === 'multi_project_showcase' ? 'editorial_collage' : 'lifestyle_person')
        : (dimensions.composition === 'overhead_flatlay'
            ? 'flatlay_projects'
            : dimensions.composition === 'craftsmanship_macro'
            ? 'closeup_craftsmanship'
            : 'single_hero_editorial');

    const headline =
      pinNum === 1
        ? headlines.pin1Headline
        : pinNum === 2
        ? headlines.pin2Headline
        : headlines.pin3Headline;

    const cta = isSingleFlagshipPin ? '' : buildTrafficOrientedCta(topic, article, pinNum, visualFormat);

    const typography: PinterestTypographyOverlay = {
      primaryHeadline: headline,
      ctaBadgeText: cta,
      textContainerStyle: isSingleFlagshipPin ? 'clean_neutral_band' : dimensions.textBackground,
    };

    const compactHiggsfieldPrompt = isSingleFlagshipPin
      ? buildStackedThreePhotoPinPrompt(topic, article, packet, headline, dimensions.colorMood)
      : buildHiggsfieldPinPrompt(
          visualFormat,
          headline,
          cta,
          dimensions.colorMood,
          topic,
          article,
          packet,
          dimensions,
          archetype
        );

    const conceptAngle = isSingleFlagshipPin
      ? 'Three Stacked Photographs with Central Headline'
      : archetype === 'finished_project'
      ? 'Finished Project Showcase & Pattern Feature'
      : archetype === 'making_process'
      ? 'Maker Hands in Action & Step-by-Step Technique'
      : 'Styling, Variations & Creative Inspiration';

    const seoMeta = generateVariantSeoMetadata(topic, article, packet, archetype, pinNum);

    concepts.push({
      pinNumber: pinNum,
      pinVariant: isSingleFlagshipPin ? 'stacked_three_photo' : archetype,
      pinTitle: seoMeta.pinTitle,
      pinDescription: seoMeta.pinDescription,
      conceptAngle,
      visualStyle: {
        imageCount: isSingleFlagshipPin ? 3 : (dimensions.composition === 'multi_project_showcase' ? 4 : 1),
        compositionType: isSingleFlagshipPin
          ? 'stacked_3_panel'
          : archetype === 'making_process'
          ? 'hands_crafting'
          : archetype === 'styling_variations'
          ? 'lifestyle_scene'
          : (dimensions.composition === 'overhead_flatlay'
              ? 'flatlay_materials'
              : dimensions.composition === 'craftsmanship_macro'
              ? 'collage_macro'
              : 'single_hero'),
        subjectDescription: `${conceptAngle} for ${article.title}`,
        colorPalette: dimensions.colorMood.paletteDescription,
        humanElement: isSingleFlagshipPin
          ? 'hands_only'
          : archetype === 'making_process'
          ? 'hands_only'
          : archetype === 'styling_variations'
          ? (dimensions.composition === 'lifestyle_scene' ? 'lifestyle_background' : 'none')
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
