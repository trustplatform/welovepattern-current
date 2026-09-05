import sharp, { OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";
import { TEMPLATE_B } from "../templates/templateB";
import { PinterestPatternInput, RenderPinterestResult } from "./renderTemplateA";

const ROOT = process.cwd();
const TEMPLATE = path.resolve(ROOT, "assets/pinterest/templates/template-b.png");
const DEFAULT_OUTPUT_DIR = path.resolve(ROOT, "public/generated/pinterest");

/* =========================================
   IMAGE FETCHING & ROUNDED CORNERS
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
    const uploadsIndex = trimmedUrl.indexOf("/uploads/");
    const subPath = trimmedUrl.slice(uploadsIndex + 1);
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
   EXPORTED RENDER FUNCTION FOR TEMPLATE B
========================================= */

export async function renderPinterestTemplateB(
  patternData: PinterestPatternInput,
  customFilename?: string
): Promise<RenderPinterestResult> {
  // Ensure output directory exists
  if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  }

  // Ensure template exists
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Pinterest Template B base image not found at: ${TEMPLATE}`);
  }

  const filename =
    customFilename ||
    `pin-${patternData.slug || patternData.id || "pattern"}-b.png`;
  const outputPath = path.join(DEFAULT_OUTPUT_DIR, filename);

  /* HERO MAIN IMAGE */
  const mainWidth = TEMPLATE_B.mainImage.width;
  const mainHeight = TEMPLATE_B.mainImage.height;

  const mainRaw = await fetchImage(
    patternData.image,
    mainWidth,
    mainHeight
  );

  const mainImage = await createRoundedImage(
    mainRaw,
    mainWidth,
    mainHeight,
    TEMPLATE_B.mainImage.radius
  );

  /* GALLERY IMAGES (Slots 2, 3, 4) */
  const galleryUrls = [
    patternData.gallery?.[0] || patternData.image,
    patternData.gallery?.[1] || patternData.gallery?.[0] || patternData.image,
    patternData.gallery?.[2] || patternData.gallery?.[1] || patternData.gallery?.[0] || patternData.image,
  ];

  const galleryImages = await Promise.all(
    TEMPLATE_B.gallery.map(async (slot, index) => {
      const width = slot.width;
      const height = slot.height;

      let raw: Buffer;
      try {
        raw = await fetchImage(
          galleryUrls[index],
          width,
          height
        );
      } catch (err) {
        // Fall back gracefully to primary pattern image
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
        slot.radius
      );
    })
  );

  /* COMPOSITE LAYERS */
  const compositeLayers: OverlayOptions[] = [
    /* 1. Large Central Hero Image */
    {
      input: mainImage,
      left: TEMPLATE_B.mainImage.x,
      top: TEMPLATE_B.mainImage.y,
    },

    /* 2. Three Bottom Gallery Images (Gallery 2, 3, 4) */
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
  ];

  /* COMPOSITE ONTO MASTER TEMPLATE B BASE */
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
   CLI TEST RUNNER
========================================= */

export async function testTemplateB(): Promise<void> {
  console.log("===== STARTING TEMPLATE B TEST =====");
  const result = await renderPinterestTemplateB({
    title: "Cozy Sunburst Granny Square Blanket",
    difficulty: "Easy",
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80",
    ],
  }, "test-pin-template-b.png");
  console.log("===== TEMPLATE B GENERATED SUCCESSFULLY =====");
  console.log(result.outputPath);
}

const isDirectCliRun =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith("renderTemplateB.ts") ||
    process.argv[1].endsWith("renderTemplateB.js"));

if (isDirectCliRun) {
  testTemplateB().catch((error) => {
    console.error("===== PIN GENERATION FAILED =====");
    console.error(error);
    process.exit(1);
  });
}
