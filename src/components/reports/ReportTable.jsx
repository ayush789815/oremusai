'use client';

import { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronRight, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { fmt, currencySymbol } from '../../utils/fmt.js';
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

// One side (Income or Expense) of a horizontal / T-format P&L. Renders the
// section headers, leaf accounts (indented) and "Total for X" subtotals exactly
// like Zoho, with a bold grand Total footer that balances against the other side.
function HorizontalSide({ side, decimals, currency, includeZero }) {
  const all = Array.isArray(side?.rows) ? side.rows : [];
  // Match Zoho: hide zero-balance leaf accounts (keep headers & subtotals).
  const rows = includeZero
    ? all
    : all.filter((r) => r.isHeader || r.isSubtotal || !(r.cells?.amount == null || r.cells?.amount === 0));
  return (
    <div className="flex flex-col">
      <div className="px-4 py-2.5 text-[15px] italic font-semibold text-navy-800 dark:text-navy-100 border-b-2 border-navy-200 dark:border-navy-700">
        {side?.title}
      </div>
      <table className="w-full border-collapse text-[12.5px]">
        <tbody>
          {rows.map((r, i) => {
            const isHeader   = r.isHeader === true;
            const isSubtotal = r.isSubtotal;
            const indentPx   = Math.min((r.level || 0), 5) * 16;
            const v = r.cells?.amount;
            return (
              <tr
                key={i}
                className={cn(
                  isHeader   && 'font-bold text-navy-800 dark:text-navy-100',
                  isSubtotal && 'bg-navy-50 dark:bg-navy-900/60 font-semibold',
                  !isHeader && !isSubtotal && 'text-navy-700 dark:text-navy-300',
                )}
              >
                <td className="px-4 py-1.5" style={{ paddingLeft: 16 + indentPx }}>
                  {!isHeader && !isSubtotal ? <span className="mr-1.5 text-navy-400">•</span> : null}
                  {r.label}
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">
                  {v == null || v === '' ? '' : formatCell(v, decimals, currency)}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-navy-200 dark:border-navy-700 font-bold text-navy-900 dark:text-navy-50">
            <td className="px-4 py-2.5 text-right">Total</td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {side?.total == null ? '' : formatCell(side.total, decimals, currency)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ReportTable({ data, variant = 'standard' }) {
  const filters = useSelector(selectFilters);
  const [expanded, setExpanded] = useState({});
  const [collapsedSec, setCollapsedSec] = useState({});  // QB section collapse
  const [ledger, setLedger] = useState(null);  // { accountRef, accountName }
  const [source, setSource] = useState(null);  // { sourceType, sourceRef }

  // Resolve the report's active date range so the account ledger drill scopes
  // to the same period the report was run for.
  const range = resolvePresetRange(filters.dateRange, { from: filters.customFrom, to: filters.customTo });

  // Horizontal / T-format P&L (Expense column | Income column) — matches Zoho's
  // "Horizontal Profit and Loss". Falls through to the standard table otherwise.
  if (data.layout === 'horizontal' && data.horizontal) {
    const currency = data.currency || 'USD';
    const decimals = filters.decimals != null ? filters.decimals : 2;
    return (
      <div className="overflow-x-auto scroll-thin">
        <div className="grid grid-cols-1 md:grid-cols-2 border border-navy-200 dark:border-navy-700 rounded-lg overflow-hidden">
          <div className="md:border-r border-navy-200 dark:border-navy-700">
            <HorizontalSide side={data.horizontal.expense} decimals={decimals} currency={currency} includeZero={filters.includeZero} />
          </div>
          <div className="border-t md:border-t-0 border-navy-200 dark:border-navy-700">
            <HorizontalSide side={data.horizontal.income} decimals={decimals} currency={currency} includeZero={filters.includeZero} />
          </div>
        </div>
      </div>
    );
  }

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

  // Drill-down modals are shared by every render branch below.
  const drillModals = (
    <>
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
    </>
  );

  // ── QuickBooks Online–style sheet ────────────────────────────────────────
  // Clean white sheet, section headers with a collapse chevron, leaf amounts
  // plain and subtotal/total amounts prefixed with the currency symbol — the
  // visual language of QBO's report builder. Only used when the QB viewer asks
  // for it (variant="quickbooks"); Zoho/Xero keep the standard layout.
  if (variant === 'quickbooks') {
    const sym = currencySymbol(currency);
    const toggleSec = (idx) => setCollapsedSec((m) => ({ ...m, [idx]: !m[idx] }));

    // Hide the descendant rows of a collapsed section header. A header at
    // level L hides every following row with level > L until a row at level ≤ L
    // (so its sibling "Total for …" line, which shares the header's level, stays
    // visible — matching QBO).
    let hideAbove = null;
    const visible = [];
    rows.forEach((r, i) => {
      const lvl = r.level || 0;
      if (hideAbove != null) {
        if (lvl > hideAbove) return;
        hideAbove = null;
      }
      visible.push({ r, i });
      if (r.isHeader && collapsedSec[i]) hideAbove = lvl;
    });

    const qbAmount = (v, emphasize) => {
      if (v == null || v === '') return '';
      if (typeof v !== 'number') return v;
      return fmt(v, { dec: decimals, sign: emphasize ? sym : '' });
    };

    return (
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full border-collapse text-[13px] text-navy-800 dark:text-navy-100">
          <thead>
            <tr className="border-b border-navy-300 dark:border-navy-600">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'px-3 py-2 font-semibold text-[12px] text-navy-500 dark:text-navy-400',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {c.align === 'right' ? (
                    <span className="inline-flex items-center gap-1 justify-end">
                      {c.label}
                      <ChevronsUpDown size={12} className="text-navy-300 dark:text-navy-500" />
                    </span>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(({ r, i }) => {
              const isHeader   = r.isHeader === true;
              const isSubtotal = r.isSubtotal;
              const isTotal    = r.isTotal;
              const lvl        = r.level || 0;
              const indentPx   = Math.min(lvl, 6) * 18;
              const isDrillable = !!r.drill;
              const isExpanded  = expanded[i];
              const collapsed   = collapsedSec[i];
              const emphasize   = isSubtotal || isTotal;       // $-prefix amounts
              const majorLine   = isTotal || (isSubtotal && lvl === 0);

              const rowCls = cn(
                'transition',
                isHeader && 'bg-navy-50 dark:bg-navy-900/50',
                isTotal && 'bg-navy-100/70 dark:bg-navy-800/60 font-bold border-y-2 border-navy-300 dark:border-navy-600',
                isSubtotal && 'font-semibold border-t border-navy-200 dark:border-navy-700',
                majorLine && !isTotal && 'bg-navy-50/70 dark:bg-navy-900/40',
                !isHeader && !isSubtotal && !isTotal && 'hover:bg-navy-50/60 dark:hover:bg-navy-900/40',
              );

              return (
                <Fragment key={i}>
                  <tr className={rowCls}>
                    {cols.map((c, ci) => {
                      const isLabel = ci === 0;
                      const v = isLabel ? r.label : (r.cells?.[c.key] ?? '');
                      const isAccountClickable = isLabel && !!r.accountRef && !isHeader && !isTotal;
                      return (
                        <td
                          key={c.key}
                          className={cn(
                            'px-3 py-[7px]',
                            c.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                          )}
                          style={isLabel ? { paddingLeft: 12 + indentPx } : undefined}
                        >
                          {isLabel && isHeader && (
                            <button
                              type="button"
                              onClick={() => toggleSec(i)}
                              className="inline-flex items-center mr-1.5 align-middle text-navy-500 hover:text-navy-800 dark:hover:text-white"
                              aria-label={collapsed ? 'Expand section' : 'Collapse section'}
                            >
                              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          {isLabel && isDrillable && !isHeader && (
                            <button
                              type="button"
                              onClick={() => toggleRow(i)}
                              className="inline-flex items-center mr-1 align-middle text-navy-400 hover:text-brand-600"
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
                          ) : isLabel ? (
                            v
                          ) : (
                            qbAmount(v, emphasize)
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
        {drillModals}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'sticky top-0 z-10 bg-navy-50/90 dark:bg-navy-900/90 backdrop-blur-sm px-3.5 py-2.5 font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-[0.12em] text-[10.5px] border-b border-navy-200 dark:border-navy-700',
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
              isHeader   && 'bg-navy-50/50 dark:bg-navy-900/40 border-t border-navy-100 dark:border-navy-800',
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
                          'px-3.5 py-2.5',
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
      {drillModals}
    </div>
  );
}