import { ToolItem } from '../types';

export const TOOLS_DATA: ToolItem[] = [
  {
    id: 'row-counter',
    slug: 'row-counter',
    title: 'Row Counter',
    description: 'Offline-ready interactive row counter with audio chime, haptic vibration, reset, and log history.',
    icon: 'Hash',
    category: 'Counter',
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
    isOfflineCapable: true
  },
  {
    id: 'project-tracker',
    slug: 'project-tracker',
    title: 'Project Tracker',
    description: 'Keep track of active WIPs, completion status, yarn stash used, hook sizes, and photo logs.',
    icon: 'FolderHeart',
    category: 'Organizer',
    isPopular: true
  },
  {
    id: 'gauge-calculator',
    slug: 'gauge-calculator',
    title: 'Gauge Calculator',
    description: 'Compare your swatch gauge to pattern target gauge to calculate exact stitch & row count adjustments.',
    icon: 'Ruler',
    category: 'Calculator',
    isPopular: true
  },
  {
    id: 'yarn-calculator',
    slug: 'yarn-calculator',
    title: 'Yarn Calculator',
    description: 'Estimate total yards/meters and skeins needed for blankets, sweaters, baby items, and plushies.',
    icon: 'Calculator',
    category: 'Calculator',
    isPopular: true
  },
  {
    id: 'yarn-weight-converter',
    slug: 'yarn-weight-converter',
    title: 'Yarn Weight Converter',
    description: 'Standard 8-tier yarn chart (Lace to Jumbo) with WPI (Wraps Per Inch), recommended hooks, and substitutes.',
    icon: 'Layers',
    category: 'Converter'
  },
  {
    id: 'hook-size-converter',
    slug: 'hook-size-converter',
    title: 'Hook Size Converter',
    description: 'Convert metric millimeter (mm) hook sizes to US letter sizes, UK numbers, and Japanese sizes.',
    icon: 'Wrench',
    category: 'Converter',
    isPopular: true
  },
  {
    id: 'needle-size-converter',
    slug: 'needle-size-converter',
    title: 'Needle Size Converter',
    description: 'Quick reference converter between metric (mm), US, and UK knitting needle measurements.',
    icon: 'Scissors',
    category: 'Converter'
  },
  {
    id: 'granny-square-calculator',
    slug: 'granny-square-calculator',
    title: 'Granny Square Calculator',
    description: 'Calculate total granny squares needed for any blanket dimension plus assembly border yardage.',
    icon: 'Grid',
    category: 'Calculator',
    isPopular: true
  },
  {
    id: 'blanket-calculator',
    slug: 'blanket-calculator',
    title: 'Blanket Calculator',
    description: 'Calculate starting chain, row counts, and yardage for standard blanket sizes (Baby, Throw, Queen, King).',
    icon: 'Maximize2',
    category: 'Calculator',
    isPopular: true
  },
  {
    id: 'border-calculator',
    slug: 'border-calculator',
    title: 'Border Calculator',
    description: 'Calculate side edge stitch pick-ups and corner repeat multiples for perfectly flat blanket borders.',
    icon: 'Square',
    category: 'Calculator'
  },
  {
    id: 'yarn-cost-calculator',
    slug: 'yarn-cost-calculator',
    title: 'Yarn Cost Calculator',
    description: 'Calculate total raw material investment per project including skein prices, partial usage, and tax.',
    icon: 'DollarSign',
    category: 'Calculator'
  },
  {
    id: 'selling-price-calculator',
    slug: 'selling-price-calculator',
    title: 'Selling Price Calculator',
    description: 'Calculate fair retail selling prices for craft items incorporating yarn cost, labor rate, and profit margin.',
    icon: 'Tag',
    category: 'Calculator',
    isPopular: true
  },
  {
    id: 'yarn-substitute-finder',
    slug: 'yarn-substitute-finder',
    title: 'Yarn Substitute Finder',
    description: 'Find compatible alternative yarns with identical fiber content, gauge, and weight class.',
    icon: 'RefreshCw',
    category: 'Reference'
  },
  {
    id: 'pattern-difficulty-checker',
    slug: 'pattern-difficulty-checker',
    title: 'Pattern Difficulty Checker',
    description: 'Interactive quiz to assess pattern difficulty level (Beginner to Advanced) based on techniques used.',
    icon: 'CheckCircle2',
    category: 'Reference'
  },
  {
    id: 'pattern-pdf-organizer',
    slug: 'pattern-pdf-organizer',
    title: 'Pattern PDF Organizer',
    description: 'Save, tag, search, and organize your favorite downloadable PDF crochet pattern files in one place.',
    icon: 'FileText',
    category: 'Organizer'
  },
  {
    id: 'crochet-timer',
    slug: 'crochet-timer',
    title: 'Crochet Timer',
    description: 'Log crafting time, calculate your stitching speed (rows per hour), and set ergonomic break alerts.',
    icon: 'Clock',
    category: 'Counter',
    isOfflineCapable: true
  },
  {
    id: 'pattern-library',
    slug: 'pattern-library',
    title: 'Pattern Library / Collections',
    description: 'Organize saved patterns into custom visual folders like "Gift Ideas", "Blankets", or "Winter Wear".',
    icon: 'BookOpen',
    category: 'Organizer'
  },
  {
    id: 'abbreviation-dictionary',
    slug: 'abbreviation-dictionary',
    title: 'Crochet Abbreviation Dictionary',
    description: 'Comprehensive US vs UK crochet stitch glossary with stitch diagrams and step-by-step descriptions.',
    icon: 'BookMarked',
    category: 'Reference',
    isPopular: true
  }
];
