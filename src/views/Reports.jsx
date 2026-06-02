'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import ZohoReportsLayout from '../components/reports/zoho/ZohoReportsLayout.jsx';
import QBReportsLayout from '../components/reports/quickbooks/QBReportsLayout.jsx';
import XeroReportsLayout from '../components/reports/xero/XeroReportsLayout.jsx';
import { setProvider } from '../features/reports/reportsSlice.js';
import { isValidProvider } from '../features/reports/data/providers.js';

const LAYOUTS = {
  zoho:       ZohoReportsLayout,
  quickbooks: QBReportsLayout,
  xero:       XeroReportsLayout,
};

export default function Reports() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { provider } = useParams();

  // Sync the slice provider whenever the URL segment changes.
  useEffect(() => {
    if (provider && isValidProvider(provider)) {
      dispatch(setProvider(provider));
    }
  }, [dispatch, provider]);

  const invalid = !provider || !isValidProvider(provider);

  useEffect(() => {
    if (invalid) router.replace('/reports/zoho');
  }, [invalid, router]);

  if (invalid) return null;

  const Layout = LAYOUTS[provider] || ZohoReportsLayout;
  return <Layout />;
}
