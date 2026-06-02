'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import {
  PERIODS,
  selectPeriod,
  selectCustomRange,
  selectPeriodLabel,
  setPeriod,
  setCustomRange,
} from '../../features/filters/filtersSlice.js';
import { cn } from '../../utils/classNames.js';

/**
 * Period dropdown filter, modeled on Dashboard 1. Renders presets plus a
 * custom date-range picker. State is read/written via the `filters` slice.
 */
export default function PeriodFilter() {
  const dispatch = useDispatch();
  const period = useSelector(selectPeriod);
  const customRange = useSelector(selectCustomRange);
  const label = useSelector(selectPeriodLabel);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(customRange);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 h-10 px-3 rounded-xl border transition text-[12.5px] font-semibold',
          open
            ? 'bg-brand-50/60 border-brand-300 text-brand-700 dark:bg-brand-500/15 dark:border-brand-500/40 dark:text-brand-300'
            : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
        )}
      >
        <Calendar size={14} className="text-navy-400" />
        {label}
        <ChevronDown size={13} className={cn('text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[300px] z-50 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl shadow-lift overflow-hidden animate-fadein">
          <div className="px-3 py-2 border-b border-navy-100 dark:border-navy-800 text-[10.5px] uppercase tracking-wider text-navy-500 font-semibold">
            Time period
          </div>
          <ul className="py-1.5">
            {PERIODS.map((p) => {
              const active = period === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      if (p.id === 'custom') {
                        dispatch(setPeriod('custom'));
                        if (pending?.from) dispatch(setCustomRange(pending));
                      } else {
                        dispatch(setPeriod(p.id));
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12.5px] text-left transition',
                      active
                        ? 'bg-brand-50/60 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                    )}
                  >
                    {p.label}
                    {active && <Check size={13} />}
                  </button>
                </li>
              );
            })}
          </ul>

          {period === 'custom' && (
            <div className="border-t border-navy-100 dark:border-navy-800 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="block text-[10.5px] font-semibold text-navy-500 mb-1">From</span>
                  <input
                    type="date"
                    value={pending.from || ''}
                    onChange={(e) => setPending((p) => ({ ...p, from: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg bg-navy-50 dark:bg-navy-800 border border-transparent focus:border-brand-400 text-[12px] outline-none text-navy-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10.5px] font-semibold text-navy-500 mb-1">To</span>
                  <input
                    type="date"
                    value={pending.to || ''}
                    onChange={(e) => setPending((p) => ({ ...p, to: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg bg-navy-50 dark:bg-navy-800 border border-transparent focus:border-brand-400 text-[12px] outline-none text-navy-900 dark:text-white"
                  />
                </label>
              </div>
              <button
                onClick={() => {
                  if (pending.from && pending.to) {
                    dispatch(setCustomRange(pending));
                    setOpen(false);
                  }
                }}
                disabled={!pending.from || !pending.to}
                className="w-full h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-[12px] font-semibold transition"
              >
                Apply range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}