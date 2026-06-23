import { createSlice } from '@reduxjs/toolkit';

// Admin "view as client" — which client's data the admin is currently viewing
// on the dashboard. Persisted to localStorage and read by the axios interceptor
// so every request carries the X-Client-Id header. null = admin's own workspace.
const VIEW_AS_KEY = 'oremus_view_client_v1';

export function getViewAsClientId() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(VIEW_AS_KEY) || null;
  } catch {
    return null;
  }
}
function persistViewAsClientId(id) {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(VIEW_AS_KEY, String(id));
    else    window.localStorage.removeItem(VIEW_AS_KEY);
  } catch {}
}

const viewAsSlice = createSlice({
  name: 'viewAs',
  initialState: {
    clientId: getViewAsClientId(),
  },
  reducers: {
    setViewAsClient(state, action) {
      state.clientId = action.payload ? String(action.payload) : null;
      persistViewAsClientId(state.clientId);
    },
    clearViewAsClient(state) {
      state.clientId = null;
      persistViewAsClientId(null);
    },
  },
});

export const { setViewAsClient, clearViewAsClient } = viewAsSlice.actions;
export const selectViewAsClientId = (s) => s.viewAs.clientId;
export default viewAsSlice.reducer;
