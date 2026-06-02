import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';
import Ratios from '@/views/Ratios.jsx';

export const metadata = { title: 'Ratios' };

export default function RatiosPage() {
  return (
    <ErrorBoundary>
      <Ratios />
    </ErrorBoundary>
  );
}
