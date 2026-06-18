'use client';

// Page bodies for the QuickBooks Reports sub-nav. The layout file imports
// the right body based on the active sub-nav item.
//
//  - QBStandardPage         → accordion list of every standard report
//  - QBCustomPage           → user-saved customizations
//  - QBManagementPage       → bundles of reports run together
//  - QBFinancialPlanningPage → cash flow overview + planner

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, ChevronDown, ChevronRight, Star, MoreHorizontal,
  PenSquare, FileBarChart, Mail, Printer, Download, Plus, Play,
  Copy, Archive, ArrowRight, TrendingUp, TrendingDown, Wallet, BarChart3,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  selectReportsByCategory, selectCategories, selectFavorites,
  selectQuery, selectShowFavoritesOnly, selectRecentRuns,
  selectCustomReports,
  setQuery, toggleFavorite, openReport, setShowFavoritesOnly,
  archiveItem, deleteSaved,
} from '../../../features/reports/reportsSlice.js';
import {
  MANAGEMENT_PACKS, CASH_FLOW_OVERVIEW, CASH_FLOW_SCENARIOS,
} from '../../../features/reports/data/savedReports.js';
import { fmt } from '../../../utils/fmt.js';
import { cn } from '../../../utils/classNames.js';

// =====================================================================
// Shared row + favorites accordion (used by Standard page)
// =====================================================================

function relativeTime(iso) {
  if (!iso) return 'Never run';
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

function ReportRow({ report, favorited, lastRun, onOpen, onToggleFavorite }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group grid grid-cols-[28px_1fr_140px_36px] items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-50/60 dark:hover:bg-emerald-500/[0.06]">
      <button
        type="button"
        onClick={() => onToggleFavorite(report.name)}
        className={cn(
          'h-7 w-7 grid place-items-center rounded-md transition',
          favorited ? 'text-amber-500' : 'text-navy-300 hover:text-amber-500',
        )}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={15} fill={favorited ? 'currentColor' : 'none'} />
      </button>
      <button type="button" onClick={() => onOpen(report)} className="text-left min-w-0">
        <div className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline truncate">
          {report.name}
        </div>
        <div className="text-[11.5px] text-navy-500 dark:text-navy-400 truncate">{report.desc}</div>
      </button>
      <div className="text-right text-[11.5px] text-navy-500 dark:text-navy-400">
        {lastRun ? `Last run · ${relativeTime(lastRun)}` : 'Not run yet'}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="h-7 w-7 grid place-items-center rounded-md text-navy-400 hover:text-navy-700 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800"
          aria-label="Row actions"
        >
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-44 z-20 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg shadow-lift py-1 text-[12.5px]"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button type="button" onClick={() => { setMenuOpen(false); onOpen(report); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
              <FileBarChart size={13} /> Run
            </button>
            <button type="button" className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
              <PenSquare size={13} /> Customize
            </button>
            <button type="button" className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
              <Mail size={13} /> Email
            </button>
            <button type="button" className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
              <Printer size={13} /> Print
            </button>
            <button type="button" className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
              <Download size={13} /> Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FavoritesAccordion({ reports, favorites, recentRuns, onOpen, onToggleFavorite }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-navy-50/60 dark:hover:bg-navy-800/40 transition"
      >
        {open ? <ChevronDown size={16} className="text-navy-500" /> : <ChevronRight size={16} className="text-navy-500" />}
        <Star size={15} className="text-amber-500" fill="currentColor" />
        <span className="text-[16px] font-bold tracking-tight text-navy-900 dark:text-white">Favorites</span>
        <span className="text-[11.5px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-full">
          {reports.length}
        </span>
      </button>
      {open && (
        <div className="border-t border-navy-100 dark:border-navy-800 px-2 py-2">
          {reports.length === 0 ? (
            <div className="text-[12px] text-navy-400 px-3 py-3">
              Click the star next to any report to pin it here.
            </div>
          ) : (
            reports.map((r) => (
              <ReportRow
                key={r.name}
                report={r}
                favorited={!!favorites[r.name]}
                lastRun={recentRuns[r.name]}
                onOpen={onOpen}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </div>
      )}
    </>
  );
}

function CategoryAccordion({ category, reports, favorites, recentRuns, defaultOpen, onOpen, onToggleFavorite }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = reports.length;
  return (
    <section className="border border-navy-200/70 dark:border-navy-800 rounded-xl overflow-hidden bg-white dark:bg-navy-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-navy-50/60 dark:hover:bg-navy-800/40 transition"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={16} className="text-navy-500" /> : <ChevronRight size={16} className="text-navy-500" />}
        <span className="text-[16px] font-bold tracking-tight text-navy-900 dark:text-white">{category.label}</span>
        <span className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </button>
      {open && (
        <div className="border-t border-navy-100 dark:border-navy-800 px-2 py-2">
          <div className="grid grid-cols-[28px_1fr_140px_36px] gap-2 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-400">
            <span aria-hidden="true" />
            <span>Name</span>
            <span className="text-right">Last run</span>
            <span aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            {reports.length === 0 ? (
              <div className="text-[12px] text-navy-400 px-3 py-3">No reports match your filters.</div>
            ) : (
              reports.map((r) => (
                <ReportRow
                  key={r.name}
                  report={r}
                  favorited={!!favorites[r.name]}
                  lastRun={recentRuns[r.name]}
                  onOpen={onOpen}
                  onToggleFavorite={onToggleFavorite}
                />
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// =====================================================================
// Standard reports page (existing behavior, extracted)
// =====================================================================

export function QBStandardPage() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const reportsByCat = useSelector(selectReportsByCategory);
  const favorites = useSelector(selectFavorites);
  const recentRuns = useSelector(selectRecentRuns);
  const query = useSelector(selectQuery);
  const favOnly = useSelector(selectShowFavoritesOnly);

  const [localQuery, setLocalQuery] = useState(query);
  useEffect(() => { setLocalQuery(query); }, [query]);

  const handleOpen = (r) => dispatch(openReport({ name: r.name, category: r.category }));
  const handleFav  = (name) => dispatch(toggleFavorite(name));

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories
      .filter((c) => c.id !== 'all')
      .map((c) => {
        const list = (reportsByCat[c.id] || [])
          .map((r) => ({ ...r, category: c.id }))
          .filter((r) => {
            if (favOnly && !favorites[r.name]) return false;
            if (!needle) return true;
            return r.name.toLowerCase().includes(needle) || r.desc.toLowerCase().includes(needle);
          });
        return { category: c, reports: list };
      })
      .filter((s) => s.reports.length > 0 || (!query && !favOnly));
  }, [categories, reportsByCat, favorites, favOnly, query]);

  const favoriteReports = useMemo(() => {
    const all = [];
    for (const [cid, list] of Object.entries(reportsByCat)) {
      for (const r of list) if (favorites[r.name]) all.push({ ...r, category: cid });
    }
    return all;
  }, [reportsByCat, favorites]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={localQuery}
            onChange={(e) => { setLocalQuery(e.target.value); dispatch(setQuery(e.target.value)); }}
            placeholder="Type report name here"
            className="w-full h-11 pl-10 pr-12 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 text-[13px] outline-none placeholder:text-navy-400 text-navy-900 dark:text-white shadow-soft transition"
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-500">
            <ChevronDown size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => dispatch(setShowFavoritesOnly(!favOnly))}
          className={cn(
            'h-10 px-3.5 rounded-lg border text-[12.5px] font-semibold inline-flex items-center gap-1.5',
            favOnly
              ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-300'
              : 'border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800',
          )}
        >
          <Star size={14} /> Favorites only
        </button>
      </div>

      <section className="border border-navy-200/70 dark:border-navy-800 rounded-xl overflow-hidden bg-white dark:bg-navy-900 mb-3">
        <FavoritesAccordion
          reports={favoriteReports}
          favorites={favorites}
          recentRuns={recentRuns}
          onOpen={handleOpen}
          onToggleFavorite={handleFav}
        />
      </section>

      <div className="flex flex-col gap-3">
        {sections.map((s, i) => (
          <CategoryAccordion
            key={s.category.id}
            category={s.category}
            reports={s.reports}
            favorites={favorites}
            recentRuns={recentRuns}
            defaultOpen={i === 0}
            onOpen={handleOpen}
            onToggleFavorite={handleFav}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-[11px] text-navy-400">
        Reports · powered by your live ledger
      </div>
    </>
  );
}

// =====================================================================
// Custom reports page
// =====================================================================

export function QBCustomPage() {
  const dispatch = useDispatch();
  const customReports = useSelector(selectCustomReports);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customReports.filter((r) =>
      !needle || r.name.toLowerCase().includes(needle) || r.base.toLowerCase().includes(needle),
    );
  }, [q, customReports]);

  const runBase = (r) => dispatch(openReport({ name: r.base, category: r.category || 'overview' }));
  const archive  = (r) => dispatch(archiveItem({ kind: 'custom', id: r.id }));
  const remove   = (r) => dispatch(deleteSaved({ kind: 'custom', id: r.id }));
  const [menuFor, setMenuFor] = useState(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-navy-900 dark:text-white">Custom reports</h2>
          <p className="text-[12.5px] text-navy-500 mt-0.5">
            Reports you've saved with custom date ranges, columns, or filters.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search custom reports"
              className="h-10 w-[240px] max-w-[60vw] pl-9 pr-3 rounded-lg bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-[12.5px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button type="button" className="h-10 px-3.5 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#2CA01C' }}>
            <Plus size={14} /> Create custom report
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 border-b border-navy-100 dark:border-navy-800 text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-500">
          <span>Report</span>
          <span>Created by</span>
          <span>Last modified</span>
          <span>Sharing</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full grid place-items-center bg-emerald-50 text-emerald-600 mb-3">
              <PenSquare size={20} />
            </div>
            <div className="text-[14.5px] font-semibold text-navy-900 dark:text-white">No custom reports yet</div>
            <p className="text-[12.5px] text-navy-500 mt-1 max-w-md mx-auto">
              Customize any standard report and click "Save customization" to add it here.
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 border-b last:border-b-0 border-navy-100 dark:border-navy-800 items-center hover:bg-emerald-50/40 dark:hover:bg-emerald-500/[0.06]">
              <div className="min-w-0">
                <button type="button" onClick={() => runBase(r)} className="block text-[13px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline truncate">
                  {r.name}
                </button>
                <div className="text-[11.5px] text-navy-500 truncate">Based on: {r.base}</div>
              </div>
              <div className="text-[12.5px] text-navy-700 dark:text-navy-200">{r.createdBy}</div>
              <div className="text-[12.5px] text-navy-700 dark:text-navy-200">{r.modifiedAt}</div>
              <div className="text-[12px]">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold',
                  r.shared === 'Private'
                    ? 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                    : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                )}>
                  {r.shared}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5 relative">
                <button type="button" onClick={() => runBase(r)} className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12px] font-semibold inline-flex items-center gap-1">
                  <Play size={12} /> Run
                </button>
                <button
                  type="button"
                  onClick={() => setMenuFor((m) => (m === r.id ? null : r.id))}
                  className="h-8 w-8 grid place-items-center rounded-md text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800"
                  aria-label="Row actions"
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuFor === r.id && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 z-20 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg shadow-lift py-1 text-[12.5px]">
                    <button type="button" onClick={() => { setMenuFor(null); archive(r); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800">
                      <Archive size={13} /> Archive
                    </button>
                    <button type="button" onClick={() => { setMenuFor(null); remove(r); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-navy-50 dark:hover:bg-navy-800 text-red-600">
                      <Archive size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// =====================================================================
// Management reports page
// =====================================================================

export function QBManagementPage() {
  const dispatch = useDispatch();
  const runReport = (name) => dispatch(openReport({ name, category: 'overview' }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-navy-900 dark:text-white">Management reports</h2>
          <p className="text-[12.5px] text-navy-500 mt-0.5">
            Pre-built bundles for monthly close, leadership updates, and board packs.
          </p>
        </div>
        <button type="button" className="h-10 px-3.5 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#2CA01C' }}>
          <Plus size={14} /> Create new
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MANAGEMENT_PACKS.map((pack) => (
          <article
            key={pack.id}
            className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3 hover:shadow-card transition"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-navy-900 dark:text-white">{pack.name}</h3>
                <p className="text-[12px] text-navy-500 mt-0.5">{pack.desc}</p>
              </div>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {pack.cadence}
              </span>
            </header>

            {pack.reports.length === 0 ? (
              <div className="text-[12px] text-navy-400 border border-dashed border-navy-200 dark:border-navy-700 rounded-md px-3 py-3">
                No reports yet — click "Edit pack" to build your own bundle.
              </div>
            ) : (
              <ul className="text-[12.5px] text-navy-700 dark:text-navy-200 space-y-1.5">
                {pack.reports.map((rn) => (
                  <li key={rn} className="flex items-center gap-2">
                    <FileBarChart size={13} className="text-emerald-500 shrink-0" />
                    <button type="button" onClick={() => runReport(rn)} className="text-left hover:underline truncate">
                      {rn}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <footer className="mt-auto pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-navy-500">
                {pack.lastRun ? `Last run · ${pack.lastRun}` : 'Never run'}
              </span>
              <div className="flex items-center gap-1.5">
                <button type="button" className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12px] font-semibold inline-flex items-center gap-1">
                  <PenSquare size={12} /> Edit pack
                </button>
                <button type="button" className="h-8 px-2.5 rounded-md text-white text-[12px] font-semibold inline-flex items-center gap-1" style={{ background: '#2CA01C' }}>
                  <Play size={12} /> Run pack
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

// =====================================================================
// Financial planning page (with sub-nav: overview / planner)
// =====================================================================

function MoneyTile({ label, value, hint, tone = 'neutral', icon: Icon }) {
  const ToneCls = {
    neutral: 'bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
    up:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    down:    'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  }[tone];
  return (
    <div className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl p-4 flex items-start gap-3">
      <span className={cn('w-10 h-10 rounded-lg grid place-items-center shrink-0', ToneCls)}>
        {Icon ? <Icon size={18} /> : null}
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-500">{label}</div>
        <div className="text-[20px] font-bold text-navy-900 dark:text-white tabular-nums">{value}</div>
        {hint && <div className="text-[11px] text-navy-500 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function QBFinancialPlanningPage({ subView = 'overview' }) {
  const o = CASH_FLOW_OVERVIEW;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-navy-900 dark:text-white">
            {subView === 'planner' ? 'Cash flow planner' : 'Cash flow overview'}
          </h2>
          <p className="text-[12.5px] text-navy-500 mt-0.5">
            {subView === 'planner'
              ? 'Model receivables, payables, and scenarios for the next 12 weeks.'
              : 'Snapshot of cash position, scheduled inflows and outflows for the next 30 days.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="h-10 px-3.5 rounded-lg border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12.5px] font-semibold inline-flex items-center gap-1.5">
            <Download size={14} /> Export
          </button>
          <button type="button" className="h-10 px-3.5 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#2CA01C' }}>
            <Play size={14} /> Run forecast
          </button>
        </div>
      </div>

      {subView === 'overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <MoneyTile label="Cash on hand"     value={fmt(o.cashOnHand)}   tone="neutral" icon={Wallet} />
            <MoneyTile label="Inflows · next 30 days" value={`+${fmt(o.in30Days)}`} hint="6 invoices outstanding" tone="up" icon={TrendingUp} />
            <MoneyTile label="Outflows · next 30 days" value={fmt(o.out30Days)} hint="11 bills due" tone="down" icon={TrendingDown} />
            <MoneyTile label="Projected ending cash" value={fmt(o.endingCash)} hint="30 days from today" tone="up" icon={BarChart3} />
          </div>

          <section className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-bold text-navy-900 dark:text-white">Weekly cash flow · next 6 weeks</h3>
                <p className="text-[11.5px] text-navy-500">Inflows vs outflows by week, based on scheduled invoices and bills.</p>
              </div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o.weeks} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" vertical={false} />
                  <XAxis dataKey="wk" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(v)} />
                  <Bar dataKey="inflow"  fill="#2CA01C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Planner: scenarios + cumulative cash chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {CASH_FLOW_SCENARIOS.map((s) => (
              <div key={s.id} className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl p-4">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-500">{s.label}</div>
                <div className="text-[22px] font-bold text-navy-900 dark:text-white tabular-nums mt-1">{fmt(s.endingCash)}</div>
                <div className="text-[11.5px] text-navy-500 mt-1">Runway · {s.runwayMonths} months</div>
              </div>
            ))}
          </div>

          <section className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-bold text-navy-900 dark:text-white">Cumulative cash position</h3>
                <p className="text-[11.5px] text-navy-500">Weekly cumulative net cash across all scenarios.</p>
              </div>
              <button type="button" className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-[12px] font-semibold inline-flex items-center gap-1.5">
                <Copy size={12} /> Duplicate scenario
              </button>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={o.weeks} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qb-cash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2CA01C" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2CA01C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" vertical={false} />
                  <XAxis dataKey="wk" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(v)} />
                  <Area type="monotone" dataKey="inflow" stroke="#2CA01C" strokeWidth={2.5} fill="url(#qb-cash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" className="h-9 px-3 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12.5px] font-semibold inline-flex items-center gap-1.5">
              <Archive size={13} /> Save scenario
            </button>
            <button type="button" className="h-9 px-3 rounded-md text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#2CA01C' }}>
              Apply to plan <ArrowRight size={13} />
            </button>
          </div>
        </>
      )}
    </>
  );
}