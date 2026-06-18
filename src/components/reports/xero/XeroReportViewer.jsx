'use client';

// Xero-style report viewer body. Used by ReportViewerModal when the open
// report belongs to the `xero` provider.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, ArrowLeft, ChevronDown, Star, RefreshCw, Save, Send, Download, Printer, Mail,
  MoreHorizontal, Calendar, BarChart3, PieChart, LineChart, Table as TableIcon,
  FileText, History, LayoutTemplate, Settings,
} from 'lucide-react';
import ReportTable from '../ReportTable.jsx';
import ReportChart from '../ReportChart.jsx';
import ReportSkeleton from '../ReportSkeleton.jsx';
import ExportMenu from '../ExportMenu.jsx';
import {
  selectOpenReport, selectView, selectReportData, selectReportStatus,
  selectFilters, selectCompare, selectFavorites,
  closeReport, setView, setFilter, setCompare, toggleFavorite, loadReportData,
  saveAsCustom, saveAsDraft, publishDraft,
} from '../../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../../features/clients/clientsSlice.js';
import { cn } from '../../../utils/classNames.js';

// ----------------------------------------------------------------------------
// Field definitions — match Xero's P&L filter chrome.

const DATE_RANGES = [
  ['today',           'Today'],
  ['this-week',       'This week'],
  ['this-month',      'This month'],
  ['this-quarter',    'This quarter'],
  ['this-year',       'This financial year'],
  ['ytd',             'Year to date'],
  ['yesterday',       'Yesterday'],
  ['previous-week',   'Last week'],
  ['previous-month',  'Last month'],
  ['previous-quarter','Last quarter'],
  ['previous-year',   'Last financial year'],
  ['last-3-months',   'Last 3 months'],
  ['last-6-months',   'Last 6 months'],
  ['last-12-months',  'Last 12 months'],
  ['custom',          'Custom'],
];

const COMPARE_WITH = [
  ['none',             'None'],
  ['previous-period',  'Previous Period'],
  ['previous-year',    'Previous Year'],
  ['budget',           'Budget'],
];

const SHOW_OPTIONS = [
  ['active',  'Active accounts'],
  ['all',     'All accounts'],
  ['nonzero', 'Show 0.00 accounts'],
];

const TABS = [
  { id: 'report',    label: 'Report',           icon: FileText },
  { id: 'layout',    label: 'Layout',           icon: LayoutTemplate },
  { id: 'schedules', label: 'Schedules',        icon: Calendar },
  { id: 'history',   label: 'History & Notes',  icon: History },
];

const fieldCls =
  'h-9 px-3 rounded-md bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-700 text-[13px] text-navy-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

const fieldLabelCls =
  'block text-[11px] font-semibold uppercase tracking-wider text-navy-500 dark:text-navy-400 mb-1';

function FilterField({ label, children, className = '' }) {
  return (
    <label className={cn('flex flex-col gap-0.5', className)}>
      <span className={fieldLabelCls}>{label}</span>
      {children}
    </label>
  );
}

function dateLabelFromRange(rangeId, customFrom, customTo) {
  if (rangeId === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`;
  return DATE_RANGES.find(([k]) => k === rangeId)?.[1] || 'This month';
}

// ----------------------------------------------------------------------------
// Top header row — back link, title, action buttons row, then tab bar

function XeroHeader({
  report, favorited, onToggleFavorite, onClose, tab, onTab,
  onSaveDraft, onSave, onPublish, toast,
}) {
  return (
    <header className="border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-950">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-700 dark:text-sky-300 hover:underline shrink-0"
        >
          <ArrowLeft size={14} /> Reports
        </button>
        <div className="hidden md:flex items-center gap-1 text-[11.5px] text-navy-500 capitalize">
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

      <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[24px] font-bold tracking-tight text-navy-900 dark:text-white truncate">
            {report.name}
          </h2>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              'h-8 w-8 grid place-items-center rounded-md transition',
              favorited ? 'text-sky-500 hover:text-sky-700' : 'text-navy-300 hover:text-sky-500',
            )}
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Star size={16} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 relative">
          {toast && (
            <span className="absolute -top-7 right-0 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5 shadow-soft whitespace-nowrap">
              {toast}
            </span>
          )}
          <button
            type="button"
            onClick={onSaveDraft}
            className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Save size={14} /> Save as Draft
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          >
            <Save size={14} /> Save
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="h-9 px-3 rounded-md text-white inline-flex items-center gap-1.5 text-[12.5px] font-semibold shadow-soft"
            style={{ background: '#13B5EA' }}
          >
            <Send size={13} /> Publish <ChevronDown size={12} />
          </button>
          <ExportMenu trigger={(
            <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
              <Download size={14} /> Export <ChevronDown size={12} />
            </button>
          )} />
          <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Printer size={14} /> Print
          </button>
          <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Mail size={14} /> Email
          </button>
          <button type="button" className="h-9 w-9 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Xero report-level tab row */}
      <div className="px-4 sm:px-6 -mt-px flex items-center gap-0 border-b border-transparent overflow-x-auto scroll-thin">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn(
                'h-10 px-3.5 text-[13px] font-semibold whitespace-nowrap border-b-[3px] -mb-px transition inline-flex items-center gap-1.5',
                active
                  ? 'border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'border-transparent text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white',
              )}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------------
// Xero filter bar (blue Update button)

function XeroFilterBar({ filters, compare, onSetFilter, onSetCompare, onRun }) {
  const isCustom = filters.dateRange === 'custom';
  return (
    <div className="border-b border-navy-200 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/40 px-4 sm:px-6 py-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <FilterField label="Date Range">
          <select
            value={filters.dateRange}
            onChange={(e) => onSetFilter({ dateRange: e.target.value })}
            className={fieldCls}
          >
            {DATE_RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
        {isCustom && (
          <>
            <FilterField label="From">
              <input type="date" value={filters.customFrom || ''} onChange={(e) => onSetFilter({ customFrom: e.target.value })} className={fieldCls} />
            </FilterField>
            <FilterField label="To">
              <input type="date" value={filters.customTo || ''} onChange={(e) => onSetFilter({ customTo: e.target.value })} className={fieldCls} />
            </FilterField>
          </>
        )}
        <FilterField label="Compare With">
          <select value={compare.with} onChange={(e) => onSetCompare({ with: e.target.value })} className={fieldCls}>
            {COMPARE_WITH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
        <FilterField label="Periods">
          <select value={compare.count} onChange={(e) => onSetCompare({ count: Number(e.target.value) })} className={fieldCls}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FilterField>
        <FilterField label="Decimal Places">
          <select value={filters.decimals} onChange={(e) => onSetFilter({ decimals: Number(e.target.value) })} className={fieldCls}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FilterField>
        <FilterField label="Show">
          <select
            value={filters.includeZero ? 'nonzero' : (filters.includeDeleted ? 'all' : 'active')}
            onChange={(e) => {
              const v = e.target.value;
              onSetFilter({
                includeZero: v === 'nonzero',
                includeDeleted: v === 'all',
              });
            }}
            className={fieldCls}
          >
            {SHOW_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FilterField>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-navy-500">Accounting Basis</span>
          <label className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input type="radio" name="xero-basis" checked={filters.basis === 'accrual'} onChange={() => onSetFilter({ basis: 'accrual' })} className="accent-sky-500" />
            Accrual
          </label>
          <label className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input type="radio" name="xero-basis" checked={filters.basis === 'cash'} onChange={() => onSetFilter({ basis: 'cash' })} className="accent-sky-500" />
            Cash
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-[12.5px] text-navy-700 dark:text-navy-200">
          <input type="checkbox" checked={compare.oldestFirst} onChange={(e) => onSetCompare({ oldestFirst: e.target.checked })} className="accent-sky-500" />
          Oldest period first
        </label>

        <label className="inline-flex items-center gap-2 text-[12.5px] text-navy-700 dark:text-navy-200">
          <input type="checkbox" checked={filters.includeSubAccounts} onChange={(e) => onSetFilter({ includeSubAccounts: e.target.checked })} className="accent-sky-500" />
          Include sub-accounts
        </label>

        <span className="grow" />

        <button
          type="button"
          onClick={onRun}
          className="h-9 px-4 rounded-md text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-soft hover:opacity-95"
          style={{ background: '#13B5EA' }}
        >
          <RefreshCw size={13} /> Update
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Placeholder bodies for Layout / Schedules / History & Notes tabs

function LayoutTab() {
  return (
    <div className="max-w-[1000px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card p-8 text-[13px] text-navy-600 dark:text-navy-300">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-navy-900 dark:text-white mb-2">
        <LayoutTemplate size={16} /> Edit layout
      </div>
      <p>Drag and drop rows, add formulas, and design custom groupings. This tab will let you save report layouts that can be reused as templates across clients.</p>
      <ul className="list-disc pl-5 mt-3 space-y-1 text-[12.5px]">
        <li>Add new rows / sub-totals</li>
        <li>Group accounts by tracking category</li>
        <li>Hide or rename specific lines</li>
        <li>Insert formula rows (ratios, variances, etc.)</li>
      </ul>
    </div>
  );
}

function SchedulesTab() {
  return (
    <div className="max-w-[1000px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card p-8 text-[13px] text-navy-600 dark:text-navy-300">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-navy-900 dark:text-white mb-2">
        <Calendar size={16} /> Schedules
      </div>
      <p>Set up recurring delivery for this report — pick a cadence, the recipients, and the format. Scheduled deliveries appear in the activity log once they run.</p>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="max-w-[1000px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card p-8 text-[13px] text-navy-600 dark:text-navy-300">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-navy-900 dark:text-white mb-2">
        <History size={16} /> History &amp; Notes
      </div>
      <p>Track who ran the report, what notes were left, and any published versions. Notes added here are visible to anyone with access to the report.</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main XeroReportViewer

const VIEW_TABS = [
  { id: 'table', icon: TableIcon, label: 'Table' },
  { id: 'bar',   icon: BarChart3, label: 'Bar' },
  { id: 'pie',   icon: PieChart,  label: 'Pie' },
  { id: 'line',  icon: LineChart, label: 'Line' },
];

export default function XeroReportViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const view = useSelector(selectView);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const compare = useSelector(selectCompare);
  const favorites = useSelector(selectFavorites);

  const [tab, setTab] = useState('report');
  const [toast, setToast] = useState('');

  const favorited = !!favorites[report.name];
  const loading = status === 'loading';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };
  const handleSaveDraft = () => {
    dispatch(saveAsDraft({
      baseName: report.name,
      baseCategory: report.category,
      provider: report.provider,
    }));
    showToast('Saved to Drafts');
  };
  const handleSave = () => {
    dispatch(saveAsCustom({
      baseName: report.name,
      baseCategory: report.category,
      provider: report.provider,
    }));
    showToast('Saved to Custom reports');
  };
  const handlePublish = () => {
    dispatch(publishDraft({
      baseName: report.name,
      baseCategory: report.category,
      provider: report.provider,
    }));
    showToast('Published');
  };

  const dateLabel = useMemo(
    () => dateLabelFromRange(filters.dateRange, filters.customFrom, filters.customTo),
    [filters.dateRange, filters.customFrom, filters.customTo],
  );

  const runReport = () => dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: 'xero' }));

  useEffect(() => {
    if (!data && status === 'idle') runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <XeroHeader
        report={report}
        favorited={favorited}
        onToggleFavorite={() => dispatch(toggleFavorite(report.name))}
        onClose={() => dispatch(closeReport())}
        tab={tab}
        onTab={setTab}
        onSaveDraft={handleSaveDraft}
        onSave={handleSave}
        onPublish={handlePublish}
        toast={toast}
      />

      {tab === 'report' && (
        <XeroFilterBar
          filters={filters}
          compare={compare}
          onSetFilter={(patch) => dispatch(setFilter(patch))}
          onSetCompare={(patch) => dispatch(setCompare(patch))}
          onRun={runReport}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin bg-white dark:bg-navy-950">
        {tab === 'report' ? (
          <>
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
                        ? 'text-white border-transparent'
                        : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800',
                    )}
                    style={active ? { background: '#13B5EA' } : undefined}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
              <span className="grow" />
              <button type="button" className="h-8 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 inline-flex items-center gap-1.5 text-[12px] font-semibold">
                <Settings size={13} /> Report options
              </button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-[1400px] mx-auto bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-lg shadow-card p-6 sm:p-10">
                <div className="text-center mb-6">
                  <div className="text-[18px] font-bold text-navy-900 dark:text-white">{client?.name || 'Demo Co'}</div>
                  <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-200">{report.name}</div>
                  <div className="text-[11.5px] text-navy-500 mt-1 capitalize">
                    {filters.basis === 'cash' ? 'Cash Basis' : 'Accrual Basis'} · {dateLabel}
                  </div>
                </div>

                {loading || !data ? (
                  <ReportSkeleton />
                ) : view === 'table' ? (
                  <ReportTable data={data} />
                ) : (
                  <ReportChart kind={view} data={data} height={420} />
                )}

                <div className="mt-6 pt-4 border-t border-navy-100 dark:border-navy-800 text-[10.5px] text-navy-400 flex items-center justify-between">
                  <span>Generated {new Date().toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={11} /> Draft
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8">
            {tab === 'layout'    && <LayoutTab />}
            {tab === 'schedules' && <SchedulesTab />}
            {tab === 'history'   && <HistoryTab />}
          </div>
        )}
      </div>
    </>
  );
}