// ─── QuickBooks Online OAuth helpers ────────────────────────────────────────
// All credentials live on the backend. The frontend just navigates the browser
// to the backend's /api/auth/quickbooks/start endpoint, which redirects to Intuit.
// All token storage and refresh happens server-side.

/**
 * Returns the backend URL that initiates the QuickBooks OAuth flow.
 * The user's JWT is passed as ?token= so the backend can identify the user
 * after Intuit's callback (carried as OAuth state parameter).
 */
export function getQBOStartURL() {
  const raw   = localStorage.getItem('oremus_current_v1');
  const token = raw ? (() => { try { return JSON.parse(raw)?.token; } catch { return null; } })() : null;
  if (!token) return null;

  const apiBase     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const backendRoot = apiBase.replace(/\/api\/?$/, '');
  return `${backendRoot}/api/auth/quickbooks/start?token=${encodeURIComponent(token)}`;
}

/**
 * Same as getQBOStartURL but forces Intuit to re-prompt for company selection
 * (Intuit doesn't have a Zoho-style signout helper; the start URL is reused).
 */
export function getQBOReauthorizeURL() {
  return getQBOStartURL();
}
