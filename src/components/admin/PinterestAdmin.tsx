import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Unlink,
  Check,
  Copy,
  Info,
  Loader2
} from 'lucide-react';
import { SafePinterestStatus } from '../../types';

export const PinterestAdmin: React.FC = () => {
  const [status, setStatus] = useState<SafePinterestStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch safe status from server
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pinterest/status', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: SafePinterestStatus = await res.json();
      setStatus(data);
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('Failed to load Pinterest status:', err);
      setError(err?.message || 'Failed to check Pinterest status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Listen for message events sent by the OAuth callback window
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'PINTEREST_AUTH_SUCCESS') {
        setIsConnecting(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setError(null);
        setSuccessMessage('Pinterest account authorized and connected successfully!');
        fetchStatus();
      } else if (event.data.type === 'PINTEREST_AUTH_ERROR') {
        setIsConnecting(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setError(event.data.error || 'Pinterest authorization was cancelled or failed.');
        fetchStatus();
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [fetchStatus]);

  // Initiate OAuth flow
  const handleConnect = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsConnecting(true);

    try {
      const res = await fetch('/api/admin/pinterest/auth-url', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to generate Pinterest authorization URL');
      }

      // Calculate popup dimensions
      const width = 600;
      const height = 750;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.url,
        'pinterest_oauth',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // If popup was blocked by browser
        setError('Popup window was blocked by your browser. Please allow popups for this site or use direct authorization.');
        setIsConnecting(false);
        return;
      }

      // Poll in background while popup is open
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          if (popup.closed) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsConnecting(false);
            // Refresh status in case postMessage didn't fire
            await fetchStatus();
          }
        } catch {
          // Ignore cross-origin errors when checking popup.closed
        }
      }, 1500);

    } catch (err: any) {
      console.error('Failed to initiate Pinterest OAuth:', err);
      setError(err?.message || 'Failed to start Pinterest authorization');
      setIsConnecting(false);
    }
  };

  // Disconnect OAuth
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Pinterest? You will need to re-authorize to publish pins.')) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/pinterest/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect Pinterest');
      }

      setSuccessMessage('Pinterest account disconnected successfully.');
      await fetchStatus();
    } catch (err: any) {
      console.error('Error disconnecting Pinterest:', err);
      setError(err?.message || 'Failed to disconnect Pinterest');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyRedirectUri = () => {
    if (!status?.redirectUri) return;
    navigator.clipboard.writeText(status.redirectUri);
    setCopiedRedirectUri(true);
    setTimeout(() => setCopiedRedirectUri(false), 2500);
  };

  const isConnected = !!status?.connected && !status?.isExpired;
  const isExpired = !!status?.isExpired;

  return (
    <div id="pinterest-admin-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Pinterest Integration</h1>
              <p className="text-sm text-stone-500">Official Pinterest API OAuth 2.0 connection for WeLovePattern</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="pinterest-refresh-status-btn"
            onClick={() => { setIsLoading(true); fetchStatus(); }}
            disabled={isLoading || isConnecting}
            className="px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            title="Refresh status from server"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-stone-400' : 'text-stone-600'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Connection Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Success</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Status Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isExpired
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-stone-100 text-stone-400 border border-stone-200'
            }`}>
              {isConnected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : isExpired ? (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-stone-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-stone-900">
                  {isConnected
                    ? 'Pinterest Connected'
                    : isExpired
                    ? 'Connection Expired'
                    : 'Not Connected'}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : isExpired
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
                }`}>
                  {isConnected ? 'Active & Authorized' : isExpired ? 'Expired Token' : 'Disconnected'}
                </span>
              </div>

              <p className="text-sm text-stone-600 mt-1">
                {isConnected
                  ? 'Your WeLovePattern Pinterest account is linked and ready for board access and pin publishing.'
                  : isExpired
                  ? 'Your Pinterest access token has expired. Please re-authorize by clicking Reconnect below.'
                  : 'Connect your official Pinterest account via OAuth 2.0 to manage boards and publish pins.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <>
                <button
                  id="pinterest-reconnect-btn"
                  onClick={handleConnect}
                  disabled={isConnecting || isDisconnecting}
                  className="px-4 py-2.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>Reconnect</span>
                </button>
                <button
                  id="pinterest-disconnect-btn"
                  onClick={handleDisconnect}
                  disabled={isConnecting || isDisconnecting}
                  className="px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                id="pinterest-connect-btn"
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2.5 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                    </svg>
                    <span>Connect Pinterest</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Connected Account Details */}
        {isConnected && status?.account && (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-4">
              {status.account.profileImage ? (
                <img
                  src={status.account.profileImage}
                  alt={status.account.username || 'Pinterest Profile'}
                  className="w-12 h-12 rounded-full border border-stone-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                  {status.account.username ? status.account.username.charAt(0).toUpperCase() : 'P'}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Connected Account</p>
                <p className="text-base font-bold text-stone-900">
                  {status.account.businessName || status.account.username || 'WeLovePattern'}
                </p>
                {status.account.username && (
                  <p className="text-sm text-stone-600">@{status.account.username}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Account Type</span>
                <span className="font-bold text-stone-800">{status.account.accountType || 'BUSINESS'}</span>
              </div>
              {status.connectedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-500 uppercase tracking-wider">Connected Date</span>
                  <span className="text-stone-700">{new Date(status.connectedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Authorized Scopes</span>
                <span className="text-emerald-700 font-medium">4 scopes active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Setup & Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Redirect URI Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">OAuth 2.0 Redirect URI</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3 leading-relaxed">
            This exact Redirect URI must be added to your <strong>Pinterest Developer Portal</strong> app settings under
            <em> Redirect URIs</em>:
          </p>

          <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
            <code className="text-xs font-mono text-stone-800 flex-1 truncate select-all">
              {status?.redirectUri || 'https://welovepattern.com/api/admin/pinterest/callback'}
            </code>
            <button
              id="pinterest-copy-redirect-uri-btn"
              onClick={handleCopyRedirectUri}
              className="p-1.5 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copiedRedirectUri ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {copiedRedirectUri && (
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">Copied to clipboard!</p>
          )}
        </div>

        {/* Environment Credentials Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">Environment Configuration</h3>
          </div>
          <p className="text-xs text-stone-600 mb-3 leading-relaxed">
            Pinterest App ID and Secret are safely stored server-side and never exposed to the frontend:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span className="font-mono text-stone-700">PINTEREST_APP_ID</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${
                status?.appIdConfigured ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {status?.appIdConfigured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Configured
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Not Set
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span className="font-mono text-stone-700">PINTEREST_APP_SECRET</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${
                status?.appSecretConfigured ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {status?.appSecretConfigured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Configured
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Not Set
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scopes & Permissions Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-stone-700" />
          <h3 className="font-bold text-stone-900 text-sm">Requested OAuth Scopes</h3>
        </div>
        <p className="text-xs text-stone-600 mb-4">
          WeLovePattern requests only the specific scopes needed to identify your account and publish pattern pins:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-stone-900">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              boards:read
            </div>
            <p className="text-xs text-stone-500 mt-1">Read your Pinterest boards for category mapping.</p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-stone-900">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              pins:read
            </div>
            <p className="text-xs text-stone-500 mt-1">Inspect published pin status and analytics.</p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-stone-900">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              pins:write
            </div>
            <p className="text-xs text-stone-500 mt-1">Publish generated pattern pins directly to your boards.</p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-stone-900">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              user_accounts:read
            </div>
            <p className="text-xs text-stone-500 mt-1">Verify business account profile and handle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
