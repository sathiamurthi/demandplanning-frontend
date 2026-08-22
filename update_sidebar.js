const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/sidebar.tsx', 'utf8');

c = c.replace(
  `  {
    section: "Operations",`,
  `  {
    section: "Sales Pipeline",
    roles: MGMT_ROLES,
    items: [
      { label: "Leads",           href: "/admin/dynamic/leads",           icon: Users },
      { label: "Quotations",      href: "/admin/dynamic/quotations",      icon: FileBarChart2 },
      { label: "Sales Orders",    href: "/admin/dynamic/sales-orders",    icon: ShoppingCart },
    ],
  },
  {
    section: "Operations",`
);

fs.writeFileSync('app/admin/dynamic/sidebar.tsx', c);
console.log('Sidebar updated');
