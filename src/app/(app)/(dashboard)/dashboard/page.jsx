import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Dashboard from '@/views/Dashboard.jsx';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
