'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import ZohoReportsLayout from '../components/reports/zoho/ZohoReportsLayout.jsx';
import { setProvider } from '../features/reports/reportsSlice.js';
import { isValidProvider, DEFAULT_PROVIDER } from '../features/reports/data/providers.js';

// All providers (Zoho / QuickBooks / Xero) share the same card-grid Reports
// layout so a client sees the identical 37-report experience regardless of
// which platform they're connected to. The layout is provider-agnostic — it
// reads the active provider from the slice and the common report catalog — and
// the live-data flow stays provider-aware in reportsAPI.
const LAYOUTS = {
  zoho:       ZohoReportsLayout,
  quickbooks: ZohoReportsLayout,
  xero:       ZohoReportsLayout,
};

export default function Reports() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { provider } = useParams();

  // Clean `/reports` (no provider segment) defaults to Zoho; an explicit
  // segment (`/reports/quickbooks`, `/reports/xero`) still selects that provider.
  const effective = provider && isValidProvider(provider) ? provider : DEFAULT_PROVIDER;

  // Sync the slice provider whenever the resolved provider changes.
  useEffect(() => {
    dispatch(setProvider(effective));
  }, [dispatch, effective]);

  // An explicit but invalid segment redirects to the clean Reports URL.
  const invalidSegment = !!provider && !isValidProvider(provider);
  useEffect(() => {
    if (invalidSegment) router.replace('/reports');
  }, [invalidSegment, router]);

  if (invalidSegment) return null;

  const Layout = LAYOUTS[effective] || ZohoReportsLayout;
  return <Layout />;
}
