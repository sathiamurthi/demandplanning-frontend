const fs = require('fs');
const lines = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('export const leadsConfig'));
const end = lines.findIndex(l => l.includes('export const unitsConfig'));

const newConfigs = \`
export const leadsConfig: any = {
  module: "leads",
  storeLevel: true,
  title: "Leads",
  singular: "Lead",
  fields: [
    { key: "customer_name", label: "Customer Name", type: "text", required: true },
    { key: "company_name", label: "Company", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "status", label: "Status", type: "select", options: [
      { label: "New", value: "New" }, { label: "Contacted", value: "Contacted" },
      { label: "Qualified", value: "Qualified" }, { label: "Lost", value: "Lost" }
    ] },
    { key: "value", label: "Est. Value", type: "number" }
  ],
  blankForm: { customer_name: "", status: "New" },
  searchKeys: ["customer_name", "company_name", "phone", "email"],
  toPayload: (f: any) => f,
  columns: [
    { key: "customer_name", label: "Customer Name", render: (v: any) => <strong>{v}</strong> },
    { key: "company_name", label: "Company" },
    { key: "phone", label: "Phone" },
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
  customForm: PipelineDocumentForm,
  module: "quotations",
  storeLevel: true,
  title: "Quotations",
  singular: "Quotation",
  fields: [
    { key: "customer_name", label: "Customer Name", type: "text", required: true },
    { key: "issue_date", label: "Issue Date", type: "date" },
    { key: "valid_until", label: "Valid Until", type: "date" },
    { key: "status", label: "Status", type: "select", options: [
      { label: "Draft", value: "Draft" }, { label: "Sent", value: "Sent" },
      { label: "Accepted", value: "Accepted" }, { label: "Rejected", value: "Rejected" }
    ] }
  ],
  blankForm: { customer_name: "", status: "Draft" },
  searchKeys: ["quote_number", "customer_name"],
  toPayload: (f: any) => f,
  columns: [
    { key: "quote_number", label: "Quote Number", render: (v: any) => <strong>{v}</strong> },
    { key: "customer_name", label: "Customer Name" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Total Amount" },
    { key: "actions", label: "Actions", render: (v: any, item: any) => (
      <Button variant="outline" size="sm" onClick={() => {
        if (confirm('Convert to Sales Order?')) {
          fetch(\`/v1/tenants/\${item.tenant_id}/stores/\${item.store_id}/sales-orders\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ ...item, quotation_id: item.id, status: 'Pending' })
          }).then(() => window.location.reload());
        }
      }}>Convert to Order</Button>
    )}
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg flex justify-between items-center">
      <div>
        <h3 className="font-bold">{item.quote_number}</h3>
        <p className="text-sm text-gray-500">{item.customer_name} - {item.status}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => {
        if (confirm('Convert to Sales Order?')) {
          fetch(\`/v1/tenants/\${item.tenant_id}/stores/\${item.store_id}/sales-orders\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ ...item, quotation_id: item.id, status: 'Pending' })
          }).then(() => window.location.reload());
        }
      }}>Convert to Order</Button>
    </div>
  )
};

export const salesOrdersConfig: any = {
  customForm: PipelineDocumentForm,
  module: "sales-orders",
  storeLevel: true,
  title: "Sales Orders",
  singular: "Sales Order",
  fields: [
    { key: "customer_name", label: "Customer Name", type: "text", required: true },
    { key: "order_date", label: "Order Date", type: "date" },
    { key: "status", label: "Status", type: "select", options: [
      { label: "Pending", value: "Pending" }, { label: "Confirmed", value: "Confirmed" },
      { label: "Shipped", value: "Shipped" }, { label: "Delivered", value: "Delivered" },
      { label: "Cancelled", value: "Cancelled" }
    ] }
  ],
  blankForm: { customer_name: "", status: "Pending" },
  searchKeys: ["order_number", "customer_name"],
  toPayload: (f: any) => f,
  columns: [
    { key: "order_number", label: "Order Number", render: (v: any) => <strong>{v}</strong> },
    { key: "customer_name", label: "Customer Name" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Total Amount" },
    { key: "actions", label: "Actions", render: (v: any, item: any) => (
      <Button variant="outline" size="sm" onClick={() => {
        if (confirm('Generate Invoice for this order?')) {
          fetch(\`/v1/stores/\${item.store_id}/sales\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ 
              customerName: item.customer_name, 
              customerEmail: item.customer_email,
              customerPhone: item.customer_phone,
              items: (item.items || []).map((i:any) => ({ itemId: i.item_id || i.itemId, qty: i.qty, unitPrice: i.unit_price || i.unitPrice, discountPct: i.discount_pct || i.discountPct, gstRate: i.gst_rate || i.gstRate })),
              saleType: 'individual'
            })
          }).then(() => window.location.reload());
        }
      }}>Generate Invoice</Button>
    )}
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg flex justify-between items-center">
      <div>
        <h3 className="font-bold">{item.order_number}</h3>
        <p className="text-sm text-gray-500">{item.customer_name} - {item.status}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => {
        if (confirm('Generate Invoice?')) {
          fetch(\`/v1/stores/\${item.store_id}/sales\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ 
              customerName: item.customer_name, 
              customerEmail: item.customer_email,
              customerPhone: item.customer_phone,
              items: (item.items || []).map((i:any) => ({ itemId: i.item_id, qty: i.qty, unitPrice: i.unit_price, discountPct: i.discount_pct, gstRate: i.gst_rate })),
              saleType: 'individual'
            })
          }).then(() => window.location.reload());
        }
      }}>Generate Invoice</Button>
    </div>
  )
};

export const invoicesConfig: any = {
  customForm: PipelineDocumentForm,
  module: "sales", // points to the sales router which has a GET /
  storeLevel: true,
  title: "Invoices",
  singular: "Invoice",
  fields: [
    { key: "customer_name", label: "Customer Name", type: "text", required: true },
    { key: "status", label: "Status", type: "select", options: [{label:"Draft",value:"draft"},{label:"Issued",value:"issued"},{label:"Paid",value:"paid"},{label:"Overdue",value:"overdue"},{label:"Void",value:"void"}] },
    { key: "sale_date", label: "Date", type: "date" },
  ],
  blankForm: {},
  searchKeys: ["sale_number", "customer_name"],
  toPayload: (f: any) => {
    // Map snake_case to camelCase for the sales API
    const mapped: any = { ...f };
    if (f.customer_name) mapped.customerName = f.customer_name;
    if (f.sale_date) mapped.saleDate = f.sale_date;
    if (f.total_amount) mapped.totalAmount = f.total_amount;
    mapped.saleType = mapped.saleType || 'individual';
    
    // Map items
    if (f.items && Array.isArray(f.items)) {
      mapped.items = f.items.map((i: any) => ({
        itemId: i.item_id,
        qty: Number(i.qty),
        unitPrice: Number(i.unit_price),
        discountPct: Number(i.discount_pct || 0),
        gstRate: Number(i.gst_rate || 0)
      }));
    }
    return mapped;
  },
  columns: [
    { key: "sale_number", label: "Invoice Number", render: (v: any) => <strong>{v}</strong> },
    { key: "sale_date", label: "Date" },
    { key: "customer_name", label: "Customer Name" },
    { key: "status", label: "Status" },
    { key: "total_amount", label: "Total Amount" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.sale_number}</h3>
      <p className="text-sm text-gray-500">{item.customer_name} - \${item.total_amount} - {item.status}</p>
    </div>
  )
};
\`;

lines.splice(start, end - start, newConfigs);
fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', lines.join('\n'));
console.log('Fixed configs!');
