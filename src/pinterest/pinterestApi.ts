import {
  getPinterestAuthRecord,
  savePinterestAuthRecord,
  refreshPinterestToken,
  PinterestAuthRecord
} from "./pinterestOAuth";
import { PinterestBoard } from "../types";

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
  const tokenResult = await getValidPinterestAccessToken();
  if (!tokenResult.success || !tokenResult.accessToken) {
    return {
      success: false,
      boards: [],
      error: tokenResult.error || "Pinterest account is not connected"
    };
  }

  const allBoards: NormalizedPinterestBoard[] = [];
  let bookmark: string | undefined = undefined;
  let pageCount = 0;
  const MAX_PAGES = 10; // Safety guard for pagination

  try {
    do {
      pageCount++;
      const url = new URL("https://api.pinterest.com/v5/boards");
      url.searchParams.set("page_size", "100");
      if (bookmark) {
        url.searchParams.set("bookmark", bookmark);
      }

      let response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenResult.accessToken}`,
          "Accept": "application/json"
        }
      });

      // If Pinterest returns 401 Unauthorized, token might have been invalidated;
      // attempt refresh once if refresh token exists
      if (response.status === 401) {
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
