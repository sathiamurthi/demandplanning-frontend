import { MetadataRoute } from 'next';
import { SITE } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/help', '/faq', '/login', '/register', '/search', '/guest'],
        disallow: ['/admin/', '/superadmin/', '/api/', '/grower/', '/_next/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host:    SITE.url,
  };
}
