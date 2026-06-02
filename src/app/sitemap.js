const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oremusai.vensframe.com';

// Public, indexable marketing surfaces. The authenticated app is JWT-gated and
// intentionally excluded.
export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/features', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/login', priority: 0.5, changeFrequency: 'yearly' },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
