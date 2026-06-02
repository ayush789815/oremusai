'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthed, selectRole, selectUser } from '@/features/auth/authSlice.js';

// Client-side equivalent of the old react-router ProtectedRoute. JWT lives in
// localStorage (client only), so the gate runs on the client. Same precedence:
// not authed -> /login; failing role -> /dashboard; client missing permission
// -> /dashboard.
export default function RouteGuard({ children, roles, permission }) {
  const isAuthed = useSelector(selectIsAuthed);
  const role = useSelector(selectRole);
  const user = useSelector(selectUser);
  const router = useRouter();

  const permissions = Array.isArray(user?.permissions)
    ? user.permissions
    : typeof user?.permissions === 'string'
      ? (() => { try { return JSON.parse(user.permissions); } catch { return []; } })()
      : [];

  let denied = null;
  if (!isAuthed) denied = '/login';
  else if (roles && roles.length && !roles.includes(role)) denied = '/dashboard';
  else if (permission && role === 'client' && !permissions.includes(permission)) denied = '/dashboard';

  useEffect(() => {
    if (denied) router.replace(denied);
  }, [denied, router]);

  if (denied) return null;
  return children;
}
