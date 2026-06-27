// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Brain,
  Search,
  ClipboardList,
  Settings,
  Shield,
  LogIn,
  ChevronDown,
} from 'lucide-react';
import { Disclosure } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Cart', href: '/cart', icon: ShoppingCart },
  { name: 'Sales', href: '/sales', icon: DollarSign },
  { name: 'AI Report', href: '/ai-report', icon: Brain },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Shield },
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 w-60 flex-col bg-slate-800',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">
          G
        </div>
        <div>
          <div className="font-semibold text-white text-sm">DemandGenius</div>
          <div className="text-xs text-slate-400">Demand Planning</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Pharmacy section */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50">
                <span>Pharmacy</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    open && 'rotate-180'
                  )}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </nav>

      {/* Sign in */}
      <div className="border-t border-slate-700 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
          <LogIn className="h-5 w-5" />
          Sign In
        </button>
      </div>
    </aside>
  );
}
