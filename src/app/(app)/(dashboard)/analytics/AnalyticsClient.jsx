'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Sparkles, Send, Loader2, ChevronDown, Code2, BarChart3, Hash, TrendingUp, Trophy,
} from 'lucide-react';
import { selectUser } from '@/features/auth/authSlice.js';
import { askAI } from '@/services/aiClient.js';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#0ea5e9', '#14b8a6', '#a855f7', '#3b82f6', '#22d3ee'];

// Compact number for stat-card headlines: 2,175,550 → "2.18M".
function fmtCompact(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtFull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v);
}

const MAX_TABLE_ROWS = 50;

// Columns whose integer values are identifiers, not quantities — keep them raw
// (no thousands separators turning a year "2025" into "2,025").
const ID_LIKE = /(^|[_\s])(id|year|code|no|num|number|phone|pin|zip)([_\s]|$)/i;

// "total_revenue" → "Total Revenue".
function titleize(k) {
  return String(k).replace(/[_\s]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function isNumeric(v) {
  if (v === null || v === undefined || v === '') return false;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') { const t = v.trim(); return t !== '' && !Number.isNaN(Number(t)); }
  return false;
}

// Format a cell: numbers get grouped thousands + trimmed decimals (2175550.0000
// → "2,175,550", 295332.28 → "295,332.28"); identifiers stay raw; null → "—".
function formatCell(v, numeric, idLike) {
  if (v === null || v === undefined || v === '') return '—';
  if (!numeric) return String(v);
  const n = Number(v);
  if (idLike) return String(Math.trunc(n));
  const whole = Number.isInteger(n);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// Renders a SELECT result set returned by /query as a clean, scrollable table:
// title-cased headers, right-aligned + grouped numbers, zebra rows.
function ResultTable({ rows }) {
  if (!rows.length) return <div className="text-[12px] text-navy-500">No rows returned.</div>;
  // Show only columns that have at least one value (SELECT * yields many nulls).
  const keys = Object.keys(rows[0]).filter((k) =>
    rows.some((r) => r[k] !== null && r[k] !== '' && r[k] !== undefined));
  const shown = rows.slice(0, MAX_TABLE_ROWS);
  // Per-column metadata: numeric when every non-empty value parses as a number.
  const meta = keys.map((k) => {
    const vals = rows.map((r) => r[k]).filter((v) => v !== null && v !== '' && v !== undefined);
    const numeric = vals.length > 0 && vals.every(isNumeric);
    return { key: k, numeric, idLike: ID_LIKE.test(k), align: numeric && !ID_LIKE.test(k) };
  });
  return (
    <div className="rounded-lg border border-navy-100 dark:border-navy-800 overflow-hidden">
      <div className="px-3 py-2 bg-navy-50/70 dark:bg-navy-900/60 border-b border-navy-100 dark:border-navy-800">
        <span className="text-[11px] font-medium text-navy-500 dark:text-navy-400">
          {rows.length} row{rows.length === 1 ? '' : 's'}
          {rows.length > shown.length ? ` · showing first ${shown.length}` : ''}
        </span>
      </div>
      <div className="overflow-auto max-h-[440px]">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr>
              {meta.map((m) => (
                <th
                  key={m.key}
                  className={`sticky top-0 z-10 bg-navy-100/90 dark:bg-navy-900 px-3 py-2 font-semibold text-navy-600 dark:text-navy-200 whitespace-nowrap border-b border-navy-200 dark:border-navy-700 ${m.align ? 'text-right' : 'text-left'}`}
                >
                  {titleize(m.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr
                key={i}
                className="odd:bg-white even:bg-navy-50/40 dark:odd:bg-transparent dark:even:bg-navy-800/30 hover:bg-brand-50/60 dark:hover:bg-navy-800/60 transition-colors"
              >
                {meta.map((m) => (
                  <td
                    key={m.key}
                    className={`px-3 py-1.5 whitespace-nowrap border-b border-navy-50 dark:border-navy-800/40 ${m.align ? 'text-right tabular-nums font-medium text-navy-800 dark:text-navy-100' : 'text-navy-700 dark:text-navy-300'}`}
                  >
                    {formatCell(r[m.key], m.numeric, m.idLike)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Inspect a result set to pick the best label + value columns for headline
// stats and the chart. Returns null when there's nothing numeric to surface.
function analyze(rows) {
  if (!rows || !rows.length) return null;
  const keys = Object.keys(rows[0]).filter((k) => rows.some((r) => r[k] != null && r[k] !== ''));
  const numericKeys = keys.filter((k) => {
    if (ID_LIKE.test(k)) return false;
    const vals = rows.map((r) => r[k]).filter((v) => v != null && v !== '');
    return vals.length > 0 && vals.every(isNumeric);
  });
  const labelKey = keys.find((k) => !numericKeys.includes(k) && !ID_LIKE.test(k))
    || keys.find((k) => !numericKeys.includes(k))
    || keys[0];
  return { keys, numericKeys, labelKey, valueKey: numericKeys[0] || null };
}

// A single headline metric card.
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900/50 px-4 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-navy-400">
        {Icon && <Icon size={12} />}
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-[20px] font-bold tabular-nums mt-1 ${accent || 'text-navy-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="text-[11px] text-navy-500 dark:text-navy-400 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

// Headline KPI cards derived from the primary numeric column.
function Insights({ rows, analysis }) {
  const { labelKey, valueKey } = analysis;
  if (!valueKey) return null;
  const nums = rows.map((r) => Number(r[valueKey])).filter(Number.isFinite);
  if (!nums.length) return null;

  if (rows.length === 1) {
    const r = rows[0];
    const subLabel = labelKey && labelKey !== valueKey ? `${titleize(labelKey)}: ${r[labelKey]}` : null;
    return (
      <div className="grid grid-cols-1">
        <StatCard
          icon={TrendingUp}
          label={titleize(valueKey)}
          value={fmtFull(r[valueKey])}
          sub={subLabel}
          accent="text-brand-600 dark:text-brand-400"
        />
      </div>
    );
  }

  const total = nums.reduce((a, b) => a + b, 0);
  const topRow = rows.reduce((best, r) => (Number(r[valueKey]) > Number(best[valueKey]) ? r : best), rows[0]);
  const valTitle = titleize(valueKey);
  const totalLabel = /^total\b/i.test(valTitle) ? valTitle : `Total ${valTitle}`;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      <StatCard icon={TrendingUp} label={totalLabel} value={fmtCompact(total)} sub={fmtFull(total)} accent="text-brand-600 dark:text-brand-400" />
      <StatCard icon={Hash} label="Records" value={rows.length.toLocaleString()} sub={`${titleize(labelKey)} breakdown`} />
      <StatCard icon={Trophy} label="Top result" value={fmtCompact(topRow[valueKey])} sub={String(topRow[labelKey])} accent="text-cyan-600 dark:text-cyan-400" />
    </div>
  );
}

// Horizontal bar chart of the top entries — only when there's a label + value
// pair and more than one row to compare. Pure CSS bars: deterministic widths,
// instant render, no chart-library scale quirks.
function InsightChart({ rows, analysis }) {
  const { labelKey, valueKey } = analysis;
  if (!valueKey || !labelKey || labelKey === valueKey || rows.length < 2) return null;
  const data = rows
    .map((r) => ({ name: r[labelKey] == null || r[labelKey] === '' ? '—' : String(r[labelKey]), value: Number(r[valueKey]) }))
    .filter((d) => Number.isFinite(d.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 0) || 1;
  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900/50 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-navy-500 dark:text-navy-300 mb-3">
        <BarChart3 size={13} /> Top {data.length} by {titleize(valueKey)}
      </div>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-3 text-[11.5px] mb-1">
              <span className="truncate text-navy-600 dark:text-navy-300">{d.name}</span>
              <span className="shrink-0 tabular-nums font-semibold text-navy-800 dark:text-navy-100">{fmtFull(d.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max((Math.abs(d.value) / max) * 100, 1.5)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// The executed SQL, tucked behind a collapsible toggle so it doesn't dominate
// the response (shown only when the user wants to inspect the query).
function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-navy-100 dark:border-navy-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-navy-500 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors"
      >
        <span className="flex items-center gap-1.5"><Code2 size={13} /> View SQL query</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <pre className="text-[11px] bg-navy-50 dark:bg-navy-900 p-3 overflow-x-auto whitespace-pre-wrap break-words text-navy-600 dark:text-navy-300 font-mono border-t border-navy-100 dark:border-navy-800">
          {sql}
        </pre>
      )}
    </div>
  );
}

// Render an AI reply: a natural-language answer, headline stats, a chart, the
// data table, and the SQL (collapsed).
function AiAnswer({ data }) {
  if (typeof data === 'string') return <span className="whitespace-pre-wrap">{data}</span>;
  const text = data?.answer ?? data?.response ?? data?.message ?? data?.text;
  const rows = Array.isArray(data?.data) ? data.data : null;
  const analysis = rows && rows.length ? analyze(rows) : null;
  const hasStructured = text != null || data?.sql || rows;
  return (
    <div className="space-y-3">
      {text != null && (
        <div className="whitespace-pre-wrap text-[13px]">{typeof text === 'string' ? text : JSON.stringify(text)}</div>
      )}
      {analysis && <Insights rows={rows} analysis={analysis} />}
      {analysis && <InsightChart rows={rows} analysis={analysis} />}
      {rows && <ResultTable rows={rows} />}
      {data?.sql && <SqlBlock sql={data.sql} />}
      {!hasStructured && (
        <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

export default function AnalyticsClient() {
  const user = useSelector(selectUser);
  // The AI query needs a provider; fall back to Zoho when the user has none.
  const platform = user?.integrationType && user.integrationType !== 'none'
    ? user.integrationType
    : 'zoho';

  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai' | 'error', text?, data? }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const data = await askAI({ platform, question: q });
      setMessages((m) => [...m, { role: 'ai', data }]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Request failed.';
      setMessages((m) => [...m, { role: 'error', text: `Sorry, I couldn't answer that. (${msg})` }]);
    } finally {
      setLoading(false);
    }
  };

  const hasChat = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 lg:px-10 py-4 border-b border-navy-100 dark:border-navy-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white grid place-items-center">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[18px] font-bold text-navy-900 dark:text-white">AI Analytics</div>
          <div className="text-[12px] text-navy-400 capitalize">Connected to {platform}</div>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
        <div className="max-w-[900px] mx-auto">
          {hasChat ? (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-brand-500 to-cyan-500 text-white px-4 py-2.5 text-[13px] leading-snug'
                        : m.role === 'error'
                          ? 'max-w-[90%] rounded-2xl rounded-bl-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-500/20 px-4 py-2.5 text-[13px] leading-snug'
                          : 'max-w-full w-full rounded-2xl rounded-bl-sm bg-navy-50 dark:bg-navy-800/50 text-navy-800 dark:text-navy-100 border border-navy-100 dark:border-navy-800 px-4 py-3 text-[13px] leading-snug'
                    }
                  >
                    {m.role === 'ai' ? <AiAnswer data={m.data} /> : m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-navy-50 dark:bg-navy-800/50 border border-navy-100 dark:border-navy-800 px-4 py-2.5 text-[13px] text-navy-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center pt-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white grid place-items-center mb-4">
                <Sparkles size={26} />
              </div>
              <h2 className="text-[20px] font-bold text-navy-900 dark:text-white mb-1">Ask Oremus AI</h2>
              <p className="text-[13px] text-navy-500 max-w-md mx-auto">
                Ask anything about your finances and get instant answers from your live data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-navy-100 dark:border-navy-800 px-6 lg:px-10 py-4">
        <div className="max-w-[900px] mx-auto flex items-center gap-2 rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your finances…"
            className="flex-1 bg-transparent text-[14px] text-navy-800 dark:text-navy-100 placeholder:text-navy-400 outline-none"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg grid place-items-center bg-gradient-to-r from-brand-500 to-cyan-500 text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
