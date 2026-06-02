'use client';

import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts';
import { fmtCompact } from '../../utils/fmt.js';

const PALETTE = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#22C55E'];

function dataValueColumns(data) {
  return data.columns.filter((c) => c.key !== 'label');
}

// Pick the non-aggregated rows for chart input.
function chartableRows(data) {
  return data.rows.filter((r) => r.level !== 0 && !r.isSubtotal && !r.isTotal && r.cells);
}

function toSeries(data) {
  const valueCols = dataValueColumns(data);
  const primaryKey = valueCols[0]?.key || 'cur';
  return chartableRows(data).map((r, i) => ({
    name: r.label,
    value: r.cells?.[primaryKey] ?? 0,
    fill: PALETTE[i % PALETTE.length],
    ...Object.fromEntries(valueCols.map((c) => [c.key, r.cells?.[c.key] ?? 0])),
  }));
}

const TOOLTIP = {
  contentStyle: {
    background: 'rgba(15,23,42,0.95)',
    border: 'none',
    borderRadius: 10,
    padding: '8px 10px',
    color: 'white',
    fontSize: 12,
  },
  labelStyle: { color: '#94A3B8', fontSize: 11 },
  itemStyle: { color: 'white' },
  formatter: (v) => fmtCompact(v),
};

export default function ReportChart({ kind = 'bar', data, height = 360, compact = false }) {
  const series = toSeries(data);
  const valueCols = dataValueColumns(data);

  if (kind === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={series} dataKey="value" nameKey="name" innerRadius={compact ? 25 : 60} outerRadius={compact ? 45 : 110} paddingAngle={2}>
            {series.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          {!compact && <Tooltip {...TOOLTIP} />}
          {!compact && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'line' || kind === 'area') {
    const Chart = kind === 'area' ? AreaChart : LineChart;
    const Series = kind === 'area' ? Area : Line;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          {!compact && <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" />}
          {!compact && <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />}
          {!compact && <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />}
          {!compact && <Tooltip {...TOOLTIP} />}
          {valueCols.map((c, i) => (
            <Series
              key={c.key}
              type="monotone"
              dataKey={c.key}
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={kind === 'area' ? 0.18 : 0}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    );
  }

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" />}
        {!compact && <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />}
        {!compact && <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />}
        {!compact && <Tooltip {...TOOLTIP} />}
        {valueCols.map((c, i) => (
          <Bar key={c.key} dataKey={c.key} fill={PALETTE[i % PALETTE.length]} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}