// Central SEO config — change domain by setting NEXT_PUBLIC_SITE_URL in Vercel env vars
//
// Defensive cleanup below: a stray UTF-8 BOM (or trailing whitespace) pasted
// into the Vercel env var value previously survived into every canonical/
// og:url tag on the site (rendered as a garbled, self-referential URL like
// ".../%EF%BB%BFhttps:/..."), which actively hurt Google's ability to
// understand which domain is authoritative. Stripping it here means a future
// bad paste degrades gracefully instead of corrupting every page's SEO tags.
function cleanUrl(raw: string | undefined, fallback: string): string {
  const cleaned = (raw || '').replace(/^﻿/, '').trim().replace(/\/$/, '');
  return cleaned || fallback;
}

export const SITE = {
  name:        'DemandGeniusAI',
  url:         cleanUrl(process.env.NEXT_PUBLIC_SITE_URL, 'https://www.demandgeniusai.com'),
  tagline:     'Agentic Intelligence Delivered.',
  description: 'DemandGeniusAI is an agentic AI platform delivering a growing suite of autonomous, industry-specific applications: AI-powered inventory & demand forecasting for retail/pharma/grocery/auto-parts, Data360 (AI data-entry & document automation), EnterpriseAgent360 (multi-agent enterprise workflow orchestration), Lex360 (AI code generation — turns legacy Excel macros into web apps), Route360 (logistics route matching), Ride360 & SafeRide360 (ride tracking and school transport safety), TeaFactory360 (tea estate & factory ERP), College360, Edu360, and Nexus Talent/Jobs (education, academic profiles & career tools), plus PigeonSearch AI local commerce search. Built and supported by the DemandGeniusAI team — contact paariwalaconnect@gmail.com.',
  email:       'paariwalaconnect@gmail.com',
  locale:      'en_IN',
  twitter:     '@demandgeniusai',
  keywords:    [
    'agentic AI platform', 'AI tools India', 'AI code generation', 'AI data entry automation',
    'enterprise agent AI', 'multi-agent orchestration', 'enterprise AI automation',
    'AI inventory management', 'demand forecasting software', 'multi-tenant SaaS India',
    'legacy Excel to web app', 'logistics route matching India', 'ride tracking app',
    'school transport safety app', 'tea procurement software', 'tea factory ERP',
    'local store search AI', 'college admissions platform', 'school report card software',
    'job search India', 'career platform India',
    'DemandGeniusAI', 'Data360', 'EnterpriseAgent360', 'Lex360', 'Route360',
    'Ride360', 'SafeRide360', 'TeaFactory360', 'College360', 'Edu360', 'Nexus Talent',
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

// One SoftwareApplication entry per product, so Google's structured-data
// parser sees an explicit, named portfolio instead of inferring the site's
// identity purely from whichever page's prose it happens to weight highest.
const PRODUCTS: { name: string; path: string; category: string; description: string }[] = [
  { name: 'Data360', path: '/data360', category: 'BusinessApplication', description: 'AI-powered data entry, document extraction, and validation pipeline — ingests Excel, PDF, screenshots, and voice, with a human approval gate.' },
  { name: 'EnterpriseAgent360', path: '/enterprise360', category: 'BusinessApplication', description: 'Autonomous multi-agent AI that plans, executes, and orchestrates enterprise workflows end-to-end — forecasting, procurement, and reporting.' },
  { name: 'Lex360', path: '/lex360', category: 'DeveloperApplication', description: 'AI code generation tool that turns legacy, macro-laden Excel workflows into a fast, shareable web application.' },
  { name: 'Route360', path: '/route360', category: 'BusinessApplication', description: 'Logistics and delivery route matching for faster, smarter planning.' },
  { name: 'Ride360', path: '/ride360', category: 'TravelApplication', description: 'Ride tracking for auto, cab, and transport drivers — live map, AI cost tips, and ride/parcel matching.' },
  { name: 'SafeRide360', path: '/saferide360', category: 'TravelApplication', description: 'Live pickup/drop tracking and notifications for safe school and organizational transport.' },
  { name: 'TeaFactory360', path: '/tea', category: 'BusinessApplication', description: 'Tea estate and factory ERP — grower collections, production, dispatch, payroll, sales, and compliance.' },
  { name: 'College360', path: '/college360', category: 'EducationalApplication', description: 'Academic profiles, admissions, and career tools for students and institutions.' },
  { name: 'Edu360', path: '/edu360', category: 'EducationalApplication', description: 'School academic profiles, report cards, and student progress tracking.' },
  { name: 'Nexus Talent (Jobs)', path: '/jobs', category: 'BusinessApplication', description: 'Job search and hiring platform connecting job seekers and employers in India.' },
];

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
      contactPoint: [{
        '@type': 'ContactPoint',
        email: SITE.email,
        contactType: 'customer support',
        areaServed: 'IN',
      }],
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
    ...PRODUCTS.map(p => ({
      '@type': 'SoftwareApplication',
      '@id': `${SITE.url}${p.path}/#app`,
      name: p.name,
      url: `${SITE.url}${p.path}`,
      applicationCategory: p.category,
      description: p.description,
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', category: 'SaaS' },
      publisher: { '@id': `${SITE.url}/#organization` },
    })),
  ],
};
