'use client';

import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MiniReportChart from './MiniReportChart.jsx';
import {
  selectView, selectReportData, selectSidebarCollapsed,
  setView, setSidebarCollapsed,
} from '../../features/reports/reportsSlice.js';
import { cn } from '../../utils/classNames.js';

const VIEWS = [
  { id: 'table', label: 'Table' },
  { id: 'bar',   label: 'Bar'   },
  { id: 'pie',   label: 'Pie'   },
  { id: 'line',  label: 'Line'  },
];

export default function ReportViewSidebar() {
  const dispatch = useDispatch();
  const view = useSelector(selectView);
  const data = useSelector(selectReportData);
  const collapsed = useSelector(selectSidebarCollapsed);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-l border-navy-100 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/40 transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[170px]',
      )}
    >
      <div className="p-3 flex flex-col gap-2 flex-1">
        {VIEWS.map((v) => {
          const isActive = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => dispatch(setView(v.id))}
              className={cn(
                'rounded-xl border p-2 flex flex-col items-center justify-center transition aspect-square',
                isActive
                  ? 'bg-brand-500 border-brand-500 text-white shadow-soft'
                  : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-brand-300 hover:text-brand-600',
              )}
              title={v.label}
            >
              <div className={cn('flex-1 w-full grid place-items-center', isActive && 'opacity-90')}>
                <div className="w-full h-full">
                  <MiniReportChart kind={v.id} data={data} />
                </div>
              </div>
              {!collapsed && (
                <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider">
                  {v.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => dispatch(setSidebarCollapsed(!collapsed))}
        className="m-2 mt-0 h-8 rounded-lg border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800 flex items-center justify-center gap-1.5 text-[11px] font-medium"
      >
        {collapsed ? <ChevronLeft size={13} /> : (<><ChevronRight size={13} /> Collapse</>)}
      </button>
    </aside>
  );
}