// app/admin/dynamic/page.tsx — redirects to dashboard
// The layout.tsx in this folder provides AppShell for all /admin/dynamic/* routes
import { redirect } from "next/navigation";

export default function DynamicPage() {
  redirect("/admin/dynamic/dashboard");
}
