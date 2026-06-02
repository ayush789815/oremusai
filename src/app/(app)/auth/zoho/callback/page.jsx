import { Suspense } from 'react';
import RouteGuard from '@/components/auth/RouteGuard.jsx';
import ZohoCallback from '@/views/ZohoCallback.jsx';

export const metadata = {
  title: 'Connecting Zoho Books',
  robots: { index: false, follow: false },
};

export default function ZohoCallbackPage() {
  return (
    <RouteGuard>
      <Suspense fallback={null}>
        <ZohoCallback />
      </Suspense>
    </RouteGuard>
  );
}
