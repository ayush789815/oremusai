import RouteGuard from '@/components/auth/RouteGuard.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Clients from '@/views/Clients.jsx';

export const metadata = { title: 'Clients' };

export default function ClientsPage() {
  return (
    <RouteGuard roles={['admin']}>
      <ErrorBoundary>
        <Clients />
      </ErrorBoundary>
    </RouteGuard>
  );
}
