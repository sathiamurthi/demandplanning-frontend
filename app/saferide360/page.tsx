"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Loader2, LogOut, ArrowRight, Plus, MapPin, Users, Bus, Bell,
  CheckCircle, XCircle, AlertTriangle, Phone, X, Navigation, Siren, Mic, MicOff,
  MessageSquare, CreditCard, Pencil,
} from "lucide-react";
import { saferide360Api, getToken, setToken, clearToken, getStoredRole, setStoredRole, ApiError } from "./lib/api";
import type { Driver, Organization, Stop, Passenger, Trip, TripPassenger, GuardianTodayEntry, GuardianNotification, Billing, GeocodeResult, TripTemplate } from "./lib/types";
import LiveMap from "./components/LiveMap";
import type { LiveStop } from "./lib/mapProvider";
import { InstallAppBadge } from "../../components/InstallApp";

type Role = "driver" | "guardian";
type View = "landing" | "driver-auth" | "driver-dashboard" | "driver-setup" | "driver-trip" | "guardian-auth" | "guardian-dashboard";

// Plain-English trip status, everywhere a status is shown — "scheduled" and
// "active" are backend/DB language, not what a driver or parent thinks in.
function tripStatusLabel(status: string): string {
  if (status === "active") return "In Progress";
  if (status === "completed") return "Completed";
  return "Not Started";
}

// "Today" / "Yesterday" / a real date — a parent scanning notifications
// thinks in days, not a flat reverse-chronological list.
function dateGroupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short" });
}
function groupNotificationsByDate<T extends { createdAt: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const label = dateGroupLabel(item.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return Array.from(groups.entries());
}

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

  // ── Guardian auth (phone-only, no OTP — see backend /auth/guardian/login
  // comment: WhatsApp Cloud API sandbox blocks OTP delivery to real numbers) ──
  const [gPhone, setGPhone] = useState("");
  const [gAuthErr, setGAuthErr] = useState(""); const [gAuthBusy, setGAuthBusy] = useState(false);

  const loginGuardian = async () => {
    if (!gPhone.trim()) return;
    setGAuthErr(""); setGAuthBusy(true);
    try {
      const { token } = await saferide360Api.loginGuardian(gPhone);
      setToken(token); setStoredRole("guardian"); setRole("guardian");
      go("guardian-dashboard");
    } catch (e: any) {
      setGAuthErr(e.message || "Could not log in");
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
  const [setupTab, setSetupTab] = useState<"stops" | "students" | "templates">("stops");
  const [stops, setStops] = useState<Stop[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripTemplates, setTripTemplates] = useState<TripTemplate[]>([]);
  const [dashLoading, setDashLoading] = useState(false);

  const loadDriverData = async () => {
    setDashLoading(true);
    try {
      const [s, p, t, tt] = await Promise.all([saferide360Api.listStops(), saferide360Api.listPassengers(), saferide360Api.listTrips(), saferide360Api.listTripTemplates()]);
      setStops(s); setPassengers(p); setTrips(t); setTripTemplates(tt);
    } catch { /* ignore */ } finally { setDashLoading(false); }
  };
  useEffect(() => { if (view === "driver-dashboard" || view === "driver-setup") loadDriverData(); }, [view]);

  // ── Package plan: ₹100/passenger/month ──────────────────────────────
  const [billing, setBilling] = useState<Billing | null>(null);
  const loadBilling = async () => {
    try { setBilling(await saferide360Api.getBilling()); } catch { /* ignore */ }
  };
  useEffect(() => { if (view === "driver-dashboard") loadBilling(); }, [view]);
  const [tripStartErr, setTripStartErr] = useState<{ message: string; passengerCount: number; ratePerPassenger: number; monthlyCost: number } | null>(null);
  const [tripStartGenericErr, setTripStartGenericErr] = useState("");

  // ── Vehicle info edit ────────────────────────────────────────────────
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [vNumber, setVNumber] = useState(""); const [vType, setVType] = useState("van"); const [vSaving, setVSaving] = useState(false);
  const openVehicleEdit = () => {
    if (driver) { setVNumber(driver.vehicleNumber); setVType(driver.vehicleType); }
    setEditingVehicle(true);
  };
  const saveVehicle = async () => {
    setVSaving(true);
    try {
      const updated = await saferide360Api.updateVehicle(vNumber.trim() || undefined, vType || undefined);
      setDriver(updated);
      setEditingVehicle(false);
    } finally { setVSaving(false); }
  };

  const [newStopName, setNewStopName] = useState(""); const [newStopLat, setNewStopLat] = useState(""); const [newStopLng, setNewStopLng] = useState("");
  const [stopErr, setStopErr] = useState(""); const [stopBusy, setStopBusy] = useState(false); const [locatingStop, setLocatingStop] = useState(false);
  const [stopSuggestions, setStopSuggestions] = useState<GeocodeResult[]>([]); const [stopSuggestBusy, setStopSuggestBusy] = useState(false);
  const stopSuggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStopNameChange = (val: string) => {
    setNewStopName(val); setStopErr("");
    if (stopSuggestTimer.current) clearTimeout(stopSuggestTimer.current);
    if (val.trim().length < 3) { setStopSuggestions([]); return; }
    stopSuggestTimer.current = setTimeout(async () => {
      setStopSuggestBusy(true);
      try { setStopSuggestions(await saferide360Api.geocodeSearch(val.trim())); }
      catch { setStopSuggestions([]); }
      finally { setStopSuggestBusy(false); }
    }, 400);
  };
  const pickStopSuggestion = (r: GeocodeResult) => {
    setNewStopName(r.label.split(",").slice(0, 2).join(",").trim());
    setNewStopLat(String(r.lat)); setNewStopLng(String(r.lng));
    setStopSuggestions([]);
  };

  const addStop = async () => {
    setStopErr("");
    if (!newStopName.trim()) { setStopErr("Enter a stop name."); return; }
    if (!newStopLat || !newStopLng) { setStopErr("Pick a location suggestion or use \"Use my location\" to set coordinates."); return; }
    setStopBusy(true);
    try {
      const s = await saferide360Api.createStop(newStopName.trim(), parseFloat(newStopLat), parseFloat(newStopLng), stops.length);
      setStops(prev => [...prev, s]); setNewStopName(""); setNewStopLat(""); setNewStopLng(""); setStopSuggestions([]);
    } catch (e: any) {
      setStopErr(e.message || "Could not add this stop.");
    } finally {
      setStopBusy(false);
    }
  };
  const useMyLocationForStop = () => {
    setStopErr("");
    if (!navigator.geolocation) { setStopErr("Location isn't supported in this browser."); return; }
    setLocatingStop(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setNewStopLat(String(pos.coords.latitude)); setNewStopLng(String(pos.coords.longitude)); setLocatingStop(false); },
      err => { setStopErr(err.code === err.PERMISSION_DENIED ? "Location permission denied — allow location access in your browser settings, or search for the stop above." : "Could not get your location — try again or search for the stop above."); setLocatingStop(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [newPName, setNewPName] = useState(""); const [newPGuardianName, setNewPGuardianName] = useState("");
  const [newPGuardianPhone, setNewPGuardianPhone] = useState(""); const [newPPickup, setNewPPickup] = useState(""); const [newPDrop, setNewPDrop] = useState("");
  const [newPSchool, setNewPSchool] = useState(""); const [passengerErr, setPassengerErr] = useState(""); const [passengerBusy, setPassengerBusy] = useState(false);
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);

  const resetPassengerForm = () => {
    setNewPName(""); setNewPGuardianName(""); setNewPGuardianPhone(""); setNewPPickup(""); setNewPDrop("");
    setNewPSchool(organization?.name || ""); setEditingPassengerId(null); setPassengerErr("");
  };
  const startEditPassenger = (p: Passenger) => {
    setEditingPassengerId(p.id); setNewPName(p.name); setNewPGuardianName(p.guardianName); setNewPGuardianPhone(p.guardianPhone);
    setNewPPickup(p.pickupStopId || ""); setNewPDrop(p.dropStopId || ""); setNewPSchool(p.schoolName || organization?.name || "");
    setPassengerErr("");
  };
  const deletePassenger = async (p: Passenger) => {
    if (!confirm(`Remove ${p.name} from your passenger list?`)) return;
    await saferide360Api.deletePassenger(p.id);
    setPassengers(prev => prev.filter(x => x.id !== p.id));
    if (editingPassengerId === p.id) resetPassengerForm();
  };
  const addPassenger = async () => {
    setPassengerErr("");
    if (!newPName.trim() || !newPGuardianName.trim() || !newPGuardianPhone.trim()) {
      setPassengerErr("Student name, parent name and parent mobile are required.");
      return;
    }
    setPassengerBusy(true);
    try {
      const body = {
        name: newPName.trim(), guardian_name: newPGuardianName.trim(), guardian_phone: newPGuardianPhone.trim(),
        pickup_stop_id: newPPickup || undefined, drop_stop_id: newPDrop || undefined, school_name: newPSchool.trim() || undefined,
      };
      if (editingPassengerId) {
        const p = await saferide360Api.updatePassenger(editingPassengerId, body);
        setPassengers(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        const p = await saferide360Api.createPassenger(body);
        setPassengers(prev => [...prev, p]);
      }
      resetPassengerForm();
    } catch (e: any) {
      setPassengerErr(e.message || "Could not save this passenger.");
    } finally {
      setPassengerBusy(false);
    }
  };
  // Default the per-passenger school field to the org's own name — still
  // editable per student (e.g. a shared van serving more than one school).
  useEffect(() => { if (view === "driver-setup" && organization && !newPSchool) setNewPSchool(organization.name); }, [view, organization]);

  // ── Trip templates: "select students, save as a reusable template" ────
  const [templateName, setTemplateName] = useState(""); const [templateSelection, setTemplateSelection] = useState<string[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateErr, setTemplateErr] = useState(""); const [templateBusy, setTemplateBusy] = useState(false);

  const toggleTemplatePassenger = (id: string) =>
    setTemplateSelection(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const startEditTemplate = (t: TripTemplate) => {
    setEditingTemplateId(t.id); setTemplateName(t.name); setTemplateSelection(t.passengerIds); setTemplateErr("");
  };
  const resetTemplateForm = () => { setEditingTemplateId(null); setTemplateName(""); setTemplateSelection([]); setTemplateErr(""); };
  const saveTemplate = async () => {
    setTemplateErr("");
    if (!templateName.trim() || templateSelection.length === 0) { setTemplateErr("Name the route and select at least one student."); return; }
    setTemplateBusy(true);
    try {
      if (editingTemplateId) {
        const t = await saferide360Api.updateTripTemplate(editingTemplateId, { name: templateName.trim(), passenger_ids: templateSelection });
        setTripTemplates(prev => prev.map(x => x.id === t.id ? t : x));
      } else {
        const t = await saferide360Api.createTripTemplate(templateName.trim(), templateSelection);
        setTripTemplates(prev => [t, ...prev]);
      }
      resetTemplateForm();
    } catch (e: any) {
      setTemplateErr(e.message || "Could not save this template.");
    } finally {
      setTemplateBusy(false);
    }
  };
  const deleteTemplate = async (t: TripTemplate) => {
    if (!confirm(`Delete the "${t.name}" template?`)) return;
    await saferide360Api.deleteTripTemplate(t.id);
    setTripTemplates(prev => prev.filter(x => x.id !== t.id));
    if (editingTemplateId === t.id) resetTemplateForm();
  };

  const [newTName, setNewTName] = useState(""); const [newTDirection, setNewTDirection] = useState<"pickup" | "drop">("pickup");
  const [newTStart, setNewTStart] = useState("07:00"); const [newTEnd, setNewTEnd] = useState("08:00");
  const [newTTemplate, setNewTTemplate] = useState("");
  const addTrip = async () => {
    if (!newTName.trim()) return;
    const t = await saferide360Api.createTrip({ name: newTName.trim(), direction: newTDirection, scheduled_start_time: newTStart, scheduled_end_time: newTEnd, template_id: newTTemplate || undefined });
    setTrips(prev => [t, ...prev]); setNewTName(""); setNewTTemplate("");
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
    setTripStartErr(null); setTripStartGenericErr("");
    try {
      const updated = await saferide360Api.startTrip(t.id);
      setActiveTrip(updated);
      setTrips(prev => prev.map(x => x.id === updated.id ? updated : x));
      const tp = await saferide360Api.listTripPassengers(updated.id);
      setTripPassengers(tp);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === "SUBSCRIPTION_REQUIRED") {
        setTripStartErr({ message: e.message, passengerCount: e.data.passengerCount, ratePerPassenger: e.data.ratePerPassenger, monthlyCost: e.data.monthlyCost });
      } else {
        setTripStartGenericErr(e.message || "Could not start this trip.");
      }
    }
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

  // Safety gate: driver confirms the actual headcount in the vehicle before
  // the trip can complete — must match the number marked "picked" in the
  // app, or the backend rejects with HEADCOUNT_MISMATCH so the driver can
  // recheck/correct each student's status first.
  const [showHeadcountConfirm, setShowHeadcountConfirm] = useState(false);
  const [headcountInput, setHeadcountInput] = useState("");
  const [headcountErr, setHeadcountErr] = useState("");
  const [completeBusy, setCompleteBusy] = useState(false);
  const pickedCount = tripPassengers.filter(tp => tp.status === "picked").length;

  const openCompleteTrip = () => {
    setHeadcountInput(String(pickedCount)); setHeadcountErr(""); setShowHeadcountConfirm(true);
  };
  const confirmCompleteTrip = async () => {
    if (!activeTrip) return;
    const n = parseInt(headcountInput, 10);
    if (isNaN(n) || n < 0) { setHeadcountErr("Enter a valid number."); return; }
    setCompleteBusy(true); setHeadcountErr("");
    try {
      const updated = await saferide360Api.completeTrip(activeTrip.id, n);
      setActiveTrip(updated);
      setTrips(prev => prev.map(x => x.id === updated.id ? updated : x));
      setShowHeadcountConfirm(false);
      go("driver-dashboard");
    } catch (e: any) {
      setHeadcountErr(e.message || "Could not complete this trip.");
    } finally {
      setCompleteBusy(false);
    }
  };

  const [sosBusy, setSosBusy] = useState(false); const [sosSent, setSosSent] = useState(false);
  const raiseSos = async () => {
    if (!activeTrip || !confirm("Send an emergency alert to every parent on this trip?")) return;
    setSosBusy(true);
    try { await saferide360Api.sosTrip(activeTrip.id); setSosSent(true); } finally { setSosBusy(false); }
  };

  // ── Custom update to parents (typed or voice-recorded -> transcribed) ──
  const [showAlertComposer, setShowAlertComposer] = useState(false);
  const [alertType, setAlertType] = useState<"delay" | "traffic" | "vehicle_issue" | "custom">("delay");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertBusy, setAlertBusy] = useState(false); const [alertSentMsg, setAlertSentMsg] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const voiceRecognizerRef = useRef<any>(null);

  const isVoiceSupported = () => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const toggleVoiceRecord = () => {
    if (voiceActive) { voiceRecognizerRef.current?.stop(); return; }
    if (!isVoiceSupported()) { alert("Voice recording isn't supported in this browser — try Chrome or Edge."); return; }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognizer = new Ctor();
    recognizer.continuous = true; recognizer.interimResults = true; recognizer.lang = "en-US";
    recognizer.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setAlertMessage(transcript);
    };
    recognizer.onerror = () => setVoiceActive(false);
    recognizer.onend = () => setVoiceActive(false);
    voiceRecognizerRef.current = recognizer;
    recognizer.start();
    setVoiceActive(true);
  };

  const sendTripAlert = async () => {
    if (!activeTrip || !alertMessage.trim()) return;
    setAlertBusy(true); setAlertSentMsg("");
    try {
      const { alerted } = await saferide360Api.alertTrip(activeTrip.id, alertMessage.trim(), alertType);
      setAlertSentMsg(`Sent to ${alerted} parent${alerted === 1 ? "" : "s"}.`);
      setAlertMessage("");
    } finally { setAlertBusy(false); }
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
            <div>
              <h2 className="text-xl font-black text-gray-900">{organization?.name}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                {driver.name} · {driver.vehicleType} {driver.vehicleNumber || "(no vehicle set)"}
                <button onClick={openVehicleEdit} className="text-teal-600 hover:underline flex items-center gap-0.5"><Pencil size={10} /> Edit</button>
              </p>
            </div>
            <button onClick={() => go("driver-setup")} className="flex items-center gap-1.5 text-xs font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 px-3 py-2 rounded-lg transition"><Plus size={13} /> Setup</button>
          </div>

          {editingVehicle && (
            <div className="bg-white border border-teal-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Bus size={14} className="text-teal-600" /> Vehicle Info</h3>
              <div className="flex gap-2">
                <input value={vNumber} onChange={e => setVNumber(e.target.value)} placeholder="Vehicle Number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <select value={vType} onChange={e => setVType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="van">Van</option><option value="bus">Bus</option><option value="auto">Auto</option><option value="car">Car</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={saveVehicle} disabled={vSaving} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                  {vSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Save
                </button>
                <button onClick={() => setEditingVehicle(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
              </div>
            </div>
          )}

          {billing && (
            <div className={`rounded-2xl p-5 border ${billing.isActive ? "bg-white border-gray-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className={billing.isActive ? "text-teal-600" : "text-amber-600"} />
                  <p className="text-sm font-bold text-gray-900">₹{billing.organization.planRateInrPerPassenger}/passenger/month</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${billing.isActive ? "bg-teal-50 text-teal-700" : "bg-amber-100 text-amber-700"}`}>
                  {billing.inTrial ? `Free trial · ends ${new Date(billing.organization.trialEndsAt).toLocaleDateString("en-IN")}` : billing.isActive ? "Active" : "Expired"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{billing.passengerCount} passenger{billing.passengerCount === 1 ? "" : "s"} × ₹{billing.organization.planRateInrPerPassenger} = <strong>₹{billing.monthlyCost}/month</strong></p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-black text-gray-900 text-sm">Trips</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <input value={newTName} onChange={e => setNewTName(e.target.value)} placeholder="Morning Trip" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-32" />
                <select value={newTDirection} onChange={e => setNewTDirection(e.target.value as any)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="pickup">Home → School</option><option value="drop">School → Home</option>
                </select>
                <select value={newTTemplate} onChange={e => setNewTTemplate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="">All students</option>
                  {tripTemplates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.passengerIds.length})</option>)}
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
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.status === "active" ? "bg-teal-50 text-teal-700" : t.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>{tripStatusLabel(t.status)}</span>
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

          {/* Tabs, not a long stacked scroll — each section is one click away */}
          <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
            {([
              ["stops", "Pickup / Drop Points", stops.length],
              ["students", "Students", passengers.length],
              ["templates", "Trip Templates", tripTemplates.length],
            ] as const).map(([key, label, count]) => (
              <button key={key} onClick={() => setSetupTab(key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${setupTab === key ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {label} <span className={`text-[10px] rounded-full px-1.5 ${setupTab === key ? "bg-teal-50 text-teal-600" : "bg-gray-200 text-gray-500"}`}>{count}</span>
              </button>
            ))}
          </div>

          {setupTab === "stops" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><MapPin size={15} className="text-teal-600" /> Pickup / Drop Points</h3>
            <p className="text-[11px] text-gray-400 mb-3">One-time setup — order stops in pickup/drop sequence; a trip defaults students to this order.</p>
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <div className="relative flex-1 min-w-[160px]">
                <input value={newStopName} onChange={e => onStopNameChange(e.target.value)} placeholder="Search for a place…" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                {(stopSuggestBusy || stopSuggestions.length > 0) && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {stopSuggestBusy && <div className="px-3 py-2 text-[11px] text-gray-400">Searching…</div>}
                    {stopSuggestions.map((r, i) => (
                      <button key={i} type="button" onClick={() => pickStopSuggestion(r)} className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-teal-50 border-b border-gray-50 last:border-0">
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input value={newStopLat} onChange={e => setNewStopLat(e.target.value)} placeholder="Lat" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-24" />
              <input value={newStopLng} onChange={e => setNewStopLng(e.target.value)} placeholder="Lng" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-24" />
              <button onClick={useMyLocationForStop} disabled={locatingStop} className="flex items-center gap-1 text-xs font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 disabled:opacity-50 px-2 py-1.5 rounded-lg transition">
                {locatingStop ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />} Use my location
              </button>
              <button onClick={addStop} disabled={stopBusy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                {stopBusy && <Loader2 size={12} className="animate-spin" />} Add
              </button>
            </div>
            {stopErr && <p className="text-[11px] text-red-600 mt-1 mb-2">{stopErr}</p>}
            <div className="space-y-1.5 mt-3">
              {stops.length === 0 && <p className="text-xs text-gray-400">No stops yet — search for a place above, or use "Use my location".</p>}
              {stops.map((s, i) => <div key={s.id} className="text-xs text-gray-700 flex items-center gap-2"><span className="text-gray-400">{i + 1}.</span> {s.name} <span className="text-gray-300">({s.lat.toFixed(4)}, {s.lng.toFixed(4)})</span></div>)}
            </div>
          </div>
          )}

          {setupTab === "students" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2"><Users size={15} className="text-teal-600" /> Students</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <input value={newPName} onChange={e => setNewPName(e.target.value)} placeholder="Student Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={newPSchool} onChange={e => setNewPSchool(e.target.value)} placeholder="School Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={newPGuardianName} onChange={e => setNewPGuardianName(e.target.value)} placeholder="Parent Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={newPGuardianPhone} onChange={e => setNewPGuardianPhone(e.target.value)} placeholder="Parent Mobile" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Start Point (Pickup)</label>
                <select value={newPPickup} onChange={e => setNewPPickup(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"><option value="">Select…</option>{stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">End Point (Drop)</label>
                <select value={newPDrop} onChange={e => setNewPDrop(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"><option value="">Select…</option>{stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
            </div>
            {stops.length === 0 && (
              <p className="text-[11px] text-amber-600 mb-2">
                No stops set up yet — <button onClick={() => setSetupTab("stops")} className="font-bold underline">add one in Pickup / Drop Points</button> so you can assign it here.
              </p>
            )}
            {passengerErr && <p className="text-[11px] text-red-600 mb-2">{passengerErr}</p>}
            <div className="flex gap-2 mb-3">
              <button onClick={addPassenger} disabled={passengerBusy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                {passengerBusy && <Loader2 size={12} className="animate-spin" />} {editingPassengerId ? "Save Changes" : "Add Student"}
              </button>
              {editingPassengerId && <button onClick={resetPassengerForm} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>}
            </div>
            <div className="space-y-1.5">
              {passengers.length === 0 && <p className="text-xs text-gray-400">No students yet — add one above.</p>}
              {passengers.map(p => (
                <div key={p.id} className={`flex items-center justify-between gap-2 text-xs text-gray-700 rounded-lg px-2 py-1.5 ${editingPassengerId === p.id ? "bg-teal-50" : ""}`}>
                  <span>• {p.name} {p.schoolName && <span className="text-teal-600">({p.schoolName})</span>} <span className="text-gray-400">— guardian: {p.guardianName}, {p.guardianPhone}</span></span>
                  <span className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEditPassenger(p)} className="text-teal-600 hover:underline flex items-center gap-0.5"><Pencil size={10} /> Edit</button>
                    <button onClick={() => deletePassenger(p)} className="text-red-500 hover:underline">Delete</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          {setupTab === "templates" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 text-sm mb-1 flex items-center gap-2"><Bus size={15} className="text-teal-600" /> Trip Templates</h3>
            <p className="text-[11px] text-gray-400 mb-3">Configure a trip once — select students, save it — then reuse it every time you create a trip instead of picking students again.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Route name, e.g. Van A Morning" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs flex-1 min-w-[160px]" />
              <button onClick={saveTemplate} disabled={templateBusy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                {templateBusy && <Loader2 size={12} className="animate-spin" />} {editingTemplateId ? "Save Changes" : "Save Template"}
              </button>
              {editingTemplateId && <button onClick={resetTemplateForm} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>}
            </div>
            {templateErr && <p className="text-[11px] text-red-600 mb-2">{templateErr}</p>}
            {passengers.length === 0 ? (
              <p className="text-xs text-gray-400 mb-3">
                <button onClick={() => setSetupTab("students")} className="font-bold text-teal-600 underline">Add students</button> before configuring a trip template.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-400">{templateSelection.length} of {passengers.length} selected</span>
                  <button onClick={() => setTemplateSelection(templateSelection.length === passengers.length ? [] : passengers.map(p => p.id))} className="text-[11px] font-bold text-teal-600 hover:underline">
                    {templateSelection.length === passengers.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-2">
                  {passengers.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={templateSelection.includes(p.id)} onChange={() => toggleTemplatePassenger(p.id)} className="accent-teal-600" />
                      {p.name}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="space-y-1.5">
              {tripTemplates.length === 0 && <p className="text-xs text-gray-400">No templates yet — select students above and save one.</p>}
              {tripTemplates.map(t => (
                <div key={t.id} className={`flex items-center justify-between text-xs text-gray-700 rounded-lg px-2 py-1.5 ${editingTemplateId === t.id ? "bg-teal-50" : ""}`}>
                  <span className="font-bold text-gray-900">{t.name}</span>
                  <span className="flex items-center gap-2 text-gray-400">
                    {t.passengerIds.length} student{t.passengerIds.length === 1 ? "" : "s"}
                    <button onClick={() => startEditTemplate(t)} className="text-teal-600 hover:underline flex items-center gap-0.5"><Pencil size={10} /> Edit</button>
                    <button onClick={() => deleteTemplate(t)} className="text-red-500 hover:underline">Delete</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}

      {/* ══════════════════════ DRIVER: ACTIVE TRIP ══════════════════════ */}
      {view === "driver-trip" && activeTrip && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => go("driver-dashboard")} className="text-sm text-gray-500 hover:text-teal-600">← Back to Dashboard</button>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="font-black text-gray-900 text-lg">{activeTrip.name}</h2><p className="text-xs text-gray-400">{activeTrip.direction === "pickup" ? "Home → School" : "School → Home"}</p></div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeTrip.status === "active" ? "bg-teal-50 text-teal-700" : activeTrip.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>{tripStatusLabel(activeTrip.status)}</span>
            </div>

            {/* Step indicator — Start → In Progress (confirm each student) → Complete (confirm headcount) */}
            <div className="flex items-center gap-1.5 mb-5">
              {(["scheduled", "active", "completed"] as const).map((step, i) => {
                const order = { scheduled: 0, active: 1, completed: 2 } as const;
                const done = order[activeTrip.status] > i;
                const current = order[activeTrip.status] === i;
                return (
                  <div key={step} className="flex items-center gap-1.5 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${done ? "bg-teal-600 text-white" : current ? "bg-teal-100 text-teal-700 border-2 border-teal-600" : "bg-gray-100 text-gray-400"}`}>
                      {done ? <CheckCircle size={13} /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${current ? "text-teal-700" : done ? "text-gray-500" : "text-gray-300"}`}>{["Start", "In Progress", "Complete"][i]}</span>
                    {i < 2 && <div className={`flex-1 h-0.5 ${done ? "bg-teal-600" : "bg-gray-100"}`} />}
                  </div>
                );
              })}
            </div>

            {activeTrip.status === "scheduled" && (
              <div className="space-y-3">
                <button onClick={() => startTrip(activeTrip)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-sm py-3.5 rounded-2xl transition">Start Trip</button>
                {tripStartErr && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                    <p className="text-sm text-amber-800 font-bold flex items-center gap-1.5"><CreditCard size={14} /> Subscription required</p>
                    <p className="text-xs text-amber-700">{tripStartErr.message}</p>
                    <p className="text-[11px] text-amber-600">Contact support to activate — payments are handled manually for now.</p>
                  </div>
                )}
                {tripStartGenericErr && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-700 font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> {tripStartGenericErr}</p>
                  </div>
                )}
              </div>
            )}

            {activeTrip.status === "active" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {tripPassengers.map(tp => (
                    <div key={tp.id} className={`flex items-center justify-between border rounded-xl p-3 ${tp.status === "picked" ? "border-green-200 bg-green-50" : tp.status === "absent" ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-100"}`}>
                      <span className="text-sm font-bold text-gray-900">{tp.passengerName}</span>
                      {tp.status === "pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => markPassenger(tp.id, "picked")} className="flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-lg transition"><CheckCircle size={12} /> Confirm Pickup</button>
                          <button onClick={() => markPassenger(tp.id, "absent")} className="flex items-center gap-1 text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition"><XCircle size={12} /> Absent</button>
                        </div>
                      ) : (
                        <span className={`text-xs font-bold ${tp.status === "picked" ? "text-green-600" : "text-gray-400"}`}>{tp.status === "picked" ? "✓ Picked Up" : "Absent"}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">Any student not confirmed will be marked absent when the trip completes.</p>
                <button onClick={() => setShowAlertComposer(v => !v)} className="w-full flex items-center justify-center gap-2 border border-teal-200 text-teal-700 hover:bg-teal-50 font-bold text-sm py-3 rounded-xl transition">
                  <MessageSquare size={14} /> {showAlertComposer ? "Hide" : "Send Update to Parents"}
                </button>

                {showAlertComposer && (
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {([["delay", "⏰ Delay"], ["traffic", "🚦 Traffic"], ["vehicle_issue", "🔧 Vehicle Issue"], ["custom", "📢 Other"]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setAlertType(key)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${alertType === key ? "bg-teal-600 border-teal-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{label}</button>
                      ))}
                    </div>
                    <div className="flex items-start gap-2">
                      <textarea value={alertMessage} onChange={e => setAlertMessage(e.target.value)} rows={2} placeholder="Type a message, or tap the mic to record…"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
                      <button onClick={toggleVoiceRecord} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${voiceActive ? "bg-red-500 animate-pulse" : "bg-gray-100 hover:bg-gray-200"}`}>
                        {voiceActive ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-gray-600" />}
                      </button>
                    </div>
                    {voiceActive && <p className="text-[11px] text-teal-600">Listening… tap the mic to stop.</p>}
                    <button onClick={sendTripAlert} disabled={alertBusy || !alertMessage.trim()} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition">
                      {alertBusy ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Send to All Parents on This Trip
                    </button>
                    {alertSentMsg && <p className="text-[11px] text-teal-600 font-bold">{alertSentMsg}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={raiseSos} disabled={sosBusy || sosSent} className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-bold text-sm py-3 rounded-xl transition"><Siren size={14} /> {sosSent ? "Alert Sent" : "SOS"}</button>
                  <button onClick={openCompleteTrip} className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition">Complete Trip</button>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Keep this screen open — live location is shared with parents while the trip is active.</p>

                {showHeadcountConfirm && (
                  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowHeadcountConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()}>
                      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><ShieldCheck size={16} className="text-teal-600" /> Confirm Headcount</h3>
                      <p className="text-xs text-gray-500">{pickedCount} student{pickedCount === 1 ? "" : "s"} marked confirmed in the app. How many students are physically in the vehicle right now?</p>
                      <input type="number" min={0} value={headcountInput} onChange={e => setHeadcountInput(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center font-bold" />
                      {headcountErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{headcountErr}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => setShowHeadcountConfirm(false)} className="flex-1 text-xs font-bold text-gray-500 hover:text-gray-700 py-2.5">Cancel</button>
                        <button onClick={confirmCompleteTrip} disabled={completeBusy} className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-lg transition">
                          {completeBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Confirm &amp; Complete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
            <p className="text-xs text-gray-400">Use the mobile number your driver already has on file for your child.</p>
            <input value={gPhone} onChange={e => setGPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && loginGuardian()} placeholder="Mobile Number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            {gAuthErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{gAuthErr}</p>}
            <button onClick={loginGuardian} disabled={gAuthBusy || !gPhone.trim()} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
              {gAuthBusy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />} Log In
            </button>
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
              <p className="text-[11px] text-gray-400 mb-2">Older notifications are cleaned up automatically.</p>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {groupNotificationsByDate(gNotifications).map(([label, items]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sticky top-0 bg-white">{label}</p>
                    <div className="space-y-2">
                      {items.map(n => (
                        <div key={n.id} className={`text-xs p-2.5 rounded-lg ${n.read ? "text-gray-500 bg-gray-50" : "text-gray-800 bg-teal-50 font-medium"}`}>
                          <p className="whitespace-pre-line">{n.text}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      ))}
                    </div>
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
