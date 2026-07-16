"use client";
import { useCallback, useEffect, useState } from "react";
import { Car, Users, TrendingUp, Gift, Bot, RefreshCw } from "lucide-react";
import AccountTable, { type AccountRow } from "../components/AccountTable";

interface Overview {
  users: {
    driversTotal: number; customersTotal: number;
    driversNew7d: number; customersNew7d: number;
    driversActive24h: number; customersActive24h: number;
    driversActive7d: number; customersActive7d: number;
    driversPaidPlan: number; customersPaidPlan: number;
  };
  rides: { paidRides: number; emptyRidesCompleted: number; totalFare: number; totalPiggySaved: number };
  emptyRideConversion: { totalCompleted: number; leadsGenerated: number; converted: number; conversionRatePct: number };
  invites: { total: number };
  aiUsage: { feature: string; n: number }[];
}
interface Invite { id: string; referrer_type: string; referrer_name: string; invitee_type: string; invitee_name: string; created_at: string }

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }
function auth() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

const StatCard = ({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span><Icon size={15} className="text-orange-500" /></div>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function Ride360Dashboard() {
  const [tab, setTab] = useState<"overview" | "users" | "invites" | "ai">("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [aiUsage, setAiUsage] = useState<{ feature: string; day: string; n: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(() => {
    setLoading(true); setError("");
    fetch("/v1/superadmin/ride360/overview", { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d.data); else setError(d.error || "Failed to load"); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const loadInvites = useCallback(() => {
    fetch("/v1/superadmin/ride360/invites", { headers: auth() }).then(r => r.json()).then(d => { if (d.success) setInvites(d.data); });
  }, []);
  const loadAIUsage = useCallback(() => {
    fetch("/v1/superadmin/ride360/ai-usage", { headers: auth() }).then(r => r.json()).then(d => { if (d.success) setAiUsage(d.data); });
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => {
    if (tab === "invites" && invites.length === 0) loadInvites();
    if (tab === "ai" && aiUsage.length === 0) loadAIUsage();
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2"><Car size={20} className="text-orange-500" /> Ride360 Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Registered/active users, empty-run conversion, invites, AI-usage, and subscription-plan counts.</p>
        </div>
        <button onClick={loadOverview} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl transition"><RefreshCw size={13} /> Refresh</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="flex gap-2 border-b border-gray-200">
        {(["overview", "users", "invites", "ai"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-bold capitalize border-b-2 -mb-px transition ${tab === t ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {t === "ai" ? "AI Usage" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        loading ? <p className="text-sm text-gray-400">Loading…</p> : overview && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Users</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Drivers" value={overview.users.driversTotal} sub={`+${overview.users.driversNew7d} this week`} icon={Users} />
                <StatCard label="Customers" value={overview.users.customersTotal} sub={`+${overview.users.customersNew7d} this week`} icon={Users} />
                <StatCard label="Active 24h" value={overview.users.driversActive24h + overview.users.customersActive24h} sub={`${overview.users.driversActive24h} drivers, ${overview.users.customersActive24h} customers`} icon={TrendingUp} />
                <StatCard label="Active 7d" value={overview.users.driversActive7d + overview.users.customersActive7d} sub={`${overview.users.driversActive7d} drivers, ${overview.users.customersActive7d} customers`} icon={TrendingUp} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Rides &amp; Subscription</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Paid Rides" value={overview.rides.paidRides} sub={`₹${overview.rides.totalFare.toLocaleString("en-IN")} total fare`} icon={Car} />
                <StatCard label="Empty Runs" value={overview.rides.emptyRidesCompleted} icon={Car} />
                <StatCard label="Piggy Saved" value={`₹${overview.rides.totalPiggySaved.toLocaleString("en-IN")}`} icon={TrendingUp} />
                <StatCard label="Paid-Plan Users" value={overview.users.driversPaidPlan + overview.users.customersPaidPlan} sub="free tier otherwise — subscription model groundwork" icon={TrendingUp} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Empty-Run Lead &amp; Conversion</h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-8 flex-wrap">
                <div><p className="text-2xl font-black text-gray-900">{overview.emptyRideConversion.totalCompleted}</p><p className="text-xs text-gray-400 mt-0.5">Empty runs completed</p></div>
                <div><p className="text-2xl font-black text-gray-900">{overview.emptyRideConversion.leadsGenerated}</p><p className="text-xs text-gray-400 mt-0.5">Leads generated (outreach happened)</p></div>
                <div><p className="text-2xl font-black text-gray-900">{overview.emptyRideConversion.converted}</p><p className="text-xs text-gray-400 mt-0.5">Converted to a completed ride</p></div>
                <div><p className="text-2xl font-black text-orange-600">{overview.emptyRideConversion.conversionRatePct}%</p><p className="text-xs text-gray-400 mt-0.5">Conversion rate</p></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Invites</h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3">
                <Gift size={18} className="text-orange-500" />
                <span className="text-2xl font-black text-gray-900">{overview.invites.total}</span>
                <span className="text-xs text-gray-400">total tracked invites — see the Invites tab for who invited whom</span>
              </div>
            </div>
          </div>
        )
      )}

      {tab === "users" && (
        <AccountTable
          listUrl="/v1/superadmin/ride360/users"
          actionBase={(row) => `/v1/superadmin/ride360/${row.type === "driver" ? "drivers" : "customers"}`}
          emptyLabel="No users yet."
          columns={[
            { key: "type", label: "Type", render: r => <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type === "driver" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>{r.type}</span> },
            { key: "name", label: "Name / Contact", render: r => <>{r.name || r.phone || r.email || "—"}{r.vehicle_type ? ` · ${r.vehicle_type}` : ""}</> },
            { key: "subscription_plan", label: "Plan" },
            { key: "created_at", label: "Registered", render: r => new Date(r.created_at).toLocaleDateString("en-IN") },
            { key: "last_login_at", label: "Last Login", render: r => r.last_login_at ? new Date(r.last_login_at).toLocaleDateString("en-IN") : "—" },
          ]}
        />
      )}

      {tab === "invites" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr><th className="text-left px-4 py-3">Referrer</th><th className="text-left px-4 py-3">Invitee</th><th className="text-left px-4 py-3">Joined</th></tr>
            </thead>
            <tbody>
              {invites.map(i => (
                <tr key={i.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{i.referrer_name} <span className="text-[10px] text-gray-400 capitalize">({i.referrer_type})</span></td>
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{i.invitee_name} <span className="text-[10px] text-gray-400 capitalize">({i.invitee_type})</span></td>
                  <td className="px-4 py-2.5 text-gray-400">{new Date(i.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {invites.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No invites tracked yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ai" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
            <Bot size={14} className="shrink-0" /> Ride360 doesn't call a real LLM anywhere — these are invocation counts for the rule-based "AI" features (empty-ride cost analysis, driver suggestions), tracked as a usage proxy.
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr><th className="text-left px-4 py-3">Feature</th><th className="text-left px-4 py-3">Day</th><th className="text-left px-4 py-3">Count</th></tr>
              </thead>
              <tbody>
                {aiUsage.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 text-gray-900 font-medium">{row.feature}</td>
                    <td className="px-4 py-2.5 text-gray-400">{new Date(row.day).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-gray-900 font-bold">{row.n}</td>
                  </tr>
                ))}
                {aiUsage.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No AI-feature usage logged yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
