import MarketingNav from '@/components/marketing/MarketingNav.jsx';
import MarketingFooter from '@/components/marketing/MarketingFooter.jsx';
import BackToTop from '@/components/marketing/BackToTop.jsx';
import JsonLd from '@/components/marketing/JsonLd.jsx';
import { COMPANY, SITE_URL } from '@/components/marketing/data.js';

// Public marketing chrome. Fully server-rendered (no Redux mount-gate) so the
// HTML is crawlable and there is no blank-until-hydrate flash. Authenticated
// app routes live in the sibling (app) group and keep their own Providers.
export default function MarketingLayout({ children }) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/og.png`,
    description: COMPANY.description,
    email: COMPANY.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '535 Mission St',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US',
    },
    sameAs: [COMPANY.social.twitter, COMPANY.social.linkedin, COMPANY.social.github],
  };

  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: COMPANY.name,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-white text-navy-900 antialiased">
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
