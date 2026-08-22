const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

c = c.replace(/export const invoicesConfig: any = \{[\s\S]*?renderCard: \(item: any\) => \([\s\S]*?\n\};/g, `export const invoicesConfig: any = {
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
    const mapped = { ...f };
    if (f.customer_name) mapped.customerName = f.customer_name;
    if (f.sale_date) mapped.saleDate = f.sale_date;
    if (f.total_amount) mapped.totalAmount = f.total_amount;
    mapped.saleType = mapped.saleType || 'individual';
    
    // Map items
    if (f.items && Array.isArray(f.items)) {
      mapped.items = f.items.map((i: any) => ({
        itemId: i.item_id || i.itemId,
        qtySold: Number(i.qty || i.qtySold),
        unitPrice: Number(i.unit_price || i.unitPrice),
        discountPct: Number(i.discount_pct || i.discountPct || 0),
        gstRate: Number(i.gst_rate || i.gstRate || 0),
        unitId: (i.unit_id && String(i.unit_id) !== "null" && String(i.unit_id).length > 10) ? String(i.unit_id) : undefined
      }));
    }
    return mapped;
  },
  columns: [
    { key: "sale_number", label: "Invoice Number", render: (v: any) => <strong>{v}</strong> },
    { key: "status", label: "Status" },
    { key: "sale_date", label: "Date" },
    { key: "customer_name", label: "Customer Name" },
    { key: "total_amount", label: "Total Amount" }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.sale_number}</h3>
      <p className="text-sm text-gray-500">{item.customer_name} - \${item.total_amount} - {item.status}</p>
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
      <Button variant="secondary" onClick={() => {
        if (confirm('Generate Invoice for this order?')) {
          fetch(\`/v1/stores/\${item.store_id}/sales\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ 
              customerName: item.customer_name, 
              customerEmail: item.customer_email,
              customerPhone: item.customer_phone,
              items: (item.items || []).map((i:any) => ({ 
                itemId: i.item_id || i.itemId, 
                qtySold: Number(i.qty), 
                unitPrice: i.unit_price || i.unitPrice, 
                discountPct: i.discount_pct || i.discountPct, 
                gstRate: i.gst_rate || i.gstRate,
                unitId: (i.unit_id && String(i.unit_id) !== "null" && String(i.unit_id).length > 10) ? String(i.unit_id) : undefined 
              })),
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
      <Button variant="secondary" onClick={() => {
        if (confirm('Generate Invoice?')) {
          fetch(\`/v1/stores/\${item.store_id}/sales\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify({ 
              customerName: item.customer_name, 
              customerEmail: item.customer_email,
              customerPhone: item.customer_phone,
              items: (item.items || []).map((i:any) => ({ 
                itemId: i.item_id || i.itemId, 
                qtySold: Number(i.qty), 
                unitPrice: i.unit_price || i.unitPrice, 
                discountPct: i.discount_pct || i.discountPct, 
                gstRate: i.gst_rate || i.gstRate,
                unitId: (i.unit_id && String(i.unit_id) !== "null" && String(i.unit_id).length > 10) ? String(i.unit_id) : undefined 
              })),
              saleType: 'individual'
            })
          }).then(() => window.location.reload());
        }
      }}>Generate Invoice</Button>
    </div>
  )
};`);

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Fixed everything');
