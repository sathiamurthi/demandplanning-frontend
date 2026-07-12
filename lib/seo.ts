// Central SEO config — change domain by setting NEXT_PUBLIC_SITE_URL in Vercel env vars
export const SITE = {
  name:        'DemandGeniusAI',
  url:         (process.env.NEXT_PUBLIC_SITE_URL || 'https://dplan-ebon.vercel.app').replace(/\/$/, ''),
  tagline:     'Agentic Intelligence Delivered.',
  description: 'AI-powered multi-tenant platform for local commerce and enterprise automation — inventory & demand forecasting, PigeonSearch AI local search, and a growing suite of autonomous agent products: EnterpriseAgent360 (multi-agent workflow automation), Lex360 (legacy Excel to web app), and Route360 (logistics matching).',
  email:       'paariwalaconnect@gmail.com',
  locale:      'en_IN',
  twitter:     '@demandgeniusai',
  keywords:    [
    'agentic AI platform', 'AI inventory management', 'demand forecasting software',
    'multi-tenant SaaS India', 'multi-agent orchestration', 'enterprise AI automation',
    'legacy Excel to web app', 'logistics route matching India', 'tea procurement software',
    'local store search AI', 'DemandGeniusAI', 'EnterpriseAgent360', 'Lex360', 'Route360',
    'college career platform', 'job search India',
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
