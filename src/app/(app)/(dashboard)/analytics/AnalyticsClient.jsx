'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { selectUser } from '@/features/auth/authSlice.js';
import { askAI } from '@/services/aiClient.js';

const MAX_TABLE_ROWS = 50;

// Renders a SELECT result set returned by /query as a compact, scrollable table.
function ResultTable({ rows }) {
  if (!rows.length) return <div className="text-[12px] text-navy-500">No rows returned.</div>;
  // Show only columns that have at least one value (SELECT * yields many nulls).
  const keys = Object.keys(rows[0]).filter((k) =>
    rows.some((r) => r[k] !== null && r[k] !== '' && r[k] !== undefined));
  const shown = rows.slice(0, MAX_TABLE_ROWS);
  return (
    <div>
      <div className="text-[11px] text-navy-500 mb-1">
        {rows.length} row{rows.length === 1 ? '' : 's'}
        {rows.length > shown.length ? ` · showing first ${shown.length}` : ''}
      </div>
      <div className="overflow-auto max-h-[420px] rounded-md border border-navy-100 dark:border-navy-800">
        <table className="text-[11px] border-collapse">
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k} className="sticky top-0 bg-navy-50 dark:bg-navy-900 px-2.5 py-1.5 text-left font-semibold text-navy-500 dark:text-navy-300 whitespace-nowrap border-b border-navy-100 dark:border-navy-800">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-b border-navy-50 dark:border-navy-800/40">
                {keys.map((k) => (
                  <td key={k} className="px-2.5 py-1 whitespace-nowrap text-navy-700 dark:text-navy-300">
                    {r[k] == null ? '' : String(r[k])}
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

// Render an AI reply: a natural-language answer, the executed SQL, and/or a data table.
function AiAnswer({ data }) {
  if (typeof data === 'string') return <span className="whitespace-pre-wrap">{data}</span>;
  const text = data?.answer ?? data?.response ?? data?.message ?? data?.text;
  const rows = Array.isArray(data?.data) ? data.data : null;
  const hasStructured = text != null || data?.sql || rows;
  return (
    <div className="space-y-2.5">
      {text != null && (
        <div className="whitespace-pre-wrap">{typeof text === 'string' ? text : JSON.stringify(text)}</div>
      )}
      {data?.sql && (
        <pre className="text-[11px] bg-navy-100/70 dark:bg-navy-900 rounded-md p-2.5 overflow-x-auto whitespace-pre-wrap break-words text-navy-600 dark:text-navy-300 font-mono">
          {data.sql}
        </pre>
      )}
      {rows && <ResultTable rows={rows} />}
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
