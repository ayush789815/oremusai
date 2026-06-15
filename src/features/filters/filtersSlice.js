import { createSlice, createSelector } from '@reduxjs/toolkit';

export const PERIODS = [
  { id: '30d',     label: 'Last 30 days',         days: 30   },
  { id: '90d',     label: 'Last quarter',         days: 90   },
  { id: '6m',      label: 'Last 6 months',        days: 180  },
  { id: '1y',      label: 'Last 12 months',       days: 365  },
  { id: 'this-fy', label: 'This fiscal year',     days: null },
  { id: 'prev-fy', label: 'Previous fiscal year', days: null },
  { id: 'ytd',     label: 'Year to date',         days: null },
  { id: 'custom',  label: 'Custom range',         days: null },
];

const initialState = {
  searchQuery: '',
  // Default to the previous fiscal year: the current FY (which only began on
  // Apr 1) is typically sparse, so landing on it makes the dashboard look empty
  // and switching between the short presets (all inside the same near-empty
  // window) appears to do nothing. Matches the Reports page default.
  period: 'prev-fy',
  customRange: { from: null, to: null },
  basis: 'accrual', // 'accrual' | 'cash' — accounting basis for dashboard metrics
  customer: '',     // selected customer id ('' = all customers) — /metrics filter
  currency: '',     // selected currency id ('' = org base currency) — /metrics filter
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery(s, a) { s.searchQuery = a.payload; },
    setPeriod(s, a)      { s.period = a.payload; },
    setCustomRange(s, a) { s.customRange = a.payload; },
    setBasis(s, a)       { s.basis = a.payload === 'cash' ? 'cash' : 'accrual'; },
    setCustomer(s, a)    { s.customer = a.payload || ''; },
    setCurrency(s, a)    { s.currency = a.payload || ''; },
    resetFilters()       { return initialState; },
  },
});

export const { setSearchQuery, setPeriod, setCustomRange, setBasis, setCustomer, setCurrency, resetFilters } = filtersSlice.actions;

export const selectSearchQuery = (s) => s.filters.searchQuery;
export const selectPeriod      = (s) => s.filters.period;
export const selectCustomRange = (s) => s.filters.customRange;
export const selectBasis       = (s) => s.filters.basis || 'accrual';
export const selectCustomer    = (s) => s.filters.customer || '';
export const selectCurrency    = (s) => s.filters.currency || '';

export const selectPeriodLabel = (s) => {
  const { period, customRange } = s.filters;
  if (period === 'custom' && customRange.from && customRange.to) {
    return `${customRange.from} → ${customRange.to}`;
  }
  return PERIODS.find((p) => p.id === period)?.label || 'Last 30 days';
};

// Format using LOCAL date components, NOT toISOString(): toISOString converts to
// UTC, which in IST (UTC+5:30) shifts a local-midnight date back a day (e.g.
// new Date(2026,5,1) → "2026-05-31"), breaking day-offset/YTD boundaries.
const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Indian fiscal year runs Apr 1 – Mar 31. Returns the calendar year in which the
// fiscal year containing `d` started (e.g. Jun 2026 → 2026, Feb 2026 → 2025).
const fyStartYear = (d) => (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1);

// Memoized with createSelector so the returned object reference is stable
// and useEffect deps don't trigger spurious re-fetches.
export const selectDateRange = createSelector(
  selectPeriod,
  selectCustomRange,
  (period, customRange) => {
    const today = new Date();

    if (period === 'custom') {
      return {
        from: customRange.from || `${today.getFullYear()}-01-01`,
        to:   customRange.to   || fmt(today),
      };
    }

    if (period === 'this-fy') {
      const y = fyStartYear(today);
      return { from: `${y}-04-01`, to: fmt(today) };
    }

    if (period === 'prev-fy') {
      const y = fyStartYear(today) - 1;
      return { from: `${y}-04-01`, to: `${y + 1}-03-31` };
    }

    if (period === 'ytd') {
      return { from: `${today.getFullYear()}-01-01`, to: fmt(today) };
    }

    const days = PERIODS.find((p) => p.id === period)?.days ?? 30;
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    return { from: fmt(from), to: fmt(today) };
  }
);

export default filtersSlice.reducer;
