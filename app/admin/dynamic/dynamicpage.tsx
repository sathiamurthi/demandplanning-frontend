"use client";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { getStoreId, getTenantId } from "@/lib/utils";
import { useEffect, useState } from "react";

/* ================= TYPES ================= */

type Field = {
  name: string;
  label: string;
  type: string;
  visible?: boolean;
  required?: boolean;
  editable?: boolean;
  url?: string;
  labelField?: string;
  valueField?: string;
  populatesChild?: string;
};

type ChildUrl = {
  label: string;
  path: string;
  foreignKey: string;
};

type Config = {
  title: string;
  endpoint: string;
  childUrls?: ChildUrl[];
  fields: Field[];
};

/* ================= MODAL ================= */

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose}>✖</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ================= CHILD TABLE ================= */

function ChildTable({ childUrl }: { childUrl: ChildUrl }) {
  const [childData, setChildData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchChildren() {
      setLoading(true);
      try {
        const res = await apiGet<ApiResponse<any[]>>(
          `/tenants/${getTenantId()}/${childUrl.path}`
        );
        setChildData(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, [childUrl.path]);

  if (loading)
    return <p className="text-sm text-gray-400">Loading {childUrl.label}...</p>;

  if (!childData.length)
    return <p className="text-sm text-gray-400">No {childUrl.label} found.</p>;

  const columns = Object.keys(childData[0]);

  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col) => (
            <th key={col} className="p-2 text-left capitalize">
              {col.replace(/_/g, " ")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {childData.map((row, i) => (
          <tr key={row.id ?? i} className="border-t">
            {columns.map((col) => (
              <td key={col} className="p-2">
                {String(row[col] ?? "-")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================= MAIN ================= */

export default function DynamicEntityPage({ config }: { config: Config }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "card">("grid");

  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<any>({});
  const [options, setOptions] = useState<Record<string, any[]>>({});

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeChildTab, setActiveChildTab] = useState<string>("");

  // Resolve childUrls that have a matching populatesChild field
  const resolvedChildUrls: ChildUrl[] = config.fields
    .filter((f) => f.populatesChild)
    .map((f) => config.childUrls?.find((cu) => cu.path === f.populatesChild))
    .filter(Boolean) as ChildUrl[];

  const hasChildren = resolvedChildUrls.length > 0;

  /* ================= FETCH ================= */

  async function fetchData() {
    setLoading(true);
    const res = await apiGet<ApiResponse<any[]>>(
      `/tenants/${getTenantId()}/${config.endpoint}`
    );
    setData(res.data || []);
    setLoading(false);
  }

  /* ================= DROPDOWN LOAD ================= */

  async function loadDropdowns(currentId?: string) {
    const dropdowns = config.fields.filter((f) => f.type === "dropdown");
    for (const field of dropdowns) {
      if (field.url) {
        const res = await fetch(field.url);
        const json = await res.json();
        const filtered = json.data.filter(
          (item: any) => item.id !== currentId
        );
        setOptions((prev) => ({ ...prev, [field.name]: filtered }));
      }
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= ROW EXPAND ================= */

  function toggleRow(itemId: string) {
    if (!hasChildren) return;
    if (expandedRowId === itemId) {
      setExpandedRowId(null);
      setActiveChildTab("");
    } else {
      setExpandedRowId(itemId);
      setActiveChildTab(resolvedChildUrls[0].path);
    }
  }

  /* ================= OPEN FORM ================= */

  function openCreate() {
    setForm({});
    setEditItem(null);
    loadDropdowns();
    setOpenForm(true);
  }

  function openEdit(item: any) {
    setForm(item);
    setEditItem(item);
    loadDropdowns(item.id);
    setOpenForm(true);
  }

  /* ================= SAVE ================= */

  async function handleSave() {
    let res: ApiResponse<any>;
    if (editItem) {
      res = await apiPut<any>(
        `/tenants/${getTenantId()}/${config.endpoint}/${editItem.id}`,
        form
      );
      setData(data.map((d) => (d.id === editItem.id ? res.data : d)));
    } else {
      res = await apiPost<any>(
        `/tenants/${getTenantId()}/stores/${getStoreId()}/${config.endpoint}`,
        form
      );
      setData([...data, res.data]);
    }
    setOpenForm(false);
  }

  /* ================= DELETE ================= */

  async function handleDelete() {
    if (!deleteId) return;
    await apiDelete<any>(
      `/tenants/${getTenantId()}/${config.endpoint}/${deleteId}`
    );
    setData(data.filter((d) => d.id !== deleteId));
    if (expandedRowId === deleteId) setExpandedRowId(null);
    setDeleteId(null);
  }

  /* ================= INPUT RENDER ================= */

  function renderInput(field: Field) {
    if (field.visible === false) return null;
    const value = form[field.name] ?? "";

    switch (field.type) {
      case "text":
        return (
          <input
            className="border p-2 rounded w-full"
            value={value}
            onChange={(e) =>
              setForm({ ...form, [field.name]: e.target.value })
            }
          />
        );
      case "number":
        return (
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={value}
            onChange={(e) =>
              setForm({ ...form, [field.name]: Number(e.target.value) })
            }
          />
        );
      case "toggle":
        return (
          <select
            className="border p-2 rounded w-full"
            value={value ? "true" : "false"}
            onChange={(e) =>
              setForm({ ...form, [field.name]: e.target.value === "true" })
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        );
      case "dropdown":
        return (
          <select
            className="border p-2 rounded w-full"
            value={value || ""}
            onChange={(e) =>
              setForm({ ...form, [field.name]: e.target.value })
            }
          >
            <option value="">-- Select --</option>
            {options[field.name]?.map((opt: any) => (
              <option key={opt.id} value={opt[field.valueField || "id"]}>
                {opt[field.labelField || "name"]}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  }

  const visibleFields = config.fields.filter((f) => f.visible !== false);

  /* ================= UI ================= */

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">{config.title}</h2>
        <div className="flex gap-2">
          <button
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() => setView("grid")}
          >
            Grid
          </button>
          <button
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() => setView("card")}
          >
            Card
          </button>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add
          </button>
        </div>
      </div>

      {/* ================= GRID ================= */}
      {view === "grid" && (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              {hasChildren && <th className="p-2 w-8" />}
              {visibleFields.map((f) => (
                <th key={f.name} className="p-2 text-left">
                  {f.label}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <>
                {/* Parent row */}
                <tr key={item.id} className="border-t">
                  {hasChildren && (
                    <td
                      className="p-2 text-center cursor-pointer select-none"
                      onClick={() => toggleRow(item.id)}
                    >
                      <span className="text-xs text-gray-500">
                        {expandedRowId === item.id ? "▼" : "▶"}
                      </span>
                    </td>
                  )}
                  {visibleFields.map((f) => (
                    <td key={f.name} className="p-2">
                      {String(item[f.name] ?? "-")}
                    </td>
                  ))}
                  <td className="flex gap-2 p-2">
                    <button onClick={() => openEdit(item)}>✏️</button>
                    <button onClick={() => setDeleteId(item.id)}>🗑️</button>
                  </td>
                </tr>

                {/* Child expanded row */}
                {expandedRowId === item.id && (
                  <tr key={`${item.id}-children`} className="bg-gray-50">
                    <td />
                    <td colSpan={visibleFields.length + 1} className="p-4">
                      {/* Tabs — only if multiple children */}
                      {resolvedChildUrls.length > 1 && (
                        <div className="flex gap-2 mb-3">
                          {resolvedChildUrls.map((cu) => (
                            <button
                              key={cu.path}
                              onClick={() => setActiveChildTab(cu.path)}
                              className={`px-3 py-1 rounded text-sm ${
                                activeChildTab === cu.path
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200"
                              }`}
                            >
                              {cu.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Child table */}
                      {resolvedChildUrls
                        .filter(
                          (cu) =>
                            resolvedChildUrls.length === 1 ||
                            cu.path === activeChildTab
                        )
                        .map((cu) => (
                          <div key={cu.path}>
                            <p className="text-sm font-semibold text-gray-600 mb-1">
                              {cu.label}
                            </p>
                            <ChildTable childUrl={cu} />
                          </div>
                        ))}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= CARD ================= */}
      {view === "card" && (
        <div className="grid md:grid-cols-3 gap-4">
          {data.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 shadow-sm">
              {visibleFields.map((f) => (
                <p key={f.name}>
                  <b>{f.label}:</b> {String(item[f.name] ?? "-")}
                </p>
              ))}

              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(item)}>✏️</button>
                <button onClick={() => setDeleteId(item.id)}>🗑️</button>
              </div>

              {hasChildren && (
                <div className="mt-3 border-t pt-3">
                  <button
                    onClick={() => toggleRow(item.id)}
                    className="text-xs text-blue-600 underline"
                  >
                    {expandedRowId === item.id ? "Hide" : "Show"} children
                  </button>

                  {expandedRowId === item.id && (
                    <div className="mt-2">
                      {resolvedChildUrls.length > 1 && (
                        <div className="flex gap-2 mb-2">
                          {resolvedChildUrls.map((cu) => (
                            <button
                              key={cu.path}
                              onClick={() => setActiveChildTab(cu.path)}
                              className={`px-2 py-0.5 rounded text-xs ${
                                activeChildTab === cu.path
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200"
                              }`}
                            >
                              {cu.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {resolvedChildUrls
                        .filter(
                          (cu) =>
                            resolvedChildUrls.length === 1 ||
                            cu.path === activeChildTab
                        )
                        .map((cu) => (
                          <ChildTable key={cu.path} childUrl={cu} />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= FORM MODAL ================= */}
      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editItem ? "Edit" : "Create"}
      >
        <div className="space-y-3">
          {config.fields.map((field) => (
            <div key={field.name}>
              {field.visible !== false && (
                <>
                  <label className="text-sm">{field.label}</label>
                  {renderInput(field)}
                </>
              )}
            </div>
          ))}
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ================= DELETE ================= */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
      >
        <p>Are you sure?</p>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setDeleteId(null)}>Cancel</button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}