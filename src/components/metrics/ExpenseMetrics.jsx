'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, Tag, BarChart2, Percent } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import MetricSection, { MiniKpi, fmtINR, fmtFull, AXIS_STYLE, SectionSkeleton } from './MetricSection.jsx';
import { placeholderExpense } from '../../utils/metricsPlaceholder.js';

const PALETTE = ['#2563EB','#06B6D4','#8B5CF6','#10B981','#F59E0B','#EF4444','#64748B'];

export default function ExpenseMetrics({ from, to }) {
  const [profData,  setProfData]  = useState(null);
  const [burnData,  setBurnData]  = useState(null);
  const [breakdown, setBreakdown] = useState([]);

  // Demo figures driven by the selected period (see metricsPlaceholder.js).
  useEffect(() => {
    const { profData: pd, burnData: bd, breakdown: bk } = placeholderExpense(from, to);
    setProfData(pd);
    setBurnData(bd);
    setBreakdown(bk);
  }, [from, to]);

  if (!profData || !burnData) return <SectionSkeleton />;

  const totalExp     = profData.expenses  || 0;
  const avgMonthly   = burnData.avgMonthlyBurn || 0;
  const topCategory  = breakdown[0] || {};
  const expenseRatio = profData.expenseRatio || 0;

  const badge = {
    text: `Expense ratio ${expenseRatio}%`,
    color: expenseRatio < 60 ? '#10B981' : expenseRatio < 80 ? '#F59E0B' : '#EF4444',
  };

  // Build trend chart data from burn trend
  const trendData = (burnData.trend || []);

  // Top categories bar data
  const catData = breakdown.map(r => ({
    name: r.account_name?.length > 18 ? r.account_name.slice(0, 16) + '…' : r.account_name,
    fullName: r.account_name,
    value: Math.round(r.totalAmount || 0),
  }));

  return (
    <MetricSection num={4} title="Expense Metrics" subtitle="Cost structure · category mix · efficiency" badge={badge}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniKpi label="Total Expenses"  value={totalExp}     sub="this period"        color="#EF4444" icon={TrendingDown} />
        <MiniKpi label="Avg Monthly"     value={avgMonthly}   sub="12-month average"  color="#F59E0B" icon={BarChart2} />
        <MiniKpi label="Top Category"    value={topCategory.account_name || '—'} sub={fmtFull(topCategory.totalAmount)} color="#8B5CF6" icon={Tag} isText />
        <MiniKpi label="Expense Ratio"   value={`${expenseRatio}%`} sub="expenses / revenue" color={expenseRatio < 80 ? '#06B6D4' : '#EF4444'} icon={Percent} isText />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top categories horizontal bar */}
        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Top Expense Categories
          </div>
          {catData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-[12px] text-navy-400">No expense data</div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} />
                  <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v, n, p) => [fmtFull(v), p.payload.fullName]}
                    contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {catData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense trend area chart */}
        <div className="lg:col-span-2">
          <div className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-2">
            Monthly Expense Trend
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="exp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} width={55} />
                <Tooltip formatter={v => [fmtFull(v), 'Expenses']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(100,116,139,.2)', fontSize: 12 }} />
                <Area dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#exp-grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MetricSection>
  );
}