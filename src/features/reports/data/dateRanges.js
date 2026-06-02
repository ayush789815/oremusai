// Date-range presets shared by the reports filter bar and the loadReportData
// thunk. Fiscal-year presets follow the Indian Apr–Mar fiscal year (matching
// the connected Zoho Books org), so Profit & Loss / Balance Sheet open on the
// SAME period Zoho Books shows by default — keeping our numbers in lock-step
// with the live Zoho account.

export const DATE_PRESETS = [
  ['this-fiscal-year',     'This fiscal year'],
  ['previous-fiscal-year', 'Previous fiscal year'],
  ['today',                'Today'],
  ['this-week',            'This week'],
  ['this-month',           'This month'],
  ['this-quarter',         'This quarter'],
  ['this-year',            'This year (Jan–Dec)'],
  ['ytd',                  'Year to date'],
  ['yesterday',            'Yesterday'],
  ['previous-week',        'Previous week'],
  ['previous-month',       'Previous month'],
  ['previous-quarter',     'Previous quarter'],
  ['previous-year',        'Previous year (Jan–Dec)'],
  ['custom',               'Custom range'],
];

// Open reports on the previous fiscal year by default: the current fiscal year
// is typically only a month or two in (sparse/near-empty), whereas the prior
// FY has a full year of posted data — matching what Zoho shows out of the box.
export const DEFAULT_DATE_RANGE = 'previous-fiscal-year';

export const dateLabel = (id) =>
  DATE_PRESETS.find(([k]) => k === id)?.[1] || 'This fiscal year';

// Format a Date as YYYY-MM-DD using its LOCAL components. Using toISOString()
// here would shift dates built with new Date(y, m, d) back by a day in
// positive-UTC-offset timezones (e.g. IST), breaking fiscal-year boundaries.
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Indian fiscal year starts 1 April. Returns the calendar year in which the
// current fiscal year began (e.g. on 2026-06-01 → 2026; on 2026-02-01 → 2025).
function fiscalStartYear(today) {
  return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
}

// Resolve a DATE_PRESETS key into concrete { from_date, to_date } (YYYY-MM-DD)
// so the Zoho-live backend receives explicit dates.
export function resolvePresetRange(preset, custom = {}) {
  const today = new Date();
  const start = new Date(today); const end = new Date(today);
  const fy = fiscalStartYear(today);
  switch (preset) {
    case 'this-fiscal-year':     return { from_date: ymd(new Date(fy, 3, 1)),     to_date: ymd(today) };
    case 'previous-fiscal-year': return { from_date: ymd(new Date(fy - 1, 3, 1)), to_date: ymd(new Date(fy, 2, 31)) };
    case 'today':            return { from_date: ymd(today), to_date: ymd(today) };
    case 'yesterday':        start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); return { from_date: ymd(start), to_date: ymd(end) };
    case 'this-week':        start.setDate(today.getDate() - today.getDay()); return { from_date: ymd(start), to_date: ymd(today) };
    case 'previous-week':    end.setDate(today.getDate() - today.getDay() - 1); start.setDate(end.getDate() - 6); return { from_date: ymd(start), to_date: ymd(end) };
    case 'this-month':       return { from_date: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to_date: ymd(today) };
    case 'previous-month':   return { from_date: ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to_date: ymd(new Date(today.getFullYear(), today.getMonth(), 0)) };
    case 'this-quarter':     { const q = Math.floor(today.getMonth() / 3); return { from_date: ymd(new Date(today.getFullYear(), q * 3, 1)), to_date: ymd(today) }; }
    case 'previous-quarter': { const q = Math.floor(today.getMonth() / 3); return { from_date: ymd(new Date(today.getFullYear(), (q - 1) * 3, 1)), to_date: ymd(new Date(today.getFullYear(), q * 3, 0)) }; }
    case 'this-year':        return { from_date: ymd(new Date(today.getFullYear(), 0, 1)), to_date: ymd(today) };
    case 'ytd':              return { from_date: ymd(new Date(today.getFullYear(), 0, 1)), to_date: ymd(today) };
    case 'previous-year':    return { from_date: ymd(new Date(today.getFullYear() - 1, 0, 1)), to_date: ymd(new Date(today.getFullYear() - 1, 11, 31)) };
    case 'custom':           return { from_date: custom?.from || ymd(today), to_date: custom?.to || ymd(today) };
    default:                 return { from_date: ymd(new Date(fy, 3, 1)), to_date: ymd(today) };
  }
}
