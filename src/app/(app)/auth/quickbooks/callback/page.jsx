import { Suspense } from 'react';
import RouteGuard from '@/components/auth/RouteGuard.jsx';
import QuickBooksCallback from '@/views/QuickBooksCallback.jsx';

export const metadata = {
  title: 'Connecting QuickBooks',
  robots: { index: false, follow: false },
};

export default function QuickBooksCallbackPage() {
  return (
    <RouteGuard>
      <Suspense fallback={null}>
        <QuickBooksCallback />
      </Suspense>
    </RouteGuard>
  );
}
