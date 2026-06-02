'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ChevronDown, Plus, Check, Users, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { selectAllClients, selectActiveClient, selectClient } from '../../features/clients/clientsSlice.js';
import { selectRole } from '../../features/auth/authSlice.js';
import { INTEGRATIONS } from '../../utils/mockData.js';
import { cn } from '../../utils/classNames.js';

export default function ClientSwitcher() {
  const dispatch = useDispatch();
  const router = useRouter();
  const clients = useSelector(selectAllClients);
  const client = useSelector(selectActiveClient);
  const role = useSelector(selectRole);
  const locked = role === 'client';

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { if (!open) setQ(''); }, [open]);

  const filtered = clients.filter(
    (c) => !q || [c.name, c.company, c.email].some((s) => (s || '').toLowerCase().includes(q.toLowerCase()))
  );

  const label = client ? client.name : 'Select client';
  const initial = (client?.name || 'C').slice(0, 1).toUpperCase();

  if (locked) {
    return (
      <div className="hidden md:flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl border bg-brand-50/60 border-brand-200 dark:bg-brand-500/15 dark:border-brand-500/30">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-cyan-500 text-white text-[11px] font-bold grid place-items-center shrink-0">
          {initial}
        </span>
        <span className="text-[12.5px] font-semibold text-navy-900 dark:text-white leading-tight truncate max-w-[200px]">
          {label}
        </span>
        <Lock size={12} className="text-brand-500" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl border transition',
          open
            ? 'bg-brand-50/60 border-brand-300 dark:bg-brand-500/15 dark:border-brand-500/40'
            : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800'
        )}
      >
        {client ? (
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-cyan-500 text-white text-[11px] font-bold grid place-items-center shrink-0">
            {initial}
          </span>
        ) : (
          <span className="w-6 h-6 rounded-md bg-navy-100 dark:bg-navy-800 text-navy-500 grid place-items-center shrink-0">
            <Users size={13} />
          </span>
        )}
        <span className="text-[12.5px] font-semibold text-navy-900 dark:text-white leading-tight truncate max-w-[200px]">
          {label}
        </span>
        <ChevronDown size={13} className={cn('text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[300px] z-50 bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl shadow-lift overflow-hidden animate-fadein">
          <div className="px-3 py-2.5 border-b border-navy-100 dark:border-navy-800">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients…"
                className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-navy-50 dark:bg-navy-800 border border-transparent focus:border-brand-400 focus:bg-white dark:focus:bg-navy-900 text-[12.5px] outline-none placeholder:text-navy-400 text-navy-900 dark:text-white"
              />
            </div>
          </div>

          <ul className="max-h-[280px] overflow-y-auto scroll-thin py-1.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-[12px] text-navy-500">No clients match.</li>
            ) : (
              filtered.map((c) => {
                const ini = (c.name || 'C').slice(0, 1).toUpperCase();
                const it = INTEGRATIONS.find((x) => x.id === c.integration);
                const selected = client?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        dispatch(selectClient(c.id));
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 text-left transition',
                        selected ? 'bg-brand-50/60 dark:bg-brand-500/10' : 'hover:bg-navy-50 dark:hover:bg-navy-800'
                      )}
                    >
                      <span className="w-7 h-7 rounded-md grid place-items-center text-white text-[11.5px] font-bold shrink-0 bg-gradient-to-br from-brand-500 to-cyan-500">
                        {ini}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-semibold text-navy-900 dark:text-white truncate">
                          {c.name}
                        </span>
                        <span className="block text-[11px] text-navy-500 truncate">
                          {it ? `${it.label} · ${c.connected ? 'Connected' : 'Not connected'}` : 'No integration'}
                        </span>
                      </span>
                      {selected && <Check size={14} className="text-brand-500" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-navy-100 dark:border-navy-800 py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                router.push('/clients');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-navy-50 dark:hover:bg-navy-800 transition"
            >
              <Plus size={14} /> Manage clients
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
