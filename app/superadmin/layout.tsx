"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0d0f14] text-white">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#161a23] transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out z-50`}
      >
        <div className="p-6 font-bold text-xl">Demand Genius</div>
        <nav className="space-y-2 px-4">
          <Link href="/superadmin" className="block py-2 hover:text-[#6c63ff]">Dashboard</Link>
          <Link href="/superadmin/users" className="block py-2 hover:text-[#6c63ff]">Users</Link>
          <Link href="/superadmin/tenants" className="block py-2 hover:text-[#6c63ff]">Tenants</Link>
          <Link href="/superadmin/permissions" className="block py-2 hover:text-[#6c63ff]">Permissions</Link>
          <Link href="/superadmin/notifications" className="block py-2 hover:text-[#6c63ff]">Notifications</Link>
          <Link href="/superadmin/messages" className="block py-2 hover:text-[#6c63ff]">Messages</Link>
          <Link href="/superadmin/subscriptions" className="block py-2 hover:text-[#6c63ff]">Subscriptions</Link>
          <Link href="/superadmin/explore-analytics" className="block py-2 hover:text-[#6c63ff]">Explore Analytics</Link>
          <Link href="/superadmin/ai-usage" className="block py-2 hover:text-orange-400 font-semibold">🤖 AI Usage & Pipeline</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="flex justify-between items-center bg-[#161a23] p-4 shadow-md">
          {/* Hamburger for mobile */}
          <button
            className="lg:hidden text-gray-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          {/* Right side: Profile */}
          <div className="flex items-center space-x-4 ml-auto">
            <div className="relative group">
              <button className="w-10 h-10 rounded-full bg-[#6c63ff] flex items-center justify-center">
                SA
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-40 bg-[#1f2430] rounded shadow-lg hidden group-hover:block">
                <Link href="/superadmin/profile" className="block px-4 py-2 hover:bg-[#2a2f3d]">Profile</Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a2f3d]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
