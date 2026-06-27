"use client";

/**
 * DynamicEntity — Generic CRUD page powered by config.
 *
 * For the "items" module, two extra actions are injected into the toolbar:
 *  ⚡ Quick add  — minimal 4-field form with AI suggestions
 *  ↑  Import     — CSV bulk upload with template download
 */

import React, { useState, useMemo, useCallback } from "react";
import { Plus, RefreshCw, Zap, Upload } from "lucide-react";
import { useCrud } from "./usercrud";
import { FormBuilder, validateForm, FieldDef } from "./formbuilder";
import {
  Modal,
  Button,
  ConfirmDialog,
  EmptyState,
  FullPageLoader,
  SearchInput,
  PageHeader,
  ViewToggle,
  useToast,
} from "./ui";
import { getStoreId, getTenantId } from "@/lib/utils";
import { QuickAddItemModal } from "./QuickAddItemModal";
import { ImportItemsModal } from "./ImportItemsModal";

/* ─────────────────────────── Config type ─────────────────────────── */

export type ColumnDef<T> = {
  key: keyof T & string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type EntityConfig<T extends { id: string }> = {
  module: string;
  title: string;
  singular: string;
  fields: FieldDef<T>[];
  columns: ColumnDef<T>[];
  renderCard: (
    item: T,
    actions: { onEdit: () => void; onDelete: () => void },
    canEdit: boolean,
    canDelete: boolean
  ) => React.ReactNode;
  blankForm: Partial<T>;
  searchKeys: (keyof T & string)[];
  toPayload?: (formData: Partial<T>) => Partial<T>;
  /** false = uses /tenants/{id}/{module}; true (default) = /tenants/{id}/stores/{storeId}/{module} */
  storeLevel?: boolean;
};

/* ─────────────────────────── Component ─────────────────────────── */

export function DynamicEntity<T extends { id: string }>({
  config,
  storeId,
}: {
  config: EntityConfig<T>;
  storeId?: string;
}) {
  const { show } = useToast();
  const tenantId = getTenantId() ?? "";
  const { items, loading, saving, fetch, create, update, remove } =
    useCrud<T>({
      tenantId,
      module: config.module,
      storeLevel: config.storeLevel !== false,
      optimistic: true,
      onError: (_err, action) =>
        show(`${action} failed — changes rolled back`, "error"),
      onSuccess: (action) => {
        const msgs: Record<string, string> = {
          create: `${config.singular} created`,
          update: `${config.singular} updated`,
          delete: `${config.singular} deleted`,
        };
        if (msgs[action]) show(msgs[action]);
      },
    });

  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>(config.blankForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  // Items-specific modals
  const isItems = config.module === "items";
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const canEdit   = true;
  const canDelete = true;
  const canCreate = true;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      config.searchKeys.some((key) =>
        String(item[key] ?? "").toLowerCase().includes(q)
      )
    );
  }, [items, search, config.searchKeys]);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setFormData(config.blankForm);
    setFormErrors({});
    setFormOpen(true);
  }, [config.blankForm]);

  const openEdit = useCallback((item: T) => {
    setEditTarget(item);
    setFormData({ ...item });
    setFormErrors({});
    setFormOpen(true);
  }, []);

  const handleFormChange = useCallback((key: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setFormErrors((prev) => {
      const e = { ...prev };
      delete e[key];
      return e;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const errs = validateForm(config.fields as FieldDef[], formData);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const payload = config.toPayload ? config.toPayload(formData) : formData;
    if (editTarget) {
      await update(editTarget.id, payload);
    } else {
      await create(payload);
    }
    setFormOpen(false);
  }, [formData, editTarget, config, create, update]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, remove]);

  return (
    <div className="flex h-full flex-col theme-content bg-gray-50 transition-colors">
      {/* ── Header ── */}
      <PageHeader
        title={config.title}
        subtitle={`${filtered.length} of ${items.length} ${config.title.toLowerCase()}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Items-specific: Quick Add + Import */}
            {isItems && (
              <>
                <Button
                  onClick={() => setImportOpen(true)}
                  icon={<Upload className="h-3.5 w-3.5" />}
                  className="hidden sm:flex"
                >
                  Import
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setQuickAddOpen(true)}
                  icon={<Zap className="h-3.5 w-3.5" />}
                  className="bg-gold-50 border-gold-200 text-gold-700 hover:bg-gold-100"
                >
                  <span className="hidden sm:inline">Quick add</span>
                  <span className="sm:hidden">Quick</span>
                </Button>
              </>
            )}

            <Button
              onClick={() => fetch()}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              disabled={loading}
              className="hidden sm:flex"
            >
              Refresh
            </Button>

            {canCreate && (
              <Button
                variant="primary"
                onClick={openCreate}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                <span className="hidden sm:inline">Add {config.singular}</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-4 sm:px-6 py-3 theme-topbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${config.title.toLowerCase()}…`}
          className="max-w-xs flex-1"
        />

        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile-only refresh */}
          <button
            onClick={() => fetch()}
            disabled={loading}
            className="sm:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Mobile-only import (items only) */}
          {isItems && (
            <button
              onClick={() => setImportOpen(true)}
              className="sm:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Import"
            >
              <Upload className="h-4 w-4" />
            </button>
          )}

          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <FullPageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              search
                ? `No ${config.title.toLowerCase()} match your search`
                : `No ${config.title.toLowerCase()} yet`
            }
            description={
              search
                ? "Try a different search term."
                : `Add your first ${config.singular.toLowerCase()} to get started.`
            }
            action={
              !search && canCreate ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {isItems && (
                    <Button
                      variant="secondary"
                      onClick={() => setQuickAddOpen(true)}
                      icon={<Zap className="h-3.5 w-3.5" />}
                      className="bg-gold-50 border-gold-200 text-gold-700 hover:bg-gold-100 w-full sm:w-auto"
                    >
                      Quick add
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={openCreate}
                    icon={<Plus className="h-3.5 w-3.5" />}
                    className="w-full sm:w-auto"
                  >
                    Add {config.singular}
                  </Button>
                </div>
              ) : undefined
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) =>
              config.renderCard(
                item,
                {
                  onEdit:   () => openEdit(item),
                  onDelete: () => setDeleteTarget(item),
                },
                canEdit,
                canDelete
              )
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm
                          theme-card overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {config.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                    {config.columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-gray-700">
                        {col.render
                          ? col.render(item[col.key], item)
                          : String(item[col.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            className="text-xs px-2.5 py-1"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="danger"
                            className="text-xs px-2.5 py-1"
                            onClick={() => setDeleteTarget(item)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Full form modal ── */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? `Edit ${config.singular}` : `Add ${config.singular}`}
      >
        <Modal.Body>
          <FormBuilder
            fields={config.fields as FieldDef[]}
            data={formData}
            onChange={handleFormChange}
            errors={formErrors}
            disabled={saving}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {editTarget ? "Save changes" : `Create ${config.singular}`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${config.singular}`}
        message={`Remove this ${config.singular.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={saving}
      />

      {/* ── Items: Quick Add ── */}
      {isItems && (
        <QuickAddItemModal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onCreated={() => { fetch(); show("Item created", "success"); }}
        />
      )}

      {/* ── Items: CSV Import ── */}
      {isItems && (
        <ImportItemsModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={() => fetch()}
        />
      )}
    </div>
  );
}
