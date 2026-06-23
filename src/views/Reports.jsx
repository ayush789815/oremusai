'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import ZohoReportsLayout from '../components/reports/zoho/ZohoReportsLayout.jsx';
import {
  setProvider, openReport, closeReport, selectOpenReport,
} from '../features/reports/reportsSlice.js';
import { isValidProvider, DEFAULT_PROVIDER } from '../features/reports/data/providers.js';
import { findReportBySlug } from '../features/reports/data/slugs.js';
import { selectUser } from '../features/auth/authSlice.js';

// All providers (Zoho / QuickBooks / Xero) share the same card-grid Reports
// layout, so the URL no longer carries a provider segment. The active provider
// is derived from the logged-in user's connected platform (integrationType).
// Each report deep-links to its own URL — /reports/<slug> (e.g.
// /reports/profit-and-loss) — and the URL is the source of truth for which
// report viewer is open: navigating to a slug opens it; clearing it closes it.
export default function Reports() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { reportSlug } = useParams();
  const user = useSelector(selectUser);
  const openRep = useSelector(selectOpenReport);
  const wasOpenRef = useRef(false);

  // Provider comes from the user's connection, not the URL.
  const connected = user?.integrationType;
  const effective = connected && isValidProvider(connected) ? connected : DEFAULT_PROVIDER;

  // Sync the slice provider whenever the resolved provider changes.
  useEffect(() => {
    dispatch(setProvider(effective));
  }, [dispatch, effective]);

  // URL -> state: open the report named by the slug (or close when there's no
  // slug). Invalid slugs redirect to the clean Reports grid.
  useEffect(() => {
    if (reportSlug) {
      const rep = findReportBySlug(effective, reportSlug);
      if (!rep) {
        router.replace('/reports');
        return;
      }
      // Avoid redundant re-open (which would refetch) if it's already the one open.
      if (openRep?.name !== rep.name) {
        dispatch(openReport({ name: rep.name, category: rep.category }));
      }
    } else if (openRep) {
      dispatch(closeReport());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportSlug, effective]);

  // state -> URL: when the viewer is closed internally (Back / Esc / provider
  // switch) drop the slug so the URL reflects the closed grid. The ref guards
  // against the initial mount (openRep is null before the URL->state effect has
  // opened the report) — we only navigate on a genuine open->closed transition.
  useEffect(() => {
    if (openRep) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current && reportSlug) {
      wasOpenRef.current = false;
      router.replace('/reports');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRep]);

  return <ZohoReportsLayout />;
}
