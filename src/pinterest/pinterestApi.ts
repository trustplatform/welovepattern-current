import {
  getPinterestAuthRecord,
  savePinterestAuthRecord,
  refreshPinterestToken,
  PinterestAuthRecord
} from "./pinterestOAuth";
import { PinterestBoard } from "../types";

const PINTEREST_USE_SANDBOX = process.env.PINTEREST_USE_SANDBOX === "true";
const PINTEREST_API_BASE = PINTEREST_USE_SANDBOX
  ? "https://api-sandbox.pinterest.com/v5"
  : "https://api.pinterest.com/v5";

export interface NormalizedPinterestBoard {
  id: string;
  name: string;
  imageThumbnailUrl?: string;
}

export interface FetchBoardsResult {
  success: boolean;
  boards: NormalizedPinterestBoard[];
  error?: string;
}

/**
 * Retrieves a valid, unexpired Pinterest access token from the server store.
 * Automatically refreshes the token if expired or nearing expiry (within 5 minutes)
 * and persists the updated credentials.
 */
export async function getValidPinterestAccessToken(): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  const record = getPinterestAuthRecord();
  if (!record || !record.accessToken) {
    return {
      success: false,
      error: "Pinterest account is not connected"
    };
  }

  const now = Date.now();
  const isNearExpiry = record.expiresAt && now > (record.expiresAt - 5 * 60 * 1000);
  const isExpired = record.expiresAt && now > record.expiresAt;

  // If token is still fresh, return it directly
  if (!isNearExpiry && !isExpired) {
    return {
      success: true,
      accessToken: record.accessToken
    };
  }

  // If token is near expiry or expired, attempt refresh if refresh token exists
  if (record.refreshToken) {
    try {
      const refreshResult = await refreshPinterestToken(record.refreshToken);
      if (refreshResult.success && refreshResult.data?.access_token) {
        const refreshedData = refreshResult.data;
        const updatedRecord: PinterestAuthRecord = {
          ...record,
          accessToken: refreshedData.access_token,
          refreshToken: refreshedData.refresh_token || record.refreshToken,
          expiresIn: refreshedData.expires_in,
          expiresAt: refreshedData.expires_in ? now + refreshedData.expires_in * 1000 : record.expiresAt,
          updatedAt: new Date().toISOString()
        };
        savePinterestAuthRecord(updatedRecord);
        return {
          success: true,
          accessToken: updatedRecord.accessToken
        };
      }
    } catch (refreshErr) {
      console.error("Failed to auto-refresh Pinterest token:", refreshErr);
    }
  }

  // If already expired and refresh failed/not available
  if (isExpired) {
    return {
      success: false,
      error: "Pinterest access token has expired. Please reconnect your Pinterest account."
    };
  }

  // Token is within 5 minutes of expiry but refresh failed; still valid for now
  return {
    success: true,
    accessToken: record.accessToken
  };
}

/**
 * Fetches the boards for the connected Pinterest account via Pinterest API v5.
 * Returns a normalized list containing id, name, and optional imageThumbnailUrl.
 * Never exposes or logs access tokens or secrets.
 */
export async function fetchPinterestBoards(): Promise<FetchBoardsResult> {
  const useSandbox = process.env.PINTEREST_USE_SANDBOX === "true";

  let accessToken: string | undefined;

  if (useSandbox) {
    // Sandbox has its own token and its own boards.
    accessToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      return {
        success: false,
        boards: [],
        error: "Pinterest Sandbox token is not configured on the server."
      };
    }
  } else {
    const tokenResult = await getValidPinterestAccessToken();

    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        boards: [],
        error: tokenResult.error || "Pinterest account is not connected"
      };
    }

    accessToken = tokenResult.accessToken;
  }

  const allBoards: NormalizedPinterestBoard[] = [];
  let bookmark: string | undefined = undefined;
  let pageCount = 0;
  const MAX_PAGES = 10; // Safety guard for pagination

  try {
    do {
      pageCount++;
      const url = new URL(`${PINTEREST_API_BASE}/boards`);
      url.searchParams.set("page_size", "100");
      if (bookmark) {
        url.searchParams.set("bookmark", bookmark);
      }

      let response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });

      // If Pinterest returns 401 Unauthorized, token might have been invalidated;
      // attempt refresh once if refresh token exists
      if (response.status === 401 && !useSandbox) {
        const record = getPinterestAuthRecord();
        if (record?.refreshToken) {
          const refreshResult = await refreshPinterestToken(record.refreshToken);
          if (refreshResult.success && refreshResult.data?.access_token) {
            const refreshedData = refreshResult.data;
            const updatedRecord: PinterestAuthRecord = {
              ...record,
              accessToken: refreshedData.access_token,
              refreshToken: refreshedData.refresh_token || record.refreshToken,
              expiresIn: refreshedData.expires_in,
              expiresAt: refreshedData.expires_in ? Date.now() + refreshedData.expires_in * 1000 : record.expiresAt,
              updatedAt: new Date().toISOString()
            };
            savePinterestAuthRecord(updatedRecord);

            // Retry with new token
            response = await fetch(url.toString(), {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${updatedRecord.accessToken}`,
                "Accept": "application/json"
              }
            });
          }
        }
      }

      if (!response.ok) {
        const rawText = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(rawText);
          errorMsg = json.message || json.error_description || json.error || errorMsg;
        } catch {
          if (rawText) errorMsg = rawText.slice(0, 100);
        }
        return {
          success: false,
          boards: [],
          error: `Pinterest API error: ${errorMsg}`
        };
      }

      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      for (const item of items) {
        if (!item || !item.id) continue;
        const thumbnail =
          item.media?.image_cover_url ||
          (Array.isArray(item.media?.pin_thumbnail_urls) && item.media.pin_thumbnail_urls[0]) ||
          undefined;

        allBoards.push({
          id: String(item.id),
          name: String(item.name || "Untitled Board"),
          imageThumbnailUrl: typeof thumbnail === "string" ? thumbnail : undefined
        });
      }

      bookmark = typeof data?.bookmark === "string" && data.bookmark.trim() ? data.bookmark.trim() : undefined;
    } while (bookmark && pageCount < MAX_PAGES);

    return {
      success: true,
      boards: allBoards
    };
  } catch (err: any) {
    console.error("Error fetching Pinterest boards from Pinterest API:", err?.message || err);
    return {
      success: false,
      boards: [],
      error: err?.message || "Failed to communicate with Pinterest API"
    };
  }
}

export interface CreatePinParams {
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
}

export interface CreatePinResult {
  success: boolean;
  pinId?: string;
  url?: string;
  error?: string;
  missingScope?: boolean;
  data?: any;
}

/**
 * Deterministically generates a clean, SEO-oriented Pinterest title from the pattern title.
 * Does NOT use AI or external AI APIs.
 */
export function generatePinterestTitle(patternTitle: string): string {
  const clean = (patternTitle || "Crochet Pattern").trim();
  if (/crochet\s+pattern$/i.test(clean)) {
    return clean;
  }
  if (/pattern$/i.test(clean)) {
    return `${clean.replace(/pattern$/i, "").trim()} Crochet Pattern`;
  }
  return `${clean} Crochet Pattern`;
}

/**
 * Deterministically generates an SEO-oriented Pinterest description from pattern data.
 * Does NOT use AI or external AI APIs.
 */
export function generatePinterestDescription(pattern: {
  title: string;
  difficulty?: string;
  category?: string;
  description?: string;
}): string {
  const cleanTitle = (pattern.title || "Crochet Pattern").trim();
  const diff = (pattern.difficulty || "all skill levels").toLowerCase();
  const cat = (pattern.category || "crochet").toLowerCase().replace(/s$/, "");

  return `Create this ${cleanTitle} with this crochet pattern. Perfect for ${diff} crocheters looking for a cozy handmade ${cat} project. Get the full pattern and instructions on WeLovePattern.`;
}

/**
 * Creates a Pin on Pinterest via official Pinterest API v5 (POST https://api.pinterest.com/v5/pins).
 *
 * Responsibilities:
 * - Obtains a valid access token using existing token-refresh mechanism
 * - Verifies the token is usable and has the required 'boards:write' scope
 * - Detects missing required scope and returns a clear actionable error
 * - Never logs or exposes access tokens
 * - Returns a safe normalized result
 */
export async function createPinterestPin(params: CreatePinParams): Promise<CreatePinResult> {
  const useSandbox = process.env.PINTEREST_USE_SANDBOX === "true";

  let accessToken: string | undefined;

  if (useSandbox) {
    // Sandbox uses a dedicated token generated in Pinterest Developers.
    // It is intentionally NOT stored in pinterest-auth.json.
    accessToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      return {
        success: false,
        error: "Pinterest Sandbox token is not configured on the server."
      };
    }
  } else {
    const authRecord = getPinterestAuthRecord();

    if (!authRecord || !authRecord.accessToken) {
      return {
        success: false,
        error: "Pinterest account is not connected. Please connect Pinterest in Admin Settings."
      };
    }

    const grantedScopes = (authRecord.scope || "")
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase());

    if (!grantedScopes.includes("boards:write")) {
      return {
        success: false,
        missingScope: true,
        error: "Pinterest authorization is missing required 'boards:write' permission. Please reconnect your Pinterest account in Admin Settings."
      };
    }

    const tokenResult = await getValidPinterestAccessToken();

    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        error: tokenResult.error || "Failed to obtain valid Pinterest access token"
      };
    }

    accessToken = tokenResult.accessToken;
  }

  if (!params.boardId) {
    return {
      success: false,
      error: "A valid Pinterest board ID is required to create a Pin."
    };
  }

  if (!params.imageUrl) {
    return {
      success: false,
      error: "A valid public Pin image URL is required to create a Pin."
    };
  }

  const pinPayload = {
    board_id: params.boardId,
    title: params.title,
    description: params.description,
    link: params.link,
    media_source: {
      source_type: "image_url",
      url: params.imageUrl,
      is_standard: true
    }
  };

  try {
    let response = await fetch(`${PINTEREST_API_BASE}/pins`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(pinPayload)
    });

    // Production OAuth tokens can be refreshed. Sandbox uses its own token.
    if (response.status === 401 && !useSandbox) {
      const record = getPinterestAuthRecord();

      if (record?.refreshToken) {
        const refreshResult = await refreshPinterestToken(record.refreshToken);

        if (refreshResult.success && refreshResult.data?.access_token) {
          const refreshedData = refreshResult.data;

          const updatedRecord: PinterestAuthRecord = {
            ...record,
            accessToken: refreshedData.access_token,
            refreshToken: refreshedData.refresh_token || record.refreshToken,
            expiresIn: refreshedData.expires_in,
            expiresAt: refreshedData.expires_in
              ? Date.now() + refreshedData.expires_in * 1000
              : record.expiresAt,
            updatedAt: new Date().toISOString()
          };

          savePinterestAuthRecord(updatedRecord);
          accessToken = updatedRecord.accessToken;

          response = await fetch(`${PINTEREST_API_BASE}/pins`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(pinPayload)
          });
        }
      }
    }

    if (!response.ok) {
      const rawText = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      let isScopeIssue = false;

      try {
        const json = JSON.parse(rawText);
        errorMsg = json.message || json.error_description || json.error || errorMsg;

        if (
          response.status === 403 ||
          (typeof errorMsg === "string" && /scope|boards:write|forbidden/i.test(errorMsg))
        ) {
          isScopeIssue = true;
        }
      } catch {
        if (rawText) errorMsg = rawText.slice(0, 150);
      }

      if (isScopeIssue || response.status === 403) {
        return {
          success: false,
          missingScope: true,
          error: useSandbox
            ? `Pinterest Sandbox authorization error (${errorMsg}). Check that the Sandbox token has the required permissions and that the selected board belongs to the Sandbox account.`
            : `Pinterest authorization error (${errorMsg}). Missing required 'boards:write' permission. Please reconnect your Pinterest account in Admin Settings.`
        };
      }

      return {
        success: false,
        error: `Pinterest API error: ${errorMsg}`
      };
    }

    const data = await response.json();
    const pinId = data?.id ? String(data.id) : undefined;

    return {
      success: true,
      pinId,
      // Sandbox pins are not normal public Pinterest pins.
      url: pinId
        ? `${useSandbox ? "https://api-sandbox.pinterest.com" : "https://www.pinterest.com"}/pin/${pinId}/`
        : undefined,
      data
    };
  } catch (err: any) {
    console.error(
      "Error creating Pinterest pin via Pinterest API v5:",
      err?.message || err
    );

    return {
      success: false,
      error: err?.message || "Failed to communicate with Pinterest API"
    };
  }
}

/**
 * Supported Pinterest Pin analytics metric types in Pinterest API v5.
 */
export type PinterestPinMetricType =
  | 'IMPRESSION'
  | 'SAVE'
  | 'PIN_CLICK'
  | 'OUTBOUND_CLICK'
  | 'ENGAGEMENT'
  | 'CLOSEUP';

export const DEFAULT_PINTEREST_PIN_METRICS: PinterestPinMetricType[] = [
  'IMPRESSION',
  'SAVE',
  'PIN_CLICK',
  'OUTBOUND_CLICK',
  'ENGAGEMENT',
  'CLOSEUP'
];

export interface PinAnalyticsSummary {
  impressions: number;
  saves: number;
  pinClicks: number;
  outboundClicks: number;
  engagements: number;
  closeups: number;
  engagementRate: number;      // engagements / impressions (0 to 1)
  clickThroughRate: number;    // outboundClicks / impressions (0 to 1)
}

export interface PinDailyAnalyticsRecord {
  date: string;                // YYYY-MM-DD
  metrics: Partial<Record<PinterestPinMetricType, number>>;
}

export interface FetchPinAnalyticsResult {
  success: boolean;
  pinId?: string;
  startDate?: string;
  endDate?: string;
  summary?: PinAnalyticsSummary;
  dailyBreakdown?: PinDailyAnalyticsRecord[];
  rawMetrics?: Record<string, any>;
  error?: string;
  missingScope?: boolean;
}

/**
 * Fetches performance analytics for a specific Pin via Pinterest API v5:
 * GET https://api.pinterest.com/v5/pins/{pin_id}/analytics
 * 
 * Reuses existing OAuth token management, auto-refresh on 401, and scope validation.
 */
export async function fetchPinAnalytics(
  pinId: string,
  startDate: string,
  endDate: string,
  metricTypes: string[] = DEFAULT_PINTEREST_PIN_METRICS
): Promise<FetchPinAnalyticsResult> {
  const cleanPinId = (pinId || '').trim();
  if (!cleanPinId) {
    return {
      success: false,
      error: 'A valid Pinterest Pin ID is required to fetch analytics.'
    };
  }

  // Validate YYYY-MM-DD dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return {
      success: false,
      pinId: cleanPinId,
      error: `Invalid date format. Expected YYYY-MM-DD format (received: startDate="${startDate}", endDate="${endDate}").`
    };
  }

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return {
      success: false,
      pinId: cleanPinId,
      error: `startDate (${startDate}) cannot be after endDate (${endDate}).`
    };
  }

  const useSandbox = process.env.PINTEREST_USE_SANDBOX === 'true';
  let accessToken: string | undefined;

  if (useSandbox) {
    accessToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return {
        success: false,
        pinId: cleanPinId,
        error: 'Pinterest Sandbox token is not configured on the server.'
      };
    }
  } else {
    const authRecord = getPinterestAuthRecord();
    if (!authRecord || !authRecord.accessToken) {
      return {
        success: false,
        pinId: cleanPinId,
        error: 'Pinterest account is not connected. Please connect Pinterest in Admin Settings.'
      };
    }

    const grantedScopes = (authRecord.scope || '')
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase());

    if (!grantedScopes.includes('pins:read') && !grantedScopes.includes('boards:read')) {
      return {
        success: false,
        pinId: cleanPinId,
        missingScope: true,
        error: "Pinterest authorization is missing required 'pins:read' permission. Please reconnect your Pinterest account in Admin Settings."
      };
    }

    const tokenResult = await getValidPinterestAccessToken();
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        pinId: cleanPinId,
        error: tokenResult.error || 'Failed to obtain valid Pinterest access token.'
      };
    }
    accessToken = tokenResult.accessToken;
  }

  const metricsParam = metricTypes.length > 0 ? metricTypes.join(',') : DEFAULT_PINTEREST_PIN_METRICS.join(',');

  const queryUrl = new URL(`${PINTEREST_API_BASE}/pins/${encodeURIComponent(cleanPinId)}/analytics`);
  queryUrl.searchParams.set('start_date', startDate);
  queryUrl.searchParams.set('end_date', endDate);
  queryUrl.searchParams.set('metric_types', metricsParam);

  try {
    let response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Handle 401 Unauthorized with automatic token refresh
    if (response.status === 401 && !useSandbox) {
      const record = getPinterestAuthRecord();
      if (record?.refreshToken) {
        const refreshResult = await refreshPinterestToken(record.refreshToken);
        if (refreshResult.success && refreshResult.data?.access_token) {
          const refreshedData = refreshResult.data;
          const updatedRecord: PinterestAuthRecord = {
            ...record,
            accessToken: refreshedData.access_token,
            refreshToken: refreshedData.refresh_token || record.refreshToken,
            expiresIn: refreshedData.expires_in,
            expiresAt: refreshedData.expires_in
              ? Date.now() + refreshedData.expires_in * 1000
              : record.expiresAt,
            updatedAt: new Date().toISOString()
          };
          savePinterestAuthRecord(updatedRecord);
          accessToken = updatedRecord.accessToken;

          // Retry request with fresh token
          response = await fetch(queryUrl.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
        }
      }
    }

    if (!response.ok) {
      const rawText = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      let isScopeIssue = false;

      try {
        const json = JSON.parse(rawText);
        errorMsg = json.message || json.error_description || json.error || errorMsg;
        if (response.status === 403 || (typeof errorMsg === 'string' && /scope|pins:read|forbidden/i.test(errorMsg))) {
          isScopeIssue = true;
        }
      } catch {
        if (rawText) errorMsg = rawText.slice(0, 150);
      }

      if (response.status === 429) {
        return {
          success: false,
          pinId: cleanPinId,
          error: 'Pinterest API rate limit reached. Please wait a few moments before requesting Pin analytics again.'
        };
      }

      if (isScopeIssue || response.status === 403) {
        return {
          success: false,
          pinId: cleanPinId,
          missingScope: true,
          error: "Pinterest authorization missing required 'pins:read' scope. Please reconnect your Pinterest account in Admin Settings."
        };
      }

      return {
        success: false,
        pinId: cleanPinId,
        error: `Pinterest API analytics error: ${errorMsg}`
      };
    }

    const data = await response.json();

    // Parse summary and daily breakdown from Pinterest API v5 response
    // Response structure: { all: { summary_metrics: { IMPRESSION: 100, ... }, daily_metrics: [ { date: "YYYY-MM-DD", metrics: { ... } } ] } }
    // Or top-level { summary_metrics: { ... } }
    const container = data?.all || data || {};
    const summaryRaw = container.summary_metrics || container.summary || data?.summary_metrics || {};

    const impressions = Number(summaryRaw.IMPRESSION || summaryRaw.impression || summaryRaw.IMPRESSIONS || 0);
    const saves = Number(summaryRaw.SAVE || summaryRaw.save || summaryRaw.SAVES || 0);
    const pinClicks = Number(summaryRaw.PIN_CLICK || summaryRaw.pin_click || summaryRaw.PIN_CLICKS || 0);
    const outboundClicks = Number(summaryRaw.OUTBOUND_CLICK || summaryRaw.outbound_click || summaryRaw.OUTBOUND_CLICKS || 0);
    const engagements = Number(summaryRaw.ENGAGEMENT || summaryRaw.engagement || summaryRaw.ENGAGEMENTS || (saves + pinClicks + outboundClicks));
    const closeups = Number(summaryRaw.CLOSEUP || summaryRaw.closeup || summaryRaw.CLOSEUPS || 0);

    const engagementRate = impressions > 0 ? Math.round((engagements / impressions) * 10000) / 10000 : 0;
    const clickThroughRate = impressions > 0 ? Math.round((outboundClicks / impressions) * 10000) / 10000 : 0;

    const summary: PinAnalyticsSummary = {
      impressions,
      saves,
      pinClicks,
      outboundClicks,
      engagements,
      closeups,
      engagementRate,
      clickThroughRate
    };

    // Extract daily breakdown if present
    const rawDaily = Array.isArray(container.daily_metrics) ? container.daily_metrics : [];
    const dailyBreakdown: PinDailyAnalyticsRecord[] = rawDaily.map((item: any) => ({
      date: item.date || item.data_status || '',
      metrics: item.metrics || {}
    }));

    return {
      success: true,
      pinId: cleanPinId,
      startDate,
      endDate,
      summary,
      dailyBreakdown,
      rawMetrics: data
    };
  } catch (err: any) {
    console.error('Error fetching Pinterest pin analytics via Pinterest API v5:', err?.message || err);
    return {
      success: false,
      pinId: cleanPinId,
      error: err?.message || 'Failed to communicate with Pinterest API.'
    };
  }
}

