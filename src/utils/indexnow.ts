// IndexNow Client Utility for WeLovePattern
// Safely triggers IndexNow notification on the server for Bing and partner search engines

export interface IndexNowNotifyParams {
  urls?: string[];
  url?: string;
  type?: 'pattern' | 'blog' | 'tool' | 'page';
  slug?: string;
}

/**
 * Safely triggers IndexNow notification via authenticated backend API.
 * Never throws or interrupts user actions on failure.
 */
export async function notifyIndexNowClient(params: IndexNowNotifyParams): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    const res = await fetch('/api/admin/indexnow/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(params)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return !!data.success;
    }
    return false;
  } catch (err) {
    console.warn('[IndexNow] Client notification notice:', err);
    return false;
  }
}
