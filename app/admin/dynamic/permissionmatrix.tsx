"use client";

/**
 * PermissionMatrix — visual role × action permission editor
 *
 * Usage:
 *   const { matrix, can, toggle, reset, isDirty } = usePermissions("items");
 *   <PermissionMatrix matrix={matrix} onToggle={toggle} />
 */

import React, { useState, useCallback } from "react";
import { Shield, RotateCcw, Save } from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

export type Role   = "admin" | "manager" | "staff" | "viewer";
export type Action = "read" | "create" | "update" | "delete";

export type PermMatrix = Record<Action, Record<Role, boolean>>;

export const DEFAULT_MATRIX: PermMatrix = {
  read:   { admin: true,  manager: true,  staff: true,  viewer: true  },
  create: { admin: true,  manager: true,  staff: false, viewer: false },
  update: { admin: true,  manager: true,  staff: false, viewer: false },
  delete: { admin: true,  manager: false, staff: false, viewer: false },
};

const ROLES:   Role[]   = ["admin", "manager", "staff", "viewer"];
const ACTIONS: Action[] = ["read", "create", "update", "delete"];

const ROLE_META: Record<Role, { label: string; color: string; bg: string }> = {
  admin:   { label: "Admin",   color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  manager: { label: "Manager", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"     },
  staff:   { label: "Staff",   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200"},
  viewer:  { label: "Viewer",  color: "text-gray-600",   bg: "bg-gray-100 border-gray-200"     },
};

const ACTION_META: Record<Action, { label: string; icon: string }> = {
  read:   { label: "Read",   icon: "👁" },
  create: { label: "Create", icon: "＋" },
  update: { label: "Edit",   icon: "✎" },
  delete: { label: "Delete", icon: "✕" },
};

/* ─────────────────────────── usePermissions hook ─────────────────────────── */

export function usePermissions(module: string) {
  const storageKey = `perms__${module}`;

  const loadSaved = (): PermMatrix => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as PermMatrix) : DEFAULT_MATRIX;
    } catch {
      return DEFAULT_MATRIX;
    }
  };

  const [matrix, setMatrix] = useState<PermMatrix>(loadSaved);
  const [saved, setSaved]   = useState<PermMatrix>(loadSaved);

  const isDirty = JSON.stringify(matrix) !== JSON.stringify(saved);

  const can = useCallback(
    (role: Role, action: Action): boolean => matrix[action]?.[role] ?? false,
    [matrix]
  );

  const toggle = useCallback((action: Action, role: Role) => {
    /* Admin always keeps all permissions */
    if (role === "admin") return;
    setMatrix((prev) => ({
      ...prev,
      [action]: { ...prev[action], [role]: !prev[action][role] },
    }));
  }, []);

  const save = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(matrix));
    } catch { /* no-op in SSR */ }
    setSaved(matrix);
  }, [matrix, storageKey]);

  const reset = useCallback(() => {
    setMatrix(DEFAULT_MATRIX);
    setSaved(DEFAULT_MATRIX);
    try { localStorage.removeItem(storageKey); } catch { /* no-op */ }
  }, [storageKey]);

  return { matrix, can, toggle, save, reset, isDirty };
}

/* ─────────────────────────── PermissionMatrix UI ─────────────────────────── */

type PermissionMatrixProps = {
  matrix: PermMatrix;
  onToggle: (action: Action, role: Role) => void;
  onSave?: () => void;
  onReset?: () => void;
  isDirty?: boolean;
  /** Show the save/reset toolbar (default true) */
  showToolbar?: boolean;
  /** Read-only view — no toggles */
  readOnly?: boolean;
};

export function PermissionMatrix({
  matrix,
  onToggle,
  onSave,
  onReset,
  isDirty,
  showToolbar = true,
  readOnly = false,
}: PermissionMatrixProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Permission matrix</span>
        </div>
        {showToolbar && (
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 border border-amber-200">
                Unsaved changes
              </span>
            )}
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              onClick={onSave}
              disabled={!isDirty}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pl-5 pr-4 text-left text-xs font-medium text-gray-400 w-32">
                Action
              </th>
              {ROLES.map((role) => {
                const m = ROLE_META[role];
                return (
                  <th key={role} className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.bg} ${m.color}`}
                    >
                      {m.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ACTIONS.map((action) => {
              const am = ACTION_META[action];
              return (
                <tr key={action} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 pl-5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{am.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{am.label}</span>
                    </div>
                  </td>
                  {ROLES.map((role) => {
                    const allowed = matrix[action]?.[role] ?? false;
                    const locked  = role === "admin"; // admin is always on

                    return (
                      <td key={role} className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={readOnly || locked}
                          onClick={() => onToggle(action, role)}
                          aria-label={`${allowed ? "Revoke" : "Grant"} ${am.label} for ${role}`}
                          className={`
                            inline-flex h-6 w-11 items-center rounded-full transition-colors
                            focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${allowed
                              ? "bg-emerald-500 focus:ring-emerald-500"
                              : "bg-gray-200 focus:ring-gray-400"
                            }
                            ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-80"}
                            ${readOnly ? "cursor-default" : ""}
                          `}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
                              ${allowed ? "translate-x-6" : "translate-x-1"}
                            `}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
        <p className="text-xs text-gray-400">
          Admin permissions are locked and cannot be revoked.
          Changes are local until saved.
        </p>
      </div>
    </div>
  );
}