'use client';

/**
 * Ratios — Financial benchmark dashboard.
 * Matches the reference layout: 2-column grid of semicircle gauges.
 * Each gauge shows the ratio value, a health-colour fill, benchmark ticks,
 * the formula, and interpretation bullets.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Info } from 'lucide-react';
import GaugeChart from '../components/ratios/GaugeChart.jsx';
import PeriodFilter from '../components/common/PeriodFilter.jsx';
import DashboardTabs from '../components/common/DashboardTabs.jsx';
import axiosClient from '../services/axiosClient.js';
import {
  selectPeriodLabel,
  selectDateRange,
  selectPeriod,
  selectCustomRange,
} from '../features/filters/filtersSlice.js';

// ── Colour helpers ────────────────────────────────────────────────────────────
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const RED   = '#EF4444';
const GRAY  = '#94A3B8';

function colorHigher(good, warn) {
  return (v) => {
    if (v == null || !isFinite(v)) return GRAY;
    if (v >= good) return GREEN;
    if (v >= warn) return AMBER;
    return RED;
  };
}
function colorLower(good, warn) {
  return (v) => {
    if (v == null || !isFinite(v)) return GRAY;
    if (v <= good) return GREEN;
    if (v <= warn) return AMBER;
    return RED;
  };
}
function colorAboveZero(v) {
  if (v == null || !isFinite(v)) return GRAY;
  return v >= 0 ? GREEN : RED;
}

// ── Formatters ────────────────────────────────────────────────────────────────
const pct  = (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`);
const pctA = (v) => `${v}%`;
const ratio= (v) => (v == null ? 'N/A' : v.toFixed(1));
const days = (v) => (v == null ? 'N/A' : `${v.toFixed(1)}d`);
const daysA= (v) => `${v}`;
const wc   = (v) => {
  if (v == null) return 'N/A';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000)    return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000)      return `${sign}₹${(abs / 1_000).toFixed(0)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
};
const wcA  = (v) => {
  const abs = Math.abs(v);
  if (abs >= 100_000) return `${v < 0 ? '-' : ''}₹${(abs / 100_000).toFixed(0)}L`;
  if (abs >= 1_000)   return `${v < 0 ? '-' : ''}₹${(abs / 1_000).toFixed(0)}k`;
  return `₹${v}`;
};

// ── Ratio config factory ──────────────────────────────────────────────────────
// Each entry drives one GaugeChart card.
function buildConfigs(data) {
  if (!data) return [];

  // Dynamically compute working capital gauge range based on actual value
  const wcVal = data.workingCapital;
  const wcMax = wcVal != null ? Math.max(Math.abs(wcVal) * 1.5, 1_000_000) : 5_000_000;
  const wcMin = -wcMax;

  return [
    // ── Row 1 ─────────────────────────────────────────────────────────────────
    {
      key: 'grossProfitMargin',
      label: 'Gross profit margin',
      value: data.grossProfitMargin,
      min: -100, max: 100,
      benchmarks: [{ value: 20, label: '20%' }, { value: 50, label: '50%' }],
      color: colorHigher(50, 20)(data.grossProfitMargin),
      fmt: pct, fmtAxis: pctA,
      formula: '(Net sales – COGS) / Net sales',
      note: '* Approximated as Net Profit Margin — COGS not tracked separately',
      interpretations: [
        '> 50%: hugely profitable business',
        '< 20%: hard to become profitable',
        'Possible issue in the business model',
      ],
    },
    {
      key: 'netProfitMargin',
      label: 'Net profit margin',
      value: data.netProfitMargin,
      min: -100, max: 100,
      benchmarks: [{ value: 3, label: '3%' }, { value: 10, label: '10%' }],
      color: colorHigher(10, 3)(data.netProfitMargin),
      fmt: pct, fmtAxis: pctA,
      formula: 'Net income / Net sales',
      interpretations: [
        '< 3%: not efficient',
        '> 10%: very efficient',
        'Possible issue in cost structure',
      ],
    },

    // ── Row 2 ─────────────────────────────────────────────────────────────────
    {
      key: 'operatingMargin',
      label: 'Operating margin',
      value: data.operatingMargin,
      min: -100, max: 100,
      benchmarks: [{ value: 5, label: '5%' }, { value: 10, label: '10%' }],
      color: colorHigher(10, 5)(data.operatingMargin),
      fmt: pct, fmtAxis: pctA,
      formula: 'EBIT / Net sales',
      note: '* Approximated from available expense data',
      interpretations: [
        '< 5%: not efficient at operating business',
        '> 10%: very efficient at operating business',
        'Possible issue in COGS (Cost of Goods Sold)',
      ],
    },
    {
      key: 'debtToEquity',
      label: 'Debt-to-equity',
      value: data.debtToEquity,
      min: 0, max: 10,
      benchmarks: [{ value: 2.5, label: '2.5' }, { value: 5, label: '5' }],
      color: data.debtToEquity != null ? colorLower(2.5, 5)(data.debtToEquity) : GRAY,
      fmt: ratio, fmtAxis: ratio,
      formula: 'Total liabilities / Equity',
      note: '* Requires balance sheet sync — not yet available',
      interpretations: [
        '< 2.5: mature and stable company',
        '> 5: company may be overleveraged',
        'Possible issue in debt management',
      ],
    },

    // ── Row 3 ─────────────────────────────────────────────────────────────────
    {
      key: 'currentRatio',
      label: 'Current ratio',
      value: data.currentRatio,
      min: 0, max: 10,
      benchmarks: [{ value: 1, label: '1' }, { value: 1.5, label: '1.5' }],
      color: colorHigher(1.5, 1)(data.currentRatio),
      fmt: ratio, fmtAxis: ratio,
      formula: 'Current assets / Current liabilities',
      note: '* Approximated: Receivables / Payables',
      interpretations: [
        '> 1.5: strong financial performance',
        '< 1: weak financial performance',
        'Possible issue with asset distribution and cash availability',
      ],
    },
    {
      key: 'cashFlowRatio',
      label: 'Cash flow ratio',
      value: data.cashFlowRatio,
      min: -2, max: 12,
      benchmarks: [{ value: 0.8, label: '0.8' }, { value: 1, label: '1' }],
      color: colorHigher(1, 0.8)(data.cashFlowRatio),
      fmt: ratio, fmtAxis: ratio,
      formula: 'Cash flow / Current liabilities',
      interpretations: [
        '> 1: income all covered by cash flow',
        '< 0.8: income may not cover obligations',
        'Indicates number of times cash covers liabilities',
      ],
    },

    // ── Row 4 ─────────────────────────────────────────────────────────────────
    {
      key: 'workingCapital',
      label: 'Working capital',
      value: data.workingCapital,
      min: wcMin, max: wcMax,
      benchmarks: [{ value: 0, label: '0' }],
      color: colorAboveZero(data.workingCapital),
      fmt: wc, fmtAxis: wcA,
      formula: 'Current assets – Current liabilities',
      note: '* Approximated: Receivables − Payables',
      interpretations: [
        '> 0: company can meet financial obligations at any time',
        '< 0: company might not be able to meet obligations',
        'Possible issues in cash availability at short term',
      ],
    },
    {
      key: 'quickRatio',
      label: 'Quick ratio',
      value: data.quickRatio,
      min: 0, max: 5,
      benchmarks: [{ value: 0.7, label: '0.7' }, { value: 1, label: '1' }],
      color: colorHigher(1, 0.7)(data.quickRatio),
      fmt: ratio, fmtAxis: ratio,
      formula: 'Quick assets / Current liabilities',
      note: '* Approximated: Receivables / Payables (no inventory data)',
      interpretations: [
        '> 1: company is sufficiently liquid',
        '< 0.7: company may face liquidity issues',
        'Possible issue in short-term obligation coverage',
      ],
    },

    // ── Row 5 ─────────────────────────────────────────────────────────────────
    {
      key: 'averageDebtorDays',
      label: 'Average debtor days',
      value: data.averageDebtorDays,
      min: 0, max: 180,
      benchmarks: [{ value: 45, label: '45' }, { value: 60, label: '60' }],
      color: colorLower(45, 60)(data.averageDebtorDays),
      fmt: days, fmtAxis: daysA,
      formula: 'Outstanding receivables / Net sales × 365',
      interpretations: [
        '< 45: company gets paid for sales quickly',
        '> 60: company might not get paid quickly enough',
        'Possible issue in payment terms with clients',
        'Very dependent on the sector',
      ],
    },
    {
      key: 'averagePayableDays',
      label: 'Average payable days',
      value: data.averagePayableDays,
      min: 0, max: 200,
      benchmarks: [{ value: 45, label: '45' }, { value: 70, label: '70' }],
      color: colorLower(45, 70)(data.averagePayableDays),
      fmt: days, fmtAxis: daysA,
      formula: 'Outstanding payables / Total purchases × 365',
      interpretations: [
        '< 45: company pays vendors quickly',
        '> 70: company takes long to pay vendors',
        'Possible issue in supplier payment management',
        'Best if compared with competitors',
      ],
    },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Ratios() {
  const periodLabel = useSelector(selectPeriodLabel);
  const dateRange   = useSelector(selectDateRange);
  const period      = useSelector(selectPeriod);
  const customRange = useSelector(selectCustomRange);

  const [ratios,  setRatios]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get('/ratios', {
        params: { from: dateRange.from, to: dateRange.to },
      });
      setRatios(data.data);
    } catch (e) {
      setError(e.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => { load(); }, [period, customRange.from, customRange.to]);  // eslint-disable-line

  const configs = buildConfigs(ratios);

  return (
    <div className="p-6 lg:p-7 max-w-[1400px] mx-auto">
      {/* Tab bar — shared with Overview */}
      <DashboardTabs />

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-navy-500">
              Financial Ratios
            </span>
            <span className="text-navy-300">·</span>
            <span className="text-[10.5px] text-navy-500">{periodLabel}</span>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-navy-900 dark:text-white">
            Benchmark Dashboard
          </h1>
          <p className="text-[12px] text-navy-500 mt-0.5">
            Key financial ratios computed from your synced Zoho Books data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodFilter />
          <button
            onClick={load}
            disabled={loading}
            className="h-9 px-3.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-300 text-[12px] font-medium flex items-center gap-1.5 hover:bg-navy-50 dark:hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 mb-5 text-[11px] text-navy-500 dark:text-navy-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: GREEN }} />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: AMBER }} />
          <span>Needs attention</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: RED }} />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: GRAY }} />
          <span>No data</span>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[12px]">
          {error}
        </div>
      )}

      {/* ── Skeleton / Grid ── */}
      {loading && !ratios ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-navy-100 dark:bg-navy-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {configs.map((cfg) => (
            <div key={cfg.key} className="relative">
              <GaugeChart
                value={cfg.value}
                min={cfg.min}
                max={cfg.max}
                benchmarks={cfg.benchmarks}
                color={cfg.color}
                fmt={cfg.fmt}
                fmtAxis={cfg.fmtAxis}
                label={cfg.label}
                formula={cfg.formula}
                interpretations={cfg.interpretations}
              />
              {/* Approximation notice */}
              {cfg.note && (
                <div className="mt-1 flex items-start gap-1 px-1">
                  <Info size={10} className="text-navy-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-navy-400 dark:text-navy-500 leading-snug">
                    {cfg.note}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 text-center text-[11px] text-navy-400">
        Benchmark Dashboard · {periodLabel} · Data from Zoho Books sync
      </div>
    </div>
  );
}