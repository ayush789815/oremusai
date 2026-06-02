// ─── Xero OAuth helpers ─────────────────────────────────────────────────────
// All token storage and refresh happens server-side. The frontend just navigates
// to the backend's /api/auth/xero/start endpoint, which builds the consent URL
// using the server's XERO_CLIENT_ID and redirects to Xero.

export function getXeroStartURL() {
  const raw   = localStorage.getItem('oremus_current_v1');
  const token = raw ? (() => { try { return JSON.parse(raw)?.token; } catch { return null; } })() : null;
  if (!token) return null;

  const apiBase     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const backendRoot = apiBase.replace(/\/api\/?$/, '');
  return `${backendRoot}/api/auth/xero/start?token=${encodeURIComponent(token)}`;
}

export function getXeroReauthorizeURL() {
  return getXeroStartURL();
}
