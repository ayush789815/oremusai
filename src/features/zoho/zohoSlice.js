import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchZohoContacts } from './zohoAPI.js';
import axiosClient from '../../services/axiosClient.js';

const STORAGE_KEY = 'oremus_zoho_v1';

// ── Persistence helpers ──────────────────────────────────────────────────────
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function persist(data) {
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else       localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Async thunks ─────────────────────────────────────────────────────────────

/**
 * Exchange a one-time OAuth code for tokens via the backend.
 * The backend does the server-to-server exchange with Zoho (no CORS / proxy needed),
 * saves tokens to the DB, and kicks off the background sync.
 * Works in both dev and production builds.
 */
export const connectZoho = createAsyncThunk(
  'zoho/connect',
  async (payload, { rejectWithValue }) => {
    // Accept either a plain code string (original flow) or { code, state } object
    // (admin-for-client flow where 'state' carries the client's JWT for user attribution).
    const code  = typeof payload === 'string' ? payload : payload?.code;
    const state = typeof payload === 'string' ? undefined : payload?.state;

    try {
      const { data } = await axiosClient.post('/auth/zoho/exchange', {
        code,
        redirect_uri: process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI,
        ...(state ? { state } : {}),
      });

      if (!data.success) throw new Error(data.error || 'Token exchange failed');

      const tokens = {
        access_token:    data.access_token,
        expires_at:      data.expires_at,
        organization_id: data.organizationId,
      };
      persist(tokens);
      return tokens;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || e.message);
    }
  }
);

/**
 * Fetch all active customers from Zoho Books and store them in Redux.
 * Automatically refreshes the access token if it has expired.
 * Returns customers mapped to the TopListTile format:
 *   { id, name, sub, amount, trend }
 */
export const loadZohoCustomers = createAsyncThunk(
  'zoho/loadCustomers',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      let { accessToken, expiresAt, orgId } = getState().zoho;

      if (!accessToken) throw new Error('Not connected to Zoho Books');

      // Auto-refresh if token is expired or expires within the next 60 s
      if (expiresAt && Date.now() >= expiresAt - 60_000) {
        const result = await dispatch(refreshZohoToken());
        if (refreshZohoToken.rejected.match(result)) {
          throw new Error('Session expired — please reconnect Zoho Books.');
        }
        accessToken = getState().zoho.accessToken;
      }

      const { contacts, pageContext } = await fetchZohoContacts(accessToken, orgId);

      // Map Zoho contact fields → TopListTile row shape
      const customers = contacts.slice(0, 10).map((c) => ({
        id:     c.contact_id,
        name:   c.contact_name,
        sub:    c.company_name || c.payment_terms_label || '',
        amount: Math.round(c.outstanding_receivable_amount ?? 0),
        trend:  0,
      }));

      return { customers, total: pageContext.total ?? contacts.length };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

/**
 * Verify Zoho connection status with the backend.
 * - If backend says connected  → mark connected in Redux (source of truth)
 * - If backend says not connected → clear any stale localStorage token
 * Call this on every layout mount so the popup always reflects reality.
 */
export const verifyZohoStatus = createAsyncThunk(
  'zoho/verifyStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/auth/zoho/status');
      if (data.connected) {
        // Backend confirmed → mark connected and store org ID
        dispatch(markZohoConnected(data.organizationId ?? null));
      } else {
        // Backend has no valid token — wipe stale localStorage
        dispatch(disconnectZoho());
      }
      return data;
    } catch (e) {
      // Network/auth error — leave existing state as-is
      return rejectWithValue(e.message);
    }
  }
);

/**
 * Refresh the access token via the backend (server-to-server — no proxy needed).
 * The backend reads the stored refresh_token from DB and returns a fresh access_token.
 */
export const refreshZohoToken = createAsyncThunk(
  'zoho/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/auth/zoho/refresh');
      if (!data.access_token) throw new Error('Refresh failed — no token returned');
      const tokens = { access_token: data.access_token, expires_at: data.expires_at };
      const stored  = loadPersisted();
      persist({ ...stored, ...tokens });
      return tokens;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || e.message);
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const stored = loadPersisted();

const zohoSlice = createSlice({
  name: 'zoho',
  initialState: {
    connected:    !!stored?.access_token,
    accessToken:  stored?.access_token  ?? null,
    refreshToken: stored?.refresh_token ?? null,
    expiresAt:    stored?.expires_at    ?? null,
    apiDomain:    stored?.api_domain    ?? process.env.NEXT_PUBLIC_ZOHO_API_BASE,
    orgId:        stored?.organization_id ?? process.env.NEXT_PUBLIC_ZOHO_ORG_ID ?? null,
    connectedAt:  stored?.connected_at  ?? null,
    status:       'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error:        null,
    // ── Customer data fetched from Zoho Books ──────────────────────────────
    customers:        [],
    customersTotal:   0,
    customersStatus:  'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    customersError:   null,
  },
  reducers: {
    // Called when backend OAuth flow completes (status=success redirect)
    markZohoConnected(state, action) {
      state.connected  = true;
      state.status     = 'succeeded';
      state.connectedAt = new Date().toISOString();
      if (action.payload) state.orgId = action.payload;
      const stored = loadPersisted() ?? {};
      persist({ ...stored, connected_at: state.connectedAt });
    },
    disconnectZoho(state) {
      state.connected       = false;
      state.accessToken     = null;
      state.refreshToken    = null;
      state.expiresAt       = null;
      state.connectedAt     = null;
      state.status          = 'idle';
      state.error           = null;
      state.customers       = [];
      state.customersTotal  = 0;
      state.customersStatus = 'idle';
      state.customersError  = null;
      persist(null);
    },
    clearZohoError(state) {
      state.error  = null;
      state.status = 'idle';
    },
  },
  extraReducers: (b) => {
    b
      // ── connectZoho ──
      .addCase(connectZoho.pending,   (s)    => { s.status = 'loading'; s.error = null; })
      .addCase(connectZoho.fulfilled, (s, a) => {
        s.status       = 'succeeded';
        s.connected    = true;
        s.accessToken  = a.payload.access_token;
        s.refreshToken = a.payload.refresh_token ?? s.refreshToken;
        s.expiresAt    = a.payload.expires_at;
        s.apiDomain    = a.payload.api_domain ?? s.apiDomain;
        s.connectedAt  = new Date().toISOString();
        // Use the real Org ID returned by the backend (fetched from Zoho API)
        if (a.payload.organization_id) s.orgId = a.payload.organization_id;
        const updated  = loadPersisted() ?? {};
        persist({ ...updated, connected_at: s.connectedAt });
      })
      .addCase(connectZoho.rejected,  (s, a) => {
        s.status = 'failed';
        s.error  = a.payload ?? a.error.message;
      })
      // ── refreshZohoToken ──
      .addCase(refreshZohoToken.fulfilled, (s, a) => {
        s.accessToken = a.payload.access_token;
        s.expiresAt   = a.payload.expires_at;
      })
      .addCase(refreshZohoToken.rejected, (s, a) => {
        // Refresh failed → force re-connect
        s.connected   = false;
        s.accessToken = null;
        s.error       = a.payload ?? a.error.message;
        persist(null);
      })
      // ── loadZohoCustomers ──
      .addCase(loadZohoCustomers.pending, (s) => {
        s.customersStatus = 'loading';
        s.customersError  = null;
      })
      .addCase(loadZohoCustomers.fulfilled, (s, a) => {
        s.customersStatus = 'succeeded';
        s.customers       = a.payload.customers;
        s.customersTotal  = a.payload.total;
      })
      .addCase(loadZohoCustomers.rejected, (s, a) => {
        s.customersStatus = 'failed';
        s.customersError  = a.payload ?? a.error.message;
      });
  },
});

export const { disconnectZoho, clearZohoError, markZohoConnected } = zohoSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectZoho              = (s) => s.zoho;
export const selectZohoConnected     = (s) => s.zoho.connected;
export const selectZohoStatus        = (s) => s.zoho.status;
export const selectZohoError         = (s) => s.zoho.error;
export const selectZohoCustomers     = (s) => s.zoho.customers;
export const selectZohoCustomersStatus = (s) => s.zoho.customersStatus;
export const selectZohoCustomersError  = (s) => s.zoho.customersError;
export const selectZohoCustomersTotal  = (s) => s.zoho.customersTotal;

export default zohoSlice.reducer;
