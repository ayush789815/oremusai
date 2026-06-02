import { createSlice } from '@reduxjs/toolkit';

const THEME_KEY = 'oremus_theme_v1';
const COLLAPSE_KEY = 'oremus_sidebar_v1';

function readTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }
}
function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: readTheme(),
    sidebarCollapsed: readCollapsed(),
    mobileSidebarOpen: false,
  },
  reducers: {
    toggleTheme(s) {
      s.theme = s.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, s.theme); } catch {}
    },
    setTheme(s, a) {
      s.theme = a.payload;
      try { localStorage.setItem(THEME_KEY, s.theme); } catch {}
    },
    toggleSidebar(s) {
      s.sidebarCollapsed = !s.sidebarCollapsed;
      try { localStorage.setItem(COLLAPSE_KEY, s.sidebarCollapsed ? '1' : '0'); } catch {}
    },
    setMobileSidebar(s, a) { s.mobileSidebarOpen = !!a.payload; },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, setMobileSidebar } = uiSlice.actions;
export default uiSlice.reducer;
