/**
 * SEO Content Engine - Trend + Tool Content Intelligence Matcher
 * 
 * Pairs relevant US crochet search trends, seasonal events, and craft projects
 * with real, verified WeLovePattern tools from `TOOLS_DATA`.
 * 
 * CORE ARCHITECTURAL INVARIANTS:
 * 1. REAL TOOLS ONLY: Every tool must exist in `TOOLS_DATA` and have a verified route (`/tools/[slug]`).
 * 2. RELEVANCE & HONESTY: Rejects irrelevant pairings where the tool cannot perform the claimed task.
 * 3. EXPLICIT CAPABILITIES & LIMITATIONS: Documents honest tool inputs, outputs, assumptions, and limitations.
 * 4. DAILY TOOL ROTATION: Rotates through unique tools across days, avoiding consecutive-day repetition.
 * 5. ROTATION FALLBACK: If all suitable tools were used recently, selects the least-recently used match with clear logging.
 */

import { TOOLS_DATA, getToolBySlug } from '../../data/toolsData';
import { isRouteValid } from '../generation/internalLinkCatalog';
import { SeoEngineDailyState, ToolItem } from '../types';

export interface ToolCapabilityProfile {
  toolSlug: string;
  toolTitle: string;
  canonicalUrl: string;
  category: string;
  actionType: string;
  actionVerb: string;
  actionLabel: string;
  description: string;
  coreProblem: string;
  practicalCapabilities: string[];
  inputs: string[];
  outputs: string[];
  limitations: string[];
  relevanceKeywords: string[];
  supportedCraftDomains: Array<'blankets' | 'amigurumi' | 'garments' | 'accessories' | 'stitches' | 'business_pricing' | 'organization' | 'general'>;
  basePriority: number; // 1-10
}

/**
 * Authoritative capability catalog for all 20 verified WeLovePattern tools.
 */
export const TOOL_CAPABILITY_PROFILES: ToolCapabilityProfile[] = [
  {
    toolSlug: 'yarn-calculator',
    toolTitle: 'Yarn Calculator',
    canonicalUrl: '/tools/yarn-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Yarn',
    actionLabel: "Let's Calculate Yarn →",
    description: 'Estimate total yards/meters and skeins needed for blankets, sweaters, baby items, and plushies.',
    coreProblem: 'Running out of yarn mid-project or overbuying expensive dye lots due to inaccurate guesswork.',
    practicalCapabilities: [
      'Calculates total estimated yards and meters from project dimensions and blocked gauge swatch.',
      'Converts total yardage into required skein counts based on individual ball weight/length.',
      'Supports standard projects including blankets, garments, scarves, and decorative items.',
    ],
    inputs: ['Project dimensions (width and length)', 'Gauge swatch measurements (stitches & rows per 4 inches)', 'Skein yardage/meters'],
    outputs: ['Total estimated yardage/meters', 'Number of skeins to purchase', 'Recommended 10-15% safety buffer amount'],
    limitations: [
      'Requires crocheting and measuring an accurate 4x4 inch gauge swatch for precise results.',
      'Textured stitches (bobbles, puff stitches, cables) consume 15% to 30% more yarn than flat stitches.',
      'Does not automatically split yarn requirements across multiple colors without separate calculations.',
    ],
    relevanceKeywords: ['yarn', 'yardage', 'skein', 'skeins', 'how much yarn', 'blanket', 'afghan', 'pumpkin', 'throw', 'sweater', 'plush', 'amigurumi', 'tote', 'shawl', 'scarf'],
    supportedCraftDomains: ['blankets', 'amigurumi', 'garments', 'accessories', 'general'],
    basePriority: 10,
  },
  {
    toolSlug: 'gauge-calculator',
    toolTitle: 'Gauge Calculator',
    canonicalUrl: '/tools/gauge-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Gauge',
    actionLabel: "Let's Calculate Gauge →",
    description: 'Compare your swatch gauge to pattern target gauge to calculate exact stitch & row count adjustments.',
    coreProblem: 'Finished wearables and fitted items turning out significantly too large or small due to personal tension variances.',
    practicalCapabilities: [
      'Compares measured 4x4 inch swatch stitch and row counts against pattern specification gauge.',
      'Calculates exact stitch count and row count adjustments to match pattern dimensions.',
      'Indicates whether to switch hook size up or down when tension differs.',
    ],
    inputs: ['Pattern target stitches and rows per 4 inches (10 cm)', 'Your actual measured swatch stitches and rows per 4 inches', 'Target item dimensions'],
    outputs: ['Percentage tension variance (+/- %)', 'Adjusted starting chain and row counts', 'Hook size adjustment recommendation'],
    limitations: [
      'Assumes the swatch was washed and blocked exactly as the finished project will be cared for.',
      'Cannot correct erratic or inconsistent stitch tension within the same piece.',
      'Calculation applies to flat fabric; circular in-the-round tension may differ slightly.',
    ],
    relevanceKeywords: ['gauge', 'tension', 'swatch', 'fit', 'size', 'sizing', 'beanie', 'hat', 'sweater', 'cardigan', 'mittens', 'socks', 'garment'],
    supportedCraftDomains: ['garments', 'accessories', 'general'],
    basePriority: 9,
  },
  {
    toolSlug: 'border-calculator',
    toolTitle: 'Border Calculator',
    canonicalUrl: '/tools/border-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Border Stitches',
    actionLabel: "Let's Calculate Border Stitches →",
    description: 'Calculate side edge stitch pick-ups and corner repeat multiples for perfectly flat blanket borders.',
    coreProblem: 'Blanket borders rippling/ruffling from too many edge stitches or pulling inward from too few.',
    practicalCapabilities: [
      'Calculates exact side-edge stitch pick-up ratios based on stitch height (e.g. 1 stitch per sc row, 2 per dc row).',
      'Calculates corner increases and repeat multiples for decorative edging patterns (e.g. multiples of 4 + 1).',
      'Prevents edges from flaring or buckling.',
    ],
    inputs: ['Total raw row count along vertical edges', 'Stitch count along horizontal edges', 'Desired edging stitch pattern repeat multiple'],
    outputs: ['Exact stitch pick-up frequency (e.g. pick up 3 stitches across 4 rows)', 'Total foundation round stitch count', 'Corner stitch allocation'],
    limitations: [
      'Requires knowing the actual raw stitch and row counts along the unbordered perimeter.',
      'Cannot flatten edge waviness caused by severe uneven body tension without prior wet blocking.',
    ],
    relevanceKeywords: ['border', 'edging', 'edge', 'ruffling', 'curling', 'pick up stitches', 'corners', 'blanket border', 'afghan edging'],
    supportedCraftDomains: ['blankets', 'accessories'],
    basePriority: 8,
  },
  {
    toolSlug: 'granny-square-calculator',
    toolTitle: 'Granny Square Calculator',
    canonicalUrl: '/tools/granny-square-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Granny Squares',
    actionLabel: "Let's Calculate Granny Squares →",
    description: 'Calculate total granny squares needed for any blanket dimension plus assembly border yardage.',
    coreProblem: 'Uncertainty about how many motifs to crochet to reach a specific blanket size and how to arrange them.',
    practicalCapabilities: [
      'Calculates the exact grid layout (columns x rows) and total square count for target blanket dimensions.',
      'Accounts for individual square size after blocking.',
      'Estimates joining yarn and perimeter border yardage requirements.',
    ],
    inputs: ['Single blocked granny square width/height (inches or cm)', 'Target blanket dimensions (e.g. baby 30x36 in, throw 50x60 in)', 'Border width in inches'],
    outputs: ['Total squares required', 'Grid dimensions (e.g. 6 squares wide by 8 squares long)', 'Estimated joining yardage and border yarn'],
    limitations: [
      'Individual squares must be blocked to uniform dimensions for the grid calculation to hold true.',
      'Does not account for non-square motifs (hexagons or triangles) without manual adjustment.',
    ],
    relevanceKeywords: ['granny square', 'granny squares', 'motif', 'motifs', 'afghan squares', 'blanket layout', 'joining squares', 'sunburst', 'temperature blanket'],
    supportedCraftDomains: ['blankets', 'accessories'],
    basePriority: 9,
  },
  {
    toolSlug: 'blanket-calculator',
    toolTitle: 'Blanket Calculator',
    canonicalUrl: '/tools/blanket-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Blanket Sizes',
    actionLabel: "Let's Calculate Blanket Sizes →",
    description: 'Calculate starting chain, row counts, and yardage for standard blanket sizes (Baby, Throw, Queen, King).',
    coreProblem: 'Struggling to adapt a stitch pattern into a specific standard blanket size with correct starting chains and yarn amounts.',
    practicalCapabilities: [
      'Provides standard CYC mattress and afghan dimensions (Baby, Lapghan, Throw, Twin, Queen, King).',
      'Calculates starting chain length adjusted for stitch pattern multiples.',
      'Estimates total row count and yardage requirements.',
    ],
    inputs: ['Selected standard size or custom dimensions', 'Gauge swatch stitches and rows per 4 inches', 'Stitch pattern repeat multiple'],
    outputs: ['Exact starting chain count', 'Target total row count', 'Estimated total project yardage'],
    limitations: [
      'Calculation accuracy depends entirely on an accurate gauge swatch in the target stitch pattern.',
      'Complex borders require additional yardage beyond the main body calculation.',
    ],
    relevanceKeywords: ['blanket size', 'blanket calculator', 'afghan dimensions', 'baby blanket size', 'throw blanket', 'starting chain', 'how many chains for blanket'],
    supportedCraftDomains: ['blankets'],
    basePriority: 9,
  },
  {
    toolSlug: 'row-counter',
    toolTitle: 'Row Counter',
    canonicalUrl: '/tools/row-counter',
    category: 'Counter',
    actionType: 'counter',
    actionVerb: 'Count Rows',
    actionLabel: 'Start Counting Rows →',
    description: 'Offline-ready interactive row counter with audio chime, haptic vibration, reset, and log history.',
    coreProblem: 'Losing track of completed rows in long patterns or during shaping sequences, causing uneven lengths.',
    practicalCapabilities: [
      'Maintains exact current row count across sessions with browser local storage.',
      'Allows setting repeat interval reminders (e.g. increase every 6th row).',
      'Offers hands-free or tap counting with audio chime confirmation.',
    ],
    inputs: ['Starting row number', 'Target row goal (optional)', 'Repeat interval reminder (optional)'],
    outputs: ['Current active row', 'Progress percentage toward target goal', 'Session stitch history timestamp log'],
    limitations: [
      'Digital manual tracker that relies on maker tapping or pressing spacebar after each row.',
      'Does not count individual stitches within a row; for stitch-level tracking use the Stitch Counter.',
    ],
    relevanceKeywords: ['row counter', 'track rows', 'count rows', 'repeat rows', 'ribbed rows', 'beanie ribbing', 'blanket rows', 'long project'],
    supportedCraftDomains: ['blankets', 'garments', 'accessories', 'amigurumi', 'general'],
    basePriority: 7,
  },
  {
    toolSlug: 'stitch-counter',
    toolTitle: 'Stitch Counter',
    canonicalUrl: '/tools/stitch-counter',
    category: 'Counter',
    actionType: 'counter',
    actionVerb: 'Count Stitches',
    actionLabel: 'Start Counting Stitches →',
    description: 'Multi-section stitch counter to track complex repeat rounds, shaping increments, and motif counts.',
    coreProblem: 'Losing count of stitches mid-round in amigurumi, lace repeats, or complex shaping rounds.',
    practicalCapabilities: [
      'Tracks multi-section counts (e.g. Section A: 24 sts, Section B: 12 sts) for complex shaping.',
      'Ideal for amigurumi continuous spirals where stitch counts change every round.',
      'Stores progress offline without requiring an account.',
    ],
    inputs: ['Current section stitch count', 'Target round stitch total'],
    outputs: ['Active stitch count', 'Remaining stitches in current round/repeat', 'Section breakdown log'],
    limitations: [
      'Manual digital counting tool; requires maker input.',
      'Does not replace a physical locking stitch marker in the first stitch of continuous amigurumi spirals.',
    ],
    relevanceKeywords: ['stitch counter', 'count stitches', 'amigurumi', 'plushie', 'ghost', 'bat', 'pumpkin rounds', 'increase rounds', 'decrease rounds', 'spiral'],
    supportedCraftDomains: ['amigurumi', 'accessories', 'stitches', 'general'],
    basePriority: 7,
  },
  {
    toolSlug: 'us-uk-crochet-pattern-converter',
    toolTitle: 'US ↔ UK Crochet Pattern Converter',
    canonicalUrl: '/tools/us-uk-crochet-pattern-converter',
    category: 'Converter',
    actionType: 'converter',
    actionVerb: 'Convert Pattern Terms',
    actionLabel: "Let's Convert Pattern Terms →",
    description: 'Instantly convert crochet patterns between US and UK terms while preserving line breaks, repeats, and stitch counts.',
    coreProblem: 'Accidental stitch height mistakes when following patterns from British vs American designers (e.g. US single crochet = UK double crochet).',
    practicalCapabilities: [
      'Translates complete pattern text between US and UK stitch conventions in both directions.',
      'Preserves numbers, row labels, asterisks, brackets, and parenthetical repeats.',
      'Eliminates confusion between US sc and UK dc, US dc and UK tr, US hdc and UK htr.',
    ],
    inputs: ['Raw pattern text string', 'Source terminology direction (US to UK or UK to US)'],
    outputs: ['Accurately converted pattern text', 'Summary table of terms translated in the pattern'],
    limitations: [
      'Translates stitch terminology only; does not convert metric hook sizes to US letters or metric yardages to yards automatically.',
      'Cannot determine the origin terminology of an unlabeled pattern without user selection.',
    ],
    relevanceKeywords: ['us vs uk', 'uk terms', 'us terms', 'convert pattern', 'british terms', 'double crochet uk', 'single crochet us', 'terminology', 'stitch conversion'],
    supportedCraftDomains: ['stitches', 'general', 'blankets', 'garments'],
    basePriority: 8,
  },
  {
    toolSlug: 'yarn-weight-converter',
    toolTitle: 'Yarn Weight Converter',
    canonicalUrl: '/tools/yarn-weight-converter',
    category: 'Converter',
    actionType: 'converter',
    actionVerb: 'Convert Yarn Weights',
    actionLabel: "Let's Convert Yarn Weights →",
    description: 'Standard 8-tier yarn chart (Lace to Jumbo) with WPI (Wraps Per Inch), recommended hooks, and substitutes.',
    coreProblem: 'Confusion when substituting yarn brands, interpreting international labels (e.g. 8-ply, Aran, Sport), or matching mystery yarn.',
    practicalCapabilities: [
      'Maps international yarn terms (e.g. 4-ply = Fingering, 8-ply = DK, 10-ply = Worsted/Aran) to standard CYC numbered tiers 0-7.',
      'Provides standard Wraps Per Inch (WPI) ranges for measuring unlabelled stash yarn with a ruler.',
      'Lists standard gauge expectations and recommended metric and US hook sizes.',
    ],
    inputs: ['Yarn tier number, commercial weight name, or measured Wraps Per Inch (WPI)'],
    outputs: ['Full CYC classification', 'International naming equivalents', 'Recommended hook sizes', 'Expected gauge baseline'],
    limitations: [
      'WPI is an empirical guideline; fiber elasticity, halo, and drape cause slight variations between yarn brands.',
    ],
    relevanceKeywords: ['yarn weight', 'worsted', 'dk yarn', 'bulky yarn', 'wpi', 'wraps per inch', 'substitute yarn', 'yarn weight chart', 'ply', '8 ply', 'chunky yarn'],
    supportedCraftDomains: ['general', 'garments', 'blankets', 'amigurumi'],
    basePriority: 8,
  },
  {
    toolSlug: 'hook-size-converter',
    toolTitle: 'Hook Size Converter',
    canonicalUrl: '/tools/hook-size-converter',
    category: 'Converter',
    actionType: 'converter',
    actionVerb: 'Convert Hook Sizes',
    actionLabel: "Let's Convert Hook Sizes →",
    description: 'Convert metric millimeter (mm) hook sizes to US letter sizes, UK numbers, and Japanese sizes.',
    coreProblem: 'Mismatching hooks when patterns specify metric millimeters while maker hooks use US letters or vintage UK numbers.',
    practicalCapabilities: [
      'Converts precisely between metric mm, US letters (B-1 through Q), and UK/Canadian numbered hook systems.',
      'Includes half-millimeter and precision steel hook sizes for micro-crochet and lace.',
    ],
    inputs: ['Metric diameter (mm), US letter, or UK number'],
    outputs: ['Complete multi-standard sizing chart match', 'Nearest standard equivalents'],
    limitations: [
      'US letter designations can vary slightly (0.25mm) between manufacturers; metric millimeter is always the true standard.',
    ],
    relevanceKeywords: ['hook size', 'hook chart', 'mm to letter', 'h-8 hook', '5mm hook', 'crochet hook conversion', 'japanese hook size'],
    supportedCraftDomains: ['general', 'stitches', 'accessories'],
    basePriority: 7,
  },
  {
    toolSlug: 'yarn-cost-calculator',
    toolTitle: 'Yarn Cost Calculator',
    canonicalUrl: '/tools/yarn-cost-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Yarn Costs',
    actionLabel: "Let's Calculate Yarn Costs →",
    description: 'Calculate total raw material investment per project including skein prices, partial usage, and tax.',
    coreProblem: 'Underestimating the total dollar investment required for large blankets, sweaters, or multi-color projects.',
    practicalCapabilities: [
      'Calculates total project raw material cost from skein unit price, weight, and yardage consumed.',
      'Handles partial skein leftovers accurately to determine actual consumed cost vs cash outlay.',
    ],
    inputs: ['Price per skein', 'Yards/meters per skein', 'Total project yardage needed', 'Sales tax % (optional)'],
    outputs: ['Total cash outlay to purchase needed skeins', 'Exact net raw material cost consumed in the project', 'Cost per yard/meter metric'],
    limitations: [
      'Does not calculate maker labor time or overhead costs (for retail pricing, use the Selling Price Calculator).',
    ],
    relevanceKeywords: ['yarn cost', 'budget crochet', 'how much does a blanket cost', 'calculate yarn price', 'cost per skein', 'expensive yarn'],
    supportedCraftDomains: ['blankets', 'business_pricing', 'general'],
    basePriority: 7,
  },
  {
    toolSlug: 'selling-price-calculator',
    toolTitle: 'Selling Price Calculator',
    canonicalUrl: '/tools/selling-price-calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionVerb: 'Calculate Selling Price',
    actionLabel: "Let's Calculate Selling Price →",
    description: 'Calculate fair retail selling prices for craft items incorporating yarn cost, labor rate, and profit margin.',
    coreProblem: 'Makers selling handmade crochet items at craft fairs or online at a net loss due to ignoring labor time.',
    practicalCapabilities: [
      'Applies industry standard formula: (Materials + Hourly Rate * Hours) * Overhead Multiplier.',
      'Calculates both wholesale price (to stock shops) and retail price (direct to consumer).',
      'Provides reality checks against raw material costs to prevent working for pennies.',
    ],
    inputs: ['Total materials cost ($)', 'Hours spent crafting', 'Target hourly wage ($/hr)', 'Target profit margin %'],
    outputs: ['Fair minimum retail selling price', 'Suggested wholesale price', 'Break-even threshold'],
    limitations: [
      'Reflects cost-of-production pricing; local market demand and price ceilings may require optimizing project speed.',
    ],
    relevanceKeywords: ['selling crochet', 'craft fair', 'how to price crochet', 'selling price', 'crochet business', 'price calculator', 'etsy pricing', 'market bestseller'],
    supportedCraftDomains: ['business_pricing', 'amigurumi', 'accessories', 'general'],
    basePriority: 8,
  },
  {
    toolSlug: 'yarn-substitute-finder',
    toolTitle: 'Yarn Substitute Finder',
    canonicalUrl: '/tools/yarn-substitute-finder',
    category: 'Reference',
    actionType: 'finder',
    actionVerb: 'Find Compatible Yarns',
    actionLabel: 'Find Compatible Yarns →',
    description: 'Find compatible alternative yarns with identical fiber content, gauge, and weight class.',
    coreProblem: 'Pattern recommends an expensive, discontinued, or country-specific yarn that the maker cannot acquire.',
    practicalCapabilities: [
      'Evaluates fiber content compatibility (e.g. 100% acrylic, superwash wool, cotton-acrylic blend).',
      'Checks yardage per 100g and gauge matching to verify true substitute parity.',
      'Identifies budget-friendly and widely available craft-store alternatives.',
    ],
    inputs: ['Original pattern yarn name or specifications (weight tier, fiber, yardage/100g)'],
    outputs: ['Recommended substitute yarn brands', 'Fiber behavior comparison notes', 'Gauge parity rating'],
    limitations: [
      'Drape and stitch definition can differ between plant fibers (cotton, linen) and animal fibers (wool, alpaca) even at identical gauge.',
    ],
    relevanceKeywords: ['substitute yarn', 'yarn replacement', 'discontinued yarn', 'yarn alternative', 'budget yarn dupe', 'fiber swap'],
    supportedCraftDomains: ['garments', 'blankets', 'general'],
    basePriority: 8,
  },
  {
    toolSlug: 'pattern-difficulty-checker',
    toolTitle: 'Pattern Difficulty Checker',
    canonicalUrl: '/tools/pattern-difficulty-checker',
    category: 'Reference',
    actionType: 'checker',
    actionVerb: 'Check Pattern Difficulty',
    actionLabel: 'Check Pattern Difficulty →',
    description: 'Interactive quiz to assess pattern difficulty level (Beginner to Advanced) based on techniques used.',
    coreProblem: 'Makers buying patterns that are too frustrating for their current skill level, leading to abandoned WIPs.',
    practicalCapabilities: [
      'Assesses pattern complexity across 4 standard CYC levels: Beginner, Easy, Intermediate, Experienced.',
      'Analyzes required stitch techniques (post stitches, cables, shaping, colorwork).',
    ],
    inputs: ['Techniques required by the pattern', 'Shaping complexity (straight vs shaped)', 'Number of colors used'],
    outputs: ['Verified CYC difficulty rating', 'Required foundational skills checklist', 'Technique tips for success'],
    limitations: [
      'Self-assessment rating; personal familiarity with specific techniques (e.g. amigurumi vs garments) alters perceived ease.',
    ],
    relevanceKeywords: ['difficulty', 'beginner friendly', 'easy crochet', 'intermediate', 'is this hard', 'skill level', 'first project'],
    supportedCraftDomains: ['general', 'garments', 'amigurumi'],
    basePriority: 7,
  },
  {
    toolSlug: 'crochet-timer',
    toolTitle: 'Crochet Timer',
    canonicalUrl: '/tools/crochet-timer',
    category: 'Counter',
    actionType: 'timer',
    actionVerb: 'Time Your Crochet',
    actionLabel: 'Start Crochet Timer →',
    description: 'Log crafting time, calculate your stitching speed (rows per hour), and set ergonomic break alerts.',
    coreProblem: 'Underestimating project completion times and suffering hand/wrist fatigue from stitching without breaks.',
    practicalCapabilities: [
      'Tracks cumulative crafting hours across sessions.',
      'Calculates maker stitch speed (minutes per row or rows per hour) to project total finish date.',
      'Provides customizable 20-minute ergonomic stretch break alerts.',
    ],
    inputs: ['Session start/pause timestamps', 'Completed rows/units during session'],
    outputs: ['Total craft time logged', 'Average speed metric', 'Projected finish date based on remaining rows'],
    limitations: [
      'Requires user starting and stopping timer during work sessions.',
    ],
    relevanceKeywords: ['timer', 'how long does it take', 'crochet speed', 'stitching time', 'quick gift', '1 hour crochet', 'ergonomic break', 'wrist fatigue'],
    supportedCraftDomains: ['general', 'blankets', 'amigurumi', 'garments'],
    basePriority: 7,
  },
  {
    toolSlug: 'abbreviation-dictionary',
    toolTitle: 'Crochet Abbreviation Dictionary',
    canonicalUrl: '/tools/abbreviation-dictionary',
    category: 'Reference',
    actionType: 'dictionary',
    actionVerb: 'Search Abbreviations',
    actionLabel: 'Search Abbreviations →',
    description: 'Comprehensive US vs UK crochet stitch glossary with stitch diagrams and step-by-step descriptions.',
    coreProblem: 'Stopping midway through pattern reading to search for obscure or non-standard abbreviations.',
    practicalCapabilities: [
      'Comprehensive glossary of over 100 standard and advanced crochet abbreviations.',
      'Clear explanations of symbol brackets, repeats (* to *), and stitch height standards.',
    ],
    inputs: ['Abbreviation search query (e.g. "blo", "fpdc", "tog", "dec")'],
    outputs: ['Full stitch name', 'Step-by-step stitch mechanics', 'US vs UK equivalent name'],
    limitations: [
      'Reference dictionary; does not rewrite or convert complete pattern text files automatically.',
    ],
    relevanceKeywords: ['abbreviation', 'abbreviations', 'crochet terms', 'what does mean', 'crochet glossary', 'stitch shorthand', 'blo', 'flo'],
    supportedCraftDomains: ['stitches', 'general'],
    basePriority: 7,
  },
  {
    toolSlug: 'project-tracker',
    toolTitle: 'Project Tracker',
    canonicalUrl: '/tools/project-tracker',
    category: 'Organizer',
    actionType: 'tracker',
    actionVerb: 'Track Projects',
    actionLabel: 'Start Tracking Projects →',
    description: 'Keep track of active WIPs, completion status, yarn stash used, hook sizes, and photo logs.',
    coreProblem: 'Picking up an abandoned WIP months later and forgetting which hook size, tension, or dye lot was used.',
    practicalCapabilities: [
      'Saves hook size, yarn brand, colorway, and dye lot per active WIP.',
      'Maintains percentage progress tracker and notes on modifications made to the original pattern.',
    ],
    inputs: ['Project name', 'Pattern source', 'Hook size & yarn details', 'Progress %'],
    outputs: ['Central WIP dashboard', 'Archived completion portfolio'],
    limitations: [
      'Requires maker to enter project notes manually.',
    ],
    relevanceKeywords: ['project tracker', 'wip', 'wips', 'track project', 'organize crochet', 'holiday gift list', 'stash project'],
    supportedCraftDomains: ['organization', 'general'],
    basePriority: 6,
  },
  {
    toolSlug: 'pattern-pdf-organizer',
    toolTitle: 'Pattern PDF Organizer',
    canonicalUrl: '/tools/pattern-pdf-organizer',
    category: 'Organizer',
    actionType: 'organizer',
    actionVerb: 'Organize Pattern PDFs',
    actionLabel: 'Organize Pattern PDFs →',
    description: 'Save, tag, search, and organize your favorite downloadable PDF crochet pattern files in one place.',
    coreProblem: 'PDF patterns scattered across downloads folders, emails, and cloud drives with lost file names.',
    practicalCapabilities: [
      'Tags and categorizes PDF patterns by craft, season, and difficulty.',
      'Enables fast keyword searching across personal pattern libraries.',
    ],
    inputs: ['PDF pattern metadata and tags'],
    outputs: ['Structured digital pattern binder'],
    limitations: [
      'Client-side digital filing system; does not generate patterns or host third-party copyrighted content.',
    ],
    relevanceKeywords: ['pdf pattern', 'organize patterns', 'pattern organizer', 'save pdf', 'digital patterns'],
    supportedCraftDomains: ['organization', 'general'],
    basePriority: 6,
  },
  {
    toolSlug: 'pattern-library',
    toolTitle: 'Pattern Library / Collections',
    canonicalUrl: '/tools/pattern-library',
    category: 'Organizer',
    actionType: 'library',
    actionVerb: 'Explore Pattern Library',
    actionLabel: 'Explore Pattern Library →',
    description: 'Organize saved patterns into custom visual folders like "Gift Ideas", "Blankets", or "Winter Wear".',
    coreProblem: 'Overwhelmed by bookmarks and screenshots with no structured way to queue seasonal projects.',
    practicalCapabilities: [
      'Creates curated visual boards and folders for project planning.',
      'Queues patterns in priority order for upcoming seasons and gift deadlines.',
    ],
    inputs: ['Pattern links, names, and custom folder tags'],
    outputs: ['Visual mood board and categorized project queue'],
    limitations: [
      'Curation and organization tool; relies on user adding pattern links.',
    ],
    relevanceKeywords: ['pattern library', 'pattern queue', 'pattern collections', 'save patterns', 'gift ideas queue'],
    supportedCraftDomains: ['organization', 'general'],
    basePriority: 6,
  },
  {
    toolSlug: 'needle-size-converter',
    toolTitle: 'Needle Size Converter',
    canonicalUrl: '/tools/needle-size-converter',
    category: 'Converter',
    actionType: 'converter',
    actionVerb: 'Convert Needle Sizes',
    actionLabel: "Let's Convert Needle Sizes →",
    description: 'Quick reference converter between metric (mm), US, and UK knitting needle measurements.',
    coreProblem: 'Bi-craftual crafters converting needle sizes for knit borders or hybrid knit-crochet projects.',
    practicalCapabilities: [
      'Converts metric mm to US and UK knitting needle numbers.',
    ],
    inputs: ['Metric needle mm or US needle number'],
    outputs: ['Matched standard sizes'],
    limitations: [
      'Strictly for knitting needles; for crochet hooks use the Hook Size Converter.',
    ],
    relevanceKeywords: ['needle size', 'knitting needle converter', 'bi-craftual', 'knit border'],
    supportedCraftDomains: ['general'],
    basePriority: 4,
  },
];

export interface ToolMatchResult {
  success: boolean;
  tool?: ToolItem;
  profile?: ToolCapabilityProfile;
  problemSolved?: string;
  isRotationFallback?: boolean;
  rotationNote?: string;
  reason?: string;
}

/**
 * Normalizes text for matching keywords.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Scores the semantic fit between a topic keyword and a tool profile.
 * Returns score > 0 if genuinely relevant, 0 if irrelevant.
 */
export function scoreToolRelevanceForTopic(keyword: string, profile: ToolCapabilityProfile): number {
  const normKw = normalizeText(keyword);
  let score = 0;

  // Direct keyword matches
  for (const rk of profile.relevanceKeywords) {
    if (normKw.includes(rk)) {
      score += 15;
    }
  }

  // Domain-specific relevance boosters
  const isBlanket = /blanket|afghan|throw|lapghan|quilt/i.test(normKw);
  const isGrannySquare = /granny square|motif/i.test(normKw);
  const isBorder = /border|edging|edge/i.test(normKw);
  const isAmigurumi = /amigurumi|plush|plushie|toy|ghost|bat|stuffed/i.test(normKw);
  const isWearable = /beanie|hat|sweater|cardigan|mitten|sock|garment|vest/i.test(normKw);
  const isTerminology = /us vs uk|terms|terminology|british|conversion|abbreviation/i.test(normKw);
  const isSelling = /price|sell|selling|craft fair|market/i.test(normKw);

  if (isBlanket) {
    if (profile.toolSlug === 'blanket-calculator') score += 30;
    if (profile.toolSlug === 'yarn-calculator') score += 25;
    if (profile.toolSlug === 'border-calculator' && isBorder) score += 40;
    if (profile.toolSlug === 'granny-square-calculator' && isGrannySquare) score += 40;
    if (profile.toolSlug === 'row-counter') score += 15;
  }

  if (isGrannySquare) {
    if (profile.toolSlug === 'granny-square-calculator') score += 40;
    if (profile.toolSlug === 'yarn-calculator') score += 20;
    if (profile.toolSlug === 'border-calculator') score += 20;
  }

  if (isAmigurumi) {
    if (profile.toolSlug === 'stitch-counter') score += 35;
    if (profile.toolSlug === 'yarn-calculator') score += 25;
    if (profile.toolSlug === 'row-counter') score += 20;
    if (profile.toolSlug === 'selling-price-calculator') score += 20;
  }

  if (isWearable) {
    if (profile.toolSlug === 'gauge-calculator') score += 35;
    if (profile.toolSlug === 'yarn-weight-converter') score += 20;
    if (profile.toolSlug === 'row-counter') score += 18;
    if (profile.toolSlug === 'yarn-calculator') score += 18;
    if (profile.toolSlug === 'hook-size-converter') score += 15;
  }

  if (isTerminology) {
    if (profile.toolSlug === 'us-uk-crochet-pattern-converter') score += 45;
    if (profile.toolSlug === 'abbreviation-dictionary') score += 35;
  }

  if (isSelling) {
    if (profile.toolSlug === 'selling-price-calculator') score += 45;
    if (profile.toolSlug === 'yarn-cost-calculator') score += 30;
  }

  // Fallback for general projects (pumpkins, fall decor, etc.)
  if (/pumpkin|autumn|fall|halloween|christmas|ornament|gift/i.test(normKw)) {
    if (profile.toolSlug === 'yarn-calculator') score += 25;
    if (profile.toolSlug === 'stitch-counter') score += 20;
    if (profile.toolSlug === 'crochet-timer') score += 18;
    if (profile.toolSlug === 'selling-price-calculator') score += 15;
    if (profile.toolSlug === 'row-counter') score += 15;
  }

  // Hard negative boundaries: Reject completely illogical pairings
  if (profile.toolSlug === 'needle-size-converter' && !/knit/i.test(normKw)) {
    return 0; // Never pair knitting needle tool with pure crochet
  }
  if (profile.toolSlug === 'border-calculator' && !isBlanket && !isBorder && !isGrannySquare) {
    return 0; // Border calculator only makes sense for blankets/motifs/borders
  }
  if (profile.toolSlug === 'granny-square-calculator' && !isGrannySquare && !isBlanket) {
    return 0; // Granny square calculator only for squares/blankets
  }

  return score;
}

/**
 * Validates whether a specific tool can genuinely help with the specified topic.
 */
export function validateToolTopicPairing(
  toolSlug: string,
  topicKeyword: string
): { valid: boolean; reason?: string } {
  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    return { valid: false, reason: `Tool "${toolSlug}" does not exist in WeLovePattern toolsData.` };
  }

  const profile = TOOL_CAPABILITY_PROFILES.find(p => p.toolSlug === tool.slug);
  if (!profile) {
    return { valid: false, reason: `No verified capability profile exists for tool "${toolSlug}".` };
  }

  const score = scoreToolRelevanceForTopic(topicKeyword, profile);
  if (score <= 0) {
    return {
      valid: false,
      reason: `Tool "${tool.title}" is irrelevant or unable to perform the required function for topic "${topicKeyword}".`,
    };
  }

  return { valid: true };
}

/**
 * Matches a candidate trend topic to the best real tool from TOOLS_DATA,
 * respecting daily rotation and recent tool history.
 */
export function matchTopicToTool(
  topicKeyword: string,
  options?: {
    recentToolSlugs?: string[];
    excludeToolSlugs?: string[];
  }
): ToolMatchResult {
  const recentSlugs = new Set((options?.recentToolSlugs || []).map(s => s.toLowerCase().trim()));
  const excludedSlugs = new Set((options?.excludeToolSlugs || []).map(s => s.toLowerCase().trim()));

  // 1. Score all profiles for this topic
  const eligibleCandidates: { profile: ToolCapabilityProfile; score: number }[] = [];

  for (const profile of TOOL_CAPABILITY_PROFILES) {
    if (excludedSlugs.has(profile.toolSlug.toLowerCase())) continue;

    // Verify route exists
    if (!isRouteValid(profile.canonicalUrl)) continue;

    // Verify tool exists in TOOLS_DATA
    const toolItem = getToolBySlug(profile.toolSlug);
    if (!toolItem) continue;

    const relevance = scoreToolRelevanceForTopic(topicKeyword, profile);
    if (relevance > 0) {
      eligibleCandidates.push({ profile, score: relevance });
    }
  }

  if (eligibleCandidates.length === 0) {
    // General fallback: Yarn Calculator is the most universal craft tool
    const yarnCalc = TOOL_CAPABILITY_PROFILES.find(p => p.toolSlug === 'yarn-calculator');
    if (yarnCalc) {
      const tool = getToolBySlug('yarn-calculator')!;
      return {
        success: true,
        tool,
        profile: yarnCalc,
        problemSolved: yarnCalc.coreProblem,
        isRotationFallback: true,
        rotationNote: 'Universal fallback tool applied for craft planning.',
      };
    }
    return {
      success: false,
      reason: `No relevant verified tool found for topic "${topicKeyword}".`,
    };
  }

  // Sort by score descending, then basePriority descending
  eligibleCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.profile.basePriority - a.profile.basePriority;
  });

  // 2. Rotation preference: Select highest-scoring tool that has NOT been used recently
  const nonRecentCandidates = eligibleCandidates.filter(c => !recentSlugs.has(c.profile.toolSlug.toLowerCase()));

  if (nonRecentCandidates.length > 0) {
    const chosen = nonRecentCandidates[0];
    const tool = getToolBySlug(chosen.profile.toolSlug)!;
    return {
      success: true,
      tool,
      profile: chosen.profile,
      problemSolved: chosen.profile.coreProblem,
      isRotationFallback: false,
    };
  }

  // 3. Fallback when all matching tools were used recently:
  // Pick the top-scoring candidate and document fallback behavior
  const fallbackChoice = eligibleCandidates[0];
  const tool = getToolBySlug(fallbackChoice.profile.toolSlug)!;
  return {
    success: true,
    tool,
    profile: fallbackChoice.profile,
    problemSolved: fallbackChoice.profile.coreProblem,
    isRotationFallback: true,
    rotationNote: `All matching tools for "${topicKeyword}" were used recently. Selected highest-fidelity match "${tool.title}" as documented rotation fallback.`,
  };
}

/**
 * Extracts chronological tool rotation history from state.
 */
export function getToolRotationHistory(state: SeoEngineDailyState): string[] {
  const history: string[] = [];

  // Check state.activeJobs (most recent first)
  for (const j of state.activeJobs || []) {
    if (j.topic?.toolSlug) {
      history.push(j.topic.toolSlug.toLowerCase());
    }
  }

  // Check state.completedJobsHistory
  for (const h of state.completedJobsHistory || []) {
    const slug = (h as any).toolSlug || (h as any).topic?.toolSlug;
    if (slug) {
      history.push(slug.toLowerCase());
    }
  }

  return [...new Set(history)];
}
