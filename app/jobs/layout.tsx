import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'Nexus Talent — Job Search & Hiring',
    description: 'Nexus Talent connects job seekers and employers with resume tools, search, and hiring workflows.',
    path: '/jobs',
  }),
  manifest: '/jobs-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
