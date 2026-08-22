const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const invoicePayloadMap = `
  toPayload: (f: any) => {
    // Map snake_case to camelCase for the sales API
    const mapped: any = { ...f };
    if (f.customer_name) mapped.customerName = f.customer_name;
    if (f.sale_date) mapped.saleDate = f.sale_date;
    if (f.total_amount) mapped.totalAmount = f.total_amount;
    
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
`;

c = c.replace(
  'export const invoicesConfig: any = {\n  customForm: PipelineDocumentForm,\n  module: "sales",',
  'export const invoicesConfig: any = {\n  customForm: PipelineDocumentForm,\n  module: "sales",'
);

c = c.replace(/toPayload: \(f: any\) => f,/g, (match, offset) => {
  if (c.substring(Math.max(0, offset - 100), offset).includes('module: "sales"')) {
    return invoicePayloadMap;
  }
  return match;
});

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Fixed invoice payload mapping');
