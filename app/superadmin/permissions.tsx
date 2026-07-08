"use client";
import { useState } from "react";
import { Shield, Check, X, Info } from "lucide-react";

const ROLES = [
  { id: "superadmin", label: "Superadmin",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { id: "admin",      label: "Admin",        color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  { id: "manager",    label: "Manager",      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { id: "staff",      label: "Staff",        color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
];

const PERMISSIONS: { group: string; items: { label: string; desc: string; roles: string[] }[] }[] = [
  {
    group: "Platform",
    items: [
      { label: "View dashboard",        desc: "Access main analytics and KPI summary",     roles: ["superadmin","admin","manager","staff"] },
      { label: "Manage tenants",        desc: "Create, edit, deactivate tenant accounts",  roles: ["superadmin"] },
      { label: "Platform config",       desc: "Toggle features, AI access, modules",       roles: ["superadmin"] },
      { label: "View all tenants",      desc: "Read-only view of all registered tenants",  roles: ["superadmin","admin"] },
    ],
  },
  {
    group: "Inventory & Products",
    items: [
      { label: "View products",         desc: "Browse SKUs, items, categories",            roles: ["superadmin","admin","manager","staff"] },
      { label: "Create / edit products",desc: "Add new SKUs, update prices or stock",      roles: ["superadmin","admin","manager"] },
      { label: "Delete products",       desc: "Permanently remove products or categories", roles: ["superadmin","admin"] },
      { label: "Manage purchase orders",desc: "Create, approve, receive POs",              roles: ["superadmin","admin","manager"] },
    ],
  },
  {
    group: "Sales & Customers",
    items: [
      { label: "View sales",            desc: "Read order history and daily sales",        roles: ["superadmin","admin","manager","staff"] },
      { label: "Create sale",           desc: "Process new sales transactions",            roles: ["superadmin","admin","manager","staff"] },
      { label: "Apply discounts",       desc: "Override price or apply coupon codes",      roles: ["superadmin","admin","manager"] },
      { label: "Void / refund sale",    desc: "Reverse completed transactions",            roles: ["superadmin","admin"] },
    ],
  },
  {
    group: "Users & Permissions",
    items: [
      { label: "View users",            desc: "See registered users under a tenant",       roles: ["superadmin","admin","manager"] },
      { label: "Invite users",          desc: "Send invites and assign roles",             roles: ["superadmin","admin"] },
      { label: "Edit user roles",       desc: "Change role assignments",                   roles: ["superadmin","admin"] },
      { label: "Deactivate users",      desc: "Block access without deleting account",     roles: ["superadmin","admin"] },
    ],
  },
  {
    group: "Reports & Analytics",
    items: [
      { label: "View reports",          desc: "Access standard sales and stock reports",   roles: ["superadmin","admin","manager","staff"] },
      { label: "Export reports",        desc: "Download CSV / PDF report exports",         roles: ["superadmin","admin","manager"] },
      { label: "AI reports",            desc: "Generate AI-driven insights and forecasts", roles: ["superadmin","admin"] },
    ],
  },
  {
    group: "Finance & Ledger",
    items: [
      { label: "View ledger",           desc: "Read-only access to financial ledger",      roles: ["superadmin","admin","manager"] },
      { label: "Edit ledger entries",   desc: "Add or modify ledger transactions",         roles: ["superadmin","admin"] },
      { label: "Manage coupons",        desc: "Create, activate, expire coupon codes",     roles: ["superadmin","admin"] },
      { label: "View subscriptions",    desc: "See tenant billing and plan status",        roles: ["superadmin"] },
    ],
  },
];

export default function Permissions() {
  const [highlight, setHighlight] = useState<string | null>(null);

  const has = (roles: string[], roleId: string) => roles.includes(roleId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
          <Shield size={18} className="text-orange-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Role Permissions</h1>
          <p className="text-xs text-gray-500">Platform access matrix — what each role can do across NexusOS</p>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => setHighlight(highlight === r.id ? null : r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              highlight === r.id
                ? "border-orange-400 ring-2 ring-orange-200 dark:ring-orange-800 " + r.color
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${r.color.split(" ")[0]}`}/>
            {r.label}
            {highlight === r.id && <X size={10}/>}
          </button>
        ))}
        {highlight && (
          <span className="text-xs text-gray-400 self-center ml-1">Click again to clear filter</span>
        )}
      </div>

      {/* Matrix */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
          style={{ gridTemplateColumns: "1fr repeat(4, 100px)" }}>
          <div className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Permission</div>
          {ROLES.map(r => (
            <div key={r.id} className={`py-3 text-center text-[10px] font-bold uppercase tracking-wide ${
              highlight === r.id ? "text-orange-500" : "text-gray-400"
            }`}>
              {r.label}
            </div>
          ))}
        </div>

        {/* Groups */}
        {PERMISSIONS.map(group => (
          <div key={group.group}>
            <div className="px-5 py-2 bg-gray-50/60 dark:bg-gray-700/20 border-b border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.group}</p>
            </div>
            {group.items.map((item, i) => (
              <div
                key={item.label}
                className={`grid border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition ${
                  i === group.items.length - 1 ? "border-gray-100 dark:border-gray-700" : ""
                }`}
                style={{ gridTemplateColumns: "1fr repeat(4, 100px)" }}
              >
                <div className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Info size={9}/>{item.desc}
                  </p>
                </div>
                {ROLES.map(r => {
                  const allowed = has(item.roles, r.id);
                  const dimmed  = highlight && highlight !== r.id;
                  return (
                    <div key={r.id} className={`flex items-center justify-center py-3 transition ${dimmed ? "opacity-25" : ""}`}>
                      {allowed
                        ? <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check size={12} className="text-green-600 dark:text-green-400"/>
                          </span>
                        : <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <X size={10} className="text-gray-300 dark:text-gray-600"/>
                          </span>
                      }
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 flex gap-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This matrix reflects the platform's built-in role hierarchy. Role assignments per tenant are managed in <strong>Tenants → Users</strong>. Dynamic permission overrides per tenant are on the roadmap.
        </p>
      </div>
    </div>
  );
}
