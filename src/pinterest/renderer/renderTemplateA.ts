import sharp from "sharp";
import { TEMPLATE_A } from "../templates/templateA";

const ROOT = process.cwd();

const TEMPLATE = `${ROOT}/assets/pinterest/templates/template-a.png`;
const OUTPUT = `${ROOT}/public/generated/pinterest/test-pin-p2.png`;

const pattern = {
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

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download image: ${response.status} ${url}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

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
   MAIN
========================================= */

async function createPin(): Promise<void> {

  console.log(
    "===== STARTING TEMPLATE A TEST #2 ====="
  );


  /* MAIN IMAGE */

  console.log("Downloading main image...");

  const mainWidth =
    TEMPLATE_A.mainImage.width - 24;

  const mainHeight =
    TEMPLATE_A.mainImage.height - 24;

  const mainRaw = await fetchImage(
    pattern.image,
    mainWidth,
    mainHeight
  );

  const mainImage =
    await createRoundedImage(
      mainRaw,
      mainWidth,
      mainHeight,
      Math.max(
        10,
        TEMPLATE_A.mainImage.radius - 10
      )
    );


  /* GALLERY */

  console.log(
    "Downloading gallery images..."
  );

  const galleryImages =
    await Promise.all(

      TEMPLATE_A.gallery.map(
        async (slot, index) => {

          const width =
            slot.width - 16;

          const height =
            slot.height - 16;

          const raw =
            await fetchImage(
              pattern.gallery[index],
              width,
              height
            );

          return createRoundedImage(
            raw,
            width,
            height,
            Math.max(8, slot.radius - 8)
          );
        }
      )
    );


  /* TEXT */

  console.log(
    "Creating dynamic text..."
  );

  const title =
    createFittedTextSvg(
      pattern.title,
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


  const subtitle =
  createFittedTextSvg(
    pattern.subtitle,
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


  const difficulty =
    createFittedTextSvg(
      pattern.difficulty,
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


  /* COMPOSITE */

  console.log(
    "Compositing final pin..."
  );

  await sharp(TEMPLATE)

    .composite([

      /* MAIN IMAGE */

      {
        input: mainImage,
        left:
          TEMPLATE_A.mainImage.x + 12,
        top:
          TEMPLATE_A.mainImage.y + 12,
      },


      /* GALLERY 1 */

      {
        input: galleryImages[0],
        left:
          TEMPLATE_A.gallery[0].x + 8,
        top:
          TEMPLATE_A.gallery[0].y + 8,
      },


      /* GALLERY 2 */

      {
        input: galleryImages[1],
        left:
          TEMPLATE_A.gallery[1].x + 8,
        top:
          TEMPLATE_A.gallery[1].y + 8,
      },


      /* GALLERY 3 */

      {
        input: galleryImages[2],
        left:
          TEMPLATE_A.gallery[2].x + 8,
        top:
          TEMPLATE_A.gallery[2].y + 8,
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
        left:
          TEMPLATE_A.subtitle.x + 10,
        top:
          TEMPLATE_A.subtitle.y + 3,
      },


      /* DIFFICULTY */

      {
        input: difficulty,
        left:
          TEMPLATE_A.difficulty.x,
        top:
          TEMPLATE_A.difficulty.y,
      },

    ])

    .png()

    .toFile(OUTPUT);


  console.log("");

  console.log(
    "===== PIN GENERATED SUCCESSFULLY ====="
  );

  console.log(OUTPUT);
}


createPin().catch(
  (error) => {

    console.error("");

    console.error(
      "===== PIN GENERATION FAILED ====="
    );

    console.error(error);

    process.exit(1);
  }
);