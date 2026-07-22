import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'College360 — Admissions & Academic Profiles',
    description: 'College360 helps students build academic profiles and helps institutions manage admissions and career tools.',
    path: '/college360',
  }),
  // Own manifest (not the root /explore one) so College360 installs as its
  // own distinct app — own name, icon set, start_url, scope.
  manifest: '/college360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
