import { MetadataRoute } from 'next';
import { SITE } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { url: '/',              priority: 1.0, changeFrequency: 'weekly'  as const },
    { url: '/explore',       priority: 0.95, changeFrequency: 'daily'   as const },
    { url: '/help',          priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: '/faq',           priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: '/login',         priority: 0.7,  changeFrequency: 'monthly' as const },
    { url: '/register',      priority: 0.7,  changeFrequency: 'monthly' as const },
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
