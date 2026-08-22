const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

c = c.replace(/export const quotationsConfig: any = \{[\s\S]*?renderCard: \(item: any\) => \([\s\S]*?\n\};/g, `export const quotationsConfig: any = {
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
};`);

c = c.replace(/export const salesOrdersConfig: any = \{[\s\S]*?renderCard: \(item: any\) => \([\s\S]*?\n\};/g, `export const salesOrdersConfig: any = {
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
};`);

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Fixed configs using Regex!');
