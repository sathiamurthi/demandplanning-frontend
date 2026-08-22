const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDMiLCJlbWFpbCI6Im93bmVyQG1lZGNhcmUuY29tIiwicm9sZSI6Im93bmVyIiwidGVuYW50SWQiOiIzMzMzMzMzMy00NDQ0LTU1NTUtNjY2Ni03Nzc3Nzc3Nzc3MDEiLCJzdG9yZUlkIjoiMzMzMzMzMzMtNDQ0NC01NTU1LTY2NjYtNzc3Nzc3Nzc3NzAyIiwiaW5kdXN0cnlJZCI6InBoYXJtYSIsInRlYVJvbGVJZCI6bnVsbCwiaWF0IjoxNzg3MzgxMjI4LCJleHAiOjE3ODc0MTAwMjh9.7fBskSzf3ova8n56ZjJlJ5QN5E2SD3sH_ModDXy6Uyk';
const baseUrl = 'https://dplan-backend.onrender.com/v1'; // Assuming Render URL or I can just hit localhost if I run it locally.
// Actually wait, I will hit https://demandgenious-backend.onrender.com/v1 or whatever the domain is.
// But wait, the user's frontend is calling https://www.demandgeniusai.com/v1 maybe through Next.js proxy?
// Let's check next.config.mjs to see where it proxies /v1 to!
