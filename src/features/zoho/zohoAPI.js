// ─── Zoho Books OAuth helpers ───────────────────────────────────────────────
// All credentials come from Vite env vars (.env).
// Token exchange and refresh happen server-side via the backend (/api/auth/zoho/*).
// fetchZohoContacts uses the Vite dev proxy (/zoho-api) in dev only.

const CLIENT_ID    = process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI;
const AUTH_URL     = process.env.NEXT_PUBLIC_ZOHO_AUTH_URL;

// Zoho Books scopes needed for full read/write access
const SCOPES = [
  'ZohoBooks.fullaccess.all',
  'ZohoBooks.settings.READ',
  'ZohoBooks.contacts.READ',
  'ZohoBooks.invoices.READ',
  'ZohoBooks.expenses.READ',
  'ZohoBooks.reports.READ',
].join(',');

/**
 * Returns the backend URL that initiates the Zoho OAuth flow.
 * The backend builds the correct auth URL using its own ZOHO_REDIRECT_URI
 * (from server env) — this fixes the "Invalid Redirect URI" error that occurs
 * when the frontend bundle has a localhost redirect URI baked in at build time.
 *
 * The user's JWT is passed as ?token= so the backend can identify the user
 * after Zoho's callback (carried as OAuth state parameter).
 */
export function getZohoStartURL() {
  const raw   = localStorage.getItem('oremus_current_v1');
  const token = raw ? (() => { try { return JSON.parse(raw)?.token; } catch { return null; } })() : null;
  if (!token) return null;

  // Derive backend root from VITE_API_URL (strip trailing /api)
  const apiBase   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const backendRoot = apiBase.replace(/\/api\/?$/, '');
  return `${backendRoot}/api/auth/zoho/start?token=${encodeURIComponent(token)}`;
}

/**
 * Returns the Zoho signout URL that redirects to the backend OAuth start
 * after signing out. Use this for the "Re-authorize" button so users are
 * forced to log into Zoho fresh — fixes "no login screen" when already
 * logged into Zoho in another tab.
 */
export function getZohoReauthorizeURL() {
  const startURL = getZohoStartURL();
  if (!startURL) return null;

  // Zoho signout URL → after signout, redirects to Zoho login then auth
  const ACCOUNTS_BASE = process.env.NEXT_PUBLIC_ZOHO_ACCOUNTS_URL
    ?.replace('/oauth/v2', '') ?? 'https://accounts.zoho.in';
  return `${ACCOUNTS_BASE}/signout?redirecturl=${encodeURIComponent(startURL)}`;
}

// ── Keep legacy exports so any other imports don't break ─────────────────────
/** @deprecated Use getZohoStartURL() instead */
export function buildAuthURL() {
  return getZohoStartURL();
}
/** @deprecated Use getZohoReauthorizeURL() instead */
export function buildSwitchAccountURL() {
  return getZohoReauthorizeURL();
}

/**
 * Fetches customers (contacts of type "customer") from Zoho Books.
 * Calls go through the Vite dev proxy at /zoho-api → https://www.zohoapis.in
 * so there are no browser CORS errors.
 *
 * @param {string} accessToken  - Valid Zoho OAuth access token
 * @param {string} orgId        - Zoho Books organisation ID
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.perPage=200]  - max Zoho allows is 200
 * @returns {Promise<{ contacts: object[], pageContext: object }>}
 */
export async function fetchZohoContacts(accessToken, orgId, { page = 1, perPage = 200 } = {}) {
  const params = new URLSearchParams({
    organization_id: orgId,
    contact_type:    'customer',
    page,
    per_page:        perPage,
    sort_column:     'outstanding_receivable_amount',
    sort_order:      'D',
    filter_by:       'Status.Active',
  });

  const res = await fetch(`/zoho-api/books/v3/contacts?${params}`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || `Zoho Books API error (HTTP ${res.status}, code ${data.code})`);
  }

  return {
    contacts:    data.contacts    ?? [],
    pageContext: data.page_context ?? {},
  };
}

