export const USER_ENTITY_CONFIG: Record<string, any> = {
  users: {
    title: "Users",
    endpoint: "users",
    fields: [
      { name: "first_name", label: "First Name", type: "text" },
      { name: "email", label: "Email", type: "email" },

      // 🔥 CHILD FIELD (API DRIVEN)
      {
        name: "role_id",
        label: "Role",
        type: "dropdown",
        url: "/api/roles",   // 👈 fetch from here
        labelField: "name",
        valueField: "id",
      },

      { name: "is_active", label: "Active", type: "toggle" },
    ],
  },
};