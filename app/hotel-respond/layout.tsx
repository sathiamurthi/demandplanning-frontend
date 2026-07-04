import { buildMeta } from '../../lib/seo';
export const metadata = buildMeta({
  title: 'Respond to Inquiry',
  description: 'You have received a service inquiry via DemandGenius. Click to view the details and confirm your availability — no account required.',
  path: '/hotel-respond',
  noIndex: true,
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
