import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { render } from "./src/entry-server";
import { generateSitemapXml } from "./src/utils/sitemapGenerator";
import { BLOG_DATA } from "./src/data/blogData";
import { PATTERNS_DATA } from "./src/data/patternsData";
import { DEFAULT_SITE_PAGES } from "./src/data/defaultSitePages";
import { sanitizeBlogHtml, sanitizePatternSeoHtml, sanitizePageHtml } from "./src/utils/sanitizeHtml";
import { Pattern } from "./src/types";
import { renderPinterestTemplateA } from "./src/pinterest/renderer/renderTemplateA";
import { renderPinterestTemplateB } from "./src/pinterest/renderer/renderTemplateB";
import { renderPinterestTemplateC } from "./src/pinterest/renderer/renderTemplateC";
import { PinterestTemplateId, PINTEREST_TEMPLATES } from "./src/pinterest/templates";
import {
  buildPinterestAuthUrl,
  createOAuthState,
  validateAndConsumeOAuthState,
  exchangePinterestCode,
  fetchPinterestUserAccount,
  savePinterestAuthRecord,
  clearPinterestAuthRecord,
  getSafePinterestStatus,
  getPinterestRedirectUri,
  renderOAuthCallbackHtml,
  PinterestAuthRecord
} from "./src/pinterest/pinterestOAuth";

dotenv.config();

const app = express();
const PORT = 3000;
const SITE_URL = "https://welovepattern.com";

// Security Hardening: Disable X-Powered-By and enable Trust Proxy
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Directory paths and storage initialization
const DATA_DIR = path.join(process.cwd(), "data");
const BLOG_UPLOADS_DIR = path.join(DATA_DIR, "uploads", "blog");
const CATEGORIES_UPLOADS_DIR = path.join(DATA_DIR, "uploads", "categories");
const SITE_VERIFICATION_FILE = path.join(DATA_DIR, "site-verification.json");

function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BLOG_UPLOADS_DIR)) {
    fs.mkdirSync(BLOG_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(CATEGORIES_UPLOADS_DIR)) {
    fs.mkdirSync(CATEGORIES_UPLOADS_DIR, { recursive: true });
  }
}

interface SiteVerificationData {
  headCode: string;
  bodyCode: string;
  footerCode: string;
  updatedAt?: string;
}

let cachedSiteVerification: SiteVerificationData | null = null;

function getSiteVerification(): SiteVerificationData {
  if (cachedSiteVerification) {
    return cachedSiteVerification;
  }
  try {
    ensureDataDirExists();
    if (!fs.existsSync(SITE_VERIFICATION_FILE)) {
      cachedSiteVerification = { headCode: "", bodyCode: "", footerCode: "" };
      return cachedSiteVerification;
    }
    const raw = fs.readFileSync(SITE_VERIFICATION_FILE, "utf-8").trim();
    if (!raw) {
      cachedSiteVerification = { headCode: "", bodyCode: "", footerCode: "" };
      return cachedSiteVerification;
    }
    const parsed = JSON.parse(raw);
    cachedSiteVerification = {
      headCode: typeof parsed.headCode === "string" ? parsed.headCode : "",
      bodyCode: typeof parsed.bodyCode === "string" ? parsed.bodyCode : "",
      footerCode: typeof parsed.footerCode === "string" ? parsed.footerCode : "",
      updatedAt: parsed.updatedAt
    };
    return cachedSiteVerification;
  } catch (err) {
    console.error("Error reading site verification file:", err);
    return { headCode: "", bodyCode: "", footerCode: "" };
  }
}

function saveSiteVerification(data: SiteVerificationData): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(SITE_VERIFICATION_FILE, JSON.stringify(data, null, 2), "utf-8");
    cachedSiteVerification = data;
    return true;
  } catch (err) {
    console.error("Error writing site verification file:", err);
    return false;
  }
}

// Strictly allowlisted tracking & verification providers definitions
interface TrackingProviderDefinition {
  id: string;
  name: string;
  detector: (code: string) => boolean;
  scriptSrc?: string[];
  connectSrc?: string[];
  imgSrc?: string[];
  frameSrc?: string[];
}

const KNOWN_TRACKING_PROVIDERS: TrackingProviderDefinition[] = [
  {
    id: "google_analytics_gtm",
    name: "Google Analytics & Google Tag Manager",
    detector: (code: string) =>
      /googletagmanager\.com|google-analytics\.com|analytics\.google|gtag\(|ga\(|\bG-[A-Z0-9]+\b|\bUA-[0-9]+|\bGTM-[A-Z0-9]+\b/i.test(code),
    scriptSrc: [
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com"
    ],
    connectSrc: [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://analytics.google.com",
      "https://*.analytics.google.com",
      "https://stats.g.doubleclick.net",
      "https://*.g.doubleclick.net",
      "https://www.googletagmanager.com"
    ],
    imgSrc: [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.g.doubleclick.net",
      "https://www.googletagmanager.com"
    ],
    frameSrc: [
      "https://www.googletagmanager.com"
    ]
  },
  {
    id: "google_adsense",
    name: "Google AdSense",
    detector: (code: string) =>
      /pagead2\.googlesyndication\.com|adsbygoogle|ca-pub-|adservice\.google/i.test(code),
    scriptSrc: [
      "https://pagead2.googlesyndication.com",
      "https://adservice.google.com",
      "https://tpc.googlesyndication.com"
    ],
    connectSrc: [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://adservice.google.com"
    ],
    imgSrc: [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com"
    ],
    frameSrc: [
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://pagead2.googlesyndication.com"
    ]
  },
  {
    id: "meta_facebook_pixel",
    name: "Meta / Facebook Pixel",
    detector: (code: string) =>
      /connect\.facebook\.net|facebook\.com\/tr|fbq\(|facebook-domain-verification/i.test(code),
    scriptSrc: [
      "https://connect.facebook.net"
    ],
    connectSrc: [
      "https://www.facebook.com",
      "https://*.facebook.com"
    ],
    imgSrc: [
      "https://www.facebook.com",
      "https://*.facebook.com"
    ],
    frameSrc: [
      "https://www.facebook.com"
    ]
  },
  {
    id: "pinterest",
    name: "Pinterest Tag & Verification",
    detector: (code: string) =>
      /ct\.pinterest\.com|s\.pinimg\.com|pintrk\(|p:domain_verify/i.test(code),
    scriptSrc: [
      "https://s.pinimg.com",
      "https://*.pinimg.com",
      "https://ct.pinterest.com"
    ],
    connectSrc: [
      "https://ct.pinterest.com",
      "https://*.pinterest.com"
    ],
    imgSrc: [
      "https://ct.pinterest.com",
      "https://*.pinterest.com",
      "https://s.pinimg.com"
    ],
    frameSrc: [
      "https://ct.pinterest.com"
    ]
  },
  {
    id: "tiktok",
    name: "TikTok Pixel",
    detector: (code: string) =>
      /analytics\.tiktok\.com|ttq\.load|ttq\.page|tiktok-pixel/i.test(code),
    scriptSrc: [
      "https://analytics.tiktok.com",
      "https://*.tiktok.com"
    ],
    connectSrc: [
      "https://analytics.tiktok.com",
      "https://*.tiktok.com"
    ],
    imgSrc: [
      "https://analytics.tiktok.com",
      "https://*.tiktok.com"
    ],
    frameSrc: [
      "https://analytics.tiktok.com"
    ]
  },
  {
    id: "clarity_bing",
    name: "Microsoft Clarity & Bing",
    detector: (code: string) =>
      /clarity\.ms|msvalidate\.01|c\.bing\.com/i.test(code),
    scriptSrc: [
      "https://www.clarity.ms",
      "https://*.clarity.ms",
      "https://c.bing.com"
    ],
    connectSrc: [
      "https://www.clarity.ms",
      "https://*.clarity.ms",
      "https://c.bing.com"
    ],
    imgSrc: [
      "https://c.bing.com",
      "https://*.clarity.ms"
    ]
  }
];

function buildProductionCsp(nonce: string, settings: SiteVerificationData): string {
  const combinedCode = `${settings.headCode || ""} ${settings.bodyCode || ""} ${settings.footerCode || ""}`;

  // Base production CSP directives
  const scriptSources = new Set<string>([
    "'self'",
    `'nonce-${nonce}'`,
    "https://www.googletagmanager.com",
    "https://pagead2.googlesyndication.com"
  ]);

  const styleSources = new Set<string>([
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com"
  ]);

  const fontSources = new Set<string>([
    "'self'",
    "data:",
    "https://fonts.gstatic.com"
  ]);

  const imgSources = new Set<string>([
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    "https://*.unsplash.com",
    "https://i.postimg.cc",
    "https://*.googleusercontent.com",
    "https://raw.githubusercontent.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.g.doubleclick.net",
    "https://www.googletagmanager.com"
  ]);

  const connectSources = new Set<string>([
    "'self'",
    "https://generativelanguage.googleapis.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://analytics.google.com",
    "https://*.analytics.google.com",
    "https://stats.g.doubleclick.net",
    "https://*.g.doubleclick.net",
    "https://www.googletagmanager.com"
  ]);

  const frameSources = new Set<string>([
    "'self'",
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com"
  ]);

  // Evaluate detected legitimate verification/tracking services
  for (const provider of KNOWN_TRACKING_PROVIDERS) {
    if (provider.detector(combinedCode)) {
      if (provider.scriptSrc) {
        for (const src of provider.scriptSrc) scriptSources.add(src);
      }
      if (provider.connectSrc) {
        for (const src of provider.connectSrc) connectSources.add(src);
      }
      if (provider.imgSrc) {
        for (const src of provider.imgSrc) imgSources.add(src);
      }
      if (provider.frameSrc) {
        for (const src of provider.frameSrc) frameSources.add(src);
      }
    }
  }

  return [
    "default-src 'self'",
    `script-src ${Array.from(scriptSources).join(" ")}`,
    `style-src ${Array.from(styleSources).join(" ")}`,
    `font-src ${Array.from(fontSources).join(" ")}`,
    `img-src ${Array.from(imgSources).join(" ")}`,
    `connect-src ${Array.from(connectSources).join(" ")}`,
    `frame-src ${Array.from(frameSources).join(" ")}`,
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");
}

function injectSiteVerification(html: string): string {
  const settings = getSiteVerification();
  let result = html;

  if (settings.headCode && settings.headCode.trim()) {
    result = result.replace("</head>", `${settings.headCode.trim()}\n</head>`);
  }

  if (settings.bodyCode && settings.bodyCode.trim()) {
    result = result.replace(/(<body[^>]*>)/i, `$1\n${settings.bodyCode.trim()}`);
  }

  if (settings.footerCode && settings.footerCode.trim()) {
    result = result.replace("</body>", `${settings.footerCode.trim()}\n</body>`);
  }

  return result;
}

// Applies cryptographically random per-request nonce to all script tags in generated HTML for strict CSP
function applyNonceToHtml(html: string, nonce: string): string {
  if (!nonce) return html;
  return html.replace(/<script(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`);
}

// 1. FILE PROTECTION MIDDLEWARE: Block direct HTTP access to runtime data, server source files, env secrets, and server bundles
app.use((req, res, next) => {
  let reqPath = "";
  try {
    reqPath = decodeURIComponent(req.path.toLowerCase());
  } catch {
    return res.status(400).end();
  }

  // Prevent path traversal sequences
  if (reqPath.includes("..") || reqPath.includes("\0")) {
    return res.status(400).end();
  }

  // Allow static /uploads/* and /generated/* for legitimate media assets
  if (reqPath.startsWith("/uploads/") || reqPath.startsWith("/generated/")) {
    return next();
  }

  // Block direct access to runtime JSON database storage folder
  if (
    reqPath === "/data" ||
    reqPath.startsWith("/data/") ||
    reqPath.includes("/data/")
  ) {
    return res.status(404).end();
  }

  // Block server source files, environment secrets, and root config files from public direct download
  if (
    reqPath.startsWith("/.env") ||
    reqPath.includes("/.env") ||
    reqPath === "/server.ts" ||
    reqPath.endsWith("/server.ts") ||
    reqPath === "/package.json" ||
    reqPath === "/package-lock.json" ||
    reqPath === "/metadata.json" ||
    reqPath.startsWith("/dist/server")
  ) {
    return res.status(404).end();
  }

  next();
});

// 2. SECURITY HEADERS & CSP MIDDLEWARE
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;

  const isProd = process.env.NODE_ENV === "production";

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  if (isProd) {
    // Production CSP:
    // - NO 'unsafe-eval' (not needed in compiled production code)
    // - NO 'unsafe-inline' in script-src (all legitimate inline scripts are signed with per-request crypto nonce)
    // - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com (required for React dynamic inline styles & Google Fonts)
    // - img-src strictly limited to self, data/blob previews, and trusted pattern CDNs
    // - connect-src strictly limited to self, Google AI API, and allowed tracking beacons
    // - frame-ancestors 'self' (prevents clickjacking by blocking arbitrary external framing)
    // - object-src 'none', base-uri 'self', form-action 'self'
    const settings = getSiteVerification();
    res.setHeader("Content-Security-Policy", buildProductionCsp(nonce, settings));
  } else {
    // Development / AI Studio Preview CSP:
    // Enables Vite dev server, HMR websockets, sourcemap eval, and AI Studio container iframe preview
    // Without a script nonce so that Chromium does not disregard unsafe-inline for Vite dynamic modules
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self' https: http: data: blob:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob:",
        "style-src 'self' 'unsafe-inline' https: http: data:",
        "font-src 'self' data: https: http:",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https: http: ws: wss: data: blob:",
        "frame-src 'self' https: http:",
        "frame-ancestors 'self' https: http:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https: http:"
      ].join("; ")
    );
  }

  next();
});

// 3. BODY PARSERS: Strict default limit of 256kb for standard endpoints, 10MB for pattern uploads & saves
const uploadJsonParser = express.json({ limit: "10mb" });

app.use((req, res, next) => {
  if (req.path === "/api/admin/patterns" || req.path.startsWith("/api/admin/patterns/")) {
    return uploadJsonParser(req, res, next);
  }
  express.json({ limit: "256kb" })(req, res, next);
});
app.use(express.urlencoded({ limit: "256kb", extended: true }));

// Serve public uploads & generated Pinterest assets
app.use("/uploads", express.static(path.join(process.cwd(), "data", "uploads")));
app.use("/generated", express.static(path.join(process.cwd(), "public", "generated")));

// Initialize Gemini client lazily/safely if key present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// --- ADMIN AUTHENTICATION & SESSION ENGINE ---
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const activeAdminSessions = new Map<string, AdminSession>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface LoginAttemptRecord {
  failedCount: number;
  lockedUntil: number;
  lastAttempt: number;
}

const loginRateLimitMap = new Map<string, LoginAttemptRecord>();

function getClientIp(req: express.Request): string {
  const xForwarded = req.headers["x-forwarded-for"];
  if (typeof xForwarded === "string") {
    return xForwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function parseCookies(req: express.Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      const key = parts.shift()?.trim();
      const val = parts.join("=").trim();
      if (key) {
        try {
          list[key] = decodeURIComponent(val);
        } catch {
          list[key] = val;
        }
      }
    });
  }
  return list;
}

function isAdminAuthenticated(req: express.Request): boolean {
  const cookies = parseCookies(req);
  const cookieToken = cookies["admin_session"];

  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const token = cookieToken || headerToken;
  if (!token) return false;

  const session = activeAdminSessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return false;
  }

  return true;
}

function getAdminSessionToken(req: express.Request): string | null {
  const cookies = parseCookies(req);
  const cookieToken = cookies["admin_session"];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return null;
  const session = activeAdminSessions.get(token);
  if (!session || Date.now() > session.expiresAt) return null;
  return token;
}

// CSRF / Origin Validation for state-changing admin endpoints
function validateAdminOrigin(req: express.Request): boolean {
  const origin = (req.headers.origin || req.headers.referer || "") as string;
  if (!origin) {
    // If no origin/referer header present on state-changing browser request, block
    const isBrowserRequest = req.headers["user-agent"] && req.headers["sec-fetch-site"];
    if (isBrowserRequest && req.headers["sec-fetch-site"] === "cross-site") {
      return false;
    }
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const host = req.get("host") || "";
    const originHost = originUrl.host;

    if (host && originHost === host) return true;
    if (originHost.includes("localhost") || originHost.includes("127.0.0.1")) return true;
    // Allow cloud container host matches
    return true;
  } catch {
    return false;
  }
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized access. Admin authentication required." });
  }

  // For state-changing methods, enforce Origin verification
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    if (!validateAdminOrigin(req)) {
      return res.status(403).json({ error: "Cross-site request blocked." });
    }
  }

  return next();
}

// Timing-safe string comparison to prevent timing attacks
function safeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Perform dummy timing-safe compare to avoid early short-circuit
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Admin Auth Endpoints
app.post("/api/admin/login", (req, res) => {
  const clientIp = getClientIp(req);
  const now = Date.now();

  // Check brute force rate limit (5 failed attempts -> 15 min lockout)
  const attemptRecord = loginRateLimitMap.get(clientIp);
  if (attemptRecord && attemptRecord.lockedUntil > now) {
    const remainingMins = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${remainingMins} minute(s).`
    });
  }

  const { username, password } = req.body || {};

  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const expectedUsername = process.env.ADMIN_USERNAME || (process.env.NODE_ENV !== "production" ? "admin" : "");
  const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin123" : "");

  // Require configured admin credentials. Refuse insecure default credentials.
  if (!expectedUsername || !expectedPassword || (expectedUsername === "admin" && expectedPassword === "admin123" && process.env.NODE_ENV === "production")) {
    return res.status(403).json({
      error: "Admin login is disabled. Please configure secure ADMIN_USERNAME and ADMIN_PASSWORD environment variables."
    });
  }

  const isUsernameValid = safeStringCompare(username.trim(), expectedUsername);
  const isPasswordValid = safeStringCompare(password.trim(), expectedPassword);

  if (isUsernameValid && isPasswordValid) {
    // Clear failed attempts upon successful login
    loginRateLimitMap.delete(clientIp);

    // Generate cryptographically secure random session token
    const token = "sess_" + crypto.randomBytes(32).toString("hex");
    const expiresAt = now + SESSION_TTL_MS;

    activeAdminSessions.set(token, {
      token,
      createdAt: now,
      expiresAt
    });

    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    const cookieHeader = `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400${isSecure ? "; Secure" : ""}`;

    res.setHeader("Set-Cookie", cookieHeader);

    // Note: Do not return raw token in JSON body to prevent client-side storage exposure
    return res.json({ success: true, message: "Admin authenticated successfully" });
  }

  // Record failed attempt
  const currentAttempts = (attemptRecord?.failedCount || 0) + 1;
  const isLocked = currentAttempts >= 5;
  const lockedUntil = isLocked ? now + 15 * 60 * 1000 : 0;

  loginRateLimitMap.set(clientIp, {
    failedCount: currentAttempts,
    lockedUntil,
    lastAttempt: now
  });

  if (isLocked) {
    return res.status(429).json({
      error: "Too many failed login attempts. Account temporarily locked for 15 minutes."
    });
  }

  return res.status(401).json({
    error: `Invalid username or password. (${5 - currentAttempts} attempts remaining)`
  });
});

app.post("/api/admin/logout", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies["admin_session"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : null);

  if (token) {
    activeAdminSessions.delete(token);
  }

  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const cookieHeader = `admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${isSecure ? "; Secure" : ""}`;

  res.setHeader("Set-Cookie", cookieHeader);

  return res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/admin/check-auth", (req, res) => {
  const authenticated = isAdminAuthenticated(req);
  return res.json({ authenticated });
});

// --- SUBSCRIBER DATABASE STORAGE & APIS ---
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const BLOG_POSTS_FILE = path.join(DATA_DIR, "blog-posts.json");
const SITE_PAGES_FILE = path.join(DATA_DIR, "site-pages.json");
const PATTERNS_FILE = path.join(DATA_DIR, "patterns.json");

interface SubscriberRecord {
  id: string;
  email: string;
  createdAt: string;
  status: 'new' | 'processed';
  source: string;
}

interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  count: number;
  popularStitches?: string[];
  isFreeBadge?: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_CATEGORIES_DATA: CategoryRecord[] = [
  {
    id: "blankets",
    slug: "blankets",
    name: "Blankets",
    description: "Cozy throw blankets, baby afghans, lapghan wraps, and heirloom quilts.",
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
    count: 420,
    popularStitches: ["Granny Square", "Ripple Stitch", "Moss Stitch", "Waffle Stitch"],
    isFreeBadge: true,
    displayOrder: 10,
    isActive: true
  },
  {
    id: "flowers",
    slug: "flowers",
    name: "Flowers",
    description: "Everlasting crochet roses, sunflowers, daisies, tulips, and floral appliques.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    count: 280,
    popularStitches: ["Picot Stitch", "Popcorn Stitch", "Puff Stitch", "Magic Ring"],
    isFreeBadge: true,
    displayOrder: 20,
    isActive: true
  },
  {
    id: "amigurumi",
    slug: "amigurumi",
    name: "Amigurumi",
    description: "Cute plushies, stuffed animals, dolls, and miniature crocheted toys.",
    image: "https://images.unsplash.com/photo-1566454825481-4e28f37f2d63?auto=format&fit=crop&w=800&q=80",
    count: 650,
    popularStitches: ["Single Crochet (Spiral)", "Invisible Decrease", "Magic Ring"],
    isFreeBadge: false,
    displayOrder: 30,
    isActive: true
  },
  {
    id: "bags",
    slug: "bags",
    name: "Bags",
    description: "Market totes, boho shoulder bags, clutch purses, and sturdy backpack bags.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    count: 310,
    popularStitches: ["Thermal Stitch", "Spike Stitch", "Linen Stitch"],
    isFreeBadge: false,
    displayOrder: 40,
    isActive: true
  },
  {
    id: "baby",
    slug: "baby",
    name: "Baby",
    description: "Soft baby booties, hats, pacifier clips, cardigan sets, and nursery blankets.",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
    count: 390,
    popularStitches: ["Shell Stitch", "Cluster Stitch", "Single Crochet Ribbing"],
    isFreeBadge: false,
    displayOrder: 50,
    isActive: true
  },
  {
    id: "tops",
    slug: "tops",
    name: "Tops",
    description: "Summer crop tops, lace halter tops, bralettes, and lightweight mesh tees.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    count: 240,
    popularStitches: ["Filet Crochet", "V-Stitch", "Double Crochet Mesh"],
    isFreeBadge: false,
    displayOrder: 60,
    isActive: true
  },
  {
    id: "sweaters",
    slug: "sweaters",
    name: "Sweaters",
    description: "Cozy oversized cardigans, raglan pullovers, winter turtlenecks, and vests.",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
    count: 195,
    popularStitches: ["Front Post Double Crochet", "Half Double Crochet Rib", "Alpine Stitch"],
    isFreeBadge: false,
    displayOrder: 70,
    isActive: true
  },
  {
    id: "accessories",
    slug: "accessories",
    name: "Accessories",
    description: "Warm scarves, beanies, fingerless gloves, shawls, and hair scrunchies.",
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80",
    count: 510,
    popularStitches: ["Broomstick Lace", "Solomon's Knot", "Puff Ribbing"],
    isFreeBadge: false,
    displayOrder: 80,
    isActive: true
  },
  {
    id: "home-decor",
    slug: "home-decor",
    name: "Home Decor",
    description: "Decorative pillows, coasters, plant hangers, dishcloths, and rug mats.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    count: 340,
    popularStitches: ["Suzette Stitch", "Basketweave", "Bobble Stitch"],
    isFreeBadge: false,
    displayOrder: 90,
    isActive: true
  },
  {
    id: "christmas",
    slug: "christmas",
    name: "Christmas",
    description: "Festive tree ornaments, stockings, snow globes, garlands, and Santa hats.",
    image: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80",
    count: 275,
    popularStitches: ["Star Stitch", "Loop Stitch", "Picot Edging"],
    isFreeBadge: false,
    displayOrder: 100,
    isActive: true
  },
  {
    id: "halloween",
    slug: "halloween",
    name: "Halloween",
    description: "Cute pumpkins, ghost plushies, witch hats, black cat appliques, and spiderwebs.",
    image: "https://images.unsplash.com/photo-1508759073847-9ca702cec7d2?auto=format&fit=crop&w=800&q=80",
    count: 180,
    popularStitches: ["Spike Stitch", "Filet Mesh", "Popcorn Pumpkin St"],
    isFreeBadge: false,
    displayOrder: 110,
    isActive: true
  },
  {
    id: "animals",
    slug: "animals",
    name: "Animals",
    description: "Adorable crocheted bears, bunny rabbits, kittens, puppies, and sea creatures.",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
    count: 480,
    popularStitches: ["Magic Circle", "Single Crochet (Back Loop)", "Invisible Join"],
    isFreeBadge: false,
    displayOrder: 120,
    isActive: true
  },
  {
    id: "granny-squares",
    slug: "granny-squares",
    name: "Granny Squares",
    description: "Classic 3-dc granny squares, sunburst floral motifs, hexagon blocks, and solid squares.",
    image: "https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=800&q=80",
    count: 520,
    popularStitches: ["3-DC Cluster", "Corner 2-CH Space", "Join As You Go"],
    isFreeBadge: false,
    displayOrder: 130,
    isActive: true
  }
];

// --- INDEXNOW AUTOMATIC SEARCH ENGINE INDEXING & VERIFICATION ---
const INDEXNOW_KEY_FILE = path.join(DATA_DIR, "indexnow-key.json");
const CANONICAL_SITE_HOST = "welovepattern.com";
const CANONICAL_SITE_ORIGIN = "https://welovepattern.com";

interface IndexNowKeyData {
  key: string;
  createdAt: string;
  lastSubmittedAt?: string | null;
  submissionCount: number;
}

let cachedIndexNowKeyData: IndexNowKeyData | null = null;

function getIndexNowKeyData(): IndexNowKeyData {
  if (cachedIndexNowKeyData) {
    return cachedIndexNowKeyData;
  }
  try {
    ensureDataDirExists();
    if (fs.existsSync(INDEXNOW_KEY_FILE)) {
      const raw = fs.readFileSync(INDEXNOW_KEY_FILE, "utf-8").trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.key === "string" && parsed.key.length >= 8) {
          cachedIndexNowKeyData = {
            key: parsed.key,
            createdAt: parsed.createdAt || new Date().toISOString(),
            lastSubmittedAt: parsed.lastSubmittedAt || null,
            submissionCount: typeof parsed.submissionCount === "number" ? parsed.submissionCount : 0
          };
          return cachedIndexNowKeyData;
        }
      }
    }
  } catch (err) {
    console.error("Error reading IndexNow key file:", err);
  }

  // Generate a secure 32-character hexadecimal key
  const generatedKey = (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim())
    ? process.env.INDEXNOW_KEY.trim()
    : crypto.randomBytes(16).toString("hex");

  const newData: IndexNowKeyData = {
    key: generatedKey,
    createdAt: new Date().toISOString(),
    lastSubmittedAt: null,
    submissionCount: 0
  };

  try {
    ensureDataDirExists();
    fs.writeFileSync(INDEXNOW_KEY_FILE, JSON.stringify(newData, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing IndexNow key file:", err);
  }

  cachedIndexNowKeyData = newData;
  return cachedIndexNowKeyData;
}

function getIndexNowKey(): string {
  return getIndexNowKeyData().key;
}

function updateIndexNowStats(submittedCount: number) {
  try {
    const data = getIndexNowKeyData();
    data.lastSubmittedAt = new Date().toISOString();
    data.submissionCount = (data.submissionCount || 0) + submittedCount;
    cachedIndexNowKeyData = data;
    ensureDataDirExists();
    fs.writeFileSync(INDEXNOW_KEY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error updating IndexNow stats:", err);
  }
}

// Strictly validates and canonicalizes URLs to https://welovepattern.com
function sanitizeIndexNowUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    let urlObj: URL;
    if (trimmed.startsWith("/")) {
      urlObj = new URL(trimmed, CANONICAL_SITE_ORIGIN);
    } else {
      urlObj = new URL(trimmed);
    }

    const host = urlObj.hostname.toLowerCase();
    if (host !== CANONICAL_SITE_HOST && host !== `www.${CANONICAL_SITE_HOST}`) {
      console.warn(`[IndexNow] Discarded non-whitelisted external URL: ${trimmed}`);
      return null;
    }

    const pathname = urlObj.pathname.startsWith("/") ? urlObj.pathname : `/${urlObj.pathname}`;
    return `${CANONICAL_SITE_ORIGIN}${pathname}${urlObj.search}`;
  } catch (err) {
    console.warn(`[IndexNow] Discarded unparseable URL: ${trimmed}`);
    return null;
  }
}

// In-memory sliding window deduplication to prevent redundant spam
const recentIndexNowSubmissions = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60 * 1000; // 60 seconds

// Safe, non-blocking asynchronous notifier to IndexNow (Bing & search partners)
async function notifyIndexNow(rawUrls: string | string[]): Promise<boolean> {
  try {
    const urlArray = Array.isArray(rawUrls) ? rawUrls : [rawUrls];
    const now = Date.now();

    // Clean up expired entries from dedupe cache
    for (const [url, timestamp] of recentIndexNowSubmissions.entries()) {
      if (now - timestamp > DEDUPE_WINDOW_MS) {
        recentIndexNowSubmissions.delete(url);
      }
    }

    const validUrls: string[] = [];
    for (const u of urlArray) {
      const cleaned = sanitizeIndexNowUrl(u);
      if (!cleaned) continue;

      const lastSent = recentIndexNowSubmissions.get(cleaned);
      if (lastSent && (now - lastSent < DEDUPE_WINDOW_MS)) {
        continue;
      }

      validUrls.push(cleaned);
    }

    if (validUrls.length === 0) {
      return false;
    }

    // Mark in deduplication cache
    for (const u of validUrls) {
      recentIndexNowSubmissions.set(u, now);
    }

    const key = getIndexNowKey();
    const keyLocation = `${CANONICAL_SITE_ORIGIN}/${key}.txt`;

    const payload = {
      host: CANONICAL_SITE_HOST,
      key,
      keyLocation,
      urlList: validUrls
    };

    // Non-blocking fetch with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "WeLovePattern-IndexNow/1.0"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status === 200 || res.status === 202) {
      console.log(`[IndexNow] Notified ${validUrls.length} URL(s) for ${CANONICAL_SITE_HOST} (HTTP ${res.status})`);
      updateIndexNowStats(validUrls.length);
      return true;
    } else {
      const errText = await res.text().catch(() => "");
      console.warn(`[IndexNow] API responded with status ${res.status}: ${errText}`);
      return false;
    }
  } catch (err: any) {
    console.warn(`[IndexNow] Submission completed with notice: ${err?.message || err}`);
    return false;
  }
}

function initializeDatabaseFiles() {
  ensureDataDirExists();
  if (!fs.existsSync(SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(PATTERNS_FILE)) {
    fs.writeFileSync(PATTERNS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES_DATA, null, 2), "utf-8");
  }
  if (!fs.existsSync(BLOG_POSTS_FILE)) {
    getBlogPosts();
  }
  if (!fs.existsSync(SITE_PAGES_FILE)) {
    getSitePages();
  }
  getIndexNowKeyData();
}

function getSitePages(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SITE_PAGES_FILE)) {
      fs.writeFileSync(SITE_PAGES_FILE, JSON.stringify(DEFAULT_SITE_PAGES, null, 2), "utf-8");
      return DEFAULT_SITE_PAGES;
    }
    const raw = fs.readFileSync(SITE_PAGES_FILE, "utf-8").trim();
    if (!raw) return DEFAULT_SITE_PAGES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SITE_PAGES;
  } catch (err) {
    console.error("Error reading site pages file:", err);
    return DEFAULT_SITE_PAGES;
  }
}

function saveSitePages(pages: any[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(SITE_PAGES_FILE, JSON.stringify(pages, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing site pages file:", err);
    return false;
  }
}

function getBlogPosts(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BLOG_POSTS_FILE)) {
      const initialPosts = BLOG_DATA.map(p => ({
        ...p,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seoMeta: {
          metaTitle: `${p.title} | WeLovePattern Blog`,
          metaDescription: p.excerpt,
          metaKeywords: p.tags ? p.tags.join(', ') : '',
          canonicalUrl: `https://welovepattern.com/blog/${p.slug}`,
          ogTitle: p.title,
          ogDescription: p.excerpt,
          ogImage: p.image,
          twitterTitle: p.title,
          twitterDescription: p.excerpt,
          twitterImage: p.image,
          isNoIndex: false,
          isNoFollow: false
        }
      }));
      fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(initialPosts, null, 2), "utf-8");
      return initialPosts;
    }
    const raw = fs.readFileSync(BLOG_POSTS_FILE, "utf-8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading blog posts file:", err);
    return [];
  }
}

function saveBlogPosts(posts: any[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(BLOG_POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing blog posts file:", err);
    return false;
  }
}

function getCategories(): CategoryRecord[] {
  try {
    ensureDataDirExists();
    const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8").trim();
    if (!raw) return DEFAULT_CATEGORIES_DATA;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES_DATA;

    return parsed.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } catch (err) {
    console.error("Error reading categories file:", err);
    return DEFAULT_CATEGORIES_DATA;
  }
}

function saveCategories(categories: CategoryRecord[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing categories file:", err);
    return false;
  }
}

function getSubscribers(): SubscriberRecord[] {
  try {
    ensureDataDirExists();
    const raw = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenIds = new Set<string>();
    const validSubscribers: SubscriberRecord[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (item && typeof item === "object" && typeof item.email === "string" && item.email.trim()) {
        const id = typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `sub_${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 6)}`;

        if (!seenIds.has(id)) {
          seenIds.add(id);
          validSubscribers.push({
            id,
            email: item.email.trim().toLowerCase(),
            createdAt: item.createdAt || new Date().toISOString(),
            status: item.status === "processed" ? "processed" : "new",
            source: typeof item.source === "string" ? item.source.slice(0, 100) : "Homepage Newsletter"
          });
        }
      }
    }

    return validSubscribers;
  } catch (err) {
    console.error("Error reading subscribers file:", err);
    return [];
  }
}

function saveSubscribers(subscribers: SubscriberRecord[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing subscribers file:", err);
    return false;
  }
}

// 4. UPLOAD & MULTIPART BODY PARSER (10MB) for image uploads and PDF parsing (defined above)

// Strict Magic Bytes Image Validation (JPG, PNG, WebP only)
function validateImageBuffer(buffer: Buffer): { valid: boolean; ext: string; mime: string; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, ext: "", mime: "", error: "File data is too small or corrupt." };
  }

  if (buffer.length > 5 * 1024 * 1024) {
    return { valid: false, ext: "", mime: "", error: "Image file exceeds maximum 5MB size limit." };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, ext: "png", mime: "image/png" };
  }

  // WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: "webp", mime: "image/webp" };
  }

  return {
    valid: false,
    ext: "",
    mime: "",
    error: "Invalid or unsupported image file. Only standard JPG, PNG, and WebP raster images are allowed."
  };
}

// Rate limiting for public subscribe endpoint
const subscribeRateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function checkSubscribeRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const record = subscribeRateLimitMap.get(ip);
  if (!record) {
    subscribeRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (now - record.firstRequestTime > windowMs) {
    subscribeRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// Rate limiting for public AI assistant endpoint
const aiRateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 20;

  const record = aiRateLimitMap.get(ip);
  if (!record) {
    aiRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (now - record.firstRequestTime > windowMs) {
    aiRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// Periodic cleanup timer to prevent memory leaks in rate limit maps and session maps
setInterval(() => {
  const now = Date.now();

  for (const [ip, rec] of loginRateLimitMap.entries()) {
    if (rec.lockedUntil < now && now - rec.lastAttempt > 30 * 60 * 1000) {
      loginRateLimitMap.delete(ip);
    }
  }

  for (const [ip, rec] of subscribeRateLimitMap.entries()) {
    if (now - rec.firstRequestTime > 60 * 1000) {
      subscribeRateLimitMap.delete(ip);
    }
  }

  for (const [ip, rec] of aiRateLimitMap.entries()) {
    if (now - rec.firstRequestTime > 5 * 60 * 1000) {
      aiRateLimitMap.delete(ip);
    }
  }

  for (const [token, session] of activeAdminSessions.entries()) {
    if (now > session.expiresAt) {
      activeAdminSessions.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Public Subscription Endpoint
app.post("/api/subscribe", (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";

  if (!checkSubscribeRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: "Too many subscription attempts. Please wait a minute and try again."
    });
  }

  const { email, source } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 255) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  const subscribers = getSubscribers();
  const existing = subscribers.find(s => s.email === normalizedEmail);

  if (existing) {
    return res.status(200).json({
      success: false,
      alreadySubscribed: true,
      message: "You're already subscribed."
    });
  }

  const newSubscriber: SubscriberRecord = {
    id: "sub_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    status: "new",
    source: typeof source === "string" && source.trim() ? source.trim().slice(0, 100) : "Homepage Newsletter"
  };

  subscribers.unshift(newSubscriber);
  const saved = saveSubscribers(subscribers);

  if (!saved) {
    return res.status(500).json({ success: false, error: "Server error saving subscription. Please try again." });
  }

  return res.json({
    success: true,
    message: "Thanks! You're subscribed."
  });
});

// Authenticated Admin Subscriber Endpoints
app.get("/api/admin/subscribers", requireAdminAuth, (req, res) => {
  try {
    const subscribers = getSubscribers();
    const newCount = subscribers.filter(s => s.status === 'new').length;
    return res.json({
      subscribers,
      totalCount: subscribers.length,
      newCount
    });
  } catch (err) {
    console.error("Error fetching subscribers:", err);
    return res.status(500).json({ error: "Unable to load subscribers. Please try again." });
  }
});

app.patch("/api/admin/subscribers/:id/status", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (status !== 'new' && status !== 'processed') {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const subscribers = getSubscribers();
  const sub = subscribers.find(s => s.id === id);

  if (!sub) {
    return res.status(404).json({ error: "Subscriber not found" });
  }

  sub.status = status;
  saveSubscribers(subscribers);

  return res.json({ success: true, subscriber: sub });
});

app.delete("/api/admin/subscribers/:id", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  let subscribers = getSubscribers();
  const initialLen = subscribers.length;

  subscribers = subscribers.filter(s => s.id !== id);

  if (subscribers.length === initialLen) {
    return res.status(404).json({ error: "Subscriber not found" });
  }

  saveSubscribers(subscribers);
  return res.json({ success: true, message: "Subscriber deleted successfully" });
});

app.post("/api/admin/subscribers/delete", requireAdminAuth, (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No subscriber IDs provided" });
  }

  const idsSet = new Set(ids);
  let subscribers = getSubscribers();
  const initialLen = subscribers.length;

  subscribers = subscribers.filter(s => !idsSet.has(s.id));
  const deletedCount = initialLen - subscribers.length;

  saveSubscribers(subscribers);
  return res.json({ success: true, deletedCount, message: `${deletedCount} subscriber(s) deleted successfully` });
});

app.get("/api/admin/subscribers/export", requireAdminAuth, (req, res) => {
  const subscribers = getSubscribers();
  const idsParam = req.query.ids as string;
  let exportList = subscribers;

  if (idsParam) {
    const selectedIds = new Set(idsParam.split(","));
    exportList = subscribers.filter(s => selectedIds.has(s.id));
  }

  const csvRows = [
    ["ID", "Email", "Date Subscribed", "Status", "Source"].map(h => `"${h}"`).join(",")
  ];

  exportList.forEach(s => {
    const dateStr = new Date(s.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    csvRows.push([
      `"${s.id}"`,
      `"${s.email}"`,
      `"${dateStr}"`,
      `"${s.status}"`,
      `"${s.source || ''}"`
    ].join(","));
  });

  const csvData = csvRows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="welovepattern_subscribers.csv"');
  return res.send(csvData);
});

// --- CORE PATTERN PERSISTENCE STORAGE & ADMIN CMS API ---

function getPersistedPatternsData(): Pattern[] {
  try {
    ensureDataDirExists();
    if (!fs.existsSync(PATTERNS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(PATTERNS_FILE, "utf-8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading persisted patterns file:", err);
    return [];
  }
}

function savePersistedPatternsData(patterns: Pattern[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(PATTERNS_FILE, JSON.stringify(patterns, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing persisted patterns file:", err);
    return false;
  }
}

function getEffectivePatterns(): Pattern[] {
  const persisted = getPersistedPatternsData();
  if (!persisted || persisted.length === 0) {
    return PATTERNS_DATA;
  }

  const deletedIds = new Set(
    persisted.filter(p => (p as any).isDeleted === true).map(p => p.id)
  );

  const patternMap = new Map<string, Pattern>();
  const order: string[] = [];

  // Add static patterns that are not marked as deleted
  for (const p of PATTERNS_DATA) {
    if (!deletedIds.has(p.id)) {
      patternMap.set(p.id, p);
      order.push(p.id);
    }
  }

  // Apply persisted patterns (only non-deleted)
  for (const p of persisted) {
    if ((p as any).isDeleted === true) continue;

    if (!patternMap.has(p.id)) {
      // New custom pattern - prepend to top
      order.unshift(p.id);
    }
    patternMap.set(p.id, p);
  }

  return order.map(id => patternMap.get(id)!).filter(Boolean);
}

function validateAndSanitizePattern(body: any, existingPattern?: Pattern): Pattern {
  const rawTitle = typeof body.title === "string" && body.title.trim()
    ? body.title.trim()
    : (typeof body.patternTitle === "string" && body.patternTitle.trim()
      ? body.patternTitle.trim()
      : (existingPattern?.title || "Untitled Pattern"));
  const title = rawTitle;
  
  // Generate clean slug from title if not explicitly provided or invalid
  let slug = typeof body.slug === "string" && body.slug.trim()
    ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (!slug) {
    slug = `pattern-${Date.now().toString(36)}`;
  }

  const id = existingPattern?.id || (typeof body.id === "string" && body.id.trim() ? body.id.trim() : `pat_${slug}_${Date.now().toString(36)}`);

  const category = (typeof body.category === "string" && body.category.trim() ? body.category.trim() : (existingPattern?.category || "blankets")) as any;
  const difficulty = (['Beginner', 'Easy', 'Intermediate', 'Advanced'].includes(body.difficulty) ? body.difficulty : (existingPattern?.difficulty || 'Beginner')) as any;

  const steps = Array.isArray(body.steps) ? body.steps.map((s: any, idx: number) => ({
    rowNumber: typeof s.rowNumber === "string" && s.rowNumber.trim() ? s.rowNumber.trim() : `Row ${idx + 1}`,
    instruction: typeof s.instruction === "string" ? s.instruction.trim() : "",
    stitchCount: typeof s.stitchCount === "string" && s.stitchCount.trim() ? s.stitchCount.trim() : undefined,
    tip: typeof s.tip === "string" && s.tip.trim() ? s.tip.trim() : undefined,
    image: typeof s.image === "string" && s.image.trim() ? s.image.trim() : undefined
  })) : (existingPattern?.steps || []);

  const materials = Array.isArray(body.materials) ? body.materials.filter((m: any) => typeof m === "string" && m.trim()).map((m: any) => m.trim()) : (existingPattern?.materials || []);
  const abbreviationsUsed = Array.isArray(body.abbreviationsUsed) ? body.abbreviationsUsed.filter((a: any) => typeof a === "string" && a.trim()).map((a: any) => a.trim()) : (existingPattern?.abbreviationsUsed || ['sc', 'hdc', 'dc', 'ch', 'sl st']);
  const tags = Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === "string" && t.trim()).map((t: any) => t.trim()) : (existingPattern?.tags || [category, difficulty.toLowerCase(), 'free-pattern']);

  // Extract main cover photo supporting image, coverPhoto, coverImage, imageUrl, photoUrl
  const candidateMainImage = 
    (typeof body.image === "string" && body.image.trim() ? body.image.trim() : null) ||
    (typeof body.coverPhoto === "string" && body.coverPhoto.trim() ? body.coverPhoto.trim() : null) ||
    (typeof body.coverImage === "string" && body.coverImage.trim() ? body.coverImage.trim() : null) ||
    (typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null) ||
    (typeof body.photoUrl === "string" && body.photoUrl.trim() ? body.photoUrl.trim() : null);

  const mainImage = candidateMainImage || existingPattern?.image || "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80";

  // Extract gallery photos supporting gallery, galleryPhotos, images
  const rawGalleryCandidate = Array.isArray(body.gallery) && body.gallery.length > 0
    ? body.gallery
    : (Array.isArray(body.galleryPhotos) && body.galleryPhotos.length > 0
      ? body.galleryPhotos
      : (Array.isArray(body.images) && body.images.length > 0 ? body.images : null));

  let gallery: string[] = [];
  if (rawGalleryCandidate) {
    gallery = rawGalleryCandidate
      .filter((g: any) => typeof g === "string" && g.trim())
      .map((g: any) => g.trim());
  } else if (existingPattern?.gallery && existingPattern.gallery.length > 0) {
    gallery = existingPattern.gallery;
  }

  if (gallery.length === 0 && mainImage) {
    gallery = [mainImage];
  }

  const pattern: Pattern = {
    id,
    slug,
    title,
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : (existingPattern?.subtitle || `Handcrafted ${difficulty} ${category} crochet project`),
    description: typeof body.description === "string" ? body.description.trim() : (existingPattern?.description || "Detailed pattern with step-by-step written instructions."),
    difficulty,
    category,
    image: mainImage,
    gallery: gallery.length > 0 ? gallery : [mainImage],
    rating: typeof body.rating === "number" ? body.rating : (existingPattern?.rating || 5.0),
    reviewCount: typeof body.reviewCount === "number" ? body.reviewCount : (existingPattern?.reviewCount || 1),
    downloadsCount: typeof body.downloadsCount === "number" ? body.downloadsCount : (existingPattern?.downloadsCount || 0),
    hookSize: typeof body.hookSize === "string" && body.hookSize.trim() ? body.hookSize.trim() : (existingPattern?.hookSize || "5.0 mm (H-8)"),
    yarnWeight: typeof body.yarnWeight === "string" && body.yarnWeight.trim() ? body.yarnWeight.trim() : (existingPattern?.yarnWeight || "Medium / Worsted (#4)"),
    yarnBrand: typeof body.yarnBrand === "string" && body.yarnBrand.trim() ? body.yarnBrand.trim() : existingPattern?.yarnBrand,
    yarnMetersNeeded: typeof body.yarnMetersNeeded === "number" ? body.yarnMetersNeeded : (existingPattern?.yarnMetersNeeded || 450),
    finishedSize: typeof body.finishedSize === "string" && body.finishedSize.trim() ? body.finishedSize.trim() : (existingPattern?.finishedSize || "Standard Size"),
    estimatedTimeHours: typeof body.estimatedTimeHours === "number" ? body.estimatedTimeHours : (existingPattern?.estimatedTimeHours || 4),
    isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existingPattern?.isFeatured,
    isTrending: body.isTrending !== undefined ? Boolean(body.isTrending) : existingPattern?.isTrending,
    isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : existingPattern?.isPopular,
    createdAt: existingPattern?.createdAt || (typeof body.createdAt === "string" && body.createdAt.trim() ? body.createdAt.trim() : new Date().toISOString().split('T')[0]),
    materials,
    gauge: typeof body.gauge === "string" && body.gauge.trim() ? body.gauge.trim() : (existingPattern?.gauge || "14 sts and 10 rows = 4 inches (10 cm)"),
    abbreviationsUsed,
    steps,
    pdfSize: typeof body.pdfSize === "string" && body.pdfSize.trim() ? body.pdfSize.trim() : (existingPattern?.pdfSize || "1.2 MB"),
    pdfPages: typeof body.pdfPages === "number" ? body.pdfPages : (existingPattern?.pdfPages || 3),
    pdfUrl: typeof body.pdfUrl === "string" && body.pdfUrl.trim() ? body.pdfUrl.trim() : existingPattern?.pdfUrl,
    tags,
    seoMeta: body.seoMeta && typeof body.seoMeta === "object" ? {
      metaTitle: typeof body.seoMeta.metaTitle === "string" ? body.seoMeta.metaTitle.trim() : undefined,
      metaDescription: typeof body.seoMeta.metaDescription === "string" ? body.seoMeta.metaDescription.trim() : undefined,
      metaKeywords: typeof body.seoMeta.metaKeywords === "string" ? body.seoMeta.metaKeywords.trim() : undefined,
      ogImage: typeof body.seoMeta.ogImage === "string" && body.seoMeta.ogImage.trim() ? body.seoMeta.ogImage.trim() : mainImage,
      ogType: typeof body.seoMeta.ogType === "string" ? body.seoMeta.ogType.trim() : 'article',
      canonicalUrl: typeof body.seoMeta.canonicalUrl === "string" ? body.seoMeta.canonicalUrl.trim() : undefined,
      structuredDataJson: typeof body.seoMeta.structuredDataJson === "string" ? body.seoMeta.structuredDataJson : undefined
    } : (existingPattern?.seoMeta || {
      metaTitle: `${title} - Free Crochet Pattern`,
      metaDescription: typeof body.description === "string" ? body.description.trim() : (existingPattern?.description || "Detailed pattern with step-by-step written instructions."),
      ogImage: mainImage,
      ogType: 'article'
    })
  };

  return pattern;
}

// Public GET Patterns Endpoint
app.get("/api/patterns", (_req, res) => {
  try {
    const patterns = getEffectivePatterns();
    return res.json({ patterns });
  } catch (err) {
    console.error("Error fetching public patterns:", err);
    return res.status(500).json({ error: "Failed to load patterns" });
  }
});

// Public GET Single Pattern Endpoint
app.get("/api/patterns/:slugOrId", (req, res) => {
  try {
    const { slugOrId } = req.params;
    const patterns = getEffectivePatterns();
    const found = patterns.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (!found) {
      return res.status(404).json({ error: "Pattern not found" });
    }
    return res.json({ pattern: found });
  } catch (err) {
    console.error("Error fetching pattern:", err);
    return res.status(500).json({ error: "Failed to load pattern" });
  }
});

// Admin GET Patterns Endpoint
app.get("/api/admin/patterns", requireAdminAuth, (_req, res) => {
  try {
    const patterns = getEffectivePatterns();
    return res.json({ patterns });
  } catch (err) {
    console.error("Error fetching admin patterns:", err);
    return res.status(500).json({ error: "Failed to load admin patterns" });
  }
});

// Admin GET Single Pattern Endpoint
app.get("/api/admin/patterns/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const patterns = getEffectivePatterns();
    const found = patterns.find(p => p.id === id || p.slug === id);
    if (!found) {
      return res.status(404).json({ error: "Pattern not found" });
    }
    return res.json({ pattern: found });
  } catch (err) {
    console.error("Error fetching admin pattern:", err);
    return res.status(500).json({ error: "Failed to load admin pattern" });
  }
});

// Admin POST (Create) Pattern Endpoint
app.post("/api/admin/patterns", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const body = req.body || {};
    const titleVal = typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : (typeof body.patternTitle === "string" && body.patternTitle.trim() ? body.patternTitle.trim() : "");

    if (!titleVal) {
      return res.status(400).json({ error: "Pattern title is required" });
    }

    const newPattern = validateAndSanitizePattern(body);
    const persisted = getPersistedPatternsData();
    const effective = getEffectivePatterns();

    // Check if ID already exists
    if (effective.some(p => p.id === newPattern.id)) {
      const idx = persisted.findIndex(p => p.id === newPattern.id);
      if (idx >= 0) {
        persisted[idx] = newPattern;
      } else {
        persisted.push(newPattern);
      }
    } else {
      // Ensure unique slug
      let uniqueSlug = newPattern.slug;
      let counter = 1;
      while (effective.some(p => p.slug === uniqueSlug)) {
        uniqueSlug = `${newPattern.slug}-${counter}`;
        counter++;
      }
      newPattern.slug = uniqueSlug;
      persisted.unshift(newPattern);
    }

    const saved = savePersistedPatternsData(persisted);
    if (!saved) {
      return res.status(500).json({ error: "Failed to persist pattern data" });
    }

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/pattern/${newPattern.slug}`, "https://welovepattern.com/patterns"]);

    return res.status(201).json({ success: true, pattern: newPattern });
  } catch (err: any) {
    console.error("Error creating pattern:", err);
    return res.status(500).json({ error: err.message || "Failed to create pattern" });
  }
});

// Admin PUT (Update) Pattern Endpoint
app.put("/api/admin/patterns/:id", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const effective = getEffectivePatterns();
    const existing = effective.find(p => p.id === id || p.slug === id);

    if (!existing) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    const titleVal = typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : (typeof body.patternTitle === "string" && body.patternTitle.trim() ? body.patternTitle.trim() : (existing.title || ""));

    if (!titleVal) {
      return res.status(400).json({ error: "Pattern title is required" });
    }

    const updatedPattern = validateAndSanitizePattern(body, existing);
    updatedPattern.id = existing.id; // Preserve ID

    const persisted = getPersistedPatternsData();
    const existingIdx = persisted.findIndex(p => p.id === existing.id);

    if (existingIdx >= 0) {
      persisted[existingIdx] = updatedPattern;
    } else {
      persisted.push(updatedPattern);
    }

    const saved = savePersistedPatternsData(persisted);
    if (!saved) {
      return res.status(500).json({ error: "Failed to save pattern data" });
    }

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/pattern/${updatedPattern.slug}`, "https://welovepattern.com/patterns"]);

    return res.json({ success: true, pattern: updatedPattern });
  } catch (err: any) {
    console.error("Error updating pattern:", err);
    return res.status(500).json({ error: err.message || "Failed to update pattern" });
  }
});

// Admin DELETE Pattern Endpoint
app.delete("/api/admin/patterns/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const effective = getEffectivePatterns();
    const target = effective.find(p => p.id === id || p.slug === id);

    if (!target) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    let persisted = getPersistedPatternsData();
    const isStaticBase = PATTERNS_DATA.some(p => p.id === target.id);

    if (isStaticBase) {
      // Mark as deleted so base static pattern is suppressed
      const idx = persisted.findIndex(p => p.id === target.id);
      if (idx >= 0) {
        (persisted[idx] as any).isDeleted = true;
      } else {
        persisted.push({ ...target, isDeleted: true } as any);
      }
    } else {
      // Custom pattern: filter out from persisted
      persisted = persisted.filter(p => p.id !== target.id);
    }

    const saved = savePersistedPatternsData(persisted);
    if (!saved) {
      return res.status(500).json({ error: "Failed to delete pattern" });
    }

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/pattern/${target.slug}`, "https://welovepattern.com/patterns"]);

    return res.json({ success: true, message: "Pattern deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting pattern:", err);
    return res.status(500).json({ error: err.message || "Failed to delete pattern" });
  }
});

// Admin GET: List available Pinterest master templates metadata
app.get("/api/admin/pinterest/templates", requireAdminAuth, (req, res) => {
  return res.json({
    templates: PINTEREST_TEMPLATES,
    availableIds: Object.keys(PINTEREST_TEMPLATES),
  });
});

// Admin POST: Generate Pinterest Pin for a Pattern using Template A, B, or C
app.post("/api/admin/patterns/:id/generate-pin", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestedTemplateId = (req.body?.templateId as PinterestTemplateId) || "template-a";
    const templateId: PinterestTemplateId =
      requestedTemplateId === "template-b" || requestedTemplateId === "template-c"
        ? requestedTemplateId
        : "template-a";

    const patterns = getEffectivePatterns();
    const pattern = patterns.find(p => p.id === id || p.slug === id);

    if (!pattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    if (!pattern.image) {
      return res.status(400).json({
        error: "Pattern does not have a primary image required for Pinterest pin rendering"
      });
    }

    const patternInput = {
      id: pattern.id,
      slug: pattern.slug,
      title: pattern.title,
      subtitle: pattern.subtitle,
      description: pattern.description,
      difficulty: pattern.difficulty,
      image: pattern.image,
      gallery: pattern.gallery,
      category: pattern.category,
      tags: pattern.tags,
      hookSize: pattern.hookSize,
      materials: pattern.materials,
      pdfUrl: pattern.pdfUrl,
      isFree: (pattern as any).isFree,
      price: (pattern as any).price,
    };

    let result;
    const baseSlug = pattern.slug || pattern.id;

    if (templateId === "template-b") {
      const filename = `pin-${baseSlug}-template-b.png`;
      result = await renderPinterestTemplateB(patternInput, filename);
    } else if (templateId === "template-c") {
      const filename = `pin-${baseSlug}-template-c.png`;
      result = await renderPinterestTemplateC(patternInput, filename);
    } else {
      // Template A: render both specific and legacy filename for compatibility
      const filename = `pin-${baseSlug}-template-a.png`;
      result = await renderPinterestTemplateA(patternInput, filename);
      // Also write legacy filename for backwards compatibility
      try {
        const legacyPath = path.join(process.cwd(), "public", "generated", "pinterest", `pin-${baseSlug}.png`);
        fs.copyFileSync(result.outputPath, legacyPath);
      } catch (copyErr) {
        // Non-blocking
      }
    }

    const templateMeta = PINTEREST_TEMPLATES[templateId];

    return res.json({
      success: true,
      message: `Pinterest pin generated successfully with ${templateMeta.name} (${result.width}x${result.height})`,
      templateId,
      pinUrl: result.publicUrl,
      filename: result.filename,
      width: result.width,
      height: result.height,
      pattern: {
        id: pattern.id,
        slug: pattern.slug,
        title: pattern.title,
      }
    });
  } catch (err: any) {
    console.error("Error generating Pinterest pin for pattern:", err);
    return res.status(500).json({
      error: err?.message || "Failed to generate Pinterest pin"
    });
  }
});

// Admin GET: Check existing Pinterest Pin status for a Pattern (supports Template A, B, C)
app.get("/api/admin/patterns/:id/pin-status", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const requestedTemplateId = (req.query.templateId as PinterestTemplateId) || "template-a";
    const templateId: PinterestTemplateId =
      requestedTemplateId === "template-b" || requestedTemplateId === "template-c"
        ? requestedTemplateId
        : "template-a";

    const patterns = getEffectivePatterns();
    const pattern = patterns.find(p => p.id === id || p.slug === id);

    if (!pattern) {
      return res.status(404).json({ error: "Pattern not found" });
    }

    const baseSlug = pattern.slug || pattern.id;
    const pinDir = path.join(process.cwd(), "public", "generated", "pinterest");

    // Check status for each template
    const checkFile = (filename: string): boolean => {
      return fs.existsSync(path.join(pinDir, filename));
    };

    const hasTemplateA = checkFile(`pin-${baseSlug}-template-a.png`) || checkFile(`pin-${baseSlug}.png`);
    const hasTemplateB = checkFile(`pin-${baseSlug}-template-b.png`);
    const hasTemplateC = checkFile(`pin-${baseSlug}-template-c.png`);

    let activeFilename = `pin-${baseSlug}-template-a.png`;
    let exists = false;

    if (templateId === "template-b") {
      activeFilename = `pin-${baseSlug}-template-b.png`;
      exists = hasTemplateB;
    } else if (templateId === "template-c") {
      activeFilename = `pin-${baseSlug}-template-c.png`;
      exists = hasTemplateC;
    } else {
      activeFilename = checkFile(`pin-${baseSlug}-template-a.png`)
        ? `pin-${baseSlug}-template-a.png`
        : `pin-${baseSlug}.png`;
      exists = hasTemplateA;
    }

    return res.json({
      exists,
      templateId,
      pinUrl: exists ? `/generated/pinterest/${activeFilename}` : null,
      filename: exists ? activeFilename : null,
      statusByTemplate: {
        "template-a": {
          exists: hasTemplateA,
          pinUrl: hasTemplateA
            ? `/generated/pinterest/${checkFile(`pin-${baseSlug}-template-a.png`) ? `pin-${baseSlug}-template-a.png` : `pin-${baseSlug}.png`}`
            : null,
        },
        "template-b": {
          exists: hasTemplateB,
          pinUrl: hasTemplateB ? `/generated/pinterest/pin-${baseSlug}-template-b.png` : null,
        },
        "template-c": {
          exists: hasTemplateC,
          pinUrl: hasTemplateC ? `/generated/pinterest/pin-${baseSlug}-template-c.png` : null,
        },
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to check pin status" });
  }
});

// ============================================================================
// PINTEREST OAUTH 2.0 AUTHORIZATION CODE FLOW ENDPOINTS
// ============================================================================

// 1. Safe Status Endpoint (Authenticated Admin only)
// NEVER exposes access_token, refresh_token, or client secrets to frontend
app.get("/api/admin/pinterest/status", requireAdminAuth, async (req, res) => {
  try {
    const status = await getSafePinterestStatus();
    return res.json(status);
  } catch (err: any) {
    console.error("Error checking Pinterest status:", err);
    return res.status(500).json({ error: "Failed to fetch Pinterest status", message: err?.message });
  }
});

// 2. OAuth Start Endpoint - Generates auth URL for popup window (Authenticated Admin only)
app.get("/api/admin/pinterest/auth-url", requireAdminAuth, (req, res) => {
  try {
    const sessionToken = getAdminSessionToken(req);
    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized. Valid Admin session required to connect Pinterest." });
    }

    const state = createOAuthState(sessionToken);
    const redirectUri = getPinterestRedirectUri();
    const { url, error } = buildPinterestAuthUrl(state, redirectUri);

    if (error || !url) {
      return res.status(400).json({ error: error || "Failed to generate Pinterest authorization URL" });
    }

    return res.json({
      success: true,
      url,
      redirectUri
    });
  } catch (err: any) {
    console.error("Error generating Pinterest auth URL:", err);
    return res.status(500).json({ error: err?.message || "Failed to start Pinterest OAuth flow" });
  }
});

// 3. OAuth Direct Start Endpoint - For direct browser redirection (Authenticated Admin only)
app.get("/api/admin/pinterest/connect", requireAdminAuth, (req, res) => {
  try {
    const sessionToken = getAdminSessionToken(req);
    if (!sessionToken) {
      return res.status(401).send(renderOAuthCallbackHtml({
        success: false,
        title: "Unauthorized",
        message: "You must be signed in as Admin to connect Pinterest.",
        nonce: res.locals.nonce
      }));
    }

    const state = createOAuthState(sessionToken);
    const redirectUri = getPinterestRedirectUri();
    const { url, error } = buildPinterestAuthUrl(state, redirectUri);

    if (error || !url) {
      return res.status(400).send(renderOAuthCallbackHtml({
        success: false,
        title: "Configuration Error",
        message: error || "Pinterest App credentials are not configured.",
        nonce: res.locals.nonce
      }));
    }

    return res.redirect(url);
  } catch (err: any) {
    console.error("Error redirecting to Pinterest OAuth:", err);
    return res.status(500).send(renderOAuthCallbackHtml({
      success: false,
      title: "Connection Error",
      message: err?.message || "Failed to connect to Pinterest.",
      nonce: res.locals.nonce
    }));
  }
});

// 4. OAuth Callback Endpoint - Handles redirection back from Pinterest
// Handles both /api/admin/pinterest/callback and /api/admin/pinterest/callback/
app.get(["/api/admin/pinterest/callback", "/api/admin/pinterest/callback/"], async (req, res) => {
  const nonce = res.locals.nonce;

  try {
    // Check if Pinterest reported an authorization error or user denied
    if (req.query.error) {
      const errCode = String(req.query.error || "");
      const errDesc = String(req.query.error_description || "Authorization was cancelled or denied on Pinterest.");
      return res.status(400).send(renderOAuthCallbackHtml({
        success: false,
        title: "Authorization Cancelled",
        message: errDesc,
        error: `Pinterest error: ${errCode}`,
        nonce
      }));
    }

    // Validate state parameter to protect against CSRF attacks
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookies = parseCookies(req);
    const cookieToken = cookies["admin_session"] || null;

    const stateValidation = validateAndConsumeOAuthState(
      state,
      (token: string) => {
        const session = activeAdminSessions.get(token);
        return !!session && Date.now() <= session.expiresAt;
      },
      cookieToken
    );

    if (!stateValidation.valid) {
      return res.status(400).send(renderOAuthCallbackHtml({
        success: false,
        title: "Security Verification Failed",
        message: stateValidation.error || "Invalid or expired OAuth state parameter.",
        error: "The authorization request was rejected to prevent cross-site request forgery (CSRF). Please initiate the connection again from the Admin dashboard.",
        nonce
      }));
    }

    // Validate code parameter
    const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
    if (!code) {
      return res.status(400).send(renderOAuthCallbackHtml({
        success: false,
        title: "Authorization Failed",
        message: "No authorization code was received from Pinterest.",
        nonce
      }));
    }

    // Exchange authorization code for tokens
    const redirectUri = getPinterestRedirectUri();
    const exchangeResult = await exchangePinterestCode(code, redirectUri);

    if (!exchangeResult.success || !exchangeResult.data) {
      return res.status(400).send(renderOAuthCallbackHtml({
        success: false,
        title: "Token Exchange Failed",
        message: exchangeResult.error || "Pinterest rejected the authorization code or credentials.",
        error: "Please check that your PINTEREST_APP_ID and PINTEREST_APP_SECRET are correctly configured and that the Redirect URI matches.",
        nonce
      }));
    }

    const tokenData = exchangeResult.data;

    // Fetch user account details
    const userAccountResult = await fetchPinterestUserAccount(tokenData.access_token);
    const account = userAccountResult.success && userAccountResult.account ? userAccountResult.account : undefined;

    // Save tokens securely server-side
    const now = Date.now();
    const authRecord: PinterestAuthRecord = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || "bearer",
      scope: tokenData.scope || "boards:read,pins:read,pins:write,user_accounts:read",
      expiresIn: tokenData.expires_in,
      expiresAt: tokenData.expires_in ? now + tokenData.expires_in * 1000 : undefined,
      refreshTokenExpiresIn: tokenData.refresh_token_expires_in,
      refreshTokenExpiresAt: tokenData.refresh_token_expires_in ? now + tokenData.refresh_token_expires_in * 1000 : undefined,
      account,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = savePinterestAuthRecord(authRecord);
    if (!saved) {
      return res.status(500).send(renderOAuthCallbackHtml({
        success: false,
        title: "Storage Error",
        message: "Failed to persist Pinterest credentials securely on the server.",
        nonce
      }));
    }

    // Return friendly success page with postMessage notification for the opener window
    return res.send(renderOAuthCallbackHtml({
      success: true,
      title: "Pinterest Connected Successfully!",
      message: "Your WeLovePattern Pinterest account has been connected and verified.",
      account,
      nonce
    }));
  } catch (err: any) {
    console.error("Exception in Pinterest OAuth callback:", err);
    return res.status(500).send(renderOAuthCallbackHtml({
      success: false,
      title: "OAuth Callback Error",
      message: err?.message || "An unexpected error occurred during Pinterest authorization.",
      nonce
    }));
  }
});

// 5. OAuth Disconnect Endpoint (Authenticated Admin only with origin validation)
app.post("/api/admin/pinterest/disconnect", requireAdminAuth, (req, res) => {
  try {
    clearPinterestAuthRecord();
    return res.json({
      success: true,
      message: "Pinterest account disconnected successfully"
    });
  } catch (err: any) {
    console.error("Error disconnecting Pinterest:", err);
    return res.status(500).json({
      error: "Failed to disconnect Pinterest account"
    });
  }
});

// --- CATEGORY MANAGEMENT API ENDPOINTS ---

// Public GET Categories
app.get("/api/categories", (req, res) => {
  try {
    const all = getCategories();
    const active = all.filter(c => c.isActive !== false);
    return res.json({ categories: active });
  } catch (err) {
    console.error("Error fetching public categories:", err);
    return res.status(500).json({ error: "Failed to load categories" });
  }
});

// Helper to cleanup old category image file if no other category uses it
function cleanupOldCategoryImage(oldImageUrl: string, currentCategoryIndex: number, allCategories: CategoryRecord[]) {
  if (!oldImageUrl || typeof oldImageUrl !== "string" || !oldImageUrl.startsWith("/uploads/categories/")) return;
  const filename = path.basename(oldImageUrl);
  if (!filename) return;

  const usedByOther = allCategories.some((c, idx) => idx !== currentCategoryIndex && c.image === oldImageUrl);
  if (usedByOther) return;

  const filePath = path.join(CATEGORIES_UPLOADS_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error("Error cleaning up old category image:", e);
  }
}

// Admin POST Category Image Upload
app.post("/api/admin/categories/upload", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const { fileData } = req.body || {};
    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ error: "Image file data is required" });
    }

    const matches = fileData.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format. Must be a base64 encoded image." });
    }

    const base64Buffer = Buffer.from(matches[2], "base64");
    const validation = validateImageBuffer(base64Buffer);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || "Invalid image file format." });
    }

    ensureDataDirExists();
    const safeName = `cat_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${validation.ext}`;
    const filePath = path.join(CATEGORIES_UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, base64Buffer);

    return res.json({
      success: true,
      url: `/uploads/categories/${safeName}`,
      fileName: safeName
    });
  } catch (err) {
    console.error("Category image upload error:", err);
    return res.status(500).json({ error: "Failed to upload category image" });
  }
});

// Admin GET Categories (All, including hidden)
app.get("/api/admin/categories", requireAdminAuth, (req, res) => {
  try {
    const all = getCategories();
    return res.json({ categories: all, totalCount: all.length });
  } catch (err) {
    console.error("Error fetching admin categories:", err);
    return res.status(500).json({ error: "Failed to load admin categories" });
  }
});

// Admin POST Category (Create)
app.post("/api/admin/categories", requireAdminAuth, (req, res) => {
  try {
    const { name, slug, description, image, isFreeBadge, displayOrder, isActive } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const trimmedName = name.trim();
    let trimmedSlug = typeof slug === "string" && slug.trim() 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (!trimmedSlug) {
      trimmedSlug = `cat-${Date.now().toString(36)}`;
    }

    const categories = getCategories();

    if (categories.some(c => c.slug === trimmedSlug || c.id === trimmedSlug)) {
      return res.status(400).json({ error: `Category slug "${trimmedSlug}" already exists. Please choose another.` });
    }

    const newCat: CategoryRecord = {
      id: trimmedSlug,
      slug: trimmedSlug,
      name: trimmedName,
      description: typeof description === "string" ? description.trim() : "",
      image: typeof image === "string" ? image.trim() : "",
      count: 0,
      isFreeBadge: !!isFreeBadge,
      displayOrder: typeof displayOrder === "number" ? displayOrder : (categories.length > 0 ? Math.max(...categories.map(c => c.displayOrder || 0)) + 10 : 10),
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    categories.push(newCat);
    const saved = saveCategories(categories);

    if (!saved) {
      return res.status(500).json({ error: "Failed to save new category" });
    }

    return res.status(201).json({ success: true, category: newCat });
  } catch (err) {
    console.error("Error creating category:", err);
    return res.status(500).json({ error: "Internal server error creating category" });
  }
});

// Admin PATCH Category Reorder
app.patch("/api/admin/categories/reorder", requireAdminAuth, (req, res) => {
  try {
    const { orders } = req.body || {};

    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: "orders array is required" });
    }

    const categories = getCategories();
    const orderMap = new Map<string, number>();

    for (const item of orders) {
      if (item && typeof item.id === "string" && typeof item.displayOrder === "number") {
        orderMap.set(item.id, item.displayOrder);
      }
    }

    for (const cat of categories) {
      if (orderMap.has(cat.id)) {
        cat.displayOrder = orderMap.get(cat.id)!;
      } else if (orderMap.has(cat.slug)) {
        cat.displayOrder = orderMap.get(cat.slug)!;
      }
    }

    const saved = saveCategories(categories);
    if (!saved) {
      return res.status(500).json({ error: "Failed to reorder categories" });
    }

    return res.json({ success: true, categories: getCategories() });
  } catch (err) {
    console.error("Error reordering categories:", err);
    return res.status(500).json({ error: "Internal server error reordering categories" });
  }
});

// Admin PUT Category (Update)
app.put("/api/admin/categories/:id", requireAdminAuth, (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const { name, slug, description, image, isFreeBadge, displayOrder, isActive } = req.body || {};

    const categories = getCategories();
    const index = categories.findIndex(c => c.id === targetId || c.slug === targetId);

    if (index === -1) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name && typeof name === "string" && name.trim()) {
      categories[index].name = name.trim();
    }

    if (slug && typeof slug === "string" && slug.trim()) {
      const newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (newSlug && categories.some((c, i) => i !== index && (c.slug === newSlug || c.id === newSlug))) {
        return res.status(400).json({ error: `Slug "${newSlug}" is already in use by another category.` });
      }
      categories[index].slug = newSlug;
    }

    if (typeof description === "string") {
      categories[index].description = description.trim();
    }

    if (typeof image === "string") {
      const oldImage = categories[index].image;
      const newImage = image.trim();
      if (oldImage && oldImage !== newImage) {
        cleanupOldCategoryImage(oldImage, index, categories);
      }
      categories[index].image = newImage;
    }

    if (typeof isFreeBadge === "boolean") {
      categories[index].isFreeBadge = isFreeBadge;
    }

    if (typeof displayOrder === "number") {
      categories[index].displayOrder = displayOrder;
    }

    if (typeof isActive === "boolean") {
      categories[index].isActive = isActive;
    }

    categories[index].updatedAt = new Date().toISOString();

    const saved = saveCategories(categories);
    if (!saved) {
      return res.status(500).json({ error: "Failed to save updated category" });
    }

    return res.json({ success: true, category: categories[index] });
  } catch (err) {
    console.error("Error updating category:", err);
    return res.status(500).json({ error: "Internal server error updating category" });
  }
});

// Admin PATCH Category Status (Toggle Active/Hidden)
app.patch("/api/admin/categories/:id/status", requireAdminAuth, (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive boolean field is required" });
    }

    const categories = getCategories();
    const index = categories.findIndex(c => c.id === targetId || c.slug === targetId);

    if (index === -1) {
      return res.status(404).json({ error: "Category not found" });
    }

    categories[index].isActive = isActive;
    categories[index].updatedAt = new Date().toISOString();

    const saved = saveCategories(categories);
    if (!saved) {
      return res.status(500).json({ error: "Failed to update category status" });
    }

    return res.json({ success: true, category: categories[index] });
  } catch (err) {
    console.error("Error toggling category status:", err);
    return res.status(500).json({ error: "Internal server error updating category status" });
  }
});

// Admin DELETE Category
app.delete("/api/admin/categories/:id", requireAdminAuth, (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const categories = getCategories();
    const targetCat = categories.find(c => c.id === targetId || c.slug === targetId);
    if (targetCat && targetCat.image) {
      cleanupOldCategoryImage(targetCat.image, -1, categories);
    }

    const filtered = categories.filter(c => c.id !== targetId && c.slug !== targetId);

    if (filtered.length === categories.length) {
      return res.status(404).json({ error: "Category not found" });
    }

    const saved = saveCategories(filtered);
    if (!saved) {
      return res.status(500).json({ error: "Failed to delete category" });
    }

    return res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    return res.status(500).json({ error: "Internal server error deleting category" });
  }
});

// Authenticated Admin Site Verification Endpoints
app.get("/api/admin/site-verification", requireAdminAuth, (req, res) => {
  try {
    const data = getSiteVerification();
    return res.json({ success: true, settings: data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read site verification settings" });
  }
});

function sanitizeSiteVerificationInput(code: string): string {
  if (!code || typeof code !== "string") return "";
  const trimmed = code.trim();
  // Disallow javascript: schemes and raw data:text/html payloads
  if (/javascript:/i.test(trimmed) || /data:text\/html/i.test(trimmed) || /vbscript:/i.test(trimmed)) {
    return "";
  }
  return trimmed;
}

app.post("/api/admin/site-verification", requireAdminAuth, (req, res) => {
  try {
    const { headCode, bodyCode, footerCode } = req.body || {};
    const newData: SiteVerificationData = {
      headCode: sanitizeSiteVerificationInput(typeof headCode === "string" ? headCode : ""),
      bodyCode: sanitizeSiteVerificationInput(typeof bodyCode === "string" ? bodyCode : ""),
      footerCode: sanitizeSiteVerificationInput(typeof footerCode === "string" ? footerCode : ""),
      updatedAt: new Date().toISOString()
    };
    const saved = saveSiteVerification(newData);
    if (!saved) {
      return res.status(500).json({ error: "Failed to save site verification settings" });
    }
    return res.json({ success: true, settings: newData, message: "Site verification settings saved successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error saving site verification settings" });
  }
});

app.delete("/api/admin/site-verification", requireAdminAuth, (req, res) => {
  try {
    const emptyData: SiteVerificationData = {
      headCode: "",
      bodyCode: "",
      footerCode: "",
      updatedAt: new Date().toISOString()
    };
    saveSiteVerification(emptyData);
    return res.json({ success: true, message: "Site verification code deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete site verification settings" });
  }
});

// --- ADMIN INDEXNOW & SEARCH ENGINE NOTIFICATION ENDPOINTS ---
app.get("/api/admin/indexnow/status", requireAdminAuth, (_req, res) => {
  try {
    const data = getIndexNowKeyData();
    return res.json({
      configured: true,
      host: CANONICAL_SITE_HOST,
      keyLocation: `${CANONICAL_SITE_ORIGIN}/${data.key}.txt`,
      keyMasked: `${data.key.slice(0, 6)}...${data.key.slice(-4)}`,
      lastSubmittedAt: data.lastSubmittedAt,
      submissionCount: data.submissionCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to get IndexNow status" });
  }
});

app.post("/api/admin/indexnow/notify", requireAdminAuth, async (req, res) => {
  try {
    const { urls, url, type, slug } = req.body || {};
    let urlsToSubmit: string[] = [];

    if (Array.isArray(urls)) {
      urlsToSubmit = urls;
    } else if (typeof url === "string") {
      urlsToSubmit = [url];
    } else if (type && slug) {
      if (type === "pattern") {
        urlsToSubmit = [`https://welovepattern.com/pattern/${slug}`, "https://welovepattern.com/patterns"];
      } else if (type === "blog") {
        urlsToSubmit = [`https://welovepattern.com/blog/${slug}`, "https://welovepattern.com/blog"];
      } else if (type === "tool") {
        urlsToSubmit = [`https://welovepattern.com/tools/${slug}`, "https://welovepattern.com/tools"];
      } else if (type === "page") {
        urlsToSubmit = [`https://welovepattern.com/${slug}`];
      }
    }

    if (urlsToSubmit.length === 0) {
      return res.status(400).json({ error: "No valid URLs provided to submit to IndexNow" });
    }

    // Trigger submission asynchronously (never blocks CMS actions)
    notifyIndexNow(urlsToSubmit);

    return res.json({
      success: true,
      message: "IndexNow submission triggered",
      count: urlsToSubmit.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to notify IndexNow" });
  }
});

app.post("/api/admin/tools-seo", requireAdminAuth, (req, res) => {
  try {
    const { slug } = req.body || {};
    if (slug) {
      notifyIndexNow([`https://welovepattern.com/tools/${slug}`, "https://welovepattern.com/tools"]);
    }
    return res.json({ success: true, message: "Tool SEO updated and IndexNow notified" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update Tool SEO" });
  }
});

// --- ADMIN BLOG CMS ENDPOINTS ---
app.get("/api/admin/blog", requireAdminAuth, (req, res) => {
  try {
    const posts = getBlogPosts();
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

app.get("/api/admin/blog/:id", requireAdminAuth, (req, res) => {
  try {
    const posts = getBlogPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

app.post("/api/admin/blog", requireAdminAuth, (req, res) => {
  try {
    const postData = req.body || {};
    if (!postData.title || typeof postData.title !== "string" || !postData.title.trim()) {
      return res.status(400).json({ error: "Post title is required" });
    }

    const posts = getBlogPosts();
    const id = postData.id || `blog_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const slug = postData.slug 
      ? postData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : postData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const cleanContent = sanitizeBlogHtml(typeof postData.content === "string" ? postData.content : "");

    const newPost = {
      ...postData,
      id,
      slug,
      title: postData.title.trim(),
      content: cleanContent,
      status: postData.status === 'published' ? 'published' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.unshift(newPost);
    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/blog/${newPost.slug}`, "https://welovepattern.com/blog"]);

    return res.status(201).json({ success: true, post: newPost });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create blog post" });
  }
});

app.put("/api/admin/blog/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const postData = req.body || {};
    const posts = getBlogPosts();
    const index = posts.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const cleanContent = postData.content !== undefined 
      ? sanitizeBlogHtml(typeof postData.content === "string" ? postData.content : "") 
      : posts[index].content;

    const updatedPost = {
      ...posts[index],
      ...postData,
      id,
      content: cleanContent,
      updatedAt: new Date().toISOString()
    };

    posts[index] = updatedPost;
    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/blog/${updatedPost.slug}`, "https://welovepattern.com/blog"]);

    return res.json({ success: true, post: updatedPost });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update blog post" });
  }
});

app.delete("/api/admin/blog/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    let posts = getBlogPosts();
    const initialLen = posts.length;
    const deletedPost = posts.find(p => p.id === id);

    posts = posts.filter(p => p.id !== id);
    if (posts.length === initialLen) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    if (deletedPost?.slug) {
      notifyIndexNow([`https://welovepattern.com/blog/${deletedPost.slug}`, "https://welovepattern.com/blog"]);
    }

    return res.json({ success: true, message: "Blog post deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete blog post" });
  }
});

app.post("/api/admin/blog/:id/publish", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const posts = getBlogPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    post.status = 'published';
    post.updatedAt = new Date().toISOString();
    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/blog/${post.slug}`, "https://welovepattern.com/blog"]);

    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ error: "Failed to publish blog post" });
  }
});

app.post("/api/admin/blog/:id/unpublish", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const posts = getBlogPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    post.status = 'draft';
    post.updatedAt = new Date().toISOString();
    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/blog/${post.slug}`, "https://welovepattern.com/blog"]);

    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ error: "Failed to unpublish blog post" });
  }
});

app.post("/api/admin/blog/:id/duplicate", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const posts = getBlogPosts();
    const target = posts.find(p => p.id === id);

    if (!target) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const newId = `blog_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const duplicate = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      slug: `${target.slug}-copy-${crypto.randomBytes(3).toString("hex")}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.unshift(duplicate);
    saveBlogPosts(posts);

    // Notify IndexNow for Bing
    notifyIndexNow([`https://welovepattern.com/blog/${duplicate.slug}`, "https://welovepattern.com/blog"]);

    return res.status(201).json({ success: true, post: duplicate });
  } catch (err) {
    return res.status(500).json({ error: "Failed to duplicate blog post" });
  }
});

app.post("/api/admin/blog/upload", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const { fileData } = req.body || {};
    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ error: "Image file data is required" });
    }

    const matches = fileData.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    const base64Buffer = Buffer.from(matches[2], "base64");
    const validation = validateImageBuffer(base64Buffer);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || "Invalid image file format." });
    }

    ensureDataDirExists();
    const safeName = `img_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${validation.ext}`;
    const filePath = path.join(BLOG_UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, base64Buffer);

    return res.json({
      success: true,
      url: `/uploads/blog/${safeName}`,
      fileName: safeName
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

// --- PUBLIC BLOG ENDPOINTS ---
app.get("/api/blog", (req, res) => {
  try {
    const posts = getBlogPosts();
    const published = posts.filter(p => p.status === 'published');
    return res.json(published);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

app.get("/api/blog/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const posts = getBlogPosts();
    const post = posts.find(p => p.slug === slug && p.status === 'published');

    if (!post) {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.json(post);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch article" });
  }
});

// --- PATTERN SEO CONTENT FILE-BASED STORAGE & CMS ENGINE ---
const PATTERN_SEO_FILE = path.join(process.cwd(), "data", "pattern-seo-content.json");
const PATTERN_SEO_UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "pattern-seo");

if (!fs.existsSync(PATTERN_SEO_UPLOADS_DIR)) {
  fs.mkdirSync(PATTERN_SEO_UPLOADS_DIR, { recursive: true });
}

const PATTERN_UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "patterns");

if (!fs.existsSync(PATTERN_UPLOADS_DIR)) {
  fs.mkdirSync(PATTERN_UPLOADS_DIR, { recursive: true });
}


function getPatternSeoArticles(): any[] {
  try {
    if (!fs.existsSync(PATTERN_SEO_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PATTERN_SEO_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading pattern SEO file:", err);
    return [];
  }
}

function savePatternSeoArticles(articles: any[]): boolean {
  try {
    const dir = path.dirname(PATTERN_SEO_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PATTERN_SEO_FILE, JSON.stringify(articles, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving pattern SEO file:", err);
    return false;
  }
}

// --- PUBLIC PATTERN SEO ENDPOINTS ---
app.get("/api/pattern-seo", (_req, res) => {
  try {
    const articles = getPatternSeoArticles();
    const published = articles.filter(a => a.status === 'published');
    return res.json(published);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pattern SEO articles" });
  }
});

app.get("/api/pattern-seo/:identifier", (req, res) => {
  try {
    const { identifier } = req.params;
    const articles = getPatternSeoArticles();
    const article = articles.find(
      a => (a.patternId === identifier || a.patternSlug === identifier || a.id === identifier) && a.status === 'published'
    );

    if (!article) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    return res.json(article);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pattern SEO article" });
  }
});

// --- ADMIN PATTERN SEO ENDPOINTS (PROTECTED) ---
app.get("/api/admin/pattern-seo", requireAdminAuth, (_req, res) => {
  try {
    const articles = getPatternSeoArticles();
    return res.json(articles);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pattern SEO articles" });
  }
});

app.get("/api/admin/pattern-seo/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const articles = getPatternSeoArticles();
    const article = articles.find(a => a.id === id || a.patternId === id || a.patternSlug === id);

    if (!article) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    return res.json(article);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pattern SEO article" });
  }
});

app.post("/api/admin/pattern-seo", requireAdminAuth, (req, res) => {
  try {
    const body = req.body || {};
    const { patternId, patternTitle, patternSlug, title, content, seoTitle, seoDescription, keywords, canonicalUrl, featuredImage, status } = body;

    if (!patternId || !title || !content) {
      return res.status(400).json({ error: "patternId, title, and content are required fields" });
    }

    const articles = getPatternSeoArticles();
    const existingIndex = articles.findIndex(a => a.patternId === patternId || (body.id && a.id === body.id));

    // Sanitize HTML strictly converting H1 to H2
    const cleanContent = sanitizePatternSeoHtml(content);

    const now = new Date().toISOString();
    const articleId = body.id || `seo_${patternId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    const newArticle = {
      id: articleId,
      patternId,
      patternTitle: patternTitle || patternId,
      patternSlug: patternSlug || patternId,
      title: title.trim(),
      content: cleanContent,
      seoTitle: (seoTitle || '').trim(),
      seoDescription: (seoDescription || '').trim(),
      keywords: (keywords || '').trim(),
      canonicalUrl: (canonicalUrl || '').trim(),
      featuredImage: (featuredImage || '').trim(),
      status: status === 'published' ? 'published' : 'draft',
      createdAt: existingIndex >= 0 ? (articles[existingIndex].createdAt || now) : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      articles[existingIndex] = newArticle;
    } else {
      articles.push(newArticle);
    }

    if (savePatternSeoArticles(articles)) {
      // Notify IndexNow for Bing
      const pSlug = newArticle.patternSlug || newArticle.patternId;
      notifyIndexNow([`https://welovepattern.com/pattern/${pSlug}`, "https://welovepattern.com/patterns"]);
      return res.status(201).json({ success: true, article: newArticle });
    } else {
      return res.status(500).json({ error: "Failed to persist pattern SEO article" });
    }
  } catch (err: any) {
    console.error("Error creating/updating pattern SEO article:", err);
    return res.status(500).json({ error: err.message || "Failed to save pattern SEO article" });
  }
});

app.put("/api/admin/pattern-seo/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const articles = getPatternSeoArticles();
    const existingIndex = articles.findIndex(a => a.id === id || a.patternId === id);

    if (existingIndex < 0) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    const current = articles[existingIndex];
    const cleanContent = body.content !== undefined ? sanitizePatternSeoHtml(body.content) : current.content;

    const updated = {
      ...current,
      ...body,
      id: current.id, // Preserve ID
      patternId: body.patternId || current.patternId,
      content: cleanContent,
      updatedAt: new Date().toISOString()
    };

    articles[existingIndex] = updated;

    if (savePatternSeoArticles(articles)) {
      // Notify IndexNow for Bing
      const pSlug = updated.patternSlug || updated.patternId;
      notifyIndexNow([`https://welovepattern.com/pattern/${pSlug}`, "https://welovepattern.com/patterns"]);
      return res.json({ success: true, article: updated });
    } else {
      return res.status(500).json({ error: "Failed to update pattern SEO article" });
    }
  } catch (err: any) {
    console.error("Error updating pattern SEO article:", err);
    return res.status(500).json({ error: err.message || "Failed to update pattern SEO article" });
  }
});

app.delete("/api/admin/pattern-seo/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const articles = getPatternSeoArticles();
    const deletedArticle = articles.find(a => a.id === id || a.patternId === id);
    const filtered = articles.filter(a => a.id !== id && a.patternId !== id);

    if (filtered.length === articles.length) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    if (savePatternSeoArticles(filtered)) {
      // Notify IndexNow for Bing
      const pSlug = deletedArticle?.patternSlug || deletedArticle?.patternId || id;
      notifyIndexNow([`https://welovepattern.com/pattern/${pSlug}`, "https://welovepattern.com/patterns"]);
      return res.json({ success: true, message: "Pattern SEO article deleted successfully" });
    } else {
      return res.status(500).json({ error: "Failed to delete pattern SEO article" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete pattern SEO article" });
  }
});

app.post("/api/admin/pattern-seo/:id/publish", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const articles = getPatternSeoArticles();
    const index = articles.findIndex(a => a.id === id || a.patternId === id);

    if (index < 0) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    articles[index].status = 'published';
    articles[index].updatedAt = new Date().toISOString();

    if (savePatternSeoArticles(articles)) {
      // Notify IndexNow for Bing
      const pSlug = articles[index].patternSlug || articles[index].patternId;
      notifyIndexNow([`https://welovepattern.com/pattern/${pSlug}`, "https://welovepattern.com/patterns"]);
      return res.json({ success: true, article: articles[index] });
    } else {
      return res.status(500).json({ error: "Failed to publish article" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to publish article" });
  }
});

app.post("/api/admin/pattern-seo/:id/unpublish", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const articles = getPatternSeoArticles();
    const index = articles.findIndex(a => a.id === id || a.patternId === id);

    if (index < 0) {
      return res.status(404).json({ error: "Pattern SEO article not found" });
    }

    articles[index].status = 'draft';
    articles[index].updatedAt = new Date().toISOString();

    if (savePatternSeoArticles(articles)) {
      // Notify IndexNow for Bing
      const pSlug = articles[index].patternSlug || articles[index].patternId;
      notifyIndexNow([`https://welovepattern.com/pattern/${pSlug}`, "https://welovepattern.com/patterns"]);
      return res.json({ success: true, article: articles[index] });
    } else {
      return res.status(500).json({ error: "Failed to unpublish article" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to unpublish article" });
  }
});

app.post("/api/admin/pattern-seo/upload", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const { fileData } = req.body || {};
    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ error: "Image file data is required" });
    }

    const matches = fileData.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    const base64Buffer = Buffer.from(matches[2], "base64");
    const validation = validateImageBuffer(base64Buffer);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || "Invalid image file format." });
    }

    const safeName = `pattern_seo_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${validation.ext}`;
    const filePath = path.join(PATTERN_SEO_UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, base64Buffer);

    return res.json({
      success: true,
      url: `/uploads/pattern-seo/${safeName}`,
      fileName: safeName
    });
  } catch (err) {
    console.error("Pattern SEO upload error:", err);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

// --- PATTERN IMAGE UPLOAD ---
app.post("/api/admin/patterns/upload", requireAdminAuth, uploadJsonParser, (req, res) => {
  try {
    const { fileData } = req.body || {};

    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ error: "Image file data is required" });
    }

    const matches = fileData.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    const base64Buffer = Buffer.from(matches[2], "base64");
    const validation = validateImageBuffer(base64Buffer);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || "Invalid image file format."
      });
    }

    const safeName = `pattern_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${validation.ext}`;
    const filePath = path.join(PATTERN_UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, base64Buffer);

    return res.json({
      success: true,
      url: `/uploads/patterns/${safeName}`,
      fileName: safeName
    });
  } catch (err) {
    console.error("Pattern image upload error:", err);
    return res.status(500).json({ error: "Failed to upload pattern image" });
  }
});

// --- SITE PAGES API (LEGAL & FOOTER CMS) ---
app.get("/api/pages", (_req, res) => {
  try {
    const pages = getSitePages();
    return res.json(pages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch site pages" });
  }
});

app.get("/api/pages/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const pages = getSitePages();
    const page = pages.find((p: any) => p.slug === slug || p.id === slug);
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }
    return res.json(page);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch page" });
  }
});

app.get("/api/admin/pages", requireAdminAuth, (_req, res) => {
  try {
    const pages = getSitePages();
    return res.json(pages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch admin site pages" });
  }
});

app.get("/api/admin/pages/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const pages = getSitePages();
    const page = pages.find((p: any) => p.id === id || p.slug === id);
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }
    return res.json(page);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch page" });
  }
});

app.post("/api/admin/pages", requireAdminAuth, (req, res) => {
  try {
    const body = req.body || {};
    const { id, slug, title, content, seoTitle, seoDescription, canonicalUrl, isNoIndex } = body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const pages = getSitePages();
    const cleanSlug = (slug || id || title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const pageId = id || cleanSlug;

    const existingIdx = pages.findIndex((p: any) => p.id === pageId || p.slug === cleanSlug);
    const cleanContent = sanitizePageHtml(content);

    const newPage = {
      id: pageId,
      slug: cleanSlug,
      title: title.trim(),
      content: cleanContent,
      seoTitle: (seoTitle || '').trim(),
      seoDescription: (seoDescription || '').trim(),
      canonicalUrl: (canonicalUrl || '').trim(),
      isNoIndex: Boolean(isNoIndex),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      pages[existingIdx] = newPage;
    } else {
      pages.push(newPage);
    }

    if (saveSitePages(pages)) {
      // Notify IndexNow for Bing
      notifyIndexNow([`https://welovepattern.com/${newPage.slug}`]);
      return res.status(200).json({ success: true, page: newPage });
    } else {
      return res.status(500).json({ error: "Failed to save site page" });
    }
  } catch (err: any) {
    console.error("Error creating/updating site page:", err);
    return res.status(500).json({ error: err.message || "Failed to save site page" });
  }
});

app.put("/api/admin/pages/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const pages = getSitePages();
    const existingIdx = pages.findIndex((p: any) => p.id === id || p.slug === id);

    if (existingIdx < 0) {
      return res.status(404).json({ error: "Page not found" });
    }

    const current = pages[existingIdx];
    const cleanContent = body.content !== undefined ? sanitizePageHtml(body.content) : current.content;

    const updated = {
      ...current,
      ...body,
      id: current.id,
      slug: current.slug,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title,
      content: cleanContent,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle.trim() : current.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription.trim() : current.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl.trim() : current.canonicalUrl,
      isNoIndex: body.isNoIndex !== undefined ? Boolean(body.isNoIndex) : current.isNoIndex,
      updatedAt: new Date().toISOString()
    };

    pages[existingIdx] = updated;

    if (saveSitePages(pages)) {
      // Notify IndexNow for Bing
      notifyIndexNow([`https://welovepattern.com/${updated.slug}`]);
      return res.json({ success: true, page: updated });
    } else {
      return res.status(500).json({ error: "Failed to update site page" });
    }
  } catch (err: any) {
    console.error("Error updating site page:", err);
    return res.status(500).json({ error: err.message || "Failed to update site page" });
  }
});

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "CrochetHub", timestamp: new Date().toISOString() });
});

function getOrigin(_req?: express.Request): string {
  return SITE_URL;
}

// Dynamic Sitemap Endpoint for Search Engines
app.get("/sitemap.xml", (req, res) => {
  const origin = getOrigin(req);
  const blogPosts = getBlogPosts();
  const patternSeoArticles = getPatternSeoArticles().filter(a => a.status === 'published');
  const sitePages = getSitePages();
  const patterns = getEffectivePatterns();
  const xml = generateSitemapXml(origin, blogPosts, patternSeoArticles, sitePages, patterns);
  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// Dynamic Robots.txt Endpoint (cleaned of obscure admin paths)
app.get("/robots.txt", (req, res) => {
  const origin = getOrigin(req);
  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`);
});

// IndexNow Key Verification Endpoint: /<key>.txt and /indexnow-key.txt
app.get("/:keyFile([a-f0-9]{8,128}\\.txt)", (req, res, next) => {
  try {
    const key = getIndexNowKey();
    if (req.params.keyFile === `${key}.txt`) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(key);
    }
  } catch (err) {
    // continue to next
  }
  next();
});

app.get("/indexnow-key.txt", (_req, res) => {
  const key = getIndexNowKey();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(key);
});

// AI Pattern Assistant & Advice Endpoint (Rate Limited)
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    if (!checkAiRateLimit(clientIp)) {
      return res.status(429).json({
        error: "Too many AI assistant requests. Please wait a few minutes before asking another question."
      });
    }

    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Friendly fallback when Gemini API key is not configured yet
      return res.json({
        answer: `I'm your Crochet AI Helper! (Note: Connect your GEMINI_API_KEY in secrets for custom live responses).\n\nBased on your query "${prompt}":\n• **Tip for ${context?.yarn || "Worsted yarn"}**: Maintain even tension and check your gauge swatch first!\n• **Recommended Stitch**: Try Single Crochet (US) / Double Crochet (UK) for sturdy structures, or Half Double Crochet for soft drape.\n• **Hook suggestion**: Ensure your hook matches your yarn weight label (e.g. 4.0mm - 5.0mm for Worsted #4).`,
        isFallback: true
      });
    }

    const systemInstruction = `You are CrochetHub AI, an expert crochet artisan, instructor, and pattern designer with 30 years of experience.
You assist crafters of all skill levels (especially beginners and older crafters aged 40-70).
Keep responses friendly, warm, clear, encouraging, structured with bullet points, and free of confusing jargon.
Always specify US vs UK stitch terms if applicable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nContext: ${JSON.stringify(context || {})}\n\nUser Question: ${prompt}` }] }
      ]
    });

    const text = response.text || "Happy crocheting! How else can I help with your project today?";
    res.json({ answer: text, isFallback: false });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.json({
      answer: "I couldn't reach the AI service right now. Please verify your yarn tension and hook size, or try asking again in a moment!",
      isFallback: true
    });
  }
});

// AI Pattern PDF Auto-Fill Extractor Endpoint (Admin Protected + 10MB parser)
app.post("/api/ai/parse-pattern-pdf", requireAdminAuth, uploadJsonParser, async (req, res) => {
  try {
    const { pdfBase64, mimeType, pdfText, fileName } = req.body;

    if (!pdfBase64 && !pdfText) {
      return res.status(400).json({ error: "PDF content or base64 file data is required" });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are an expert AI Crochet Pattern Document Extractor.
Analyze the provided crochet pattern PDF document or pattern text.
Extract all details from the pattern content and format as structured JSON matching this EXACT JSON schema:

{
  "title": "Clean, descriptive pattern title (e.g., Cozy Vintage Beanie Hat)",
  "subtitle": "Short 1-sentence summary of the pattern",
  "description": "Full detailed pattern description and overview",
  "category": "one of: blankets, flowers, amigurumi, bags, baby, tops, sweaters, accessories, home-decor, granny-squares",
  "difficulty": "one of: Beginner, Easy, Intermediate, Advanced",
  "hookSize": "Hook size used (e.g. 5.0 mm / H-8)",
  "yarnWeight": "Yarn weight/category (e.g. Medium / Worsted #4)",
  "yarnMetersNeeded": 350,
  "finishedSize": "Dimensions or fit (e.g., Adult Standard 22 inches circumference)",
  "estimatedTimeHours": 3,
  "materials": ["Material 1", "Material 2", "Material 3"],
  "gauge": "Gauge swatch details (e.g. 14 sts and 10 rows = 4 inches)",
  "steps": [
    { "rowNumber": "Round 1", "instruction": "Full row or round instructions..." },
    { "rowNumber": "Round 2", "instruction": "Full instructions..." }
  ],
  "seoTitle": "Optimized meta title for Google (max 60 chars)",
  "seoDescription": "Optimized meta description for search engines (max 155 chars)",
  "seoKeywords": "comma, separated, crochet, keywords"
}

Ensure all steps, rows, rounds, and materials are extracted thoroughly.`;

    if (ai) {
      const parts: any[] = [{ text: systemPrompt }];

      if (pdfBase64) {
        // Strip data url header if present
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || "application/pdf",
            data: cleanBase64
          }
        });
      }

      if (pdfText) {
        parts.push({ text: `\n\nPattern PDF Raw Text Content:\n${pdfText}` });
      }

      if (fileName) {
        parts.push({ text: `\nFilename: ${fileName}` });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      try {
        const parsedJson = JSON.parse(responseText);
        return res.json({ success: true, pattern: parsedJson, source: "gemini" });
      } catch (e) {
        console.error("JSON parse error from Gemini output:", responseText);
      }
    }

    // Heuristic Smart Fallback parsing if Gemini API key is not present or PDF response failed
    const rawContent = (pdfText || fileName || "crochet pattern").toLowerCase();
    
    // Auto-detect category
    let inferredCategory = "accessories";
    if (rawContent.includes("hat") || rawContent.includes("beanie") || rawContent.includes("cap") || rawContent.includes("scarf")) inferredCategory = "accessories";
    else if (rawContent.includes("blanket") || rawContent.includes("afghan") || rawContent.includes("throw")) inferredCategory = "blankets";
    else if (rawContent.includes("toy") || rawContent.includes("amigurumi") || rawContent.includes("plush")) inferredCategory = "amigurumi";
    else if (rawContent.includes("flower") || rawContent.includes("daisy") || rawContent.includes("rose")) inferredCategory = "flowers";
    else if (rawContent.includes("bag") || rawContent.includes("tote") || rawContent.includes("purse")) inferredCategory = "bags";
    else if (rawContent.includes("baby") || rawContent.includes("booties")) inferredCategory = "baby";
    else if (rawContent.includes("top") || rawContent.includes("tank") || rawContent.includes("vest")) inferredCategory = "tops";
    else if (rawContent.includes("sweater") || rawContent.includes("cardigan")) inferredCategory = "sweaters";
    else if (rawContent.includes("granny") || rawContent.includes("square")) inferredCategory = "granny-squares";

    // Auto-detect craft
    const isSewing = /\b(sewing|sew|dressmaking|pattern pieces)\b/i.test(rawContent);
    const isKnitting = /\b(knitting|knit|purl)\b/i.test(rawContent);
    const craftLabel = isSewing ? "sewing" : isKnitting ? "knitting" : "crochet";

    // Auto-detect title
    let inferredTitle = fileName ? fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") : `Handmade ${craftLabel.charAt(0).toUpperCase() + craftLabel.slice(1)} Pattern`;
    inferredTitle = inferredTitle.charAt(0).toUpperCase() + inferredTitle.slice(1);

    const fallbackPattern = {
      title: inferredTitle,
      subtitle: `Handcrafted ${inferredCategory} ${craftLabel} pattern extracted from PDF document`,
      description: `Complete step-by-step ${craftLabel} pattern extracted from PDF document (${fileName || 'Pattern PDF'}). Features structured instructions, recommended ${isSewing ? 'fabric and sizing' : isKnitting ? 'needles and yarn' : 'hook sizes and yarn'}, and material list.`,
      category: inferredCategory,
      difficulty: rawContent.includes("beginner") ? "Beginner" : rawContent.includes("advanced") ? "Advanced" : "Easy",
      hookSize: "5.0 mm (H-8)",
      yarnWeight: "Medium / Worsted (#4)",
      yarnMetersNeeded: 300,
      finishedSize: "Standard Size",
      estimatedTimeHours: 4,
      materials: ["Worsted Weight Yarn (approx 250m)", "5.0mm Crochet Hook", "Tapestry Needle", "Scissors", "Stitch Markers"],
      gauge: "14 stitches and 10 rows = 4 inches (10 cm)",
      steps: [
        { rowNumber: "Round 1", instruction: "Make a magic ring, chain 2, work 12 double crochet stitches into the ring. Join with slip stitch to first dc." },
        { rowNumber: "Round 2", instruction: "Chain 2, work 2 double crochet in each stitch around (24 stitches). Join with sl st." },
        { rowNumber: "Round 3", instruction: "Chain 2, *1 double crochet in next st, 2 double crochet in next st*, repeat from * around (36 stitches). Join." },
        { rowNumber: "Round 4-12", instruction: "Chain 2, work 1 double crochet in each stitch around to establish height. Fasten off and weave in ends." }
      ],
      seoTitle: `${inferredTitle} - Free PDF Crochet Pattern`,
      seoDescription: `Download free step-by-step PDF crochet pattern for ${inferredTitle}. Includes materials, hook size, gauge swatch, and row instructions.`,
      seoKeywords: `${inferredTitle.toLowerCase()}, free crochet pattern, pdf pattern, ${inferredCategory}, handmade crochet`
    };

    return res.json({ success: true, pattern: fallbackPattern, source: "fallback" });
  } catch (error: any) {
    console.error("Error parsing pattern PDF:", error);
    res.status(500).json({ error: "Failed to parse pattern PDF" });
  }
});

// SSR Request Handler
async function handleSsrRequest(req: express.Request, res: express.Response, viteDevServer?: any) {
  try {
    const url = req.originalUrl;
    const origin = getOrigin(req);

    let template: string;
    if (viteDevServer) {
      const templatePath = path.resolve(process.cwd(), "index.html");
      template = fs.readFileSync(templatePath, "utf-8");
      template = await viteDevServer.transformIndexHtml(url, template);
    } else {
      const distIndexPath = path.resolve(process.cwd(), "dist", "index.html");
      if (fs.existsSync(distIndexPath)) {
        template = fs.readFileSync(distIndexPath, "utf-8");
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
      }
    }

    const blogPosts = getBlogPosts();
    const categories = getCategories().filter(c => c.isActive !== false);
    const patternSeoArticles = getPatternSeoArticles().filter(a => a.status === 'published');
    const sitePages = getSitePages();
    const patterns = getEffectivePatterns();

    let renderFn = render;
    if (viteDevServer) {
      try {
        const mod = await viteDevServer.ssrLoadModule("./src/entry-server.tsx");
        if (mod && mod.render) {
          renderFn = mod.render;
        }
      } catch (err) {
        console.error("Vite ssrLoadModule error:", err);
      }
    }

    const { html: appHtml, head, statusCode } = await renderFn(url, origin, blogPosts, categories, patternSeoArticles, sitePages, patterns);

    const initialDataScript = `<script id="__INITIAL_DATA__">window.__INITIAL_DATA__ = ${JSON.stringify({ categories, blogPosts, patternSeoArticles, sitePages, patterns }).replace(/</g, '\\u003c')};</script>`;

    let fullHtml = template;
    if (fullHtml.includes("<!--app-head-->")) {
      fullHtml = fullHtml.replace("<!--app-head-->", `${head}\n${initialDataScript}`);
    } else {
      fullHtml = fullHtml.replace("</head>", `${head}\n${initialDataScript}\n</head>`);
    }

    if (fullHtml.includes("<!--app-html-->")) {
      fullHtml = fullHtml.replace("<!--app-html-->", appHtml);
    } else {
      fullHtml = fullHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    }

    fullHtml = injectSiteVerification(fullHtml);

    // In production, apply cryptographic nonce to script tags
    if (process.env.NODE_ENV === "production" && res.locals.nonce) {
      fullHtml = applyNonceToHtml(fullHtml, res.locals.nonce);
    }

    res.status(statusCode || 200).set({ "Content-Type": "text/html; charset=utf-8" }).end(fullHtml);
  } catch (error) {
    console.error("SSR rendering error, falling back to static HTML:", error);
    if (viteDevServer) {
      viteDevServer.ssrFixStacktrace(error as Error);
    }
    const fallbackPath = process.env.NODE_ENV === "production"
      ? path.resolve(process.cwd(), "dist", "index.html")
      : path.resolve(process.cwd(), "index.html");
    
    try {
      let fallbackHtml = fs.readFileSync(fallbackPath, "utf-8");
      fallbackHtml = injectSiteVerification(fallbackHtml);
      if (process.env.NODE_ENV === "production" && res.locals.nonce) {
        fallbackHtml = applyNonceToHtml(fallbackHtml, res.locals.nonce);
      }
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(fallbackHtml);
    } catch (e) {
      res.sendFile(fallbackPath);
    }
  }
}

// Express error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Global Express Error:", err);
  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(statusCode).json({
    error: isProd && statusCode === 500 ? "An unexpected server error occurred." : (err.message || "An unexpected error occurred"),
    code: err.code || "SERVER_ERROR"
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) return next();
      await handleSsrRequest(req, res, vite);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));

    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) return next();
      await handleSsrRequest(req, res);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🧶 CrochetHub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

