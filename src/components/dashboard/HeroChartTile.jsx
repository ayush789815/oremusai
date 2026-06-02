'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import Tile from './Tile.jsx';
import { currencySymbol, getActiveCurrency } from '../../utils/fmt.js';

function fmtK(v) {
  if (v == null) return '—';
  const sym = currencySymbol(getActiveCurrency());
  return v >= 0 ? `${sym}${v}k` : `-${sym}${Math.abs(v)}k`;
}

export default function HeroChartTile({ data = [] }) {
  const visibleData = data;
  const sym         = currencySymbol(getActiveCurrency());

  const totalRev    = visibleData.reduce((s, d) => s + (d.rev || 0), 0);
  const totalExp    = visibleData.reduce((s, d) => s + (d.exp || 0), 0);
  const totalProfit = totalRev - totalExp;
  const latest      = visibleData[visibleData.length - 1];

  const subtitle = latest
    ? `${latest.m}: ${fmtK(latest.rev)} rev · ${fmtK(latest.exp)} exp · ${fmtK(latest.rev - latest.exp)} profit`
    : 'No data for selected period';


  return (
    <Tile dark padding="p-0" className="row-span-2 h-full">
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-navy-300">
              Revenue · selected period
            </div>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <div className="text-[42px] font-bold tracking-tighter tabular-nums leading-none">
                {fmtK(totalRev)}
              </div>
              {totalRev > 0 && (
                <div className={`text-[14px] font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalProfit >= 0 ? '▲' : '▼'} {fmtK(Math.abs(totalProfit))} profit
                </div>
              )}
            </div>
            <div className="text-[12px] text-navy-300 mt-1">{subtitle}</div>
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
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hero-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hero-profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="white" strokeOpacity={0.07} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}k`} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 12,
                  background: 'rgba(15,23,42,0.96)',
                  color: '#fff',
                }}
                formatter={(v) => `${sym}${v}k`}
              />
              <Area type="monotone" dataKey="rev"    name="Revenue"  stroke="#60A5FA" strokeWidth={2.5} fill="url(#hero-rev)"    />
              <Area type="monotone" dataKey="exp"    name="Expenses" stroke="#FB7185" strokeWidth={2.5} fill="url(#hero-exp)"    />
              <Area type="monotone" dataKey="profit" name="Profit"   stroke="#34D399" strokeWidth={2}   fill="url(#hero-profit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="px-6 pb-4 flex items-center gap-4 text-[11.5px]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-400" />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-400" />Expenses</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Profit</span>
      </div>
    </Tile>
  );
}
