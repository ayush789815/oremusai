const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oremusai.vensframe.com';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated app surfaces carry no public/indexable content.
      disallow: [
        '/auth/', '/dashboard', '/settings', '/clients', '/reports', '/admin',
        '/employees', '/billing', '/analytics', '/transactions', '/ratios',
        '/accounts', '/customers', '/vendors', '/expenses', '/invoices',
        '/documents', '/notifications',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
