import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'ExamHub360 — Autonomous Data Entry & Validation Pipeline',
    description: 'ExamHub360 (powered by the Autonomous Study Pack Generator) ingests Excel, PDF, screenshots, and voice dictation, runs an AI validation agent with a human approval gate, then distributes verified data to file exports, cloud storage, or RPA targets.',
    path: '/examhub360',
  }),
  manifest: '/examhub360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
