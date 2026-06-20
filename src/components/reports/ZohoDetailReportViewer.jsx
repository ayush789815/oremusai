'use client';

// Zoho-Books-native viewer for Zoho "detail" reports (Credit Note Details,
// Recurring Invoice Details, …). Every other report uses the common QBO-style
// QBReportViewer; ReportViewerModal routes these reports here so their chrome
// mirrors Zoho Books exactly — a breadcrumb module header, a "Filters :" bar
// (Date Range, optional "Report By", More Filters, Run Report), a Table/Chart
// View + Group By + Customize Report Columns sub-bar, and a centered report
// sheet that shows Zoho's "no transactions" empty state.
//
// It is config-driven by the generator's `data.zoho` block
// ({ module, title, reportBy, customizeCount }) and `data.columns`, so one
// viewer serves every Zoho detail report.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu, X, ChevronDown, Plus, RefreshCw,
  SlidersHorizontal, CalendarClock, Table2, BarChart3,
} from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ExportMenu from './ExportMenu.jsx';
import ReportSkeleton from './ReportSkeleton.jsx';
import {
  selectOpenReport, selectReportData, selectReportStatus,
  selectFilters,
  closeReport, setFilter, loadReportData,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';
import { resolvePresetRange } from '../../features/reports/data/dateRanges.js';
import { fmt } from '../../utils/fmt.js';
import { cn } from '../../utils/classNames.js';

const ZOHO_BLUE = '#2563eb';

// Zoho Books "Date Range" presets — keys MUST resolve in resolvePresetRange.
const ZOHO_PERIODS = [
  ['this-month',           'This Month'],
  ['previous-month',       'Previous Month'],
  ['this-quarter',         'This Quarter'],
  ['previous-quarter',     'Previous Quarter'],
  ['this-fiscal-year',     'This Year'],
  ['previous-fiscal-year', 'Previous Year'],
  ['custom',               'Custom'],
];
const PERIOD_LABELS = Object.fromEntries(ZOHO_PERIODS);

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

// Format YYYY-MM-DD → DD/MM/YYYY (Zoho Indian display) using local components.
function dmy(s) {
  if (!s) return '';
  const [y, m, d] = String(s).split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

export default function ZohoDetailReportViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);

  const loading = status === 'loading';
  const zoho = data?.zoho || {};
  const columns = data?.columns || [];
  const rows = data?.rows || [];
  const currency = data?.currency || 'USD';

  const [reportBy, setReportBy] = useState(zoho.reportBy?.value || '');
  const [view, setView] = useState('table');

  const range = useMemo(
    () => resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo }),
    [filters.dateRange, filters.customFrom, filters.customTo],
  );
  const fromVal = filters.customFrom || range.from_date;
  const toVal = filters.customTo || range.to_date;

  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));

  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local "Report By" in sync once the report config loads.
  useEffect(() => {
    if (zoho.reportBy?.value) setReportBy(zoho.reportBy.value);
  }, [zoho.reportBy?.value]);

  const title = zoho.title || report.name;
  const rangeText = `From ${dmy(fromVal)} To ${dmy(toVal)}`;

  return (
    <>
      {/* Top header: breadcrumb module + title + Zoho action icons */}
      <header className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => dispatch(closeReport())}
            className="h-8 w-8 grid place-items-center rounded-md text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800 shrink-0"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-sky-700 dark:text-sky-300 truncate">{zoho.module || 'Reports'}</div>
            <div className="flex items-center gap-2 text-[13.5px] text-navy-900 dark:text-white truncate">
              <span className="font-bold">{title}</span>
              <span className="text-navy-300">•</span>
              <span className="text-navy-500 dark:text-navy-400">{rangeText}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Customize"><SlidersHorizontal size={15} /></button>
          <button type="button" className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Schedule"><CalendarClock size={15} /></button>
          <ExportMenu
            meta={{ company: client?.name, from: fromVal, to: toVal }}
            trigger={(
              <button type="button" className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1 text-[12.5px] font-semibold">
                Export <ChevronDown size={13} />
              </button>
            )}
          />
          <button type="button" onClick={runReport} className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Refresh"><RefreshCw size={15} /></button>
          <button
            type="button"
            onClick={() => dispatch(closeReport())}
            aria-label="Close"
            className="h-8 w-8 grid place-items-center rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {/* Zoho "Filters :" bar */}
      <div className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-[12.5px] font-semibold text-navy-500 dark:text-navy-400">Filters :</span>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-navy-600 dark:text-navy-300">Date Range :</span>
            <Popover
              align="start"
              width={200}
              trigger={(
                <button type="button" className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-2 text-[13px] font-semibold">
                  {PERIOD_LABELS[filters.dateRange] || 'Custom'} <ChevronDown size={15} />
                </button>
              )}
            >
              {({ close }) => (
                <div className="flex flex-col">
                  {ZOHO_PERIODS.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { dispatch(setFilter({ dateRange: v })); close(); }}
                      className={cn(
                        'text-left px-3 py-1.5 rounded-md text-[13px] hover:bg-navy-50 dark:hover:bg-navy-800',
                        filters.dateRange === v ? 'font-semibold text-sky-700 dark:text-sky-300' : 'text-navy-700 dark:text-navy-200',
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </Popover>
            {filters.dateRange === 'custom' && (
              <>
                <input type="date" value={fromVal || ''} onChange={(e) => dispatch(setFilter({ customFrom: e.target.value, dateRange: 'custom' }))} className={fieldCls} />
                <input type="date" value={toVal || ''} onChange={(e) => dispatch(setFilter({ customTo: e.target.value, dateRange: 'custom' }))} className={fieldCls} />
              </>
            )}
          </div>

          {/* Optional "Report By" */}
          {zoho.reportBy && (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-navy-600 dark:text-navy-300">{zoho.reportBy.label || 'Report By'} :</span>
              <select value={reportBy} onChange={(e) => setReportBy(e.target.value)} className={cn(fieldCls, 'font-semibold')}>
                {zoho.reportBy.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          <button type="button" className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Plus size={15} /> More Filters
          </button>

          <div className="grow" />

          <button
            type="button"
            onClick={runReport}
            className="h-9 px-4 rounded-md text-white text-[13px] font-semibold shadow-soft hover:opacity-95 shrink-0"
            style={{ background: ZOHO_BLUE }}
          >
            Run Report
          </button>
        </div>
      </div>

      {/* Sub-bar: Table/Chart View · Group By · Customize columns */}
      <div className="border-b border-navy-200 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-navy-300 dark:border-navy-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setView('table')}
            className={cn('h-8 px-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold', view === 'table' ? 'bg-sky-600 text-white' : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800')}
          >
            <Table2 size={14} /> Table View
          </button>
          <button
            type="button"
            onClick={() => setView('chart')}
            className={cn('h-8 px-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold border-l border-navy-300 dark:border-navy-700', view === 'chart' ? 'bg-sky-600 text-white' : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800')}
          >
            <BarChart3 size={14} /> Chart View
          </button>
        </div>
        <div className="flex items-center gap-4 text-[12.5px] text-navy-600 dark:text-navy-300">
          <span>Group By : <span className="font-semibold text-navy-800 dark:text-navy-100">{zoho.groupBy || 'None'}</span></span>
          {zoho.compareWith && (
            <span>Compare With : <span className="font-semibold text-navy-800 dark:text-navy-100">None</span></span>
          )}
          <button type="button" className="inline-flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-300 hover:underline">
            Customize Report Columns
            <span className="inline-grid place-items-center h-5 min-w-[20px] px-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[11px]">{zoho.customizeCount ?? columns.length}</span>
          </button>
        </div>
      </div>

      {/* Report sheet */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin bg-navy-50/40 dark:bg-navy-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1100px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card px-5 sm:px-10 py-8">
            <div className="text-center mb-6">
              <div className="text-[18px] font-bold text-navy-900 dark:text-white leading-tight">{client?.name || 'Oremus'}</div>
              <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-100 mt-0.5">{title}</div>
              <div className="text-[12.5px] text-navy-500 mt-0.5">{rangeText}</div>
              {zoho.basis && (
                <div className="text-[12.5px] text-navy-500 mt-1">Basis : <span className="font-semibold text-navy-700 dark:text-navy-200">{zoho.basis}</span></div>
              )}
            </div>

            {loading || !data ? (
              <ReportSkeleton />
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11.5px] uppercase tracking-wide text-navy-500 dark:text-navy-400 border-b border-navy-200 dark:border-navy-700">
                    {columns.map((c) => (
                      <th key={c.key} className={cn('font-semibold py-2 px-3', c.align === 'right' ? 'text-right' : 'text-left')}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center text-[13px] text-navy-500 dark:text-navy-400">
                        {zoho.emptyText || 'There are no transactions during the selected date range.'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr
                        key={i}
                        className={cn(
                          r.isTotal
                            ? 'border-t-2 border-navy-300 dark:border-navy-600 font-bold'
                            : 'border-b border-navy-100 dark:border-navy-800',
                        )}
                      >
                        {columns.map((c) => (
                          <td
                            key={c.key}
                            className={cn(
                              'py-2 px-3',
                              c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                              r.isTotal ? 'text-navy-900 dark:text-white' : 'text-navy-800 dark:text-navy-100',
                            )}
                          >
                            {c.key === columns[0].key ? (
                              r.sublabel ? (
                                <div>
                                  <div className="text-sky-700 dark:text-sky-300 font-medium">{r.label}</div>
                                  <div className="text-[11.5px] text-navy-500 dark:text-navy-400 mt-0.5">{r.sublabel}</div>
                                </div>
                              ) : r.label
                            ) : formatCell(r.cells?.[c.key], c, currency)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {!loading && data && rows.length > 0 && zoho.totalCount != null && (
              <div className="mt-4 flex items-center justify-between border-t border-navy-200 dark:border-navy-800 pt-3 text-[12.5px] text-navy-500 dark:text-navy-400">
                <span>Total Count : <span className="font-semibold text-navy-800 dark:text-navy-100">{zoho.totalCount}</span></span>
                <span>1 - {zoho.totalCount}</span>
              </div>
            )}

            {!loading && data && zoho.baseCurrencyNote && (
              <div className="mt-6 flex items-center gap-1.5 text-[12px] text-navy-500 dark:text-navy-400">
                **Amount is displayed in your base currency
                <span className="inline-grid place-items-center h-4 px-1.5 rounded bg-emerald-600 text-white text-[10px] font-semibold tracking-wide">{currency}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Render a data cell. `money` columns get the report's currency symbol + 2
// decimals; other numeric values get plain 2-decimal grouping (e.g. quantity);
// null/blank stays blank (matches Zoho's empty Average Price on the Total row).
function formatCell(val, col, currency) {
  if (val == null || val === '') return '';
  if (typeof val === 'number') {
    if (col.money) return fmt(val, { dec: 2, currency });
    return fmt(val, { dec: 2, sign: '', currency });
  }
  return val;
}
