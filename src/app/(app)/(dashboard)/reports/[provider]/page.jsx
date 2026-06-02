import RouteGuard from '@/components/auth/RouteGuard.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Reports from '@/views/Reports.jsx';

export const metadata = { title: 'Reports' };

export default function ReportsProviderPage() {
  return (
    <RouteGuard permission="Reports">
      <ErrorBoundary>
        <Reports />
      </ErrorBoundary>
    </RouteGuard>
  );
}
