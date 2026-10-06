import { ToolItem } from '../types';

export const TOOLS_DATA: ToolItem[] = [
  {
    id: 'row-counter',
    slug: 'row-counter',
    title: 'Row Counter',
    description: 'Offline-ready interactive row counter with audio chime, haptic vibration, reset, and log history.',
    icon: 'Hash',
    category: 'Counter',
    actionType: 'counter',
    actionLabel: 'Start Counting Rows →',
    actionVerb: 'Count Rows',
    isPopular: true,
    isOfflineCapable: true
  },
  {
    id: 'stitch-counter',
    slug: 'stitch-counter',
    title: 'Stitch Counter',
    description: 'Multi-section stitch counter to track complex repeat rounds, shaping increments, and motif counts.',
    icon: 'ListOrdered',
    category: 'Counter',
    actionType: 'counter',
    actionLabel: 'Start Counting Stitches →',
    actionVerb: 'Count Stitches',
    isOfflineCapable: true
  },
  {
    id: 'project-tracker',
    slug: 'project-tracker',
    title: 'Project Tracker',
    description: 'Keep track of active WIPs, completion status, yarn stash used, hook sizes, and photo logs.',
    icon: 'FolderHeart',
    category: 'Organizer',
    actionType: 'tracker',
    actionLabel: 'Start Tracking Projects →',
    actionVerb: 'Track Projects',
    isPopular: true
  },
  {
    id: 'gauge-calculator',
    slug: 'gauge-calculator',
    title: 'Gauge Calculator',
    description: 'Compare your swatch gauge to pattern target gauge to calculate exact stitch & row count adjustments.',
    icon: 'Ruler',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Gauge →",
    actionVerb: 'Calculate Gauge',
    isPopular: true
  },
  {
    id: 'yarn-calculator',
    slug: 'yarn-calculator',
    title: 'Yarn Calculator',
    description: 'Estimate total yards/meters and skeins needed for blankets, sweaters, baby items, and plushies.',
    icon: 'Calculator',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Yarn →",
    actionVerb: 'Calculate Yarn',
    isPopular: true
  },
  {
    id: 'us-uk-crochet-pattern-converter',
    slug: 'us-uk-crochet-pattern-converter',
    title: 'US ↔ UK Crochet Pattern Converter',
    description: 'Instantly convert crochet patterns between US and UK terms while preserving line breaks, repeats, and stitch counts.',
    icon: 'ArrowRightLeft',
    category: 'Converter',
    actionType: 'converter',
    actionLabel: "Let's Convert Pattern Terms →",
    actionVerb: 'Convert Pattern Terms',
    isPopular: true,
    isOfflineCapable: true
  },
  {
    id: 'yarn-weight-converter',
    slug: 'yarn-weight-converter',
    title: 'Yarn Weight Converter',
    description: 'Standard 8-tier yarn chart (Lace to Jumbo) with WPI (Wraps Per Inch), recommended hooks, and substitutes.',
    icon: 'Layers',
    category: 'Converter',
    actionType: 'converter',
    actionLabel: "Let's Convert Yarn Weights →",
    actionVerb: 'Convert Yarn Weights'
  },
  {
    id: 'hook-size-converter',
    slug: 'hook-size-converter',
    title: 'Hook Size Converter',
    description: 'Convert metric millimeter (mm) hook sizes to US letter sizes, UK numbers, and Japanese sizes.',
    icon: 'Wrench',
    category: 'Converter',
    actionType: 'converter',
    actionLabel: "Let's Convert Hook Sizes →",
    actionVerb: 'Convert Hook Sizes',
    isPopular: true
  },
  {
    id: 'needle-size-converter',
    slug: 'needle-size-converter',
    title: 'Needle Size Converter',
    description: 'Quick reference converter between metric (mm), US, and UK knitting needle measurements.',
    icon: 'Scissors',
    category: 'Converter',
    actionType: 'converter',
    actionLabel: "Let's Convert Needle Sizes →",
    actionVerb: 'Convert Needle Sizes'
  },
  {
    id: 'granny-square-calculator',
    slug: 'granny-square-calculator',
    title: 'Granny Square Calculator',
    description: 'Calculate total granny squares needed for any blanket dimension plus assembly border yardage.',
    icon: 'Grid',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Granny Squares →",
    actionVerb: 'Calculate Granny Squares',
    isPopular: true
  },
  {
    id: 'blanket-calculator',
    slug: 'blanket-calculator',
    title: 'Blanket Calculator',
    description: 'Calculate starting chain, row counts, and yardage for standard blanket sizes (Baby, Throw, Queen, King).',
    icon: 'Maximize2',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Blanket Sizes →",
    actionVerb: 'Calculate Blanket Sizes',
    isPopular: true
  },
  {
    id: 'border-calculator',
    slug: 'border-calculator',
    title: 'Border Calculator',
    description: 'Calculate side edge stitch pick-ups and corner repeat multiples for perfectly flat blanket borders.',
    icon: 'Square',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Border Stitches →",
    actionVerb: 'Calculate Border Stitches'
  },
  {
    id: 'yarn-cost-calculator',
    slug: 'yarn-cost-calculator',
    title: 'Yarn Cost Calculator',
    description: 'Calculate total raw material investment per project including skein prices, partial usage, and tax.',
    icon: 'DollarSign',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Yarn Costs →",
    actionVerb: 'Calculate Yarn Costs'
  },
  {
    id: 'selling-price-calculator',
    slug: 'selling-price-calculator',
    title: 'Selling Price Calculator',
    description: 'Calculate fair retail selling prices for craft items incorporating yarn cost, labor rate, and profit margin.',
    icon: 'Tag',
    category: 'Calculator',
    actionType: 'calculator',
    actionLabel: "Let's Calculate Selling Price →",
    actionVerb: 'Calculate Selling Price',
    isPopular: true
  },
  {
    id: 'yarn-substitute-finder',
    slug: 'yarn-substitute-finder',
    title: 'Yarn Substitute Finder',
    description: 'Find compatible alternative yarns with identical fiber content, gauge, and weight class.',
    icon: 'RefreshCw',
    category: 'Reference',
    actionType: 'finder',
    actionLabel: 'Find Compatible Yarns →',
    actionVerb: 'Find Compatible Yarns'
  },
  {
    id: 'pattern-difficulty-checker',
    slug: 'pattern-difficulty-checker',
    title: 'Pattern Difficulty Checker',
    description: 'Interactive quiz to assess pattern difficulty level (Beginner to Advanced) based on techniques used.',
    icon: 'CheckCircle2',
    category: 'Reference',
    actionType: 'checker',
    actionLabel: 'Check Pattern Difficulty →',
    actionVerb: 'Check Pattern Difficulty'
  },
  {
    id: 'pattern-pdf-organizer',
    slug: 'pattern-pdf-organizer',
    title: 'Pattern PDF Organizer',
    description: 'Save, tag, search, and organize your favorite downloadable PDF crochet pattern files in one place.',
    icon: 'FileText',
    category: 'Organizer',
    actionType: 'organizer',
    actionLabel: 'Organize Pattern PDFs →',
    actionVerb: 'Organize Pattern PDFs'
  },
  {
    id: 'crochet-timer',
    slug: 'crochet-timer',
    title: 'Crochet Timer',
    description: 'Log crafting time, calculate your stitching speed (rows per hour), and set ergonomic break alerts.',
    icon: 'Clock',
    category: 'Counter',
    actionType: 'timer',
    actionLabel: 'Start Crochet Timer →',
    actionVerb: 'Time Your Crochet',
    isOfflineCapable: true
  },
  {
    id: 'pattern-library',
    slug: 'pattern-library',
    title: 'Pattern Library / Collections',
    description: 'Organize saved patterns into custom visual folders like "Gift Ideas", "Blankets", or "Winter Wear".',
    icon: 'BookOpen',
    category: 'Organizer',
    actionType: 'library',
    actionLabel: 'Explore Pattern Library →',
    actionVerb: 'Explore Pattern Library'
  },
  {
    id: 'abbreviation-dictionary',
    slug: 'abbreviation-dictionary',
    title: 'Crochet Abbreviation Dictionary',
    description: 'Comprehensive US vs UK crochet stitch glossary with stitch diagrams and step-by-step descriptions.',
    icon: 'BookMarked',
    category: 'Reference',
    actionType: 'dictionary',
    actionLabel: 'Search Abbreviations →',
    actionVerb: 'Search Abbreviations',
    isPopular: true
  }
];

export function getToolBySlug(slug?: string): ToolItem | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.trim().toLowerCase().replace(/^\/tools\//, '').replace(/^\//, '');
  return TOOLS_DATA.find(t => t.slug.toLowerCase() === cleanSlug || t.id.toLowerCase() === cleanSlug);
}

export function getToolByUrl(url?: string): ToolItem | undefined {
  if (!url) return undefined;
  const match = url.trim().toLowerCase().match(/\/tools\/([a-z0-9-]+)/);
  if (match) {
    return getToolBySlug(match[1]);
  }
  return getToolBySlug(url);
}
