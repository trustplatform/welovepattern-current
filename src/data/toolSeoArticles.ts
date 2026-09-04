// Default In-Depth SEO Rich Text Articles for Craft Tools on WeLovePattern
// Stores structured, intent-matched HTML guides for all 19 craft tool slugs

export const DEFAULT_TOOL_SEO_ARTICLES: Record<string, string> = {
  'row-counter': `
<h2>Complete Guide to Using the Digital Crochet & Knitting Row Counter</h2>
<p>Tracking your rows, rounds, and complex pattern repeats accurately is essential for perfect garment sizing, plushie shaping, and pattern symmetry. Our <strong>free online row counter</strong> is specifically built for crocheters, knitters, and fiber crafters who need a reliable, offline-ready counter with audio chimes and haptic feedback.</p>

<h3>Key Features of Our Digital Row Counter</h3>
<ul>
  <li><strong>Offline Ready (PWA):</strong> Keeps working even without Wi-Fi or cellular service in yarn shops or on the couch.</li>
  <li><strong>Audio Chime & Haptic Vibration:</strong> Get instant sensory confirmation every time you increment a row so you never lose count while watching television or listening to audiobooks.</li>
  <li><strong>Multi-Section Counter:</strong> Track sleeve repeats, body rows, and pattern motif rounds independently.</li>
  <li><strong>Automatic Session Saving:</strong> Never lose your row count when closing your browser or receiving a phone call.</li>
</ul>

<h3>How to Use the Row Counter for Crochet & Knitting</h3>
<ol>
  <li>Set your target row count or leave it open-ended for continuous counting.</li>
  <li>Tap the large <strong>+1 Count button</strong> or press the spacebar on desktop keyboards after completing each row or turning chain.</li>
  <li>Use the reset button when starting a new project section, swatch, or round repeat.</li>
  <li>Pair your counts with our <a href="/tools/crochet-timer" class="text-[#E96BA8] font-bold hover:underline">Crochet Timer</a> to calculate your exact stitches-per-minute crafting pace.</li>
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
      <td>Baby Blanket (30x35 in)</td>
      <td>60 - 85 Rows</td>
      <td>Every 10 rows (Color change interval)</td>
    </tr>
    <tr>
      <td>Standard Throw Blanket (50x60 in)</td>
      <td>140 - 180 Rows</td>
      <td>Every repeat block (12 to 16 rows)</td>
    </tr>
    <tr>
      <td>Amigurumi Toy Body</td>
      <td>24 - 36 Rounds</td>
      <td>Every shaping round (increase/decrease)</td>
    </tr>
    <tr>
      <td>Adult Cardigan Sleeves</td>
      <td>70 - 95 Rows</td>
      <td>Every cuff increase row (typically every 4th row)</td>
    </tr>
  </tbody>
</table>

<h3>Common Counting Mistakes to Avoid</h3>
<ul>
  <li><strong>Counting the foundation chain as Row 1:</strong> Unless the designer states otherwise, the foundation chain is Row 0; Row 1 begins when stitches are worked into the chain.</li>
  <li><strong>Misidentifying the turning chain:</strong> Double check whether the pattern counts the turning chain (ch-2 or ch-3) as a stitch or an edge lifter.</li>
  <li><strong>Not marking the first stitch of a spiral round:</strong> In amigurumi, always place a physical locking stitch marker in the first stitch of each round alongside your digital counter.</li>
</ul>

<h3>Frequently Asked Questions (FAQ)</h3>
<p><strong>Q: Does this row counter save my progress if I close my mobile browser?</strong><br/>
A: Yes! Your row count and session history are automatically saved into your device's browser memory via local persistence.</p>

<p><strong>Q: Can I use keyboard shortcuts on my laptop or desktop computer?</strong><br/>
A: Yes! Pressing the Spacebar or Up Arrow increments your count by 1, making hands-free counting easy while your hands are on the yarn.</p>

<p><strong>Q: Which related tools should I use with this counter?</strong><br/>
A: Combine this tool with our <a href="/tools/stitch-counter" class="text-[#E96BA8] font-bold hover:underline">Stitch Counter</a> for intricate repeats, or use our <a href="/tools/gauge-calculator" class="text-[#E96BA8] font-bold hover:underline">Gauge Swatch Calculator</a> to verify finished row heights.</p>
`,

  'stitch-counter': `
<h2>Multi-Section Stitch Counter for Complex Repeats & Shaping</h2>
<p>While row counters track vertical progress, our <strong>multi-section stitch counter</strong> is designed for intricate horizontal repeats, sleeve increases, lace pattern multiples, and amigurumi stitch counts. Manage multiple active sections simultaneously without mixing up counts.</p>

<h3>When to Use a Multi-Section Stitch Counter</h3>
<ul>
  <li><strong>Sweater Raglan Yokes:</strong> Track front panel, back panel, and left/right sleeve increases at the same time.</li>
  <li><strong>Lace & Cable Repeats:</strong> Keep track of 8-stitch or 12-stitch motif repetitions across a wide shawl.</li>
  <li><strong>Amigurumi Shaping Rounds:</strong> Count individual single crochets between increase stitches (e.g., *sc in next 5 sts, 2 sc in next st*).</li>
</ul>

<h3>Step-by-Step Usage Guide</h3>
<ol>
  <li>Create custom section labels (e.g., "Right Front", "Raglan Increase", "Border Stitches").</li>
  <li>Tap <strong>+1</strong> on the specific section as you complete each stitch or pattern multiple.</li>
  <li>Use the section reset button when starting a fresh pattern repeat cycle.</li>
</ol>

<h3>Pattern Repeat Calculations Example</h3>
<p>If your blanket border requires a multiple of 6 stitches + 2 for corners, use the stitch counter to track your edge pick-ups. If you have 146 side stitches, 146 - 2 = 144, and 144 ÷ 6 = 24 full pattern repeats. Check out our <a href="/tools/border-calculator" class="text-[#E96BA8] font-bold hover:underline">Border Calculator</a> for automated edge calculations.</p>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: How many independent sections can I create?</strong><br/>
A: You can create unlimited custom sections with individual names and counts.</p>

<p><strong>Q: Can I reset one section without resetting the others?</strong><br/>
A: Yes, each section card has its own reset and delete controls.</p>
`,

  'project-tracker': `
<h2>Crochet Project Tracker & WIP (Works In Progress) Organizer</h2>
<p>Never forget which hook size or dye lot you used on an unfinished project. The <strong>WeLovePattern Project Tracker</strong> lets you organize active projects, track completion percentages, record yarn skein details, and log starting dates in one secure offline dashboard.</p>

<h3>What to Record for Every Crochet WIP</h3>
<ul>
  <li><strong>Hook & Needle Size:</strong> Metric millimeter (mm) and US letter size used for the gauge swatch.</li>
  <li><strong>Yarn Brand, Colorway & Dye Lot:</strong> Avoid color mismatches when purchasing additional skeins weeks later.</li>
  <li><strong>Pattern Source & Page Number:</strong> Link to digital PDF downloads or physical pattern books.</li>
  <li><strong>Target Completion Date:</strong> Keep track of gift deadlines for baby showers, birthdays, and holiday markets.</li>
</ul>

<h3>WIP Management Tips for Productive Makers</h3>
<ol>
  <li>Limit active WIPs to 3–5 projects to prevent project burnout and unfinished clutter.</li>
  <li>Take a quick photo of your yarn ball band and hook alongside your work before storing in project bags.</li>
  <li>Calculate material costs early using our <a href="/tools/yarn-cost-calculator" class="text-[#E96BA8] font-bold hover:underline">Yarn Cost Calculator</a> and <a href="/tools/selling-price-calculator" class="text-[#E96BA8] font-bold hover:underline">Selling Price Calculator</a> for craft fair stock.</li>
</ol>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: Where are my saved projects stored?</strong><br/>
A: Projects are stored locally in your browser's persistent storage, allowing full offline access without requiring user account creation.</p>
`,

  'gauge-calculator': `
<h2>Crochet Gauge Swatch Calculator & Size Adjustment Guide</h2>
<p>Skipping your gauge swatch is the number one reason sweaters turn out too large, beanies turn out too tight, or blankets consume more yarn than estimated. This <strong>free crochet gauge calculator</strong> allows you to compare your measured swatch against the designer's target gauge to find your exact stitch and row adjustments.</p>

<h3>Why Gauge Matters in Crochet & Knitting</h3>
<p>Every crafter has a unique natural hand tension, and yarn thickness varies even within the same weight category. Calculating your gauge ensures:</p>
<ul>
  <li>Garments like cardigans, tops, and hats fit comfortably according to pattern schematics.</li>
  <li>You don't run out of yarn midway through a project due to stitching too loosely.</li>
  <li>Your finished item matches the designer's intended drape and fabric density.</li>
</ul>

<h3>How to Measure & Calculate Gauge</h3>
<ol>
  <li><strong>Crochet a 5x5 inch (12x12 cm) test swatch:</strong> Working a swatch larger than 4 inches ensures your edge stitches don't distort measurements.</li>
  <li><strong>Block your swatch:</strong> Wet or steam block your swatch and let it dry completely to account for yarn bloom and shrinkage.</li>
  <li><strong>Count stitches and rows:</strong> Lay a rigid metal or wooden ruler across the center of your swatch and count total stitches across 4 inches (10 cm), then count rows vertically.</li>
  <li><strong>Input your numbers:</strong> Enter your stitch and row counts into the calculator above to see if you should adjust your hook size up or down.</li>
</ol>

<h3>Standard Single Crochet Gauge Reference Table</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Yarn Weight Class</th>
      <th>Recommended Hook Size</th>
      <th>Average Single Crochet Gauge (4 in / 10 cm)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#1 Super Fine / Sock</td>
      <td>2.25 mm - 3.25 mm (B-1 to D-3)</td>
      <td>21 - 32 sts</td>
    </tr>
    <tr>
      <td>#2 Fine / Sport</td>
      <td>3.5 mm - 4.0 mm (E-4 to G-6)</td>
      <td>16 - 20 sts</td>
    </tr>
    <tr>
      <td>#3 Light / DK</td>
      <td>4.0 mm - 4.5 mm (G-6 to 7)</td>
      <td>12 - 17 sts</td>
    </tr>
    <tr>
      <td>#4 Medium / Worsted</td>
      <td>5.0 mm - 5.5 mm (H-8 to I-9)</td>
      <td>11 - 14 sts</td>
    </tr>
    <tr>
      <td>#5 Bulky / Chunky</td>
      <td>6.5 mm - 8.0 mm (K-10.5 to L-11)</td>
      <td>8 - 11 sts</td>
    </tr>
    <tr>
      <td>#6 Super Bulky</td>
      <td>9.0 mm - 15.0 mm (M-13 to P/Q)</td>
      <td>5 - 9 sts</td>
    </tr>
  </tbody>
</table>

<h3>Gauge Adjustment Rules</h3>
<ul>
  <li><strong>Too Many Stitches per 4 inches?</strong> Your tension is too tight → Switch to a <strong>larger hook size</strong> (e.g., from 5.0mm H-8 to 5.5mm I-9).</li>
  <li><strong>Too Few Stitches per 4 inches?</strong> Your tension is too loose → Switch to a <strong>smaller hook size</strong> (e.g., from 5.0mm H-8 to 4.5mm 7).</li>
</ul>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: What if my stitch gauge matches but my row gauge is off?</strong><br/>
A: Adjust your "golden loop" technique. When pulling up a loop through the stitch, pulling it taller increases row height without widening the stitch.</p>

<p><strong>Q: Can I use this for knitting gauge swatches?</strong><br/>
A: Yes! The mathematical ratio of pattern stitches to swatch stitches applies equally to knitting swatches and crochet fabric.</p>
`,

  'yarn-calculator': `
<h2>Crochet Yarn Calculator - Estimate Yardage, Meters & Skeins</h2>
<p>Planning your next craft project starts with estimating total yarn requirements. Our <strong>yarn calculator</strong> estimates total yards, meters, and skeins needed for blankets, sweaters, baby clothing, hats, scarves, and amigurumi plushies based on project dimensions and yarn weight.</p>

<h3>Yarn Yardage Estimate Chart by Project</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Project Type & Dimensions</th>
      <th>DK / Light (#3)</th>
      <th>Worsted (#4)</th>
      <th>Bulky (#5)</th>
      <th>Super Bulky (#6)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Baby Blanket (30" x 35")</td>
      <td>900 - 1,100 yds</td>
      <td>700 - 900 yds</td>
      <td>500 - 650 yds</td>
      <td>350 - 450 yds</td>
    </tr>
    <tr>
      <td>Lapghan Blanket (40" x 48")</td>
      <td>1,400 - 1,700 yds</td>
      <td>1,200 - 1,450 yds</td>
      <td>900 - 1,100 yds</td>
      <td>650 - 800 yds</td>
    </tr>
    <tr>
      <td>Throw Blanket (50" x 60")</td>
      <td>2,200 - 2,600 yds</td>
      <td>1,800 - 2,200 yds</td>
      <td>1,200 - 1,500 yds</td>
      <td>850 - 1,100 yds</td>
    </tr>
    <tr>
      <td>Queen Bed Blanket (90" x 90")</td>
      <td>4,800 - 5,600 yds</td>
      <td>3,800 - 4,500 yds</td>
      <td>2,800 - 3,400 yds</td>
      <td>2,000 - 2,500 yds</td>
    </tr>
    <tr>
      <td>Adult Pullover Sweater (M/L)</td>
      <td>1,400 - 1,800 yds</td>
      <td>1,200 - 1,500 yds</td>
      <td>850 - 1,100 yds</td>
      <td>600 - 750 yds</td>
    </tr>
    <tr>
      <td>Adult Beanie Hat</td>
      <td>220 - 260 yds</td>
      <td>180 - 220 yds</td>
      <td>120 - 160 yds</td>
      <td>90 - 120 yds</td>
    </tr>
    <tr>
      <td>Amigurumi Toy (7-9 in)</td>
      <td>250 - 350 yds</td>
      <td>200 - 300 yds</td>
      <td>150 - 200 yds</td>
      <td>100 - 140 yds</td>
    </tr>
  </tbody>
</table>

<h3>Factors That Affect Yarn Consumption</h3>
<ul>
  <li><strong>Stitch Choice:</strong> Dense textured stitches like puff stitches, bobbles, and waffle stitch use up to 30% more yarn than standard double crochet (dc) or moss stitch.</li>
  <li><strong>Hook Size & Tension:</strong> Tighter stitching creates denser fabric requiring more stitches per square inch.</li>
  <li><strong>Borders & Edgings:</strong> Wide decorative shell or crab stitch borders add 100 to 300 yards.</li>
</ul>

<h3>Tips for Buying Skeins</h3>
<ol>
  <li><strong>Always add a 10% safety buffer:</strong> Buy one extra skein of the same dye lot to avoid running out on the final border.</li>
  <li><strong>Check Ball Band Yardage:</strong> Two 100g skeins can have drastically different yardages depending on fiber density (e.g. 100g cotton ~180 yds, 100g acrylic ~220 yds).</li>
  <li>Use our <a href="/tools/yarn-cost-calculator" class="text-[#E96BA8] font-bold hover:underline">Yarn Cost Calculator</a> to estimate your total checkout budget.</li>
</ol>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: How do I convert yards to meters?</strong><br/>
A: Multiply total yards by 0.9144 (e.g. 1,000 yards × 0.9144 = 914.4 meters).</p>

<p><strong>Q: What if my pattern specifies weight in grams instead of yards?</strong><br/>
A: Check the ball band for the meters-per-gram ratio, or use our <a href="/tools/yarn-weight-converter" class="text-[#E96BA8] font-bold hover:underline">Yarn Weight Converter</a> to look up standard fiber weights.</p>
`,

  'yarn-weight-converter': `
<h2>Standard Yarn Weight Chart (CYC 0-7), WPI & Ply Conversion</h2>
<p>Understanding yarn weight categories is critical when substituting yarns or adapting international patterns. This <strong>interactive yarn weight converter</strong> maps Craft Yarn Council (CYC) standards (0 Lace to 7 Jumbo) to Wraps Per Inch (WPI), traditional UK/Australian ply ratings, recommended crochet hook sizes, and knitting needle gauges.</p>

<h3>Master Yarn Weight & WPI Conversion Table</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>CYC Category</th>
      <th>Standard US Names</th>
      <th>UK / AU Ply</th>
      <th>WPI (Wraps Per Inch)</th>
      <th>Recommended Hook</th>
      <th>Recommended Needles</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>#0 Lace</strong></td>
      <td>Fingering 10-count, Thread</td>
      <td>1-ply / 2-ply</td>
      <td>18+ WPI</td>
      <td>1.6 - 2.25 mm (Steel 6 to B-1)</td>
      <td>1.5 - 2.25 mm (US 000 - 1)</td>
    </tr>
    <tr>
      <td><strong>#1 Super Fine</strong></td>
      <td>Sock, Fingering, Baby</td>
      <td>3-ply / 4-ply</td>
      <td>14 - 18 WPI</td>
      <td>2.25 - 3.5 mm (B-1 to E-4)</td>
      <td>2.25 - 3.25 mm (US 1 - 3)</td>
    </tr>
    <tr>
      <td><strong>#2 Fine</strong></td>
      <td>Sport, Baby</td>
      <td>5-ply</td>
      <td>12 - 14 WPI</td>
      <td>3.5 - 4.5 mm (E-4 to 7)</td>
      <td>3.25 - 3.75 mm (US 3 - 5)</td>
    </tr>
    <tr>
      <td><strong>#3 Light</strong></td>
      <td>DK (Double Knitting), Light Worsted</td>
      <td>8-ply</td>
      <td>11 - 12 WPI</td>
      <td>4.5 - 5.5 mm (7 to I-9)</td>
      <td>3.75 - 4.5 mm (US 5 - 7)</td>
    </tr>
    <tr>
      <td><strong>#4 Medium</strong></td>
      <td>Worsted, Afghan, Aran</td>
      <td>10-ply / 12-ply</td>
      <td>9 - 11 WPI</td>
      <td>5.5 - 6.5 mm (I-9 to K-10.5)</td>
      <td>4.5 - 5.5 mm (US 7 - 9)</td>
    </tr>
    <tr>
      <td><strong>#5 Bulky</strong></td>
      <td>Chunky, Craft, Rug</td>
      <td>12-ply / 14-ply</td>
      <td>7 - 8 WPI</td>
      <td>6.5 - 9.0 mm (K-10.5 to M-13)</td>
      <td>5.5 - 8.0 mm (US 9 - 11)</td>
    </tr>
    <tr>
      <td><strong>#6 Super Bulky</strong></td>
      <td>Super Bulky, Roving</td>
      <td>16-ply+</td>
      <td>5 - 6 WPI</td>
      <td>9.0 - 15.0 mm (M-13 to Q)</td>
      <td>8.0 - 12.75 mm (US 11 - 17)</td>
    </tr>
    <tr>
      <td><strong>#7 Jumbo</strong></td>
      <td>Jumbo, Arm Knitting Roving</td>
      <td>Giant</td>
      <td>1 - 4 WPI</td>
      <td>15.0 mm+ (Q and larger)</td>
      <td>12.75 mm+ (US 17+)</td>
    </tr>
  </tbody>
</table>

<h3>How to Measure WPI (Wraps Per Inch)</h3>
<ol>
  <li>Take a standard wooden pencil or ruler.</li>
  <li>Wrap your unidentified mystery yarn around the ruler so the strands sit snugly side by side without overlapping or stretching.</li>
  <li>Count how many wraps fit inside 1 inch (2.54 cm).</li>
  <li>Compare your count against the WPI column in the table above to identify the yarn category!</li>
</ol>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: Can I hold two strands of DK yarn together to equal Worsted?</strong><br/>
A: Holding two strands of #3 DK yarn together produces a gauge similar to #5 Bulky yarn. To match #4 Worsted weight, hold two strands of #2 Sport or #1 Fingering weight yarn together.</p>

<p><strong>Q: What is the difference between Worsted and Aran weight?</strong><br/>
A: Both are classified as #4 Medium weight, but Aran is slightly heavier (traditional 10-ply to 12-ply) with a denser drape than standard Worsted.</p>
`,

  'hook-size-converter': `
<h2>Crochet Hook Size Conversion Chart - Metric mm, US Letters & UK Numbers</h2>
<p>Navigating vintage crochet patterns, international PDF downloads, or Japanese amigurumi charts requires accurate crochet hook conversions. Use our <strong>free crochet hook size converter</strong> to map metric millimeter (mm) dimensions to US letter names, UK steel numbers, and Japanese hook sizes instantly.</p>

<h3>Comprehensive International Hook Size Conversion Matrix</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Metric Size (mm)</th>
      <th>US Letter / Name</th>
      <th>UK / Canadian Size</th>
      <th>Japanese Hook Size</th>
      <th>Best For Yarn Weight</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2.00 mm</td>
      <td>—</td>
      <td>14</td>
      <td>2/0</td>
      <td>#0 Lace / Thread</td>
    </tr>
    <tr>
      <td>2.25 mm</td>
      <td>B - 1</td>
      <td>13</td>
      <td>—</td>
      <td>#1 Sock / Fingering</td>
    </tr>
    <tr>
      <td>2.50 mm</td>
      <td>—</td>
      <td>12</td>
      <td>4/0</td>
      <td>#1 Sock / Fingering</td>
    </tr>
    <tr>
      <td>2.75 mm</td>
      <td>C - 2</td>
      <td>—</td>
      <td>—</td>
      <td>#1 Super Fine</td>
    </tr>
    <tr>
      <td>3.00 mm</td>
      <td>—</td>
      <td>11</td>
      <td>5/0</td>
      <td>#2 Sport</td>
    </tr>
    <tr>
      <td>3.25 mm</td>
      <td>D - 3</td>
      <td>10</td>
      <td>—</td>
      <td>#2 Sport</td>
    </tr>
    <tr>
      <td>3.50 mm</td>
      <td>E - 4</td>
      <td>9</td>
      <td>6/0</td>
      <td>#2 Sport / #3 DK</td>
    </tr>
    <tr>
      <td>3.75 mm</td>
      <td>F - 5</td>
      <td>—</td>
      <td>—</td>
      <td>#3 Light / DK</td>
    </tr>
    <tr>
      <td>4.00 mm</td>
      <td>G - 6</td>
      <td>8</td>
      <td>7/0</td>
      <td>#3 Light / DK</td>
    </tr>
    <tr>
      <td>4.50 mm</td>
      <td>7</td>
      <td>7</td>
      <td>7.5/0</td>
      <td>#3 DK / #4 Worsted</td>
    </tr>
    <tr>
      <td>5.00 mm</td>
      <td>H - 8</td>
      <td>6</td>
      <td>8/0</td>
      <td>#4 Medium / Worsted</td>
    </tr>
    <tr>
      <td>5.50 mm</td>
      <td>I - 9</td>
      <td>5</td>
      <td>9/0</td>
      <td>#4 Medium / Worsted</td>
    </tr>
    <tr>
      <td>6.00 mm</td>
      <td>J - 10</td>
      <td>4</td>
      <td>10/0</td>
      <td>#4 Worsted / #5 Bulky</td>
    </tr>
    <tr>
      <td>6.50 mm</td>
      <td>K - 10.5</td>
      <td>3</td>
      <td>—</td>
      <td>#5 Bulky / Chunky</td>
    </tr>
    <tr>
      <td>8.00 mm</td>
      <td>L - 11</td>
      <td>0</td>
      <td>—</td>
      <td>#5 Bulky / #6 Super Bulky</td>
    </tr>
    <tr>
      <td>9.00 mm</td>
      <td>M / N - 13</td>
      <td>00</td>
      <td>—</td>
      <td>#6 Super Bulky</td>
    </tr>
    <tr>
      <td>10.00 mm</td>
      <td>N / P - 15</td>
      <td>000</td>
      <td>—</td>
      <td>#6 Super Bulky</td>
    </tr>
    <tr>
      <td>15.00 mm</td>
      <td>P / Q</td>
      <td>—</td>
      <td>—</td>
      <td>#7 Jumbo</td>
    </tr>
  </tbody>
</table>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: What US size is a 5.0 mm crochet hook?</strong><br/>
A: A 5.0 mm hook is a <strong>US H-8</strong> (or UK size 6). It is the most popular hook size in the world for #4 worsted weight yarn.</p>

<p><strong>Q: Why do hook letter names vary between manufacturers?</strong><br/>
A: Some brands label 3.75mm as "F" while others label 4.0mm as "G". Always rely on the exact <strong>millimeter (mm)</strong> measurement stamped on the hook shaft for precise gauge matching.</p>
`,

  'needle-size-converter': `
<h2>Knitting Needle Size Conversion Chart - Metric mm, US & UK Sizes</h2>
<p>Knitting needle numbering systems vary significantly between North America, the UK, and continental Europe. Use our <strong>knitting needle converter</strong> to translate straight, circular, and double-pointed needle (DPN) sizes accurately.</p>

<h3>Knitting Needle Size Comparison Chart</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Metric Diameter (mm)</th>
      <th>US Size Number</th>
      <th>UK / Canadian Size</th>
      <th>Recommended Yarn Weight</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>2.00 mm</td><td>0</td><td>14</td><td>#0 Lace</td></tr>
    <tr><td>2.25 mm</td><td>1</td><td>13</td><td>#1 Sock / Fingering</td></tr>
    <tr><td>2.75 mm</td><td>2</td><td>12</td><td>#1 Fingering</td></tr>
    <tr><td>3.25 mm</td><td>3</td><td>10</td><td>#2 Sport</td></tr>
    <tr><td>3.50 mm</td><td>4</td><td>—</td><td>#2 Sport / #3 DK</td></tr>
    <tr><td>3.75 mm</td><td>5</td><td>9</td><td>#3 Light / DK</td></tr>
    <tr><td>4.00 mm</td><td>6</td><td>8</td><td>#3 Light / DK</td></tr>
    <tr><td>4.50 mm</td><td>7</td><td>7</td><td>#4 Medium / Worsted</td></tr>
    <tr><td>5.00 mm</td><td>8</td><td>6</td><td>#4 Medium / Worsted</td></tr>
    <tr><td>5.50 mm</td><td>9</td><td>5</td><td>#4 Worsted / Aran</td></tr>
    <tr><td>6.00 mm</td><td>10</td><td>4</td><td>#5 Bulky</td></tr>
    <tr><td>6.50 mm</td><td>10.5</td><td>3</td><td>#5 Bulky</td></tr>
    <tr><td>8.00 mm</td><td>11</td><td>0</td><td>#5 Bulky / #6 Super Bulky</td></tr>
    <tr><td>9.00 mm</td><td>13</td><td>00</td><td>#6 Super Bulky</td></tr>
    <tr><td>10.00 mm</td><td>15</td><td>000</td><td>#6 Super Bulky</td></tr>
  </tbody>
</table>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: What size is a US 8 in millimeters?</strong><br/>
A: A US 8 knitting needle is exactly <strong>5.0 mm</strong>, recommended for medium worsted weight yarn.</p>

<p><strong>Q: Why do UK needle numbers count backwards?</strong><br/>
A: Historical UK needle sizes are based on wire gauge standards where thicker wire had a smaller number (e.g. Size 14 is very thin 2.0mm, Size 0 is thick 8.0mm).</p>
`,

  'granny-square-calculator': `
<h2>Granny Square Blanket Calculator - Square Layout & Yardage Estimator</h2>
<p>Planning a granny square blanket requires calculating the total number of squares, layout grid dimensions (rows × columns), and joining border yarn. Use our <strong>Granny Square Calculator</strong> to eliminate guesswork before stitching.</p>

<h3>How to Calculate Total Granny Squares</h3>
<ol>
  <li><strong>Measure your individual square:</strong> Stitch and block one sample granny square and measure its width and height (e.g., 6" × 6").</li>
  <li><strong>Choose your target blanket size:</strong> For example, a throw blanket measuring 50" wide by 60" long.</li>
  <li><strong>Calculate grid columns:</strong> 50" ÷ 6" = 8.33 → round to 8 squares wide.</li>
  <li><strong>Calculate grid rows:</strong> 60" ÷ 6" = 10 squares long.</li>
  <li><strong>Multiply for total:</strong> 8 × 10 = <strong>80 total squares</strong> needed.</li>
</ol>

<h3>Standard Granny Square Blanket Layout Matrix</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Blanket Dimension</th>
      <th>4" Square Layout</th>
      <th>6" Square Layout</th>
      <th>8" Square Layout</th>
      <th>Total Yards Needed (Approx)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Baby Afghan (32" x 36")</td>
      <td>8 × 9 = 72 squares</td>
      <td>5 × 6 = 30 squares</td>
      <td>4 × 5 = 20 squares</td>
      <td>800 - 1,100 yds</td>
    </tr>
    <tr>
      <td>Lapghan (40" x 48")</td>
      <td>10 × 12 = 120 squares</td>
      <td>7 × 8 = 56 squares</td>
      <td>5 × 6 = 30 squares</td>
      <td>1,300 - 1,600 yds</td>
    </tr>
    <tr>
      <td>Standard Throw (48" x 60")</td>
      <td>12 × 15 = 180 squares</td>
      <td>8 × 10 = 80 squares</td>
      <td>6 × 8 = 48 squares</td>
      <td>1,800 - 2,400 yds</td>
    </tr>
    <tr>
      <td>Queen Bed (88" x 96")</td>
      <td>22 × 24 = 528 squares</td>
      <td>15 × 16 = 240 squares</td>
      <td>11 × 12 = 132 squares</td>
      <td>4,200 - 5,000 yds</td>
    </tr>
  </tbody>
</table>

<h3>Yarn Estimates for Joining & Borders</h3>
<p>Joining squares using the slip-stitch method, invisible mattress stitch, or continuous join-as-you-go (JAYG) requires approximately <strong>20% to 25% of additional yarn</strong> on top of the total square yardage. Plan 1 to 2 dedicated skeins of your border color.</p>
`,

  'blanket-calculator': `
<h2>Crochet Blanket Size Calculator - Chain Count, Rows & Mattress Dimensions</h2>
<p>Crocheting a blanket that fits standard bed mattresses or stroller dimensions requires knowing exact chain counts, row counts, and yardage. Use our <strong>blanket dimension calculator</strong> to plan your afghans accurately.</p>

<h3>Standard Crochet Blanket Dimensions Reference Chart</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Blanket Style / Size</th>
      <th>Width × Length (Inches)</th>
      <th>Width × Length (cm)</th>
      <th>Starting Chain (Worsted #4, 5mm)</th>
      <th>Average Rows</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Lovey / Security Blanket</td>
      <td>14" × 14"</td>
      <td>35 × 35 cm</td>
      <td>45 - 50 ch</td>
      <td>35 rows</td>
    </tr>
    <tr>
      <td>Stroller / Car Seat</td>
      <td>24" × 30"</td>
      <td>60 × 75 cm</td>
      <td>80 - 85 ch</td>
      <td>70 rows</td>
    </tr>
    <tr>
      <td>Receiving Baby Blanket</td>
      <td>30" × 35"</td>
      <td>75 × 90 cm</td>
      <td>105 - 110 ch</td>
      <td>85 rows</td>
    </tr>
    <tr>
      <td>Toddler / Crib Mattress</td>
      <td>36" × 54"</td>
      <td>90 × 135 cm</td>
      <td>125 - 130 ch</td>
      <td>130 rows</td>
    </tr>
    <tr>
      <td>Lapghan / Wheelchair Throw</td>
      <td>40" × 48"</td>
      <td>100 × 120 cm</td>
      <td>140 - 145 ch</td>
      <td>115 rows</td>
    </tr>
    <tr>
      <td>Standard Living Room Throw</td>
      <td>50" × 60"</td>
      <td>125 × 150 cm</td>
      <td>175 - 180 ch</td>
      <td>145 rows</td>
    </tr>
    <tr>
      <td>Twin Bed Blanket</td>
      <td>66" × 90"</td>
      <td>165 × 230 cm</td>
      <td>230 - 235 ch</td>
      <td>215 rows</td>
    </tr>
    <tr>
      <td>Full / Double Bed</td>
      <td>80" × 90"</td>
      <td>200 × 230 cm</td>
      <td>280 - 285 ch</td>
      <td>215 rows</td>
    </tr>
    <tr>
      <td>Queen Bed Blanket</td>
      <td>90" × 95"</td>
      <td>230 × 240 cm</td>
      <td>315 - 320 ch</td>
      <td>230 rows</td>
    </tr>
    <tr>
      <td>King Bed Blanket</td>
      <td>108" × 95"</td>
      <td>275 × 240 cm</td>
      <td>380 - 385 ch</td>
      <td>230 rows</td>
    </tr>
  </tbody>
</table>

<h3>How to Adjust for Different Yarn Weights</h3>
<ul>
  <li><strong>Bulky Yarn (#5) with 6.5mm hook:</strong> Multiply target width in inches by 2.5 for your starting chain.</li>
  <li><strong>Super Bulky (#6) with 9mm hook:</strong> Multiply target width in inches by 1.8 for your starting chain.</li>
  <li><strong>DK Yarn (#3) with 4mm hook:</strong> Multiply target width in inches by 4.5 for your starting chain.</li>
</ul>
`,

  'border-calculator': `
<h2>Crochet Blanket Border Calculator - Edge Stitch Counts & Corner Math</h2>
<p>Uneven, ruffling, or puckering blanket borders happen when edge stitches are spaced incorrectly. Our <strong>Border Calculator</strong> computes the exact side edge pick-up ratio and corner stitch multiples for perfectly flat afghan borders.</p>

<h3>Golden Rules for Picking Up Side Stitches</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Body Stitch Used</th>
      <th>Side Edge Pick-Up Ratio</th>
      <th>Corner Stitch Allowance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Single Crochet (sc) rows</td>
      <td>1 stitch per row end (1:1)</td>
      <td>3 sc in corner stitch</td>
    </tr>
    <tr>
      <td>Half Double Crochet (hdc) rows</td>
      <td>3 stitches per every 2 row ends (3:2)</td>
      <td>(hdc, ch 2, hdc) in corner</td>
    </tr>
    <tr>
      <td>Double Crochet (dc) rows</td>
      <td>2 stitches per row end (2:1)</td>
      <td>(2 dc, ch 2, 2 dc) or 5 dc in corner</td>
    </tr>
    <tr>
      <td>Treble Crochet (tr) rows</td>
      <td>3 stitches per row end (3:1)</td>
      <td>(3 tr, ch 2, 3 tr) in corner</td>
    </tr>
  </tbody>
</table>

<h3>Preventing Border Ruffles vs Puckering</h3>
<ul>
  <li><strong>If your border is wavy/ruffling:</strong> You have placed too many stitches along the edge → Reduce your pick-up count by skipping every 5th or 6th stitch.</li>
  <li><strong>If your blanket corners are curling inward (puckering):</strong> You do not have enough corner increase stitches → Add an extra chain-2 space or work 3 stitches into the corner loop.</li>
</ul>
`,

  'yarn-cost-calculator': `
<h2>Yarn Cost Calculator - Raw Material Investment per Project</h2>
<p>Whether crafting for pleasure or selling handmade goods, tracking your raw material investment is vital. Our <strong>Yarn Cost Calculator</strong> calculates total expenditure including partial skein usage, sales tax, and shipping allocations.</p>

<h3>Material Calculation Formula</h3>
<p>The total material investment formula accounts for precise weight and partial skeins:</p>
<blockquote style="background:#f1f5f9; border-left:4px solid #E96BA8; padding: 10px 16px; margin: 12px 0;">
  <strong>Cost per Yard</strong> = Skein Price ÷ Total Skein Yards<br/>
  <strong>Total Material Cost</strong> = (Yards Used × Cost per Yard) + Notions + Allocated Shipping & Tax
</blockquote>

<h3>Practical Example Calculation</h3>
<p>Suppose you make a baby blanket using 750 yards of worsted yarn purchased at $8.00 per 200-yard skein with $1.50 in faux suede tags:</p>
<ul>
  <li>Total skeins purchased: 4 skeins × $8.00 = $32.00</li>
  <li>Exact yarn consumed: 750 yds × ($8 / 200) = $30.00</li>
  <li>Tags & packaging: $1.50</li>
  <li><strong>Total Direct Material Investment:</strong> $31.50</li>
</ul>
<p>Feed this material figure into our <a href="/tools/selling-price-calculator" class="text-[#E96BA8] font-bold hover:underline">Selling Price Calculator</a> to establish wholesale and retail prices.</p>
`,

  'selling-price-calculator': `
<h2>Crochet & Craft Selling Price Calculator for Handmade Business</h2>
<p>Pricing your handmade crochet, knitting, and craft items fairly is critical for running a profitable craft business on Etsy, Shopify, craft fairs, or custom commissions. Use our <strong>handmade pricing calculator</strong> to factor in raw material yarn costs, hourly labor rate, overhead, and retail profit margin.</p>

<h3>Formula for Pricing Handmade Crafts</h3>
<p>Our calculator applies the standard craft industry pricing formula:</p>
<blockquote style="background:#f1f5f9; border-left:4px solid #E96BA8; padding: 10px 16px; margin: 12px 0;">
  <strong>Fair Wholesale Base</strong> = Material Cost + (Crafting Hours × Hourly Labor Rate) + Business Overhead<br/>
  <strong>Retail Price</strong> = Wholesale Base × 1.5 to 2.0 (Accounts for Etsy/Platform Fees & Profit)
</blockquote>

<h3>Handmade Craft Business Pricing Tips</h3>
<ul>
  <li><strong>Pay Yourself a Fair Wage:</strong> Charge at least minimum wage ($12 - $22/hr) for skilled handmade labor.</li>
  <li><strong>Include Platform & Transaction Fees:</strong> Etsy takes ~6.5% transaction fees + 3% payment processing + listing fees; include them in overhead.</li>
  <li><strong>Track Your Exact Stitching Hours:</strong> Use our integrated <a href="/tools/crochet-timer" class="text-[#E96BA8] font-bold hover:underline">Crochet Timer</a> to record exact time on projects.</li>
</ul>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: What if customers say my price is too high?</strong><br/>
A: Handmade crochet cannot be replicated by commercial machines; every stitch is hand-crafted. Position your work as an heirloom luxury rather than competing with mass-produced factory goods.</p>
`,

  'yarn-substitute-finder': `
<h2>Yarn Substitute Finder & Alternative Yarn Matcher</h2>
<p>When a pattern calls for a discontinued yarn, an expensive imported wool, or a fiber you are allergic to, finding an accurate substitute is essential. Our <strong>Yarn Substitute Finder</strong> matches yarn weight classes, fiber composition, and gauge requirements.</p>

<h3>Key Criteria for Yarn Substitution</h3>
<ol>
  <li><strong>Yarn Weight Category & WPI:</strong> Both original and substitute yarns must belong to the same CYC weight class (e.g., #4 Worsted).</li>
  <li><strong>Fiber Drape & Memory:</strong> Animal fibers (merino wool, alpaca) have natural bounce and stretch; plant fibers (cotton, linen, bamboo) are heavy and inelastic.</li>
  <li><strong>Meters-per-100g Ratio:</strong> Compare yardage density. If Yarn A has 200m per 100g and Yarn B has 200m per 100g, they have virtually identical strand thickness.</li>
  <li><strong>Gauge Swatch Verification:</strong> Always work a 4x4 inch swatch using our <a href="/tools/gauge-calculator" class="text-[#E96BA8] font-bold hover:underline">Gauge Swatch Calculator</a>.</li>
</ol>

<h3>Fiber Substitution Matrix</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Original Fiber</th>
      <th>Best Substitute Fiber</th>
      <th>Drape / Washing Differences</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>100% Wool / Animal Fiber</td>
      <td>Acrylic / Wool Blend or Premium Anti-Pill Acrylic</td>
      <td>Machine washable, hypoallergenic, slightly less elasticity.</td>
    </tr>
    <tr>
      <td>100% Cotton</td>
      <td>Bamboo / Cotton Blend or Linen Blend</td>
      <td>Silky soft sheen, breathable, excellent stitch definition.</td>
    </tr>
    <tr>
      <td>Chenille / Velvet Blanket Yarn</td>
      <td>Super Bulky Polyester Fleece Yarn</td>
      <td>Ultra plush, no shedding, great for amigurumi.</td>
    </tr>
  </tbody>
</table>
`,

  'pattern-difficulty-checker': `
<h2>Crochet Pattern Difficulty Level Checker & Skill Assessment</h2>
<p>Before purchasing yarn or starting a complex project, assess its skill difficulty level. Our <strong>Pattern Difficulty Checker</strong> evaluates pattern techniques against Craft Yarn Council standards to categorize designs as Beginner, Easy, Intermediate, or Advanced.</p>

<h3>The 4 Standard Skill Levels Explained</h3>
<ul>
  <li><strong>Beginner (Level 1):</strong> Uses basic stitches (chain, single crochet, double crochet), simple color changes, minimal shaping, and flat rectangular construction (scarves, washcloths, basic blankets).</li>
  <li><strong>Easy (Level 2):</strong> Simple stitch patterns, basic increases and decreases, simple color striping, and basic assembly (simple hats, baby booties, basic amigurumi).</li>
  <li><strong>Intermediate (Level 3):</strong> Textured stitches (cables, post stitches, popcorns), detailed colorwork (tapestry/fair isle), complex garment shaping, and intricate lace patterns.</li>
  <li><strong>Advanced (Level 4):</strong> Intricate lace charts, complex multi-directional construction, fine thread crochet, Tunisian lace, and advanced garment tailoring.</li>
</ul>

<h3>How to Level Up Your Crafting Skills</h3>
<p>If a pattern is rated Intermediate, master each prerequisite technique on small swatches first. Check our <a href="/tools/abbreviation-dictionary" class="text-[#E96BA8] font-bold hover:underline">Abbreviation Dictionary</a> to review unfamiliar stitch instructions.</p>
`,

  'pattern-pdf-organizer': `
<h2>Pattern PDF Organizer & Stash File Manager</h2>
<p>Keep your downloaded digital crochet and knitting pattern PDFs organized, searchable, and accessible across devices with our <strong>Pattern PDF Organizer</strong>.</p>

<h3>Benefits of Digital Pattern Organization</h3>
<ul>
  <li><strong>Instant Search:</strong> Find patterns by technique, hook size, yarn weight, or category in seconds.</li>
  <li><strong>Custom Tags:</strong> Tag designs with "Holiday Gifts", "Quick Weekend", or "Baby Blankets".</li>
  <li><strong>Offline Access:</strong> Access your saved pattern notes and references without an active internet connection.</li>
</ul>

<h3>Recommended Folder Structure</h3>
<ol>
  <li><strong>Blankets & Throws</strong> (Baby, Lapghan, Bedding)</li>
  <li><strong>Amigurumi & Plushies</strong> (Animals, Dolls, Mini Toys)</li>
  <li><strong>Wearables & Garments</strong> (Sweaters, Cardigans, Tops, Shawls)</li>
  <li><strong>Accessories & Home Decor</strong> (Bags, Baskets, Wall Hangings, Beanies)</li>
</ol>
`,

  'crochet-timer': `
<h2>Crochet Timer & Stitching Pace Stopwatch</h2>
<p>Track your crafting time, calculate your stitching pace (rows per hour), and set ergonomic break reminders with our <strong>Crochet Session Timer</strong>.</p>

<h3>Why Track Your Crafting Time?</h3>
<ul>
  <li><strong>Accurate Product Pricing:</strong> Multiply exact crafting hours by your hourly labor rate using our <a href="/tools/selling-price-calculator" class="text-[#E96BA8] font-bold hover:underline">Selling Price Calculator</a>.</li>
  <li><strong>Realistic Deadline Planning:</strong> Know exactly how many hours remain on blanket or holiday gift projects.</li>
  <li><strong>Ergonomic Hand Health:</strong> Taking regular 5-minute stretch breaks every 45 minutes prevents wrist strain, tendonitis, and fatigue.</li>
</ul>

<h3>Stitching Pace Reference Guidelines</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>Crafting Experience</th>
      <th>Average Stitches per Minute</th>
      <th>Average Rows per Hour (Worsted #4)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Beginner</td><td>15 - 25 stitches / min</td><td>6 - 10 rows / hr</td></tr>
    <tr><td>Intermediate</td><td>30 - 45 stitches / min</td><td>12 - 18 rows / hr</td></tr>
    <tr><td>Advanced / Production Crafter</td><td>50 - 75+ stitches / min</td><td>20 - 28 rows / hr</td></tr>
  </tbody>
</table>
`,

  'pattern-library': `
<h2>Pattern Library & Custom Collections Organizer</h2>
<p>Curate your dream crochet pattern library with custom collection boards. Save your favorite designs, categorize inspiration, and streamline your maker queue.</p>

<h3>Popular Collection Ideas</h3>
<ul>
  <li><strong>Quick Weekend Makes:</strong> One-skein beanies, mug cozies, and quick washcloths.</li>
  <li><strong>Heirloom Blankets:</strong> Complex continuous granny square throws and mosaic crochet afghans.</li>
  <li><strong>Craft Market Stock:</strong> High-margin keychains, plushies, and scrunchies.</li>
</ul>
`,

  'abbreviation-dictionary': `
<h2>Crochet Abbreviation Dictionary & US vs UK Terms Comparison</h2>
<p>Crochet terminology differs significantly between United States (US) and United Kingdom (UK / Australian) patterns. For example, a US single crochet (sc) is called a UK double crochet (dc). Master pattern reading with our <strong>comprehensive crochet abbreviation glossary</strong>.</p>

<h3>Master US vs UK Crochet Stitch Conversion Chart</h3>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>US Term & Abbreviation</th>
      <th>UK / Australian Equivalent</th>
      <th>Stitch Height & Step-by-Step Execution</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Slip Stitch (sl st)</strong></td>
      <td>Slip Stitch (sl st) / Single Crochet</td>
      <td>Shortest join stitch; insert hook, yarn over, pull through stitch and loop on hook.</td>
    </tr>
    <tr>
      <td><strong>Single Crochet (sc)</strong></td>
      <td>Double Crochet (dc)</td>
      <td>Short basic stitch; insert hook, yarn over, pull through 2 loops on hook.</td>
    </tr>
    <tr>
      <td><strong>Half Double Crochet (hdc)</strong></td>
      <td>Half Treble Crochet (htr)</td>
      <td>Medium height; yarn over, insert hook, yarn over, pull through all 3 loops on hook.</td>
    </tr>
    <tr>
      <td><strong>Double Crochet (dc)</strong></td>
      <td>Treble Crochet (tr)</td>
      <td>Standard tall stitch; yarn over, insert hook, [yarn over, pull through 2 loops] twice.</td>
    </tr>
    <tr>
      <td><strong>Treble / Triple Crochet (tr)</strong></td>
      <td>Double Treble Crochet (dtr)</td>
      <td>Very tall stitch; yarn over twice before inserting hook, [yarn over, pull through 2 loops] 3 times.</td>
    </tr>
    <tr>
      <td><strong>Double Treble Crochet (dtr)</strong></td>
      <td>Triple Treble Crochet (trtr)</td>
      <td>Ultra tall lace stitch; yarn over 3 times before inserting hook.</td>
    </tr>
    <tr>
      <td><strong>Fasten Off (FO)</strong></td>
      <td>Cast Off (CO) / Finish Off</td>
      <td>Cut yarn leaving 6-inch tail, pull loop through to lock stitch.</td>
    </tr>
  </tbody>
</table>

<h3>Common Pattern Reading Symbols & Notations</h3>
<ul>
  <li><strong>Asterisks (* ... *):</strong> Repeat instructions between asterisks the specified number of times.</li>
  <li><strong>Brackets [ ... ]:</strong> Work all stitches inside brackets into the same stitch or space.</li>
  <li><strong>Parentheses ( ... ):</strong> Used for stitch counts at the end of rows (e.g., "(36 sts)").</li>
  <li><strong>BLO / FLO:</strong> Back Loop Only / Front Loop Only for ribbed texture.</li>
  <li><strong>RS / WS:</strong> Right Side (front facing) / Wrong Side (back facing) of the fabric.</li>
</ul>

<h3>Frequently Asked Questions</h3>
<p><strong>Q: How do I know if a pattern uses US or UK terms?</strong><br/>
A: Look for the mention of "Single Crochet (sc)". If the pattern uses single crochet, it is written in <strong>US terminology</strong> (UK patterns do not use the term single crochet). You can also paste your pattern into our free <a href="/tools/us-uk-crochet-pattern-converter" class="text-[#E96BA8] font-bold hover:underline">US ↔ UK Crochet Pattern Converter</a> to automatically detect terms and convert your entire pattern.</p>
`,
  'us-uk-crochet-pattern-converter': `
<h2>US vs UK Crochet Terms</h2>
<p>One of the most common challenges for crocheters is distinguishing between American (US) and British (UK) terminology. Because both traditions use identical names—such as <em>double crochet</em> and <em>treble crochet</em>—for stitches of completely different heights, following a pattern in the wrong terminology will distort your finished project sizing and drape.</p>

<p>In US terminology, stitches are named after the number of <strong>yarn overs and loops drawn through</strong> to complete the stitch. In UK terminology, stitches are named after the <strong>number of loops sitting on the hook</strong> before working the final yarn over. For example, a US double crochet (dc) corresponds to a UK treble (tr).</p>

<h2>How to Convert a Crochet Pattern from US to UK Terms</h2>
<ol>
  <li><strong>Identify the Origin Terminology:</strong> Scan the pattern for "Single Crochet (sc)" or "Gauge". If present, the pattern is written in US terms. If you see "Half Treble (htr)" or "Tension", it is written in UK terms. You can also refer to our <a href="/tools/abbreviation-dictionary" class="text-[#E96BA8] font-bold hover:underline">Crochet Abbreviation Dictionary</a> for quick reference.</li>
  <li><strong>Paste Your Pattern into the Converter:</strong> Paste your pattern text directly into our free converter above.</li>
  <li><strong>Select Direction:</strong> Choose <strong>US → UK</strong> or <strong>UK → US</strong>.</li>
  <li><strong>Convert & Review:</strong> Click <strong>Convert Pattern</strong>. Review the conversion breakdown table to verify all converted stitch terms, and cross-check hook measurements with our <a href="/tools/hook-size-converter" class="text-[#E96BA8] font-bold hover:underline">Hook Size Converter</a> or <a href="/tools/needle-size-converter" class="text-[#E96BA8] font-bold hover:underline">Needle Size Converter</a>.</li>
</ol>

<h2>How the US to UK Crochet Converter Works</h2>
<p>Our converter uses a <strong>deterministic, token-aware replacement engine</strong> built entirely in client-side TypeScript. Unlike basic text replacement tools, it operates safely with the following guarantees:</p>
<ul>
  <li><strong>Compound Term Safety:</strong> Converts multi-stitch abbreviations like <code>sc2tog → dc2tog</code>, <code>FPdc → FPtr</code>, and <code>hdc3tog → htr3tog</code> without breaking stitch codes.</li>
  <li><strong>Collision-Free Execution:</strong> Prevents chained substitution errors (for example, converting <code>sc</code> to <code>dc</code> will never accidentally re-convert that new <code>dc</code> into <code>tr</code> in the same pass).</li>
  <li><strong>Preserves Pattern Structure:</strong> Retains all numbers, row labels, stitch counts in parentheses, asterisks, brackets, and line breaks exactly as formatted.</li>
  <li><strong>Contextual Term Translation:</strong> Translates <code>skip → miss</code> and <code>gauge → tension</code> when used in pattern contexts without modifying unrelated English words.</li>
</ul>

<h2>Common US and UK Crochet Abbreviations</h2>
<table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th>US Term (American)</th>
      <th>UK Term (British)</th>
      <th>Stitch Height</th>
      <th>Common Abbreviation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Single Crochet</strong></td>
      <td>Double Crochet</td>
      <td>Shortest basic stitch</td>
      <td><code>sc</code> ↔ <code>dc</code></td>
    </tr>
    <tr>
      <td><strong>Half Double Crochet</strong></td>
      <td>Half Treble Crochet</td>
      <td>Medium-short stitch</td>
      <td><code>hdc</code> ↔ <code>htr</code></td>
    </tr>
    <tr>
      <td><strong>Double Crochet</strong></td>
      <td>Treble Crochet</td>
      <td>Standard granny stitch</td>
      <td><code>dc</code> ↔ <code>tr</code></td>
    </tr>
    <tr>
      <td><strong>Treble / Triple Crochet</strong></td>
      <td>Double Treble Crochet</td>
      <td>Tall lace stitch</td>
      <td><code>tr</code> ↔ <code>dtr</code></td>
    </tr>
    <tr>
      <td><strong>Double Treble Crochet</strong></td>
      <td>Triple Treble Crochet</td>
      <td>Extra tall open stitch</td>
      <td><code>dtr</code> ↔ <code>trtr</code></td>
    </tr>
    <tr>
      <td><strong>Slip Stitch</strong></td>
      <td>Slip Stitch</td>
      <td>Flat joining stitch</td>
      <td><code>sl st</code> ↔ <code>ss</code></td>
    </tr>
  </tbody>
</table>

<h2>Frequently Asked Questions</h2>
<p><strong>Q: Does this converter change stitch counts or numbers?</strong><br/>
A: No. The converter preserves every number, row counter, bracket, and stitch count in parentheses (e.g. <code>(sc, inc) × 6 [18 sts]</code> safely becomes <code>(dc, inc) × 6 [18 sts]</code>).</p>

<p><strong>Q: Is this tool an AI translator?</strong><br/>
A: No. This tool is a deterministic terminology converter. It runs 100% locally in your browser with zero latency and no external API calls. Always review the converted pattern before beginning your project.</p>
`
};

const STORAGE_KEY = 'welovepattern_tool_seo_articles_v1';

/**
 * Checks if an article HTML string is the generic placeholder/fallback rather than a rich tool-specific guide.
 */
function isGenericOrStaleFallback(html: string): boolean {
  if (!html || typeof html !== 'string') return true;
  const lower = html.toLowerCase();
  if (lower.includes('about the craft tool') || lower.includes('welcome to the craft tool')) return true;
  if (
    lower.includes('why use this craft tool?') &&
    lower.includes('performs calculations in real time with zero latency') &&
    lower.includes('100% free & no sign-up required')
  ) {
    return true;
  }
  return false;
}

export const getToolSeoArticle = (slug: string): string => {
  if (!slug) {
    return `
<h2>About the Craft Tool Tool & User Guide</h2>
<p>Welcome to the <strong>Craft Tool</strong> on WeLovePattern. This free online utility is crafted specifically for yarn enthusiasts, crocheters, knitters, and handmade makers seeking accurate calculations, instant conversions, and offline utility.</p>
<h3>Why Use This Craft Tool?</h3>
<ul>
  <li><strong>Instant & Accurate:</strong> Performs calculations in real time with zero latency.</li>
  <li><strong>100% Free & No Sign-up Required:</strong> Access all features instantly on desktop, tablet, and mobile browsers.</li>
  <li><strong>Offline Ready:</strong> Works smoothly without active internet connections once loaded.</li>
</ul>
<h3>Tips & Best Practices</h3>
<p>Ensure your inputs match your yarn ball band measurements or swatch dimensions for best results. Bookmark this page or install our PWA app to access this tool anywhere on the go!</p>
`;
  }

  // Check localStorage for customized admin-published articles
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('crochethub_tool_seo_articles_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed[slug]) {
          const storedArticle = parsed[slug];
          // Only use stored article if it is NOT a stale generic fallback
          if (typeof storedArticle === 'string' && !isGenericOrStaleFallback(storedArticle)) {
            return storedArticle;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load SEO article from localStorage:', err);
  }

  // Return authoritative tool-specific default article for all 19 registered tools
  if (DEFAULT_TOOL_SEO_ARTICLES[slug]) {
    return DEFAULT_TOOL_SEO_ARTICLES[slug];
  }

  // Generic fallback article ONLY for genuinely unknown/unregistered tool slugs
  const formattedName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `
<h2>About the ${formattedName} Tool & User Guide</h2>
<p>Welcome to the <strong>${formattedName}</strong> on WeLovePattern. This free online utility is crafted specifically for yarn enthusiasts, crocheters, knitters, and handmade makers seeking accurate calculations, instant conversions, and offline utility.</p>

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

/**
 * Curated, intent-specific headers and user-centered subtitles for all 19 craft tools.
 * Focuses purely on maker utility, calculations, conversion accuracy, and project guidance.
 */
export const TOOL_SEO_HEADERS: Record<string, { heading: string; subtitle: string }> = {
  'row-counter': {
    heading: 'Crochet & Knitting Row Counter — Essential Guide & Repeat Tracking',
    subtitle: 'Step-by-step instructions, audio feedback tips, multi-section tracking methods, and row estimation tables.'
  },
  'stitch-counter': {
    heading: 'Multi-Section Stitch Counter — Complex Repeats & Pattern Multiple Guide',
    subtitle: 'Manage raglan shaping, amigurumi round counts, and lace repeats across independent crafting sections.'
  },
  'project-tracker': {
    heading: 'Crochet Project Tracker & WIP Organizer — Guide to Managing Works in Progress',
    subtitle: 'Organize yarn stash details, hook sizes, dye lots, starting dates, and project milestones in one dashboard.'
  },
  'gauge-calculator': {
    heading: 'Crochet Gauge Swatch Calculator — Swatch Sizing & Hook Adjustment Guide',
    subtitle: 'Compare swatch measurements against pattern gauge to calculate exact stitch adjustments for garments and accessories.'
  },
  'yarn-calculator': {
    heading: 'Crochet Yarn Calculator — Estimate Total Yardage, Meters & Skeins',
    subtitle: 'Calculate exact yarn requirements for blankets, sweaters, amigurumi, and accessories by dimensions and stitch density.'
  },
  'yarn-weight-converter': {
    heading: 'Standard Yarn Weight Converter — CYC 0-7 Standards, WPI & Ply Guide',
    subtitle: 'Master Craft Yarn Council classifications, Wraps Per Inch (WPI) testing, and international ply conversions.'
  },
  'hook-size-converter': {
    heading: 'Crochet Hook Size Conversion Chart — Metric mm, US Letter & UK Sizes',
    subtitle: 'Navigate vintage patterns and international charts with precise millimeter to letter and steel number conversions.'
  },
  'needle-size-converter': {
    heading: 'Knitting Needle Size Conversion Chart — Metric mm, US & UK Measurements',
    subtitle: 'Cross-reference metric millimeter diameters with US numbers, UK wire gauge sizes, and recommended yarn weights.'
  },
  'granny-square-calculator': {
    heading: 'Granny Square Blanket Calculator — Layout Grid & Yardage Estimator',
    subtitle: 'Determine exact square quantities, column-by-row layout dimensions, and joining border yardage requirements.'
  },
  'blanket-calculator': {
    heading: 'Crochet Blanket Size Calculator — Starting Chains, Rows & Bed Dimensions',
    subtitle: 'Calculate starting chains, row counts, and yarn estimates for baby blankets, lapghans, throws, and king beds.'
  },
  'border-calculator': {
    heading: 'Crochet Blanket Border Calculator — Edge Stitch Pick-Ups & Corner Math',
    subtitle: 'Calculate side edge pick-up ratios and corner stitch allocations for perfectly flat, wave-free blanket edgings.'
  },
  'yarn-cost-calculator': {
    heading: 'Yarn Cost Calculator — Direct Material Investment per Craft Project',
    subtitle: 'Calculate total project material expense factoring in partial skein usage, notions, sales tax, and shipping.'
  },
  'selling-price-calculator': {
    heading: 'Handmade Craft Selling Price Calculator — Pricing Guide for Makers & Sellers',
    subtitle: 'Establish profitable retail and wholesale pricing factoring in hourly labor, material investment, and platform fees.'
  },
  'yarn-substitute-finder': {
    heading: 'Yarn Substitute Finder — Matching Fiber Drape, Weight Class & Gauge',
    subtitle: 'Discover compatible alternative yarns with matching fiber memory, meters-per-gram density, and tension swatches.'
  },
  'pattern-difficulty-checker': {
    heading: 'Crochet Pattern Skill Assessment — Determining Difficulty & Techniques',
    subtitle: 'Evaluate pattern complexity across standard CYC skill tiers from beginner basics to advanced multi-directional lace.'
  },
  'pattern-pdf-organizer': {
    heading: 'Pattern PDF Organizer — Digital Stash Management & Library Guide',
    subtitle: 'Organize, tag, search, and access your collection of downloaded PDF patterns and crafting notes across devices.'
  },
  'crochet-timer': {
    heading: 'Crochet Session Timer & Pace Stopwatch — Crafting Speed & Ergonomic Breaks',
    subtitle: 'Track active stitching hours, calculate rows per hour, and set ergonomic stretch reminders for healthy crafting.'
  },
  'pattern-library': {
    heading: 'Pattern Library & Collections Organizer — Curating Your Maker Queue',
    subtitle: 'Create themed boards and project queues to organize patterns, gift ideas, and future crafting inspiration.'
  },
  'abbreviation-dictionary': {
    heading: 'Crochet Abbreviation Dictionary — Comprehensive US vs UK Stitch Glossary',
    subtitle: 'Translate US and UK pattern terminology, stitch chart symbols, and common shorthand abbreviations with clarity.'
  },
  'us-uk-crochet-pattern-converter': {
    heading: 'US ↔ UK Crochet Pattern Converter — Instant Terminology Translation',
    subtitle: 'Convert pattern repeats, stitch counts, and decreases between American and British terminology with zero formatting loss.'
  }
};

/**
 * Retrieves the intent-specific heading and subtitle for a tool.
 */
export const getToolSeoHeader = (slug: string, fallbackTitle?: string): { heading: string; subtitle: string } => {
  if (slug && TOOL_SEO_HEADERS[slug]) {
    return TOOL_SEO_HEADERS[slug];
  }
  const formattedTitle = fallbackTitle || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Craft Tool');
  return {
    heading: `${formattedTitle} — User Guide & Reference`,
    subtitle: 'Complete instructions, calculation formulas, reference tables, and stitching tips.'
  };
};
