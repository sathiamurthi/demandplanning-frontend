"use client";

import React, { useState } from "react";
import { Shield, Save, RotateCcw, CheckCircle2, Users } from "lucide-react";
import { PermissionMatrix, usePermissions } from "../permissionmatrix";

const MODULES = [
  { id: "items",           label: "Items / Inventory",    description: "View, create and edit stock items" },
  { id: "purchase-orders", label: "Purchase Orders",      description: "Create and manage POs with suppliers" },
  { id: "ledger",          label: "Stock Ledger",         description: "View and audit stock movements" },
  { id: "reports",         label: "AI Reports",           description: "Access AI demand forecasts" },
  { id: "users",           label: "User Management",      description: "Invite and manage team members" },
  { id: "settings",        label: "Settings & Config",    description: "Store settings and AI configuration" },
];

function ModuleCard({ moduleId, label, description }: { moduleId: string; label: string; description: string }) {
  const { matrix, toggle, save, reset, isDirty } = usePermissions(moduleId);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <PermissionMatrix
          matrix={matrix}
          onToggle={toggle}
          onSave={handleSave}
          onReset={reset}
          isDirty={isDirty}
        />
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
          <Shield className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Permissions</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Control what each role can do across modules. Changes are saved per device.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <Users className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          These permissions are stored locally and control UI visibility.
          Backend role guards still apply server-side.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {MODULES.map(mod => (
          <ModuleCard key={mod.id} moduleId={mod.id} label={mod.label} description={mod.description} />
        ))}
      </div>
    </div>
  );
}
