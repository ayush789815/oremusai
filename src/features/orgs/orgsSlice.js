import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../services/axiosClient.js';

// localStorage key for the currently selected organization. Read by the axios
// interceptor so every request carries the X-Org-Id header for org scoping.
export const SELECTED_ORG_KEY = 'oremus_selected_org_v1';

export function getSelectedOrgId() {
  try {
    return localStorage.getItem(SELECTED_ORG_KEY) || null;
  } catch {
    return null;
  }
}
function persistSelectedOrgId(orgId) {
  try {
    if (orgId) localStorage.setItem(SELECTED_ORG_KEY, String(orgId));
    else       localStorage.removeItem(SELECTED_ORG_KEY);
  } catch {}
}

// ── Thunks ─────────────────────────────────────────────────────────────────
// Load every organization the connected Zoho account exposes (eagerly synced
// at connect-time). Also resolves the active org from the backend status.
export const loadOrganizations = createAsyncThunk(
  'orgs/load',
  async (_, { rejectWithValue }) => {
    try {
      const [{ data: orgData }, { data: statusData }] = await Promise.all([
        axiosClient.get('/auth/zoho/organizations'),
        axiosClient.get('/auth/zoho/status').catch(() => ({ data: {} })),
      ]);
      return {
        organizations: orgData.organizations ?? [],
        activeOrgId:   statusData?.organizationId ?? null,
      };
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || e.message);
    }
  }
);

// Switch the active organization. The X-Org-Id header (set from localStorage)
// drives instant filtering across the app; the backend call keeps the
// persisted active org (zoho_tokens.org_id) in sync for cron + reports.
export const switchOrganization = createAsyncThunk(
  'orgs/switch',
  async (orgId, { rejectWithValue }) => {
    try {
      persistSelectedOrgId(orgId);
      await axiosClient.post('/auth/zoho/select-org', { orgId });
      return orgId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || e.message);
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────
const orgsSlice = createSlice({
  name: 'orgs',
  initialState: {
    list:       [],
    selectedId: getSelectedOrgId(),
    status:     'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    switching:  false,
    error:      null,
  },
  reducers: {
    clearOrgs(state) {
      state.list       = [];
      state.selectedId = null;
      state.status     = 'idle';
      persistSelectedOrgId(null);
    },
  },
  extraReducers: (b) => {
    b
      .addCase(loadOrganizations.pending,   (s) => { s.status = 'loading'; s.error = null; })
      .addCase(loadOrganizations.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.list   = a.payload.organizations;
        // Prefer the persisted selection; fall back to the backend's active org,
        // then to the first org in the list.
        const ids = a.payload.organizations.map((o) => String(o.org_id));
        let sel = s.selectedId && ids.includes(String(s.selectedId)) ? String(s.selectedId) : null;
        if (!sel && a.payload.activeOrgId && ids.includes(String(a.payload.activeOrgId))) {
          sel = String(a.payload.activeOrgId);
        }
        if (!sel && a.payload.organizations.length > 0) {
          sel = String(a.payload.organizations[0].org_id);
        }
        s.selectedId = sel;
        persistSelectedOrgId(sel);
      })
      .addCase(loadOrganizations.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })

      .addCase(switchOrganization.pending,   (s) => { s.switching = true;  s.error = null; })
      .addCase(switchOrganization.fulfilled, (s, a) => { s.switching = false; s.selectedId = String(a.payload); })
      .addCase(switchOrganization.rejected,  (s, a) => { s.switching = false; s.error = a.payload; });
  },
});

export const { clearOrgs } = orgsSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectOrgList       = (s) => s.orgs.list;
export const selectOrgSelectedId  = (s) => s.orgs.selectedId;
export const selectOrgSwitching   = (s) => s.orgs.switching;
export const selectActiveOrg = (s) =>
  s.orgs.list.find((o) => String(o.org_id) === String(s.orgs.selectedId)) || null;

export default orgsSlice.reducer;
