import { Suspense } from 'react';
import RouteGuard from '@/components/auth/RouteGuard.jsx';
import XeroCallback from '@/views/XeroCallback.jsx';

export const metadata = {
  title: 'Connecting Xero',
  robots: { index: false, follow: false },
};

export default function XeroCallbackPage() {
  return (
    <RouteGuard>
      <Suspense fallback={null}>
        <XeroCallback />
      </Suspense>
    </RouteGuard>
  );
}
