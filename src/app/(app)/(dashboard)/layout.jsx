'use client';

import RouteGuard from '@/components/auth/RouteGuard.jsx';
import DashboardLayout from '@/layouts/DashboardLayout.jsx';

// All routes in this group require authentication (mirrors the old
// <Route element={<P><DashboardLayout/></P>}> wrapper). Per-route role and
// permission gates are applied by each page via <RouteGuard>.
export default function DashboardGroupLayout({ children }) {
  return (
    <RouteGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </RouteGuard>
  );
}
