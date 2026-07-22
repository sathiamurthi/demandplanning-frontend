import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'Ride360 — Track Rides, Beat Empty Km, Grow Your Piggy',
    description: 'Ride360 helps auto, cab, and transport drivers track every paid ride (self, Ola, Uber) source-to-destination on a live map, get AI cost tips on empty runs, match with nearby ride or parcel requests, and auto-save a slice of every fare.',
    path: '/ride360',
  }),
  // Own manifest (not the root /explore one) so Ride360 installs as its own
  // distinct app — own name, icon set, start_url, scope.
  manifest: '/ride360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
