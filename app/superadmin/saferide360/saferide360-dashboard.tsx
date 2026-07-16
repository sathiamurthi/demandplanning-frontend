"use client";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Users, Bus, MapPin, TrendingUp, Siren, RefreshCw, Building2 } from "lucide-react";

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
  const [tab, setTab] = useState<"overview" | "organizations" | "trips">("overview");
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
        {(["overview", "organizations", "trips"] as const).map(t => (
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Drivers</th><th className="text-left px-4 py-3">Passengers</th><th className="text-left px-4 py-3">Created</th></tr>
            </thead>
            <tbody>
              {orgs.map(o => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{o.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">{o.org_type}</td>
                  <td className="px-4 py-2.5 text-gray-900">{o.driver_count}</td>
                  <td className="px-4 py-2.5 text-gray-900">{o.passenger_count}</td>
                  <td className="px-4 py-2.5 text-gray-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {orgs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No organizations yet.</td></tr>}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
