'use client';

// Original Oremus/Zoho report viewer body — preserved verbatim so the
// Zoho experience is unchanged. The wrapper Modal is supplied by
// ReportViewerModal so this component just renders the body.

import { useDispatch, useSelector } from 'react-redux';
import {
  X, Download, Mail, Printer, Sparkles, Calendar, BarChart3, PieChart, LineChart, Table,
} from 'lucide-react';
import IconBadge from '../../ui/IconBadge.jsx';
import Button from '../../ui/Button.jsx';
import ReportFilterBar from '../ReportFilterBar.jsx';
import ReportToolbar from '../ReportToolbar.jsx';
import ReportTable from '../ReportTable.jsx';
import ReportChart from '../ReportChart.jsx';
import ReportSkeleton from '../ReportSkeleton.jsx';
import ReportViewSidebar from '../ReportViewSidebar.jsx';
import ExportMenu from '../ExportMenu.jsx';
import {
  selectOpenReport, selectView, selectReportData, selectReportStatus,
  selectFilters, closeReport, setView,
} from '../../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../../features/clients/clientsSlice.js';
import { resolvePresetRange } from '../../../features/reports/data/dateRanges.js';
import { iconForReport } from '../reportIcon.js';
import { cn } from '../../../utils/classNames.js';

// Format YYYY-MM-DD → "01 Apr 2025" (Zoho's report-header date style).
function prettyDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d).padStart(2, '0')} ${MONTHS[(m || 1) - 1]} ${y}`;
}

const VIEW_TABS = [
  { id: 'table', icon: Table,     label: 'Table' },
  { id: 'bar',   icon: BarChart3, label: 'Bar' },
  { id: 'pie',   icon: PieChart,  label: 'Pie' },
  { id: 'line',  icon: LineChart, label: 'Line' },
];

export default function ZohoReportViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const view = useSelector(selectView);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);
  const filters = useSelector(selectFilters);
  const ReportIcon = iconForReport(report.name);
  const loading = status === 'loading';

  const range = resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo });
  const basisLabel = filters.basis === 'cash' ? 'Cash' : 'Accrual';

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-navy-100 dark:border-navy-800">
        <div className="flex items-center gap-3 min-w-0">
          <IconBadge icon={ReportIcon} tone="brand" size="md" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-navy-500 capitalize">
              {report.category} · Report
            </div>
            <div className="text-[15.5px] font-semibold text-navy-900 dark:text-white truncate">
              {report.name}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" icon={Sparkles}>Save preset</Button>
          <Button variant="ghost" icon={Calendar}>Schedule</Button>
          <ExportMenu
            trigger={<Button variant="secondary" icon={Download}>Export</Button>}
            meta={{ company: client?.name || 'Oremus', basis: basisLabel, from: prettyDate(range.from_date), to: prettyDate(range.to_date) }}
          />
          <Button variant="secondary" icon={Mail}>Email</Button>
          <Button variant="secondary" icon={Printer}>Print</Button>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dispatch(closeReport())}
          className="h-9 w-9 grid place-items-center rounded-lg border border-navy-200 dark:border-navy-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <X size={16} />
        </button>
      </header>

      {/* Filter bar */}
      <ReportFilterBar />

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto scroll-thin p-4 sm:p-6 lg:p-8 bg-navy-50/40 dark:bg-navy-900/40">
          <ReportToolbar />

          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-2xl shadow-card p-5 sm:p-8 lg:p-10 relative max-w-[1400px] mx-auto">
            <div className="mb-4 text-center">
              <div className="text-[16px] font-bold text-navy-900 dark:text-white">{client?.name || 'Oremus'}</div>
              <div className="text-[14px] font-semibold text-navy-800 dark:text-navy-100 mt-0.5">{data?.meta?.title || report.name}</div>
              {data?.meta?.asOf ? (
                <div className="text-[11.5px] text-navy-500 mt-0.5">As of {data.meta.asOf}</div>
              ) : (
                <>
                  <div className="text-[11.5px] text-navy-500 mt-0.5">Basis: {basisLabel}</div>
                  <div className="text-[11.5px] text-navy-500">From {prettyDate(range.from_date)} To {prettyDate(range.to_date)}</div>
                </>
              )}
              <div className="text-[11px] text-navy-400 mt-0.5">Amount in {data?.currency || 'USD'}</div>
            </div>

            {/* Mobile view tabs */}
            <div className="md:hidden flex items-center gap-1.5 mb-4 overflow-x-auto scroll-thin">
              {VIEW_TABS.map((t) => {
                const Icon = t.icon;
                const isActive = view === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => dispatch(setView(t.id))}
                    className={cn(
                      'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold border shrink-0 transition',
                      isActive
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300',
                    )}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
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
              <span>Oremus · Confidential</span>
            </div>
          </div>
        </div>

        <ReportViewSidebar />
      </div>
    </>
  );
}