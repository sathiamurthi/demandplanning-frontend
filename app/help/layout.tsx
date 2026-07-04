import { buildMeta } from '../../lib/seo';
export const metadata = buildMeta({
  title: 'Help Guide — Complete Platform Documentation',
  description: 'Full user guide for DemandGenius: Explore & Search, Service Inquiries, Vendor Outreach via Email & WhatsApp, Thread Tracking, Admin Panel, and WhatsApp Bot.',
  path: '/help',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
