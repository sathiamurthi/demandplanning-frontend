const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDMiLCJlbWFpbCI6Im93bmVyQG1lZGNhcmUuY29tIiwicm9sZSI6Im93bmVyIiwidGVuYW50SWQiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDEiLCJzdG9yZUlkIjoiMzMzMzMzMzMtNDQ0NC01NTU1LTY2NjYtNzc3Nzc3Nzc3NzAyIiwiaW5kdXN0cnlJZCI6InBoYXJtYSIsInRlYVJvbGVJZCI6bnVsbCwiaWF0IjoxNzg3MzgxMjI4LCJleHAiOjE3ODc0MTAwMjh9.7fBskSzf3ova8n56ZjJlJ5QN5E2SD3sH_ModDXy6Uyk';

async function run() {
  const r = await fetch('https://www.demandgeniusai.com/v1/units', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(r.status, await r.text());
}
run();
