'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  X, CheckCircle2, Zap, BookOpen,
  Users, BarChart3, ArrowRight, ExternalLink,
} from 'lucide-react';
import { selectZohoConnected } from '../../features/zoho/zohoSlice.js';
import { getZohoStartURL } from '../../features/zoho/zohoAPI.js';
import { markSkippedThisSession } from '../../utils/zohoSession.js';
import { cn } from '../../utils/classNames.js';

const FEATURES = [
  { icon: BookOpen,  text: 'Day Book & all transactions synced live' },
  { icon: Zap,       text: 'Invoices, bills and payment entries'      },
  { icon: Users,     text: 'Customers, vendors and contacts'          },
  { icon: BarChart3, text: 'Cash flow, P&L and balance sheet data'    },
];

export default function ZohoConnectModal({ onClose }) {
  const connected    = useSelector(selectZohoConnected);
  const overlayRef   = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-close if connected (e.g. returning from callback)
  useEffect(() => {
    if (connected) onClose();
  }, [connected, onClose]);

  function handleConnect() {
    // Redirect via backend start URL — redirect_uri comes from server env,
    // never baked into the frontend bundle. Fixes Invalid Redirect Uri in prod.
    const url = getZohoStartURL();
    if (url) window.location.href = url;
  }

  function handleSkip() {
    markSkippedThisSession();
    onClose();
  }

  // Click outside overlay to skip
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) handleSkip();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        'bg-navy-950/60 backdrop-blur-sm',
        'animate-fadein'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zoho-modal-title"
    >
      <div
        className={cn(
          'relative w-full max-w-[440px] rounded-2xl overflow-hidden',
          'bg-white dark:bg-navy-900',
          'border border-navy-200 dark:border-navy-700',
          'shadow-2xl shadow-navy-950/30',
          'animate-slide-up',
        )}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Gradient accent bar ── */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-cyan-400 to-brand-600" />

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            {/* Zoho Books logo */}
            <div className="w-11 h-11 rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 grid place-items-center shadow-soft shrink-0">
              <svg viewBox="0 0 40 40" width="26" height="26" fill="none">
                <rect width="40" height="40" rx="8" fill="#E42527"/>
                <path d="M7 27L17 13H7v-2.5h14L11 24.5h12V27H7Z" fill="white"/>
                <path d="M27 10c3 0 5.5 2.5 5.5 6.25S30 22.5 27 22.5s-5.5-2.5-5.5-6.25S24 10 27 10Zm0 2.5c-1.7 0-3 1.7-3 3.75s1.3 3.75 3 3.75 3-1.7 3-3.75-1.3-3.75-3-3.75Z" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-navy-400">
                Integration Required
              </p>
              <h2
                id="zoho-modal-title"
                className="text-[18px] font-bold text-navy-900 dark:text-white leading-tight"
              >
                Connect Zoho Books
              </h2>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleSkip}
            className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white transition"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-[13.5px] text-navy-500 dark:text-navy-400 leading-relaxed mb-5">
            Oremus pulls your live financial data directly from Zoho Books.
            Connect once — everything syncs automatically.
          </p>

          {/* Feature list */}
          <ul className="flex flex-col gap-2.5 mb-6">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 grid place-items-center shrink-0">
                  <Icon size={13} className="text-brand-600 dark:text-brand-400" />
                </span>
                <span className="text-[13px] text-navy-700 dark:text-navy-300">{text}</span>
                <CheckCircle2 size={13} className="ml-auto shrink-0 text-emerald-500" />
              </li>
            ))}
          </ul>

        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <button
            onClick={handleConnect}
            className={cn(
              'w-full h-11 rounded-xl font-semibold text-[13.5px] text-white',
              'bg-gradient-to-r from-brand-500 to-cyan-500',
              'hover:from-brand-600 hover:to-cyan-600',
              'inline-flex items-center justify-center gap-2 transition shadow-soft hover:shadow-lift'
            )}
          >
            <ExternalLink size={15} />
            Connect Zoho Books
            <ArrowRight size={14} className="ml-auto" />
          </button>

          {/* Switch account option */}
          <button
            onClick={() => { window.location.href = buildSwitchAccountURL(); }}
            className="w-full h-9 rounded-lg text-[12px] font-medium text-navy-400 hover:text-brand-600 dark:hover:text-brand-400 transition underline-offset-2 hover:underline"
          >
            Connect a different Zoho account →
          </button>

          <button
            onClick={handleSkip}
            className="w-full h-8 rounded-lg text-[12px] font-medium text-navy-300 hover:text-navy-500 dark:hover:text-navy-300 transition"
          >
            Remind me later
          </button>
        </div>

        {/* ── Footer note ── */}
        <div className="px-6 pb-5 -mt-1 text-center">
          <p className="text-[11px] text-navy-300 dark:text-navy-600">
            You can connect anytime from{' '}
            <span className="font-medium text-navy-400 dark:text-navy-500">
              Settings → Integrations
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}