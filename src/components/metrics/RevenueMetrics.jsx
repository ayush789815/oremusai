'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Receipt } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import axiosClient from '../../services/axiosClient.js';
import MetricSection, { MiniKpi, fmtINR, AXIS_STYLE, SectionSkeleton } from './MetricSection.jsx';

export default function RevenueMetrics({ from, to }) {
  const [data, setData] = useState(null);
  const [topCust, setTopCust] = useState([]);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/dashboard/profitability', { params: { from, to } }),
      axiosClient.get('/dashboard/kpi/revenue',   { params: { from, to } }),
    ]).then(([pRes, rRes]) => {
      setData(pRes.data.data);
      setTopCust(rRes.data.data?.topCustomers || []);
    }).catch(() => setData({}));
  }, [from, to]);

  if (!data) return <SectionSkeleton />;

  const growth = data.growth ?? 0;
  const revenuePerCustomer = topCust.length > 0
    ? Math.round(data.revenue / topCust.length) : 0;

  const badge = data.revenue > 0
    ? { text: `${fmtINR(data.revenue)} total`, color: '#2563EB' }
    : { text: 'No revenue data', color: '#64748b' };

  return (
    <MetricSection num={1} title="Revenue Metrics" subtitle="Top-line performance · mix · momentum" badge={badge}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniKpi label="Total Revenue"     value={data.revenue}     sub="this period"         color="#2563EB" icon={TrendingUp} />
        <MiniKpi label="Net Profit"        value={data.netProfit}   sub={`${data.netMargin ?? 0}% margin`} color="#10B981" icon={TrendingUp} />
        <MiniKpi label="Total Expenses"    value={data.expenses}    sub="this period"         color="#EF4444" icon={TrendingUp} />
        <MiniKpi label="Expense Ratio"     value={`${data.expenseRatio ?? 0}%`} sub="of revenue" color="#F59E0B" icon={Receipt} isText />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Area chart — revenue trend */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Revenue · 12 months
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend || []} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rm-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rm-exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.13} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={(v, n) => [fmtINR(v), n === 'revenue' ? 'Revenue' : 'Expenses']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                <Area dataKey="revenue"  stroke="#2563EB" strokeWidth={2} fill="url(#rm-rev)" dot={false} />
                <Area dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#rm-exp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top customers bar chart */}
        <div className="lg:col-span-2">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Revenue by Customer
          </div>
          {topCust.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-[12px] text-navy-400">No customer data</div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCust} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} />
                  <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 9 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={v => [fmtINR(v), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </MetricSection>
  );
}
