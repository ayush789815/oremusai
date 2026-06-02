'use client';

// Modal shell that hosts the report viewer for the currently open report.
// The body is picked based on the report's provider so each accounting
// system (Zoho / QuickBooks / Xero) gets its own native-looking chrome,
// filter bar, and tabs — while the underlying data flow (loadReportData,
// view state, filters, drill-downs, etc.) is shared.

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import ZohoReportViewer from './zoho/ZohoReportViewer.jsx';
import QBReportViewer from './quickbooks/QBReportViewer.jsx';
import XeroReportViewer from './xero/XeroReportViewer.jsx';
import {
  selectOpenReport, selectIsViewerOpen,
  closeReport, loadReportData,
} from '../../features/reports/reportsSlice.js';
import { selectActiveClient } from '../../features/clients/clientsSlice.js';

const VIEWERS = {
  zoho:       ZohoReportViewer,
  quickbooks: QBReportViewer,
  xero:       XeroReportViewer,
};

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

  if (!open || !report) return null;

  const Viewer = VIEWERS[report.provider] || VIEWERS.zoho;

  return (
    <Modal open={open} onClose={() => dispatch(closeReport())} size="full">
      <Viewer />
    </Modal>
  );
}