'use client';

import { useEffect, useState } from 'react';
import { Shield, Zap, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import axiosClient from '../../services/axiosClient.js';
import MetricSection, { fmtINR, SectionSkeleton } from './MetricSection.jsx';

function RatioGauge({ value, label, healthy, warning = 1, color }) {
  const pct = Math.min(100, (value / (healthy * 2)) * 100);
  const isGood    = value >= healthy;
  const isWarning = value >= warning && value < healthy;
  const dotColor  = isGood ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
  const statusTxt = isGood ? 'Healthy' : isWarning ? 'Warning' : 'Critical';

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-3.5 bg-navy-50/50 dark:bg-navy-800/50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-500">{label}</div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: dotColor + '20', color: dotColor }}>
          {statusTxt}
        </span>
      </div>
      <div className="text-[26px] font-bold text-navy-900 dark:text-white tabular-nums mb-2">{value}×</div>
      {/* Gauge bar */}
      <div className="h-2 rounded-full bg-navy-100 dark:bg-navy-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: dotColor }} />
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-navy-400">
        <span>0</span>
        <span>Safe ≥ {healthy}</span>
        <span>{healthy * 2}×</span>
      </div>
    </div>
  );
}

export default function LiquidityMetrics({ from, to }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/liquidity', { params: { from, to } })
      .then(r => setData(r.data.data))
      .catch(() => setData({}));
  }, [from, to]);

  if (!data) return <SectionSkeleton />;

  const currentRatio = data.currentRatio ?? 0;
  const quickRatio   = data.quickRatio   ?? 0;
  const isAbove = currentRatio >= 1.5 && quickRatio >= 1.0;
  const badge = {
    text: isAbove ? '● Above thresholds' : currentRatio >= 1 ? '● Borderline' : '● Below thresholds',
    color: isAbove ? '#10B981' : currentRatio >= 1 ? '#F59E0B' : '#EF4444',
  };

  // Balance chart data
  const balanceData = [
    { name: 'Cash',       value: data.cash        || 0, fill: '#8B5CF6' },
    { name: 'Receivables',value: data.receivables || 0, fill: '#10B981' },
    { name: 'Payables',   value: data.payables    || 0, fill: '#EF4444' },
    { name: 'Working Cap',value: Math.max(0, data.workingCapital || 0), fill: '#2563EB' },
  ];

  return (
    <MetricSection num={5} title="Liquidity Metrics" subtitle="Short-term solvency · ability to pay obligations" badge={badge}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: ratios */}
        <div className="lg:col-span-2 space-y-3">
          <RatioGauge label="Current Ratio"     value={currentRatio} healthy={1.5} warning={1.0} color="#2563EB" />
          <RatioGauge label="Quick Ratio"       value={quickRatio}   healthy={1.0} warning={0.7} color="#06B6D4" />
          {/* Working capital */}
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-3.5 bg-navy-50/50 dark:bg-navy-800/50">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-500 mb-2">Working Capital</div>
            <div className={`text-[22px] font-bold tabular-nums ${(data.workingCapital || 0) >= 0 ? 'text-navy-900 dark:text-white' : 'text-red-500'}`}>
              {fmtINR(data.workingCapital || 0)}
            </div>
            <div className="text-[10.5px] text-navy-400 mt-1">current assets − liabilities</div>
          </div>
        </div>

        {/* Right: balance chart */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-3">
            Balance Sheet Snapshot
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={(v, n, p) => [fmtINR(v), p.payload.name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {balanceData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: 'Current Assets',      value: fmtINR(data.currentAssets),      color: '#10B981' },
              { label: 'Current Liabilities', value: fmtINR(data.currentLiabilities), color: '#EF4444' },
              { label: 'Cash on Hand',        value: fmtINR(data.cash),               color: '#8B5CF6' },
              { label: 'Total Assets',        value: fmtINR(data.totalAssets),        color: '#2563EB' },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-navy-50 dark:bg-navy-800 px-3 py-2">
                <div className="text-[9.5px] uppercase tracking-widest text-navy-400">{item.label}</div>
                <div className="text-[13px] font-bold mt-0.5" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MetricSection>
  );
}