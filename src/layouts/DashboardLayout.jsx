'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import BackToTop from '../components/common/BackToTop.jsx';
import { verifyZohoStatus } from '../features/zoho/zohoSlice.js';
import { verifyQBOStatus } from '../features/quickbooks/quickbooksSlice.js';
import { verifyXeroStatus } from '../features/xero/xeroSlice.js';
import { loadOrganizations } from '../features/orgs/orgsSlice.js';

const TITLES = {
  '/dashboard':     { title: 'Dashboard',     subtitle: 'Bento overview · live financials' },
  '/analytics':     { title: 'AI Analytics',  subtitle: 'Insights and forecasts' },
  '/admin':         { title: 'Admin Console', subtitle: 'Workspace administration' },
  '/transactions':  { title: 'Transactions',  subtitle: 'Day book entries' },
  '/reports':       { title: 'Reports',       subtitle: 'P&L · cashflow · trial balance' },
  '/customers':     { title: 'Customers',     subtitle: 'Receivables and contacts' },
  '/vendors':       { title: 'Vendors',       subtitle: 'Payables and contacts' },
  '/expenses':      { title: 'Expenses',      subtitle: 'Categorized spend' },
  '/invoices':      { title: 'Invoices',      subtitle: 'AR & AP documents' },
  '/documents':     { title: 'Documents',     subtitle: 'Files and receipts' },
  '/notifications': { title: 'Notifications', subtitle: 'Updates and alerts' },
  '/clients':       { title: 'Clients',       subtitle: 'Manage client workspaces' },
  '/employees':     { title: 'Employees',     subtitle: 'Team and permissions' },
  '/billing':       { title: 'Billing',       subtitle: 'Plans and invoices' },
  '/settings':      { title: 'Settings',      subtitle: 'Profile and preferences' },
};

export default function DashboardLayout({ children }) {
  const dispatch     = useDispatch();
  const pathname     = usePathname();
  const meta         = TITLES[pathname] || { title: 'Oremus', subtitle: '' };

  // Silently verify integration connection state on every layout mount
  // so the Settings page and ClientSwitcher reflect the real DB state.
  useEffect(() => {
    dispatch(verifyZohoStatus());
    dispatch(verifyQBOStatus());
    dispatch(verifyXeroStatus());
    dispatch(loadOrganizations());
  }, [dispatch]);

  return (
    <div className="flex min-h-screen bg-navy-50 dark:bg-navy-950">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <Navbar title={meta.title} subtitle={meta.subtitle} />
        <div className="flex-1 animate-fadein">
          {children}
        </div>
      </main>
      <BackToTop />
    </div>
  );
}
