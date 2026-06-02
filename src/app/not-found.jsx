import Link from 'next/link';
import Logo from '@/components/ui/Logo.jsx';

// Global 404. Self-contained (no Redux) so it renders correctly outside the
// authenticated app's provider tree.
export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-white px-6">
      <div className="aurora pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Oremus AI home">
          <Logo size={36} />
          <span className="text-lg font-bold tracking-tight text-navy-900">Oremus AI</span>
        </Link>
        <p className="mt-10 text-7xl font-extrabold tracking-tighter text-gradient sm:text-8xl">404</p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-500">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:bg-brand-600 sm:w-auto"
          >
            Back to home
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-navy-200 px-6 py-3 text-sm font-semibold text-navy-800 transition-all hover:bg-navy-50 sm:w-auto"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
