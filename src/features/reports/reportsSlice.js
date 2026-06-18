import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { CATALOGS } from './data/index.js';
import { PROVIDERS, DEFAULT_PROVIDER, isValidProvider, getProvider } from './data/providers.js';
import {
  CUSTOM_REPORTS, DRAFT_REPORTS, PUBLISHED_REPORTS, ARCHIVED_REPORTS,
} from './data/savedReports.js';
import { fetchReportData } from './reportsAPI.js';
import { resolvePresetRange, DEFAULT_DATE_RANGE } from './data/dateRanges.js';

// Resolve the on-screen date-range preset + compare config from state into the
// concrete filter object the backend expects. Shared by the report viewer
// (loadReportData) and the card-level export so both fetch the same period.
function resolveReportFilters(reportsState, filters) {
  let resolved = filters;
  if (!resolved) {
    const f = reportsState.filters;
    const range = resolvePresetRange(f.dateRange, { from: f.customFrom, to: f.customTo });
    resolved = { ...range, basis: f.basis };
  }
  const c = reportsState.compare;
  if (c && c.count > 1) {
    resolved = {
      ...resolved,
      compare: c.baseOn === 'year' ? 'year' : 'period',
      compare_count: c.count,
      oldest_first: c.oldestFirst,
    };
  }
  return resolved;
}

export const loadReportData = createAsyncThunk(
  'reports/loadData',
  async ({ reportName, clientId, provider, filters } = {}, { getState }) => {
    // When a caller (e.g. the modal on open) doesn't pass explicit filters,
    // resolve the active date-range preset from state so the Zoho-live backend
    // always receives concrete dates — and the same period whether the report
    // is first opened or re-run.
    const resolved = resolveReportFilters(getState().reports, filters);
    return fetchReportData({ reportName, clientId, provider, filters: resolved });
  },
);

// Fetch a single report's data WITHOUT touching the viewer's currentData — used
// by the Export button on report cards so a report can be exported without
// first opening it. Returns the report payload to the caller via .unwrap().
export const fetchReportForExport = createAsyncThunk(
  'reports/fetchForExport',
  async ({ reportName, clientId, provider, filters } = {}, { getState }) => {
    const resolved = resolveReportFilters(getState().reports, filters);
    return fetchReportData({ reportName, clientId, provider, filters: resolved });
  },
);

// Provider-scoped browse state factory (active category, search, favourites).
function makePerProviderState() {
  const acc = {};
  for (const id of Object.keys(CATALOGS)) {
    const favs = CATALOGS[id].allReports.reduce((m, r) => {
      if (r.fav) m[r.name] = true;
      return m;
    }, {});
    acc[id] = {
      activeCategory: 'all',
      query: '',
      favorites: favs,
      showFavoritesOnly: false,
    };
  }
  return acc;
}

// Per-provider saved-report state (custom / drafts / published / archived).
// Seeded once with the static mock data so the lists aren't empty on first
// load — user actions append/move items from there.
function makeSavedReportsState() {
  return {
    zoho:       { custom: [],                drafts: [],            published: [],              archived: [] },
    quickbooks: { custom: [...CUSTOM_REPORTS], drafts: [],          published: [],              archived: [] },
    xero:       { custom: [...CUSTOM_REPORTS], drafts: [...DRAFT_REPORTS], published: [...PUBLISHED_REPORTS], archived: [...ARCHIVED_REPORTS] },
  };
}

// Per-provider "recent runs" map: { [reportName]: ISO timestamp }.
function makeRecentRuns() {
  return Object.keys(CATALOGS).reduce((m, id) => { m[id] = {}; return m; }, {});
}

const initialState = {
  // Active provider — driven by /reports/:provider in the URL.
  provider: DEFAULT_PROVIDER,

  // Per-provider browse state.
  byProvider: makePerProviderState(),

  // Per-provider saved reports + recent-run timestamps.
  savedReports: makeSavedReportsState(),
  recentRuns:   makeRecentRuns(),

  // Viewer state (cross-provider — only one viewer can be open at a time).
  openReport: null,        // { name, category, provider } | null
  view: 'table',           // 'table' | 'bar' | 'pie' | 'line'
  sidebarCollapsed: false, // viewer right-rail collapsed

  filters: {
    dateRange: DEFAULT_DATE_RANGE,
    customFrom: null,
    customTo: null,
    basis: 'accrual',
    interval: 'none',
    sortBy: 'default',
    decimals: 2,
    numberFormat: 'international',
    includeZero: false,
    includeSubAccounts: true,
    includeDeleted: false,
    showDebitCredit: false,
    hiddenColumns: {},
  },
  compare: {
    baseOn: 'period',
    with: 'previous-period',
    count: 1,
    oldestFirst: false,
  },

  currentData: null,
  status: 'idle',
  error: null,
};

// Helper — generate a unique id for saved reports.
function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const slice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setProvider(s, a) {
      const next = isValidProvider(a.payload) ? a.payload : DEFAULT_PROVIDER;
      if (s.provider !== next) {
        s.provider = next;
        s.openReport = null;
        s.currentData = null;
        s.status = 'idle';
      }
    },

    setActiveCategory(s, a) { s.byProvider[s.provider].activeCategory = a.payload; },
    setQuery(s, a) { s.byProvider[s.provider].query = a.payload; },
    toggleFavorite(s, a) {
      const favs = s.byProvider[s.provider].favorites;
      const name = a.payload;
      if (favs[name]) delete favs[name];
      else favs[name] = true;
    },
    setShowFavoritesOnly(s, a) { s.byProvider[s.provider].showFavoritesOnly = a.payload; },

    openReport(s, a) {
      s.openReport = { ...a.payload, provider: a.payload.provider || s.provider };
      s.view = 'table';
      s.currentData = null;
    },
    closeReport(s) { s.openReport = null; s.currentData = null; },
    setView(s, a) { s.view = a.payload; },
    setSidebarCollapsed(s, a) { s.sidebarCollapsed = a.payload; },
    setFilter(s, a) { s.filters = { ...s.filters, ...a.payload }; },
    setHiddenColumn(s, a) {
      const { key, hidden } = a.payload;
      if (hidden) s.filters.hiddenColumns[key] = true;
      else delete s.filters.hiddenColumns[key];
    },
    setCompare(s, a) { s.compare = { ...s.compare, ...a.payload }; },

    // ----- Saved-report actions -------------------------------------------

    // Add a saved customization to the active provider's `custom` list.
    // Payload: { baseName, baseCategory, label?, author? } — falls back to
    // an auto-generated name + Maya Chen as author for the demo.
    saveAsCustom(s, a) {
      const provider = a.payload.provider || s.provider;
      const now = new Date().toISOString().slice(0, 10);
      const item = {
        id: newId('cr'),
        name: a.payload.label || `${a.payload.baseName} – Custom`,
        base: a.payload.baseName,
        category: a.payload.baseCategory,
        createdBy: a.payload.author || 'Maya Chen',
        createdAt: now,
        modifiedAt: now,
        shared: 'Private',
      };
      s.savedReports[provider].custom.unshift(item);
    },

    // Save the current report as a draft.
    saveAsDraft(s, a) {
      const provider = a.payload.provider || s.provider;
      const now = new Date().toISOString().slice(0, 10);
      const item = {
        id: newId('dr'),
        name: a.payload.label || `${a.payload.baseName} – Draft`,
        based: a.payload.baseName,
        category: a.payload.baseCategory,
        author: a.payload.author || 'Maya Chen',
        modifiedAt: now,
      };
      s.savedReports[provider].drafts.unshift(item);
    },

    // Publish a draft (or directly publish the current report).
    // Payload: { draftId? } OR { baseName, baseCategory, label?, recipients? }
    publishDraft(s, a) {
      const provider = a.payload.provider || s.provider;
      const now = new Date().toISOString().slice(0, 10);
      const drafts = s.savedReports[provider].drafts;
      let publishedItem;

      if (a.payload.draftId) {
        const idx = drafts.findIndex((d) => d.id === a.payload.draftId);
        if (idx === -1) return;
        const draft = drafts.splice(idx, 1)[0];
        publishedItem = {
          id: newId('pr'),
          name: draft.name.replace(/\s*–\s*Draft$/i, ''),
          publishedBy: draft.author,
          publishedAt: now,
          recipients: a.payload.recipients || 'Internal',
          version: 'v1',
          based: draft.based,
        };
      } else {
        publishedItem = {
          id: newId('pr'),
          name: a.payload.label || a.payload.baseName,
          publishedBy: a.payload.author || 'Maya Chen',
          publishedAt: now,
          recipients: a.payload.recipients || 'Internal',
          version: 'v1',
          based: a.payload.baseName,
        };
      }
      s.savedReports[provider].published.unshift(publishedItem);
    },

    // Move a saved item to the Archived list. Payload: { kind, id }.
    archiveItem(s, a) {
      const provider = a.payload.provider || s.provider;
      const { kind, id } = a.payload;
      const bucket = s.savedReports[provider][kind];
      if (!bucket) return;
      const idx = bucket.findIndex((x) => x.id === id);
      if (idx === -1) return;
      const item = bucket.splice(idx, 1)[0];
      const now = new Date().toISOString().slice(0, 10);
      s.savedReports[provider].archived.unshift({
        id: newId('ar'),
        name: item.name,
        author: item.author || item.createdBy || item.publishedBy || '—',
        archivedAt: now,
        originalDate: item.createdAt || item.publishedAt || item.modifiedAt || now,
        based: item.base || item.based,
      });
    },

    // Restore an archived item back to drafts. Payload: { id }.
    restoreItem(s, a) {
      const provider = a.payload.provider || s.provider;
      const archived = s.savedReports[provider].archived;
      const idx = archived.findIndex((x) => x.id === a.payload.id);
      if (idx === -1) return;
      const item = archived.splice(idx, 1)[0];
      const now = new Date().toISOString().slice(0, 10);
      s.savedReports[provider].drafts.unshift({
        id: newId('dr'),
        name: item.name,
        based: item.based || 'Profit and Loss',
        author: item.author,
        modifiedAt: now,
      });
    },

    // Remove a saved item permanently. Payload: { kind, id }.
    deleteSaved(s, a) {
      const provider = a.payload.provider || s.provider;
      const { kind, id } = a.payload;
      const bucket = s.savedReports[provider]?.[kind];
      if (!bucket) return;
      const idx = bucket.findIndex((x) => x.id === id);
      if (idx !== -1) bucket.splice(idx, 1);
    },
  },
  extraReducers: (b) => {
    b.addCase(loadReportData.pending,   (s) => { s.status = 'loading'; s.error = null; })
     .addCase(loadReportData.fulfilled, (s, a) => {
       s.status = 'succeeded';
       s.currentData = a.payload;
       // Mark this report as recently run for the active provider.
       if (s.openReport?.name) {
         s.recentRuns[s.provider] = s.recentRuns[s.provider] || {};
         s.recentRuns[s.provider][s.openReport.name] = new Date().toISOString();
       }
     })
     .addCase(loadReportData.rejected,  (s, a) => { s.status = 'failed'; s.error = a.error.message; });
  },
});

export const {
  setProvider,
  setActiveCategory, setQuery, toggleFavorite, setShowFavoritesOnly,
  openReport, closeReport, setView, setSidebarCollapsed,
  setFilter, setHiddenColumn, setCompare,
  saveAsCustom, saveAsDraft, publishDraft,
  archiveItem, restoreItem, deleteSaved,
} = slice.actions;

export default slice.reducer;

// ----- Selectors -----
export const selectProvider         = (s) => s.reports.provider;
export const selectProviderMeta     = (s) => getProvider(s.reports.provider);
export const selectAllProviders     = () => PROVIDERS;

const selectByProvider = (s) => s.reports.byProvider[s.reports.provider];

export const selectCategories       = (s) => CATALOGS[s.reports.provider]?.categories || [];
export const selectReportsByCategory = (s) => CATALOGS[s.reports.provider]?.reportsByCategory || {};
export const selectActiveCategory   = (s) => selectByProvider(s).activeCategory;
export const selectQuery            = (s) => selectByProvider(s).query;
export const selectFavorites        = (s) => selectByProvider(s).favorites;
export const selectShowFavoritesOnly = (s) => selectByProvider(s).showFavoritesOnly;

export const selectOpenReport       = (s) => s.reports.openReport;
export const selectView             = (s) => s.reports.view;
export const selectSidebarCollapsed = (s) => s.reports.sidebarCollapsed;
export const selectFilters          = (s) => s.reports.filters;
export const selectCompare          = (s) => s.reports.compare;
export const selectReportData       = (s) => s.reports.currentData;
export const selectReportStatus     = (s) => s.reports.status;

// Saved-report selectors — return the array for a given kind under the
// active provider.
export const selectSavedReports = (kind) => (s) =>
  s.reports.savedReports[s.reports.provider]?.[kind] || [];

export const selectCustomReports    = selectSavedReports('custom');
export const selectDraftReports     = selectSavedReports('drafts');
export const selectPublishedReports = selectSavedReports('published');
export const selectArchivedReports  = selectSavedReports('archived');

// Recent-run map for the active provider.
export const selectRecentRuns = (s) => s.reports.recentRuns[s.reports.provider] || {};

// Categories with counts derived from reportsByCategory.
export const selectCategoriesWithCounts = createSelector(
  [selectCategories, selectReportsByCategory],
  (cats, byCat) => {
    const totalCount = Object.values(byCat).reduce((acc, list) => acc + list.length, 0);
    return cats.map((c) => ({
      ...c,
      count: c.id === 'all' ? totalCount : (byCat[c.id]?.length || 0),
    }));
  },
);

// Reports visible after category + search + favorites filters applied.
export const selectVisibleReports = createSelector(
  [selectReportsByCategory, selectActiveCategory, selectQuery, selectFavorites, selectShowFavoritesOnly],
  (byCat, cat, q, favs, favOnly) => {
    const flat = cat === 'all'
      ? Object.entries(byCat).flatMap(([c, list]) => list.map((r) => ({ ...r, category: c })))
      : (byCat[cat] || []).map((r) => ({ ...r, category: cat }));
    const needle = q.trim().toLowerCase();
    return flat.filter((r) => {
      if (favOnly && !favs[r.name]) return false;
      if (!needle) return true;
      return r.name.toLowerCase().includes(needle) || r.desc.toLowerCase().includes(needle);
    });
  },
);

export const selectIsViewerOpen = (s) => !!s.reports.openReport;
