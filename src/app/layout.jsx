import '@/styles/globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oremusai.vensframe.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Oremus AI — Financial Analytics & Reporting Platform',
    template: '%s · Oremus AI',
  },
  description:
    'Oremus AI unifies financial analytics and reporting across Zoho Books, QuickBooks, and Xero. Real-time dashboards, transactions, and ratios in one secure workspace.',
  applicationName: 'Oremus AI',
  keywords: [
    'financial analytics', 'financial reporting', 'Zoho Books', 'QuickBooks', 'Xero',
    'finance dashboard', 'accounting analytics', 'multi-entity reporting', 'SaaS finance platform',
  ],
  authors: [{ name: 'Oremus AI' }],
  creator: 'Oremus AI',
  publisher: 'Oremus AI',
  alternates: { canonical: '/' },
  formatDetection: { email: false, telephone: false, address: false },
  openGraph: {
    type: 'website',
    siteName: 'Oremus AI',
    title: 'Oremus AI — Financial Analytics & Reporting Platform',
    description:
      'Unify financial analytics and reporting across Zoho Books, QuickBooks, and Xero in one secure workspace.',
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Oremus AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oremus AI — Financial Analytics & Reporting Platform',
    description:
      'Unify financial analytics and reporting across Zoho Books, QuickBooks, and Xero.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inter loaded identically to the original Vite index.html for pixel-perfect typography. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
