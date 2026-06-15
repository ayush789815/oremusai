'use client';

import * as Icons from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import Tile from './Tile.jsx';
import CountUpValue from './CountUpValue.jsx';
import { fmt } from '../../utils/fmt.js';

function fmtINR(n) {
  if (n == null || isNaN(n)) return fmt(0);
  return fmt(n);
}

export default function KpiTile({ kpi, onClick }) {
  const Icon = Icons[kpi.icon] || Icons.Activity;
  const up = (kpi.delta || 0) >= 0;
  const isInverse  = kpi.id === 'burn';
  const positive   = isInverse ? !up : up;
  const trendColor = positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  const hasDetail  = ['rev', 'cash', 'burn', 'rec'].includes(kpi.id);

  const displayValue = kpi.isText
    ? kpi.value
    : typeof kpi.value === 'number'
      ? fmtINR(kpi.value)
      : kpi.value;

  return (
    <Tile
      padding="p-4"
      onClick={hasDetail ? onClick : undefined}
      className={hasDetail ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 select-none' : ''}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-500 leading-tight">{kpi.label}</div>
        <div className="flex items-center gap-1">
          {hasDetail && (
            <ExternalLink size={10} className="text-navy-300 dark:text-navy-600 group-hover:text-navy-500" />
          )}
          <div
            className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0"
            style={{ background: kpi.color + '18', color: kpi.color }}
          >
            <Icon size={13} />
          </div>
        </div>
      </div>
      <div className="text-[clamp(15px,1.5vw,22px)] font-bold tracking-tight tabular-nums text-navy-900 dark:text-white leading-tight truncate">
        <CountUpValue value={displayValue} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-navy-500 truncate pr-2">{kpi.sub}</div>
        {kpi.delta != null && (
          <div className={`text-[11px] font-semibold whitespace-nowrap ${trendColor}`}>
            {up ? '▲' : '▼'} {Math.abs(kpi.delta).toFixed(1)}%
          </div>
        )}
      </div>
      {hasDetail && (
        <div className="mt-2 text-[9.5px] text-navy-300 dark:text-navy-600">Click for details →</div>
      )}
    </Tile>
  );
}
