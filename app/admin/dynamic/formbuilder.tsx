"use client";

/**
 * FormBuilder — Schema-driven dynamic form generator
 *
 * Define a `FieldDef[]` array and FormBuilder renders the entire form,
 * including layout, types, validation, and error display.
 *
 * Supported field types:
 *   text | email | number | password | textarea | select | toggle |
 *   radio | date | combobox
 *
 * Usage:
 *   <FormBuilder
 *     fields={ITEM_FIELDS}
 *     data={formState}
 *     onChange={(key, val) => setFormState(prev => ({ ...prev, [key]: val }))}
 *     errors={validationErrors}
 *   />
 */

import React, { useId } from "react";
import { ChevronDown } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getTenantId } from "@/lib/utils";

/* ─────────────────────────── Types ─────────────────────────── */

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "textarea"
  | "select"
  | "toggle"
  | "radio"
  | "date";

export type SelectOption = { label: string; value: string };

export type FieldDef<T = Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  /** "half" = 1 col in 2-col grid, "full" = spans both columns (default: "half") */
  span?: "half" | "full";
  /** For select / radio */
  options?: SelectOption[];
  endpoint?: string;
  labelKey?:string;
  valueKey?:string;

  /** Custom validator — return a string error message or null */
  validate?: (value: unknown, data: Partial<T>) => string | null;
  /** Disable the field */
  disabled?: (data: Partial<T>) => boolean;
  /** Conditionally hide the field */
  hidden?: (data: Partial<T>) => boolean;
  /** Helper text shown below the field */
  hint?: string;
  /** Min/max for number fields */
  min?: number;
  max?: number;
};

export type FormBuilderProps<T extends Record<string, unknown>> = {
  fields: FieldDef<T>[];
  data: Partial<T>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  /** Extra className for the root grid */
  className?: string;
  disabled?: boolean;
};

/* ─────────────────────────── Validate helper ─────────────────────────── */

/** Run all field validators against current data. Returns an errors map. */
export function validateForm<T extends Record<string, unknown>>(
  fields: FieldDef<T>[],
  data: Partial<T>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.hidden?.(data)) continue;
    const value = data[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (field.type === "email" && value && !/\S+@\S+\.\S+/.test(String(value))) {
      errors[field.key] = "Enter a valid email address";
      continue;
    }
    if (field.validate) {
      const msg = field.validate(value, data);
      if (msg) errors[field.key] = msg;
    }
  }
  return errors;
}

/* ─────────────────────────── Input styles ─────────────────────────── */

const baseInput =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 " +
  "focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 " +
  "transition-colors";

/* ─────────────────────────── Field renderer ─────────────────────────── */

function FieldRenderer<T extends Record<string, unknown>>({
  field,
  value,
  error,
  onChange,
  disabled,
  data,
}: {
  field: FieldDef<T>;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
  disabled?: boolean;
  data: Partial<T>;
}) {
  const uid = useId();
  const isDisabled = disabled || field.disabled?.(data);
  const strVal = value !== undefined && value !== null ? String(value) : "";

  /* ── Toggle ── */
  if (field.type === "toggle") {
    const checked = Boolean(value);
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={isDisabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            checked ? "bg-blue-600" : "bg-gray-200"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm ${checked ? "text-gray-900" : "text-gray-400"}`}>
          {checked ? "Active" : "Inactive"}
        </span>
      </div>
    );
  }

  /* ── Radio ── */
  if (field.type === "radio") {
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              strVal === opt.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type="radio"
              name={uid}
              value={opt.value}
              checked={strVal === opt.value}
              disabled={isDisabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }
  /* ── Date ── */
if (field.type === "date") {
  return (
    <div className="relative">
      <input
        id={uid}
        type="date"
        value={strVal}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} cursor-pointer ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
            : ""
        }`}
      />
    </div>
  );
}

  /* ── Select ── */
 if (field.type === "select") {
  const [dynamicOptions, setDynamicOptions] = React.useState<SelectOption[]>(field.options ?? []);

  React.useEffect(() => {
    if (field.endpoint) {
    apiGet<{ data: any[] }>(field.endpoint)
      .then((res) => {
        const opts = res.data.map((d) => ({
          label: d[field.labelKey || "name"],
          value: d[field.valueKey || "id"],
        }));
        setDynamicOptions(opts);
      })
  .catch(console.error);
    }
  }, [field.endpoint]);

  return (
    <div className="relative">
      <select
        id={uid}
        value={strVal}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} appearance-none pr-8 ${
          error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""
        }`}
      >
        <option value="">Select {field.label.toLowerCase()}…</option>
        {dynamicOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}


  /* ── Textarea ── */
  if (field.type === "textarea") {
    return (
      <textarea
        id={uid}
        value={strVal}
        placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
        disabled={isDisabled}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} resize-y ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
      />
    );
  }

  /* ── Everything else (text, email, number, password, date) ── */
  return (
    <input
      id={uid}
      type={field.type}
      value={strVal}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
      disabled={isDisabled}
      min={field.min}
      max={field.max}
      onChange={(e) =>
        onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
      }
      className={`${baseInput} ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
    />
  );
}

/* ─────────────────────────── FormBuilder ─────────────────────────── */

export function FormBuilder<T extends Record<string, unknown>>({
  fields,
  data,
  onChange,
  errors = {},
  className = "",
  disabled,
}: FormBuilderProps<T>) {
  return (
    <div
      className="max-h-[70vh] overflow-y-auto pr-2"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className={`grid grid-cols-2 gap-x-4 gap-y-5 ${className}`}>
        {fields.map((field) => {
          if (field.hidden?.(data)) return null;

          const uid = `field-${String(field.key)}`;
          const isToggle = field.type === "toggle";

          return (
            <div
              key={String(field.key)}
              className={field.span === "full" ? "col-span-2" : "col-span-1"}
            >
              {/* Label */}
              <label
                htmlFor={uid}
                className={`mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600 ${
                  isToggle ? "sr-only" : "block"
                }`}
              >
                {field.label}
                {field.required && (
                  <span className="text-red-500" aria-hidden>
                    *
                  </span>
                )}
              </label>

              {/* Toggle */}
              {isToggle ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {field.label}
                  </span>

                  <FieldRenderer
                    field={field}
                    value={data[field.key]}
                    error={errors[field.key]}
                    onChange={(v) => onChange(field.key, v)}
                    disabled={disabled}
                    data={data}
                  />
                </div>
              ) : (
                <FieldRenderer
                  field={field}
                  value={data[field.key]}
                  error={errors[field.key]}
                  onChange={(v) => onChange(field.key, v)}
                  disabled={disabled}
                  data={data}
                />
              )}

              {/* Error */}
              {errors[field.key] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[field.key]}
                </p>
              )}

              {/* Hint */}
              {field.hint && !errors[field.key] && (
                <p className="mt-1 text-xs text-gray-400">
                  {field.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ─────────────────────────── Pre-built field schemas ─────────────────────────── */

export const USER_FIELDS: FieldDef<{
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}>[] = [
  { key: "first_name", label: "First name", type: "text", required: true, span: "half" },
  { key: "last_name",  label: "Last name",  type: "text", span: "half" },
  {
    key: "email", label: "Email", type: "email", required: true, span: "full",
    validate: (v) =>
      typeof v === "string" && v && !/\S+@\S+\.\S+/.test(v)
        ? "Enter a valid email address"
        : null,
  },
  {
    key: "role", label: "Role", type: "select", required: true, span: "half",
    options: [
      { label: "Admin",   value: "admin" },
      { label: "Manager", value: "manager" },
      { label: "Staff",   value: "staff" },
      { label: "Viewer",  value: "viewer" },
    ],
  },
  { key: "is_active", label: "Account status", type: "toggle", span: "half" },

];

export const ITEM_FIELDS: FieldDef[] = [
  // Basic
  {
    key: "name",
    label: "Item name",
    type: "text",
    required: true,
    span: "full",
  },
  {
    key: "sku",
    label: "SKU",
    type: "text",
    required: true,
    span: "half",
  },
  {
    key: "barcode",
    label: "Barcode",
    type: "text",
    span: "half",
  },
  {
    key: "brand",
    label: "Brand",
    type: "text",
    span: "half",
  },

  {
    key: "description",
    label: "Description",
    type: "textarea",
    span: "full",
  },

  // Category / Supplier
  {
    key: "categoryId",
    label: "Category",
    type: "select",
    span: "half",
    endpoint: `/tenants/${getTenantId()}/categories`,
    labelKey: "name",
    valueKey: "id",
  },
  {
    key: "supplierId",
    label: "Supplier",
    type: "select",
    span: "half",
    endpoint: `/tenants/${getTenantId()}/suppliers`,
    labelKey: "name",
    valueKey: "id",
  },

  // Stock
  {
    key: "currentStock",
    label: "Current Stock",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "reservedStock",
    label: "Reserved Stock",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "reorderLevel",
    label: "Reorder Level",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "maxStockLevel",
    label: "Max Stock",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "leadTimeDays",
    label: "Lead Time (days)",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "monthlyUsageAvg",
    label: "Monthly Usage Avg",
    type: "number",
    span: "half",
    min: 0,
  },

  // Units
  {
    key: "primaryUnitId",
    label: "Primary Unit",
    type: "select",
    span: "half",
    endpoint: "/units",
    labelKey: "symbol",
    valueKey: "id",
    required: true,
  },
  {
    key: "secondaryUnitId",
    label: "Secondary Unit",
    type: "select",
    span: "half",
    endpoint: "/units",
    labelKey: "symbol",
    valueKey: "id",
  },
  {
    key: "unitsPerSecondary",
    label: "Units per Secondary",
    type: "number",
    span: "half",
    min: 0,
  },

  // Pricing
  {
    key: "purchasePrice",
    label: "Purchase Price (₹)",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "sellingPrice",
    label: "Selling Price (₹)",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "mrp",
    label: "MRP (₹)",
    type: "number",
    span: "half",
    min: 0,
  },
  {
    key: "gstRate",
    label: "GST %",
    type: "number",
    span: "half",
    min: 0,
  },

  // Batch / Expiry
  {
    key: "batchNumber",
    label: "Batch Number",
    type: "text",
    span: "half",
  },
  {
    key: "manufactureDate",
    label: "Manufacture Date",
    type: "date",
    span: "half",
  },
  {
    key: "expiryDate",
    label: "Expiry Date",
    type: "date",
    span: "half",
  },

  // Seasonal
  {
    key: "seasonFlag",
    label: "Season Flag",
    type: "text",
    span: "half",
  },
  {
    key: "isSeasonal",
    label: "Seasonal",
    type: "toggle",
    span: "half",
  },

  // Active
  {
    key: "isActive",
    label: "Active",
    type: "toggle",
    span: "full",
  },
];
export const STORE_FIELDS: FieldDef[] = [
  { key: "name",     label: "Store name", type: "text",   required: true, span: "full" },
  {
    key: "type", label: "Store type", type: "radio", required: true, span: "full",
    options: [
      { label: "Retail",     value: "retail" },
      { label: "Warehouse",  value: "warehouse" },
      { label: "Pop-up",     value: "popup" },
    ],
  },
  { key: "address",  label: "Address",   type: "textarea", span: "full" },
  { key: "timezone", label: "Timezone",  type: "select",   span: "half",
    options: [
      { label: "IST (UTC+5:30)", value: "Asia/Kolkata" },
      { label: "UTC",            value: "UTC" },
      { label: "EST (UTC-5)",    value: "America/New_York" },
    ],
  },
  { key: "is_active", label: "Store active", type: "toggle", span: "half" },
];

export const PURCHASE_ORDER_FIELDS: FieldDef[] = [
  { key: "supplier",      label: "Supplier name",  type: "text",   required: true, span: "full" },
  {
    key: "status", label: "Status", type: "select", required: true, span: "half",
    options: [
      { label: "Draft",     value: "draft" },
      { label: "Sent",      value: "sent" },
      { label: "Received",  value: "received" },
      { label: "Cancelled", value: "cancelled" },
    ],
  },
  { key: "expected_date", label: "Expected date",  type: "date",   span: "half" },
  { key: "total_amount",  label: "Total (₹)",      type: "number", span: "half", min: 0 },
  { key: "notes",         label: "Notes",          type: "textarea", span: "full" },
];