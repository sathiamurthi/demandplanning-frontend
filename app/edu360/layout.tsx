import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'Edu360 — School Academic Profiles & Report Cards',
    description: 'Edu360 helps schools manage academic profiles, report cards, and student progress tracking.',
    path: '/edu360',
  }),
  manifest: '/edu360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
