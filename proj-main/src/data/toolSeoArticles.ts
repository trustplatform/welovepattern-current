// Default SEO Rich Text Articles for Craft Tools on CrochetHub
// Stores HTML string for each craft tool slug with local storage persistence for Admin Panel editing

export const DEFAULT_TOOL_SEO_ARTICLES: Record<string, string> = {
  'row-counter': `
<h2>Complete Guide to Using the Digital Crochet & Knitting Row Counter</h2>
<p>Tracking your rows, rounds, and complex pattern repeats accurately is essential for perfect garment sizing, plushie shaping, and pattern symmetry. Our <strong>free online row counter</strong> is specifically built for crocheters, knitters, and crafters who need a reliable, offline-ready counter with audio chimes and haptic feedback.</p>

<h3>Key Features of Our Digital Row Counter</h3>
<ul>
  <li><strong>Offline Ready (PWA):</strong> Keeps working even without Wi-Fi or cellular service in yarn shops or on the couch.</li>
  <li><strong>Audio Chime & Haptic Vibration:</strong> Get instant sensory confirmation every time you increment a row.</li>
  <li><strong>Multi-Section Counter:</strong> Track sleeve repeats, body rows, and pattern motif rounds independently.</li>
  <li><strong>Automatic Session Saving:</strong> Never lose your row count when closing your browser or receiving a phone call.</li>
</ul>

<h3>How to Use the Row Counter for Crochet & Knitting</h3>
<ol>
  <li>Set your target row count or leave it open-ended for continuous counting.</li>
  <li>Tap the large <strong>+1 Count button</strong> or press the spacebar on desktop keyboards after completing each row.</li>
  <li>Use the reset button when starting a new project section or swatch.</li>
</ol>

<h3>Row & Stitch Reference Table</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Project Type</th>
      <th>Average Total Rows</th>
      <th>Recommended Reset Interval</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Baby Blanket (30x30 in)</td>
      <td>60 - 80 Rows</td>
      <td>Every 10 rows (Color change)</td>
    </tr>
    <tr>
      <td>Standard Throw Blanket</td>
      <td>140 - 180 Rows</td>
      <td>Every repeat block (12 rows)</td>
    </tr>
    <tr>
      <td>Amigurumi Toy Body</td>
      <td>24 - 36 Rounds</td>
      <td>Every shaping round</td>
    </tr>
  </tbody>
</table>

<h3>Frequently Asked Questions (FAQ)</h3>
<p><strong>Q: Does this row counter save my progress if I close the tab?</strong><br/>
A: Yes! Your row counts, project title, and history log are automatically saved to your device's local browser memory.</p>

<p><strong>Q: Can I use this row counter on my mobile phone?</strong><br/>
A: Absolutely! It is touch-optimized for iOS and Android devices, with large tap zones and haptic feedback on supported mobile devices.</p>
`,

  'gauge-calculator': `
<h2>Crochet Gauge Swatch Calculator & Size Adjustment Guide</h2>
<p>Skipping your gauge swatch is the number one reason sweaters turn out too large or blankets turn out too small. This <strong>free crochet gauge calculator</strong> allows you to compare your actual swatch measurements against the pattern's target gauge to find your exact stitch and row adjustments.</p>

<h3>Why is Gauge Important in Crochet & Knitting?</h3>
<p>Every crafter has a unique tension, and yarn thickness varies even within the same weight category. Calculating your gauge ensures:</p>
<ul>
  <li>Garments like cardigans, tops, and hats fit comfortably according to pattern schematics.</li>
  <li>You don't run out of yarn midway through a project due to stitching too loosely.</li>
  <li>Your finished item matches the designer's intended drape and fabric density.</li>
</ul>

<h3>How to Calculate Swatch Gauge Adjustments</h3>
<ol>
  <li>Crochet a 4x4 inch (10x10 cm) test swatch in the pattern stitch.</li>
  <li>Count the total stitches and rows inside a 4-inch square using a rigid ruler.</li>
  <li>Input the pattern's target gauge and your measured swatch gauge into our calculator above.</li>
  <li>Follow the calculated hook size recommendation or stitch multiplier adjustment.</li>
</ol>

<h3>Standard Crochet Gauge Quick Reference</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Yarn Weight Class</th>
      <th>Recommended Hook Size</th>
      <th>Average Single Crochet Gauge (4 in)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#2 Fine / Sport</td>
      <td>3.5 mm - 4.0 mm (E-4 to G-6)</td>
      <td>16 - 20 sts</td>
    </tr>
    <tr>
      <td>#4 Medium / Worsted</td>
      <td>5.0 mm - 5.5 mm (H-8 to I-9)</td>
      <td>12 - 15 sts</td>
    </tr>
    <tr>
      <td>#5 Bulky / Chunky</td>
      <td>6.5 mm - 8.0 mm (K-10.5 to L-11)</td>
      <td>8 - 11 sts</td>
    </tr>
  </tbody>
</table>
`,

  'yarn-calculator': `
<h2>Yarn Yardage & Meter Calculator for Blankets, Sweaters & Toys</h2>
<p>Planning your next craft project starts with estimating total yarn requirements. Our <strong>yarn calculator</strong> estimates total yards, meters, and skeins needed for blankets, sweaters, baby clothing, hats, and amigurumi plushies based on yarn weight and dimensions.</p>

<h3>Yarn Yardage Estimate Chart by Project</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Project Size</th>
      <th>Worsted Weight (#4)</th>
      <th>Bulky Weight (#5)</th>
      <th>Super Bulky (#6)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Baby Blanket (30x35 in)</td>
      <td>700 - 900 yards</td>
      <td>500 - 650 yards</td>
      <td>350 - 450 yards</td>
    </tr>
    <tr>
      <td>Throw Blanket (50x60 in)</td>
      <td>1,800 - 2,200 yards</td>
      <td>1,200 - 1,500 yards</td>
      <td>800 - 1,000 yards</td>
    </tr>
    <tr>
      <td>Adult Sweater (Size M)</td>
      <td>1,200 - 1,500 yards</td>
      <td>850 - 1,100 yards</td>
      <td>600 - 750 yards</td>
    </tr>
  </tbody>
</table>

<h3>Tips for Buying the Right Amount of Yarn</h3>
<ul>
  <li><strong>Always Buy an Extra Skein:</strong> Dye lots can vary between production batches; purchase 10% safety margin.</li>
  <li><strong>Account for Decorative Borders:</strong> Blanket borders add 100-250 yards depending on stitch complexity.</li>
  <li><strong>Check Skein Yardage:</strong> Different brands put different yardages in a 100g skein (e.g., 180 yds vs 220 yds).</li>
</ul>
`,

  'hook-size-converter': `
<h2>Crochet Hook Size Conversion Chart - Metric (mm) vs US Letter vs UK</h2>
<p>Navigating vintage patterns, international PDF downloads, or Japanese amigurumi charts requires accurate crochet hook conversions. Use our <strong>free crochet hook size converter</strong> to map metric millimeter (mm) dimensions to US letter names and UK steel numbers instantly.</p>

<h3>International Crochet Hook Size Reference Table</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Metric Size (mm)</th>
      <th>US Hook Letter / Name</th>
      <th>UK / Canadian Size</th>
      <th>Recommended Yarn Weight</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2.25 mm</td>
      <td>B - 1</td>
      <td>13</td>
      <td>#1 Super Fine / Sock</td>
    </tr>
    <tr>
      <td>3.50 mm</td>
      <td>E - 4</td>
      <td>9</td>
      <td>#2 Fine / Sport</td>
    </tr>
    <tr>
      <td>4.00 mm</td>
      <td>G - 6</td>
      <td>8</td>
      <td>#3 Light / DK</td>
    </tr>
    <tr>
      <td>5.00 mm</td>
      <td>H - 8</td>
      <td>6</td>
      <td>#4 Medium / Worsted</td>
    </tr>
    <tr>
      <td>5.50 mm</td>
      <td>I - 9</td>
      <td>5</td>
      <td>#4 Medium / Worsted</td>
    </tr>
    <tr>
      <td>6.00 mm</td>
      <td>J - 10</td>
      <td>4</td>
      <td>#5 Bulky / Chunky</td>
    </tr>
    <tr>
      <td>6.50 mm</td>
      <td>K - 10.5</td>
      <td>3</td>
      <td>#5 Bulky / Chunky</td>
    </tr>
  </tbody>
</table>
`,

  'selling-price-calculator': `
<h2>Crochet & Craft Selling Price Calculator for Handmade Business</h2>
<p>Pricing your handmade crochet, knitting, and craft items fairly is critical for running a profitable craft business on Etsy, craft fairs, or custom commissions. Use our <strong>handmade pricing calculator</strong> to factor in raw material yarn costs, hourly labor rate, overhead, and retail profit margin.</p>

<h3>Formula for Pricing Handmade Crafts</h3>
<p>Our calculator applies the standard craft industry pricing model:</p>
<blockquote style="background:#f1f5f9; border-left:4px solid #E96BA8; padding: 10px 16px; margin: 12px 0;">
  <strong>Fair Wholesale Price</strong> = Material Cost + (Crafting Hours × Hourly Labor Rate) + Overhead<br/>
  <strong>Retail Price</strong> = Wholesale Price × 1.5 to 2.0 (for Profit & Selling Platform Fees)
</blockquote>

<h3>Handmade Craft Pricing Tips</h3>
<ul>
  <li><strong>Never Wage Slavery Yourself:</strong> Charge at least minimum wage ($12 - $20/hr) for skilled labor.</li>
  <li><strong>Include Platform Fees:</strong> Etsy takes ~6.5% transaction fees + listing fees; include them in overhead.</li>
  <li><strong>Track Your Exact Stitching Hours:</strong> Use our integrated Crochet Timer tool to log crafting duration.</li>
</ul>
`,

  'abbreviation-dictionary': `
<h2>Crochet Abbreviation Dictionary & US vs UK Terms Comparison</h2>
<p>Crochet terminology differs significantly between United States (US) and United Kingdom (UK/Australian) patterns. For example, a US single crochet (sc) is called a UK double crochet (dc). Master pattern reading with our <strong>comprehensive crochet abbreviation glossary</strong>.</p>

<h3>US vs UK Crochet Stitch Conversion Chart</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>US Term & Abbreviation</th>
      <th>UK / Australian Equivalent</th>
      <th>Stitch Height & Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Single Crochet (sc)</td>
      <td>Double Crochet (dc)</td>
      <td>Shortest basic stitch; insert hook, yarn over, pull through 2 loops.</td>
    </tr>
    <tr>
      <td>Half Double Crochet (hdc)</td>
      <td>Half Treble Crochet (htr)</td>
      <td>Medium stitch height; yarn over, insert hook, pull through all 3 loops.</td>
    </tr>
    <tr>
      <td>Double Crochet (dc)</td>
      <td>Treble Crochet (tr)</td>
      <td>Tall stitch; yarn over, insert hook, pull through 2 loops twice.</td>
    </tr>
    <tr>
      <td>Treble Crochet (tr)</td>
      <td>Double Treble Crochet (dtr)</td>
      <td>Very tall stitch; yarn over twice before inserting hook.</td>
    </tr>
    <tr>
      <td>Slip Stitch (sl st)</td>
      <td>Slip Stitch (sl st)</td>
      <td>Join stitch; pull loop directly through stitch and loop on hook.</td>
    </tr>
  </tbody>
</table>
`
};

const STORAGE_KEY = 'crochethub_tool_seo_articles_v1';

export const getToolSeoArticle = (slug: string): string => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[slug]) {
          return parsed[slug];
        }
      }
    }
  } catch (err) {
    console.error('Failed to load SEO article from localStorage:', err);
  }

  // Return default or generic fallback
  if (DEFAULT_TOOL_SEO_ARTICLES[slug]) {
    return DEFAULT_TOOL_SEO_ARTICLES[slug];
  }

  // Generic fallback article
  const formattedName = (slug || 'Craft Tool').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `
<h2>About the ${formattedName} Tool & User Guide</h2>
<p>Welcome to the <strong>${formattedName}</strong> on CrochetHub. This free online utility is crafted specifically for yarn enthusiasts, crocheters, knitters, and handmade makers seeking accurate calculations, instant conversions, and offline utility.</p>

<h3>Why Use This Craft Tool?</h3>
<ul>
  <li><strong>Instant & Accurate:</strong> Performs calculations in real time with zero latency.</li>
  <li><strong>100% Free & No Sign-up Required:</strong> Access all features instantly on desktop, tablet, and mobile browsers.</li>
  <li><strong>Offline Ready:</strong> Works smoothly without active internet connections once loaded.</li>
</ul>

<h3>Tips & Best Practices</h3>
<p>Ensure your inputs match your yarn ball band measurements or swatch dimensions for best results. Bookmark this page or install our PWA app to access this tool anywhere on the go!</p>
`;
};

export const saveToolSeoArticle = (slug: string, htmlContent: string): void => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      const articles = saved ? JSON.parse(saved) : { ...DEFAULT_TOOL_SEO_ARTICLES };
      articles[slug] = htmlContent;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }
  } catch (err) {
    console.error('Failed to save SEO article to localStorage:', err);
  }
};
