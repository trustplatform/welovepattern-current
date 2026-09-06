import sharp, { OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";
import { TEMPLATE_C } from "../templates/templateC";
import { PinterestPatternInput, RenderPinterestResult } from "./renderTemplateA";

const ROOT = process.cwd();
const TEMPLATE = path.resolve(ROOT, "assets/pinterest/templates/template-c.png");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, "public/generated/pinterest");

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
    buffer = Buffer.from(trimmedUrl.split(";base64,")[1], "base64");
  } else if (
    !trimmedUrl.startsWith("http://") &&
    !trimmedUrl.startsWith("https://")
  ) {
    const cleanPath = trimmedUrl.startsWith("/")
      ? trimmedUrl.slice(1)
      : trimmedUrl;

    let localFile = path.resolve(ROOT, cleanPath);

    if (!fs.existsSync(localFile) && cleanPath.startsWith("uploads/")) {
      localFile = path.resolve(ROOT, "data", cleanPath);
    }

    if (!fs.existsSync(localFile)) {
      throw new Error(`Local image file not found on disk: ${trimmedUrl}`);
    }

    buffer = await fs.promises.readFile(localFile);
  } else if (trimmedUrl.includes("/uploads/")) {
    const uploadsIndex = trimmedUrl.indexOf("/uploads/");
    const subPath = trimmedUrl.slice(uploadsIndex + 1);
    const localFile = path.resolve(ROOT, "data", subPath);

    if (fs.existsSync(localFile)) {
      buffer = await fs.promises.readFile(localFile);
    } else {
      const response = await fetch(trimmedUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${trimmedUrl}`
        );
      }

      buffer = Buffer.from(await response.arrayBuffer());
    }
  } else {
    const response = await fetch(trimmedUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${trimmedUrl}`
      );
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

async function createRoundedImage(
  image: Buffer,
  width: number,
  height: number,
  radius: number
): Promise<Buffer> {
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}">
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
   DYNAMIC TEXT
========================================= */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (candidate.length <= maxChars) {
      current = candidate;
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
  const horizontalPadding = 24;
  const verticalPadding = 4;

  const availableWidth = width - horizontalPadding * 2;
  const availableHeight = height - verticalPadding * 2;

  let fontSize = options.maxFontSize;
  let lines: string[] = [];

  while (fontSize >= options.minFontSize) {
    const maxChars = Math.max(
      8,
      Math.floor(availableWidth / (fontSize * 0.56))
    );

    lines = text
      .split("\n")
      .flatMap((line) => wrapText(line, maxChars));

    const lineHeight = fontSize * 1.08;
    const totalHeight = lines.length * lineHeight;

    if (
      lines.length <= options.maxLines &&
      totalHeight <= availableHeight
    ) {
      break;
    }

    fontSize -= 1;
  }

  if (lines.length > options.maxLines) {
    lines = lines.slice(0, options.maxLines);

    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex]}…`;
  }

  const lineHeight = fontSize * 1.08;
  const totalHeight = lines.length * lineHeight;

  const startY =
    (height - totalHeight) / 2 +
    fontSize;

  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${width / 2}" dy="${
          index === 0 ? 0 : lineHeight
        }">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svg = `
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        text {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: ${options.fontWeight || 700};
          fill: ${options.color};
          text-anchor: middle;
        }
      </style>

      <text
        x="${width / 2}"
        y="${startY}"
        font-size="${fontSize}px"
      >
        ${tspans}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/* =========================================
   TEMPLATE C
========================================= */

export async function renderPinterestTemplateC(
  patternData: PinterestPatternInput,
  customFilename?: string
): Promise<RenderPinterestResult> {
  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(
      `Pinterest Template C base image not found at: ${TEMPLATE}`
    );
  }

  const filename =
    customFilename ||
    `pin-${patternData.slug || patternData.id || "pattern"}-c.png`;

  const outputPath = path.join(
    DEFAULT_OUTPUT_DIR,
    filename
  );

  /* =========================================
     MAIN IMAGE
  ========================================= */

  const mainWidth = TEMPLATE_C.mainImage.width;
  const mainHeight = TEMPLATE_C.mainImage.height;

  const mainRaw = await fetchImage(
    patternData.image,
    mainWidth,
    mainHeight
  );

  const mainImage = await createRoundedImage(
    mainRaw,
    mainWidth,
    mainHeight,
    TEMPLATE_C.mainImage.radius
  );

  /* =========================================
     GALLERY
  ========================================= */

  const galleryUrls = [
    patternData.gallery?.[0] || patternData.image,
    patternData.gallery?.[1] ||
      patternData.gallery?.[0] ||
      patternData.image,
    patternData.gallery?.[2] ||
      patternData.gallery?.[1] ||
      patternData.gallery?.[0] ||
      patternData.image,
  ];

  const galleryImages = await Promise.all(
    TEMPLATE_C.gallery.map(async (slot, index) => {
      let raw: Buffer;

      try {
        raw = await fetchImage(
          galleryUrls[index],
          slot.width,
          slot.height
        );
      } catch {
        raw = await sharp(mainRaw)
          .resize(slot.width, slot.height, {
            fit: "cover",
            position: "centre",
          })
          .png()
          .toBuffer();
      }

      return createRoundedImage(
        raw,
        slot.width,
        slot.height,
        slot.radius
      );
    })
  );

  /* =========================================
     TITLE
  ========================================= */

  const title = createFittedTextSvg(
    patternData.title?.trim() || "Untitled Pattern",
    TEMPLATE_C.title.width,
    TEMPLATE_C.title.height,
    {
      maxFontSize: 40,
      minFontSize: 26,
      color: "#24352A",
      fontWeight: 800,
      maxLines: 3,
    }
  );

  /* =========================================
     SUBTITLE
  ========================================= */

  const subtitleText =
    patternData.subtitle?.trim() ||
    patternData.description?.trim() ||
    "";

  const subtitle = createFittedTextSvg(
    subtitleText,
    TEMPLATE_C.subtitle.width,
    TEMPLATE_C.subtitle.height,
    {
      maxFontSize: 23,
      minFontSize: 16,
      color: "#5A665E",
      fontWeight: 500,
      maxLines: 2,
    }
  );

  /* =========================================
     COMPOSITE
  ========================================= */

  const compositeLayers: OverlayOptions[] = [
    {
      input: mainImage,
      left: TEMPLATE_C.mainImage.x,
      top: TEMPLATE_C.mainImage.y,
    },

    {
      input: galleryImages[0],
      left: TEMPLATE_C.gallery[0].x,
      top: TEMPLATE_C.gallery[0].y,
    },

    {
      input: galleryImages[1],
      left: TEMPLATE_C.gallery[1].x,
      top: TEMPLATE_C.gallery[1].y,
    },

    {
      input: galleryImages[2],
      left: TEMPLATE_C.gallery[2].x,
      top: TEMPLATE_C.gallery[2].y,
    },

    {
      input: title,
      left: TEMPLATE_C.title.x,
      top: TEMPLATE_C.title.y,
    },

    {
      input: subtitle,
      left: TEMPLATE_C.subtitle.x,
      top: TEMPLATE_C.subtitle.y,
    },
  ];

  await sharp(TEMPLATE)
    .composite(compositeLayers)
    .png()
    .toFile(outputPath);

  return {
    outputPath,
    publicUrl: `/generated/pinterest/${filename}`,
    filename,
    width: TEMPLATE_C.width,
    height: TEMPLATE_C.height,
  };
}

/* =========================================
   CLI TEST
========================================= */

export async function testTemplateC(): Promise<void> {
  console.log("===== STARTING TEMPLATE C TEST =====");

  const result = await renderPinterestTemplateC(
    {
      title:
        "Sporty Lounge Set Sewing Pattern Off Shoulder Sweatshirt",

      subtitle:
        "Easy sewing pattern with step-by-step instructions",

      difficulty: "Easy",

      image:
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    "test-pin-template-c.png"
  );

  console.log(
    "===== TEMPLATE C GENERATED SUCCESSFULLY ====="
  );

  console.log(result.outputPath);
}

const isDirectCliRun =
  Boolean(process.argv[1]) &&
  (
    process.argv[1].endsWith("renderTemplateC.ts") ||
    process.argv[1].endsWith("renderTemplateC.js")
  );

if (isDirectCliRun) {
  testTemplateC().catch((error) => {
    console.error("===== PIN GENERATION FAILED =====");
    console.error(error);
    process.exit(1);
  });
}
