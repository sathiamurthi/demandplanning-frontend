"use client";

/**
 * entityConfigs — config objects for all admin entities
 *
 * Each config drives a full DynamicEntity CRUD page:
 *   users, stores, store-configs, categories, items
 */

import React from "react";
import { Badge, Button } from "./ui";
import { EntityConfig } from "./dynamicentity";
import {
  USER_FIELDS,
  STORE_FIELDS,
  ITEM_FIELDS,
  PURCHASE_ORDER_FIELDS,
  FieldDef,
} from "./formbuilder";
import { useStore } from "../appshell";

/* ─────────────────────────── Shared helpers ─────────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "error"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function CardShell({
  children,
  pending,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  children: React.ReactNode;
  pending?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {pending && (
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      {children}
      {(canEdit || canDelete) && (
        <div className="mt-4 flex gap-2 border-t border-gray-50 pt-3">
          {canEdit && (
            <Button variant="ghost" className="flex-1 text-xs" onClick={onEdit}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" className="flex-1 text-xs" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return s;
  }
}

/* ═══════════════════════════════════════════════════
   1. USERS
════════════════════════════════════════════════════ */

type User = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  // ✅ new fields for store association
  store_id?: string | null;
  store_name?: string
};

function getInitials(first: string, last?: string | null) {
  return [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function roleBadge(role: string) {
  const map: Record<string, React.ReactNode> = {
    admin:   <Badge variant="info">Admin</Badge>,
    manager: <Badge variant="neutral">Manager</Badge>,
    staff:   <Badge variant="neutral">Staff</Badge>,
    viewer:  <Badge variant="neutral">Viewer</Badge>,
  };
  return map[role] ?? <Badge>{role}</Badge>;
}


export function getUsersConfig(stores: { id: string; name: string }[]): EntityConfig<User> {
  return {
    module: "users",
    storeLevel: false,
    title: "Users",
    singular: "User",
    fields: [
      ...USER_FIELDS,
      {
        key: "store_id",
        label: "Store",
        type: "select",
        options: (stores ?? []).map((s) => ({ value: s.id, label: s.name })),
        required: true,
      },
    ] as FieldDef<User>[],
    blankForm: {
      first_name: "",
      last_name: "",
      email: "",
      role: "staff",
      is_active: true,
      store_id: null,
    },
    searchKeys: ["first_name", "last_name", "email", "role", "store_name"],
    toPayload: (f) => ({
      ...f,
      last_name: (f.last_name as string)?.trim() || null,
      store_id: f.store_id || null,
    }),
    columns: [
      { key: "email", label: "Email" },
      { key: "role", label: "Role", render: (v) => roleBadge(String(v)) },
      {
        key: "store_name",
        label: "Store",
        render: (v) => (
          <span className="text-xs text-gray-600">{(v as string) ?? "—"}</span>
        ),
      },
      { key: "is_active", label: "Status", render: (v) => <StatusBadge active={Boolean(v)} /> },
      { key: "last_login_at", label: "Last login", render: (v) => <span className="text-xs text-gray-400">{formatDate(v as string)}</span> },
    ],
    renderCard: (u, { onEdit, onDelete }, canEdit, canDelete) => (
      <CardShell
        key={u.id}
        pending={(u as any)._pending}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
            {getInitials(u.first_name, u.last_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">
              {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed"}
            </p>
            <p className="truncate text-xs text-gray-400">{u.email}</p>
            <p className="truncate text-xs text-gray-500">Store: {u.store_name || "—"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {roleBadge(u.role)}
          <StatusBadge active={u.is_active} />
        </div>
        <p className="mt-2 text-xs text-gray-400">Last login: {formatDate(u.last_login_at)}</p>
      </CardShell>
    ),
  };
}



/* ═══════════════════════════════════════════════════
   2. STORES
════════════════════════════════════════════════════ */

type Store = {
  id: string;
  name: string;
  type: string;
  address: string | null;
  timezone: string;
  is_active: boolean;
};

const storeTypeColors: Record<string, string> = {
  retail:    "bg-blue-50 text-blue-700 border-blue-200",
  warehouse: "bg-purple-50 text-purple-700 border-purple-200",
  popup:     "bg-orange-50 text-orange-700 border-orange-200",
};

function StoreTypeBadge({ type }: { type: string }) {
  const cls = storeTypeColors[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {type}
    </span>
  );
}

export const storesConfig: EntityConfig<Store> = {
  module: "stores",
  storeLevel: false,
  title: "Stores",
  singular: "Store",
  fields: STORE_FIELDS as FieldDef<Store>[],
  blankForm: { name: "", type: "retail", address: "", timezone: "Asia/Kolkata", is_active: true },
  searchKeys: ["name", "type", "address"],
  toPayload: (f) => ({ ...f, address: (f.address as string)?.trim() || null }),
  columns: [
    { key: "name", label: "Name", render: (v) => <span className="font-medium text-gray-900">{String(v)}</span> },
    { key: "type", label: "Type", render: (v) => <StoreTypeBadge type={String(v)} /> },
    { key: "address", label: "Address", render: (v) => <span className="text-gray-500 text-xs">{String(v || "—")}</span> },
    { key: "timezone", label: "Timezone" },
    { key: "is_active", label: "Status", render: (v) => <StatusBadge active={Boolean(v)} /> },
  ],
  renderCard: (s, { onEdit, onDelete }, canEdit, canDelete) => (
    <CardShell key={s.id} pending={(s as any)._pending} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{s.name}</p>
          <p className="mt-0.5 text-xs text-gray-400">{s.timezone}</p>
        </div>
        <StoreTypeBadge type={s.type} />
      </div>
      {s.address && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">{s.address}</p>
      )}
      <div className="mt-3">
        <StatusBadge active={s.is_active} />
      </div>
    </CardShell>
  ),
};

/* ═══════════════════════════════════════════════════
   3. STORE CONFIGS
════════════════════════════════════════════════════ */

type StoreConfig = {
  id: string;
  store_id: string;
  key: string;
  value: string;
  description: string | null;
};

const STORE_CONFIG_FIELDS: FieldDef<StoreConfig>[] = [
  { key: "store_id",    label: "Store ID",    type: "text",     required: true, span: "full" },
  { key: "key",         label: "Config key",  type: "text",     required: true, span: "half",
    hint: "e.g. max_discount, tax_rate" },
  { key: "value",       label: "Value",       type: "text",     required: true, span: "half" },
  { key: "description", label: "Description", type: "textarea", span: "full" },
];

export const storeConfigsConfig: EntityConfig<StoreConfig> = {
  module: "store_configs",
  title: "Store Configs",
  singular: "Config",
  fields: STORE_CONFIG_FIELDS,
  blankForm: { store_id: "", key: "", value: "", description: "" },
  searchKeys: ["key", "value", "store_id"],
  toPayload: (f) => ({ ...f, description: (f.description as string)?.trim() || null }),
  columns: [
    { key: "store_id", label: "Store ID", render: (v) => <span className="font-mono text-xs text-gray-500">{String(v)}</span> },
    { key: "key", label: "Key", render: (v) => <span className="font-mono text-xs font-semibold text-gray-900">{String(v)}</span> },
    { key: "value", label: "Value", render: (v) => <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{String(v)}</span> },
    { key: "description", label: "Description", render: (v) => <span className="text-xs text-gray-500">{String(v || "—")}</span> },
  ],
  renderCard: (c, { onEdit, onDelete }, canEdit, canDelete) => (
    <CardShell key={c.id} pending={(c as any)._pending} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-gray-900 truncate">{c.key}</p>
          <p className="mt-1 font-mono text-xs text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded">{c.value}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
          {c.store_id.slice(0, 8)}…
        </span>
      </div>
      {c.description && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">{c.description}</p>
      )}
    </CardShell>
  ),
};

/* ═══════════════════════════════════════════════════
   4. CATEGORIES
════════════════════════════════════════════════════ */

type Category = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
};

const CATEGORY_FIELDS: FieldDef<Category>[] = [
  { key: "name",        label: "Category name", type: "text",     required: true, span: "half" },
  { key: "code",        label: "Code",          type: "text",     required: false, span: "half",
    hint: "Short identifier (e.g. VEG, DAIRY)" },
  { key: "parent_id",   label: "Parent ID",     type: "text",     span: "full",
    hint: "Leave blank for top-level category" },
  { key: "description", label: "Description",   type: "textarea", span: "full" },
  { key: "is_active",   label: "Active",        type: "toggle",   span: "full" },
];

const CATEGORY_COLORS = [
  "bg-pink-100 text-pink-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-lime-100 text-lime-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function categoryColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export const categoriesConfig: EntityConfig<Category> = {
  module: "categories",
  storeLevel: false,
  title: "Categories",
  singular: "Category",
  fields: CATEGORY_FIELDS,
  blankForm: { name: "", code: "", description: "", parent_id: "", is_active: true },
  searchKeys: ["name", "code", "description"],
  toPayload: (f) => ({
    name: f.name,
    code: (f.code as string)?.trim() || undefined,
    description: (f.description as string)?.trim() || undefined,
    parentId: (f.parent_id as string)?.trim() || undefined,
    isActive: f.is_active,
  }),
  columns: [
    {
      key: "name", label: "Name",
      render: (v) => {
        const name = String(v);
        return (
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${categoryColor(name)}`}>
              {name[0]?.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">{name}</span>
          </div>
        );
      },
    },
    { key: "code", label: "Code", render: (v) => v ? <span className="font-mono text-xs text-gray-500">{String(v)}</span> : <span className="text-xs text-gray-400">—</span> },
    { key: "parent_id", label: "Parent", render: (v) => v ? <span className="font-mono text-xs text-gray-400">{String(v).slice(0, 8)}…</span> : <span className="text-xs text-gray-400">Root</span> },
    { key: "is_active", label: "Status", render: (v) => <StatusBadge active={Boolean(v)} /> },
  ],
  renderCard: (cat, { onEdit, onDelete }, canEdit, canDelete) => (
    <CardShell key={cat.id} pending={(cat as any)._pending} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${categoryColor(cat.name)}`}>
          {cat.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
          {cat.code && <p className="text-xs text-gray-400 font-mono">{cat.code}</p>}
        </div>
      </div>
      {cat.description && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">{cat.description}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge active={cat.is_active} />
        {cat.parent_id && (
          <Badge variant="neutral">Sub-category</Badge>
        )}
      </div>
    </CardShell>
  ),
};
/* ═══════════════════════════════════════════════════
   5. ITEMS
════════════════════════════════════════════════════ */

type Item = {
  id: string;

  // Basic
  name: string;
  sku: string;
  barcode?: string | null;
  brand?: string | null;
  description?: string | null;

  // Relations
  categoryId?: string | null;
  supplierId?: string | null;

  // Stock
  currentStock: number;
  reservedStock?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  leadTimeDays?: number;
  monthlyUsageAvg?: number;

  // Units
  primaryUnitId?: string | null;
  secondaryUnitId?: string | null;
  unitsPerSecondary?: number;

  // Pricing
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  gstRate?: number;
  discountType?: string;
  discountValue?: number;

  // Batch / Expiry
  batchNumber?: string | null;
  manufactureDate?: string | null;
  expiryDate?: string | null;

  // Seasonal
  seasonFlag?: string | null;
  isSeasonal?: boolean;

  // Status
  isActive: boolean;

  // Audit
  createdAt?: string;
  updatedAt?: string;
};

function formatPrice(v: unknown) {
  const n = Number(v);

  if (isNaN(n)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function stockBadge(stock?: number | null) {
  if (stock === null || stock === undefined) {
    return <Badge variant="neutral">Unknown</Badge>;
  }

  if (stock === 0) {
    return <Badge variant="error">Out of stock</Badge>;
  }

  if (stock <= 10) {
    return <Badge variant="warning">Low ({stock})</Badge>;
  }

  return <Badge variant="success">{stock} in stock</Badge>;
}

export const itemsConfig: EntityConfig<Item> = {
  module: "items",
  title: "Items",
  singular: "Item",

  fields: ITEM_FIELDS as FieldDef<Item>[],

blankForm: {
  name: "",
  sku: "",
  barcode: "",
  brand: "",
  description: "",
  categoryId: "",
  supplierId: "",

  currentStock: 0,
  reservedStock: 0,
  reorderLevel: 10,
  maxStockLevel: 100,
  leadTimeDays: 0,
  monthlyUsageAvg: 0,

  primaryUnitId: "",
  secondaryUnitId: "",
  unitsPerSecondary: 0,

  purchasePrice: 0,
  sellingPrice: 0,
  mrp: 0,
  gstRate: 0,
  discountType: "none",
  discountValue: 0,

  batchNumber: "",
  manufactureDate: "",
  expiryDate: "",

  seasonFlag: "",
  isSeasonal: false,

  isActive: true
},
  searchKeys: ["name", "sku", "description"],

  toPayload: (f) => ({
    name: f.name?.trim(),
    sku: f.sku?.trim(),

    sellingPrice: Number(f.sellingPrice || 0),
    discountType: f.discountType || "none",
    discountValue: Number(f.discountValue || 0),

    categoryId: f.categoryId || undefined,
    primaryUnitId: f.primaryUnitId || undefined,

    currentStock: Number(f.currentStock || 0),

    description: f.description?.trim() || null,

    isActive: Boolean(f.isActive),
  }),

  columns: [
    {
      key: "name",
      label: "Name",
      render: (v) => (
        <span className="font-medium text-gray-900">
          {String(v)}
        </span>
      ),
    },

    {
      key: "sku",
      label: "SKU",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">
          {String(v)}
        </span>
      ),
    },

    {
      key: "sellingPrice",
      label: "Price",
      render: (v) => (
        <span className="font-semibold text-gray-900">
          {formatPrice(v)}
        </span>
      ),
    },

    {
      key: "currentStock",
      label: "Stock",
      render: (_, row) => stockBadge(row.currentStock),
    },

    {
      key: "isActive",
      label: "Status",
      render: (v) => (
        <StatusBadge active={Boolean(v)} />
      ),
    },
  ],

  renderCard: (
    item,
    { onEdit, onDelete },
    canEdit,
    canDelete
  ) => {
    const now = Date.now();
    const expiryMs = item.expiryDate ? new Date(item.expiryDate).getTime() : null;
    const daysToExpiry = expiryMs ? Math.ceil((expiryMs - now) / 86_400_000) : null;
    const expiryUrgent = daysToExpiry !== null && daysToExpiry <= 30;
    const expirySoon   = daysToExpiry !== null && daysToExpiry <= 90 && !expiryUrgent;
    const reorder      = item.reorderLevel && item.currentStock <= item.reorderLevel;
    const stockPct     = item.maxStockLevel
      ? Math.min(100, Math.round((item.currentStock / item.maxStockLevel) * 100))
      : null;

    return (
      <CardShell
        key={item.id}
        pending={(item as any)._pending}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      >
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{item.sku}</p>
            {item.brand && <p className="text-xs text-gray-500 mt-0.5">{item.brand}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-gray-900">{formatPrice(item.sellingPrice)}</p>
            {item.mrp && item.mrp !== item.sellingPrice && (
              <p className="text-[11px] text-gray-400 line-through">{formatPrice(item.mrp)}</p>
            )}
          </div>
        </div>

        {/* Stock bar */}
        {stockPct !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{item.currentStock} in stock</span>
              {item.maxStockLevel && <span>max {item.maxStockLevel}</span>}
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  stockPct === 0 ? "bg-red-500" :
                  stockPct < 20  ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}
                style={{ width: `${stockPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Industry-specific badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stockBadge(item.currentStock)}
          {item.discountType && item.discountType !== "none" && item.discountValue && Number(item.discountValue) > 0 && (
            <Badge variant="success">
              {item.discountType === "percentage" ? `${parseFloat(String(item.discountValue))}% Off` : `₹${parseFloat(String(item.discountValue))} Off`}
            </Badge>
          )}
          {reorder && (
            <Badge variant="warning">Reorder</Badge>
          )}
          {item.batchNumber && (
            <Badge variant="neutral">
              <span className="font-mono">B: {item.batchNumber}</span>
            </Badge>
          )}
          {daysToExpiry !== null && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold
              ${expiryUrgent ? "bg-red-50 border-red-200 text-red-700" :
                expirySoon   ? "bg-amber-50 border-amber-200 text-amber-700" :
                               "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
              {daysToExpiry <= 0 ? "Expired" : `Exp: ${daysToExpiry}d`}
            </span>
          )}
          {item.isSeasonal && (
            <Badge variant="info">Seasonal</Badge>
          )}
          <StatusBadge active={item.isActive} />
        </div>

        {item.description && (
          <p className="mt-2 text-xs text-gray-400 line-clamp-1">{item.description}</p>
        )}
      </CardShell>
    );
  },
};