'use client';
// Xero-style viewer for the Executive Summary report ONLY. Every other report
// uses the common QBO-style QBReportViewer; ReportViewerModal routes the open
// "Executive Summary" report here so its filter bar + report sheet mirror Xero's
// Executive Summary (Date range / Compare with / Filter / More / Update, and a
// sectioned table with This-month / Last-month / Variance columns).

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Star, X, ChevronDown, Filter as FilterIcon, MoreHorizontal,
  RefreshCw, Printer, Mail, ArrowUp, ArrowDown,
} from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ExportMenu from './ExportMenu.jsx';
import SendReportModal from './SendReportModal.jsx';
import ReportSkeleton from './ReportSkeleton.jsx';
import {
  selectOpenReport, selectReportData, selectReportStatus,
  selectFilters, selectCompare, selectFavorites,
  closeReport, setFilter, setCompare, toggleFavorite, loadReportData, saveAsCustom,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';
import { resolvePresetRange } from '../../features/reports/data/dateRanges.js';
import { fmt, currencySymbol } from '../../utils/fmt.js';
import { cn } from '../../utils/classNames.js';

const XERO_BLUE = '#1A73E8';

// Xero "Date range" presets — keys MUST resolve in resolvePresetRange.
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

const monthLabel = (d) => d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

// Format a value for its unit (currency uses parentheses for negatives, Xero-style).
function fmtCell(v, unit, sym) {
  if (v == null || Number.isNaN(v)) return '–';
  if (unit === 'percent') return `${v.toFixed(1)}%`;
  if (unit === 'days')    return String(Math.round(v));
  if (unit === 'number')  return Math.round(v).toLocaleString('en-US');
  if (unit === 'ratio')   return v.toFixed(2);
  const s = fmt(Math.abs(v), { dec: 2, sign: sym });
  return v < 0 ? `(${s})` : s;
}

function VarCell({ v, unit, sym }) {
  if (v == null || Number.isNaN(v) || v === 0) return <span className="text-navy-400">–</span>;
  const up = v > 0;
  return (
    <span className={cn('inline-flex items-center justify-end gap-1', up ? 'text-emerald-600' : 'text-rose-600')}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {fmtCell(Math.abs(v), unit, sym)}
    </span>
  );
}

export default function ExecutiveSummaryViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const compare = useSelector(selectCompare);
  const favorites = useSelector(selectFavorites);

  const [emailOpen, setEmailOpen] = useState(false);
  const [compact, setCompact] = useState(true);

  const favorited = !!favorites[report.name];
  const loading = status === 'loading';
  const sym = currencySymbol(data?.currency);

  const range = useMemo(
    () => resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo }),
    [filters.dateRange, filters.customFrom, filters.customTo],
  );
  const fromVal = filters.customFrom || range.from_date;
  const toVal = filters.customTo || range.to_date;
  const endDate = toVal ? new Date(toVal) : new Date();
  const curLabel = monthLabel(endDate);
  const prvLabel = monthLabel(new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1));
  const endedText = endDate.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const compareMonths = Math.max(1, (compare.count || 2) - 1);
  const setCompareMonths = (n) =>
    dispatch(setCompare(n <= 0 ? { with: 'none', count: 1 } : { with: 'previous-period', baseOn: 'period', count: n + 1 }));

  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));

  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
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
            </div>
          </div>

          <div className="shrink-0">
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">Compare with</div>
            <select
              value={compareMonths}
              onChange={(e) => setCompareMonths(Number(e.target.value))}
              className={cn(fieldCls, 'w-[200px]')}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{`Compare with ${n} month${n > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </div>

          <div className="shrink-0">
            <Popover
              align="start"
              width={240}
              trigger={(
                <button type="button" className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                  <FilterIcon size={14} /> Filter
                </button>
              )}
            >
              <div className="space-y-3 text-[12.5px] text-navy-700 dark:text-navy-200">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-1.5">Accounting basis</div>
                  <div className="inline-flex h-8 rounded-md border border-navy-300 dark:border-navy-700 overflow-hidden">
                    {[['accrual', 'Accrual'], ['cash', 'Cash']].map(([v, l]) => {
                      const active = (filters.basis || 'accrual') === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => dispatch(setFilter({ basis: v }))}
                          className={cn('px-3 text-[12.5px] font-semibold', active ? 'bg-navy-800 text-white dark:bg-white dark:text-navy-900' : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300')}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!filters.includeZero} onChange={(e) => dispatch(setFilter({ includeZero: e.target.checked }))} className="accent-sky-600" />
                  Show rows with zero balances
                </label>
              </div>
            </Popover>
          </div>

          <div className="grow" />

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
          <div className="max-w-[1100px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card px-5 sm:px-10 py-8">
            <div className="mb-6">
              <div className="text-[22px] font-bold text-navy-900 dark:text-white leading-tight">{report.name}</div>
              <div className="text-[13px] text-navy-700 dark:text-navy-200 mt-1">{client?.name || 'Oremus'}</div>
              <div className="text-[12.5px] text-navy-500">For the month ended {endedText}</div>
            </div>

            {loading || !data ? (
              <ReportSkeleton />
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[12px] text-navy-500 dark:text-navy-400 border-b border-navy-200 dark:border-navy-700">
                    <th className="text-left font-semibold py-2" />
                    <th className="text-right font-semibold py-2 px-3 w-[150px]">{curLabel}</th>
                    <th className="text-right font-semibold py-2 px-3 w-[150px]">{prvLabel}</th>
                    <th className="text-right font-semibold py-2 pl-3 w-[130px]">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    if (r.isHeader) {
                      return (
                        <tr key={i}>
                          <td colSpan={4} className="pt-5 pb-1 text-[14px] font-bold text-navy-900 dark:text-white">{r.label}</td>
                        </tr>
                      );
                    }
                    const emph = r.isSubtotal;
                    return (
                      <tr key={i} className={cn('border-b border-navy-100 dark:border-navy-800', emph && 'font-semibold')}>
                        <td className={cn(rowPad, 'pr-4 text-navy-700 dark:text-navy-200', emph ? 'pl-3' : 'pl-5')}>{r.label}</td>
                        <td className={cn(rowPad, 'px-3 text-right tabular-nums text-navy-800 dark:text-navy-100')}>{fmtCell(r.cells.cur, r.unit, sym)}</td>
                        <td className={cn(rowPad, 'px-3 text-right tabular-nums text-navy-800 dark:text-navy-100')}>{fmtCell(r.cells.prv, r.unit, sym)}</td>
                        <td className={cn(rowPad, 'pl-3 text-right tabular-nums')}><VarCell v={r.cells.var} unit={r.unit} sym={sym} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Footer (Xero: Compact view · Save as custom · Export) */}
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
            meta={{ company: client?.name, basis: filters.basis === 'cash' ? 'Cash basis' : 'Accrual basis', from: fromVal, to: toVal }}
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
        meta={{ company: client?.name, basis: filters.basis === 'cash' ? 'Cash basis' : 'Accrual basis', from: fromVal, to: toVal }}
      />
    </>
  );
}
