'use client';

// Full-page host for the currently open report. The viewer takes over the whole
// viewport (not a centered modal) so reports read like a dedicated page, with
// the viewer's own top bar providing the Back button. The UI is COMMON across
// every provider (Zoho / QuickBooks / Xero) — one consistent report experience —
// while the data flow (loadReportData, view, filters, drill-downs) stays
// provider-aware via report.provider. Role/permissions only gate client access.

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import ReportViewer from './quickbooks/QBReportViewer.jsx';
import ExecutiveSummaryViewer from './ExecutiveSummaryViewer.jsx';
import BudgetSummaryViewer from './BudgetSummaryViewer.jsx';
import BudgetVarianceViewer from './BudgetVarianceViewer.jsx';
import CashSummaryViewer from './CashSummaryViewer.jsx';
import CashFlowsDirectViewer from './CashFlowsDirectViewer.jsx';
import ForeignCurrencyGainsViewer from './ForeignCurrencyGainsViewer.jsx';
import InventoryItemSummaryViewer from './InventoryItemSummaryViewer.jsx';
import ZohoDetailReportViewer from './ZohoDetailReportViewer.jsx';
import GstReturnsWorkbookViewer from './GstReturnsWorkbookViewer.jsx';
import BankReconciliationViewer from './BankReconciliationViewer.jsx';
import {
  selectOpenReport, selectIsViewerOpen,
  closeReport, loadReportData,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';

export default function ReportViewerModal() {
  const dispatch = useDispatch();
  const open = useSelector(selectIsViewerOpen);
  const report = useSelector(selectOpenReport);
  const client = useSelector(selectActiveClient);

  // Kick off data fetch whenever a new report is opened.
  useEffect(() => {
    if (open && report?.name) {
      dispatch(loadReportData({ reportName: report.name, clientId: client?.id, provider: report.provider }));
    }
  }, [dispatch, open, report?.name, client?.id]);

  // Esc closes the page; lock body scroll while the full-page report is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') dispatch(closeReport()); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, dispatch]);

  if (!open || !report) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white dark:bg-navy-950 animate-fadein">
      {report.name === 'Executive Summary' ? (
        <ExecutiveSummaryViewer />
      ) : report.name === 'Budget Summary' ? (
        <BudgetSummaryViewer />
      ) : report.name === 'Budget Variance' ? (
        <BudgetVarianceViewer />
      ) : report.name === 'Cash Summary' ? (
        <CashSummaryViewer />
      ) : report.name === 'Statement of Cash Flows - Direct' ? (
        <CashFlowsDirectViewer />
      ) : report.name === 'Foreign Currency Gains and Losses' ? (
        <ForeignCurrencyGainsViewer />
      ) : report.name === 'Inventory Item Summary' ? (
        <InventoryItemSummaryViewer />
      ) : report.name === 'GST Returns Workbook' ? (
        <GstReturnsWorkbookViewer />
      ) : report.name === 'Bank Reconciliation' ? (
        <BankReconciliationViewer />
      ) : report.name === 'Credit Notes' || report.name === 'Credit Note Details'
        || report.name === 'Recurring Invoices' || report.name === 'Recurring Invoice Details'
        || report.name === 'Purchases by Item' || report.name === 'Tax Liability'
        || report.name === 'TDS Summary' || report.name === 'Realized Gain or Loss' ? (
        <ZohoDetailReportViewer />
      ) : (
        <ReportViewer />
      )}
    </div>,
    document.body,
  );
}
