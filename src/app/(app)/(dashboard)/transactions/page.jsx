import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Transactions from '@/views/Transactions.jsx';

export const metadata = { title: 'Transactions' };

export default function TransactionsPage() {
  return (
    <ErrorBoundary>
      <Transactions />
    </ErrorBoundary>
  );
}
