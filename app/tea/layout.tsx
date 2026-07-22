import { buildMeta } from '../../lib/seo';
import TeaLayoutClient from './TeaLayoutClient';

// Own manifest (not the root /explore one) so TeaFactory360 installs as its
// own distinct app — own name, icon set, start_url, scope. Metadata can only
// be exported from a server component, so the actual sidebar/nav (which
// needs client-side auth/localStorage) lives in TeaLayoutClient.
export const metadata = {
  ...buildMeta({
    title: 'TeaFactory360 — Tea Procurement & Factory Management',
    description: 'TeaFactory360 manages grower collections, dispatch, settlements, payments, fleet, inventory, and sales for tea procurement.',
    path: '/tea',
  }),
  manifest: '/teafactory360-manifest.json',
};

export default function TeaLayout({ children }: { children: React.ReactNode }) {
  return <TeaLayoutClient>{children}</TeaLayoutClient>;
}
