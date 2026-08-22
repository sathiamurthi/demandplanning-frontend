const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDMiLCJlbWFpbCI6Im93bmVyQG1lZGNhcmUuY29tIiwicm9sZSI6Im93bmVyIiwidGVuYW50SWQiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDEiLCJzdG9yZUlkIjoiMzMzMzMzMzMtNDQ0NC01NTU1LTY2NjYtNzc3Nzc3Nzc3NzAyIiwiaW5kdXN0cnlJZCI6InBoYXJtYSIsInRlYVJvbGVJZCI6bnVsbCwiaWF0IjoxNzg3MzgxMjI4LCJleHAiOjE3ODc0MTAwMjh9.7fBskSzf3ova8n56ZjJlJ5QN5E2SD3sH_ModDXy6Uyk';
const tenantId = '33333333-4444-5555-6666-777777777701';
const storeId = '33333333-4444-5555-6666-777777777702';

async function req(path, method, body) {
  const r = await fetch(`https://www.demandgeniusai.com/v1/tenants/${tenantId}/stores/${storeId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  console.log(`[${method}] ${path} -> ${r.status}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function run() {
  // Get items to use
  const items = await req('/items', 'GET');
  if (!items.data || !items.data.length) { console.log("No items found, can't create orders"); return; }
  const item = items.data[0];

  console.log("=== Creating Test Flow ===");

  // 1. Lead
  const lead = await req('/leads', 'POST', {
    customer_name: "Test Lead User",
    customer_email: "test@lead.com",
    customer_phone: "1234567890",
    status: "New",
    source: "Web",
    notes: "Test data created via agent script"
  });
  console.log("Lead created:", lead);

  // 2. Quotation
  const quote = await req('/quotations', 'POST', {
    customer_name: "Test Lead User",
    customer_email: "test@lead.com",
    status: "Draft",
    items: [
      { itemId: item.id, qty: 10, unitPrice: 15.50, discountPct: 0, gstRate: 0 }
    ]
  });
  console.log("Quotation created:", quote);

  // 3. Sales Order
  const so = await req('/sales-orders', 'POST', {
    customer_name: "Test Lead User",
    customer_email: "test@lead.com",
    status: "Pending",
    items: [
      { itemId: item.id, qty: 5, unitPrice: 20.00, discountPct: 0, gstRate: 0 }
    ]
  });
  console.log("Sales Order created:", so);

  // 4. Invoice
  const invoice = await req('/sales', 'POST', {
    customerName: "Test Lead User",
    customerEmail: "test@lead.com",
    saleType: "individual",
    items: [
      { itemId: item.id, qtySold: 2, unitPrice: 50.00, discountPct: 0, gstRate: 0 }
    ]
  });
  console.log("Invoice created:", invoice);
}

run();
