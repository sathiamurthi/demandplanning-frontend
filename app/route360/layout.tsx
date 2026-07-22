import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'Route360 — Logistics & Route Matching',
    description: 'Route360 matches delivery and logistics routes for faster, smarter planning.',
    path: '/route360',
  }),
  manifest: '/route360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
