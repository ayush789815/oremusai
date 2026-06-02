import RouteGuard from '@/components/auth/RouteGuard.jsx';
import Placeholder from '@/views/Placeholder.jsx';

export const metadata = { title: 'Employees' };

export default function EmployeesPage() {
  return (
    <RouteGuard roles={['admin']}>
      <Placeholder
        title="Employees"
        icon="Briefcase"
        description="Team and permissions. Admin only."
      />
    </RouteGuard>
  );
}
