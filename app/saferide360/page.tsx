"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Loader2, LogOut, ArrowRight, Plus, MapPin, Users, Bus, Bell,
  CheckCircle, XCircle, AlertTriangle, Phone, X, Navigation, Siren,
} from "lucide-react";
import { saferide360Api, getToken, setToken, clearToken, getStoredRole, setStoredRole } from "./lib/api";
import type { Driver, Organization, Stop, Passenger, Trip, TripPassenger, GuardianTodayEntry, GuardianNotification } from "./lib/types";
import LiveMap from "./components/LiveMap";
import type { LiveStop } from "./lib/mapProvider";
import { InstallAppBadge } from "../../components/InstallApp";

type Role = "driver" | "guardian";
type View = "landing" | "driver-auth" | "driver-dashboard" | "driver-setup" | "driver-trip" | "guardian-auth" | "guardian-dashboard";

export default function SafeRide360Page() {
  const [view, setView] = useState<View>("landing");
  const [role, setRole] = useState<Role | null>(null);
  const go = (v: View) => setView(v);

  // ── Driver auth ──────────────────────────────────────────────────────
  const [driver, setDriver] = useState<Driver | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [driverAuthTab, setDriverAuthTab] = useState<"login" | "register">("register");
  const [dName, setDName] = useState(""); const [dPhone, setDPhone] = useState(""); const [dPassword, setDPassword] = useState("");
  const [dVehicleNumber, setDVehicleNumber] = useState(""); const [dVehicleType, setDVehicleType] = useState("van");
  const [dOrgName, setDOrgName] = useState(""); const [dAuthErr, setDAuthErr] = useState(""); const [dAuthBusy, setDAuthBusy] = useState(false);

  const handleDriverAuth = async () => {
    setDAuthErr(""); setDAuthBusy(true);
    try {
      if (driverAuthTab === "register") {
        const { token, driver: dr, organization: org } = await saferide360Api.registerDriver({
          name: dName, phone: dPhone, password: dPassword, vehicle_number: dVehicleNumber, vehicle_type: dVehicleType, organization_name: dOrgName,
        });
        setToken(token); setStoredRole("driver"); setRole("driver"); setDriver(dr); setOrganization(org);
      } else {
        const { token, driver: dr, organization: org } = await saferide360Api.loginDriver(dPhone, dPassword);
        setToken(token); setStoredRole("driver"); setRole("driver"); setDriver(dr); setOrganization(org);
      }
      go("driver-dashboard");
    } catch (e: any) {
      setDAuthErr(e.message || "Something went wrong");
    } finally {
      setDAuthBusy(false);
    }
  };

  // ── Guardian auth (WhatsApp OTP) ─────────────────────────────────────
  const [gPhone, setGPhone] = useState(""); const [gOtp, setGOtp] = useState("");
  const [gOtpSent, setGOtpSent] = useState(false); const [gAuthErr, setGAuthErr] = useState(""); const [gAuthBusy, setGAuthBusy] = useState(false);
  const [gHint, setGHint] = useState("");

  const sendGuardianOtp = async () => {
    if (!gPhone.trim()) return;
    setGAuthErr(""); setGAuthBusy(true);
    try {
      const res = await saferide360Api.sendGuardianOtp(gPhone);
      setGOtpSent(true);
      setGHint(res.hint || "");
    } catch (e: any) {
      setGAuthErr(e.message || "Could not send the code");
    } finally {
      setGAuthBusy(false);
    }
  };
  const verifyGuardianOtp = async () => {
    if (!gOtp.trim()) return;
    setGAuthErr(""); setGAuthBusy(true);
    try {
      const { token } = await saferide360Api.verifyGuardianOtp(gPhone, gOtp);
      setToken(token); setStoredRole("guardian"); setRole("guardian");
      go("guardian-dashboard");
    } catch (e: any) {
      setGAuthErr(e.message || "Incorrect or expired code");
    } finally {
      setGAuthBusy(false);
    }
  };

  // ── Boot: restore session ────────────────────────────────────────────
  const [bootLoading, setBootLoading] = useState(true);
  useEffect(() => {
    document.title = "SafeRide360 — Where is my child?";
    (async () => {
      const storedRole = getStoredRole();
      if (getToken() && storedRole === "driver") {
        try {
          const { driver: dr, organization: org } = await saferide360Api.meDriver();
          setDriver(dr); setOrganization(org); setRole("driver"); go("driver-dashboard");
        } catch { clearToken(); }
      } else if (getToken() && storedRole === "guardian") {
        setRole("guardian"); go("guardian-dashboard");
      }
      setBootLoading(false);
    })();
    return () => { document.title = "NexusOS"; };
  }, []);

  const handleLogout = () => { clearToken(); setRole(null); setDriver(null); setOrganization(null); go("landing"); };

  // ── Driver: stops/passengers/trips ───────────────────────────────────
  const [stops, setStops] = useState<Stop[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dashLoading, setDashLoading] = useState(false);

  const loadDriverData = async () => {
    setDashLoading(true);
    try {
      const [s, p, t] = await Promise.all([saferide360Api.listStops(), saferide360Api.listPassengers(), saferide360Api.listTrips()]);
      setStops(s); setPassengers(p); setTrips(t);
    } catch { /* ignore */ } finally { setDashLoading(false); }
  };
  useEffect(() => { if (view === "driver-dashboard" || view === "driver-setup") loadDriverData(); }, [view]);

  const [newStopName, setNewStopName] = useState(""); const [newStopLat, setNewStopLat] = useState(""); const [newStopLng, setNewStopLng] = useState("");
  const addStop = async () => {
    if (!newStopName.trim() || !newStopLat || !newStopLng) return;
    const s = await saferide360Api.createStop(newStopName.trim(), parseFloat(newStopLat), parseFloat(newStopLng), stops.length);
    setStops(prev => [...prev, s]); setNewStopName(""); setNewStopLat(""); setNewStopLng("");
  };
  const useMyLocationForStop = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => { setNewStopLat(String(pos.coords.latitude)); setNewStopLng(String(pos.coords.longitude)); });
  };

  const [newPName, setNewPName] = useState(""); const [newPGuardianName, setNewPGuardianName] = useState("");
  const [newPGuardianPhone, setNewPGuardianPhone] = useState(""); const [newPPickup, setNewPPickup] = useState(""); const [newPDrop, setNewPDrop] = useState("");
  const addPassenger = async () => {
    if (!newPName.trim() || !newPGuardianName.trim() || !newPGuardianPhone.trim()) return;
    const p = await saferide360Api.createPassenger({ name: newPName.trim(), guardian_name: newPGuardianName.trim(), guardian_phone: newPGuardianPhone.trim(), pickup_stop_id: newPPickup || undefined, drop_stop_id: newPDrop || undefined });
    setPassengers(prev => [...prev, p]); setNewPName(""); setNewPGuardianName(""); setNewPGuardianPhone(""); setNewPPickup(""); setNewPDrop("");
  };

  const [newTName, setNewTName] = useState(""); const [newTDirection, setNewTDirection] = useState<"pickup" | "drop">("pickup");
  const [newTStart, setNewTStart] = useState("07:00"); const [newTEnd, setNewTEnd] = useState("08:00");
  const addTrip = async () => {
    if (!newTName.trim()) return;
    const t = await saferide360Api.createTrip({ name: newTName.trim(), direction: newTDirection, scheduled_start_time: newTStart, scheduled_end_time: newTEnd });
    setTrips(prev => [t, ...prev]); setNewTName("");
  };

  // ── Driver: active trip ──────────────────────────────────────────────
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripPassengers, setTripPassengers] = useState<(TripPassenger & { passengerName: string })[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastBroadcastRef = useRef(0);

  const openTrip = async (t: Trip) => {
    setActiveTrip(t);
    if (t.status === "active") {
      const tp = await saferide360Api.listTripPassengers(t.id);
      setTripPassengers(tp);
    }
    go("driver-trip");
  };

  const startTrip = async (t: Trip) => {
    const updated = await saferide360Api.startTrip(t.id);
    setActiveTrip(updated);
    setTrips(prev => prev.map(x => x.id === updated.id ? updated : x));
    const tp = await saferide360Api.listTripPassengers(updated.id);
    setTripPassengers(tp);
  };

  // Broadcasts position every ~7s while a trip is active — matches the
  // existing Ride360 polling pattern (PATCH .../live) rather than
  // WebSockets, which fits a slow-moving vehicle fine and needs no new
  // real-time infra.
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== "active" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      async pos => {
        const now = Date.now();
        if (now - lastBroadcastRef.current < 7000) return;
        lastBroadcastRef.current = now;
        try {
          const updated = await saferide360Api.updateTripLive(activeTrip.id, pos.coords.latitude, pos.coords.longitude);
          setActiveTrip(updated);
        } catch { /* keep trying on the next fix */ }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    watchIdRef.current = id;
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [activeTrip?.id, activeTrip?.status]);

  const markPassenger = async (tpId: string, status: "picked" | "absent") => {
    const updated = await saferide360Api.markTripPassenger(tpId, status);
    setTripPassengers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
  };

  const completeTrip = async () => {
    if (!activeTrip) return;
    const updated = await saferide360Api.completeTrip(activeTrip.id);
    setActiveTrip(updated);
    setTrips(prev => prev.map(x => x.id === updated.id ? updated : x));
    go("driver-dashboard");
  };

  const [sosBusy, setSosBusy] = useState(false); const [sosSent, setSosSent] = useState(false);
  const raiseSos = async () => {
    if (!activeTrip || !confirm("Send an emergency alert to every parent on this trip?")) return;
    setSosBusy(true);
    try { await saferide360Api.sosTrip(activeTrip.id); setSosSent(true); } finally { setSosBusy(false); }
  };

  // ── Guardian: dashboard ───────────────────────────────────────────────
  const [todayStatus, setTodayStatus] = useState<GuardianTodayEntry[]>([]);
  const [gNotifications, setGNotifications] = useState<GuardianNotification[]>([]);
  const [gTripStops, setGTripStops] = useState<Record<string, Stop[]>>({});
  const [gLoading, setGLoading] = useState(false);

  const loadGuardianData = async () => {
    setGLoading(true);
    try {
      const [status, notifs] = await Promise.all([saferide360Api.todayStatus(), saferide360Api.notifications()]);
      setTodayStatus(status);
      setGNotifications(notifs);
      const uniqueTripIds = Array.from(new Set(status.filter(s => s.tripStatus === "active").map(s => s.tripId)));
      const stopsByTrip: Record<string, Stop[]> = {};
      for (const tid of uniqueTripIds) stopsByTrip[tid] = await saferide360Api.tripStops(tid);
      setGTripStops(stopsByTrip);
    } catch { /* ignore */ } finally { setGLoading(false); }
  };
  useEffect(() => {
    if (view !== "guardian-dashboard") return;
    loadGuardianData();
    const id = setInterval(loadGuardianData, 8000); // live polling, matches driver broadcast cadence
    return () => clearInterval(id);
  }, [view]);

  const unreadCount = gNotifications.filter(n => !n.read).length;

  // ══════════════════════════════════════════════════════════════════
  if (bootLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={28} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go(role === "driver" ? "driver-dashboard" : role === "guardian" ? "guardian-dashboard" : "landing")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center"><ShieldCheck size={18} className="text-white" /></div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">SafeRide360</p>
              <p className="text-[9px] text-teal-600 font-semibold leading-none mt-1">Where is my child?</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <InstallAppBadge label="SafeRide360" />
            {role && (
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition"><LogOut size={14} /> Log out</button>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════ LANDING ══════════════════════ */}
      {view === "landing" && (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Parents aren't tracking a vehicle.</h1>
            <p className="text-xl font-black text-teal-600 mt-1">They're tracking their child's journey.</p>
            <p className="text-sm text-gray-500 mt-4 max-w-lg mx-auto">Live pickup/drop tracking, real-time notifications, and driver tools for school (and future) transport — built around one question: where is my child, and are they safe?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <button onClick={() => go("driver-auth")} className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 hover:border-teal-400 rounded-2xl p-6 transition">
              <Bus size={24} className="text-teal-600" /> <span className="font-black text-gray-900 text-sm">I'm a Driver</span>
            </button>
            <button onClick={() => go("guardian-auth")} className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 hover:border-teal-400 rounded-2xl p-6 transition">
              <Users size={24} className="text-teal-600" /> <span className="font-black text-gray-900 text-sm">I'm a Parent</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER AUTH ══════════════════════ */}
      {view === "driver-auth" && (
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setDriverAuthTab("register")} className={`flex-1 text-sm font-bold py-2 rounded-lg transition ${driverAuthTab === "register" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}>Register</button>
              <button onClick={() => setDriverAuthTab("login")} className={`flex-1 text-sm font-bold py-2 rounded-lg transition ${driverAuthTab === "login" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}>Login</button>
            </div>
            {driverAuthTab === "register" && (
              <>
                <input value={dName} onChange={e => setDName(e.target.value)} placeholder="Driver Name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={dOrgName} onChange={e => setDOrgName(e.target.value)} placeholder="School / Organization Name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={dVehicleNumber} onChange={e => setDVehicleNumber(e.target.value)} placeholder="Vehicle Number" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                  <select value={dVehicleType} onChange={e => setDVehicleType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="van">Van</option><option value="bus">Bus</option><option value="auto">Auto</option><option value="car">Car</option>
                  </select>
                </div>
              </>
            )}
            <input value={dPhone} onChange={e => setDPhone(e.target.value)} placeholder="Mobile Number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <input value={dPassword} onChange={e => setDPassword(e.target.value)} type="password" placeholder="Password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            {dAuthErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{dAuthErr}</p>}
            <button onClick={handleDriverAuth} disabled={dAuthBusy} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
              {dAuthBusy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />} {driverAuthTab === "register" ? "Create Account" : "Log In"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER DASHBOARD ══════════════════════ */}
      {view === "driver-dashboard" && driver && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-black text-gray-900">{organization?.name}</h2><p className="text-xs text-gray-400">{driver.name} · {driver.vehicleNumber || "No vehicle set"}</p></div>
            <button onClick={() => go("driver-setup")} className="flex items-center gap-1.5 text-xs font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 px-3 py-2 rounded-lg transition"><Plus size={13} /> Setup</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-900 text-sm">Trips</h3>
              <div className="flex items-center gap-2">
                <input value={newTName} onChange={e => setNewTName(e.target.value)} placeholder="Morning Trip" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-32" />
                <select value={newTDirection} onChange={e => setNewTDirection(e.target.value as any)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="pickup">Home → School</option><option value="drop">School → Home</option>
                </select>
                <input value={newTStart} onChange={e => setNewTStart(e.target.value)} type="time" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <input value={newTEnd} onChange={e => setNewTEnd(e.target.value)} type="time" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <button onClick={addTrip} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">Add</button>
              </div>
            </div>
            {dashLoading ? <Loader2 className="animate-spin text-gray-300 mx-auto" size={20} /> : (
              <div className="space-y-2">
                {trips.length === 0 && <p className="text-xs text-gray-400">No trips yet — add one above.</p>}
                {trips.map(t => (
                  <button key={t.id} onClick={() => openTrip(t)} className="w-full flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:border-teal-300 transition text-left">
                    <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-[11px] text-gray-400">{t.scheduledStartTime}–{t.scheduledEndTime} · {t.direction === "pickup" ? "Home → School" : "School → Home"}</p></div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.status === "active" ? "bg-teal-50 text-teal-700" : t.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>{t.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER SETUP (stops + passengers) ══════════════════════ */}
      {view === "driver-setup" && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("driver-dashboard")} className="text-sm text-gray-500 hover:text-teal-600">← Back to Dashboard</button>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><MapPin size={15} className="text-teal-600" /> Pickup / Drop Points</h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input value={newStopName} onChange={e => setNewStopName(e.target.value)} placeholder="Stop name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs flex-1 min-w-[120px]" />
              <input value={newStopLat} onChange={e => setNewStopLat(e.target.value)} placeholder="Lat" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-24" />
              <input value={newStopLng} onChange={e => setNewStopLng(e.target.value)} placeholder="Lng" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-24" />
              <button onClick={useMyLocationForStop} className="text-xs font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 px-2 py-1.5 rounded-lg transition"><Navigation size={12} className="inline mr-1" />Use my location</button>
              <button onClick={addStop} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">Add</button>
            </div>
            <div className="space-y-1.5">
              {stops.map((s, i) => <div key={s.id} className="text-xs text-gray-700 flex items-center gap-2"><span className="text-gray-400">{i + 1}.</span> {s.name} <span className="text-gray-300">({s.lat.toFixed(4)}, {s.lng.toFixed(4)})</span></div>)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><Users size={15} className="text-teal-600" /> Passengers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <input value={newPName} onChange={e => setNewPName(e.target.value)} placeholder="Student Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={newPGuardianName} onChange={e => setNewPGuardianName(e.target.value)} placeholder="Parent Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={newPGuardianPhone} onChange={e => setNewPGuardianPhone(e.target.value)} placeholder="Parent Mobile" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <div className="flex gap-2">
                <select value={newPPickup} onChange={e => setNewPPickup(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white flex-1"><option value="">Pickup stop…</option>{stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={newPDrop} onChange={e => setNewPDrop(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white flex-1"><option value="">Drop stop…</option>{stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
            </div>
            <button onClick={addPassenger} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition mb-3">Add Passenger</button>
            <div className="space-y-1.5">
              {passengers.map(p => <div key={p.id} className="text-xs text-gray-700">• {p.name} <span className="text-gray-400">(guardian: {p.guardianName}, {p.guardianPhone})</span></div>)}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER: ACTIVE TRIP ══════════════════════ */}
      {view === "driver-trip" && activeTrip && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("driver-dashboard")} className="text-sm text-gray-500 hover:text-teal-600">← Back to Dashboard</button>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="font-black text-gray-900 text-lg">{activeTrip.name}</h2><p className="text-xs text-gray-400">{activeTrip.direction === "pickup" ? "Home → School" : "School → Home"}</p></div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeTrip.status === "active" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"}`}>{activeTrip.status}</span>
            </div>

            {activeTrip.status === "scheduled" && (
              <button onClick={() => startTrip(activeTrip)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-sm py-3.5 rounded-2xl transition">Start Trip</button>
            )}

            {activeTrip.status === "active" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {tripPassengers.map(tp => (
                    <div key={tp.id} className={`flex items-center justify-between border rounded-xl p-3 ${tp.status === "picked" ? "border-green-200 bg-green-50" : tp.status === "absent" ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-100"}`}>
                      <span className="text-sm font-bold text-gray-900">{tp.passengerName}</span>
                      {tp.status === "pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => markPassenger(tp.id, "picked")} className="flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-lg transition"><CheckCircle size={12} /> Picked Up</button>
                          <button onClick={() => markPassenger(tp.id, "absent")} className="flex items-center gap-1 text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition"><XCircle size={12} /> Absent</button>
                        </div>
                      ) : (
                        <span className={`text-xs font-bold ${tp.status === "picked" ? "text-green-600" : "text-gray-400"}`}>{tp.status === "picked" ? "✓ Picked Up" : "Absent"}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={raiseSos} disabled={sosBusy || sosSent} className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-bold text-sm py-3 rounded-xl transition"><Siren size={14} /> {sosSent ? "Alert Sent" : "SOS"}</button>
                  <button onClick={completeTrip} className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition">Complete Trip</button>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Keep this screen open — live location is shared with parents while the trip is active.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ GUARDIAN AUTH ══════════════════════ */}
      {view === "guardian-auth" && (
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2"><Phone size={16} className="text-teal-600" /> Parent Login</h2>
            <p className="text-xs text-gray-400">Use the mobile number your driver already has on file — we'll send a WhatsApp code.</p>
            <input value={gPhone} onChange={e => setGPhone(e.target.value)} disabled={gOtpSent} placeholder="Mobile Number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-50" />
            {gOtpSent && (
              <input value={gOtp} onChange={e => setGOtp(e.target.value)} placeholder="6-digit code" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            )}
            {gHint && <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{gHint}</p>}
            {gAuthErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{gAuthErr}</p>}
            {!gOtpSent ? (
              <button onClick={sendGuardianOtp} disabled={gAuthBusy || !gPhone.trim()} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
                {gAuthBusy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />} Send Code
              </button>
            ) : (
              <button onClick={verifyGuardianOtp} disabled={gAuthBusy || !gOtp.trim()} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
                {gAuthBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Verify &amp; Log In
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ GUARDIAN DASHBOARD ══════════════════════ */}
      {view === "guardian-dashboard" && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Today's Trips</h2>
            {unreadCount > 0 && <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"><Bell size={12} /> {unreadCount} new</span>}
          </div>

          {gLoading && todayStatus.length === 0 ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={22} /></div>
          ) : todayStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No active trips right now — you'll see live tracking here once your driver starts one.</p>
          ) : (
            todayStatus.map(s => {
              const liveStops: LiveStop[] = (gTripStops[s.tripId] || []).map(st => ({ id: st.id, name: st.name, lat: st.lat, lng: st.lng, state: "upcoming" }));
              return (
                <div key={s.tripPassengerId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div><p className="font-black text-gray-900 text-sm">{s.passengerName}</p><p className="text-xs text-gray-400">{s.tripName} · {s.driverName} · {s.vehicleNumber}</p></div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.status === "picked" ? "bg-green-50 text-green-700" : s.status === "absent" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>
                        {s.status === "picked" ? "✓ Picked Up" : s.status === "absent" ? "Absent" : "Awaiting Pickup"}
                      </span>
                    </div>
                    {s.tripStatus === "active" && s.liveLat != null && s.liveLng != null && (
                      <LiveMap driverPosition={{ lat: s.liveLat, lng: s.liveLng }} driverLabel={`${s.driverName} — ${s.vehicleNumber}`} stops={liveStops} height="240px" />
                    )}
                    {s.tripStatus === "completed" && <p className="text-xs text-green-600 font-bold flex items-center gap-1.5"><CheckCircle size={13} /> Trip completed{s.direction === "drop" ? " — reached home safely" : " — reached school safely"}</p>}
                  </div>
                </div>
              );
            })
          )}

          {gNotifications.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Bell size={14} className="text-teal-600" /> Notifications</h3>
                {unreadCount > 0 && <button onClick={async () => { await saferide360Api.markNotificationsRead(); loadGuardianData(); }} className="text-[11px] font-bold text-teal-600 hover:underline">Mark all read</button>}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {gNotifications.map(n => (
                  <div key={n.id} className={`text-xs p-2.5 rounded-lg ${n.read ? "text-gray-500 bg-gray-50" : "text-gray-800 bg-teal-50 font-medium"}`}>
                    <p className="whitespace-pre-line">{n.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
