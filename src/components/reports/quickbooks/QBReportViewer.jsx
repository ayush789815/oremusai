'use client';

// QuickBooks Online–style report viewer body. Used by ReportViewerModal
// when the open report belongs to the `quickbooks` provider.
//
// Reads/writes the same slice fields the Zoho viewer does so all data flow,
// drilldowns, exports and view-switching keep working — only the chrome
// changes.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, ArrowLeft, ChevronDown, Star, Sliders, Save, Mail, Printer, Download, Calendar,
  Play, BarChart3, PieChart, LineChart, Table as TableIcon, MoreHorizontal,
} from 'lucide-react';
import ReportTable from '../ReportTable.jsx';
import ReportChart from '../ReportChart.jsx';
import ExportMenu from '../ExportMenu.jsx';
import {
  selectOpenReport, selectView, selectReportData, selectReportStatus,
  selectFilters, selectCompare, selectFavorites,
  closeReport, setView, setFilter, setCompare, toggleFavorite, loadReportData,
  saveAsCustom,
} from '../../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../../features/clients/clientsSlice.js';
import { cn } from '../../../utils/classNames.js';

// ----------------------------------------------------------------------------
// QBO filter bar field definitions

const REPORT_PERIODS = [
  'Today', 'This week', 'This week-to-date', 'This month', 'This month-to-date',
  'This quarter', 'This quarter-to-date', 'This year', 'This year-to-date',
  'Yesterday', 'Last week', 'Last week-to-date', 'Last month',
  'Last quarter', 'Last quarter-to-date', 'Last year', 'Last year-to-date',
  'Custom',
];

const DISPLAY_COLUMNS_BY = [
  ['total',       'Total Only'],
  ['days',        'Days'],
  ['weeks',       'Weeks'],
  ['months',      'Months'],
  ['quarters',    'Quarters'],
  ['years',       'Years'],
  ['customers',   'Customers'],
  ['vendors',     'Vendors'],
  ['employees',   'Employees'],
  ['customer-type', 'Customer types'],
  ['class',       'Class'],
  ['location',    'Location'],
  ['payment-method', 'Payment method'],
  ['sales-rep',   'Sales rep'],
];

const SHOW_ROWS = [
  ['active',   'Active'],
  ['all',      'All'],
  ['nonzero',  'Non-zero'],
];

const COMPARE_OPTIONS = [
  ['none',           'None'],
  ['previous-period','Previous period (PP)'],
  ['pp-change',      'PP $ change'],
  ['pp-pct',         'PP % change'],
  ['previous-year',  'Previous year (PY)'],
  ['py-change',      'PY $ change'],
  ['py-pct',         'PY % change'],
  ['ytd',            'Year-to-date (YTD)'],
  ['ytd-pct',        'YTD % of YTD'],
];

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const fieldLabelCls =
  'block text-[11px] font-semibold uppercase tracking-wider text-navy-500 dark:text-navy-400 mb-1';

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className={fieldLabelCls}>{label}</span>
      {children}
    </label>
  );
}

function dateLabelFromRange(rangeId, customFrom, customTo) {
  if (rangeId === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`;
  const map = {
    'this-month':       'This Month',
    'this-quarter':     'This Quarter',
    'this-year':        'This Year',
    'ytd':              'Year-to-date',
    'previous-month':   'Last Month',
    'previous-quarter': 'Last Quarter',
    'previous-year':    'Last Year',
  };
  return map[rangeId] || 'This Month';
}

// ----------------------------------------------------------------------------
// QBO-style top toolbar (breadcrumb · title · Customize · row of icon actions)

function QBToolbar({ report, onCustomize, onClose, favorited, onToggleFavorite, onSaveCustom, savedToast }) {
  return (
    <header className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
        >
          <ArrowLeft size={14} /> Back to reports
        </button>
        <div className="hidden md:flex items-center gap-1 text-[11.5px] text-navy-500 capitalize">
          <span>Standard reports</span>
          <span>›</span>
          <span>{report.category.replace(/-/g, ' ')}</span>
          <span>›</span>
          <span className="text-navy-700 dark:text-navy-200 font-semibold">{report.name}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="h-9 w-9 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-4 sm:px-6 pb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[24px] font-bold tracking-tight text-navy-900 dark:text-white truncate">
            {report.name}
          </h2>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              'h-8 w-8 grid place-items-center rounded-md transition',
              favorited ? 'text-amber-500' : 'text-navy-300 hover:text-amber-500',
            )}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onCustomize}
            className="h-9 px-3 rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Sliders size={14} /> Customize
          </button>
          <button
            type="button"
            onClick={onSaveCustom}
            className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold relative"
          >
            <Save size={14} /> Save customization
            {savedToast && (
              <span className="absolute -bottom-7 right-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 shadow-soft whitespace-nowrap">
                Saved · find it in Custom reports
              </span>
            )}
          </button>
          <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Mail size={14} /> Email
          </button>
          <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Printer size={14} /> Print
          </button>
          <ExportMenu trigger={(
            <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
              <Download size={14} /> Export
              <ChevronDown size={12} />
            </button>
          )} />
          <button type="button" className="h-9 w-9 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------------
// QBO-style filter bar (sticky, green Run report button)

function QBFilterBar({ filters, compare, onSetFilter, onSetCompare, onRun }) {
  return (
    <div className="border-b border-navy-200 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/40 px-4 sm:px-6 py-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <FilterField label="Report period">
          <select
            value={filters.dateRange}
            onChange={(e) => onSetFilter({ dateRange: e.target.value })}
            className={fieldCls}
          >
            {REPORT_PERIODS.map((p) => {
              const v = p.toLowerCase().replace(/\s+/g, '-');
              return <option key={v} value={v}>{p}</option>;
            })}
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            type="date"
            value={filters.customFrom || ''}
            onChange={(e) => onSetFilter({ customFrom: e.target.value })}
            className={fieldCls}
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            value={filters.customTo || ''}
            onChange={(e) => onSetFilter({ customTo: e.target.value })}
            className={fieldCls}
          />
        </FilterField>
        <FilterField label="Display columns by">
          <select
            value={filters.interval}
            onChange={(e) => onSetFilter({ interval: e.target.value })}
            className={fieldCls}
          >
            {DISPLAY_COLUMNS_BY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
        <FilterField label="Show rows">
          <select
            value={filters.includeZero ? 'all' : (filters.includeDeleted ? 'all' : 'active')}
            onChange={(e) => {
              const v = e.target.value;
              onSetFilter({
                includeZero: v === 'all',
                includeDeleted: false,
              });
            }}
            className={fieldCls}
          >
            {SHOW_ROWS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
        <FilterField label="Compare another period">
          <select
            value={compare.with}
            onChange={(e) => onSetCompare({ with: e.target.value })}
            className={fieldCls}
          >
            {COMPARE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* Accounting method radio group */}
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-navy-500">Accounting method</span>
          <label className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input
              type="radio"
              name="qb-basis"
              checked={filters.basis === 'cash'}
              onChange={() => onSetFilter({ basis: 'cash' })}
              className="accent-emerald-600"
            />
            Cash
          </label>
          <label className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input
              type="radio"
              name="qb-basis"
              checked={filters.basis === 'accrual'}
              onChange={() => onSetFilter({ basis: 'accrual' })}
              className="accent-emerald-600"
            />
            Accrual
          </label>
        </div>

        <span className="grow" />

        <button
          type="button"
          onClick={onRun}
          className="h-9 px-4 rounded-md text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-soft hover:opacity-95"
          style={{ background: '#2CA01C' }}
        >
          <Play size={13} /> Run report
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// QBO Customize sidebar (slides in from the right)

function CustomizeSidebar({ open, onClose, filters, compare, onSetFilter, onSetCompare }) {
  if (!open) return null;
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
              {REPORT_PERIODS.map((p) => {
                const v = p.toLowerCase().replace(/\s+/g, '-');
                return <option key={v} value={v}>{p}</option>;
              })}
            </select>
          </FilterField>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <FilterField label="From"><input type="date" value={filters.customFrom || ''} onChange={(e) => onSetFilter({ customFrom: e.target.value })} className={fieldCls} /></FilterField>
            <FilterField label="To"><input type="date" value={filters.customTo || ''} onChange={(e) => onSetFilter({ customTo: e.target.value })} className={fieldCls} /></FilterField>
          </div>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-navy-400 mb-2">Rows / Columns</div>
          <FilterField label="Display columns by">
            <select value={filters.interval} onChange={(e) => onSetFilter({ interval: e.target.value })} className={fieldCls}>
              {DISPLAY_COLUMNS_BY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Compare another period">
            <select value={compare.with} onChange={(e) => onSetCompare({ with: e.target.value })} className={fieldCls}>
              {COMPARE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
        <button type="button" onClick={onClose} className="h-9 px-3 rounded-md text-white text-[12.5px] font-semibold ml-auto" style={{ background: '#2CA01C' }}>
          Run report
        </button>
      </div>
    </aside>
  );
}

// ----------------------------------------------------------------------------
// QBReportViewer — main export

const VIEW_TABS = [
  { id: 'table', icon: TableIcon, label: 'Table' },
  { id: 'bar',   icon: BarChart3, label: 'Chart · Bar' },
  { id: 'pie',   icon: PieChart,  label: 'Chart · Pie' },
  { id: 'line',  icon: LineChart, label: 'Chart · Line' },
];

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

  const dateLabel = useMemo(
    () => dateLabelFromRange(filters.dateRange, filters.customFrom, filters.customTo),
    [filters.dateRange, filters.customFrom, filters.customTo],
  );

  // Re-fetch on demand (Run report button)
  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: 'quickbooks' }));

  // Auto-load on mount; the modal also kicks loadReportData on open.
  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <QBToolbar
        report={report}
        favorited={favorited}
        onToggleFavorite={() => dispatch(toggleFavorite(report.name))}
        onCustomize={() => setCustomizeOpen((o) => !o)}
        onClose={() => dispatch(closeReport())}
        onSaveCustom={handleSaveCustom}
        savedToast={savedToast}
      />

      <QBFilterBar
        filters={filters}
        compare={compare}
        onSetFilter={(patch) => dispatch(setFilter(patch))}
        onSetCompare={(patch) => dispatch(setCompare(patch))}
        onRun={runReport}
      />

      {/* Body grid: main area + optional customize rail */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto scroll-thin bg-white dark:bg-navy-950">
          {/* View tabs (Table / Chart kinds) */}
          <div className="border-b border-navy-100 dark:border-navy-800 px-4 sm:px-6 py-2 flex items-center gap-1 overflow-x-auto scroll-thin">
            {VIEW_TABS.map((t) => {
              const Icon = t.icon;
              const active = view === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => dispatch(setView(t.id))}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-semibold border whitespace-nowrap transition',
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800',
                  )}
                >
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
            <span className="grow" />
            <span className="text-[11.5px] text-navy-500 hidden md:inline">
              Last run · just now
            </span>
          </div>

          {/* Report sheet */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card p-6 sm:p-10">
              <div className="text-center mb-6">
                <div className="text-[18px] font-bold text-navy-900 dark:text-white">{client?.name || 'Oremus'}</div>
                <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-200">{report.name}</div>
                <div className="text-[11.5px] text-navy-500 mt-1 capitalize">
                  {filters.basis === 'cash' ? 'Cash Basis' : 'Accrual Basis'} · {dateLabel}
                </div>
              </div>

              {loading || !data ? (
                <div className="py-12 text-center text-[12.5px] text-navy-500">Loading report…</div>
              ) : view === 'table' ? (
                <ReportTable data={data} />
              ) : (
                <ReportChart kind={view} data={data} height={420} />
              )}

              <div className="mt-6 pt-4 border-t border-navy-100 dark:border-navy-800 text-[10.5px] text-navy-400 flex items-center justify-between">
                <span>Generated {new Date().toLocaleString()}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={11} /> QuickBooks · Confidential
                </span>
              </div>
            </div>
          </div>
        </div>

        <CustomizeSidebar
          open={customizeOpen}
          onClose={() => setCustomizeOpen(false)}
          filters={filters}
          compare={compare}
          onSetFilter={(patch) => dispatch(setFilter(patch))}
          onSetCompare={(patch) => dispatch(setCompare(patch))}
        />
      </div>
    </>
  );
}