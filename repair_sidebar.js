const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/sidebar.tsx', 'utf8');

c = c.replace(
  `  {
    section: "Operations",
    roles: MGMT_ROLES,
    items: [
      { label: "Sales",           href: "/admin/dynamic/sale",            icon: ReceiptText  },
      { label: "Sales Orders",    href: "/admin/dynamic/sales-orders",    icon: ShoppingCart },
      { label: "Invoices",        href: "/admin/dynamic/invoices",        icon: ReceiptText },
      { label: "Coupons",         href: "/admin/dynamic/coupons",         icon: Tag,         roles: OWNER_ROLES },
    ],
  },`,
  `  {
    section: "Sales Pipeline",
    roles: MGMT_ROLES,
    items: [
      { label: "Leads",           href: "/admin/dynamic/leads",           icon: Users },
      { label: "Quotations",      href: "/admin/dynamic/quotations",      icon: FileBarChart2 },
      { label: "Sales Orders",    href: "/admin/dynamic/sales-orders",    icon: ShoppingCart },
      { label: "Invoices",        href: "/admin/dynamic/invoices",        icon: ReceiptText },
    ],
  },
  {
    section: "Operations",
    roles: MGMT_ROLES,
    items: [
      { label: "POS Terminal",    href: "/admin/dynamic/sale",            icon: ReceiptText  },
      { label: "Purchase orders", href: "/admin/dynamic/purchase-orders", icon: ShoppingCart },
      { label: "Coupons",         href: "/admin/dynamic/coupons",         icon: Tag,         roles: OWNER_ROLES },
    ],
  },`
);

fs.writeFileSync('app/admin/dynamic/sidebar.tsx', c);
console.log('Sidebar repaired');
