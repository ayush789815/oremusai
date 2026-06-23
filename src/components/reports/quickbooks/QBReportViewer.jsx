'use client';

// QuickBooks Online–style report viewer body. Used by ReportViewerModal
// when the open report belongs to the `quickbooks` provider.
//
// Reads/writes the same slice fields the Zoho viewer does so all data flow,
// drilldowns, exports and view-switching keep working — only the chrome
// changes. The layout mirrors QBO's report builder: a controls bar
// (period / dates / accounting method / display / compare + Customize),
// then a clean report sheet with a Compact/icon toolbar, centered title block,
// the QBO-styled table and an "Add note · basis | date" footer.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, ArrowLeft, ChevronDown, Star, Sliders, Save, Mail, Printer, Download,
  Play, BarChart3, PieChart, LineChart, Table as TableIcon, MoreHorizontal,
  RefreshCw, FileText, FileSearch,
} from 'lucide-react';
import ReportTable from '../ReportTable.jsx';
import ReportChart from '../ReportChart.jsx';
import ReportSkeleton from '../ReportSkeleton.jsx';
import ExportMenu from '../ExportMenu.jsx';
import SendReportModal from '../SendReportModal.jsx';
import {
  selectOpenReport, selectView, selectReportData, selectReportStatus,
  selectFilters, selectCompare, selectFavorites,
  closeReport, setView, setFilter, setCompare, toggleFavorite, loadReportData,
  saveAsCustom,
} from '../../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../../features/clients/clientsSlice.js';
import { dateLabel, resolvePresetRange } from '../../../features/reports/data/dateRanges.js';
import { cn } from '../../../utils/classNames.js';

// QuickBooks brand green used for primary actions.
const QB_GREEN = '#2CA01C';

// ----------------------------------------------------------------------------
// QBO filter bar field definitions

// [presetKey, label] — keys MUST match DATE_PRESETS (resolvePresetRange) so the
// selected period actually drives the from_date/to_date sent to the backend.
// Full QuickBooks-Online "Report period" option set (keys map to
// resolvePresetRange so the choice actually drives the from/to dates).
const REPORT_PERIODS = [
  ['all-dates',                     'All Dates'],
  ['custom',                        'Custom'],
  ['today',                         'Today'],
  ['this-week',                     'This week'],
  ['this-week-to-date',             'This week-to-date'],
  ['this-month',                    'This month'],
  ['this-month-to-date',            'This month-to-date'],
  ['this-quarter',                  'This quarter'],
  ['this-quarter-to-date',          'This quarter to date'],
  ['this-fiscal-quarter',           'This fiscal quarter'],
  ['this-fiscal-quarter-to-date',   'This fiscal quarter to date'],
  ['this-year',                     'This year'],
  ['this-year-to-date',             'This year to date'],
  ['this-year-to-last-month',       'This year to last month'],
  ['this-fiscal-year-full',         'This fiscal year'],
  ['this-fiscal-year',              'This fiscal year to date'],
  ['this-fiscal-year-to-last-month','This fiscal year to last month'],
  ['last-6-months',                 'Last 6 months'],
  ['yesterday',                     'Yesterday'],
  ['last-week',                     'Last week'],
  ['last-week-to-date',             'Last week-to-date'],
  ['last-week-to-today',            'Last week to today'],
  ['last-month',                    'Last month'],
  ['last-month-to-date',            'Last month-to-date'],
  ['last-month-to-today',           'Last month to today'],
  ['last-quarter',                  'Last quarter'],
  ['last-quarter-to-date',          'Last quarter to date'],
  ['last-quarter-to-today',         'Last quarter to today'],
  ['last-fiscal-quarter',           'Last fiscal quarter'],
  ['last-fiscal-quarter-to-date',   'Last fiscal quarter to date'],
  ['previous-year',                 'Last year'],
  ['last-year-to-date',             'Last year to date'],
  ['last-year-to-last-month',       'Last year to last month'],
  ['previous-fiscal-year',          'Last fiscal year'],
  ['last-fiscal-year-to-date',      'Last fiscal year to date'],
  ['last-fiscal-year-to-last-month','Last fiscal year to last month'],
  ['since-30-days',                 'Since 30 days ago'],
  ['since-60-days',                 'Since 60 days ago'],
  ['since-90-days',                 'Since 90 days ago'],
  ['since-365-days',                'Since 365 days ago'],
  ['next-week',                     'Next week'],
  ['next-4-weeks',                  'Next four weeks'],
  ['next-month',                    'Next month'],
  ['next-quarter',                  'Next quarter'],
  ['next-year',                     'Next year'],
];

// Label lookup for the period text under the report title (uses the QBO labels
// above so extended keys render correctly without touching the shared
// DATE_PRESETS that drives the Zoho/Xero filter bar).
const REPORT_PERIOD_LABELS = Object.fromEntries(REPORT_PERIODS);

const DISPLAY_COLUMNS_BY = [
  ['total',       'Total Only'],
  ['customers',   'Customer'],
  ['employees',   'Employee'],
  ['products',    'Product/Service'],
  ['days',        'Days'],
  ['weeks',       'Weeks'],
  ['months',      'Months'],
  ['quarters',    'Quarters'],
  ['years',       'Years'],
  ['vendors',     'Vendor'],
];

// Which "Display columns by" options each provider's report engine can actually
// honor, so the dropdown never offers a choice that silently does nothing:
//  - Zoho is computed from the local GL ledger → time splits only (incl. days/weeks).
//  - QuickBooks supports every QBO summarize_column_by grouping natively.
//  - Xero's report API only exposes MONTH/QUARTER/YEAR timeframes.
const DISPLAY_BY_PROVIDER = {
  zoho:       ['total', 'days', 'weeks', 'months', 'quarters', 'years'],
  quickbooks: ['total', 'days', 'weeks', 'months', 'quarters', 'years', 'customers', 'employees', 'products', 'vendors'],
  xero:       ['total', 'months', 'quarters', 'years'],
};

function displayColumnsFor(provider) {
  const allow = DISPLAY_BY_PROVIDER[provider];
  return allow ? DISPLAY_COLUMNS_BY.filter(([v]) => allow.includes(v)) : DISPLAY_COLUMNS_BY;
}

// QBO "Compare to" — only the period comparisons the report pipeline actually
// produces (prior year / prior period). The QBO "% of …" calculations and
// YTD/PY-YTD/Custom comparisons aren't supported by the provider report
// engines here, so they're omitted rather than shown as dead options.
const COMPARE_GROUPS = [
  ['Time Periods', [
    ['previous-year',   'Previous year (PY)'],
    ['previous-period', 'Previous Period (PP)'],
  ]],
];

const SHOW_ROWS = [
  ['active',   'Active'],
  ['all',      'All'],
  ['nonzero',  'Non-zero'],
];

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const fieldLabelCls =
  'block text-[11px] text-navy-500 dark:text-navy-400 mb-1';

function FilterField({ label, children, className }) {
  return (
    <label className={cn('flex flex-col gap-0.5', className)}>
      <span className={fieldLabelCls}>{label}</span>
      {children}
    </label>
  );
}

function periodLabel(rangeId, customFrom, customTo) {
  if (rangeId === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`;
  return REPORT_PERIOD_LABELS[rangeId] || dateLabel(rangeId);
}

// Point-in-time reports QuickBooks titles "As of <date>" (the to-date), rather
// than a date-range label like "This year to date".
const AS_OF_REPORTS = new Set([
  'Balance Sheet', 'Balance Sheet Summary', 'Balance Sheet Detail',
  'Balance Sheet Comparison', 'Horizontal Balance Sheet',
  'AR Aging Summary', 'A/R Aging Summary', 'Aged Receivables Summary',
  'AR Aging Detail', 'A/R Aging Detail', 'Aged Receivables Detail',
  'AP Aging Summary', 'A/P Aging Summary', 'Aged Payables Summary',
  'AP Aging Detail', 'A/P Aging Detail', 'Aged Payables Detail',
  '1099 Contractor Balance', '1099 Contractor Balance Summary',
]);

// Reports QuickBooks titles as "Since <Month D, YYYY>" from the period's
// from-date (e.g. "1099 Transaction Detail Report" with "Since 365 Days Ago").
const SINCE_REPORTS = new Set([
  '1099 Transaction Detail', '1099 Transaction Detail Report',
]);

// Contact / list reports have no period at all — QuickBooks shows only the
// company + report name (no third date line).
const NO_PERIOD_REPORTS = new Set([
  'Vendor Contact List', 'Customer Contact List', 'Employee Contact List',
]);

function sinceLabel(fromDate) {
  if (!fromDate) return '';
  const [y, m, d] = String(fromDate).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `Since ${new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

// "As of <Month D, YYYY>" from a YYYY-MM-DD string, parsed by local components
// to dodge the IST toISOString day-shift gotcha.
function asOfLabel(toDate) {
  if (!toDate) return '';
  const [y, m, d] = String(toDate).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `As of ${new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

// Period reports QuickBooks titles with the spelled-out date range, e.g.
// "January 1-June 19, 2026" (Statement of Cash Flows).
const RANGE_TITLE_REPORTS = new Set([
  'Cash Flow Statement', 'Statement of Cash Flows',
  'Statement of Cash Flows - Direct', 'Statement of Cash Flows - Indirect',
  'Cash Summary',
  'Sales by Customer', 'Sales by Customer Summary', 'Sales by Customer Detail',
  'Income by Customer Summary',
  'Sales by Product / Service Detail', 'Sales by Product/Service Detail',
  'Sales by Product / Service Summary',
  'Expenses by Vendor Summary', 'Expenses by Vendor', 'Expenses by Vendor Detail',
  'Transaction Detail by Account',
  'General Ledger',
]);

function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

function rangeTitle(from, to) {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (!a || !b) return '';
  const full = { year: 'numeric', month: 'long', day: 'numeric' };
  if (a.getFullYear() === b.getFullYear()) {
    const start = a.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `${start}-${b.toLocaleDateString('en-US', full)}`;
  }
  return `${a.toLocaleDateString('en-US', full)} - ${b.toLocaleDateString('en-US', full)}`;
}

// Translate a "Compare to" choice into a compare patch. Picking a comparison
// period turns ON multi-period columns (count >= 2) and selects the right basis
// (year vs period) so the extra column actually renders after Run report;
// "None" collapses back to a single column.
function compareSelection(value, currentCount) {
  if (value === 'none') return { with: value, count: 1 };
  return {
    with: value,
    baseOn: value.includes('year') ? 'year' : 'period',
    count: currentCount > 1 ? currentCount : 2,
  };
}

// Renders the QBO "Compare to" options: a standalone "None" then the grouped
// Time Periods / Calculations optgroups. Shared by the controls bar + sidebar.
function CompareOptions() {
  return (
    <>
      <option value="none">None</option>
      {COMPARE_GROUPS.map(([group, opts]) => (
        <optgroup key={group} label={group}>
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </optgroup>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------------
// Slim top bar — back / breadcrumb / title + favorite / close

function QBTopBar({ report, favorited, onToggleFavorite, onClose }) {
  return (
    <header className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
        >
          <ArrowLeft size={14} /> Back to standard reports
        </button>
        <span className="hidden md:inline text-navy-300">·</span>
        <h2 className="hidden md:flex items-center gap-2 text-[14px] font-bold text-navy-900 dark:text-white truncate">
          {report.name}
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn('grid place-items-center transition', favorited ? 'text-amber-500' : 'text-navy-300 hover:text-amber-500')}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={14} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800 shrink-0"
      >
        <X size={15} />
      </button>
    </header>
  );
}

// ----------------------------------------------------------------------------
// QBO-style controls bar (period · dates · method · display · compare · actions)

function QBControlsBar({ provider, filters, compare, onSetFilter, onSetCompare, onRun, onCustomize, onSaveCustom, savedToast, onRefresh, onEmail, exportMeta }) {
  const displayOptions = displayColumnsFor(provider);
  return (
    <div className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        <FilterField label="Report period" className="w-[160px]">
          <select
            value={filters.dateRange}
            onChange={(e) => {
              // Picking a preset applies immediately (no separate "Run report"
              // click needed) — matches the custom-date and dashboard behavior.
              onSetFilter({ dateRange: e.target.value });
              if (e.target.value !== 'custom') onRun();
            }}
            className={fieldCls}
          >
            {REPORT_PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
        <FilterField label="From" className="w-[140px]">
          <input
            type="date"
            value={filters.customFrom || ''}
            onChange={(e) => onSetFilter({ customFrom: e.target.value, dateRange: 'custom' })}
            className={fieldCls}
          />
        </FilterField>
        <FilterField label="To" className="w-[140px]">
          <input
            type="date"
            value={filters.customTo || ''}
            onChange={(e) => onSetFilter({ customTo: e.target.value, dateRange: 'custom' })}
            className={fieldCls}
          />
        </FilterField>

        <FilterField label="Accounting method">
          <div className="inline-flex h-9 rounded-md border border-navy-300 dark:border-navy-700 overflow-hidden">
            {[['cash', 'Cash'], ['accrual', 'Accrual']].map(([v, l]) => {
              const active = (filters.basis || 'accrual') === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => { onSetFilter({ basis: v }); onRun(); }}
                  className={cn(
                    'px-4 text-[13px] font-semibold transition',
                    active
                      ? 'bg-navy-800 text-white dark:bg-white dark:text-navy-900'
                      : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800',
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </FilterField>

        <FilterField label="Display columns by" className="w-[150px]">
          <select
            value={filters.interval}
            onChange={(e) => { onSetFilter({ interval: e.target.value }); onRun(); }}
            className={fieldCls}
          >
            {displayOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>

        <FilterField label="Compare to" className="w-[170px]">
          <select
            value={compare.with}
            onChange={(e) => { onSetCompare(compareSelection(e.target.value, compare.count)); onRun(); }}
            className={fieldCls}
          >
            <CompareOptions />
          </select>
        </FilterField>

        <div className="grow" />

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEmail}
            className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Mail size={15} /> Email
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Printer size={15} /> Print
          </button>
          <ExportMenu
            meta={exportMeta}
            trigger={(
              <button
                type="button"
                className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
              >
                <Download size={15} /> Export
              </button>
            )}
          />
        </div>

        <button
          type="button"
          onClick={onRun}
          className="h-9 px-4 rounded-md text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-soft hover:opacity-95 shrink-0"
          style={{ background: QB_GREEN }}
        >
          <Play size={13} /> Run report
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// QBO Customize sidebar (slides in from the right)

function CustomizeSidebar({ open, onClose, provider, filters, compare, onSetFilter, onSetCompare }) {
  if (!open) return null;
  const displayOptions = displayColumnsFor(provider);
  return (
    <aside className="hidden xl:flex flex-col w-[320px] shrink-0 border-l border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 overflow-y-auto scroll-thin">
      <header className="px-5 py-3 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between">
        <div>
          <div className="text-[14px] font-bold text-navy-900 dark:text-white">Customize</div>
          <div className="text-[11px] text-navy-500">Tweak fields, then run the report.</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close customize" className="h-8 w-8 grid place-items-center rounded-md text-navy-500 hover:bg-navy-100 dark:hover:bg-navy-800">
          <X size={15} />
        </button>
      </header>

      <div className="px-5 py-4 space-y-5 text-[12.5px] text-navy-700 dark:text-navy-200">
        <section>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-2">General</div>
          <FilterField label="Report period">
            <select value={filters.dateRange} onChange={(e) => onSetFilter({ dateRange: e.target.value })} className={fieldCls}>
              {REPORT_PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <FilterField label="From"><input type="date" value={filters.customFrom || ''} onChange={(e) => onSetFilter({ customFrom: e.target.value, dateRange: 'custom' })} className={fieldCls} /></FilterField>
            <FilterField label="To"><input type="date" value={filters.customTo || ''} onChange={(e) => onSetFilter({ customTo: e.target.value, dateRange: 'custom' })} className={fieldCls} /></FilterField>
          </div>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-2">Rows / Columns</div>
          <FilterField label="Display columns by">
            <select value={filters.interval} onChange={(e) => onSetFilter({ interval: e.target.value })} className={fieldCls}>
              {displayOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Show rows">
            <select
              value={filters.includeZero ? 'all' : 'active'}
              onChange={(e) => onSetFilter({ includeZero: e.target.value === 'all' })}
              className={fieldCls}
            >
              {SHOW_ROWS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Compare another period">
            <select value={compare.with} onChange={(e) => onSetCompare(compareSelection(e.target.value, compare.count))} className={fieldCls}>
              <CompareOptions />
            </select>
          </FilterField>
          <FilterField label="Number of periods">
            <select value={compare.count} onChange={(e) => onSetCompare({ count: Number(e.target.value) })} className={fieldCls}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </FilterField>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-2">Format</div>
          <FilterField label="Number format">
            <select value={filters.numberFormat} onChange={(e) => onSetFilter({ numberFormat: e.target.value })} className={fieldCls}>
              <option value="international">International (1,234)</option>
              <option value="indian">Indian (1,23,456)</option>
            </select>
          </FilterField>
          <FilterField label="Decimal places">
            <select value={filters.decimals} onChange={(e) => onSetFilter({ decimals: Number(e.target.value) })} className={fieldCls}>
              {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </FilterField>
        </section>

        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-1">Filters</div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={filters.includeZero} onChange={(e) => onSetFilter({ includeZero: e.target.checked })} className="accent-emerald-600" />
            Include zero-balance rows
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={filters.includeSubAccounts} onChange={(e) => onSetFilter({ includeSubAccounts: e.target.checked })} className="accent-emerald-600" />
            Include sub-accounts
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={filters.includeDeleted} onChange={(e) => onSetFilter({ includeDeleted: e.target.checked })} className="accent-emerald-600" />
            Include deleted records
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={filters.showDebitCredit} onChange={(e) => onSetFilter({ showDebitCredit: e.target.checked })} className="accent-emerald-600" />
            Show debit/credit columns
          </label>
        </section>
      </div>

      <div className="mt-auto px-5 py-3 border-t border-navy-100 dark:border-navy-800 flex items-center gap-2">
        <button type="button" onClick={onClose} className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12.5px] font-semibold">Cancel</button>
        <button type="button" onClick={onClose} className="h-9 px-3 rounded-md text-white text-[12.5px] font-semibold ml-auto" style={{ background: QB_GREEN }}>
          Run report
        </button>
      </div>
    </aside>
  );
}

// ----------------------------------------------------------------------------
// QBReportViewer — main export

const VIEW_TABS = [
  { id: 'table', icon: TableIcon, label: 'Compact' },
  { id: 'bar',   icon: BarChart3, label: 'Bar' },
  { id: 'pie',   icon: PieChart,  label: 'Pie' },
  { id: 'line',  icon: LineChart, label: 'Line' },
];

function iconBtnCls() {
  return 'h-8 w-8 grid place-items-center rounded-md text-navy-500 hover:bg-navy-100 dark:hover:bg-navy-800';
}

// Empty / failed-fetch illustration shown in place of a report sheet when a
// live report returns no data. Replaces the old mock-data fallback so a
// connected client sees an honest "no data" state instead of dummy numbers.
function ReportEmptyState({ reason, message, onRetry }) {
  const isError = reason === 'error';
  const isUnavailable = reason === 'unavailable';
  const isRangeTooLong = reason === 'range_too_long';
  const title = isError
    ? 'Unable to load this report'
    : isUnavailable
      ? 'Not available for this connection'
      : isRangeTooLong
        ? 'Date range too wide'
        : 'No data to display';
  const subtitle = message
    ? message
    : isError
      ? "We couldn't fetch live data for this report. Your connection may be unavailable or still syncing — please try again."
      : isUnavailable
        ? "Your accounting provider's API doesn't offer this report, so there's nothing to display here."
        : 'There are no records for the selected period. Try a different date range.';
  const showRetry = onRetry && !isUnavailable && !isRangeTooLong;
  return (
    <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
      <div className="relative mb-5">
        <div className="h-20 w-20 rounded-2xl bg-navy-50 dark:bg-navy-800/60 border border-navy-200/70 dark:border-navy-700 grid place-items-center">
          <FileSearch size={34} className="text-navy-300 dark:text-navy-500" strokeWidth={1.5} />
        </div>
        <span
          className={cn(
            'absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full grid place-items-center text-white text-[15px] font-bold shadow-sm',
            isError ? 'bg-rose-400 dark:bg-rose-500' : 'bg-navy-300 dark:bg-navy-600',
          )}
        >
          {isError ? '!' : '∅'}
        </span>
      </div>
      <h3 className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-navy-500 dark:text-navy-400">{subtitle}</p>
      {showRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[12.5px] font-semibold text-white shadow-sm"
          style={{ background: QB_GREEN }}
        >
          <RefreshCw size={13} /> Try again
        </button>
      )}
    </div>
  );
}

export default function QBReportViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const view = useSelector(selectView);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const compare = useSelector(selectCompare);
  const favorites = useSelector(selectFavorites);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const favorited = !!favorites[report.name];

  const handleSaveCustom = () => {
    dispatch(saveAsCustom({
      baseName: report.name,
      baseCategory: report.category,
      provider: report.provider,
    }));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };
  const loading = status === 'loading';

  const periodText = useMemo(() => {
    // Contact / list reports show no period line.
    if (NO_PERIOD_REPORTS.has(report.name)) return '';
    const r = resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo });
    // Balance-sheet-style reports read as "As of <to-date>".
    if (AS_OF_REPORTS.has(report.name)) {
      const lbl = asOfLabel(filters.customTo || r.to_date);
      if (lbl) return lbl;
    }
    // Cash-flow-style reports read as the spelled-out date range.
    if (RANGE_TITLE_REPORTS.has(report.name)) {
      const lbl = rangeTitle(filters.customFrom || r.from_date, filters.customTo || r.to_date);
      if (lbl) return lbl;
    }
    // "Since <date>" reports read from the period's start date.
    if (SINCE_REPORTS.has(report.name)) {
      const lbl = sinceLabel(filters.customFrom || r.from_date);
      if (lbl) return lbl;
    }
    return periodLabel(filters.dateRange, filters.customFrom, filters.customTo);
  }, [report.name, filters.dateRange, filters.customFrom, filters.customTo]);

  // Spelled-out actual date range (e.g. "June 1-June 23, 2026") shown UNDER the
  // period label so a named preset like "This month" also reveals its concrete
  // dates. Prefers the backend-resolved dates (data.meta) for exactness, else the
  // resolved preset range. Skipped for the special reports whose periodText is
  // already a date or range (As of / range-title / since / no-period).
  const dateRangeText = useMemo(() => {
    if (NO_PERIOD_REPORTS.has(report.name)) return '';
    if (AS_OF_REPORTS.has(report.name)) return '';
    if (RANGE_TITLE_REPORTS.has(report.name)) return '';
    if (SINCE_REPORTS.has(report.name)) return '';
    const r = resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo });
    const from = data?.meta?.from || filters.customFrom || r.from_date;
    const to = data?.meta?.to || filters.customTo || r.to_date;
    return rangeTitle(from, to);
  }, [report.name, filters.dateRange, filters.customFrom, filters.customTo, data?.meta?.from, data?.meta?.to]);

  const basisText = filters.basis === 'cash' ? 'Cash basis' : 'Accrual basis';
  const nowText = useMemo(
    () => new Date().toLocaleString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    [],
  );

  // Re-fetch on demand (Run report button). provider comes from the open report
  // so the common viewer fetches the correct backend (Zoho / QuickBooks / Xero).
  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));

  // Auto-load on mount; the modal also kicks loadReportData on open.
  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <QBTopBar
        report={report}
        favorited={favorited}
        onToggleFavorite={() => dispatch(toggleFavorite(report.name))}
        onClose={() => dispatch(closeReport())}
      />

      <QBControlsBar
        provider={report.provider}
        filters={filters}
        compare={compare}
        onSetFilter={(patch) => dispatch(setFilter(patch))}
        onSetCompare={(patch) => dispatch(setCompare(patch))}
        onRun={runReport}
        onCustomize={() => setCustomizeOpen((o) => !o)}
        onSaveCustom={handleSaveCustom}
        savedToast={savedToast}
        onRefresh={runReport}
        onEmail={() => setEmailOpen(true)}
        exportMeta={{ company: client?.name, basis: basisText, from: filters.customFrom, to: filters.customTo }}
      />

      {/* Body grid: main area + optional customize rail */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto scroll-thin bg-navy-50/40 dark:bg-navy-950">
          {/* Report sheet */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1200px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card">
              {/* Sheet toolbar: view density tabs (icon actions live in the controls bar) */}
              <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-navy-100 dark:border-navy-800">
                <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
                  {VIEW_TABS.map((t) => {
                    const Icon = t.icon;
                    const active = view === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => dispatch(setView(t.id))}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap transition',
                          active
                            ? 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white'
                            : 'text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800',
                        )}
                      >
                        <Icon size={13} /> {t.label}
                        {t.id === 'table' && active && <ChevronDown size={12} className="text-navy-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Centered title block */}
              <div className="px-4 sm:px-10 pt-7 pb-2 text-center">
                <div className="text-[22px] font-bold text-navy-900 dark:text-white leading-tight">
                  {client?.name || 'Oremus'}
                </div>
                <div className="text-[14px] text-navy-700 dark:text-navy-200 mt-1">{report.name}</div>
                <div className="text-[12.5px] text-navy-500 mt-0.5">{periodText}</div>
                {dateRangeText && dateRangeText !== periodText && (
                  <div className="text-[11.5px] text-navy-400 mt-0.5">{dateRangeText}</div>
                )}
              </div>

              {/* Report body */}
              <div className="px-4 sm:px-8 pb-2">
                {loading || !data ? (
                  <ReportSkeleton />
                ) : data.emptyMessage && (!data.rows || data.rows.length === 0) ? (
                  <div className="py-10">
                    <div className="rounded-md border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 px-4 py-3 text-[13px] text-navy-700 dark:text-navy-200">
                      <span className="font-semibold">{data.emptyMessage.split('.')[0]}.</span>
                      {data.emptyMessage.slice(data.emptyMessage.indexOf('.') + 1)}
                    </div>
                  </div>
                ) : data.empty || !data.rows || data.rows.length === 0 ? (
                  <ReportEmptyState reason={data.emptyReason} message={data.message} onRetry={runReport} />
                ) : view === 'table' ? (
                  <ReportTable data={data} variant="quickbooks" />
                ) : (
                  <ReportChart kind={view} data={data} height={420} />
                )}
                {!loading && data?.note && (
                  <div className="mt-6 border-t border-navy-100 dark:border-navy-800 pt-4 text-[12px] text-navy-500 dark:text-navy-400 text-center leading-relaxed">
                    {data.note}
                  </div>
                )}
              </div>

              {/* Footer: add note (left) · basis | timestamp (right) */}
              <div className="px-4 sm:px-8 py-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <FileText size={13} /> Add note
                </span>
                <span className="text-navy-500 dark:text-navy-400">
                  {basisText} <span className="text-navy-300 dark:text-navy-600">|</span> {nowText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CustomizeSidebar
          open={customizeOpen}
          onClose={() => setCustomizeOpen(false)}
          provider={report.provider}
          filters={filters}
          compare={compare}
          onSetFilter={(patch) => dispatch(setFilter(patch))}
          onSetCompare={(patch) => dispatch(setCompare(patch))}
        />
      </div>

      <SendReportModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        reportName={report.name}
        data={data}
        meta={{ company: client?.name, basis: basisText, from: filters.customFrom, to: filters.customTo }}
      />
    </>
  );
}
