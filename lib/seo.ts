// Central SEO config — change domain by setting NEXT_PUBLIC_SITE_URL in Vercel env vars
export const SITE = {
  name:        'DemandGenius',
  url:         (process.env.NEXT_PUBLIC_SITE_URL || 'https://dplan-ebon.vercel.app').replace(/\/$/, ''),
  tagline:     'Hotel & Event Service Marketplace — India',
  description: 'Find hotels, catering, transport, and event services across India. Create a service inquiry, send branded outreach to vendors by email or WhatsApp, and track responses in real time — no vendor login required.',
  email:       'paariwalaconnect@gmail.com',
  locale:      'en_IN',
  twitter:     '@demandgenius',
  keywords:    [
    'hotel booking India', 'event catering service', 'service marketplace India',
    'vendor outreach platform', 'hotel inquiry system', 'demand planning software',
    'hospitality services India', 'wedding catering enquiry', 'corporate event management',
    'WhatsApp vendor outreach', 'multi-tenant SaaS India', 'inventory management',
    'DemandGenius', 'hotel search India',
  ],
};

export type PageMeta = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildMeta(page?: PageMeta) {
  const title       = page?.title ? `${page.title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const description = page?.description || SITE.description;
  const url         = `${SITE.url}${page?.path || ''}`;
  const ogImage     = `${SITE.url}/og-image.png`;

  const base = (() => { try { return new URL(SITE.url); } catch { return new URL('https://dplan-ebon.vercel.app'); } })();
  return {
    metadataBase:       base,
    title,
    description,
    keywords:           SITE.keywords.join(', '),
    authors:            [{ name: SITE.name, url: SITE.url }],
    creator:            SITE.name,
    publisher:          SITE.name,
    alternates:         { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName:  SITE.name,
      locale:    SITE.locale,
      type:      'website',
      images:    [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      site:        SITE.twitter,
      images:      [ogImage],
    },
    robots: page?.noIndex
      ? { index: false, follow: false }
      : {
          index: true, follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
        },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

// JSON-LD structured data for the whole site
export const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      email: SITE.email,
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: { '@id': `${SITE.url}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/explore?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};
