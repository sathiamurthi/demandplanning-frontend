import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'EnterpriseAgent360 — Agentic Intelligence Delivered.',
    description: 'Autonomous multi-agent AI that plans, executes, and orchestrates enterprise workflows end-to-end — forecasting, procurement, and reporting, coordinated without manual handoffs.',
    path: '/enterprise360',
  }),
  manifest: '/enterprise360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
