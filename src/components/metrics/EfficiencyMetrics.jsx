'use client';

import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Calendar, BarChart2 } from 'lucide-react';
import MetricSection, { fmtFull, SectionSkeleton } from './MetricSection.jsx';
import { placeholderEfficiency } from '../../utils/metricsPlaceholder.js';

function EfficiencyCard({ label, value, unit, sub, target, industry, color, icon: Icon }) {
  const numVal   = parseFloat(value) || 0;
  const maxScale = industry != null ? industry * 1.5 : target != null ? target * 2 : numVal * 1.5 || 100;
  const pct      = Math.min(100, (numVal / maxScale) * 100);
  // For days: lower is better; for turnover: higher is better
  const lowerBetter = unit === 'days';
  const isGood = lowerBetter
    ? (target ? numVal <= target : true)
    : (industry ? numVal >= industry : true);

  const dotColor = isGood ? '#10B981' : '#F59E0B';

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-800/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-500 mb-0.5">{label}</div>
          {sub && <div className="text-[10px] text-navy-400">{sub}</div>}
        </div>
        {Icon && (
          <div className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0"
            style={{ background: (color || '#2563EB') + '18', color: color || '#2563EB' }}>
            <Icon size={13} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-[28px] font-bold text-navy-900 dark:text-white tabular-nums">{numVal}</span>
        <span className="text-[13px] font-semibold text-navy-400">{unit}</span>
      </div>
      {/* Gauge */}
      <div className="h-2 rounded-full bg-navy-100 dark:bg-navy-700 overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: dotColor }} />
      </div>
      <div className="flex justify-between text-[9.5px] text-navy-400">
        <span>0</span>
        {target != null && <span className="text-amber-500">target {target}{unit}</span>}
        {industry != null && <span className="text-brand-500">industry {industry}{unit}</span>}
        <span>{Math.round(maxScale)}{unit}</span>
      </div>
    </div>
  );
}

export default function EfficiencyMetrics({ from, to }) {
  const [data, setData] = useState(null);

  // Demo figures driven by the selected period (see metricsPlaceholder.js).
  useEffect(() => {
    setData(placeholderEfficiency(from, to));
  }, [from, to]);

  if (!data) return <SectionSkeleton />;

  const badge = {
    text: `${(data.arDays || 0)} days AR · ${(data.apDays || 0)} days AP`,
    color: '#06B6D4',
  };

  return (
    <MetricSection num={6} title="Efficiency Metrics" subtitle="How well the business converts assets into revenue" badge={badge}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <EfficiencyCard
          label="AR Days"
          value={data.arDays   || 0}
          unit="days"
          sub="collect receivables"
          target={35}
          color="#10B981"
          icon={Clock}
        />
        <EfficiencyCard
          label="AP Days"
          value={data.apDays   || 0}
          unit="days"
          sub="pay vendors"
          target={30}
          color="#F59E0B"
          icon={Calendar}
        />
        <EfficiencyCard
          label="Asset Turnover"
          value={data.assetTurnover || 0}
          unit="×"
          sub="revenue / total assets"
          industry={1.2}
          color="#2563EB"
          icon={RefreshCw}
        />
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-800/50 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-500 mb-0.5">Total Assets</div>
              <div className="text-[10px] text-navy-400">balance sheet</div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/20 grid place-items-center">
              <BarChart2 size={13} className="text-violet-500" />
            </div>
          </div>
          <div className="text-[clamp(15px,1.6vw,21px)] font-bold text-navy-900 dark:text-white tabular-nums truncate">{fmtFull(data.totalAssets)}</div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[10.5px]">
              <span className="text-navy-500">Receivables</span>
              <span className="font-semibold text-emerald-600">{fmtFull(data.receivables)}</span>
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span className="text-navy-500">Payables</span>
              <span className="font-semibold text-red-500">{fmtFull(data.payables)}</span>
            </div>
            <div className="flex justify-between text-[10.5px] pt-1 border-t border-navy-100 dark:border-navy-700">
              <span className="text-navy-500">Revenue</span>
              <span className="font-semibold text-brand-600">{fmtFull(data.revenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insight callout */}
      {data.arDays > 0 && data.apDays > 0 && (
        <div className={`rounded-xl p-3.5 text-[12px] border ${
          data.arDays <= data.apDays
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300'
        }`}>
          {data.arDays <= data.apDays
            ? `✓ Cash cycle is positive — you collect in ${data.arDays}d but pay suppliers in ${data.apDays}d, giving you a ${data.apDays - data.arDays}d float.`
            : `⚠ Cash cycle gap — you collect in ${data.arDays}d but pay suppliers in ${data.apDays}d. Aim to reduce AR below AP days.`
          }
        </div>
      )}
    </MetricSection>
  );
}