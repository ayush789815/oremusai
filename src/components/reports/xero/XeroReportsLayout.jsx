'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import {
  selectQuery, setQuery,
} from '../../../features/reports/reportsSlice.js';
import ReportViewerModal from '../ReportViewerModal.jsx';
import { cn } from '../../../utils/classNames.js';
import {
  XeroHomePage, XeroCustomPage, XeroDraftsPage, XeroPublishedPage, XeroArchivedPage,
} from './XeroPages.jsx';

const TABS = [
  { id: 'home',      label: 'Home' },
  { id: 'custom',    label: 'Custom' },
  { id: 'drafts',    label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived',  label: 'Archived' },
];

const BODIES = {
  home:      XeroHomePage,
  custom:    XeroCustomPage,
  drafts:    XeroDraftsPage,
  published: XeroPublishedPage,
  archived:  XeroArchivedPage,
};

export default function XeroReportsLayout() {
  const dispatch = useDispatch();
  const query = useSelector(selectQuery);
  const [tab, setTab] = useState('home');

  const Body = BODIES[tab] || XeroHomePage;

  return (
    <div className="bg-white dark:bg-navy-950 min-h-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-6 pb-8">
        {/* Title + tabs + search */}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[26px] font-bold tracking-tight text-navy-900 dark:text-white">Reports</h1>
          <div className="flex items-end gap-0 border-b border-navy-200 dark:border-navy-800 -mb-px self-stretch">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'h-10 px-3.5 text-[14px] font-semibold whitespace-nowrap border-b-[3px] -mb-px transition',
                    active
                      ? 'border-sky-500 text-sky-700 dark:text-sky-300'
                      : 'border-transparent text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="grow" />
          <div className="relative w-[320px] max-w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={query}
              onChange={(e) => dispatch(setQuery(e.target.value))}
              placeholder="Find a report"
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-[13.5px] outline-none placeholder:text-navy-400 text-navy-900 dark:text-white"
            />
          </div>
        </div>

        {/* Body — dispatched by tab */}
        <Body />

        <div className="mt-8 text-center text-[11px] text-navy-400">
          Reports · powered by your live ledger
        </div>
      </div>

      <ReportViewerModal />
    </div>
  );
}