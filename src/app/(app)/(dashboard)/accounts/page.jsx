import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Accounts from '@/views/Accounts.jsx';

export const metadata = { title: 'Accounts' };

export default function AccountsPage() {
  return (
    <ErrorBoundary>
      <Accounts />
    </ErrorBoundary>
  );
}
