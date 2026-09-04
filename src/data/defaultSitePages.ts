import { SitePage } from '../types';

export const DEFAULT_SITE_PAGES: SitePage[] = [
  {
    id: 'privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy | WeLovePattern',
    seoDescription: 'Read the official WeLovePattern Privacy Policy. Learn about our strict data protection, local storage usage, and maker privacy commitments.',
    canonicalUrl: 'https://welovepattern.com/privacy-policy',
    isNoIndex: false,
    updatedAt: new Date().toISOString(),
    content: `
<h1>Privacy Policy</h1>
<p><strong>Effective Date:</strong> January 1, 2026<br /><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

<p>Welcome to <strong>WeLovePattern</strong> (<a href="https://welovepattern.com">welovepattern.com</a>). Your privacy is essential to us. We are committed to transparency and providing a safe, enjoyable, and 100% free resource for crochet makers and fiber artists worldwide.</p>

<hr />

<h2>1. Information We Do Not Collect</h2>
<p>WeLovePattern is built on an open-access philosophy. You can browse, read, download PDF patterns, and use all 19+ interactive craft calculators without creating an account or providing financial information.</p>
<ul>
  <li>We <strong>do not</strong> sell, rent, or trade your personal data.</li>
  <li>We <strong>do not</strong> require mandatory account registration or paywalls.</li>
  <li>We <strong>do not</strong> collect sensitive financial details or credit card information.</li>
</ul>

<h2>2. Information You Voluntarily Provide</h2>
<p>We only collect personal information when you intentionally provide it to us:</p>
<ul>
  <li><strong>Email Newsletter:</strong> If you subscribe to our free weekly pattern digest, we store your email address solely to deliver crochet tutorials, stitch charts, and pattern updates. You can unsubscribe at any time via the one-click unsubscribe link in any email.</li>
  <li><strong>Pattern Reviews & Comments:</strong> When you leave a review or craft comment on a pattern, your chosen maker nickname and feedback are stored publicly to help other crafters.</li>
  <li><strong>Contact Inquiries:</strong> If you reach out to our team via email or contact forms, we use your message only to assist and answer your questions.</li>
</ul>

<h2>3. Local Storage & Offline Usage</h2>
<p>To respect your privacy and enable offline usage, certain interactive features store your data locally on your device using browser <code>localStorage</code>:</p>
<ul>
  <li><strong>Pattern Favorites:</strong> Your bookmarked patterns list is saved in your browser storage.</li>
  <li><strong>Row Counter & Project Tracker:</strong> Row counts, project progress, and active stitch notes are saved locally on your device and are never sent to external servers.</li>
  <li><strong>Calculator Preferences:</strong> Custom unit selections (US vs. Metric) and gauge calculations are cached locally for your convenience.</li>
</ul>

<h2>4. Analytics & Cookies</h2>
<p>We may use privacy-respecting, aggregated analytics tools to understand site traffic trends, popular stitch guides, and device responsiveness. These tools collect non-identifiable technical data such as browser type, operating system, and general geographic region.</p>
<blockquote>
  <p>You can configure your browser to reject cookies or clear local storage at any time without losing access to our free pattern library.</p>
</blockquote>

<h2>5. Third-Party Links & Content</h2>
<p>Our website may include links to external craft resources, yarn manufacturers, YouTube tutorial videos, or designer portfolios. We are not responsible for the privacy practices or content of external third-party websites.</p>

<h2>6. Data Security</h2>
<p>We enforce modern security best practices, including encrypted HTTPS/TLS transmission, Content Security Policies (CSP), strict cross-site scripting (XSS) prevention, and secure server headers to safeguard your browsing experience.</p>

<h2>7. Contact Us</h2>
<p>If you have any questions or privacy concerns regarding this Privacy Policy, please contact our support team at <a href="mailto:support@welovepattern.com">support@welovepattern.com</a>.</p>
`
  },
  {
    id: 'terms-of-service',
    slug: 'terms-of-service',
    title: 'Terms of Service',
    seoTitle: 'Terms of Service | WeLovePattern',
    seoDescription: 'Review the Terms of Service for WeLovePattern. Understand permissions for free pattern usage, handmade item sales, and site guidelines.',
    canonicalUrl: 'https://welovepattern.com/terms-of-service',
    isNoIndex: false,
    updatedAt: new Date().toISOString(),
    content: `
<h1>Terms of Service</h1>
<p><strong>Effective Date:</strong> January 1, 2026<br /><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

<p>Welcome to <strong>WeLovePattern</strong>. By accessing or using our website, free crochet pattern downloads, calculators, and instructional articles, you agree to comply with and be bound by the following Terms of Service.</p>

<hr />

<h2>1. 100% Free Access & Purpose</h2>
<p>WeLovePattern is dedicated to providing high-quality, accessible crochet patterns, stitch tutorials, and craft calculators for makers of all skill levels. All patterns published on our platform are provided 100% free of charge for personal, educational, and creative purposes.</p>

<h2>2. Intellectual Property & Pattern Usage</h2>
<p>All text, charts, diagrams, photography, and instructional content on WeLovePattern are protected by copyright and intellectual property laws.</p>
<ul>
  <li><strong>Personal Use:</strong> You are free to print, download PDF copies, and use any pattern for your personal crafting projects and gifts.</li>
  <li><strong>Selling Finished Handmade Items:</strong> You are permitted and encouraged to sell physical handmade items created using our patterns at local craft fairs, charity events, and handmade shops. We kindly request that you credit <em>WeLovePattern (welovepattern.com)</em> as the pattern source where practical.</li>
  <li><strong>No Pattern Redistribution:</strong> You may not copy, reformat, sell, resell, or distribute the written pattern instructions or digital PDFs as your own work. You may link directly to the pattern URL on our website.</li>
</ul>

<h2>3. Interactive Craft Tools & Calculators</h2>
<p>Our interactive craft tools (including the Yarn Weight Calculator, Gauge Converter, Selling Price Estimator, and Offline Row Counter) are provided as helpful estimation guides:</p>
<blockquote>
  <p>Because yarn tension, hook brands, fiber content, and individual maker gauge vary naturally, we always recommend crocheting a gauge swatch before beginning major garment or blanket projects.</p>
</blockquote>

<h2>4. User Submissions & Community Reviews</h2>
<p>When you submit reviews, photos of finished projects, or comments, you agree not to submit offensive, defamatory, malicious, or copyright-infringing material. WeLovePattern reserves the right to moderate, edit, or remove inappropriate submissions.</p>

<h2>5. Disclaimer of Warranties</h2>
<p>WeLovePattern is provided on an "as is" and "as available" basis. While we strive for absolute accuracy in all row counts, stitch abbreviations, and yardage estimates, we make no express or implied warranties regarding uninterrupted service or error-free calculations.</p>

<h2>6. Limitation of Liability</h2>
<p>In no event shall WeLovePattern, its creators, or contributors be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the site or materials.</p>

<h2>7. Changes to Terms</h2>
<p>We may periodically update these Terms of Service to reflect new features or legal requirements. Continued use of the website following any modifications constitutes your acceptance of the updated terms.</p>

<h2>8. Contact Information</h2>
<p>For questions concerning our Terms of Service or commercial permissions, please reach out to <a href="mailto:hello@welovepattern.com">hello@welovepattern.com</a>.</p>
`
  },
  {
    id: 'sitemap',
    slug: 'sitemap',
    title: 'Sitemap & Schema Directory',
    seoTitle: 'Sitemap & Schema Architecture Directory | WeLovePattern',
    seoDescription: 'Explore the complete sitemap, category collections, craft tools, and structured JSON-LD schema architecture of WeLovePattern.',
    canonicalUrl: 'https://welovepattern.com/sitemap',
    isNoIndex: false,
    updatedAt: new Date().toISOString(),
    content: `
<h1>Sitemap & Schema Architecture Directory</h1>
<p>Welcome to the structured overview of <strong>WeLovePattern</strong>. This visual directory outlines our core pattern collections, craft calculators, instructional guides, and search-engine-optimized schema markup.</p>

<hr />

<h2>1. XML Sitemap for Search Engines</h2>
<p>Looking for the machine-readable XML sitemap index for search crawlers (Google, Bing, Pinterest)? Access the real XML endpoint directly:</p>
<p>👉 <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"><strong>View Live /sitemap.xml Feed</strong></a></p>

<h2>2. Pattern Categories Directory</h2>
<p>Browse our organized pattern collections across all yarn weights and skill levels:</p>
<ul>
  <li><a href="/category/blankets"><strong>Blankets & Afghans:</strong></a> Cozy throws, baby blankets, ripple stitches, and heirloom afghans.</li>
  <li><a href="/category/amigurumi"><strong>Amigurumi & Plushies:</strong></a> Stuffed animals, miniature figures, and cute crocheted dolls.</li>
  <li><a href="/category/flowers"><strong>Flowers & Appliques:</strong></a> Everlasting roses, sunflowers, daisies, and botanical motifs.</li>
  <li><a href="/category/bags"><strong>Bags & Market Totes:</strong></a> Sturdy tote bags, boho clutches, and crossbody purses.</li>
  <li><a href="/category/baby"><strong>Baby Items & Booties:</strong></a> Soft baby sweaters, bibs, blankets, and newborn booties.</li>
  <li><a href="/category/granny-squares"><strong>Granny Squares & Motifs:</strong></a> Classic sunbursts, 3-dc clusters, and join-as-you-go blocks.</li>
  <li><a href="/category/accessories"><strong>Accessories & Wearables:</strong></a> Scarves, beanies, mittens, cowls, and headbands.</li>
  <li><a href="/category/home-decor"><strong>Home Decor:</strong></a> Pillows, plant hangers, coasters, and table runners.</li>
  <li><a href="/category/christmas"><strong>Holiday & Christmas:</strong></a> Festive tree ornaments, stockings, and garlands.</li>
</ul>

<h2>3. Interactive Craft Tools & Calculators</h2>
<p>Free utilities engineered to assist fiber artists during every project stage:</p>
<ul>
  <li><a href="/tools/row-counter"><strong>Offline Row Counter:</strong></a> Multi-project tracker with voice and tap controls.</li>
  <li><a href="/tools/yarn-calculator"><strong>Yarn Yardage Estimator:</strong></a> Calculate total meters and skeins required.</li>
  <li><a href="/tools/gauge-calculator"><strong>Gauge Swatch Calculator:</strong></a> Resize patterns accurately to your stitch gauge.</li>
  <li><a href="/tools/hook-size-converter"><strong>Hook Size Converter:</strong></a> Metric (mm), US letter, and UK number conversions.</li>
  <li><a href="/tools/selling-price-calculator"><strong>Selling Price Calculator:</strong></a> Fair pricing for handmade craft artisans.</li>
  <li><a href="/tools/abbreviation-dictionary"><strong>Stitch Dictionary:</strong></a> Complete US vs. UK crochet term definitions.</li>
</ul>

<h2>4. Structured Schema Markup (JSON-LD)</h2>
<p>WeLovePattern implements semantic Schema.org microdata across every page to facilitate clear search indexing and rich snippets:</p>
<ul>
  <li><code>schema.org/HowTo</code> on all pattern pages with materials, tools, steps, and supply lists.</li>
  <li><code>schema.org/BlogPosting</code> on all stitch tutorials and educational articles.</li>
  <li><code>schema.org/BreadcrumbList</code> providing navigational hierarchy for users and crawlers.</li>
  <li><code>schema.org/WebSite</code> and <code>schema.org/Organization</code> for authoritative brand identity.</li>
</ul>

<h2>5. Legal & Company Information</h2>
<ul>
  <li><a href="/privacy-policy">Privacy Policy</a></li>
  <li><a href="/terms-of-service">Terms of Service</a></li>
  <li><a href="/blog">Crochet Guides & Tutorials Blog</a></li>
</ul>
`
  }
];
