'use client';

import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { fmt } from '../../utils/fmt.js';
import { selectFilters } from '../../features/reports/reportsSlice.js';
import { resolvePresetRange } from '../../features/reports/data/dateRanges.js';
import { cn } from '../../utils/classNames.js';
import AccountLedgerModal from './AccountLedgerModal.jsx';
import SourceDocumentModal from './SourceDocumentModal.jsx';

function formatCell(value, decimals, currency) {
  if (value == null) return '';
  if (typeof value !== 'number') return value;
  return fmt(value, { dec: decimals, sign: '', currency }).replace(/^/, '');
}

export default function ReportTable({ data }) {
  const filters = useSelector(selectFilters);
  const [expanded, setExpanded] = useState({});
  const [ledger, setLedger] = useState(null);  // { accountRef, accountName }
  const [source, setSource] = useState(null);  // { sourceType, sourceRef }

  // Resolve the report's active date range so the account ledger drill scopes
  // to the same period the report was run for.
  const range = resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo });

  const cols = data.columns.filter((c) => !filters.hiddenColumns[c.key]);
  const currency = data.currency || 'USD';
  // INR + most accounting reports use 2 decimals like Zoho; allow filter override.
  const decimals = filters.decimals != null ? filters.decimals : 2;

  // Match Zoho's default: hide account rows whose every amount is zero/blank.
  // Section headers, subtotals and totals are always kept (Zoho shows e.g.
  // "Cost of Goods Sold" + "Total for Cost of Goods Sold 0.00" even when empty).
  const valueKeys = cols.filter((c) => c.key !== 'label').map((c) => c.key);
  const isZeroLeaf = (r) => {
    if (r.isHeader || r.isSubtotal || r.isTotal || r.drill) return false;
    return valueKeys.length > 0 && valueKeys.every((k) => {
      const v = r.cells?.[k];
      return v == null || v === '' || (typeof v === 'number' && v === 0);
    });
  };
  const rows = filters.includeZero ? data.rows : data.rows.filter((r) => !isZeroLeaf(r));

  const toggleRow = (idx) => setExpanded((m) => ({ ...m, [idx]: !m[idx] }));

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b-2 border-navy-200 dark:border-navy-700">
            {cols.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'sticky top-0 z-10 bg-white dark:bg-navy-950 px-3 py-2 font-semibold text-navy-500 dark:text-navy-300 uppercase tracking-wider text-[10.5px]',
                  c.align === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            // Backend now emits explicit isHeader for section titles.
            // Fall back to legacy "level === 0" behaviour for older reports.
            const isHeader   = r.isHeader === true || (r.isHeader == null && r.level === 0 && !r.isSubtotal && !r.isTotal);
            const isSubtotal = r.isSubtotal;
            const isTotal    = r.isTotal;
            const isDrillable = !!r.drill;
            const isExpanded = expanded[i];
            const indentPx = Math.min((r.level || 0), 5) * 16;

            const rowCls = cn(
              'transition',
              isHeader   && 'border-t border-navy-100 dark:border-navy-800',
              isSubtotal && 'bg-navy-50 dark:bg-navy-900/60 font-semibold',
              isTotal    && 'bg-brand-50/60 dark:bg-brand-500/10 font-bold border-t-2 border-brand-300 dark:border-brand-500/40',
              !isHeader && !isSubtotal && !isTotal && 'hover:bg-navy-50/50 dark:hover:bg-navy-900/40',
            );

            return (
              <Fragment key={i}>
                <tr className={rowCls}>
                  {cols.map((c, ci) => {
                    const isLabel = ci === 0;
                    const v = isLabel ? r.label : (r.cells?.[c.key] ?? '');
                    // The account label drills to its General Ledger when the
                    // backend tagged the row with an accountRef (Report→Account).
                    const isAccountClickable = isLabel && !!r.accountRef && !isHeader && !isTotal;
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          'px-3 py-2',
                          c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                          isHeader   && 'font-bold text-navy-800 dark:text-navy-100',
                          !isHeader && !isSubtotal && !isTotal && 'text-navy-700 dark:text-navy-300',
                        )}
                        style={isLabel ? { paddingLeft: 12 + indentPx } : undefined}
                      >
                        {isLabel && isDrillable && (
                          <button
                            type="button"
                            onClick={() => toggleRow(i)}
                            className="inline-flex items-center mr-1 text-navy-400 hover:text-brand-600 align-middle"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        )}
                        {isAccountClickable ? (
                          <button
                            type="button"
                            onClick={() => setLedger({ accountRef: String(r.accountRef), accountName: r.accountName || r.label })}
                            className="text-left text-brand-600 hover:underline"
                          >
                            {v}
                          </button>
                        ) : (
                          v == null || v === '' ? '' : (typeof v === 'number' ? formatCell(v, decimals, currency) : v)
                        )}
                      </td>
                    );
                  })}
                </tr>
                {isDrillable && isExpanded && (
                  <tr>
                    <td colSpan={cols.length} className="px-3 pb-3 pt-1">
                      <div className="ml-6 mt-1 mb-2 rounded-lg border border-navy-100 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-900/40">
                        <table className="w-full text-[11.5px]">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-navy-400">
                              <th className="text-left px-3 py-1.5">Counterparty</th>
                              <th className="text-left px-3 py-1.5">Ref</th>
                              <th className="text-left px-3 py-1.5">Date</th>
                              <th className="text-right px-3 py-1.5">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.drill.map((d, di) => {
                              const drillToSource = !!(d.sourceType && d.sourceRef);
                              return (
                                <tr
                                  key={di}
                                  className={cn(
                                    'border-t border-navy-100 dark:border-navy-800',
                                    drillToSource && 'cursor-pointer hover:bg-navy-100/60 dark:hover:bg-navy-800/40',
                                  )}
                                  onClick={drillToSource ? () => setSource({ sourceType: d.sourceType, sourceRef: d.sourceRef }) : undefined}
                                >
                                  <td className={cn('px-3 py-1.5', drillToSource ? 'text-brand-600' : 'text-navy-700 dark:text-navy-200')}>{d.name}</td>
                                  <td className="px-3 py-1.5 font-mono text-navy-500">{d.ref}</td>
                                  <td className="px-3 py-1.5 text-navy-500">{d.date}</td>
                                  <td className="px-3 py-1.5 text-right tabular-nums text-navy-700 dark:text-navy-200">
                                    {formatCell(d.amount, decimals, currency)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <AccountLedgerModal
        open={!!ledger}
        onClose={() => setLedger(null)}
        accountRef={ledger?.accountRef}
        accountName={ledger?.accountName}
        currency={currency}
        from={range.from_date}
        to={range.to_date}
      />
      <SourceDocumentModal
        open={!!source}
        onClose={() => setSource(null)}
        sourceType={source?.sourceType}
        sourceRef={source?.sourceRef}
        currency={currency}
      />
    </div>
  );
}