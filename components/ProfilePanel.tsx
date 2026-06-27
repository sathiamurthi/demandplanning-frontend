// components/ProfilePanel.tsx
import { LogOut, User } from "lucide-react";

export default function ProfilePanel() {
  return (
    <div className="flex items-center gap-4 bg-[#161a23] p-3 rounded-lg">
      <div className="flex flex-col">
        <span className="text-white text-sm font-semibold">Admin User</span>
        <span className="text-white/40 text-xs">admin@company.com</span>
      </div>
      <button className="text-white/70 hover:text-white flex items-center gap-1 text-xs">
        <User size={14} /> Profile
      </button>
      <button className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs">
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}
