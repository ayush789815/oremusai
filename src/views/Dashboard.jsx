'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Download, RefreshCw, Calendar, ChevronDown, Check, TrendingUp, Sparkles,
} from 'lucide-react';
import axiosClient from '../services/axiosClient.js';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import DashboardTabs from '../components/common/DashboardTabs.jsx';
import GlobalSearch from '../components/common/GlobalSearch.jsx';
import HeroChartTile from '../components/dashboard/HeroChartTile.jsx';
import KpiTile from '../components/dashboard/KpiTile.jsx';
import KpiDetailModal from '../components/dashboard/KpiDetailModal.jsx';
import CashFlowTile from '../components/dashboard/CashFlowTile.jsx';
import ExpenseMixTile from '../components/dashboard/ExpenseMixTile.jsx';
import TopListTile from '../components/dashboard/TopListTile.jsx';
import ComplianceTile from '../components/dashboard/ComplianceTile.jsx';
import AiInsightsTile from '../components/dashboard/AiInsightsTile.jsx';
import ActivityTile from '../components/dashboard/ActivityTile.jsx';
import QuickStatTile from '../components/dashboard/QuickStatTile.jsx';
import PeriodPill from '../components/dashboard/PeriodPill.jsx';
import RevenueMetrics from '../components/metrics/RevenueMetrics.jsx';
import ProfitabilityMetrics from '../components/metrics/ProfitabilityMetrics.jsx';
import CashFlowMetrics from '../components/metrics/CashFlowMetrics.jsx';
import ExpenseMetrics from '../components/metrics/ExpenseMetrics.jsx';
import LiquidityMetrics from '../components/metrics/LiquidityMetrics.jsx';
import EfficiencyMetrics from '../components/metrics/EfficiencyMetrics.jsx';
import { loadDashboard } from '../features/dashboard/dashboardSlice.js';
import { selectActiveClient } from '../features/clients/clientsSlice.js';
import { selectUser } from '../features/auth/authSlice.js';
import {
  PERIODS,
  selectPeriodLabel, selectDateRange,
  selectPeriod, selectCustomRange,
  setPeriod, setCustomRange,
} from '../features/filters/filtersSlice.js';
import { selectZohoConnected } from '../features/zoho/zohoSlice.js';
import { cn } from '../utils/classNames.js';
import { setActiveCurrency, fmtMoneyCompact } from '../utils/fmt.js';

// ── Custom range picker ───────────────────────────────────────────────────────
function CustomRangePicker({ onClose }) {
  const dispatch    = useDispatch();
  const customRange = useSelector(selectCustomRange);
  const [pending, setPending] = useState(customRange);
  return (
    <div className="p-3 border-t border-navy-100 dark:border-navy-800">
      <div className="text-[10.5px] uppercase tracking-wider text-navy-500 font-semibold mb-2">Custom range</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="block">
          <span className="block text-[10.5px] font-semibold text-navy-500 mb-1">From</span>
          <input type="date" value={pending.from || ''} onChange={e => setPending(p => ({ ...p, from: e.target.value }))}
            className="w-full h-8 px-2 rounded-lg bg-navy-50 dark:bg-navy-800 border border-transparent focus:border-brand-400 text-[12px] outline-none text-navy-900 dark:text-white" />
        </label>
        <label className="block">
          <span className="block text-[10.5px] font-semibold text-navy-500 mb-1">To</span>
          <input type="date" value={pending.to || ''} onChange={e => setPending(p => ({ ...p, to: e.target.value }))}
            className="w-full h-8 px-2 rounded-lg bg-navy-50 dark:bg-navy-800 border border-transparent focus:border-brand-400 text-[12px] outline-none text-navy-900 dark:text-white" />
        </label>
      </div>
      <button
        onClick={() => { if (pending.from && pending.to) { dispatch(setCustomRange(pending)); onClose(); } }}
        disabled={!pending.from || !pending.to}
        className="w-full h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-[12px] font-semibold transition"
      >Apply</button>
    </div>
  );
}

// ── Period selector ───────────────────────────────────────────────────────────
function PeriodSelector() {
  const dispatch = useDispatch();
  const period   = useSelector(selectPeriod);
  const label    = useSelector(selectPeriodLabel);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const QUICK = [
    { id: '30d', label: '30d' },
    { id: '90d', label: 'Qtr' },
    { id: '1y',  label: '1Y'  },
  ];
  const isQuick = QUICK.map(p => p.id).includes(period);

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Quick pills */}
      <div className="flex items-center bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl overflow-hidden">
        <div className="flex items-center p-1 gap-0.5">
          {QUICK.map(p => (
            <PeriodPill key={p.id} active={period === p.id}
              onClick={() => { dispatch(setPeriod(p.id)); setOpen(false); }}>
              {p.label}
            </PeriodPill>
          ))}
          {!isQuick && (
            <PeriodPill active onClick={() => setOpen(o => !o)}>
              {label} <ChevronDown size={10} className="inline ml-0.5" />
            </PeriodPill>
          )}
        </div>
        <div className="w-px h-5 bg-navy-200 dark:bg-navy-700" />
        <button
          onClick={() => setOpen(o => !o)}
          className="h-9 px-2.5 text-navy-500 hover:text-navy-800 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800 transition flex items-center gap-1.5 text-[12px] font-medium"
          title="More period options"
        >
          <Calendar size={13} />
          <span className="hidden sm:inline">More</span>
          <ChevronDown size={10} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[220px] z-50 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl shadow-lift overflow-hidden animate-fadein">
          <div className="px-3 py-2 border-b border-navy-100 dark:border-navy-800 text-[10.5px] uppercase tracking-wider text-navy-500 font-semibold">Period</div>
          <ul className="py-1">
            {PERIODS.map(p => {
              const active = period === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => { dispatch(setPeriod(p.id)); if (p.id !== 'custom') setOpen(false); }}
                    className={cn('w-full flex items-center justify-between px-3 py-2 text-[12.5px] text-left transition',
                      active
                        ? 'bg-brand-50/60 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800')}
                  >
                    {p.label}
                    {active && <Check size={12} />}
                  </button>
                </li>
              );
            })}
          </ul>
          {period === 'custom' && <CustomRangePicker onClose={() => setOpen(false)} />}
        </div>
      )}
    </div>
  );
}

// ── fmt helper ────────────────────────────────────────────────────────────────
function fmtAmt(v) {
  if (v == null) return '--';
  return fmtMoneyCompact(v);
}

// ── Section tab bar ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'overview',       label: 'Overview'      },
  { id: 'revenue',        label: '01 Revenue'    },
  { id: 'profitability',  label: '02 Profit'     },
  { id: 'cashflow',       label: '03 Cash Flow'  },
  { id: 'expenses',       label: '04 Expenses'   },
  { id: 'liquidity',      label: '05 Liquidity'  },
  { id: 'efficiency',     label: '06 Efficiency' },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const dispatch      = useDispatch();
  const client        = useSelector(selectActiveClient);
  const user          = useSelector(selectUser);
  const dash          = useSelector((s) => s.dashboard);
  const periodLabel   = useSelector(selectPeriodLabel);
  const zohoConnected = useSelector(selectZohoConnected);
  const dateRange     = useSelector(selectDateRange);
  const period        = useSelector(selectPeriod);
  const customRange   = useSelector(selectCustomRange);

  const [activeSection, setActiveSection] = useState('overview');
  const [kpiModal, setKpiModal]           = useState(null); // kpi id or null
  const [syncing, setSyncing]             = useState(false);
  const [syncMsg, setSyncMsg]             = useState('');

  const sectionRefs = useRef({});

  useEffect(() => {
    dispatch(loadDashboard({ clientId: client?.id, from: dateRange.from, to: dateRange.to }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, client?.id, period, customRange.from, customRange.to]);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      await axiosClient.post('/sync/all');
      setSyncMsg('Sync started — data will refresh in a moment');
      setTimeout(() => {
        dispatch(loadDashboard({ clientId: client?.id, from: dateRange.from, to: dateRange.to }));
        setSyncMsg('');
      }, 8000);
    } catch {
      setSyncMsg('Sync failed — check your Zoho connection in Settings');
    } finally {
      setSyncing(false);
    }
  }, [syncing, dispatch, client?.id, dateRange.from, dateRange.to]);

  // Scroll to section when tab clicked
  const scrollTo = (id) => {
    setActiveSection(id);
    if (id === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rs        = dash.rawStats || {};
  setActiveCurrency(rs.currency || 'INR');
  const netProfit = (rs.totalRevenue || 0) - (rs.totalExpenses || 0);
  const firstName = (user?.name || 'there').split(' ')[0];
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <DashboardTabs />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-navy-400">Workspace</span>
            <span className="text-navy-300">·</span>
            <span className="text-[10.5px] text-navy-400">{periodLabel}</span>
            <Badge tone="green" dot>Live</Badge>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-navy-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector />
          {zohoConnected && (
            <Button variant="secondary" icon={RefreshCw} onClick={handleSync} disabled={syncing}
              className={syncing ? 'opacity-60 cursor-not-allowed' : ''}>
              {syncing ? 'Syncing…' : 'Sync'}
            </Button>
          )}
          <Button variant="secondary" icon={Download}>Export</Button>
        </div>
      </div>

      {/* Sync banner */}
      {syncMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-[12px] font-medium ${
          syncMsg.includes('failed')
            ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
        }`}>
          {syncMsg}
        </div>
      )}

      {/* ── Search + Ask Oremus AI (left)  ·  Section nav tabs (right) ───────── */}
      {/* Stacks vertically below lg; side-by-side on large screens. */}
      <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center">
        {/* Left: Search + Ask Oremus AI */}
        <div className="flex items-center gap-2 w-full min-w-0 lg:flex-1">
          <GlobalSearch className="flex-1 max-w-[420px] min-w-0" />
          <button
            type="button"
            className="h-9 pl-2.5 pr-3.5 rounded-xl text-white font-semibold text-[12.5px] flex items-center gap-2 shadow-soft hover:shadow-lift bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 transition-all whitespace-nowrap shrink-0"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 grid place-items-center shrink-0">
              <Sparkles size={11} />
            </span>
            <span className="hidden sm:inline">Ask Oremus AI</span>
          </button>
        </div>

        {/* Right: Section tabs (full-width scroll on mobile, pushed right on lg) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none w-full lg:w-auto lg:shrink-0">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={cn(
                'h-8 px-3 rounded-lg text-[12px] font-semibold whitespace-nowrap transition flex-shrink-0',
                activeSection === s.id
                  ? 'bg-brand-500 text-white shadow-soft'
                  : 'text-navy-500 hover:text-navy-800 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview bento grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Hero chart — 7 cols × 2 rows */}
        <div className="col-span-12 xl:col-span-7 xl:row-span-2">
          <HeroChartTile data={dash.revExp} />
        </div>

        {/* KPI tiles — 5 cols, 2×2 */}
        <div className="col-span-12 xl:col-span-5 grid grid-cols-2 gap-4">
          {dash.kpis.map((k) => (
            <KpiTile key={k.id} kpi={k} onClick={() => setKpiModal(k.id)} />
          ))}
        </div>

        {/* Cash flow */}
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <CashFlowTile data={dash.cashFlow} />
        </div>

        {/* Expense mix */}
        <div className="col-span-12 md:col-span-6 xl:col-span-2">
          <ExpenseMixTile data={dash.expenseMix} />
        </div>

        {/* AI insights */}
        <div className="col-span-12 xl:col-span-4 xl:row-span-2">
          <AiInsightsTile items={dash.aiInsights} />
        </div>

        {/* Top customers */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <TopListTile
            title={zohoConnected ? 'Top customers · Zoho' : 'Top customers'}
            rows={dash.topCustomers} accent="#2563EB"
            loading={dash.status === 'loading'}
          />
        </div>

        {/* Top vendors */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <TopListTile
            title={zohoConnected ? 'Top vendors · Zoho' : 'Top vendors'}
            rows={dash.topVendors} accent="#F59E0B"
            loading={dash.status === 'loading'}
          />
        </div>

        {/* Compliance */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ComplianceTile items={dash.compliances} />
        </div>

        {/* Activity */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ActivityTile items={dash.activity} />
        </div>

        {/* Quick stats row */}
        <div className="col-span-6 md:col-span-3">
          <QuickStatTile label="Invoices"
            value={rs.totalInvoices || (dash.status === 'loading' ? '…' : '0')}
            sub={rs.outstandingReceivables ? `${fmtAmt(rs.outstandingReceivables)} outstanding` : 'no outstanding'}
            accent="#06B6D4" icon="ReceiptText" />
        </div>
        <div className="col-span-6 md:col-span-3">
          <QuickStatTile label="Customers"
            value={rs.totalCustomers || (dash.status === 'loading' ? '…' : '0')}
            sub="this period" accent="#10B981" icon="Users" />
        </div>
        <div className="col-span-6 md:col-span-3">
          <QuickStatTile label="Payments In"
            value={rs.totalPayments ? fmtAmt(rs.totalPayments) : (dash.status === 'loading' ? '…' : fmtAmt(0))}
            sub="received this period" accent="#F59E0B" icon="Wallet" />
        </div>
        <div className="col-span-6 md:col-span-3">
          <QuickStatTile label="Net Profit"
            value={rs.totalRevenue != null ? fmtAmt(netProfit) : (dash.status === 'loading' ? '…' : fmtAmt(0))}
            sub="revenue − expenses"
            accent={netProfit >= 0 ? '#8B5CF6' : '#EF4444'}
            icon={netProfit >= 0 ? 'TrendingUp' : 'TrendingDown'} />
        </div>
      </div>

      {/* ── Section divider ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-navy-100 dark:bg-navy-800" />
        <div className="flex items-center gap-2 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
          <TrendingUp size={12} />
          Financial Metrics
        </div>
        <div className="flex-1 h-px bg-navy-100 dark:bg-navy-800" />
      </div>

      {/* ── Metrics sections ─────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div ref={el => sectionRefs.current['revenue'] = el} className="scroll-mt-4">
          <RevenueMetrics from={dateRange.from} to={dateRange.to} />
        </div>

        <div ref={el => sectionRefs.current['profitability'] = el} className="scroll-mt-4">
          <ProfitabilityMetrics from={dateRange.from} to={dateRange.to} />
        </div>

        <div ref={el => sectionRefs.current['cashflow'] = el} className="scroll-mt-4">
          <CashFlowMetrics from={dateRange.from} to={dateRange.to} />
        </div>

        <div ref={el => sectionRefs.current['expenses'] = el} className="scroll-mt-4">
          <ExpenseMetrics from={dateRange.from} to={dateRange.to} />
        </div>

        <div ref={el => sectionRefs.current['liquidity'] = el} className="scroll-mt-4">
          <LiquidityMetrics from={dateRange.from} to={dateRange.to} />
        </div>

        <div ref={el => sectionRefs.current['efficiency'] = el} className="scroll-mt-4">
          <EfficiencyMetrics from={dateRange.from} to={dateRange.to} />
        </div>
      </div>

      <div className="mt-6 text-center text-[11px] text-navy-300">
        Oremus AI · {periodLabel}
      </div>

      {/* ── KPI Detail Modal ─────────────────────────────────────────────────── */}
      {kpiModal && (
        <KpiDetailModal
          kpiId={kpiModal}
          from={dateRange.from}
          to={dateRange.to}
          onClose={() => setKpiModal(null)}
        />
      )}
    </div>
  );
}