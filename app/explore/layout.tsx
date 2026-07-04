import { buildMeta } from '../../lib/seo';
export const metadata = buildMeta({
  title: 'Explore Services',
  description: 'Search for hotels, catering, transport, and event services across India. Create a service inquiry and contact vendors instantly via email or WhatsApp.',
  path: '/explore',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
