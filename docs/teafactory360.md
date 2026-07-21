# TeaFactory360 — Sample User Journeys

TeaFactory360 is the branded UI on top of the existing tenant-scoped "tea" industry
module. Code, tables, and API routes stay `tea_*` / `/tea/*` — only the sidebar/login
branding says "TeaFactory360". Same shared Postgres DB as the rest of the platform,
same auth (`/v1/auth/login`), same tenant model.

## Demo login

- URL: `/login` → redirects into `/tea` after auth
- Email: `owner@abcteaagency.com`
- Password: `Admin@123`
- Tenant: **ABC Tea Agency** (`aaaaaaaa-1111-2222-3333-444444444401`)

The seeded demo tenant currently has one user (`owner`), which — per the existing
`requireRole(...)` guards on every endpoint — has access to every module below. In a
real deployment, the owner would invite separate logins for each role (manager, staff,
driver, estate_manager, maintenance, collection_manager, store_keeper, sales_manager);
the journeys below describe what *that role* would see and do, demoable today through
the one owner login.

Growers/agents themselves use a **separate lightweight portal** (`/grower/login`,
phone + PIN), not this owner-facing app — unchanged by this build.

---

## 1. Owner — daily pulse + AI assistant

1. Logs into `/tea` — dashboard shows today's collection, pending grower payments,
   dispatches, open maintenance tickets, overdue compliance items.
2. Opens **AI Assistant** (`/tea/ai` → "Ask Owner Assistant" tab), asks *"How did today
   go?"* — Claude answers in plain language using only today's real numbers (no
   invented figures).
3. Checks **Compliance** (`/tea/compliance`) renewal calendar — sees the seeded
   "Pollution NOC" flagged **overdue** and vehicle insurance overdue; clicks
   **AI Summary** for a one-paragraph, most-urgent-first narrative.
4. Reviews **Ops Intelligence** (`/tea/ai` → Ops tab): farmer comparison ranking,
   fuel-consumption anomalies, month-over-month budget alerts, predictive maintenance
   nudges — all AI/heuristic-backed, explained plainly.

## 2. Clerk / Collection Manager — daily leaf intake

1. Opens **Collections** (`/tea/collections`), starts (or opens) today's batch.
2. Instead of typing, pastes a transcribed voice note into **AI Assistant → Voice/
   WhatsApp Intake** (`/tea/ai`, "Voice/WhatsApp Intake" tab): *"Murugan 45 kg grade A
   today"* → Claude returns a structured draft (grower match, weight, grade,
   confidence) — the clerk reviews and manually confirms it as a real collection entry
   (the AI never writes directly to `tea_collections`).
3. Adds the entry, prints the grower's collection slip.
4. Advances the batch through **Production Stage** controls at the bottom of the same
   page: `intake → withering → firing → grading` (enters made-tea kg at grading —
   yield % is computed automatically from green-leaf-in vs. made-tea-out).

## 3. Driver — fleet log + live location

1. Opens **Fleet & Live Map** (`/tea/fleet`).
2. On the **Vehicles** tab, taps **Update My Location** — browser geolocation
   broadcasts lat/lng to `tea_vehicles.live_lat/lng`, shown instantly on the Leaflet
   map (phone-based today; same column shape a future Traccar webhook could write into
   without a schema change).
3. Logs a completed trip under the **Trips** tab (distance, fuel used).
4. If the vehicle needs service, a maintenance reminder already shows under the
   **Maintenance** tab (seeded: one overdue insurance renewal, one due-soon service).

## 4. Estate Manager — workforce & payroll

1. Opens **Estate & Payroll** (`/tea/estate`).
2. **Workers & Plots** tab: sees the two seeded plots (North Slope, River Block) and
   three workers (Kamala, Muthu, Selvi); adds a new worker if needed.
3. **Attendance & Wages** tab: marks daily attendance (present/absent/half-day) — wage
   auto-computes from the worker's own daily rate; absent days compute to ₹0 rather
   than being left blank. Views the 7-day wage total per worker (already seeded with 6
   present + 1 absent day per worker).
4. Clicks **Generate Payroll** next to a worker — EPF (12%) and ESI (0.75% under
   ₹21,000 wage ceiling) are computed automatically; net pay shown on the **Payroll**
   tab, markable as paid once disbursed.
5. **Insurance** tab: tracks group-health policy expiry per worker (seeded: Muthu's
   Star Health policy, 200 days out).

## 5. Maintenance — machines & vendor quotes

1. Opens **Machinery & Vendors** (`/tea/machinery`).
2. **Machines** tab: sees CTC Roller #1 (needs_service after the seeded ticket) and
   Main Drier.
3. Raises a new ticket, or opens the seeded one ("Roller bearing noise") and clicks
   **Quotes** — sees two vendor quotes already on file (Coonoor Engineering ₹4,500/3
   days vs. Nilgiris Electricals ₹4,200/5 days).
4. Clicks **AI Recommend** — Claude picks the best *value* (not just lowest price,
   factoring delivery time) and marks it with a ★ on the quote list.
5. Closes the ticket once repaired — the machine automatically flips back to `ok`
   status and its last-service date updates.

## 6. Sales Manager — auction & private sales

1. Opens **Sales & Auction** (`/tea/sales`).
2. **Auction Lots** tab: sees the seeded Coonoor lot (500 kg, reserve ₹180/kg, already
   sold at ₹195/kg — 8.3% above reserve).
3. **Sales** tab: logs a private sale (already seeded: 300 kg to Chennai Tea Traders at
   ₹210/kg).
4. **Report** tab: revenue-by-channel breakdown and auction-vs-reserve performance,
   computed directly from the transactions above.

## 7. Store Keeper — inventory & indents

1. Opens **Inventory** (`/tea/inventory`).
2. **Stock Items** tab: Tea Chest Boxes (130 left after a seeded issue) and Poly Liners
   (30 left, **below its 40-unit reorder level** — flagged in red).
3. **Indents** tab: approves a pending Poly Liners indent, then **Issues** it — stock
   deducts only on physical hand-off, not at approval time, so on-hand quantity always
   reflects what's actually left in the store.

## 8. Agent — grower intake (separate portal, unchanged)

Growers/collection agents continue to use the existing `/grower/login` (phone + PIN)
portal — outside the scope of this build, since the user asked to keep that module as-is.

---

## What's real vs. simplified (be upfront about this)

- **Payroll EPF/ESI/TDS** uses simplified standard-slab rates (EPF 12%, ESI 0.75% under
  ₹21,000, TDS defaulted to 0) — flagged in the code and on the Payroll page itself as
  needing review against a compliance professional before real statutory filing.
- **Live vehicle tracking** is phone-based (driver's browser broadcasts GPS), not a
  hardware GPS tracker or Traccar — by explicit choice, since hardware/Traccar hosting
  costs weren't approved. Column shapes are Traccar-webhook-compatible for a future
  swap.
- **AI features** (intake parsing, payment summaries, owner assistant, vendor
  recommendation, maintenance/fuel/budget/compliance alerts, farmer comparison) all use
  the same Claude integration already live elsewhere in this codebase. If the
  `ANTHROPIC_API_KEY` account runs low on credits, these specific endpoints will return
  a billing error from Anthropic — everything else in TeaFactory360 is unaffected.
