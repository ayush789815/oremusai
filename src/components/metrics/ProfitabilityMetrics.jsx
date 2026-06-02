'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Percent } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import axiosClient from '../../services/axiosClient.js';
import MetricSection, { MiniKpi, fmtINR, AXIS_STYLE, SectionSkeleton } from './MetricSection.jsx';

export default function ProfitabilityMetrics({ from, to }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/profitability', { params: { from, to } })
      .then(r => setData(r.data.data))
      .catch(() => setData({}));
  }, [from, to]);

  if (!data) return <SectionSkeleton />;

  const netMargin  = data.netMargin  ?? 0;
  const netProfit  = data.netProfit  ?? 0;
  const expRatio   = data.expenseRatio ?? 0;

  const badge = {
    text: netMargin > 0 ? `Net margin ${netMargin}%` : 'Margin data',
    color: netMargin > 15 ? '#10B981' : netMargin > 0 ? '#F59E0B' : '#EF4444',
  };

  // Build waterfall data for P&L
  const waterfallData = [
    { name: 'Revenue',   value: data.revenue,  fill: '#2563EB', cumulative: data.revenue },
    { name: 'Expenses',  value: -(data.expenses), fill: '#EF4444', cumulative: data.revenue - data.expenses },
    { name: 'Net Profit',value: data.netProfit, fill: netProfit >= 0 ? '#10B981' : '#EF4444', cumulative: data.netProfit, isFinal: true },
  ];

  return (
    <MetricSection num={2} title="Profitability Metrics" subtitle="Margins at every layer of the P&L" badge={badge}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniKpi label="Total Revenue"  value={data.revenue}   sub="this period"          color="#2563EB" icon={TrendingUp} />
        <MiniKpi label="Total Expenses" value={data.expenses}  sub="this period"          color="#EF4444" icon={TrendingDown} />
        <MiniKpi label="Net Profit"     value={data.netProfit} sub={`${netMargin}% margin`} color={netProfit >= 0 ? '#10B981' : '#EF4444'} icon={netProfit >= 0 ? TrendingUp : TrendingDown} />
        <MiniKpi label="Expense Ratio"  value={`${expRatio}%`} sub="expenses / revenue"  color="#F59E0B" icon={Percent} isText />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Margin trend */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Net Profit Trend · 12 months
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend || []} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={(v, n) => [fmtINR(v), n === 'revenue' ? 'Revenue' : n === 'expenses' ? 'Expenses' : 'Net Profit']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />
                <Line dataKey="revenue"   stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line dataKey="expenses"  stroke="#EF4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line dataKey="netProfit" stroke="#10B981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-1.5 justify-center">
            {[['#2563EB','Revenue'],['#EF4444','Expenses'],['#10B981','Net Profit']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] text-navy-500">
                <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* P&L summary waterfall */}
        <div className="lg:col-span-2">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            P&amp;L Summary
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Revenue',   value: data.revenue,          color: '#2563EB' },
              { label: '− Expenses',value: -(data.expenses),      color: '#EF4444' },
              { label: 'Net Profit',value: data.netProfit,         color: netProfit >= 0 ? '#10B981' : '#EF4444', bold: true },
            ].map((row, i) => {
              const maxAbs = Math.max(Math.abs(data.revenue), 1);
              const pct    = Math.min(100, (Math.abs(row.value) / maxAbs) * 100);
              return (
                <div key={i} className={row.bold ? 'pt-2 border-t border-navy-100 dark:border-navy-800' : ''}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className={`${row.bold ? 'font-bold text-navy-900 dark:text-white' : 'text-navy-600 dark:text-navy-300'}`}>{row.label}</span>
                    <span className="font-bold" style={{ color: row.color }}>{fmtINR(row.value)}</span>
                  </div>
                  {!row.bold && (
                    <div className="h-1.5 rounded-full bg-navy-100 dark:bg-navy-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MetricSection>
  );
}