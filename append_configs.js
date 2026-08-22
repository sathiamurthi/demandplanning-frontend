const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const newConfigs = `
// ==========================================
// SALES PIPELINE (CRM & ORDERS)
// ==========================================
export const leadsConfig: any = {
  module: "crm/leads",
  storeLevel: true,
  title: "Leads",
  singular: "Lead",
  fields: [
    { name: "customer_name", label: "Customer Name", type: "text", required: true },
    { name: "company_name", label: "Company Name", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "New", value: "New" }, { label: "Contacted", value: "Contacted" }, { label: "Won", value: "Won" }
    ] },
    { name: "value", label: "Expected Value", type: "number" }
  ],
  blankForm: { customer_name: "", company_name: "", phone: "", email: "", status: "New", value: 0 },
  searchKeys: ["customer_name", "company_name", "email", "phone"],
  toPayload: (f: any) => f,
  columns: [
    { key: "customer_name", label: "Customer Name", render: (v: any) => <strong>{v}</strong> },
    { key: "company_name", label: "Company Name" },
    { key: "status", label: "Status" },
    { key: "value", label: "Value" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.customer_name}</h3>
      <p className="text-sm text-gray-500">{item.company_name} - {item.status}</p>
    </div>
  )
};

export const quotationsConfig: any = {
  module: "crm/quotations",
  storeLevel: true,
  title: "Quotations",
  singular: "Quotation",
  fields: [
    { name: "customer_name", label: "Customer Name", type: "text", required: true },
    { name: "issue_date", label: "Issue Date", type: "date" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Draft", value: "Draft" }, { label: "Sent", value: "Sent" }
    ] }
  ],
  blankForm: { customer_name: "", issue_date: "", status: "Draft" },
  searchKeys: ["quote_number", "customer_name"],
  toPayload: (f: any) => f,
  columns: [
    { key: "quote_number", label: "Quote Number", render: (v: any) => <strong>{v}</strong> },
    { key: "customer_name", label: "Customer Name" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Total Amount" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.quote_number}</h3>
      <p className="text-sm text-gray-500">{item.customer_name} - {item.status}</p>
    </div>
  )
};

export const salesOrdersConfig: any = {
  module: "sales-orders",
  storeLevel: true,
  title: "Sales Orders",
  singular: "Sales Order",
  fields: [
    { name: "customer_name", label: "Customer Name", type: "text", required: true },
    { name: "order_date", label: "Order Date", type: "date" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Pending", value: "Pending" }, { label: "Confirmed", value: "Confirmed" }
    ] }
  ],
  blankForm: { customer_name: "", order_date: "", status: "Pending" },
  searchKeys: ["order_number", "customer_name"],
  toPayload: (f: any) => f,
  columns: [
    { key: "order_number", label: "Order Number", render: (v: any) => <strong>{v}</strong> },
    { key: "customer_name", label: "Customer Name" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Total Amount" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.order_number}</h3>
      <p className="text-sm text-gray-500">{item.customer_name} - {item.status}</p>
    </div>
  )
};

export const invoicesConfig: any = {
  module: "sales", // points to the sales router which has a GET /
  storeLevel: true,
  title: "Invoices",
  singular: "Invoice",
  fields: [],
  blankForm: {},
  searchKeys: ["sale_number", "customer_name"],
  toPayload: (f: any) => f,
  columns: [
    { key: "sale_number", label: "Invoice Number", render: (v: any) => <strong>{v}</strong> },
    { key: "sale_date", label: "Date" },
    { key: "customer_name", label: "Customer Name" },
    { key: "total_amount", label: "Total Amount" },
    { key: "payment_method", label: "Payment Method" },
    { key: "sale_type", label: "Type" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.sale_number}</h3>
      <p className="text-sm text-gray-500">{item.customer_name} - \\${item.total_amount}</p>
    </div>
  )
};
`;

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c + "\n" + newConfigs);
console.log('Configs appended');
