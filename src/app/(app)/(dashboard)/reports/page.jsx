import RouteGuard from '@/components/auth/RouteGuard.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Reports from '@/views/Reports.jsx';

export const metadata = { title: 'Reports' };

// Clean `/reports` URL — renders the Reports view, which defaults to the Zoho
// provider when no `[provider]` segment is present.
export default function ReportsIndexPage() {
  return (
    <RouteGuard permission="Reports">
      <ErrorBoundary>
        <Reports />
      </ErrorBoundary>
    </RouteGuard>
  );
}
