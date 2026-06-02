'use client';

import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, Activity } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Line, ComposedChart,
} from 'recharts';
import axiosClient from '../../services/axiosClient.js';
import MetricSection, { MiniKpi, fmtINR, AXIS_STYLE, SectionSkeleton } from './MetricSection.jsx';

export default function CashFlowMetrics({ from, to }) {
  const [cashData,  setCashData]  = useState(null);
  const [mainStats, setMainStats] = useState(null);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/dashboard/kpi/cash', { params: { from, to } }),
      axiosClient.get('/dashboard', { params: { from, to } }),
    ]).then(([cRes, mRes]) => {
      setCashData(cRes.data.data);
      setMainStats(mRes.data.data);
    }).catch(() => { setCashData({}); setMainStats({}); });
  }, [from, to]);

  if (!cashData || !mainStats) return <SectionSkeleton />;

  const trend    = cashData.trend || [];
  const totalIn  = trend.reduce((s, d) => s + (d.inflow  || 0), 0);
  const totalOut = trend.reduce((s, d) => s + (d.outflow || 0), 0);
  const netFlow  = totalIn - totalOut;

  // Add net to each month for the line
  const enrichedTrend = trend.map(d => ({
    ...d,
    net: (d.inflow || 0) - (d.outflow || 0),
  }));

  const isHealthy = netFlow >= 0;
  const badge = {
    text: isHealthy ? '● Healthy' : '● Deficit',
    color: isHealthy ? '#10B981' : '#EF4444',
    dot: false,
  };

  return (
    <MetricSection num={3} title="Cash Flow Metrics" subtitle="Where cash comes in, where it leaves" badge={badge}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniKpi label="Total Inflow"    value={totalIn}               sub="money received"       color="#10B981" icon={ArrowDownLeft} />
        <MiniKpi label="Total Outflow"   value={totalOut}              sub="money paid out"        color="#EF4444" icon={ArrowUpRight} />
        <MiniKpi label="Net Cash Flow"   value={netFlow}               sub={netFlow >= 0 ? 'surplus' : 'deficit'}  color={netFlow >= 0 ? '#06B6D4' : '#EF4444'} icon={Activity} />
        <MiniKpi label="Cash on Hand"    value={mainStats.cashOnHand}  sub={`${mainStats.bankCount || 0} bank${mainStats.bankCount !== 1 ? 's' : ''}`} color="#8B5CF6" icon={Wallet} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inflow vs Outflow bar + net line */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Inflow vs Outflow · Monthly
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={(v, n) => [fmtINR(v), n === 'inflow' ? 'Inflow' : n === 'outflow' ? 'Outflow' : 'Net']}
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

        {/* Cash position area chart */}
        <div className="lg:col-span-2">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Cumulative Cash Position
          </div>
          <div className="h-[180px]">
            {(() => {
              // Build cumulative from net
              let running = 0;
              const cumData = enrichedTrend.map(d => {
                running += (d.net || 0);
                return { month: d.month, cashPosition: running };
              });
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cf-pos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                    <Tooltip formatter={v => [fmtINR(v), 'Cash Position']}
                      contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                    <Area dataKey="cashPosition" stroke="#8B5CF6" strokeWidth={2} fill="url(#cf-pos)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      </div>
    </MetricSection>
  );
}