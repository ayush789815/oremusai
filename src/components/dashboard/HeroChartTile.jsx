'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import Tile from './Tile.jsx';
import CountUpValue from './CountUpValue.jsx';
import { fmt, fmtMoneyCompact } from '../../utils/fmt.js';

// Hero series values are in thousands — multiply back to full rupees for display.
function fmtFull(v) {
  if (v == null) return '—';
  return fmt(v * 1000);
}

export default function HeroChartTile({ data = [] }) {
  const visibleData = data;

  const totalRev    = visibleData.reduce((s, d) => s + (d.rev || 0), 0);
  const totalExp    = visibleData.reduce((s, d) => s + (d.exp || 0), 0);
  const totalProfit = totalRev - totalExp;
  const latest      = visibleData[visibleData.length - 1];

  const subtitle = latest
    ? `${latest.m}: ${fmtFull(latest.rev)} rev · ${fmtFull(latest.exp)} exp · ${fmtFull(latest.rev - latest.exp)} profit`
    : 'No data for selected period';


  return (
    <Tile padding="p-0" className="row-span-2 h-full">
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-navy-500 dark:text-navy-300">
              Revenue · selected period
            </div>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <div className="text-[clamp(24px,3vw,40px)] font-bold tracking-tighter tabular-nums leading-none text-navy-900 dark:text-white">
                <CountUpValue value={fmtFull(totalRev)} />
              </div>
              {totalRev > 0 && (
                <div className={`text-[14px] font-semibold ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {totalProfit >= 0 ? '▲' : '▼'} {fmtFull(Math.abs(totalProfit))} profit
                </div>
              )}
            </div>
            <div className="text-[12px] text-navy-500 dark:text-navy-300 mt-1">{subtitle}</div>
          </div>
        </div>
      </div>

      {visibleData.length === 0 ? (
        <div className="px-6 flex items-center justify-center h-[280px] text-navy-400 text-[13px]">
          No data for selected period
        </div>
      ) : (
        <div className="px-3 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="hero-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hero-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hero-profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoneyCompact(v * 1000)} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid rgba(100,116,139,0.2)',
                  fontSize: 12,
                }}
                formatter={(v) => fmt(v * 1000)}
              />
              <Area type="monotone" dataKey="rev"    name="Revenue"  stroke="#2563EB" strokeWidth={2.5} fill="url(#hero-rev)"    />
              <Area type="monotone" dataKey="exp"    name="Expenses" stroke="#EF4444" strokeWidth={2.5} fill="url(#hero-exp)"    />
              <Area type="monotone" dataKey="profit" name="Profit"   stroke="#10B981" strokeWidth={2}   fill="url(#hero-profit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="px-6 pb-4 flex items-center gap-4 text-[11.5px] text-navy-600 dark:text-navy-300">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand-500" />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500" />Expenses</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Profit</span>
      </div>
    </Tile>
  );
}
