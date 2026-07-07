# college360 — Design System & Project Reference

> Module inside the NexusOS / DemandPlanning platform  
> Updated: July 2026

---

## Brand Inspiration

Theme selected from **The Eatfish Project** (TANSEED 8.0 batch-mate):  
**Ocean Teal + Solar Amber + Deep Navy** — carries the energy of Tamil Nadu's coastal startup ecosystem into a college career platform. Teal = growth, trust, opportunity. Amber = action, energy, ambition.

---

## Color Palette

| Role | Tailwind | Hex | Usage |
|------|----------|-----|-------|
| Primary (dark bg) | `teal-400` | `#2DD4BF` | Links, AI badges, active states on dark bg |
| Primary (light) | `teal-600` | `#0D9488` | Buttons, icons on light surfaces |
| Action / Paid | `amber-500` | `#F59E0B` | Premium CTA, paid feature lockouts, quota warnings |
| Background | `slate-950` | `#020617` | Page bg (keep current dark) |
| Surface / Cards | `slate-900` | `#0F172A` | Modal, card bg |
| Surface elevated | `slate-800` | `#1E293B` | Input bg, secondary card |
| Ink primary | `slate-100` | `#F1F5F9` | Headings, primary text |
| Ink secondary | `slate-400` | `#94A3B8` | Secondary text, labels |
| Muted | `slate-600` | `#475569` | Borders, disabled |
| Success | `green-400` | `#4ADE80` | Free tier, completed state |
| Error | `red-400` | `#F87171` | Error states |
| Gradient (hero) | teal→cyan | — | `from-teal-500 to-cyan-500` |

### Current legacy (violet/indigo) → migration path
- Keep violet gradient in hero and branding for now (existing users recognise it)
- New features (Interview Agent, Study Planner, Notifications) use **teal** as accent
- Paid/premium features use **amber** consistently

---

## Typography

```
Headings:  font-black / font-bold, tracking-tight
Body:      font-normal, text-sm (15px equivalent)
Labels:    text-xs, uppercase, tracking-wider, text-slate-400
Mono/code: font-mono (Consolas / Courier New)
```

### Scale in use
| Role | Class | Size |
|------|-------|------|
| Hero H1 | `text-4xl sm:text-6xl font-black` | 36–60px |
| Section heading | `text-xl font-bold` | 20px |
| Card title | `text-sm font-semibold` | 14px |
| Body | `text-sm` | 14px |
| Caption/label | `text-xs` | 12px |

---

## Component Patterns

### Modal shell
```tsx
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
    {/* header */}
    <div className="flex items-center justify-between p-5 border-b border-white/10">
    {/* body */}
    <div className="p-5 space-y-4">
```

### Badge pills
```tsx
{/* Free */}      <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Free</span>
{/* Paid */}      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Premium</span>
{/* Sprint1 */}   <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Sprint 1</span>
{/* AI */}        <span className="text-xs bg-teal-500/15 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full">AI</span>
```

### Primary button (teal)
```tsx
<button className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 rounded-xl text-sm font-bold transition">
```

### Ghost button
```tsx
<button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition">
```

### Input field
```tsx
<input className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-teal-500/50">
```

### Select dropdown
```tsx
<select className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50">
```

---

## localStorage Schema

| Key | Type | Description |
|-----|------|-------------|
| `college360_session` | `C360User` JSON | Active logged-in user |
| `college360_users` | `Array<C360User & {pw}>` | All registered accounts |
| `college360_profile_{id}` | `StudentProfile` JSON | Student career profile |
| `college360_recruiter_{id}` | `RecruiterProfile` JSON | Recruiter company profile |
| `college360_mentors` | `Mentor[]` JSON | Community mentor submissions |
| `c360_iq_{id}_{YYYY-MM}` | `number` (string) | Interview Q quota used this month |
| `c360_iq_sessions_{id}` | `IQSession[]` JSON | Saved practice sessions |
| `c360_notifs_{id}` | `Notification[]` JSON | In-app notifications (max 50) |
| `c360_outreach_log_{id}` | `OutreachEntry[]` JSON | Sent outreach records |
| `c360_threads_{id}` | `Thread[]` JSON | College/expert enquiry threads |
| `c360_study_plan_{id}` | `StudyPlan` JSON | Active study plan |
| `c360_projects` | `Project[]` JSON | Community project board |
| `c360_books_saved_{id}` | `string[]` | Saved book IDs |
| `c360_invite_count_{id}` | `number` (string) | Invite count for this user |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/extract-resume` | POST | AI profile extraction (Claude→Azure→OpenAI→Gemini cascade) |
| `/api/extract-transcript` | POST | AI transcript/marksheet extraction (same cascade) |
| `/api/interview-questions` | POST | AI-generated interview Q&A by tech + role + difficulty |
| `/api/send-email` | POST | Send transactional emails (uses SMTP/Resend) |
| `/api/outreach-draft` | POST | AI-drafted outreach email (Sprint 2) |
| `/api/study-planner` | POST | AI generates weekly study plan (Sprint 2) |
| `/api/college-enquiry` | POST | AI-assisted college enquiry draft (Sprint 2) |

### AI Provider Cascade (all AI routes)
```
1. Claude (claude-haiku-4-5) — PDF + image + text
2. Azure OpenAI (gpt-4o deployment) — image + text only
3. OpenAI (gpt-4o-mini) — image + text only
4. Gemini (flash-8b → 2.0-flash → 1.5-flash → 1.5-pro) — PDF + image + text
5. Claude retry — last resort
```

---

## User Roles

| Role | localStorage Key | Profile Type | Access |
|------|-----------------|--------------|--------|
| `student` | `college360_profile_{id}` | `StudentProfile` | All features, apply for jobs, connect with mentors |
| `recruiter` | `college360_recruiter_{id}` | `RecruiterProfile` | Post opportunities, browse student profiles |
| `mentor` | `college360_mentors[]` | `Mentor` | List on mentor board, receive booking requests |
| `parent` *(Sprint 2)* | `college360_profile_{id}` | Extended profile | Browse colleges, read-only access |

---

## Feature Status

### Sprint 1 — In Progress / Ship This Week
| Feature | Status | Key files |
|---------|--------|-----------|
| Change Password | ⬜ Todo | `page.tsx` — add modal |
| Personal Information Hub | ⬜ Todo | `page.tsx` — account settings modal |
| Notifications Hub | 🔄 In Progress | `page.tsx` — bell icon + dropdown |
| Invite Friends | ⬜ Todo | `page.tsx` — share modal |
| Books & Resources Feed | ⬜ Todo | `page.tsx` — new section |
| **Interview Question Agent** | ✅ **Built** | `page.tsx`, `/api/interview-questions/route.ts` |

### Sprint 2 — Next Sprint
| Feature | Status |
|---------|--------|
| Extended Profile Roles (Parent) | ⬜ Todo |
| Outreach Agent | ⬜ Todo |
| College Enquiry Agent | ⬜ Todo |
| Study Planner AI | ⬜ Todo |
| Project Work Board | ⬜ Todo |

### Phase 2 — Revenue
| Feature | Status |
|---------|--------|
| Mock Interview Booking | ⬜ Todo |
| Technical Help (Expert SOS) | ⬜ Todo |
| Thread Tracking | ⬜ Todo |
| Advertisement Area | ⬜ Todo |

---

## Quota System

```typescript
// Free tier: 50 interview questions / month
const QUOTA_KEY = (id: string) => `c360_iq_${id}_${new Date().toISOString().slice(0,7)}`;
const FREE_QUOTA = 50;

// Usage
const used = parseInt(localStorage.getItem(QUOTA_KEY(user.id)) || "0");
const remaining = user.premium ? Infinity : Math.max(0, FREE_QUOTA - used);
```

---

## Environment Variables (Vercel)

```
ANTHROPIC_API_KEY      Claude API key
GEMINI_API_KEY         Google Gemini API key  
AZURE_OPENAI_KEY       Azure OpenAI key
AZURE_OPENAI_ENDPOINT  Azure endpoint URL
AZURE_DEPLOYMENT_NAME  Deployment name (e.g. Aitento-model-gpt-4o)
OPENAI_API_KEY         OpenAI API key (gpt-4o-mini fallback)
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  Email sending
```

---

## Key Technical Decisions

- **Auth is 100% client-side** (localStorage). No backend session. This is intentional for the demo/MVP phase.
- **AI provider cascade** ensures the feature works even when one provider has quota issues.
- **`parseResumeTextLocally()`** provides instant offline fallback for text-paste resume extraction.
- **InlineText / InlineArea / ChipEditor** — click-to-edit primitives for profile fields.
- **ProfileViewModal** dispatches on role (student/recruiter/mentor) and renders role-specific view.
- Phone numbers for WhatsApp are stored in `wa_number` fields but **never exposed in AI responses**.
- Sensitive API keys **must NOT be committed to git** — always in Vercel env vars.

---

## Conventions

- Component naming: `PascalCase` inside `page.tsx`
- localStorage keys: `snake_case` with `c360_` prefix for new features, `college360_` for legacy auth
- AI routes: `app/api/{feature}/route.ts` — always use the 5-provider cascade pattern
- Error states: always show inline (never `alert()`), use red-tinted banner inside modal
- Loading states: `Loader2` icon with `animate-spin` + descriptive text
- Success states: green tint + auto-dismiss after 3s (use `setTimeout → setState`)
