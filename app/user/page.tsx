"use client";
import DashboardLayout from "@/components/DashboardLayout";

export default function SuperadminDashboard() {
  return (
    <DashboardLayout title="Superadmin Dashboard" subtitle="Manage tenants, users, and system settings">
      <p>Welcome Superadmin! Use the sidebar to navigate tenants, users, subscriptions, and permissions.</p>
    </DashboardLayout>
  );
}
