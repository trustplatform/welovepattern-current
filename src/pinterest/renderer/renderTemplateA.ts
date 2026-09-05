import sharp, { OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";
import { TEMPLATE_A } from "../templates/templateA";

const ROOT = process.cwd();
const TEMPLATE = path.resolve(ROOT, "assets/pinterest/templates/template-a.png");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, "public/generated/pinterest");

export interface PinterestPatternInput {
  id?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  difficulty?: string;
  image: string;
  gallery?: string[];
  description?: string;
  category?: string;
  tags?: string[];
  hookSize?: string;
  materials?: string[];
  pdfUrl?: string;
  isFree?: boolean;
  price?: number;
}

export interface RenderPinterestResult {
  outputPath: string;
  publicUrl: string;
  filename: string;
  width: number;
  height: number;
}

const defaultTestPattern: PinterestPatternInput = {
  title: "Cozy Sunburst Granny Square Blanket",
  subtitle:
    "Classic vintage heirloom throw blanket\nwith a modern pastel twist",
  difficulty: "Easy",
  image:
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
  ],
};

/* =========================================
   DOWNLOAD + CROP IMAGE
========================================= */

async function fetchImage(
  url: string,
  width: number,
  height: number
): Promise<Buffer> {
  let buffer: Buffer;

  if (!url || typeof url !== "string") {
    throw new Error("Invalid or empty image URL provided for Pinterest pin");
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith("data:") && trimmedUrl.includes(";base64,")) {
    const base64Data = trimmedUrl.split(";base64,")[1];
    buffer = Buffer.from(base64Data, "base64");
  } else if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    // Relative local path like /uploads/patterns/... or data/uploads/...
    const cleanPath = trimmedUrl.startsWith("/") ? trimmedUrl.slice(1) : trimmedUrl;
    let localFile = path.resolve(ROOT, cleanPath);
    if (!fs.existsSync(localFile) && cleanPath.startsWith("uploads/")) {
      localFile = path.resolve(ROOT, "data", cleanPath);
    }
    if (fs.existsSync(localFile)) {
      buffer = await fs.promises.readFile(localFile);
    } else {
      throw new Error(`Local image file not found on disk: ${trimmedUrl}`);
    }
  } else if (trimmedUrl.includes("/uploads/")) {
    // URL with domain like https://welovepattern.com/uploads/patterns/...
    const uploadsIndex = trimmedUrl.indexOf("/uploads/");
    const subPath = trimmedUrl.slice(uploadsIndex + 1); // "uploads/..."
    const localFile = path.resolve(ROOT, "data", subPath);
    if (fs.existsSync(localFile)) {
      buffer = await fs.promises.readFile(localFile);
    } else {
      const response = await fetch(trimmedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${trimmedUrl}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
  } else {
    // Remote HTTP/HTTPS URL
    const response = await fetch(trimmedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${trimmedUrl}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  }

  return sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();
}


/* =========================================
   XML ESCAPE
========================================= */

function escapeXml(value: string): string {

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


/* =========================================
   WORD WRAP
========================================= */

function wrapText(
  text: string,
  maxCharsPerLine: number
): string[] {

  const words = text.split(/\s+/);

  const lines: string[] = [];

  let current = "";

  for (const word of words) {

    const test =
      current.length === 0
        ? word
        : `${current} ${word}`;

    if (test.length <= maxCharsPerLine) {

      current = test;

    } else {

      if (current) {
        lines.push(current);
      }

      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}


/* =========================================
   DYNAMIC TEXT SVG
========================================= */

function createFittedTextSvg(
  text: string,
  width: number,
  height: number,
  options: {
    maxFontSize: number;
    minFontSize: number;
    color: string;
    fontWeight?: number;
    maxLines: number;
  }
): Buffer {

  const horizontalPadding = 45;
  const verticalPadding = 8;

  const availableWidth =
    width - horizontalPadding * 2;

  const availableHeight =
    height - verticalPadding * 2;

  let fontSize = options.maxFontSize;

  let lines: string[] = [];

  /*
   * Build candidate lines using the available width.
   * We intentionally keep a generous safety margin.
   */

  while (fontSize >= options.minFontSize) {

    const maxChars =
      Math.max(
        8,
        Math.floor(
          availableWidth /
          (fontSize * 0.58)
        )
      );

    lines = text
  .split("\n")
  .flatMap((line) => wrapText(line, maxChars));

    const lineHeight =
      fontSize * 1.08;

    const totalHeight =
      lines.length * lineHeight;

    if (
      lines.length <= options.maxLines &&
      totalHeight <= availableHeight
    ) {
      break;
    }

    fontSize -= 1;
  }

  /*
   * Safety fallback.
   */

  if (lines.length > options.maxLines) {

    lines = lines.slice(
      0,
      options.maxLines
    );

    const lastIndex =
      lines.length - 1;

    lines[lastIndex] =
      `${lines[lastIndex]}…`;
  }

  const lineHeight =
    fontSize * 1.08;

  const totalHeight =
    lines.length * lineHeight;

  const startY =
    (height - totalHeight) / 2 +
    fontSize;

  const tspans =
    lines
      .map(
        (line, index) => `
          <tspan
            x="${width / 2}"
            dy="${
              index === 0
                ? 0
                : lineHeight
            }"
          >${escapeXml(line)}</tspan>
        `
      )
      .join("");

  return Buffer.from(`
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <style>
        .text {
          font-family: "DejaVu Sans";
          font-size: ${fontSize}px;
          font-weight: ${options.fontWeight ?? 700};
          fill: ${options.color};
        }
      </style>

      <text
        x="${width / 2}"
        y="${startY}"
        text-anchor="middle"
        class="text"
      >
        ${tspans}
      </text>

    </svg>
  `);
}


/* =========================================
   CRAFT TYPE & DYNAMIC CONTENT LOGIC
========================================= */

export type CraftType =
  | "CROCHET"
  | "SEWING"
  | "KNITTING"
  | "MACRAME"
  | "QUILTING"
  | "EMBROIDERY"
  | "HANDCRAFTED";

/**
 * Derives the craft type from available Pattern metadata (title, category, tags, description, hook/yarn).
 * This dynamically adapts content without hardcoding crochet for non-crochet patterns.
 */
export function detectCraftType(pattern: PinterestPatternInput): CraftType {
  const title = (pattern.title || "").trim();
  const tagsStr = (pattern.tags || []).join(" ").toLowerCase();
  const desc = (pattern.description || "").toLowerCase();
  const subtitle = (pattern.subtitle || "").toLowerCase();
  const fullText = `${title} ${pattern.category || ""} ${tagsStr} ${desc} ${subtitle}`.toLowerCase();

  // 1. Direct title-level indicators (strongest source of truth)
  if (/\b(sewing|sew|dressmaking|pattern pieces|garment)\b/i.test(title)) {
    return "SEWING";
  }
  if (/\b(knitting|knit|purl|cast on)\b/i.test(title)) {
    return "KNITTING";
  }
  if (/\b(macrame|knotting)\b/i.test(title)) {
    return "MACRAME";
  }
  if (/\b(quilting|quilt|patchwork)\b/i.test(title)) {
    return "QUILTING";
  }
  if (/\b(crochet|amigurumi|granny square)\b/i.test(title)) {
    return "CROCHET";
  }

  // 2. Tags & metadata indicators
  if (/\b(sewing|sew)\b/i.test(tagsStr)) {
    return "SEWING";
  }
  if (/\b(knitting|knit)\b/i.test(tagsStr)) {
    return "KNITTING";
  }
  if (/\b(macrame)\b/i.test(tagsStr)) {
    return "MACRAME";
  }
  if (/\b(crochet|amigurumi|granny square)\b/i.test(tagsStr)) {
    return "CROCHET";
  }

  // 3. Body text indicators
  if (/\bsewing\s+pattern\b/i.test(fullText)) {
    return "SEWING";
  }
  if (/\bknitting\s+pattern\b/i.test(fullText)) {
    return "KNITTING";
  }

  // 4. Hook/yarn attributes
  if (pattern.hookSize && pattern.hookSize.trim().length > 0 && !/\b(n\/?a|none)\b/i.test(pattern.hookSize)) {
    return "CROCHET";
  }

  // 5. Default category fallback for WeLovePattern
  if (/\b(crochet|amigurumi)\b/i.test(fullText)) {
    return "CROCHET";
  }

  return "CROCHET";
}

/**
 * Checks if the pattern is free based on explicit tags, properties, or project context.
 */
export function detectIsFree(pattern: PinterestPatternInput): boolean {
  if (pattern.isFree === false) return false;
  if (typeof pattern.price === "number" && pattern.price > 0) return false;

  const tags = (pattern.tags || []).map((t) => t.toLowerCase());
  if (tags.includes("paid") || tags.includes("premium")) return false;

  return true;
}

/**
 * Generates an SVG patch for the top-left craft header (e.g. "SEWING", "KNITTING").
 * If craft is CROCHET, returns null to preserve the original template raster graphic untouched.
 * If craft is non-crochet, returns a crisp vector patch that replaces the first word while preserving
 * dimensions, typography, tracking, and teal theme color #0B5C5C.
 */
export function createCraftHeaderSvg(craft: CraftType): Buffer | null {
  if (craft === "CROCHET") {
    // Preserve existing raster template asset for crochet patterns
    return null;
  }

  const { width, height, color, bgColor } = TEMPLATE_A.headerCraft;
  const word = craft;
  const fontSize = word.length <= 6 ? 82 : word.length <= 8 ? 68 : 56;
  const letterSpacing = word.length <= 6 ? 3 : 2;
  const centerX = Math.round(width / 2);
  const baselineY = 82;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />
      <text
        x="${centerX}"
        y="${baselineY}"
        text-anchor="middle"
        font-family="Liberation Sans, 'DejaVu Sans', Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="900"
        letter-spacing="${letterSpacing}"
        fill="${color}"
      >${word}</text>
    </svg>
  `.trim();

  return Buffer.from(svg);
}

/**
 * Formats a dynamic, craft-appropriate subtitle.
 * Ensures that non-crochet patterns (like sewing patterns) never display incorrect crochet claims.
 */
export function formatDynamicSubtitle(
  patternData: PinterestPatternInput,
  craft: CraftType,
  isFree: boolean
): string {
  let sub = patternData.subtitle?.trim() || "";

  // If subtitle is empty, use description excerpt
  if (!sub && patternData.description && patternData.description.trim().length > 0) {
    sub = patternData.description.trim().slice(0, 90);
  }

  // Sanitize any mismatched craft claims
  if (craft === "SEWING") {
    sub = sub
      .replace(/\bcrochet\s+pattern\b/gi, "sewing pattern")
      .replace(/\bcrochet\b/gi, "sewing")
      .replace(/\bhook\s+sizes?\b/gi, "sizing details")
      .replace(/\byarn\b/gi, "fabric");
  } else if (craft === "KNITTING") {
    sub = sub
      .replace(/\bcrochet\s+pattern\b/gi, "knitting pattern")
      .replace(/\bcrochet\b/gi, "knitting");
  }

  // If still empty or generic
  if (!sub) {
    const craftName = craft === "SEWING" ? "Sewing" : craft === "KNITTING" ? "Knitting" : "Handcrafted";
    const freeClaim = isFree ? "Free " : "";
    sub = `Handcrafted ${freeClaim}${craftName} Pattern\nStep-by-step instructions`;
  }

  return sub;
}

/* =========================================
   ROUNDED IMAGE
========================================= */

async function createRoundedImage(
  image: Buffer,
  width: number,
  height: number,
  radius: number
): Promise<Buffer> {

  const mask = Buffer.from(`
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        rx="${radius}"
        ry="${radius}"
        fill="white"
      />
    </svg>
  `);

  return sharp(image)
    .composite([
      {
        input: mask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}


/* =========================================
   EXPORTED RENDER FUNCTION FOR TEMPLATE A
========================================= */

export async function renderPinterestTemplateA(
  patternData: PinterestPatternInput,
  customFilename?: string
): Promise<RenderPinterestResult> {
  // Ensure output directory exists
  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  }

  // Ensure template exists
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Pinterest Template A base image not found at: ${TEMPLATE}`);
  }

  const filename =
    customFilename ||
    `pin-${patternData.slug || patternData.id || "pattern"}.png`;
  const outputPath = path.join(DEFAULT_OUTPUT_DIR, filename);

  /* MAIN IMAGE */
  const mainWidth = TEMPLATE_A.mainImage.width - 24;
  const mainHeight = TEMPLATE_A.mainImage.height - 24;

  const mainRaw = await fetchImage(
    patternData.image,
    mainWidth,
    mainHeight
  );

  const mainImage = await createRoundedImage(
    mainRaw,
    mainWidth,
    mainHeight,
    Math.max(10, TEMPLATE_A.mainImage.radius - 10)
  );

  /* GALLERY (3 slots) */
  const galleryUrls = [
    patternData.gallery?.[0] || patternData.image,
    patternData.gallery?.[1] || patternData.gallery?.[0] || patternData.image,
    patternData.gallery?.[2] || patternData.gallery?.[1] || patternData.gallery?.[0] || patternData.image,
  ];

  const galleryImages = await Promise.all(
    TEMPLATE_A.gallery.map(async (slot, index) => {
      const width = slot.width - 16;
      const height = slot.height - 16;

      let raw: Buffer;
      try {
        raw = await fetchImage(
          galleryUrls[index],
          width,
          height
        );
      } catch (galleryErr) {
        // Fall back gracefully to main pattern image if a secondary gallery thumbnail is missing or unavailable
        raw = await sharp(mainRaw)
          .resize(width, height, {
            fit: "cover",
            position: "centre",
          })
          .png()
          .toBuffer();
      }

      return createRoundedImage(
        raw,
        width,
        height,
        Math.max(8, slot.radius - 8)
      );
    })
  );

  /* DYNAMIC CONTENT DERIVATION */
  const craft = detectCraftType(patternData);
  const isFree = detectIsFree(patternData);

  /* DYNAMIC TEXT */
  const title = createFittedTextSvg(
    patternData.title,
    TEMPLATE_A.title.width,
    TEMPLATE_A.title.height - 10,
    {
      maxFontSize: 34,
      minFontSize: 22,
      color: "#0B5C5C",
      fontWeight: 800,
      maxLines: 2,
    }
  );

  const effectiveSubtitle = formatDynamicSubtitle(patternData, craft, isFree);

  const subtitle = createFittedTextSvg(
    effectiveSubtitle,
    TEMPLATE_A.subtitle.width - 20,
    TEMPLATE_A.subtitle.height - 6,
    {
      maxFontSize: 30,
      minFontSize: 22,
      color: "#5A4438",
      fontWeight: 700,
      maxLines: 2,
    }
  );

  const effectiveDifficulty = patternData.difficulty || "Easy";

  const difficulty = createFittedTextSvg(
    effectiveDifficulty,
    TEMPLATE_A.difficulty.width,
    TEMPLATE_A.difficulty.height,
    {
      maxFontSize: 32,
      minFontSize: 20,
      color: "#0B5C5C",
      fontWeight: 800,
      maxLines: 1,
    }
  );

  const craftHeaderOverlay = createCraftHeaderSvg(craft);

  /* COMPOSITE LAYERS */
  const compositeLayers: OverlayOptions[] = [
    /* MAIN IMAGE */
    {
      input: mainImage,
      left: TEMPLATE_A.mainImage.x + 12,
      top: TEMPLATE_A.mainImage.y + 12,
    },

    /* GALLERY 1 */
    {
      input: galleryImages[0],
      left: TEMPLATE_A.gallery[0].x + 8,
      top: TEMPLATE_A.gallery[0].y + 8,
    },

    /* GALLERY 2 */
    {
      input: galleryImages[1],
      left: TEMPLATE_A.gallery[1].x + 8,
      top: TEMPLATE_A.gallery[1].y + 8,
    },

    /* GALLERY 3 */
    {
      input: galleryImages[2],
      left: TEMPLATE_A.gallery[2].x + 8,
      top: TEMPLATE_A.gallery[2].y + 8,
    },

    /* TITLE */
    {
      input: title,
      left: TEMPLATE_A.title.x,
      top: TEMPLATE_A.title.y + 5,
    },

    /* SUBTITLE */
    {
      input: subtitle,
      left: TEMPLATE_A.subtitle.x + 10,
      top: TEMPLATE_A.subtitle.y + 3,
    },

    /* DIFFICULTY */
    {
      input: difficulty,
      left: TEMPLATE_A.difficulty.x,
      top: TEMPLATE_A.difficulty.y,
    },
  ];

  // Dynamic craft header overlay (e.g. SEWING, KNITTING for non-crochet patterns)
  if (craftHeaderOverlay) {
    compositeLayers.push({
      input: craftHeaderOverlay,
      left: TEMPLATE_A.headerCraft.x,
      top: TEMPLATE_A.headerCraft.y,
    });
  }

  /* COMPOSITE */
  await sharp(TEMPLATE)
    .composite(compositeLayers)
    .png()
    .toFile(outputPath);

  return {
    outputPath,
    publicUrl: `/generated/pinterest/${filename}`,
    filename,
    width: TEMPLATE_A.width,
    height: TEMPLATE_A.height,
  };
}

/* =========================================
   CLI TEST RUNNER
========================================= */

export async function createPin(): Promise<void> {
  console.log("===== STARTING TEMPLATE A TEST =====");
  const result = await renderPinterestTemplateA(defaultTestPattern, "test-pin-p2.png");
  console.log("===== PIN GENERATED SUCCESSFULLY =====");
  console.log(result.outputPath);
}

const isDirectCliRun =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith("renderTemplateA.ts") ||
    process.argv[1].endsWith("renderTemplateA.js"));

if (isDirectCliRun) {
  createPin().catch((error) => {
    console.error("===== PIN GENERATION FAILED =====");
    console.error(error);
    process.exit(1);
  });
}