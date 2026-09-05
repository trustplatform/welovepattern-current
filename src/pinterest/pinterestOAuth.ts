import fs from "fs";
import path from "path";
import crypto from "crypto";
import { SafePinterestStatus, SafePinterestAccount } from "../types";

// Persistent secure storage path (strictly blocked from static/public serving)
const DATA_DIR = path.join(process.cwd(), "data");
const PINTEREST_AUTH_FILE = path.join(DATA_DIR, "pinterest-auth.json");

// Strictly requested scopes for WeLovePattern Pinterest Integration
export const PINTEREST_SCOPES = [
  "boards:read",
  "pins:read",
  "pins:write",
  "user_accounts:read"
] as const;

export interface PinterestAuthRecord {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope: string;
  expiresIn?: number;
  expiresAt?: number;
  refreshTokenExpiresIn?: number;
  refreshTokenExpiresAt?: number;
  account?: SafePinterestAccount;
  connectedAt: string;
  updatedAt: string;
}

interface OAuthStateRecord {
  state: string;
  adminSessionToken: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory single-use cryptographic state map for CSRF protection
const activeOAuthStates = new Map<string, OAuthStateRecord>();

/**
 * Derives the canonical OAuth Redirect URI.
 * Production default: https://welovepattern.com/api/admin/pinterest/callback
 * Overridable via PINTEREST_REDIRECT_URI environment variable if testing in custom/dev environments.
 */
export function getPinterestRedirectUri(): string {
  const envUri = process.env.PINTEREST_REDIRECT_URI;
  if (envUri && envUri.trim()) {
    return envUri.trim();
  }
  return "https://welovepattern.com/api/admin/pinterest/callback";
}

/**
 * Checks if Pinterest App credentials are configured in environment variables.
 */
export function isPinterestConfigured(): {
  configured: boolean;
  appIdConfigured: boolean;
  appSecretConfigured: boolean;
  appId: string;
  appSecret: string;
} {
  const appId = (process.env.PINTEREST_APP_ID || "").trim();
  const appSecret = (process.env.PINTEREST_APP_SECRET || "").trim();
  const appIdConfigured = appId.length > 0;
  const appSecretConfigured = appSecret.length > 0;

  return {
    configured: appIdConfigured && appSecretConfigured,
    appIdConfigured,
    appSecretConfigured,
    appId,
    appSecret
  };
}

/**
 * Safely loads the stored Pinterest credentials from server-side disk.
 * Returns null if file does not exist, is empty, or is invalid.
 */
export function getPinterestAuthRecord(): PinterestAuthRecord | null {
  try {
    if (!fs.existsSync(PINTEREST_AUTH_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(PINTEREST_AUTH_FILE, "utf-8").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.accessToken !== "string" || !parsed.accessToken) {
      return null;
    }
    return parsed as PinterestAuthRecord;
  } catch (err) {
    console.error("Error reading Pinterest auth credentials from server storage:", err);
    return null;
  }
}

/**
 * Securely writes Pinterest credentials to server-side file with restricted file permissions (0o600).
 */
export function savePinterestAuthRecord(record: PinterestAuthRecord): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PINTEREST_AUTH_FILE, JSON.stringify(record, null, 2), {
      encoding: "utf-8",
      mode: 0o600
    });
    return true;
  } catch (err) {
    console.error("Error saving Pinterest auth credentials to server storage:", err);
    return false;
  }
}

/**
 * Deletes the stored Pinterest credentials upon admin disconnect.
 */
export function clearPinterestAuthRecord(): boolean {
  try {
    if (fs.existsSync(PINTEREST_AUTH_FILE)) {
      fs.unlinkSync(PINTEREST_AUTH_FILE);
    }
    return true;
  } catch (err) {
    console.error("Error deleting Pinterest auth credentials:", err);
    return false;
  }
}

/**
 * Generates a cryptographically secure, single-use state token associated with the Admin's session.
 * Expiry: 10 minutes.
 */
export function createOAuthState(adminSessionToken: string): string {
  // Prune expired states first
  const now = Date.now();
  for (const [key, val] of activeOAuthStates.entries()) {
    if (now > val.expiresAt) {
      activeOAuthStates.delete(key);
    }
  }

  const rawRandom = crypto.randomBytes(32).toString("hex");
  const state = `pin_state_${rawRandom}`;

  activeOAuthStates.set(state, {
    state,
    adminSessionToken,
    createdAt: now,
    expiresAt: now + 10 * 60 * 1000 // 10 minutes
  });

  return state;
}

/**
 * Validates and immediately consumes the OAuth state parameter on callback.
 * Ensures the state exists, is not expired, matches the admin session, and prevents replay attacks.
 */
export function validateAndConsumeOAuthState(
  state: string,
  isValidAdminSession: (token: string) => boolean,
  reqCookieToken?: string | null
): { valid: boolean; error?: string } {
  if (!state || typeof state !== "string") {
    return {
      valid: false,
      error: "Missing OAuth state parameter. Request rejected for CSRF protection."
    };
  }

  const record = activeOAuthStates.get(state);
  if (!record) {
    return {
      valid: false,
      error: "Invalid or unrecognized OAuth state. Request rejected for CSRF protection."
    };
  }

  // Single-use: delete immediately to prevent replay attacks
  activeOAuthStates.delete(state);

  if (Date.now() > record.expiresAt) {
    return {
      valid: false,
      error: "OAuth authorization state has expired. Please initiate connection again from Admin."
    };
  }

  if (!isValidAdminSession(record.adminSessionToken)) {
    return {
      valid: false,
      error: "The Admin session that initiated this connection is no longer active. Please log in to Admin again."
    };
  }

  // If the browser sent an admin_session cookie with the callback, verify session match
  if (reqCookieToken && reqCookieToken !== record.adminSessionToken) {
    return {
      valid: false,
      error: "Admin session mismatch during OAuth callback. Request rejected for security."
    };
  }

  return { valid: true };
}

/**
 * Builds the official Pinterest OAuth 2.0 authorization URL.
 */
export function buildPinterestAuthUrl(state: string, redirectUri: string): { url: string; error?: string } {
  const { configured, appId, appIdConfigured, appSecretConfigured } = isPinterestConfigured();

  if (!configured) {
    const missing: string[] = [];
    if (!appIdConfigured) missing.push("PINTEREST_APP_ID");
    if (!appSecretConfigured) missing.push("PINTEREST_APP_SECRET");
    return {
      url: "",
      error: `Pinterest API credentials not configured in environment variables (${missing.join(", ")}).`
    };
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: PINTEREST_SCOPES.join(","),
    state: state
  });

  return {
    url: `https://www.pinterest.com/oauth/?${params.toString()}`
  };
}

/**
 * Exchanges the OAuth authorization code for access and refresh tokens with Pinterest API v5.
 * Uses HTTP Basic Authentication as required by Pinterest API: base64(app_id:app_secret).
 */
export async function exchangePinterestCode(
  code: string,
  redirectUri: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { configured, appId, appSecret } = isPinterestConfigured();
  if (!configured) {
    return {
      success: false,
      error: "Pinterest App credentials (PINTEREST_APP_ID / PINTEREST_APP_SECRET) are missing from server environment."
    };
  }

  try {
    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString("base64");
    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: redirectUri
    });

    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyParams.toString()
    });

    const rawText = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      // not JSON
    }

    if (!response.ok) {
      const errorMsg = json?.message || json?.error_description || json?.error || rawText || `HTTP ${response.status}`;
      return {
        success: false,
        error: `Pinterest token exchange failed: ${errorMsg}`
      };
    }

    if (!json || !json.access_token) {
      return {
        success: false,
        error: "Pinterest returned an invalid token response missing access_token."
      };
    }

    return {
      success: true,
      data: json
    };
  } catch (err: any) {
    console.error("Exception during Pinterest token exchange:", err);
    return {
      success: false,
      error: err?.message || "Network error communicating with Pinterest token endpoint."
    };
  }
}

/**
 * Refreshes an expired Pinterest access token using a refresh token.
 */
export async function refreshPinterestToken(
  refreshToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { configured, appId, appSecret } = isPinterestConfigured();
  if (!configured) {
    return { success: false, error: "Pinterest credentials not configured." };
  }

  try {
    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString("base64");
    const bodyParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
      scope: PINTEREST_SCOPES.join(",")
    });

    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyParams.toString()
    });

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json?.message || json?.error || "Failed to refresh token"
      };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to refresh token" };
  }
}

/**
 * Fetches user profile data from Pinterest API v5 using the access token.
 */
export async function fetchPinterestUserAccount(
  accessToken: string
): Promise<{ success: boolean; account?: SafePinterestAccount; error?: string }> {
  try {
    const response = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Failed to fetch account info: HTTP ${response.status} - ${text}`
      };
    }

    const data = await response.json();
    const account: SafePinterestAccount = {
      username: data.username,
      businessName: data.business_name || data.account_type === "BUSINESS" ? (data.business_name || data.username) : undefined,
      profileImage: data.profile_image,
      accountType: data.account_type
    };

    return { success: true, account };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch user account" };
  }
}

/**
 * Returns safe Pinterest connection status for the Admin UI.
 * NEVER exposes accessToken, refreshToken, or client secrets.
 */
export async function getSafePinterestStatus(): Promise<SafePinterestStatus> {
  const { configured, appIdConfigured, appSecretConfigured } = isPinterestConfigured();
  const redirectUri = getPinterestRedirectUri();

  const record = getPinterestAuthRecord();
  if (!record || !record.accessToken) {
    return {
      connected: false,
      configured,
      appIdConfigured,
      appSecretConfigured,
      redirectUri,
      account: null,
      scope: null,
      connectedAt: null,
      expiresAt: null,
      isExpired: false
    };
  }

  const now = Date.now();
  let isExpired = false;
  let recordToReturn = record;

  // If token has an expiresAt and is within 5 minutes of expiring, attempt auto-refresh
  if (record.expiresAt && now > record.expiresAt - 5 * 60 * 1000 && record.refreshToken) {
    const refreshRes = await refreshPinterestToken(record.refreshToken);
    if (refreshRes.success && refreshRes.data) {
      const refreshedData = refreshRes.data;
      const updatedRecord: PinterestAuthRecord = {
        ...record,
        accessToken: refreshedData.access_token,
        refreshToken: refreshedData.refresh_token || record.refreshToken,
        expiresIn: refreshedData.expires_in,
        expiresAt: refreshedData.expires_in ? now + refreshedData.expires_in * 1000 : record.expiresAt,
        updatedAt: new Date().toISOString()
      };
      savePinterestAuthRecord(updatedRecord);
      recordToReturn = updatedRecord;
    } else {
      // If expired and refresh failed
      if (now > record.expiresAt) {
        isExpired = true;
      }
    }
  } else if (record.expiresAt && now > record.expiresAt) {
    isExpired = true;
  }

  return {
    connected: !isExpired,
    configured,
    appIdConfigured,
    appSecretConfigured,
    redirectUri,
    account: recordToReturn.account || null,
    scope: recordToReturn.scope || null,
    connectedAt: recordToReturn.connectedAt || null,
    expiresAt: recordToReturn.expiresAt || null,
    isExpired,
    error: isExpired ? "Access token has expired. Please reconnect Pinterest." : undefined
  };
}

/**
 * Renders the HTML response for the OAuth callback window.
 * Strictly complies with Production CSP by applying the request nonce to script tags.
 */
export function renderOAuthCallbackHtml(options: {
  success: boolean;
  title: string;
  message: string;
  error?: string;
  account?: SafePinterestAccount | null;
  nonce?: string;
}): string {
  const { success, title, message, error, account, nonce } = options;
  const scriptNonceAttr = nonce ? ` nonce="${nonce}"` : "";

  const themeColor = success ? "#059669" : "#dc2626";
  const statusIcon = success
    ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const postPayload = success
    ? JSON.stringify({ type: "PINTEREST_AUTH_SUCCESS", account: account || null })
    : JSON.stringify({ type: "PINTEREST_AUTH_ERROR", error: error || message });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - WeLovePattern Pinterest Integration</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #ffffff;
      border-radius: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      max-width: 28rem;
      width: 100%;
      padding: 2rem;
      text-align: center;
    }
    .icon-wrapper {
      width: 4rem;
      height: 4rem;
      border-radius: 9999px;
      background: ${success ? "#ecfdf5" : "#fef2f2"};
      border: 1px solid ${success ? "#a7f3d0" : "#fecaca"};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .icon {
      width: 2rem;
      height: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    p {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }
    .account-badge {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.625rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #ffffff;
      background: ${themeColor};
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .footer-text {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      ${statusIcon}
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${
      account?.username
        ? `<div class="account-badge">
            <span>Pinterest Account:</span>
            <strong>@${escapeHtml(account.username)}</strong>
          </div>`
        : ""
    }
    ${
      error
        ? `<p style="color: #dc2626; font-size: 0.8125rem; word-break: break-word;">${escapeHtml(error)}</p>`
        : ""
    }
    <button class="btn" id="action-btn" onclick="handleAction()">
      ${success ? "Done (Close Window)" : "Close Window"}
    </button>
    <div class="footer-text" id="status-counter">
      ${success ? "Window will close automatically..." : "You may close this window and try again."}
    </div>
  </div>

  <script${scriptNonceAttr}>
    var payload = ${postPayload};
    
    function notifyOpener() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
        }
      } catch (err) {
        console.warn("Could not postMessage to opener:", err);
      }
    }

    function handleAction() {
      notifyOpener();
      if (window.opener) {
        window.close();
      } else {
        window.location.href = "/?view=admin&tab=pinterest";
      }
    }

    notifyOpener();

    ${
      success
        ? `setTimeout(function() {
            notifyOpener();
            if (window.opener) {
              window.close();
            } else {
              window.location.href = "/?view=admin&tab=pinterest";
            }
          }, 2000);`
        : ""
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
