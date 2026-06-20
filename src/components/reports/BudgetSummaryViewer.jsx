'use client';
// Xero-style viewer for the Budget Summary report ONLY. ReportViewerModal routes
// the open "Budget Summary" report here so its filter bar + report sheet mirror
// Xero's Budget Summary (Date range / Future periods to show / Budget / More /
// Update, and a wide monthly table Jan…Dec + Total). Every other report keeps
// the common QBReportViewer.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Star, X, ChevronDown, MoreHorizontal,
  RefreshCw, Printer, Mail,
} from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ExportMenu from './ExportMenu.jsx';
import SendReportModal from './SendReportModal.jsx';
import ReportSkeleton from './ReportSkeleton.jsx';
import {
  selectOpenReport, selectReportData, selectReportStatus,
  selectFilters, selectFavorites,
  closeReport, setFilter, toggleFavorite, loadReportData, saveAsCustom,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';
import { resolvePresetRange } from '../../features/reports/data/dateRanges.js';
import { fmt, currencySymbol } from '../../utils/fmt.js';
import { cn } from '../../utils/classNames.js';

const XERO_BLUE = '#1A73E8';

const FUTURE_PERIODS = [
  ['0',  'No future periods'],
  ['2',  'Next 2 periods'],
  ['5',  'Next 5 periods'],
  ['11', 'Next 11 periods'],
  ['23', 'Next 23 periods'],
];
const BUDGETS = ['Overall Budget'];

// Date-range presets — keys MUST resolve in resolvePresetRange.
const XERO_PERIODS = [
  ['this-month',           'This month'],
  ['previous-month',       'Last month'],
  ['this-quarter',         'This quarter'],
  ['previous-quarter',     'Last quarter'],
  ['this-fiscal-year',     'This financial year'],
  ['previous-fiscal-year', 'Last financial year'],
  ['custom',               'Custom'],
];
const PERIOD_LABELS = Object.fromEntries(XERO_PERIODS);

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

const prettyDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Budget figures show as plain numbers (or '-' when zero), like Xero.
function fmtCell(v, sym) {
  if (v == null || Number.isNaN(v) || v === 0) return '-';
  const s = fmt(Math.abs(v), { dec: 0, sign: sym });
  return v < 0 ? `(${s})` : s;
}

export default function BudgetSummaryViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const favorites = useSelector(selectFavorites);

  const [emailOpen, setEmailOpen] = useState(false);
  const [compact, setCompact] = useState(true);
  const [future, setFuture] = useState('11');
  const [budget, setBudget] = useState('Overall Budget');

  const favorited = !!favorites[report.name];
  const loading = status === 'loading';
  const sym = currencySymbol(data?.currency);

  const range = useMemo(
    () => resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo }),
    [filters.dateRange, filters.customFrom, filters.customTo],
  );
  const fromVal = filters.customFrom || range.from_date;
  const toVal = filters.customTo || range.to_date;
  const budgetName = data?.budgetName || budget;

  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));

  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xero behaviour: the number of month columns = the starting period (from the
  // date-range start) + the chosen "Future periods to show". Columns are derived
  // live from the filters; mock month data is keyed Jan(m1)…Dec(m12) and read by
  // each visible column's calendar month, so changing either filter re-shapes the
  // table. The final Total column sums the visible months.
  const monthCols = useMemo(() => {
    const periodCount = Math.min(24, Math.max(1, 1 + Number(future || 0)));
    const start = fromVal ? new Date(fromVal) : new Date(2026, 0, 1);
    const startMonth = Number.isNaN(start.getTime()) ? 0 : start.getMonth();
    const startYear = Number.isNaN(start.getTime()) ? 2026 : start.getFullYear();
    return Array.from({ length: periodCount }, (_, i) => {
      const d = new Date(startYear, startMonth + i, 1);
      return {
        key: `c${i}`,
        label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        srcKey: `m${((startMonth + i) % 12) + 1}`,
      };
    });
  }, [fromVal, future]);
  const valueCols = [...monthCols, { key: 'total', label: 'Total' }];

  // The displayed period spans the first visible month to the last (Xero extends
  // the end date by the future periods shown).
  const periodBase = fromVal ? new Date(fromVal) : new Date(2026, 0, 1);
  const periodStartM = Number.isNaN(periodBase.getTime()) ? 0 : periodBase.getMonth();
  const periodStartY = Number.isNaN(periodBase.getTime()) ? 2026 : periodBase.getFullYear();
  const periodStart = new Date(periodStartY, periodStartM, 1);
  const periodEnd = new Date(periodStartY, periodStartM + monthCols.length, 0);

  const cellValue = (r, col) => {
    if (!r.cells) return undefined;
    if (col.key === 'total') return monthCols.reduce((acc, c) => acc + (r.cells[c.srcKey] || 0), 0);
    return r.cells[col.srcKey];
  };
  const rows = data?.rows || [];
  const rowPad = compact ? 'py-1' : 'py-2';

  return (
    <>
      {/* Top bar */}
      <header className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => dispatch(closeReport())}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-700 dark:text-sky-300 hover:underline shrink-0"
          >
            <ArrowLeft size={14} /> Reports
          </button>
          <span className="text-navy-300">/</span>
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-navy-900 dark:text-white truncate">
            {report.name}
            <button
              type="button"
              onClick={() => dispatch(toggleFavorite(report.name))}
              className={cn('grid place-items-center transition', favorited ? 'text-amber-500' : 'text-navy-300 hover:text-amber-500')}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={14} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dispatch(closeReport())}
          aria-label="Close"
          className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800 shrink-0"
        >
          <X size={15} />
        </button>
      </header>

      {/* Xero-style filter bar */}
      <div className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3">
          {/* Date range */}
          <div className="shrink-0">
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">
              Date range: <span className="font-semibold text-navy-700 dark:text-navy-200">{PERIOD_LABELS[filters.dateRange] || 'Custom'}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromVal || ''}
                onChange={(e) => dispatch(setFilter({ customFrom: e.target.value, dateRange: 'custom' }))}
                className={fieldCls}
              />
              <input
                type="date"
                value={toVal || ''}
                onChange={(e) => dispatch(setFilter({ customTo: e.target.value, dateRange: 'custom' }))}
                className={fieldCls}
              />
              <Popover
                align="start"
                width={220}
                trigger={(
                  <button type="button" className="h-9 w-9 grid place-items-center rounded-md border border-navy-300 dark:border-navy-700 text-navy-600 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Date range presets">
                    <ChevronDown size={16} />
                  </button>
                )}
              >
                {({ close }) => (
                  <div className="flex flex-col">
                    {XERO_PERIODS.map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { dispatch(setFilter(v === 'custom' ? { dateRange: v } : { dateRange: v, customFrom: '', customTo: '' })); close(); }}
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
            </div>
          </div>

          {/* Future periods to show */}
          <div className="shrink-0">
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">Future periods to show</div>
            <select value={future} onChange={(e) => setFuture(e.target.value)} className={cn(fieldCls, 'w-[180px]')}>
              {FUTURE_PERIODS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div className="shrink-0">
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">Budget</div>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className={cn(fieldCls, 'w-[180px]')}>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* More */}
          <Popover
            align="end"
            width={200}
            trigger={(
              <button type="button" className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0">
                <MoreHorizontal size={16} /> More
              </button>
            )}
          >
            {({ close }) => (
              <div className="flex flex-col text-[13px] text-navy-700 dark:text-navy-200">
                <button type="button" onClick={() => { runReport(); close(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-navy-50 dark:hover:bg-navy-800 text-left"><RefreshCw size={14} /> Refresh</button>
                <button type="button" onClick={() => { window.print(); close(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-navy-50 dark:hover:bg-navy-800 text-left"><Printer size={14} /> Print</button>
                <button type="button" onClick={() => { setEmailOpen(true); close(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-navy-50 dark:hover:bg-navy-800 text-left"><Mail size={14} /> Email</button>
              </div>
            )}
          </Popover>

          <button
            type="button"
            onClick={runReport}
            className="h-9 px-4 rounded-md text-white text-[13px] font-semibold shadow-soft hover:opacity-95 shrink-0"
            style={{ background: XERO_BLUE }}
          >
            Update
          </button>
        </div>
      </div>

      {/* Report sheet */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin bg-navy-50/40 dark:bg-navy-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1500px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card px-5 sm:px-8 py-8">
            <div className="mb-6">
              <div className="text-[20px] font-bold text-navy-900 dark:text-white leading-tight">{report.name} - {budgetName}</div>
              <div className="text-[13px] text-navy-700 dark:text-navy-200 mt-1">{client?.name || 'Oremus'}</div>
              <div className="text-[12.5px] text-navy-500">For the period {prettyDate(periodStart)} to {prettyDate(periodEnd)}</div>
              <div className="text-[12.5px] text-navy-500">{budgetName}</div>
            </div>

            {loading || !data ? (
              <ReportSkeleton />
            ) : (
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-[12.5px] min-w-[1100px]">
                  <thead>
                    <tr className="text-[11.5px] text-navy-500 dark:text-navy-400 border-b border-navy-200 dark:border-navy-700">
                      <th className="text-left font-semibold py-2 pr-4" />
                      {valueCols.map((c) => (
                        <th key={c.key} className="text-right font-semibold py-2 px-3 whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      if (r.level === 0 && !r.isSubtotal && !r.isTotal) {
                        return (
                          <tr key={i}>
                            <td colSpan={valueCols.length + 1} className="pt-4 pb-1 text-[13.5px] font-bold text-navy-900 dark:text-white">{r.label}</td>
                          </tr>
                        );
                      }
                      const emph = r.isSubtotal || r.isTotal;
                      return (
                        <tr
                          key={i}
                          className={cn(
                            'border-b border-navy-100 dark:border-navy-800',
                            r.isTotal && 'border-t-2 border-navy-300 dark:border-navy-600 font-bold',
                            r.isSubtotal && 'font-semibold',
                          )}
                        >
                          <td className={cn(rowPad, 'pr-4 text-navy-700 dark:text-navy-200', emph ? 'pl-2' : 'pl-5')}>{r.label}</td>
                          {valueCols.map((c) => (
                            <td key={c.key} className={cn(rowPad, 'px-3 text-right tabular-nums whitespace-nowrap text-navy-800 dark:text-navy-100')}>
                              {fmtCell(cellValue(r, c), sym)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Xero: Insert content · Compact view · Save as custom · Export) */}
      <div className="border-t border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-navy-700 dark:text-navy-200 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={compact}
            onClick={() => setCompact((c) => !c)}
            className={cn('relative h-5 w-9 rounded-full transition', compact ? 'bg-sky-600' : 'bg-navy-300 dark:bg-navy-700')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', compact ? 'left-[18px]' : 'left-0.5')} />
          </button>
          Compact view
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(saveAsCustom({ baseName: report.name, baseCategory: report.category, provider: report.provider }))}
            className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 text-[12.5px] font-semibold"
          >
            Save as custom
          </button>
          <ExportMenu
            meta={{ company: client?.name, basis: budgetName, from: fromVal, to: toVal }}
            trigger={(
              <button type="button" className="h-9 px-3 rounded-md text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5" style={{ background: XERO_BLUE }}>
                Export <ChevronDown size={14} />
              </button>
            )}
          />
        </div>
      </div>

      <SendReportModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        reportName={report.name}
        data={data}
        meta={{ company: client?.name, basis: budgetName, from: fromVal, to: toVal }}
      />
    </>
  );
}
