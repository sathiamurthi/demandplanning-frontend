// src/components/layout/AppShell.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Mobile navigation */}
      <MobileNav 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="min-h-dvh">
          {children}
        </div>
      </main>
    </div>
  );
}
