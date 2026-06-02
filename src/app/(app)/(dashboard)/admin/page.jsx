import RouteGuard from '@/components/auth/RouteGuard.jsx';
import Placeholder from '@/views/Placeholder.jsx';

export const metadata = { title: 'Admin Console' };

export default function AdminPage() {
  return (
    <RouteGuard roles={['admin']}>
      <Placeholder
        title="Admin Console"
        icon="Shield"
        description="Workspace administration. Admin only."
      />
    </RouteGuard>
  );
}
