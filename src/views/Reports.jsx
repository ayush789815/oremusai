'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import ZohoReportsLayout from '../components/reports/zoho/ZohoReportsLayout.jsx';
import { setProvider } from '../features/reports/reportsSlice.js';
import { isValidProvider, DEFAULT_PROVIDER } from '../features/reports/data/providers.js';
import { selectUser } from '../features/auth/authSlice.js';

// All providers (Zoho / QuickBooks / Xero) share the same card-grid Reports
// layout, so the URL no longer carries a provider segment. The active provider
// is derived from the logged-in user's connected platform (integrationType) —
// the layout is provider-agnostic and the live-data flow stays provider-aware
// in reportsAPI.
export default function Reports() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { provider } = useParams();
  const user = useSelector(selectUser);

  // Provider comes from the user's connection, not the URL.
  const connected = user?.integrationType;
  const effective = connected && isValidProvider(connected) ? connected : DEFAULT_PROVIDER;

  // Sync the slice provider whenever the resolved provider changes.
  useEffect(() => {
    dispatch(setProvider(effective));
  }, [dispatch, effective]);

  // Legacy `/reports/:provider` links collapse to the clean Reports URL.
  const hasSegment = !!provider;
  useEffect(() => {
    if (hasSegment) router.replace('/reports');
  }, [hasSegment, router]);

  if (hasSegment) return null;

  return <ZohoReportsLayout />;
}
