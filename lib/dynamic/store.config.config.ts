
export const STORE_CONFIG_ENTITY_CONFIG = {
  title: "Store config",
  endpoint: "store_config",
  childUrls: [
    { label: "Stores", path: "store_config", foreignKey: "config_id" }, // config_id populates stores
  ],
  fields: [
    { name: "id",         label: "ID",         type: "uuid",      visible: true },
    { name: "tenant_id",  label: "Tenant",      type: "uuid",      visible: true },
    { name: "name",       label: "Name",        type: "text",      required: true },
    { name: "code",       label: "Code",        type: "text",      required: true },
    { name: "owner_name", label: "Owner Name",  type: "text" },
    { name: "email",      label: "Email",       type: "email" },
    { name: "phone",      label: "Phone",       type: "text" },
    { name: "address",    label: "Address",     type: "text" },
    { name: "city",       label: "City",        type: "text" },
    { name: "state",      label: "State",       type: "text" },
    { name: "pincode",    label: "Pincode",     type: "text" },
    { name: "gst_number", label: "GST Number",  type: "text" },
    { name: "is_active",  label: "Active?",     type: "toggle" },
    { name: "metadata",   label: "Metadata",    type: "json" },
    { name: "config_id",  label: "Store",      type: "dropdown",      visible: false, populatesChild: "stores" },
    { name: "created_at", label: "Created At",  type: "timestamp", visible: true },
    { name: "updated_at", label: "Updated At",  type: "timestamp", visible: true },
  ],
};