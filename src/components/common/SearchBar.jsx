'use client';

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, X } from 'lucide-react';
import { selectSearchQuery, setSearchQuery } from '../../features/filters/filtersSlice.js';
import { cn } from '../../utils/classNames.js';

/**
 * Global search input. Reads/writes `filters.searchQuery` in Redux so any
 * page can react to it. Supports the ⌘K / Ctrl-K shortcut to focus.
 */
export default function SearchBar({
  placeholder = 'Search transactions, customers, accounts, invoices…',
  className = '',
  showShortcut = true,
}) {
  const dispatch = useDispatch();
  const value = useSelector(selectSearchQuery);
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isShortcut) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={cn('relative flex-1 min-w-[220px]', className)}>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-12 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/15 text-[13px] outline-none placeholder:text-navy-400 text-navy-900 dark:text-white shadow-soft transition"
      />
      {value ? (
        <button
          onClick={() => dispatch(setSearchQuery(''))}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-md text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      ) : (
        showShortcut && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 h-6 px-1.5 rounded-md bg-navy-100 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-[10px] font-mono font-semibold text-navy-500">
            ⌘ K
          </kbd>
        )
      )}
    </div>
  );
}