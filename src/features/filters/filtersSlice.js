import { createSlice, createSelector } from '@reduxjs/toolkit';

export const PERIODS = [
  { id: '30d',    label: 'Last 30 days',  days: 30   },
  { id: '90d',    label: 'Last quarter',  days: 90   },
  { id: '6m',     label: 'Last 6 months', days: 180  },
  { id: '1y',     label: 'Last year',     days: 365  },
  { id: 'ytd',    label: 'Year to date',  days: null },
  { id: 'custom', label: 'Custom range',  days: null },
];

const initialState = {
  searchQuery: '',
  period: 'ytd',
  customRange: { from: null, to: null },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery(s, a) { s.searchQuery = a.payload; },
    setPeriod(s, a)      { s.period = a.payload; },
    setCustomRange(s, a) { s.customRange = a.payload; },
    resetFilters()       { return initialState; },
  },
});

export const { setSearchQuery, setPeriod, setCustomRange, resetFilters } = filtersSlice.actions;

export const selectSearchQuery = (s) => s.filters.searchQuery;
export const selectPeriod      = (s) => s.filters.period;
export const selectCustomRange = (s) => s.filters.customRange;

export const selectPeriodLabel = (s) => {
  const { period, customRange } = s.filters;
  if (period === 'custom' && customRange.from && customRange.to) {
    return `${customRange.from} → ${customRange.to}`;
  }
  return PERIODS.find((p) => p.id === period)?.label || 'Last 30 days';
};

const fmt = (d) => d.toISOString().slice(0, 10);

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
