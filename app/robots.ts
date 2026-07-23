import { MetadataRoute } from 'next';
import { SITE } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/', '/explore', '/help', '/faq', '/login', '/register', '/search', '/guest',
          '/data360', '/enterprise360', '/lex360', '/route360', '/ride360', '/saferide360',
          '/tea', '/tea-login', '/tea-register', '/college360', '/edu360', '/jobs',
        ],
        disallow: ['/admin/', '/superadmin/', '/api/', '/grower/', '/_next/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host:    SITE.url,
  };
}
