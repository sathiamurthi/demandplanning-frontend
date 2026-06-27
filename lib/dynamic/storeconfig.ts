export const STORE_ENTITY_CONFIG = {
  title: "Store",
  endpoint: "stores",
  fields: [
    { name: "id", label: "ID", type: "uuid", visible: true },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "industry", label: "Industry", type: "text" }, 
    { name: "description", label: "Description", type: "text" },
    { name: "is_active", label: "Active?", type: "toggle" },
    { name: "metadata", label: "Metadata", type: "text" }, // could be JSON editor if needed
    { name: "created_at", label: "Created At", type: "timestamp", visible: true },
    { name: "updated_at", label: "Updated At", type: "timestamp", visible: true },
  ],
};
