import sharp, { OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";
import { TEMPLATE_B } from "../templates/templateB";
import { PinterestPatternInput, RenderPinterestResult } from "./renderTemplateA";

const ROOT = process.cwd();
const TEMPLATE = path.resolve(ROOT, "assets/pinterest/templates/template-b.png");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, "public/generated/pinterest");

/* =========================================
   TEXT HELPERS
========================================= */

function wrapText(text: string, maxChars: number): string[] {
  return text
    .split(/\s+/)
    .reduce((lines: string[], word: string) => {
      if (!word) return lines;

      const current = lines[lines.length - 1] || "";

      if (!current) {
        lines.push(word);
      } else if ((current + " " + word).length <= maxChars) {
        lines[lines.length - 1] = current + " " + word;
      } else {
        lines.push(word);
      }

      return lines;
    }, []);
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
  const horizontalPadding = 25;
  const verticalPadding = 5;

  const availableWidth = width - horizontalPadding * 2;
  const availableHeight = height - verticalPadding * 2;

  let fontSize = options.maxFontSize;
  let lines: string[] = [];

  while (fontSize >= options.minFontSize) {
    const maxChars = Math.max(
      8,
      Math.floor(availableWidth / (fontSize * 0.58))
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
        `<tspan x="50%" dy="${
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
      <text
        x="50%"
        y="${startY}"
        text-anchor="middle"
        font-family="Liberation Sans, 'DejaVu Sans', Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="${options.fontWeight || 700}"
        fill="${options.color}"
      >${tspans}</text>
    </svg>
  `.trim();

  return Buffer.from(svg);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* =========================================
   IMAGE FETCHING
========================================= */

async function fetchImage(
  url: string,
  width: number,
  height: number
): Promise<Buffer> {
  let buffer: Buffer;

  if (!url || typeof url !== "string") {
    throw new Error("Invalid or empty image URL provided");
  }

  const trimmedUrl = url.trim();

  if (
    trimmedUrl.startsWith("data:") &&
    trimmedUrl.includes(";base64,")
  ) {
    buffer = Buffer.from(
      trimmedUrl.split(";base64,")[1],
      "base64"
    );
  } else if (
    !trimmedUrl.startsWith("http://") &&
    !trimmedUrl.startsWith("https://")
  ) {
    const cleanPath = trimmedUrl.startsWith("/")
      ? trimmedUrl.slice(1)
      : trimmedUrl;

    let localFile = path.resolve(ROOT, cleanPath);

    if (
      !fs.existsSync(localFile) &&
      cleanPath.startsWith("uploads/")
    ) {
      localFile = path.resolve(ROOT, "data", cleanPath);
    }

    if (!fs.existsSync(localFile)) {
      throw new Error(
        `Local image file not found: ${trimmedUrl}`
      );
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
          `Failed to download image: ${response.status}`
        );
      }

      buffer = Buffer.from(await response.arrayBuffer());
    }
  } else {
    const response = await fetch(trimmedUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status}`
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
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
   TEMPLATE B RENDERER
========================================= */

export async function renderPinterestTemplateB(
  patternData: PinterestPatternInput,
  customFilename?: string
): Promise<RenderPinterestResult> {
  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, {
      recursive: true,
    });
  }

  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(
      `Pinterest Template B base image not found at: ${TEMPLATE}`
    );
  }

  const filename =
    customFilename ||
    `pin-${patternData.slug || patternData.id || "pattern"}-b.png`;

  const outputPath = path.join(
    DEFAULT_OUTPUT_DIR,
    filename
  );

  /* =========================================
     MAIN IMAGE
  ========================================= */

  const mainRaw = await fetchImage(
    patternData.image,
    TEMPLATE_B.mainImage.width,
    TEMPLATE_B.mainImage.height
  );

  const mainImage = await createRoundedImage(
    mainRaw,
    TEMPLATE_B.mainImage.width,
    TEMPLATE_B.mainImage.height,
    TEMPLATE_B.mainImage.radius
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
    TEMPLATE_B.gallery.map(
      async (slot, index) => {
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
      }
    )
  );

  /* =========================================
     DYNAMIC TEXT
  ========================================= */

  const title = createFittedTextSvg(
    patternData.title?.trim() || "Untitled Pattern",
    TEMPLATE_B.title.width,
    TEMPLATE_B.title.height,
    {
      maxFontSize: 58,
      minFontSize: 30,
      color: "#0B5C5C",
      fontWeight: 800,
      maxLines: 2,
    }
  );

  const subtitleText =
    patternData.subtitle?.trim() ||
    patternData.description?.trim().slice(0, 100) ||
    "Step-by-step instructions";

  const subtitle = createFittedTextSvg(
    subtitleText,
    TEMPLATE_B.subtitle.width,
    TEMPLATE_B.subtitle.height,
    {
      maxFontSize: 28,
      minFontSize: 18,
      color: "#5A4438",
      fontWeight: 600,
      maxLines: 2,
    }
  );

  /* =========================================
     COMPOSITE
     
     IMPORTANT:
     We only add dynamic content.
     All fixed graphics/text remain inside
     the Master B image.
  ========================================= */

  const compositeLayers: OverlayOptions[] = [
    {
      input: mainImage,
      left: TEMPLATE_B.mainImage.x,
      top: TEMPLATE_B.mainImage.y,
    },

    {
      input: galleryImages[0],
      left: TEMPLATE_B.gallery[0].x,
      top: TEMPLATE_B.gallery[0].y,
    },

    {
      input: galleryImages[1],
      left: TEMPLATE_B.gallery[1].x,
      top: TEMPLATE_B.gallery[1].y,
    },

    {
      input: galleryImages[2],
      left: TEMPLATE_B.gallery[2].x,
      top: TEMPLATE_B.gallery[2].y,
    },

    {
      input: title,
      left: TEMPLATE_B.title.x,
      top: TEMPLATE_B.title.y,
    },

    {
      input: subtitle,
      left: TEMPLATE_B.subtitle.x,
      top: TEMPLATE_B.subtitle.y,
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
    width: TEMPLATE_B.width,
    height: TEMPLATE_B.height,
  };
}

/* =========================================
   CLI TEST
========================================= */

export async function testTemplateB(): Promise<void> {
  console.log(
    "===== STARTING TEMPLATE B TEST ====="
  );

  const testImage =
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80";

  const result =
    await renderPinterestTemplateB(
      {
        title:
          "Cozy Sunburst Granny Square Blanket",
        subtitle:
          "A beautiful handmade pattern with easy step-by-step instructions",
        difficulty: "Easy",
        image: testImage,
        gallery: [
          testImage,
          testImage,
          testImage,
        ],
      },
      "test-pin-template-b-new.png"
    );

  console.log(
    "===== TEMPLATE B GENERATED ====="
  );

  console.log(result.outputPath);
}

const isDirectCliRun =
  Boolean(process.argv[1]) &&
  (
    process.argv[1].endsWith(
      "renderTemplateB.ts"
    ) ||
    process.argv[1].endsWith(
      "renderTemplateB.js"
    )
  );

if (isDirectCliRun) {
  testTemplateB().catch((error) => {
    console.error(
      "===== PIN GENERATION FAILED ====="
    );
    console.error(error);
    process.exit(1);
  });
}
