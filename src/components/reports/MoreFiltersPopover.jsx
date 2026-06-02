'use client';

import { useDispatch, useSelector } from 'react-redux';
import { Sliders } from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ReportFilterPill from './ReportFilterPill.jsx';
import { selectFilters, setFilter } from '../../features/reports/reportsSlice.js';
import { cn } from '../../utils/classNames.js';

const INTERVALS = ['none', 'days', 'weeks', 'months', 'quarters', 'years'];
const SORTS = [
  ['default', 'Default'],
  ['name-asc', 'Name (A→Z)'],
  ['name-desc', 'Name (Z→A)'],
  ['amount-desc', 'Amount (High→Low)'],
  ['amount-asc', 'Amount (Low→High)'],
];
const FORMATS = [['international', 'International'], ['indian', 'Indian']];

function Section({ title, children }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-navy-400">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12px] text-navy-700 dark:text-navy-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  'h-8 px-2 rounded-md bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-[12px] text-navy-900 dark:text-white outline-none focus:border-brand-400';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-4 h-4 rounded border flex items-center justify-center transition',
        checked ? 'bg-brand-500 border-brand-500' : 'bg-white dark:bg-navy-900 border-navy-300 dark:border-navy-600',
      )}
      aria-pressed={checked}
    >
      {checked && <span className="text-white text-[10px] leading-none">✓</span>}
    </button>
  );
}

export default function MoreFiltersPopover() {
  const dispatch = useDispatch();
  const f = useSelector(selectFilters);
  const setF = (patch) => dispatch(setFilter(patch));

  const activeCount =
    (f.interval !== 'none' ? 1 : 0) +
    (f.sortBy !== 'default' ? 1 : 0) +
    (f.decimals !== 0 ? 1 : 0) +
    (f.numberFormat !== 'international' ? 1 : 0) +
    (f.includeZero ? 1 : 0) +
    (f.includeDeleted ? 1 : 0) +
    (f.showDebitCredit ? 1 : 0);

  return (
    <Popover
      width={420}
      align="start"
      trigger={
        <ReportFilterPill
          label="More filters"
          value={activeCount ? `${activeCount} active` : 'Default'}
          icon={Sliders}
          active={activeCount > 0}
        />
      }
    >
      <div className="space-y-4">
        <Section title="Display">
          <Field label="Interval">
            <select className={selectCls} value={f.interval} onChange={(e) => setF({ interval: e.target.value })}>
              {INTERVALS.map((v) => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Sort by">
            <select className={selectCls} value={f.sortBy} onChange={(e) => setF({ sortBy: e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Number format">
          <Field label="Decimal places">
            <select className={selectCls} value={f.decimals} onChange={(e) => setF({ decimals: Number(e.target.value) })}>
              {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Format">
            <select className={selectCls} value={f.numberFormat} onChange={(e) => setF({ numberFormat: e.target.value })}>
              {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Show/hide">
          <Field label="Include zero balances"><Toggle checked={f.includeZero} onChange={(v) => setF({ includeZero: v })} /></Field>
          <Field label="Include sub-accounts"><Toggle checked={f.includeSubAccounts} onChange={(v) => setF({ includeSubAccounts: v })} /></Field>
          <Field label="Include deleted records"><Toggle checked={f.includeDeleted} onChange={(v) => setF({ includeDeleted: v })} /></Field>
          <Field label="Show debit/credit columns"><Toggle checked={f.showDebitCredit} onChange={(v) => setF({ showDebitCredit: v })} /></Field>
        </Section>
      </div>
    </Popover>
  );
}