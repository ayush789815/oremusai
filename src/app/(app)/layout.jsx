import Providers from '@/components/providers/Providers.jsx';

// The authenticated application (login, OAuth callbacks, dashboard). These
// routes need the Redux store + the SPA mount-gate (renders nothing until JS
// mounts) so persisted localStorage state never causes a hydration mismatch.
// The public (marketing) group deliberately does NOT use this — it is fully
// server-rendered for SEO. Route groups do not affect URLs, so /login,
// /dashboard, /auth/* are unchanged.
export default function AppGroupLayout({ children }) {
  return <Providers>{children}</Providers>;
}
