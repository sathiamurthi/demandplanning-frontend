"use client";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Users, Bus, MapPin, TrendingUp, Siren, RefreshCw, Building2, CreditCard, Loader2, Settings, Save, CheckCircle } from "lucide-react";
import AccountTable from "../components/AccountTable";

interface Overview {
  organizations: number;
  drivers: { total: number; new7d: number; active24h: number };
  passengers: number;
  stops: number;
  trips: { total: number; active: number; completed7d: number };
  pickups7d: { picked: number; absent: number; pending: number };
  sos7d: number;
}
interface Org { id: string; name: string; org_type: string; driver_count: number; passenger_count: number; created_at: string }
interface ActivateResult { id: string; name: string; subscription_active_until: string }
interface TripRow { id: string; name: string; direction: string; status: string; driver_name: string; vehicle_number: string; organization_name: string; created_at: string }

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }
function auth() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

const StatCard = ({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span><Icon size={15} className="text-teal-600" /></div>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function SafeRide360Dashboard() {
  const [tab, setTab] = useState<"overview" | "organizations" | "drivers" | "trips" | "config">("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(() => {
    setLoading(true); setError("");
    fetch("/v1/superadmin/saferide360/overview", { headers: auth() })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d.data); else setError(d.error || "Failed to load"); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const loadOrgs = useCallback(() => {
    fetch("/v1/superadmin/saferide360/organizations", { headers: auth() }).then(r => r.json()).then(d => { if (d.success) setOrgs(d.data); });
  }, []);
  const loadTrips = useCallback(() => {
    fetch("/v1/superadmin/saferide360/trips", { headers: auth() }).then(r => r.json()).then(d => { if (d.success) setTrips(d.data); });
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => {
    if (tab === "organizations" && orgs.length === 0) loadOrgs();
    if (tab === "trips" && trips.length === 0) loadTrips();
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2"><ShieldCheck size={20} className="text-teal-600" /> SafeRide360 Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Organizations, drivers, passengers, live trips, pickup/absence rates, and SOS alerts.</p>
        </div>
        <button onClick={loadOverview} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl transition"><RefreshCw size={13} /> Refresh</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="flex gap-2 border-b border-gray-200">
        {(["overview", "organizations", "drivers", "trips", "config"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-bold capitalize border-b-2 -mb-px transition ${tab === t ? "border-teal-500 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        loading ? <p className="text-sm text-gray-400">Loading…</p> : overview && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Network</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Organizations" value={overview.organizations} icon={Building2} />
                <StatCard label="Drivers" value={overview.drivers.total} sub={`+${overview.drivers.new7d} this week · ${overview.drivers.active24h} active 24h`} icon={Bus} />
                <StatCard label="Passengers" value={overview.passengers} icon={Users} />
                <StatCard label="Stops" value={overview.stops} icon={MapPin} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Trips</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Trips" value={overview.trips.total} icon={TrendingUp} />
                <StatCard label="Active Now" value={overview.trips.active} icon={TrendingUp} />
                <StatCard label="Completed (7d)" value={overview.trips.completed7d} icon={TrendingUp} />
                <StatCard label="SOS Alerts (7d)" value={overview.sos7d} icon={Siren} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pickup Outcomes (7d)</h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-8 flex-wrap">
                <div><p className="text-2xl font-black text-green-600">{overview.pickups7d.picked}</p><p className="text-xs text-gray-400 mt-0.5">Picked up</p></div>
                <div><p className="text-2xl font-black text-gray-500">{overview.pickups7d.absent}</p><p className="text-xs text-gray-400 mt-0.5">Marked absent</p></div>
                <div><p className="text-2xl font-black text-amber-600">{overview.pickups7d.pending}</p><p className="text-xs text-gray-400 mt-0.5">Still pending</p></div>
              </div>
            </div>
          </div>
        )
      )}

      {tab === "organizations" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-center gap-2">
            <CreditCard size={13} className="shrink-0" /> No live payment gateway yet — after confirming a package purchase (₹100/passenger/month) out-of-band, extend the org's paid-up-until date here.
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Drivers</th><th className="text-left px-4 py-3">Passengers</th><th className="text-left px-4 py-3">Created</th><th className="text-left px-4 py-3">Extend Subscription</th></tr>
            </thead>
            <tbody>
              {orgs.map(o => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{o.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">{o.org_type}</td>
                  <td className="px-4 py-2.5 text-gray-900">{o.driver_count}</td>
                  <td className="px-4 py-2.5 text-gray-900">{o.passenger_count}</td>
                  <td className="px-4 py-2.5 text-gray-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-2.5"><ExtendSubscription orgId={o.id} /></td>
                </tr>
              ))}
              {orgs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No organizations yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "drivers" && (
        <AccountTable
          listUrl="/v1/superadmin/saferide360/drivers"
          actionBase="/v1/superadmin/saferide360/drivers"
          emptyLabel="No drivers yet."
          columns={[
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "vehicle_number", label: "Vehicle", render: r => <>{r.vehicle_type} · {r.vehicle_number}</> },
            { key: "organization_name", label: "Organization" },
            { key: "created_at", label: "Registered", render: r => new Date(r.created_at).toLocaleDateString("en-IN") },
          ]}
        />
      )}

      {tab === "trips" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr><th className="text-left px-4 py-3">Trip</th><th className="text-left px-4 py-3">Organization</th><th className="text-left px-4 py-3">Driver</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Created</th></tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{t.name} <span className="text-[10px] text-gray-400">({t.direction})</span></td>
                  <td className="px-4 py-2.5 text-gray-500">{t.organization_name}</td>
                  <td className="px-4 py-2.5 text-gray-900">{t.driver_name} <span className="text-[10px] text-gray-400">{t.vehicle_number}</span></td>
                  <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-teal-50 text-teal-700" : t.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>{t.status}</span></td>
                  <td className="px-4 py-2.5 text-gray-400">{new Date(t.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {trips.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No trips yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "config" && <ConfigTab />}
    </div>
  );
}

// Notification cleanup schedule shown to parents — "keep last N days" is a
// setting here (platform_config key "saferide360"), not a hardcoded number
// in the backend job.
function ConfigTab() {
  const [days, setDays] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    fetch("/v1/superadmin/platform-config", { headers: auth() })
      .then(r => r.json())
      .then(d => { const n = d?.data?.saferide360?.notificationRetentionDays; if (n) setDays(String(n)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const n = parseInt(days, 10);
    if (!n || n <= 0) { setStatus("err"); return; }
    setSaving(true); setStatus("idle");
    try {
      const r = await fetch("/v1/superadmin/platform-config", {
        method: "PUT", headers: auth(), body: JSON.stringify({ key: "saferide360", value: { notificationRetentionDays: n } }),
      });
      setStatus(r.ok ? "ok" : "err");
    } catch { setStatus("err"); }
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-md space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="font-black text-gray-900 text-sm flex items-center gap-2"><Settings size={15} className="text-teal-600" /> Guardian Notification Cleanup</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">Parents see notifications grouped by date in their app. Older notifications are purged automatically on this schedule (checked every 6 hours).</p>
        <div className="flex items-center gap-2">
          <input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold" />
          <span className="text-sm text-gray-500">days of history to keep</span>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
          {status === "ok" && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Saved</span>}
          {status === "err" && <span className="text-sm text-red-500">Save failed — enter a number of days &gt; 0</span>}
        </div>
      </div>
    </div>
  );
}

function ExtendSubscription({ orgId }: { orgId: string }) {
  const [months, setMonths] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const activate = () => {
    const m = parseInt(months, 10);
    if (!m || m <= 0) return;
    setBusy(true); setMsg("");
    fetch("/v1/superadmin/saferide360/activate-subscription", {
      method: "POST", headers: auth(), body: JSON.stringify({ organization_id: orgId, months: m }),
    })
      .then(r => r.json())
      .then((d: { success: boolean; data?: ActivateResult; error?: string }) => {
        if (d.success && d.data) setMsg(`Active until ${new Date(d.data.subscription_active_until).toLocaleDateString("en-IN")}`);
        else setMsg(d.error || "Failed");
      })
      .catch(e => setMsg(e.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex items-center gap-1.5">
      <input value={months} onChange={e => setMonths(e.target.value)} type="number" min={1} className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs" />
      <span className="text-[10px] text-gray-400">mo</span>
      <button onClick={activate} disabled={busy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition">
        {busy ? <Loader2 size={11} className="animate-spin" /> : <CreditCard size={11} />} Activate
      </button>
      {msg && <span className="text-[10px] text-teal-600 font-bold">{msg}</span>}
    </div>
  );
}
