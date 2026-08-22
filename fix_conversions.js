const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const quoteActionCol = `
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
`;

const orderActionCol = `
    { key: "total_amount", label: "Total Amount" },
    { key: "actions", label: "Actions", render: (v: any, item: any) => (
      <Button variant="outline" size="sm" onClick={() => {
        if (confirm('Convert to Invoice?')) {
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
    )}
  ],
`;

c = c.replace(/\{\s*key:\s*"total_amount",\s*label:\s*"Total Amount"\s*\}\s*\],\s*renderCard/g, (match, offset) => {
  if (c.substring(Math.max(0, offset - 500), offset).includes('module: "quotations"')) {
    return quoteActionCol + '\n  renderCard';
  }
  if (c.substring(Math.max(0, offset - 500), offset).includes('module: "sales-orders"')) {
    return orderActionCol + '\n  renderCard';
  }
  return match;
});

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Added action columns');
