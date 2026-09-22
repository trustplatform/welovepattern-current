export type Difficulty = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced';

export type CategoryId = 
  | 'blankets'
  | 'flowers'
  | 'amigurumi'
  | 'bags'
  | 'baby'
  | 'tops'
  | 'sweaters'
  | 'accessories'
  | 'home-decor'
  | 'christmas'
  | 'halloween'
  | 'animals'
  | 'granny-squares';

export interface Category {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
  count: number;
  popularStitches?: string[];
  isFreeBadge?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface PatternStep {
  rowNumber: string;
  instruction: string;
  stitchCount?: string;
  tip?: string;
  image?: string;
}

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredDataJson?: string;
}

export interface Pattern {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  category: CategoryId;
  image: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  downloadsCount: number;
  hookSize: string; // e.g. "5.0 mm (H-8)"
  yarnWeight: string; // e.g. "Medium / Worsted (#4)"
  yarnBrand?: string;
  yarnMetersNeeded: number;
  finishedSize: string;
  estimatedTimeHours: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  createdAt: string;
  materials: string[];
  gauge: string; // e.g. "14 sts and 10 rows = 4 inches (10 cm)"
  abbreviationsUsed: string[];
  steps: PatternStep[];
  pdfSize: string;
  pdfPages: number;
  pdfUrl?: string; // Custom external or direct link for downloading free PDF pattern
  faq?: { question: string; answer: string }[];
  tags: string[];
  seoMeta?: SeoMeta;
  pinterestBoardId?: string;
  pinterestBoardName?: string;
  pinterestTemplateId?: string;
  pinterestStatus?: 'pending' | 'published' | 'failed';
  pinterestPinId?: string;
  pinterestPublishedAt?: string;
  pinterestError?: string;
}

export interface Review {
  id: string;
  patternId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  verifiedMaker: boolean;
}

export interface BlogSeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  isNoIndex?: boolean;
  isNoFollow?: boolean;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  isNoIndex?: boolean;
  updatedAt?: string;
}

export interface PatternSeoArticle {
  id: string;
  patternId: string;
  patternSlug?: string;
  patternTitle?: string;
  title: string;
  content: string;
  author: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  date: string;
  updatedAt?: string;
  readTime?: string;
  image: string;
  imageAlt?: string;
  imageCaption?: string;
  tags: string[];
  status?: 'draft' | 'published';
  seoMeta?: BlogSeoMeta;
}

export interface ToolItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: 'Counter' | 'Calculator' | 'Converter' | 'Organizer' | 'Reference';
  isPopular?: boolean;
  isOfflineCapable?: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  patternName?: string;
  category: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  progressPercent: number;
  currentRow: number;
  totalRows: number;
  hookSize: string;
  yarnNotes: string;
  startDate: string;
  targetDate?: string;
  completedDate?: string;
  notes: string;
  image?: string;
}

export interface RowCounterHistory {
  id: string;
  timestamp: string;
  count: number;
  note: string;
  projectName?: string;
}

export interface Abbreviation {
  usTerm: string;
  ukTerm: string;
  name: string;
  description: string;
  symbol?: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface SafePinterestAccount {
  username?: string;
  businessName?: string;
  profileImage?: string;
  accountType?: string;
}

export interface SafePinterestStatus {
  connected: boolean;
  configured: boolean;
  appIdConfigured: boolean;
  appSecretConfigured: boolean;
  redirectUri: string;
  account: SafePinterestAccount | null;
  scope: string | null;
  connectedAt: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  hasBoardsWriteScope?: boolean;
  error?: string | null;
}

export interface PinterestBoard {
  id: string;
  name: string;
  imageThumbnailUrl?: string;
}
