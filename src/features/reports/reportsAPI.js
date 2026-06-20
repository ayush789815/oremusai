import axiosClient from '../../services/axiosClient.js';
import { clientMultiplier } from '../../utils/clientMultiplier.js';
import { generateReport } from './data/generators.js';
import { CATALOGS } from './data/index.js';

// Look up the backend liveType for a report card by its display name.
function resolveLiveType(provider, reportName) {
  const catalog = CATALOGS[provider]?.allReports || [];
  const entry = catalog.find((r) => r.name === reportName);
  return entry?.liveType || null;
}

// Scale every numeric cell in a row by the per-client multiplier (mock path only).
function scaleRows(rows, mult) {
  return rows.map((r) => {
    if (!r.cells) return r;
    const cells = {};
    for (const k of Object.keys(r.cells)) {
      const v = r.cells[k];
      cells[k] = typeof v === 'number' ? Math.round(v * mult) : v;
    }
    const next = { ...r, cells };
    if (r.drill) next.drill = r.drill.map((d) => ({ ...d, amount: Math.round(d.amount * mult) }));
    return next;
  });
}

function buildParams(filters = {}) {
  const out = {};
  if (filters?.from || filters?.from_date) out.from_date = filters.from || filters.from_date;
  if (filters?.to   || filters?.to_date)   out.to_date   = filters.to   || filters.to_date;
  if (filters?.basis || filters?.accounting_basis) out.accounting_basis = filters.basis || filters.accounting_basis;
  if (filters?.refresh) out.refresh = '1';
  // Display columns by (interval): only send when it actually splits columns.
  if (filters?.interval && filters.interval !== 'none' && filters.interval !== 'total') {
    out.interval = filters.interval;
  }
  // Multi-period comparison columns (P&L / Balance Sheet / Cash Flow).
  if (filters?.compare && filters?.compare_count > 1) {
    out.compare = filters.compare;
    out.compare_count = filters.compare_count;
    out.oldest_first = filters.oldest_first ? '1' : '0';
  }
  return out;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Server-side export: POST the on-screen report data to the backend, which
// returns a real .xlsx or .pdf file. Provider-agnostic — the exported file
// matches exactly what's rendered. Throws on failure so callers can fall back.
export async function exportReportFile({ data, reportName = 'Report', format = 'xlsx', meta = {} } = {}) {
  if (!data) throw new Error('No report data to export');
  const res = await axiosClient.post(
    '/report-export',
    { data, reportName, meta },
    { params: { format }, responseType: 'blob' },
  );
  const ext = format === 'pdf' ? 'pdf' : 'xlsx';
  const stamp = new Date().toISOString().slice(0, 10);
  const base = String(reportName || 'Report').replace(/[\\/:*?"<>|]+/g, ' ').trim();
  downloadBlob(res.data, `${base} ${stamp}.${ext}`);
}

// Honest empty payload — rendered as a "no data" illustration by the viewer.
// `emptyReason`: 'error' (live fetch failed) | 'no_data' (fetched ok, no rows).
const emptyReport = (reason) => ({ columns: [], rows: [], empty: true, emptyReason: reason });

export async function fetchReportData({ reportName, clientId, provider, filters } = {}) {
  const liveType = resolveLiveType(provider, reportName);

  // Live-capable reports fetch real data from the provider's backend
  // (Zoho → /zb-reports, QuickBooks & Xero → the provider-agnostic /accounting
  // engine). When the call fails — or succeeds but returns no rows — we surface
  // an honest empty state instead of fabricating mock numbers, so a connected
  // client never sees dummy data where live data was expected.
  if (liveType) {
    const endpoint = provider === 'zoho' ? `/zb-reports/${liveType}` : `/accounting/${liveType}`;
    try {
      const params = buildParams(filters);
      const { data } = await axiosClient.get(endpoint, { params });
      if (data && Array.isArray(data.rows)) {
        return data.rows.length > 0 ? data : { ...data, empty: true, emptyReason: 'no_data' };
      }
      return emptyReport('no_data');
    } catch (e) {
      console.warn(`[reportsAPI] ${provider} report '${reportName}' failed: ${e?.response?.data?.error || e.message}`);
      return emptyReport('error');
    }
  }

  // Demo-only catalog entries with no backend endpoint keep the sample generator
  // so the catalog still renders a meaningful preview.
  return new Promise((resolve) => {
    setTimeout(() => {
      const base = generateReport(reportName);
      const mult = clientMultiplier(clientId);
      resolve({ ...base, rows: scaleRows(base.rows, mult) });
    }, 100);
  });
}
