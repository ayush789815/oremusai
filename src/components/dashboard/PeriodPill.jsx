'use client';

import { cn } from '../../utils/classNames.js';

export default function PeriodPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-3 rounded-md text-[12px] font-semibold transition',
        active
          ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
          : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
      )}
    >
      {children}
    </button>
  );
}