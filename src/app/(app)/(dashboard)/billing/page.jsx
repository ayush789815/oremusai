import RouteGuard from '@/components/auth/RouteGuard.jsx';
import Placeholder from '@/views/Placeholder.jsx';

export const metadata = { title: 'Billing' };

export default function BillingPage() {
  return (
    <RouteGuard roles={['client']}>
      <Placeholder
        title="Billing"
        icon="Wallet"
        description="Plans and invoices. Clients only."
      />
    </RouteGuard>
  );
}
