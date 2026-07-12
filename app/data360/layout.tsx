import { buildMeta } from '../../lib/seo';
export const metadata = buildMeta({
  title: 'Data360 — Autonomous Data Entry & Validation Pipeline',
  description: 'Data360 (powered by the Nexus Flow RPA engine) ingests Excel, PDF, screenshots, and voice dictation, runs an AI validation agent with a human approval gate, then distributes verified data to file exports, cloud storage, or RPA targets.',
  path: '/data360',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
