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

export async function fetchReportData({ reportName, clientId, provider, filters } = {}) {
  const liveType = resolveLiveType(provider, reportName);

  // Zoho live path — fetch from existing Zoho reports endpoint (unchanged).
  if (liveType && provider === 'zoho') {
    try {
      const params = buildParams(filters);
      const { data } = await axiosClient.get(`/zb-reports/${liveType}`, { params });
      if (data && Array.isArray(data.rows)) return data;
    } catch (e) {
      console.warn(`[reportsAPI] Zoho report '${reportName}' fell back to mock: ${e?.response?.data?.error || e.message}`);
    }
  }

  // QuickBooks live path — provider-agnostic accounting engine.
  if (liveType && provider === 'quickbooks') {
    try {
      const params = buildParams(filters);
      const { data } = await axiosClient.get(`/accounting/${liveType}`, { params });
      if (data && Array.isArray(data.rows)) return data;
    } catch (e) {
      console.warn(`[reportsAPI] QuickBooks report '${reportName}' fell back to mock: ${e?.response?.data?.error || e.message}`);
    }
  }

  // Xero live path — provider-agnostic accounting engine (same endpoint as QB).
  if (liveType && provider === 'xero') {
    try {
      const params = buildParams(filters);
      const { data } = await axiosClient.get(`/accounting/${liveType}`, { params });
      if (data && Array.isArray(data.rows)) return data;
    } catch (e) {
      console.warn(`[reportsAPI] Xero report '${reportName}' fell back to mock: ${e?.response?.data?.error || e.message}`);
    }
  }

  // Fallback / non-Zoho / unmapped Zoho path: mock generator.
  return new Promise((resolve) => {
    setTimeout(() => {
      const base = generateReport(reportName);
      const mult = clientMultiplier(clientId);
      resolve({ ...base, rows: scaleRows(base.rows, mult) });
    }, 100);
  });
}
