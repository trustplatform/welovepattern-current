const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TEMPLATE_DIR = path.resolve(ROOT, 'assets/pinterest/templates');
const PREVIEW_DIR = path.resolve(ROOT, 'public/assets/pinterest/previews');

if (!fs.existsSync(TEMPLATE_DIR)) {
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

// Extract the authentic footer from template-a.png if available, or generate SVG footer
async function getFooterBuffer() {
  const templateAPath = path.join(TEMPLATE_DIR, 'template-a.png');
  if (fs.existsSync(templateAPath)) {
    // Template A footer is from y=1360 to 1500
    try {
      const footer = await sharp(templateAPath)
        .extract({ left: 0, top: 1350, width: 1000, height: 150 })
        .png()
        .toBuffer();
      return footer;
    } catch (err) {
      console.warn('Could not extract footer from template-a:', err);
    }
  }
  return null;
}

// Create Template B Master PNG
async function buildTemplateB() {
  const svgContent = `
  <svg width="1000" height="1500" viewBox="0 0 1000 1500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradB" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDF1F4"/>
        <stop offset="35%" stop-color="#FCE6EC"/>
        <stop offset="70%" stop-color="#FAD4DF"/>
        <stop offset="100%" stop-color="#F7C4D3"/>
      </linearGradient>

      <!-- Soft cloud overlays -->
      <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1000" height="1500" fill="url(#bgGradB)"/>

    <!-- Decorative watercolor clouds -->
    <circle cx="200" cy="180" r="160" fill="#FFFFFF" opacity="0.35" filter="url(#blurFilter)"/>
    <circle cx="850" cy="300" r="180" fill="#FFFFFF" opacity="0.4" filter="url(#blurFilter)"/>
    <circle cx="500" cy="700" r="220" fill="#FFFFFF" opacity="0.25" filter="url(#blurFilter)"/>
    <circle cx="150" cy="1150" r="170" fill="#FFFFFF" opacity="0.3" filter="url(#blurFilter)"/>

    <!-- Sparkles and small hearts in background -->
    <g fill="#FF85A2" opacity="0.6">
      <circle cx="480" cy="120" r="4"/>
      <circle cx="520" cy="160" r="6"/>
      <circle cx="120" cy="400" r="5"/>
      <circle cx="890" cy="620" r="7"/>
      <circle cx="100" cy="980" r="5"/>
      <circle cx="920" cy="990" r="6"/>
    </g>
    <!-- Little hearts -->
    <g fill="#FF6584" opacity="0.65">
      <path d="M 440 90 A 10 10 0 0 0 425 102 A 10 10 0 0 0 440 120 A 10 10 0 0 0 455 102 A 10 10 0 0 0 440 90 Z" transform="scale(0.8) translate(120, 20)"/>
      <path d="M 870 140 A 10 10 0 0 0 855 152 A 10 10 0 0 0 870 170 A 10 10 0 0 0 885 152 A 10 10 0 0 0 870 140 Z" transform="scale(0.7) translate(380, 50)"/>
    </g>

    <!-- TOP-LEFT: Yarn Ball & Craft Icon Badge -->
    <g id="top-left-yarn-badge" transform="translate(55, 45)">
      <!-- Outer soft glow -->
      <circle cx="45" cy="45" r="46" fill="#0B5C5C" opacity="0.12"/>
      <!-- Main circle -->
      <circle cx="45" cy="45" r="40" fill="#0B5C5C"/>
      <!-- Inner stitching dashed circle -->
      <circle cx="45" cy="45" r="35" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.8"/>

      <!-- Yarn ball graphic in circle -->
      <path d="M 28 45 C 28 35, 36 28, 46 28 C 56 28, 63 35, 63 45 C 63 55, 55 62, 45 62 C 35 62, 28 54, 28 45 Z" fill="#E2879D"/>
      <path d="M 33 40 Q 45 32 57 41" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>
      <path d="M 32 48 Q 45 58 58 48" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>
      <path d="M 40 31 Q 48 45 42 59" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>
      <path d="M 50 32 Q 44 45 50 59" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>
      <!-- Crochet hook across yarn -->
      <line x1="20" y1="65" x2="68" y2="24" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M 68 24 Q 72 20 67 21" fill="none" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    </g>

    <!-- TOP-LEFT: 4 FEATURE PILLS -->
    <!-- Pill 1: Detailed PDF Pattern -->
    <g transform="translate(50, 155)">
      <rect width="250" height="42" rx="21" fill="#0B5C5C" shadow="0 2px 4px rgba(0,0,0,0.1)"/>
      <!-- PDF Document Icon -->
      <rect x="18" y="11" width="16" height="20" rx="3" fill="#FFFFFF" opacity="0.9"/>
      <rect x="22" y="15" width="8" height="2" fill="#0B5C5C"/>
      <rect x="22" y="19" width="8" height="2" fill="#0B5C5C"/>
      <rect x="22" y="23" width="5" height="2" fill="#0B5C5C"/>
      <text x="44" y="26" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Detailed PDF Pattern</text>
    </g>

    <!-- Pill 2: Step-by-Step Photo Guide -->
    <g transform="translate(50, 210)">
      <rect width="250" height="42" rx="21" fill="#0B5C5C"/>
      <!-- Camera Icon -->
      <path d="M 17 17 L 21 13 L 29 13 L 33 17 L 35 17 C 36 17 37 18 37 19 L 37 29 C 37 30 36 31 35 31 L 15 31 C 14 31 13 30 13 29 L 13 19 C 13 18 14 17 15 17 Z" fill="#FFFFFF" opacity="0.9"/>
      <circle cx="25" cy="24" r="4.5" fill="#0B5C5C"/>
      <text x="44" y="26" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Step-by-Step Photo Guide</text>
    </g>

    <!-- Pill 3: Beginner Friendly -->
    <g transform="translate(50, 265)">
      <rect width="250" height="42" rx="21" fill="#0B5C5C"/>
      <!-- Yarn / Heart icon -->
      <circle cx="25" cy="21" r="8" fill="#FFFFFF" opacity="0.9"/>
      <path d="M 21 21 Q 25 17 29 21 Q 25 25 21 21" fill="#0B5C5C"/>
      <text x="44" y="26" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Beginner Friendly</text>
    </g>

    <!-- Pill 4: Great Gift Idea -->
    <g transform="translate(50, 320)">
      <rect width="250" height="42" rx="21" fill="#0B5C5C"/>
      <!-- Gift box icon -->
      <rect x="16" y="17" width="18" height="13" rx="2" fill="#FFFFFF" opacity="0.9"/>
      <rect x="14" y="14" width="22" height="4" rx="1.5" fill="#FFFFFF" opacity="0.9"/>
      <line x1="25" y1="14" x2="25" y2="30" stroke="#0B5C5C" stroke-width="2"/>
      <line x1="16" y1="23" x2="34" y2="23" stroke="#0B5C5C" stroke-width="2"/>
      <text x="44" y="26" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">Great Gift Idea</text>
    </g>

    <!-- TOP-RIGHT: DECORATIVE CROCHET/CRAFT SCENE -->
    <g id="craft-scene-illustration" transform="translate(680, 140)">
      <!-- Books stack -->
      <rect x="50" y="230" width="160" height="28" rx="4" fill="#D97706" opacity="0.8"/>
      <rect x="40" y="258" width="180" height="32" rx="4" fill="#0B5C5C" opacity="0.9"/>
      <rect x="30" y="290" width="200" height="30" rx="4" fill="#E11D48" opacity="0.8"/>

      <!-- Ceramic mug with heart holding hooks -->
      <rect x="110" y="130" width="65" height="85" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <!-- Mug handle -->
      <path d="M 175 145 C 195 145, 195 195, 175 195" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      <!-- Mug heart -->
      <path d="M 142 165 C 142 160 135 155 130 160 C 125 165 130 172 142 182 C 154 172 159 165 154 160 C 149 155 142 160 142 165 Z" fill="#FF4D6D"/>

      <!-- Crochet hooks & Scissors in mug -->
      <line x1="130" y1="80" x2="135" y2="135" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>
      <line x1="145" y1="70" x2="145" y2="135" stroke="#10B981" stroke-width="5" stroke-linecap="round"/>
      <line x1="160" y1="85" x2="155" y2="135" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/>
      <!-- Scissors loops -->
      <circle cx="125" cy="72" r="7" fill="none" stroke="#64748B" stroke-width="3"/>
      <circle cx="137" cy="68" r="7" fill="none" stroke="#64748B" stroke-width="3"/>

      <!-- Potted Green Plant / Leaves trailing -->
      <g transform="translate(190, 160)">
        <path d="M 10 30 Q 30 -20 50 -10 Q 30 10 10 30" fill="#15803D" opacity="0.85"/>
        <path d="M 10 30 Q -10 10 -20 -10 Q -5 -15 10 30" fill="#16A34A" opacity="0.9"/>
        <path d="M 10 30 Q 40 40 60 20 Q 40 15 10 30" fill="#22C55E" opacity="0.85"/>
        <path d="M 10 30 Q 15 60 30 70 Q 25 50 10 30" fill="#15803D" opacity="0.85"/>
      </g>

      <!-- Floating hearts above books & mug -->
      <g fill="#FF4D6D">
        <path d="M 140 35 C 140 30 133 25 128 30 C 123 35 128 42 140 52 C 152 42 157 35 152 30 C 147 25 140 30 140 35 Z" transform="scale(0.8)"/>
        <path d="M 210 70 C 210 65 203 60 198 65 C 193 70 198 77 210 87 C 222 77 227 70 222 65 C 217 60 210 65 210 70 Z" transform="scale(0.6)"/>
      </g>
    </g>

    <!-- CENTER HERO IMAGE PLACEHOLDER (x: 175, y: 420, w: 650, h: 550, r: 24) -->
    <g id="hero-image-placeholder">
      <rect x="175" y="420" width="650" height="550" rx="24" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="10,8"/>
      <!-- Placeholder camera icon in center -->
      <g transform="translate(460, 655)" fill="#94A3B8">
        <path d="M 15 25 L 25 15 L 55 15 L 65 25 L 75 25 C 78 25 80 27 80 30 L 80 65 C 80 68 78 70 75 70 L 5 70 C 2 70 0 68 0 65 L 0 30 C 0 27 2 25 5 25 Z" opacity="0.5"/>
        <circle cx="40" cy="45" r="16" fill="#F1F5F9"/>
        <circle cx="40" cy="45" r="11" opacity="0.5"/>
      </g>
    </g>

    <!-- BOTTOM 3 GALLERY RECTANGLES -->
    <!-- Slot 1 (x: 48, y: 1018, w: 276, h: 212, r: 20) -->
    <g id="gallery-slot-1">
      <rect x="48" y="1018" width="276" height="212" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>
      <!-- Gallery Badge 1: PRACTICAL DESIGN -->
      <rect x="74" y="1244" width="224" height="32" rx="16" fill="#F472B6"/>
      <text x="186" y="1265" font-family="'DejaVu Sans', sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">PRACTICAL DESIGN</text>
    </g>

    <!-- Slot 2 (x: 362, y: 1018, w: 276, h: 212, r: 20) -->
    <g id="gallery-slot-2">
      <rect x="362" y="1018" width="276" height="212" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>
      <!-- Gallery Badge 2: SPACIOUS & FUNCTIONAL -->
      <rect x="382" y="1244" width="236" height="32" rx="16" fill="#F472B6"/>
      <text x="500" y="1265" font-family="'DejaVu Sans', sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">SPACIOUS &amp; FUNCTIONAL</text>
    </g>

    <!-- Slot 3 (x: 676, y: 1018, w: 276, h: 212, r: 20) -->
    <g id="gallery-slot-3">
      <rect x="676" y="1018" width="276" height="212" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>
      <!-- Gallery Badge 3: BEAUTIFUL DETAILS -->
      <rect x="704" y="1244" width="220" height="32" rx="16" fill="#F472B6"/>
      <text x="814" y="1265" font-family="'DejaVu Sans', sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">BEAUTIFUL DETAILS</text>
    </g>

    <!-- FOOTER / CTA SECTION (Authentic WeLovePattern CTA) -->
    <!-- Dark Teal CTA Banner -->
    <g transform="translate(60, 1300)">
      <rect width="880" height="68" rx="34" fill="#0B5C5C"/>
      <rect x="6" y="6" width="868" height="56" rx="28" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>

      <!-- Pinterest Pin Icon -->
      <circle cx="45" cy="34" r="18" fill="#E60023"/>
      <text x="45" y="41" font-family="'DejaVu Sans', sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">P</text>

      <!-- CTA Text: GET THE FREE PATTERN -->
      <text x="440" y="42" font-family="'DejaVu Sans', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">
        GET THE <tspan fill="#FF6B81">FREE</tspan> PATTERN
      </text>

      <!-- Heart icon on right -->
      <path d="M 830 30 C 830 25 823 20 818 25 C 813 30 818 37 830 47 C 842 37 847 30 842 25 C 837 20 830 25 830 30 Z" fill="#FF6B81"/>
    </g>

    <!-- White URL Pill: WELOVEPATTERN.COM -->
    <g transform="translate(260, 1385)">
      <rect width="480" height="46" rx="23" fill="#FFFFFF" stroke="#F472B6" stroke-width="2.5" stroke-dasharray="6,4"/>
      <!-- Globe icon -->
      <circle cx="45" cy="23" r="12" fill="none" stroke="#0B5C5C" stroke-width="2"/>
      <line x1="33" y1="23" x2="57" y2="23" stroke="#0B5C5C" stroke-width="2"/>
      <ellipse cx="45" cy="23" rx="6" ry="12" fill="none" stroke="#0B5C5C" stroke-width="1.8"/>

      <text x="240" y="30" font-family="'DejaVu Sans', sans-serif" font-size="18" font-weight="900" fill="#0B5C5C" text-anchor="middle" letter-spacing="2">
        WELOVEPATTERN.COM
      </text>
    </g>

    <!-- Scalloped Bottom Edge -->
    <g transform="translate(0, 1450)">
      <path d="M 0 15 Q 50 0 100 15 Q 150 30 200 15 Q 250 0 300 15 Q 350 30 400 15 Q 450 0 500 15 Q 550 30 600 15 Q 650 0 700 15 Q 750 30 800 15 Q 850 0 900 15 Q 950 30 1000 15 L 1000 50 L 0 50 Z" fill="#0B5C5C"/>
      <!-- White heart line on trim -->
      <path d="M 50 32 A 4 4 0 0 0 46 36 A 4 4 0 0 0 50 42 A 4 4 0 0 0 54 36 A 4 4 0 0 0 50 32 Z" fill="#FFFFFF" opacity="0.7" transform="scale(1.2) translate(0, 0)"/>
    </g>
  </svg>
  `;

  const outputPath = path.join(TEMPLATE_DIR, 'template-b.png');
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputPath);

  console.log(`Generated Template B at: ${outputPath}`);

  // Also create a smaller preview for UI
  const previewPath = path.join(PREVIEW_DIR, 'template-b-preview.png');
  await sharp(outputPath)
    .resize(320, 480)
    .png()
    .toFile(previewPath);

  console.log(`Generated Template B preview at: ${previewPath}`);
}

// Create Template C Master PNG
async function buildTemplateC() {
  const svgContent = `
  <svg width="1000" height="1500" viewBox="0 0 1000 1500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradC" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FCFAF7"/>
        <stop offset="50%" stop-color="#FBF7F0"/>
        <stop offset="100%" stop-color="#F7F1E6"/>
      </linearGradient>
    </defs>

    <!-- Cream Background -->
    <rect width="1000" height="1500" fill="url(#bgGradC)"/>

    <!-- BOTANICAL DECORATIONS ALONG BORDERS -->
    <!-- Left Botanical Sprigs -->
    <g id="left-botanical" transform="translate(15, 80)">
      <!-- Leaf stems -->
      <path d="M 25 10 Q 45 60 20 120 Q -5 180 25 240 Q 55 300 15 360 Q -15 420 20 480 Q 50 540 18 600" fill="none" stroke="#84A98C" stroke-width="2.5" opacity="0.75"/>
      <!-- Leaves -->
      <ellipse cx="38" cy="45" rx="14" ry="7" fill="#52796F" opacity="0.7" transform="rotate(-30 38 45)"/>
      <ellipse cx="14" cy="90" rx="14" ry="7" fill="#52796F" opacity="0.7" transform="rotate(30 14 90)"/>
      <ellipse cx="32" cy="150" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-25 32 150)"/>
      <ellipse cx="10" cy="210" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(35 10 210)"/>
      <ellipse cx="36" cy="270" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-30 36 270)"/>
      <ellipse cx="12" cy="330" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(30 12 330)"/>
      <ellipse cx="34" cy="390" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-25 34 390)"/>
      <ellipse cx="15" cy="450" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(35 15 450)"/>
      <ellipse cx="35" cy="520" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-30 35 520)"/>

      <!-- Splatters and little berries -->
      <circle cx="50" cy="110" r="3.5" fill="#E2879D" opacity="0.8"/>
      <circle cx="5" cy="250" r="4" fill="#E2879D" opacity="0.8"/>
      <circle cx="45" cy="420" r="3.5" fill="#E2879D" opacity="0.8"/>
      <circle cx="8" cy="570" r="4" fill="#E2879D" opacity="0.8"/>
    </g>

    <!-- Right Botanical Sprigs -->
    <g id="right-botanical" transform="translate(950, 80)">
      <path d="M -15 10 Q -45 60 -10 120 Q 15 180 -15 240 Q -45 300 -10 360 Q 15 420 -15 480 Q -45 540 -12 600" fill="none" stroke="#84A98C" stroke-width="2.5" opacity="0.75"/>
      <ellipse cx="-28" cy="45" rx="14" ry="7" fill="#52796F" opacity="0.7" transform="rotate(30 -28 45)"/>
      <ellipse cx="-5" cy="90" rx="14" ry="7" fill="#52796F" opacity="0.7" transform="rotate(-30 -5 90)"/>
      <ellipse cx="-24" cy="150" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(25 -24 150)"/>
      <ellipse cx="-4" cy="210" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-35 -4 210)"/>
      <ellipse cx="-26" cy="270" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(30 -26 270)"/>
      <ellipse cx="-6" cy="330" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-30 -6 330)"/>
      <ellipse cx="-25" cy="390" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(25 -25 390)"/>
      <ellipse cx="-5" cy="450" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(-35 -5 450)"/>
      <ellipse cx="-25" cy="520" rx="15" ry="8" fill="#52796F" opacity="0.7" transform="rotate(30 -25 520)"/>

      <circle cx="-35" cy="110" r="3.5" fill="#E2879D" opacity="0.8"/>
      <circle cx="2" cy="250" r="4" fill="#E2879D" opacity="0.8"/>
      <circle cx="-35" cy="420" r="3.5" fill="#E2879D" opacity="0.8"/>
    </g>

    <!-- TOP SECTION -->
    <!-- Top Left Yarn Ball -->
    <g transform="translate(60, 30)">
      <circle cx="35" cy="35" r="28" fill="#E2879D" opacity="0.9"/>
      <path d="M 20 32 Q 35 22 50 32" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M 22 40 Q 35 48 48 40" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M 28 22 Q 38 35 30 48" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <!-- Thread looping into heart -->
      <path d="M 55 45 Q 85 75 110 50 Q 125 35 135 55" fill="none" stroke="#E2879D" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 135 55 C 135 51 130 47 125 51 C 120 55 125 61 135 69 C 145 61 150 55 145 51 C 140 47 135 51 135 55 Z" fill="#E2879D"/>
    </g>

    <!-- Top Center Bracket Decoration -->
    <g transform="translate(380, 50)" opacity="0.7">
      <path d="M 0 15 L 20 15 L 20 0" fill="none" stroke="#78716C" stroke-width="2"/>
      <line x1="35" y1="8" x2="205" y2="8" stroke="#D6D3D1" stroke-width="1.5" stroke-dasharray="5,4"/>
      <!-- Tiny heart in center -->
      <path d="M 120 8 C 120 5 116 2 112 5 C 108 8 112 13 120 19 C 128 13 132 8 128 5 C 124 2 120 5 120 8 Z" fill="#E2879D"/>
      <path d="M 240 15 L 220 15 L 220 0" fill="none" stroke="#78716C" stroke-width="2"/>
    </g>

    <!-- Top Right Eucalyptus Branch -->
    <g transform="translate(820, 25)">
      <path d="M 10 70 Q 50 40 110 20" fill="none" stroke="#84A98C" stroke-width="2.5"/>
      <ellipse cx="35" cy="52" rx="14" ry="8" fill="#52796F" opacity="0.8" transform="rotate(-30 35 52)"/>
      <ellipse cx="70" cy="35" rx="14" ry="8" fill="#52796F" opacity="0.8" transform="rotate(-20 70 35)"/>
      <ellipse cx="105" cy="20" rx="12" ry="7" fill="#52796F" opacity="0.8" transform="rotate(-15 105 20)"/>
    </g>

    <!-- LARGE CENTRAL HERO IMAGE PLACEHOLDER (x: 80, y: 130, w: 840, h: 560, r: 26) -->
    <g id="hero-image-placeholder">
      <rect x="80" y="130" width="840" height="560" rx="26" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="10,8"/>
      <!-- Placeholder camera icon in center -->
      <g transform="translate(455, 365)" fill="#94A3B8">
        <path d="M 18 30 L 30 18 L 66 18 L 78 30 L 90 30 C 93 30 96 33 96 36 L 96 78 C 96 81 93 84 90 84 L 6 84 C 3 84 0 81 0 78 L 0 36 C 0 33 3 30 6 30 Z" opacity="0.5"/>
        <circle cx="48" cy="54" r="20" fill="#F1F5F9"/>
        <circle cx="48" cy="54" r="14" opacity="0.5"/>
      </g>
    </g>

    <!-- 4 FEATURE ICONS SECTION (Horizontal Row at y: 720) -->
    <g id="four-feature-icons" transform="translate(0, 715)">
      <!-- Feature 1: Detailed PDF Pattern -->
      <g transform="translate(125, 0)">
        <circle cx="36" cy="36" r="34" fill="#0B5C5C"/>
        <!-- PDF icon -->
        <rect x="23" y="19" width="26" height="34" rx="4" fill="#FFFFFF"/>
        <text x="36" y="42" font-family="'DejaVu Sans', sans-serif" font-size="10" font-weight="900" fill="#0B5C5C" text-anchor="middle">PDF</text>
        <text x="36" y="90" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Detailed PDF</text>
        <text x="36" y="106" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Pattern</text>
      </g>

      <!-- Feature 2: Step-by-Step Photo Guide -->
      <g transform="translate(365, 0)">
        <circle cx="36" cy="36" r="34" fill="#0B5C5C"/>
        <!-- Camera icon -->
        <path d="M 23 28 L 29 20 L 43 20 L 49 28 L 53 28 C 55 28 56 29 56 31 L 56 48 C 56 50 55 51 53 51 L 19 51 C 17 51 16 50 16 48 L 16 31 C 16 29 17 28 19 28 Z" fill="#FFFFFF"/>
        <circle cx="36" cy="38" r="7" fill="#0B5C5C"/>
        <text x="36" y="90" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Step-by-Step</text>
        <text x="36" y="106" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Photo Guide</text>
      </g>

      <!-- Feature 3: Beginner Friendly -->
      <g transform="translate(605, 0)">
        <circle cx="36" cy="36" r="34" fill="#0B5C5C"/>
        <!-- Yarn ball icon -->
        <circle cx="36" cy="34" r="16" fill="#FFFFFF"/>
        <path d="M 26 34 Q 36 26 46 34" fill="none" stroke="#0B5C5C" stroke-width="2"/>
        <path d="M 28 40 Q 36 46 44 40" fill="none" stroke="#0B5C5C" stroke-width="2"/>
        <text x="36" y="90" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Beginner</text>
        <text x="36" y="106" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Friendly</text>
      </g>

      <!-- Feature 4: Great Gift Idea -->
      <g transform="translate(845, 0)">
        <circle cx="36" cy="36" r="34" fill="#0B5C5C"/>
        <!-- Gift box icon -->
        <rect x="23" y="27" width="26" height="20" rx="3" fill="#FFFFFF"/>
        <rect x="20" y="22" width="32" height="6" rx="2" fill="#FFFFFF"/>
        <line x1="36" y1="22" x2="36" y2="47" stroke="#0B5C5C" stroke-width="2.5"/>
        <line x1="23" y1="35" x2="49" y2="35" stroke="#0B5C5C" stroke-width="2.5"/>
        <text x="36" y="90" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Great Gift</text>
        <text x="36" y="106" font-family="'DejaVu Sans', sans-serif" font-size="13" font-weight="bold" fill="#0B5C5C" text-anchor="middle">Idea</text>
      </g>
    </g>

    <!-- 3 BOTTOM GALLERY SLOTS (y: 875) -->
    <!-- Slot 1 (x: 48, y: 875, w: 276, h: 220, r: 20) -->
    <rect x="48" y="875" width="276" height="220" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>

    <!-- Slot 2 (x: 362, y: 875, w: 276, h: 220, r: 20) -->
    <rect x="362" y="875" width="276" height="220" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>

    <!-- Slot 3 (x: 676, y: 875, w: 276, h: 220, r: 20) -->
    <rect x="676" y="875" width="276" height="220" rx="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8,6"/>

    <!-- FOOTER / CTA SECTION -->
    <!-- Dark Teal CTA Banner -->
    <g transform="translate(60, 1140)">
      <rect width="880" height="68" rx="34" fill="#0B5C5C"/>
      <rect x="6" y="6" width="868" height="56" rx="28" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>

      <!-- Pinterest Pin Icon -->
      <circle cx="45" cy="34" r="18" fill="#E60023"/>
      <text x="45" y="41" font-family="'DejaVu Sans', sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">P</text>

      <!-- CTA Text: GET THE FREE PATTERN -->
      <text x="440" y="42" font-family="'DejaVu Sans', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">
        GET THE <tspan fill="#FF6B81">FREE</tspan> PATTERN
      </text>

      <!-- Heart icon on right -->
      <path d="M 830 30 C 830 25 823 20 818 25 C 813 30 818 37 830 47 C 842 37 847 30 842 25 C 837 20 830 25 830 30 Z" fill="#FF6B81"/>
    </g>

    <!-- White URL Pill: WELOVEPATTERN.COM -->
    <g transform="translate(260, 1225)">
      <rect width="480" height="46" rx="23" fill="#FFFFFF" stroke="#F472B6" stroke-width="2.5" stroke-dasharray="6,4"/>
      <!-- Globe icon -->
      <circle cx="45" cy="23" r="12" fill="none" stroke="#0B5C5C" stroke-width="2"/>
      <line x1="33" y1="23" x2="57" y2="23" stroke="#0B5C5C" stroke-width="2"/>
      <ellipse cx="45" cy="23" rx="6" ry="12" fill="none" stroke="#0B5C5C" stroke-width="1.8"/>

      <text x="240" y="30" font-family="'DejaVu Sans', sans-serif" font-size="18" font-weight="900" fill="#0B5C5C" text-anchor="middle" letter-spacing="2">
        WELOVEPATTERN.COM
      </text>
    </g>

    <!-- Scalloped Bottom Edge -->
    <g transform="translate(0, 1450)">
      <path d="M 0 15 Q 50 0 100 15 Q 150 30 200 15 Q 250 0 300 15 Q 350 30 400 15 Q 450 0 500 15 Q 550 30 600 15 Q 650 0 700 15 Q 750 30 800 15 Q 850 0 900 15 Q 950 30 1000 15 L 1000 50 L 0 50 Z" fill="#0B5C5C"/>
    </g>
  </svg>
  `;

  const outputPath = path.join(TEMPLATE_DIR, 'template-c.png');
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputPath);

  console.log(`Generated Template C at: ${outputPath}`);

  // Also create a smaller preview for UI
  const previewPath = path.join(PREVIEW_DIR, 'template-c-preview.png');
  await sharp(outputPath)
    .resize(320, 480)
    .png()
    .toFile(previewPath);

  console.log(`Generated Template C preview at: ${previewPath}`);
}

async function createTemplateAPreview() {
  const templateAPath = path.join(TEMPLATE_DIR, 'template-a.png');
  if (fs.existsSync(templateAPath)) {
    const previewPath = path.join(PREVIEW_DIR, 'template-a-preview.png');
    await sharp(templateAPath)
      .resize(320, 480)
      .png()
      .toFile(previewPath);
    console.log(`Generated Template A preview at: ${previewPath}`);
  }
}

async function run() {
  await buildTemplateB();
  await buildTemplateC();
  await createTemplateAPreview();
  console.log('All master templates and previews successfully prepared!');
}

run().catch(err => {
  console.error('Error generating templates:', err);
  process.exit(1);
});
