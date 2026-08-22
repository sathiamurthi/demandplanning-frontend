const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const invoiceConfig = `
export const invoicesConfig = {
  title: "Invoices",
  apiEndpoint: "sales", // points to the sales router which has a GET /
  primaryKey: "id",
  columns: [
    { key: "sale_number", label: "Invoice Number", type: "text", readOnly: true },
    { key: "sale_date", label: "Date", type: "date" },
    { key: "customer_name", label: "Customer Name", type: "text" },
    { key: "total_amount", label: "Total Amount", type: "number", readOnly: true },
    { key: "payment_method", label: "Payment Method", type: "text" },
    { key: "sale_type", label: "Type", type: "text" }
  ]
};
`;

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c + "\n" + invoiceConfig);
console.log('Invoice config appended');
