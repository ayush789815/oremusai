'use client';

// Page bodies for the Xero Report Centre tabs (Home / Custom / Drafts /
// Published / Archived). The layout file picks the right body based on
// the active tab.

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star, ChevronUp, ChevronDown, MoreHorizontal, Plus, FilePlus2,
  RotateCcw, Eye, Send, Mail, Download, PenSquare, FileText, Archive,
} from 'lucide-react';
import {
  selectReportsByCategory, selectCategories, selectFavorites,
  selectQuery, toggleFavorite, openReport,
  selectCustomReports, selectDraftReports, selectPublishedReports, selectArchivedReports,
  publishDraft, archiveItem, restoreItem, deleteSaved,
} from '../../../features/reports/reportsSlice.js';
import { cn } from '../../../utils/classNames.js';

// =====================================================================
// Shared building blocks for Home tab
// =====================================================================

function FavouriteCard({ report, onOpen, onUnfav }) {
  return (
    <div className="bg-white border border-navy-200 rounded-lg flex items-center gap-3 px-3.5 py-3 hover:border-sky-400 transition shadow-soft">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onUnfav(report.name); }}
        className="text-sky-500 hover:text-sky-700 shrink-0"
        aria-label="Remove from favourites"
      >
        <Star size={16} fill="currentColor" />
      </button>
      <button
        type="button"
        onClick={() => onOpen(report)}
        className="flex-1 text-left text-[13.5px] font-semibold text-navy-900 hover:text-sky-700 hover:underline truncate"
      >
        {report.name}
      </button>
    </div>
  );
}

function HomeReportRow({ report, favorited, showDesc, onOpen, onToggleFavorite }) {
  return (
    <div className="grid grid-cols-[28px_1fr] items-start gap-2 py-1.5">
      <button
        type="button"
        onClick={() => onToggleFavorite(report.name)}
        className={cn(
          'h-7 w-7 grid place-items-center rounded transition shrink-0',
          favorited ? 'text-sky-500 hover:text-sky-700' : 'text-navy-300 hover:text-sky-500',
        )}
        aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Star size={14} fill={favorited ? 'currentColor' : 'none'} />
      </button>
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onOpen(report)}
          className="text-left text-[13.5px] font-semibold text-navy-900 dark:text-white hover:text-sky-700 hover:underline"
        >
          {report.name}
        </button>
        {showDesc && (
          <div className="text-[12px] text-navy-500 dark:text-navy-400 leading-snug mt-0.5">
            {report.desc}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({ category, reports, favorites, showDesc, defaultOpen, onOpen, onToggleFavorite }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-navy-200/70 dark:border-navy-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-navy-50/40 dark:hover:bg-navy-800/30 transition"
        aria-expanded={open}
      >
        {open
          ? <ChevronUp   size={16} className="text-navy-700 dark:text-navy-300" />
          : <ChevronDown size={16} className="text-navy-700 dark:text-navy-300" />}
        <span className="text-[15px] font-bold tracking-tight text-navy-900 dark:text-white">
          {category.label}
        </span>
        <span className="ml-2 text-[11.5px] font-semibold text-navy-400">{reports.length}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0">
          {reports.length === 0
            ? <div className="text-[12px] text-navy-400">No reports match your filters.</div>
            : reports.map((r) => (
                <HomeReportRow
                  key={r.name}
                  report={r}
                  favorited={!!favorites[r.name]}
                  showDesc={showDesc}
                  onOpen={onOpen}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
        </div>
      )}
    </section>
  );
}

// =====================================================================
// Home page — Favourites + All reports accordion
// =====================================================================

export function XeroHomePage() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const reportsByCat = useSelector(selectReportsByCategory);
  const favorites = useSelector(selectFavorites);
  const query = useSelector(selectQuery);

  const [favOpen, setFavOpen] = useState(true);
  const [showDesc, setShowDesc] = useState(false);

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
            if (!needle) return true;
            return r.name.toLowerCase().includes(needle) || r.desc.toLowerCase().includes(needle);
          });
        return { category: c, reports: list };
      })
      .filter((s) => !needle || s.reports.length > 0);
  }, [categories, reportsByCat, query]);

  const favouriteReports = useMemo(() => {
    const all = [];
    for (const [cid, list] of Object.entries(reportsByCat)) {
      for (const r of list) if (favorites[r.name]) all.push({ ...r, category: cid });
    }
    return all;
  }, [reportsByCat, favorites]);

  return (
    <>
      <section className="mt-6 bg-navy-50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 rounded-xl px-5 py-4">
        <button
          type="button"
          onClick={() => setFavOpen((o) => !o)}
          className="flex items-center gap-2 text-[15px] font-bold text-navy-900 dark:text-white"
          aria-expanded={favOpen}
        >
          {favOpen ? <ChevronUp size={16} className="text-navy-700 dark:text-navy-300" /> : <ChevronDown size={16} className="text-navy-700 dark:text-navy-300" />}
          Favourites
          <span className="ml-1 text-[11.5px] font-semibold text-navy-500">{favouriteReports.length}</span>
        </button>

        {favOpen && (
          <div className="mt-4">
            {favouriteReports.length === 0 ? (
              <div className="text-[12.5px] text-navy-500 px-1">
                Click the star next to any report to pin it here.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {favouriteReports.map((r) => (
                  <FavouriteCard
                    key={r.name}
                    report={r}
                    onOpen={handleOpen}
                    onUnfav={handleFav}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold tracking-tight text-navy-900 dark:text-white">All reports</h2>
        <label className="flex items-center gap-2 text-[12.5px] font-medium text-navy-600 dark:text-navy-300 cursor-pointer select-none">
          Show descriptions
          <span
            role="switch"
            aria-checked={showDesc}
            onClick={() => setShowDesc((v) => !v)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDesc((v) => !v); }}
            tabIndex={0}
            className={cn(
              'inline-flex items-center w-9 h-5 rounded-full transition cursor-pointer',
              showDesc ? 'bg-sky-500' : 'bg-navy-200 dark:bg-navy-700',
            )}
          >
            <span className={cn('inline-block w-4 h-4 bg-white rounded-full shadow transform transition', showDesc ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
          </span>
        </label>
      </div>

      <div className="mt-2 border-t border-navy-200/70 dark:border-navy-800">
        {sections.map((s) => (
          <CategorySection
            key={s.category.id}
            category={s.category}
            reports={s.reports}
            favorites={favorites}
            showDesc={showDesc}
            defaultOpen={!!query}
            onOpen={handleOpen}
            onToggleFavorite={handleFav}
          />
        ))}
      </div>
    </>
  );
}

// =====================================================================
// Generic saved-report list (shared by Custom / Drafts / Published / Archived)
// =====================================================================

function SavedReportsList({
  title, subtitle, rows, columns, emptyText, emptyIcon: EmptyIcon = FileText,
  primaryAction, secondaryActions,
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-navy-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-navy-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl overflow-hidden">
        <div
          className="grid gap-3 px-5 py-3 border-b border-navy-100 dark:border-navy-800 text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy-500"
          style={{ gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' ') }}
        >
          {columns.map((c) => (
            <span key={c.key} className={cn(c.align === 'right' && 'text-right')}>{c.label}</span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full grid place-items-center bg-sky-50 text-sky-600 mb-3">
              <EmptyIcon size={20} />
            </div>
            <div className="text-[14.5px] font-semibold text-navy-900 dark:text-white">{emptyText.title}</div>
            <p className="text-[12.5px] text-navy-500 mt-1 max-w-md mx-auto">{emptyText.body}</p>
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.id || i}
              className="grid gap-3 px-5 py-3 border-b last:border-b-0 border-navy-100 dark:border-navy-800 items-center hover:bg-sky-50/40 dark:hover:bg-sky-500/[0.06]"
              style={{ gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' ') }}
            >
              {columns.map((c) => (
                <div key={c.key} className={cn('text-[12.5px] text-navy-700 dark:text-navy-200', c.align === 'right' && 'text-right')}>
                  {c.render ? c.render(row) : row[c.key]}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Re-usable row actions cluster.
function RowActions({ onOpen, extra }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onOpen && (
        <button type="button" onClick={onOpen} className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12px] font-semibold inline-flex items-center gap-1">
          <Eye size={12} /> Open
        </button>
      )}
      {extra}
      <button type="button" className="h-8 w-8 grid place-items-center rounded-md text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800">
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}

// =====================================================================
// Custom tab
// =====================================================================

export function XeroCustomPage() {
  const dispatch = useDispatch();
  const rows = useSelector(selectCustomReports);
  const open = (r) => dispatch(openReport({ name: r.base, category: r.category || 'performance' }));
  const archive = (r) => dispatch(archiveItem({ kind: 'custom', id: r.id }));

  const columns = [
    { key: 'name',       label: 'Report',        width: '1.6fr',
      render: (r) => (
        <div className="min-w-0">
          <button type="button" onClick={() => open(r)} className="block text-[13px] font-semibold text-sky-700 dark:text-sky-300 hover:underline truncate">
            {r.name}
          </button>
          <div className="text-[11.5px] text-navy-500 truncate">Based on: {r.base}</div>
        </div>
      ),
    },
    { key: 'createdBy',  label: 'Author',         width: '1fr' },
    { key: 'modifiedAt', label: 'Last modified',  width: '1fr' },
    { key: 'shared',     label: 'Sharing',        width: '1fr',
      render: (r) => (
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[12px]',
          r.shared === 'Private'
            ? 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
            : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
        )}>{r.shared}</span>
      ),
    },
    { key: 'actions',    label: 'Actions',        width: '180px', align: 'right',
      render: (r) => (
        <RowActions
          onOpen={() => open(r)}
          extra={
            <button
              type="button"
              onClick={() => archive(r)}
              className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12px] font-semibold inline-flex items-center gap-1"
              title="Archive"
            >
              <Archive size={12} /> Archive
            </button>
          }
        />
      ),
    },
  ];

  return (
    <SavedReportsList
      title="Custom reports"
      subtitle="Reports built from your own customizations and templates."
      rows={rows}
      columns={columns}
      emptyText={{
        title: 'No custom reports yet',
        body: 'Save any standard report with your filters and column choices to create a custom report.',
      }}
      emptyIcon={PenSquare}
      primaryAction={
        <button type="button" className="h-10 px-3.5 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#13B5EA' }}>
          <Plus size={14} /> New custom report
        </button>
      }
    />
  );
}

// =====================================================================
// Drafts tab
// =====================================================================

export function XeroDraftsPage() {
  const dispatch = useDispatch();
  const rows = useSelector(selectDraftReports);
  const open = (r) => dispatch(openReport({ name: r.based, category: r.category || 'performance' }));
  const publish = (r) => dispatch(publishDraft({ draftId: r.id }));
  const archive = (r) => dispatch(archiveItem({ kind: 'drafts', id: r.id }));

  const columns = [
    { key: 'name', label: 'Report', width: '1.8fr',
      render: (r) => (
        <div className="min-w-0">
          <button type="button" onClick={() => open(r)} className="block text-[13px] font-semibold text-sky-700 dark:text-sky-300 hover:underline truncate">
            {r.name}
          </button>
          <div className="text-[11.5px] text-navy-500 truncate">Based on: {r.based}</div>
        </div>
      ),
    },
    { key: 'author',     label: 'Author',        width: '1fr' },
    { key: 'modifiedAt', label: 'Last modified', width: '1fr' },
    { key: 'status',     label: 'Status',        width: '1fr',
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[12px] bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          Draft
        </span>
      ),
    },
    { key: 'actions', label: 'Actions', width: '230px', align: 'right',
      render: (r) => (
        <RowActions
          onOpen={() => open(r)}
          extra={
            <>
              <button
                type="button"
                onClick={() => publish(r)}
                className="h-8 px-2.5 rounded-md text-white text-[12px] font-semibold inline-flex items-center gap-1"
                style={{ background: '#13B5EA' }}
              >
                <Send size={12} /> Publish
              </button>
              <button
                type="button"
                onClick={() => archive(r)}
                className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500"
                title="Archive"
              >
                <Archive size={13} />
              </button>
            </>
          }
        />
      ),
    },
  ];

  return (
    <SavedReportsList
      title="Drafts"
      subtitle="Reports you've started but haven't published yet."
      rows={rows}
      columns={columns}
      emptyText={{
        title: 'No drafts',
        body: 'Drafts created while editing reports will appear here so you can come back to them later.',
      }}
      emptyIcon={FilePlus2}
      primaryAction={
        <button type="button" className="h-10 px-3.5 rounded-lg text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-soft" style={{ background: '#13B5EA' }}>
          <FilePlus2 size={14} /> New draft
        </button>
      }
    />
  );
}

// =====================================================================
// Published tab
// =====================================================================

export function XeroPublishedPage() {
  const dispatch = useDispatch();
  const rows = useSelector(selectPublishedReports);
  const archive = (r) => dispatch(archiveItem({ kind: 'published', id: r.id }));

  const columns = [
    { key: 'name', label: 'Report', width: '1.6fr',
      render: (r) => (
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-navy-900 dark:text-white truncate">{r.name}</div>
          <div className="text-[11.5px] text-navy-500 truncate">Version {r.version}</div>
        </div>
      ),
    },
    { key: 'publishedBy', label: 'Published by',  width: '1fr' },
    { key: 'publishedAt', label: 'Published on',  width: '1fr' },
    { key: 'recipients',  label: 'Recipients',    width: '1.2fr' },
    { key: 'actions', label: 'Actions', width: '220px', align: 'right',
      render: (r) => (
        <RowActions
          extra={
            <>
              <button type="button" className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500"><Download size={13} /></button>
              <button type="button" className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500"><Mail size={13} /></button>
              <button
                type="button"
                onClick={() => archive(r)}
                className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-navy-500"
                title="Archive"
              >
                <Archive size={13} />
              </button>
            </>
          }
        />
      ),
    },
  ];

  return (
    <SavedReportsList
      title="Published reports"
      subtitle="Reports shared with clients, leadership, or external recipients."
      rows={rows}
      columns={columns}
      emptyText={{
        title: 'Nothing published yet',
        body: 'Publish a report from the report viewer to lock its state and share it with recipients.',
      }}
      emptyIcon={Send}
      primaryAction={
        <button type="button" className="h-10 px-3.5 rounded-lg border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12.5px] font-semibold inline-flex items-center gap-1.5">
          <Download size={14} /> Export all
        </button>
      }
    />
  );
}

// =====================================================================
// Archived tab
// =====================================================================

export function XeroArchivedPage() {
  const dispatch = useDispatch();
  const rows = useSelector(selectArchivedReports);
  const restore = (r) => dispatch(restoreItem({ id: r.id }));
  const remove = (r) => dispatch(deleteSaved({ kind: 'archived', id: r.id }));

  const columns = [
    { key: 'name', label: 'Report', width: '1.6fr',
      render: (r) => (
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-navy-700 dark:text-navy-300 truncate">{r.name}</div>
          <div className="text-[11.5px] text-navy-500 truncate">Originally created {r.originalDate}</div>
        </div>
      ),
    },
    { key: 'author',     label: 'Author',       width: '1fr' },
    { key: 'archivedAt', label: 'Archived on',  width: '1fr' },
    { key: 'actions', label: 'Actions', width: '220px', align: 'right',
      render: (r) => (
        <RowActions
          extra={
            <>
              <button
                type="button"
                onClick={() => restore(r)}
                className="h-8 px-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 text-[12px] font-semibold inline-flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restore
              </button>
              <button
                type="button"
                onClick={() => remove(r)}
                className="h-8 w-8 grid place-items-center rounded-md border border-navy-200 dark:border-navy-700 text-red-500"
                title="Delete permanently"
              >
                <Archive size={13} />
              </button>
            </>
          }
        />
      ),
    },
  ];

  return (
    <SavedReportsList
      title="Archived reports"
      subtitle="Old or paused reports that have been moved out of the active workspace."
      rows={rows}
      columns={columns}
      emptyText={{
        title: 'Nothing archived',
        body: 'Reports you archive will appear here. Archived reports can be restored at any time.',
      }}
      emptyIcon={RotateCcw}
    />
  );
}