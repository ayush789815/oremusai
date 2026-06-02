'use client';

import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, YAxis } from 'recharts';

export default function Sparkline({ data, color = '#2563EB', height = 36, fill = true }) {
  const id = useId().replace(/:/g, '');
  const Chart = fill ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        {fill ? (
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${id})`} dot={false} />
        ) : (
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}