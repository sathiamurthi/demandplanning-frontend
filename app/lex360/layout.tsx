import { buildMeta } from '../../lib/seo';
export const metadata = {
  ...buildMeta({
    title: 'Lex360 — Legacy Excel to Web App',
    description: 'Lex360 turns brittle, macro-laden Excel workflows into a fast, shareable web application.',
    path: '/lex360',
  }),
  manifest: '/lex360-manifest.json',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
