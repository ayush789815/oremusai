'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ReportViewerModal from '../ReportViewerModal.jsx';
import { cn } from '../../../utils/classNames.js';
import {
  QBStandardPage, QBCustomPage, QBManagementPage, QBFinancialPlanningPage,
} from './QBPages.jsx';

// ----------------------------------------------------------------------------
// Sub-nav definition. Each item is a "page"; the financial group has
// child sub-views (cash-flow-overview / cash-flow-planner) that the
// FinancialPlanning page reads via `subView`.

const SUB_NAV = [
  { id: 'standard',   label: 'Standard reports' },
  { id: 'custom',     label: 'Custom reports' },
  { id: 'management', label: 'Management reports' },
  {
    id: 'financial',
    label: 'Financial planning',
    children: [
      { id: 'cf-overview', label: 'Cash flow overview' },
      { id: 'cf-planner',  label: 'Cash flow planner' },
    ],
  },
];

function SubNav({ activeId, activeChildId, onSelect, onSelectChild }) {
  const [openGroups, setOpenGroups] = useState({ financial: true });

  return (
    <div className="bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-2xl p-2 sticky top-20">
      <div className="px-3 pt-2 pb-3">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-navy-500">
          Reports &amp; Analytics
        </span>
      </div>

      <ul className="flex flex-col gap-0.5">
        {SUB_NAV.map((item) => {
          const isActive = activeId === item.id;
          const isOpen = openGroups[item.id];

          if (item.children) {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenGroups((m) => ({ ...m, [item.id]: !isOpen }));
                    onSelect?.(item.id);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/60',
                  )}
                  aria-expanded={isOpen}
                >
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown size={14} className={cn('transition-transform', isOpen ? 'rotate-0' : '-rotate-90')} />
                </button>
                {isOpen && (
                  <ul className="ml-3 pl-3 mt-0.5 mb-1 border-l border-navy-200/60 dark:border-navy-800 flex flex-col gap-0.5">
                    {item.children.map((c) => {
                      const childActive = isActive && activeChildId === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => onSelectChild?.(item.id, c.id)}
                            className={cn(
                              'w-full text-left text-[12.5px] py-1.5 px-2.5 rounded-md transition',
                              childActive
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 font-semibold'
                                : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800/60',
                            )}
                          >
                            {c.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                    : 'text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/60',
                )}
              >
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function QBReportsLayout() {
  const [subActive, setSubActive] = useState('standard');
  const [financialSub, setFinancialSub] = useState('cf-overview');

  // Map the active sub-nav id to a body component.
  let body;
  if (subActive === 'custom')          body = <QBCustomPage />;
  else if (subActive === 'management') body = <QBManagementPage />;
  else if (subActive === 'financial') {
    const subView = financialSub === 'cf-planner' ? 'planner' : 'overview';
    body = <QBFinancialPlanningPage subView={subView} />;
  }
  else                                 body = <QBStandardPage />;

  return (
    <div className="p-6 lg:p-7 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <div>
          <SubNav
            activeId={subActive}
            activeChildId={financialSub}
            onSelect={(id) => {
              setSubActive(id);
              if (id === 'financial') setFinancialSub('cf-overview');
            }}
            onSelectChild={(parentId, childId) => {
              setSubActive(parentId);
              setFinancialSub(childId);
            }}
          />
        </div>

        <div className="min-w-0">
          {body}
        </div>
      </div>

      <ReportViewerModal />
    </div>
  );
}