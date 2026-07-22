import { buildMeta } from '../../lib/seo';
import GrowerLayoutClient from './GrowerLayoutClient';

// Own manifest so the Grower Portal installs as its own distinct app —
// separate from TeaFactory360's own /tea manifest, since this is a
// different top-level route/role. Metadata can only be exported from a
// server component, so the client-side auth/nav shell lives separately.
export const metadata = {
  ...buildMeta({
    title: 'TeaFactory360 Grower Portal',
    description: 'Workers & wages, collections, and settlements for tea growers.',
    path: '/grower',
  }),
  manifest: '/grower-manifest.json',
};

export default function GrowerLayout({ children }: { children: React.ReactNode }) {
  return <GrowerLayoutClient>{children}</GrowerLayoutClient>;
}
