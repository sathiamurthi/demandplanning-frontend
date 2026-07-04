import { buildMeta } from '../../lib/seo';
export const metadata = buildMeta({
  title: 'FAQ — Frequently Asked Questions',
  description: 'Answers to common questions about DemandGenius: how to create service inquiries, send vendor outreach, track responses, and more.',
  path: '/faq',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
