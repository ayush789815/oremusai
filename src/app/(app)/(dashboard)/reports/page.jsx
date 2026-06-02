import { redirect } from 'next/navigation';

// Mirrors the old <Navigate to="/reports/zoho" replace />. The target route
// (/reports/[provider]) enforces the "Reports" permission gate.
export default function ReportsIndexPage() {
  redirect('/reports/zoho');
}
