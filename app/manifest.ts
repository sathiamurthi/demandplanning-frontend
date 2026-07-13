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
      { src: '/nexus-icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/nexus-icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Explore Services',
        short_name: 'Explore',
        description: 'Browse and search for services',
        url: '/explore',
        icons: [{ src: '/nexus-icon-192.svg', sizes: '192x192' }],
      },
      {
        name: 'Help Guide',
        short_name: 'Help',
        description: 'User guide and documentation',
        url: '/help',
        icons: [{ src: '/nexus-icon-192.svg', sizes: '192x192' }],
      },
    ],
  };
}
