#!/usr/bin/env node
/**
 * seed-users.mjs
 * Creates sample Factory / Agent / Grower demo accounts on the backend.
 * Run: node scripts/seed-users.mjs
 */

const BACKEND = "https://demandplanning-backend.onrender.com";

const USERS = [
  {
    name: "Siva Kumar (Factory Owner)",
    email: "factory.owner@teafactory360.com",
    password: "Factory@123",
    role: "owner",
    industryId: "tea",
    phone: "+919876540001",
  },
  {
    name: "Ravi Tea Maker",
    email: "tea.maker@teafactory360.com",
    password: "TeaMaker@123",
    role: "tea_maker",
    industryId: "tea",
    phone: "+919876540002",
  },
  {
    name: "Mani Store Keeper",
    email: "store.keeper@teafactory360.com",
    password: "Store@123",
    role: "store_keeper",
    industryId: "tea",
    phone: "+919876540003",
  },
  {
    name: "Anbu Accountant",
    email: "accountant@teafactory360.com",
    password: "Account@123",
    role: "accountant",
    industryId: "tea",
    phone: "+919876540004",
  },
  {
    name: "Kumar Agent",
    email: "agent@teafactory360.com",
    password: "Agent@123",
    role: "agent",
    industryId: "tea",
    phone: "+919876540005",
  },
  {
    name: "Murugan Grower",
    email: "grower@teafactory360.com",
    password: "Grower@123",
    role: "grower",
    industryId: "tea",
    phone: "+919876540006",
  },
];

async function warmUp() {
  console.log("🔥 Warming up backend (Render free tier)…");
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${BACKEND}/v1/health`, { signal: AbortSignal.timeout(12_000) });
      if (r.ok) { console.log("✅ Backend is awake"); return true; }
    } catch {}
    console.log(`   Attempt ${i + 1}/3 — waiting 10s…`);
    await new Promise(r => setTimeout(r, 10_000));
  }
  console.warn("⚠️  Backend did not respond — will try anyway");
  return false;
}

async function registerUser(user) {
  try {
    const res = await fetch(`${BACKEND}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 409 || data?.message?.includes("already")) {
      console.log(`  ⏭  ${user.email} — already exists (skip)`);
      return "exists";
    }
    if (res.ok || res.status === 201) {
      console.log(`  ✅ ${user.email} — created`);
      return "created";
    }
    console.log(`  ❌ ${user.email} — ${res.status}: ${data?.message ?? data?.error ?? "unknown"}`);
    return "error";
  } catch (e) {
    console.log(`  ❌ ${user.email} — network error: ${e.message}`);
    return "error";
  }
}

async function main() {
  console.log("\n🍵 TeaFactory360 — Sample User Seeder\n");
  await warmUp();

  console.log("\n📋 Creating users…");
  const results = {};
  for (const user of USERS) {
    results[user.role] = await registerUser(user);
    await new Promise(r => setTimeout(r, 500)); // small gap between requests
  }

  const created = Object.values(results).filter(r => r === "created").length;
  const exists  = Object.values(results).filter(r => r === "exists").length;

  console.log(`\n✅ Done — ${created} created, ${exists} already existed\n`);
  console.log("─────────────────────────────────────────────────");
  console.log("LOGIN CREDENTIALS");
  console.log("─────────────────────────────────────────────────");
  console.log("URL: https://demandgenious.vercel.app/tea-factory-login\n");
  for (const u of USERS) {
    console.log(`${u.name.padEnd(30)} ${u.email}`);
    console.log(`${"".padEnd(30)} Password: ${u.password}`);
    console.log(`${"".padEnd(30)} Role: ${u.role}\n`);
  }
  console.log("─────────────────────────────────────────────────");
  console.log("OWNER (full access): https://demandgenious.vercel.app/tea-login");
  console.log("  Email:    dnmsathia@hotmail.com");
  console.log("  Password: Qasd!@#45");
  console.log("─────────────────────────────────────────────────\n");
}

main();
