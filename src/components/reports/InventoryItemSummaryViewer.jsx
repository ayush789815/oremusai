'use client';

// Xero-style viewer for the Inventory Item Summary report ONLY. Every other
// report uses the common QBO-style QBReportViewer; ReportViewerModal routes the
// open "Inventory Item Summary" report here so its filter bar + report sheet
// mirror Xero's (Date range / Columns / Grouping-Summarising / Filter / More /
// Update, a "Reorder columns" link, and an 8-column item table grouped by
// inventory type with a "Showing items …" footer).

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Star, X, ChevronDown, MoreHorizontal,
  RefreshCw, Printer, Mail, Filter as FilterIcon, Columns3, Check,
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

const GROUPING_OPTIONS = [
  ['type', 'Group by Inventory Type'],
  ['none', 'No grouping'],
];

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

function prettyDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InventoryItemSummaryViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const favorites = useSelector(selectFavorites);

  const [emailOpen, setEmailOpen] = useState(false);
  const [compact, setCompact] = useState(true);
  const [grouping, setGrouping] = useState('type');
  const [hiddenCols, setHiddenCols] = useState({}); // { key: true } = hidden

  const favorited = !!favorites[report.name];
  const loading = status === 'loading';

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

  const allCols = data?.columns || [];
  const cols = allCols.filter((c) => !hiddenCols[c.key]);
  const valueKeys = new Set(allCols.filter((c) => c.key !== 'code' && c.key !== 'name').map((c) => c.key));
  const rows = data?.rows || [];
  const itemCount = data?.itemCount ?? rows.length;
  const rowPad = compact ? 'py-1.5' : 'py-2.5';

  const toggleCol = (key) => setHiddenCols((m) => ({ ...m, [key]: !m[key] }));

  // Indentation + emphasis per Xero row type.
  const rowMeta = (r) => {
    if (r.isTotal) return { indent: 0, bold: true, border: true };
    if (r.isGroup) return { indent: 0, bold: true, border: false, blank: true };
    if (r.strong) return { indent: 1, bold: true, border: false };
    return { indent: 2, bold: false, border: false };
  };

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

      {/* Xero-style filter bar: Date range · Columns · Grouping/Summarising · Filter · More · Update */}
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
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">Columns</div>
            <Popover
              align="start"
              width={240}
              trigger={(
                <button type="button" className={cn(fieldCls, 'w-[180px] inline-flex items-center justify-between gap-2')}>
                  <span>{cols.length} columns selected</span>
                  <ChevronDown size={16} className="text-navy-500" />
                </button>
              )}
            >
              {() => (
                <div className="flex flex-col max-h-[280px] overflow-y-auto scroll-thin">
                  {allCols.map((c) => {
                    const shown = !hiddenCols[c.key];
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleCol(c.key)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 text-left"
                      >
                        <span className={cn('h-4 w-4 rounded border grid place-items-center', shown ? 'bg-sky-600 border-sky-600 text-white' : 'border-navy-300 dark:border-navy-600')}>
                          {shown && <Check size={12} />}
                        </span>
                        {c.label || c.key}
                      </button>
                    );
                  })}
                </div>
              )}
            </Popover>
          </div>

          <div className="shrink-0">
            <div className="text-[11px] text-navy-500 dark:text-navy-400 mb-1">Grouping/Summarising</div>
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value)}
              className={cn(fieldCls, 'w-[200px]')}
            >
              {GROUPING_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <button type="button" className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0">
            <FilterIcon size={15} /> Filter
          </button>

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
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-[22px] font-bold text-navy-900 dark:text-white leading-tight">{report.name}</div>
                <div className="text-[13px] text-navy-700 dark:text-navy-200 mt-1">{client?.name || 'Oremus'}</div>
                <div className="text-[12.5px] text-navy-500">For the period {prettyDate(fromVal)} to {prettyDate(toVal)}</div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-700 dark:text-sky-300 hover:underline shrink-0"
              >
                <Columns3 size={14} /> Reorder columns
              </button>
            </div>

            {loading || !data ? (
              <ReportSkeleton />
            ) : (
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[12px] text-navy-500 dark:text-navy-400 border-b border-navy-200 dark:border-navy-700">
                      {cols.map((c) => (
                        <th key={c.key} className={cn('font-semibold py-2 px-3 whitespace-nowrap', c.align === 'right' ? 'text-right' : 'text-left')}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const m = rowMeta(r);
                      return (
                        <tr
                          key={i}
                          className={cn(
                            'border-b border-navy-100 dark:border-navy-800',
                            m.border && 'border-t-2 border-navy-300 dark:border-navy-600',
                          )}
                        >
                          {cols.map((c, ci) => {
                            const isLabel = c.key === 'code';
                            const isName = c.key === 'name';
                            let content = '';
                            if (isLabel) content = r.label;
                            else if (isName) content = '';
                            else if (valueKeys.has(c.key)) content = m.blank ? '' : '-';
                            return (
                              <td
                                key={c.key}
                                className={cn(
                                  rowPad, 'px-3 whitespace-nowrap',
                                  c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                                  m.bold ? 'font-bold text-navy-900 dark:text-white' : 'text-navy-800 dark:text-navy-100',
                                )}
                                style={isLabel && ci === 0 ? { paddingLeft: 12 + m.indent * 16 } : undefined}
                              >
                                {content}
                              </td>
                            );
                          })}
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

      {/* Footer (Xero: Compact view · Showing items · Save as custom · Export) */}
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
        <div className="text-[12.5px] text-navy-500 dark:text-navy-400">Showing items 1-{itemCount} of {itemCount}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(saveAsCustom({ baseName: report.name, baseCategory: report.category, provider: report.provider }))}
            className="h-9 px-3 rounded-md border border-navy-300 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 text-[12.5px] font-semibold"
          >
            Save as custom
          </button>
          <ExportMenu
            meta={{ company: client?.name, from: fromVal, to: toVal }}
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
        meta={{ company: client?.name, from: fromVal, to: toVal }}
      />
    </>
  );
}
