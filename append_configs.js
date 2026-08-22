const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const newConfigs = `
// ==========================================
// SALES PIPELINE (CRM & ORDERS)
// ==========================================
export const leadsConfig = {
  title: "Leads",
  apiEndpoint: "crm/leads",
  primaryKey: "id",
  columns: [
    { key: "customer_name", label: "Customer Name", type: "text" },
    { key: "company_name", label: "Company Name", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"] },
    { key: "value", label: "Expected Value", type: "number" }
  ]
};

export const quotationsConfig = {
  title: "Quotations",
  apiEndpoint: "crm/quotations",
  primaryKey: "id",
  columns: [
    { key: "quote_number", label: "Quote Number", type: "text", readOnly: true },
    { key: "customer_name", label: "Customer Name", type: "text" },
    { key: "issue_date", label: "Issue Date", type: "date" },
    { key: "valid_until", label: "Valid Until", type: "date" },
    { key: "total_amount", label: "Total Amount", type: "number", readOnly: true },
    { key: "status", label: "Status", type: "select", options: ["Draft", "Sent", "Accepted", "Rejected", "Expired"] }
  ]
};

export const salesOrdersConfig = {
  title: "Sales Orders",
  apiEndpoint: "sales-orders",
  primaryKey: "id",
  columns: [
    { key: "order_number", label: "Order Number", type: "text", readOnly: true },
    { key: "customer_name", label: "Customer Name", type: "text" },
    { key: "order_date", label: "Order Date", type: "date" },
    { key: "expected_delivery", label: "Expected Delivery", type: "date" },
    { key: "total_amount", label: "Total Amount", type: "number", readOnly: true },
    { key: "status", label: "Status", type: "select", options: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"] }
  ]
};
`;

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c + "\n" + newConfigs);
console.log('Configs appended');
