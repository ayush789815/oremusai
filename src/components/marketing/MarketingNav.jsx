'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import Logo from '@/components/ui/Logo.jsx';
import { NAV_LINKS, COMPANY } from './data.js';

const THEME_KEY = 'oremus_theme_v1';

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // The marketing route group is SSR with no Redux Provider, so theme is
  // managed locally here: read the persisted value (shared with the app's ui
  // slice key) on mount, apply the `dark` class, and toggle/persist on click.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let stored;
    try { stored = localStorage.getItem(THEME_KEY); } catch {}
    const dark = stored === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-navy-100 bg-white/85 backdrop-blur-lg shadow-soft'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${COMPANY.name} home`}>
          <Logo size={30} />
          <span className="text-[17px] font-bold tracking-tight text-navy-900">{COMPANY.name}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-navy-700 transition-colors hover:text-navy-900"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:bg-brand-600"
          >
            Get a demo
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 hover:bg-navy-50 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div className="animate-slide-up border-t border-navy-100 bg-white px-5 pb-6 pt-3 shadow-card">
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-navy-700 hover:bg-navy-50"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-navy-100 pt-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800 hover:bg-navy-50"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-navy-200 px-4 py-2.5 text-center text-sm font-semibold text-navy-800 hover:bg-navy-50"
              >
                Sign in
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
              >
                Get a demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
