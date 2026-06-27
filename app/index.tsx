import Header from "@/components/Header";
import Card from "@/components/Card";

export const metadata = {
  title: "Demand Genius Clone",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Lead Generation" description="Automate your outreach." />
        <Card title="Analytics" description="Track performance metrics." />
        <Card title="Integrations" description="Connect with your tools." />
      </main>
    </div>
  );
}