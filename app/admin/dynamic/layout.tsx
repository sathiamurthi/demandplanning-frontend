"use client";

import { AppShell } from "./appshell";

export default function DynamicAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
