const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDMiLCJlbWFpbCI6Im93bmVyQG1lZGNhcmUuY29tIiwicm9sZSI6Im93bmVyIiwidGVuYW50SWQiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDEiLCJzdG9yZUlkIjoiMzMzMzMzMzMtNDQ0NC01NTU1LTY2NjYtNzc3Nzc3Nzc3NzAyIiwiaW5kdXN0cnlJZCI6InBoYXJtYSIsInRlYVJvbGVJZCI6bnVsbCwiaWF0IjoxNzg3MzgxMjI4LCJleHAiOjE3ODc0MTAwMjh9.7fBskSzf3ova8n56ZjJlJ5QN5E2SD3sH_ModDXy6Uyk';
const tenantId = '33333333-4444-5555-6666-777777777701';

const units = [
  { name: "Box", symbol: "BOX", category: "count", is_active: true },
  { name: "Kilogram", symbol: "KG", category: "weight", is_active: true },
  { name: "Liter", symbol: "L", category: "volume", is_active: true },
  { name: "Piece", symbol: "PCS", category: "count", is_active: true }
];

async function run() {
  for (const unit of units) {
    const r = await fetch(`https://www.demandgeniusai.com/v1/tenants/${tenantId}/units`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unit)
    });
    console.log(r.status, await r.text());
  }
}
run();
