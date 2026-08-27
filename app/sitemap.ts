import { MetadataRoute } from 'next';
import { SITE } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { url: '/',              priority: 1.0, changeFrequency: 'weekly'  as const },
    { url: '/explore',       priority: 0.95, changeFrequency: 'daily'   as const },
    // Product pages — each is its own SEO-distinct application (own
    // title/description via its layout.tsx), listed explicitly so Google
    // discovers and indexes them as first-class pages rather than relying
    // on internal-link discovery alone.
    { url: '/examhub360',       priority: 0.9,  changeFrequency: 'weekly'  as const },
    { url: '/enterprise360', priority: 0.9,  changeFrequency: 'weekly'  as const },
    { url: '/lex360',        priority: 0.9,  changeFrequency: 'weekly'  as const },
    { url: '/route360',      priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/ride360',       priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/saferide360',   priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/tea',           priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/college360',    priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/edu360',        priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/jobs',          priority: 0.85, changeFrequency: 'weekly'  as const },
    { url: '/help',          priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: '/faq',           priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: '/login',         priority: 0.7,  changeFrequency: 'monthly' as const },
    { url: '/register',      priority: 0.7,  changeFrequency: 'monthly' as const },
    { url: '/tea-login',     priority: 0.6,  changeFrequency: 'monthly' as const },
    { url: '/tea-register',  priority: 0.6,  changeFrequency: 'monthly' as const },
    { url: '/search',        priority: 0.6,  changeFrequency: 'daily'   as const },
    { url: '/guest',         priority: 0.5,  changeFrequency: 'weekly'  as const },
  ];
  return pages.map(p => ({
    url:             `${SITE.url}${p.url}`,
    lastModified:    now,
    changeFrequency: p.changeFrequency,
    priority:        p.priority,
  }));
}
