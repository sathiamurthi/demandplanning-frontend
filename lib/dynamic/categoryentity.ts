// lib/dynamic/categoryconfig.ts
export const CATEGORY_ENTITY_CONFIG = {
  title: "Categories",
  endpoint: "categories",
  fields: [
    { name: "id", label: "ID", type: "uuid", visible: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "description", label: "Description", type: "text" },
    { name: "is_active", label: "Active?", type: "toggle" },
    { name: "created_at", label: "Created At", type: "timestamp", visible: true },
    { name: "updated_at", label: "Updated At", type: "timestamp", visible: true },
  ],
};
