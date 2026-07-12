import { MetadataRoute } from 'next';
import { SITE } from '../lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: 'DemandGeniusAI',
    description: SITE.description,
    start_url: '/explore',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0ea5e9',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Explore Services',
        short_name: 'Explore',
        description: 'Browse and search for services',
        url: '/explore',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Help Guide',
        short_name: 'Help',
        description: 'User guide and documentation',
        url: '/help',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
