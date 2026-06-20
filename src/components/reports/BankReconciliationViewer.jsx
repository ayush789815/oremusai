'use client';

// QuickBooks-native viewer for the "Bank Reconciliation" report — QBO's Reconcile
// "History by account" page. It does not use the standard report sheet: it shows
// a breadcrumb, Summary/Reconcile actions, Account + Report period pickers, and a
// reconciliation-history table that is empty (with QuickBooks' empty-state prompt)
// until an account is reconciled. Driven by the generator's `data.qbReconcile`
// block (accounts, reportPeriods, columns, emptyText).

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ChevronDown, HelpCircle } from 'lucide-react';
import Popover from '../ui/Popover.jsx';
import ReportSkeleton from './ReportSkeleton.jsx';
import {
  selectOpenReport, selectReportData, selectReportStatus,
  closeReport, loadReportData,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';
import { cn } from '../../utils/classNames.js';

// QuickBooks brand green used for primary actions.
const QB_GREEN = '#2CA01C';

export default function BankReconciliationViewer() {
  const dispatch = useDispatch();
  const report = useSelector(selectOpenReport);
  const data = useSelector(selectReportData);
  const status = useSelector(selectReportStatus);
  const client = useSelector(selectActiveClient);

  const loading = status === 'loading';
  const accounts = data?.accounts || [];
  const reportPeriods = data?.reportPeriods || ['All Dates'];
  const columns = data?.columns || [];
  const rows = data?.rows || [];

  const [account, setAccount] = useState(accounts[0] || '');
  const [period, setPeriod] = useState(reportPeriods[0] || 'All Dates');

  useEffect(() => {
    if (!data && status === 'idle') {
      dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (accounts[0]) setAccount(accounts[0]);
  }, [accounts[0]]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-navy-950">
      {/* Top bar: breadcrumb + actions + close */}
      <header className="border-b border-navy-200 dark:border-navy-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-[13px] text-navy-500 dark:text-navy-400 min-w-0">
          <span className="truncate">Chart of accounts</span>
          <span className="text-navy-300">/</span>
          <span className="truncate">Bank register</span>
          <span className="text-navy-300">/</span>
          <span className="font-semibold text-navy-800 dark:text-navy-100 truncate">History by account</span>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="h-9 px-4 rounded-md border text-[13px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            style={{ borderColor: QB_GREEN, color: QB_GREEN }}
          >
            Summary
          </button>
          <button
            type="button"
            className="h-9 px-4 rounded-md border text-[13px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            style={{ borderColor: QB_GREEN, color: QB_GREEN }}
          >
            Reconcile
          </button>
          <button
            type="button"
            onClick={() => dispatch(closeReport())}
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-md text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-[22px] font-bold text-navy-900 dark:text-white">History by account</h1>
          <HelpCircle size={16} className="text-navy-400" />
        </div>

        {/* Filters: Account + Report period */}
        <div className="flex flex-wrap items-end gap-6 mb-5">
          <Field label="Account">
            <Picker value={account} options={accounts} onSelect={setAccount} width={260} />
          </Field>
          <Field label="Report period">
            <Picker value={period} options={reportPeriods} onSelect={setPeriod} width={220} />
          </Field>
        </div>

        {loading || !data ? (
          <ReportSkeleton />
        ) : (
          <div className="border border-navy-200 dark:border-navy-800 rounded-md overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-navy-50/70 dark:bg-navy-900/60 text-[11.5px] uppercase tracking-wide text-navy-500 dark:text-navy-400">
                  {columns.map((c, ci) => (
                    <th key={ci} className="font-semibold py-3 px-4 text-left whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-10 px-4 text-center text-[13px] text-navy-500 dark:text-navy-400">
                      {data.emptyText}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, ri) => (
                    <tr key={ri} className="border-t border-navy-100 dark:border-navy-800">
                      {columns.map((c, ci) => (
                        <td key={ci} className="py-3 px-4 text-left text-navy-800 dark:text-navy-100 whitespace-nowrap">{r.cells?.[ci] ?? ''}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-navy-700 dark:text-navy-200">{label}</span>
      {children}
    </div>
  );
}

function Picker({ value, options, onSelect, width }) {
  return (
    <Popover
      align="start"
      width={width}
      trigger={(
        <button
          type="button"
          className="h-10 rounded-md border border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-800 dark:text-navy-100 hover:bg-navy-50 dark:hover:bg-navy-800 inline-flex items-center justify-between gap-3 px-3 text-[13.5px]"
          style={{ width }}
        >
          <span className="truncate">{value}</span>
          <ChevronDown size={16} className="text-navy-400 shrink-0" />
        </button>
      )}
    >
      {({ close }) => (
        <div className="flex flex-col">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onSelect(o); close(); }}
              className={cn(
                'text-left px-3 py-2 text-[13.5px] hover:bg-navy-50 dark:hover:bg-navy-800',
                o === value ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-navy-700 dark:text-navy-200',
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
