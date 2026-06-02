'use client';

import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Wallet, Play } from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ReportFilterPill from './ReportFilterPill.jsx';
import MoreFiltersPopover from './MoreFiltersPopover.jsx';
import {
  selectFilters, setFilter, selectOpenReport, loadReportData,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';
import { DATE_PRESETS, dateLabel, resolvePresetRange } from '../../features/reports/data/dateRanges.js';
import { cn } from '../../utils/classNames.js';

const BASIS = [['accrual', 'Accrual'], ['cash', 'Cash']];

function OptionRow({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition',
        active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200',
      )}
    >
      {label}
    </button>
  );
}

export default function ReportFilterBar() {
  const dispatch = useDispatch();
  const f = useSelector(selectFilters);
  const open = useSelector(selectOpenReport);
  const client = useSelector(selectActiveClient);

  const runReport = () => {
    if (!open?.name) return;
    const range = resolvePresetRange(f.dateRange, { from: f.customFrom, to: f.customTo });
    dispatch(loadReportData({
      reportName: open.name,
      clientId:   client?.id,
      provider:   open.provider,
      filters:    { ...range, basis: f.basis, refresh: true },
    }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-6 py-3 border-b border-navy-100 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-900/40">
      <Popover
        width={220}
        trigger={<ReportFilterPill label="Date" value={dateLabel(f.dateRange)} icon={Calendar} active={f.dateRange !== 'this-fiscal-year'} />}
      >
        {({ close }) => (
          <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto scroll-thin">
            {DATE_PRESETS.map(([k, l]) => (
              <OptionRow
                key={k}
                active={f.dateRange === k}
                label={l}
                onClick={() => { dispatch(setFilter({ dateRange: k })); close(); }}
              />
            ))}
          </div>
        )}
      </Popover>

      {f.dateRange === 'custom' && (
        <div className="flex items-center gap-1 text-[12px]">
          <input
            type="date"
            value={f.customFrom || ''}
            onChange={(e) => dispatch(setFilter({ customFrom: e.target.value }))}
            className="h-9 px-2 rounded-lg bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-navy-900 dark:text-white"
          />
          <span className="text-navy-400">→</span>
          <input
            type="date"
            value={f.customTo || ''}
            onChange={(e) => dispatch(setFilter({ customTo: e.target.value }))}
            className="h-9 px-2 rounded-lg bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-navy-900 dark:text-white"
          />
        </div>
      )}

      <Popover
        width={180}
        trigger={<ReportFilterPill label="Basis" value={f.basis === 'accrual' ? 'Accrual' : 'Cash'} icon={Wallet} />}
      >
        {({ close }) => (
          <div className="flex flex-col gap-0.5">
            {BASIS.map(([k, l]) => (
              <OptionRow
                key={k}
                active={f.basis === k}
                label={l}
                onClick={() => { dispatch(setFilter({ basis: k })); close(); }}
              />
            ))}
          </div>
        )}
      </Popover>

      <MoreFiltersPopover />

      <div className="grow" />

      <button
        type="button"
        onClick={runReport}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[12.5px] shadow-soft transition"
      >
        <Play size={13} /> Run report
      </button>
    </div>
  );
}
