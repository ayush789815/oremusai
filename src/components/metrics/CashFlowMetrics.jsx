'use client';

import { useEffect, useState } from 'react';
import { ArrowDownLeft, Wallet, Activity } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Line, ComposedChart, Cell,
} from 'recharts';
import axiosClient from '../../services/axiosClient.js';
import MetricSection, { MiniKpi, fmtINR, fmtFull, AXIS_STYLE, SectionSkeleton } from './MetricSection.jsx';

export default function CashFlowMetrics({ from, to, basis, customer, currency }) {
  const [m, setM] = useState(null);        // /metrics/cashflow
  const [trend, setTrend] = useState([]);   // monthly inflow/outflow (unchanged endpoint)

  useEffect(() => {
    let cancelled = false;
    const params = {
      from, to,
      ...(basis ? { basis } : {}),
      ...(customer ? { customer_id: customer } : {}),
      ...(currency ? { currency_id: currency } : {}),
    };
    Promise.all([
      axiosClient.get('/metrics/cashflow', { params }),
      axiosClient.get('/dashboard/kpi/cash', { params: { from, to } }),
    ]).then(([mRes, cRes]) => {
      if (cancelled) return;
      setM(mRes.data?.data || {});
      setTrend(cRes.data?.data?.trend || []);
    }).catch(() => { if (!cancelled) { setM({}); setTrend([]); } });
    return () => { cancelled = true; };
  }, [from, to, basis, customer, currency]);

  if (!m) return <SectionSkeleton />;

  const enrichedTrend = trend.map(d => ({ ...d, net: (d.inflow || 0) - (d.outflow || 0) }));

  const ocf = m.operatingCashFlow;
  const fcf = m.freeCashFlow;
  const netChange = m.netChange ?? 0;
  const warning = (m._meta?.warnings || [])[0];

  // OCF / FCF / Net comparison (single-period; bar comparison rather than a time series).
  const compare = [
    { name: 'Operating CF', value: ocf, color: '#06B6D4' },
    { name: 'Free CF',      value: fcf, color: '#8B5CF6' },
    { name: 'Net Change',   value: netChange, color: netChange >= 0 ? '#10B981' : '#EF4444' },
  ].filter(d => d.value != null);

  const isHealthy = netChange >= 0;
  const badge = { text: isHealthy ? '● Healthy' : '● Deficit', color: isHealthy ? '#10B981' : '#EF4444', dot: false };

  return (
    <MetricSection num={3} title="Cash Flow Metrics" subtitle="Where cash comes in, where it leaves" badge={badge}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniKpi label="Operating CF" value={ocf == null ? '—' : ocf} sub={ocf == null ? 'not reported' : 'from operations'} color="#06B6D4" icon={Activity} isText={ocf == null} />
        <MiniKpi label="Free CF"      value={fcf == null ? '—' : fcf} sub={fcf == null ? 'OCF − CapEx' : 'OCF − CapEx'}     color="#8B5CF6" icon={Wallet}  isText={fcf == null} />
        <MiniKpi label="Net Change"   value={netChange} sub={isHealthy ? 'surplus' : 'deficit'} color={isHealthy ? '#10B981' : '#EF4444'} icon={Activity} />
        <MiniKpi label="Cash Inflow"  value={m.inflow == null ? '—' : m.inflow} sub={m.outflow == null ? '' : `out ${fmtINR(m.outflow)}`} color="#10B981" icon={ArrowDownLeft} isText={m.inflow == null} />
      </div>

      {warning && (
        <div className="mb-4 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          {warning}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inflow vs Outflow */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Inflow vs Outflow · Monthly
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={(v, n) => [fmtFull(v), n === 'inflow' ? 'Inflow' : n === 'outflow' ? 'Outflow' : 'Net']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.15} />
                <Bar dataKey="inflow"  fill="#10B981" radius={[2, 2, 0, 0]} opacity={0.85} />
                <Bar dataKey="outflow" fill="#EF4444" radius={[2, 2, 0, 0]} opacity={0.85} />
                <Line dataKey="net" stroke="#06B6D4" strokeWidth={2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-1.5 justify-center">
            {[['#10B981','Inflow'],['#EF4444','Outflow'],['#06B6D4','Net']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] text-navy-500">
                <div className="w-3 h-2 rounded-sm" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* OCF / FCF / Net comparison */}
        <div className="lg:col-span-2">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Operating vs Free Cash Flow
          </div>
          {compare.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-[12px] text-navy-400 text-center px-3">
              Cash flow statement unavailable for this provider
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compare} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                  <XAxis dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 9 }} interval={0} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                  <Tooltip formatter={(v, n, p) => [fmtFull(v), p?.payload?.name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.15} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {compare.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </MetricSection>
  );
}
