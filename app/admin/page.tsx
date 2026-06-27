// app/admin/dynamic/page.tsx
import Dashboard from "../dashboard/page";
import AppShell  from "./appshell";

export default function DynamicPage() {
  return (
    <AppShell>
      <Dashboard/>
    </AppShell>
  );
}