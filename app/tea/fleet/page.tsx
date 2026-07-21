"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, Truck, Wrench, Navigation } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

const TeaFleetMap = dynamic(() => import("../components/TeaFleetMap"), { ssr: false });

interface Vehicle { id: string; vehicle_number: string; driver_name: string; driver_phone: string; is_rental: boolean; live_lat: number | null; live_lng: number | null; minutes_since_update: number | null; }
interface Trip { id: string; vehicle_id: string; trip_date: string; distance_km: number; fuel_used_l: number; status: string; }
interface Maint { id: string; vehicle_id: string; type: string; due_date: string; status: string; }

export default function FleetPage() {
  const [tab, setTab] = useState<"vehicles" | "trips" | "maintenance">("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maint, setMaint] = useState<Maint[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [locating, setLocating] = useState(false);

  const [tripForm, setTripForm] = useState({ distance_km: "", fuel_used_l: "" });
  const [maintForm, setMaintForm] = useState({ type: "service", due_date: "" });

  const load = async () => {
    const v = await fetch(teaUrl("/vehicles/live"), { headers: teaAuthHeaders() }).then(r => r.json());
    if (v.success) { setVehicles(v.data); if (!selectedVehicle && v.data[0]) setSelectedVehicle(v.data[0].id); }
  };
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    if (tab === "trips") fetch(teaUrl(`/vehicles/${selectedVehicle}/trips`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setTrips(d.data));
    if (tab === "maintenance") fetch(teaUrl(`/vehicles/${selectedVehicle}/maintenance`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setMaint(d.data));
  }, [tab, selectedVehicle]);

  const broadcastMyLocation = () => {
    if (!selectedVehicle || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      await fetch(teaUrl(`/vehicles/${selectedVehicle}/live`), {
        method: "PATCH", headers: teaAuthHeaders(),
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      setLocating(false); load();
    }, () => setLocating(false));
  };

  const addTrip = async () => {
    if (!selectedVehicle) return;
    await fetch(teaUrl(`/vehicles/${selectedVehicle}/trips`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(tripForm) });
    setTripForm({ distance_km: "", fuel_used_l: "" });
    fetch(teaUrl(`/vehicles/${selectedVehicle}/trips`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setTrips(d.data));
  };
  const addMaint = async () => {
    if (!selectedVehicle || !maintForm.due_date) return;
    await fetch(teaUrl(`/vehicles/${selectedVehicle}/maintenance`), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(maintForm) });
    setMaintForm({ type: "service", due_date: "" });
    fetch(teaUrl(`/vehicles/${selectedVehicle}/maintenance`), { headers: teaAuthHeaders() }).then(r => r.json()).then(d => d.success && setMaint(d.data));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 rounded-xl flex items-center justify-center shadow-sm shadow-green-950/20"><MapPin size={18} className="text-green-400" /></div>
        <div><h1 className="text-xl font-bold text-white tracking-tight">Fleet & Live Map</h1><p className="text-white/40 text-xs">Vehicle trips, maintenance reminders, and live location (phone-based)</p></div>
      </div>

      <div className="mb-4">
        <TeaFleetMap vehicles={vehicles} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-1 w-fit">
          {([["vehicles", "Vehicles"], ["trips", "Trips"], ["maintenance", "Maintenance"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-xs transition-all ${tab === k ? "bg-gradient-to-r from-green-600/25 to-emerald-600/25 text-green-300 border border-green-500/30" : "text-white/40 hover:text-white"}`}>{l}</button>
          ))}
        </div>
        {tab !== "vehicles" && (
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
          </select>
        )}
      </div>

      {tab === "vehicles" && (
        <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
          <table className="w-full"><tbody>
            {vehicles.map(v => (
              <tr key={v.id} className="border-b border-white/5">
                <td className="px-4 py-3 flex items-center gap-2"><Truck size={14} className="text-white/40" /><span className="text-white text-sm font-medium">{v.vehicle_number}</span></td>
                <td className="px-4 py-3 text-white/50 text-xs">{v.driver_name || "—"}</td>
                <td className="px-4 py-3 text-white/50 text-xs">
                  {v.live_lat ? `${Number(v.live_lat).toFixed(4)}, ${Number(v.live_lng).toFixed(4)}` : "No live position"}
                  {v.minutes_since_update != null && ` (${Math.round(v.minutes_since_update)} min ago)`}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setSelectedVehicle(v.id); broadcastMyLocation(); }} disabled={locating}
                    className="flex items-center gap-1 ml-auto bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                    <Navigation size={12} /> {locating && selectedVehicle === v.id ? "Locating…" : "Update My Location"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {tab === "trips" && (
        <>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input type="number" placeholder="Distance (km)" value={tripForm.distance_km} onChange={e => setTripForm({ ...tripForm, distance_km: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <input type="number" placeholder="Fuel used (L)" value={tripForm.fuel_used_l} onChange={e => setTripForm({ ...tripForm, fuel_used_l: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <button onClick={addTrip} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Plus size={14} /> Log Trip</button>
          </div>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            {trips.length === 0 ? <div className="p-8 text-center text-white/30 text-sm">No trips logged.</div> : (
              <table className="w-full"><tbody>
                {trips.map(t => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white/50 text-xs">{new Date(t.trip_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-white text-sm">{t.distance_km ?? "—"} km</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{t.fuel_used_l ?? "—"} L</td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{t.status}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {tab === "maintenance" && (
        <>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select value={maintForm.type} onChange={e => setMaintForm({ ...maintForm, type: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white">
              {["service", "oil_change", "tyre", "insurance", "puc", "permit"].map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            <input type="date" value={maintForm.due_date} onChange={e => setMaintForm({ ...maintForm, due_date: e.target.value })} className="bg-[#0d0f16] border border-white/10 rounded-lg focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition-colors px-3 py-2 text-sm text-white" />
            <button onClick={addMaint} className="flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-950/40 transition-all text-white rounded-lg text-sm font-medium"><Plus size={14} /> Add Reminder</button>
          </div>
          <div className="bg-gradient-to-b from-[#181c26] to-[#12151b] border border-white/10 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            {maint.length === 0 ? <div className="p-8 text-center text-white/30 text-sm"><Wrench size={28} className="mx-auto mb-2 opacity-20" />No maintenance reminders yet.</div> : (
              <table className="w-full"><tbody>
                {maint.map(m => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white text-sm capitalize">{m.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{m.due_date ? new Date(m.due_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${m.status === "overdue" ? "bg-red-500/15 text-red-400" : m.status === "due_soon" ? "bg-yellow-500/15 text-yellow-400" : "bg-green-500/15 text-green-400"}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
