import React from 'react';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <Navbar />
      <div className="lg:pl-60">
        <div className="pt-14 lg:pt-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="mb-6">
              <h1 className="font-heading text-2xl lg:text-3xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}