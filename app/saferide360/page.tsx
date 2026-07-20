"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Loader2, LogOut, ArrowRight, Plus, MapPin, Users, Bus, Bell,
  CheckCircle, XCircle, AlertTriangle, Phone, X, Navigation, Siren, Mic, MicOff,
  MessageSquare, CreditCard, Pencil, RefreshCw,
} from "lucide-react";
import { saferide360Api, getToken, setToken, clearToken, getStoredRole, setStoredRole, ApiError } from "./lib/api";
import type { Driver, Organization, Stop, Passenger, Trip, TripPassenger, GuardianTodayEntry, GuardianNotification, Billing, GeocodeResult, TripTemplate, TripRosterEntry, GuardianStop, SubstituteDriver, AbsenceKind } from "./lib/types";
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

// Rough ETA only — straight-line distance / an assumed city-driving speed,
// not real routing/traffic (no paid directions API in this stack). Good
// enough to tell a parent "a few minutes" vs "quite a while," not a precise
// arrival time.
const ASSUMED_CITY_SPEED_KMH = 20;
function estimateEtaMinutes(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round((distanceKm / ASSUMED_CITY_SPEED_KMH) * 60));
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
  const [setupTab, setSetupTab] = useState<"stops" | "students" | "templates" | "substitutes">("stops");
  const [stops, setStops] = useState<Stop[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripTemplates, setTripTemplates] = useState<TripTemplate[]>([]);
  const [substituteDrivers, setSubstituteDrivers] = useState<SubstituteDriver[]>([]);
  const [dashLoading, setDashLoading] = useState(false);

  const loadDriverData = async () => {
    setDashLoading(true);
    try {
      const [s, p, t, tt, sd] = await Promise.all([saferide360Api.listStops(), saferide360Api.listPassengers(), saferide360Api.listTrips(), saferide360Api.listTripTemplates(), saferide360Api.listSubstituteDrivers()]);
      setStops(s); setPassengers(p); setTrips(t); setTripTemplates(tt); setSubstituteDrivers(sd);
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

  // ── Substitute drivers directory + advance unavailability notice ──────
  const [subName, setSubName] = useState(""); const [subPhone, setSubPhone] = useState("");
  const [subVehicleNumber, setSubVehicleNumber] = useState(""); const [subVehicleType, setSubVehicleType] = useState("van");
  const [subBusy, setSubBusy] = useState(false); const [subErr, setSubErr] = useState("");
  const addSubstituteDriver = async () => {
    setSubErr("");
    if (!subName.trim() || !subPhone.trim()) { setSubErr("Name and phone are required."); return; }
    setSubBusy(true);
    try {
      const sd = await saferide360Api.createSubstituteDriver({ name: subName.trim(), phone: subPhone.trim(), vehicle_number: subVehicleNumber.trim() || undefined, vehicle_type: subVehicleType || undefined });
      setSubstituteDrivers(prev => [sd, ...prev]);
      setSubName(""); setSubPhone(""); setSubVehicleNumber("");
    } catch (e: any) {
      setSubErr(e.message || "Could not save this substitute driver.");
    } finally {
      setSubBusy(false);
    }
  };
  const deleteSubstituteDriver = async (sd: SubstituteDriver) => {
    if (!confirm(`Remove ${sd.name} from your substitutes list?`)) return;
    await saferide360Api.deleteSubstituteDriver(sd.id);
    setSubstituteDrivers(prev => prev.filter(x => x.id !== sd.id));
  };

  const [unavailDate, setUnavailDate] = useState(""); const [unavailMessage, setUnavailMessage] = useState("");
  const [unavailSubId, setUnavailSubId] = useState(""); const [unavailBusy, setUnavailBusy] = useState(false);
  const [unavailErr, setUnavailErr] = useState(""); const [unavailSentMsg, setUnavailSentMsg] = useState("");
  const sendUnavailability = async () => {
    setUnavailErr(""); setUnavailSentMsg("");
    if (!unavailDate) { setUnavailErr("Pick a date."); return; }
    setUnavailBusy(true);
    try {
      const sub = substituteDrivers.find(s => s.id === unavailSubId);
      const { notified } = await saferide360Api.notifyUnavailability({
        date: unavailDate, message: unavailMessage.trim() || undefined,
        substitute_name: sub?.name, substitute_phone: sub?.phone,
      });
      setUnavailSentMsg(`Notified ${notified} parent${notified === 1 ? "" : "s"}.`);
      setUnavailDate(""); setUnavailMessage(""); setUnavailSubId("");
    } catch (e: any) {
      setUnavailErr(e.message || "Could not send this notice.");
    } finally {
      setUnavailBusy(false);
    }
  };

  const [newTName, setNewTName] = useState(""); const [newTDirection, setNewTDirection] = useState<"pickup" | "drop">("pickup");
  const [newTStart, setNewTStart] = useState("07:00"); const [newTEnd, setNewTEnd] = useState("08:00");
  const [newTTemplate, setNewTTemplate] = useState("");
  const addTrip = async () => {
    if (!newTName.trim()) return;
    const t = await saferide360Api.createTrip({ name: newTName.trim(), direction: newTDirection, scheduled_start_time: newTStart, scheduled_end_time: newTEnd, template_id: newTTemplate || undefined });
    setTrips(prev => [t, ...prev]); setNewTName(""); setNewTTemplate("");
  };

  // "By default provide 2 trips for the day (home to school, school to
  // home)" — one tap creates a sensibly-named, sensibly-timed trip instead
  // of filling in the custom form every day for the routine two runs.
  const [quickStartBusy, setQuickStartBusy] = useState<"pickup" | "drop" | null>(null);
  const quickStartTrip = async (direction: "pickup" | "drop") => {
    setQuickStartBusy(direction);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60_000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const label = direction === "pickup" ? "Home → School" : "School → Home";
      const t = await saferide360Api.createTrip({
        name: `${label} — ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        direction, scheduled_start_time: `${pad(now.getHours())}:${pad(now.getMinutes())}`, scheduled_end_time: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      });
      setTrips(prev => [t, ...prev]);
      await openTrip(t);
    } finally {
      setQuickStartBusy(null);
    }
  };

  // ── Driver: active trip ──────────────────────────────────────────────
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripPassengers, setTripPassengers] = useState<(TripPassenger & { passengerName: string })[]>([]);
  const [rosterPreview, setRosterPreview] = useState<TripRosterEntry[]>([]);
  const [selectedRosterIds, setSelectedRosterIds] = useState<Set<string>>(new Set());
  const [rosterLoading, setRosterLoading] = useState(false);
  const [confirmedCountInput, setConfirmedCountInput] = useState("");
  const [startCountErr, setStartCountErr] = useState("");
  const [startBusy, setStartBusy] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastBroadcastRef = useRef(0);

  // Loaded fresh every time — a newly-onboarded student (once they have a
  // pickup/drop stop set) shows up automatically, no stale snapshot.
  const loadRosterPreview = async (tripId: string) => {
    setRosterLoading(true);
    try {
      const preview = await saferide360Api.tripRosterPreview(tripId);
      setRosterPreview(preview);
      const selectable = preview.filter(r => !r.absentToday).map(r => r.passengerId);
      setSelectedRosterIds(new Set(selectable));
      setConfirmedCountInput(String(selectable.length));
    } catch { /* ignore, non-critical preview */ } finally {
      setRosterLoading(false);
    }
  };

  const toggleRosterSelection = (passengerId: string) => {
    setSelectedRosterIds(prev => {
      const next = new Set(prev);
      if (next.has(passengerId)) next.delete(passengerId); else next.add(passengerId);
      setConfirmedCountInput(String(next.size));
      return next;
    });
  };

  // Add any other org student to today's trip — not just the ones the
  // stop/template auto-resolved (e.g. someone without this direction's stop
  // configured yet, or outside the trip's template for a one-off change).
  // The backend treats passenger_ids as authoritative at start time, so
  // whoever is selected here rides today regardless of how they were added.
  const [addStudentId, setAddStudentId] = useState("");
  const addableStudents = passengers.filter(p => !rosterPreview.some(r => r.passengerId === p.id));
  const addStudentToRoster = () => {
    const p = passengers.find(x => x.id === addStudentId);
    if (!p || !activeTrip) return;
    const stopId = activeTrip.direction === "drop" ? p.dropStopId : p.pickupStopId;
    const stop = stops.find(s => s.id === stopId);
    const entry: TripRosterEntry = {
      passengerId: p.id, name: p.name, schoolName: p.schoolName,
      stopName: stop?.name || "No stop set", stopLat: stop?.lat, stopLng: stop?.lng,
      absentToday: p.absentToday, absenceKind: p.absenceKind,
    };
    setRosterPreview(prev => [...prev, entry]);
    if (!p.absentToday) {
      setSelectedRosterIds(prev => {
        const next = new Set(prev); next.add(p.id);
        setConfirmedCountInput(String(next.size));
        return next;
      });
    }
    setAddStudentId("");
  };

  const openTrip = async (t: Trip) => {
    setActiveTrip(t);
    setRosterPreview([]); setSelectedRosterIds(new Set()); setConfirmedCountInput(""); setStartCountErr(""); setAddStudentId("");
    if (t.status === "active") {
      const tp = await saferide360Api.listTripPassengers(t.id);
      setTripPassengers(tp);
    } else if (t.status === "scheduled") {
      await loadRosterPreview(t.id);
    }
    go("driver-trip");
  };

  // Driver must confirm the expected headcount (total minus today's
  // absentees, and any they deselected) before a trip can start — same
  // safety-gate shape as the existing complete-trip confirmation, just at
  // the other end of the trip. passenger_ids lets the driver flex the
  // roster right here (deselect a no-show, or a newly-onboarded student
  // who isn't riding yet) without needing a saved template.
  const startTrip = async (t: Trip) => {
    setTripStartErr(null); setTripStartGenericErr(""); setStartCountErr("");
    const n = parseInt(confirmedCountInput, 10);
    if (isNaN(n) || n < 0) { setStartCountErr("Enter a valid number of students."); return; }
    setStartBusy(true);
    try {
      const updated = await saferide360Api.startTrip(t.id, n, Array.from(selectedRosterIds));
      setActiveTrip(updated);
      setTrips(prev => prev.map(x => x.id === updated.id ? updated : x));
      const tp = await saferide360Api.listTripPassengers(updated.id);
      setTripPassengers(tp);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === "SUBSCRIPTION_REQUIRED") {
        setTripStartErr({ message: e.message, passengerCount: e.data.passengerCount, ratePerPassenger: e.data.ratePerPassenger, monthlyCost: e.data.monthlyCost });
      } else if (e instanceof ApiError && e.code === "STUDENT_COUNT_MISMATCH") {
        setStartCountErr(e.message);
      } else {
        setTripStartGenericErr(e.message || "Could not start this trip.");
      }
    } finally {
      setStartBusy(false);
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

  // Keeps the phone screen from sleeping while a trip is active — a locked
  // screen throttles/pauses the geolocation watch above, which is the real
  // reliability gap in phone-based tracking (not something hardware trackers
  // would fix any cheaper). Free, no new infra: just the browser's Wake Lock
  // API. The browser releases the lock automatically when the tab loses
  // visibility, so it's re-acquired on visibilitychange too.
  const wakeLockRef = useRef<any>(null);
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== "active" || !("wakeLock" in navigator)) return;
    let cancelled = false;
    const acquire = async () => {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      } catch { /* not fatal — tracking still runs, just may pause if the screen sleeps */ }
    };
    acquire();
    const onVisible = () => { if (!cancelled && document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [activeTrip?.id, activeTrip?.status]);

  // One pin per stop, labeled with every student riding through it on this
  // trip (not just the stop name) — "done" once every student there has
  // been confirmed picked/absent, so the driver can see route progress at
  // a glance instead of just a flat list.
  const [showTripMap, setShowTripMap] = useState(false);
  const tripMapStops: LiveStop[] = (() => {
    const byStop = new Map<string, { name: string; lat: number; lng: number; names: string[]; allDone: boolean }>();
    for (const tp of tripPassengers) {
      if (tp.stopLat == null || tp.stopLng == null) continue;
      const key = `${tp.stopLat},${tp.stopLng}`;
      const entry = byStop.get(key) || { name: tp.stopName || "Stop", lat: tp.stopLat, lng: tp.stopLng, names: [], allDone: true };
      entry.names.push(tp.passengerName || "Student");
      if (tp.status === "pending") entry.allDone = false;
      byStop.set(key, entry);
    }
    return Array.from(byStop.entries()).map(([key, s]) => ({
      id: key, name: `${s.name} — ${s.names.join(", ")}`, lat: s.lat, lng: s.lng, state: s.allDone ? "done" : "upcoming",
    }));
  })();

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

  // SOS carries a reason and a contact person so a parent knows what's
  // wrong and who to actually call, not just that something is.
  const [showSosForm, setShowSosForm] = useState(false);
  const [sosReason, setSosReason] = useState(""); const [sosContactName, setSosContactName] = useState(""); const [sosContactPhone, setSosContactPhone] = useState("");
  const [sosBusy, setSosBusy] = useState(false); const [sosSent, setSosSent] = useState(false);
  const sendSos = async () => {
    if (!activeTrip || !sosReason.trim() || !confirm("Send an emergency alert to every parent on this trip?")) return;
    setSosBusy(true);
    try {
      await saferide360Api.sosTrip(activeTrip.id, { reason: sosReason.trim(), contact_name: sosContactName.trim() || undefined, contact_phone: sosContactPhone.trim() || undefined });
      setSosSent(true); setShowSosForm(false);
    } finally {
      setSosBusy(false);
    }
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
  const [gTripStops, setGTripStops] = useState<Record<string, GuardianStop[]>>({});
  const [myChildren, setMyChildren] = useState<Passenger[]>([]);
  const [absenceBusyId, setAbsenceBusyId] = useState<string | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [expandedTripMapId, setExpandedTripMapId] = useState<string | null>(null);
  const [gLoading, setGLoading] = useState(false);

  const loadGuardianData = async () => {
    setGLoading(true);
    try {
      const [status, notifs, children] = await Promise.all([saferide360Api.todayStatus(), saferide360Api.notifications(), saferide360Api.myChildren()]);
      setTodayStatus(status);
      setGNotifications(notifs);
      setMyChildren(children);
      const uniqueTripIds = Array.from(new Set(status.filter(s => s.tripStatus === "active").map(s => s.tripId)));
      const stopsByTrip: Record<string, GuardianStop[]> = {};
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

  // "Parents able to mark absent for the student on the day" — reflected
  // automatically the next time a trip starts (driver never has to chase or
  // wait on a child who isn't riding today).
  const markChildAbsence = async (p: Passenger, kind: AbsenceKind) => {
    setAbsenceBusyId(p.id);
    try {
      const result = await saferide360Api.markChildAbsentToday(p.id, kind);
      setMyChildren(prev => prev.map(c => c.id === p.id ? { ...c, absentToday: result.absentToday, absenceKind: result.kind } : c));
    } finally {
      setAbsenceBusyId(null);
    }
  };
  const cancelChildAbsence = async (p: Passenger) => {
    setAbsenceBusyId(p.id);
    try {
      const result = await saferide360Api.unmarkChildAbsentToday(p.id);
      setMyChildren(prev => prev.map(c => c.id === p.id ? { ...c, absentToday: result.absentToday, absenceKind: undefined } : c));
    } finally {
      setAbsenceBusyId(null);
    }
  };

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => quickStartTrip("pickup")} disabled={quickStartBusy !== null} className="flex items-center justify-between bg-white border-2 border-gray-200 hover:border-teal-400 disabled:opacity-50 rounded-2xl p-4 transition text-left">
              <div><p className="font-black text-gray-900 text-sm">🏠 → 🏫 Home to School</p><p className="text-[11px] text-gray-400 mt-0.5">Quick-start today's pickup run</p></div>
              {quickStartBusy === "pickup" ? <Loader2 size={16} className="animate-spin text-teal-600" /> : <ArrowRight size={16} className="text-teal-600" />}
            </button>
            <button onClick={() => quickStartTrip("drop")} disabled={quickStartBusy !== null} className="flex items-center justify-between bg-white border-2 border-gray-200 hover:border-teal-400 disabled:opacity-50 rounded-2xl p-4 transition text-left">
              <div><p className="font-black text-gray-900 text-sm">🏫 → 🏠 School to Home</p><p className="text-[11px] text-gray-400 mt-0.5">Quick-start today's drop run</p></div>
              {quickStartBusy === "drop" ? <Loader2 size={16} className="animate-spin text-teal-600" /> : <ArrowRight size={16} className="text-teal-600" />}
            </button>
          </div>

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
              ["substitutes", "Substitutes", substituteDrivers.length],
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
            {stops.length > 0 && (
              <div className="mt-3">
                <LiveMap driverPosition={null} stops={stops.map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, state: "upcoming" }))} height="240px" autoFollow={false} />
              </div>
            )}
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

          {setupTab === "substitutes" && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 text-sm mb-1 flex items-center gap-2"><Bus size={15} className="text-teal-600" /> Substitute Drivers</h3>
              <p className="text-[11px] text-gray-400 mb-3">Save a substitute's contact and vehicle once, then pick them when sending an unavailability notice below.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Substitute Name" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <input value={subPhone} onChange={e => setSubPhone(e.target.value)} placeholder="Substitute Mobile" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <input value={subVehicleNumber} onChange={e => setSubVehicleNumber(e.target.value)} placeholder="Vehicle Number (if different)" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <select value={subVehicleType} onChange={e => setSubVehicleType(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="van">Van</option><option value="bus">Bus</option><option value="auto">Auto</option><option value="car">Car</option>
                </select>
              </div>
              {subErr && <p className="text-[11px] text-red-600 mb-2">{subErr}</p>}
              <button onClick={addSubstituteDriver} disabled={subBusy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition mb-3">
                {subBusy && <Loader2 size={12} className="animate-spin" />} Save Substitute
              </button>
              <div className="space-y-1.5">
                {substituteDrivers.length === 0 && <p className="text-xs text-gray-400">No substitutes saved yet.</p>}
                {substituteDrivers.map(sd => (
                  <div key={sd.id} className="flex items-center justify-between text-xs text-gray-700 rounded-lg px-2 py-1.5">
                    <span>• {sd.name} <span className="text-gray-400">— {sd.phone}{sd.vehicleNumber ? ` · ${sd.vehicleType} ${sd.vehicleNumber}` : ""}</span></span>
                    <button onClick={() => deleteSubstituteDriver(sd)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 text-sm mb-1 flex items-center gap-2"><Bell size={15} className="text-teal-600" /> Notify Unavailability in Advance</h3>
              <p className="text-[11px] text-gray-400 mb-3">Tell every parent well ahead of time if you won't be driving on a date — optionally naming who's covering.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input value={unavailDate} onChange={e => setUnavailDate(e.target.value)} type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                <select value={unavailSubId} onChange={e => setUnavailSubId(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="">No substitute named</option>
                  {substituteDrivers.map(sd => <option key={sd.id} value={sd.id}>{sd.name} — {sd.phone}</option>)}
                </select>
              </div>
              <textarea value={unavailMessage} onChange={e => setUnavailMessage(e.target.value)} rows={2} placeholder="Optional message, e.g. reason or extra instructions…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs mb-2 resize-none" />
              {unavailErr && <p className="text-[11px] text-red-600 mb-2">{unavailErr}</p>}
              <button onClick={sendUnavailability} disabled={unavailBusy} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                {unavailBusy ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />} Notify Parents
              </button>
              {unavailSentMsg && <p className="text-[11px] text-teal-600 font-bold mt-2">{unavailSentMsg}</p>}
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
                <div className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      On this trip ({selectedRosterIds.size} of {rosterPreview.length})
                    </p>
                    <button onClick={() => activeTrip && loadRosterPreview(activeTrip.id)} disabled={rosterLoading} className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline disabled:opacity-50">
                      {rosterLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Refresh
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">Uncheck anyone not riding today, or add another student below.</p>
                  {rosterPreview.length === 0 ? (
                    <p className="text-xs text-gray-400 mb-2">No students on this trip yet — add one below.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto mb-2">
                      {rosterPreview.map(r => (
                        <label key={r.passengerId} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1.5 cursor-pointer ${r.absentToday ? "bg-gray-50 text-gray-400" : "text-gray-700"}`}>
                          <span className="flex items-center gap-2 font-bold">
                            <input type="checkbox" className="accent-teal-600" disabled={r.absentToday}
                              checked={r.absentToday ? false : selectedRosterIds.has(r.passengerId)}
                              onChange={() => toggleRosterSelection(r.passengerId)} />
                            {r.name}
                          </span>
                          <span className="text-gray-400">
                            {r.absentToday ? (r.absenceKind === "self_arranged" ? "Parent managing today — skip stop" : "Absent today (parent)") : r.stopName}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {addableStudents.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                        <option value="">+ Add a student to this trip…</option>
                        {addableStudents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={addStudentToRoster} disabled={!addStudentId} className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  )}
                </div>

                {rosterPreview.length > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-1.5">
                    <label className="text-[11px] font-bold text-teal-800">Confirm number of students for this trip</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} value={confirmedCountInput} onChange={e => setConfirmedCountInput(e.target.value)}
                        className="w-20 border border-teal-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold bg-white" />
                      <span className="text-[11px] text-teal-700">{selectedRosterIds.size} selected ({rosterPreview.length} on roster, {rosterPreview.filter(r => r.absentToday).length} absent)</span>
                    </div>
                  </div>
                )}
                {startCountErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{startCountErr}</p>}

                <button onClick={() => startTrip(activeTrip)} disabled={startBusy} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm py-3.5 rounded-2xl transition">
                  {startBusy && <Loader2 size={15} className="animate-spin" />} Start Trip
                </button>
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
                        <span className={`text-xs font-bold ${tp.status === "picked" ? "text-green-600" : "text-gray-400"}`}>
                          {tp.status === "picked" ? "✓ Picked Up" : tp.absenceKind === "self_arranged" ? "Parent managing — skip" : "Absent"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">Any student not confirmed will be marked absent when the trip completes.</p>

                {tripMapStops.length > 0 && (
                  <>
                    <button onClick={() => setShowTripMap(v => !v)} className="w-full flex items-center justify-center gap-2 border border-teal-200 text-teal-700 hover:bg-teal-50 font-bold text-sm py-3 rounded-xl transition">
                      <MapPin size={14} /> {showTripMap ? "Hide Map" : "View Map"}
                    </button>
                    {showTripMap && (
                      <LiveMap driverPosition={activeTrip.liveLat != null && activeTrip.liveLng != null ? { lat: activeTrip.liveLat, lng: activeTrip.liveLng } : null} driverLabel={activeTrip.name} stops={tripMapStops} height="280px" />
                    )}
                  </>
                )}

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

                {showSosForm && !sosSent && (
                  <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-red-800">What's the emergency? (required, sent to every parent)</p>
                    <input value={sosReason} onChange={e => setSosReason(e.target.value)} placeholder="e.g. Vehicle breakdown, medical emergency…" className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={sosContactName} onChange={e => setSosContactName(e.target.value)} placeholder="Contact person name" className="border border-red-200 rounded-lg px-3 py-2 text-sm bg-white" />
                      <input value={sosContactPhone} onChange={e => setSosContactPhone(e.target.value)} placeholder="Contact phone (optional)" className="border border-red-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={sendSos} disabled={sosBusy || !sosReason.trim()} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition">
                        {sosBusy ? <Loader2 size={14} className="animate-spin" /> : <Siren size={14} />} Send Emergency Alert
                      </button>
                      <button onClick={() => setShowSosForm(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowSosForm(v => !v)} disabled={sosSent} className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-bold text-sm py-3 rounded-xl transition"><Siren size={14} /> {sosSent ? "Alert Sent" : "SOS"}</button>
                  <button onClick={openCompleteTrip} className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition">Complete Trip</button>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Keep this screen open — live location is shared with parents while the trip is active. Your phone screen will stay on automatically so tracking doesn't pause.</p>

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

          {/* Driver alerts/messages for today, surfaced up top — not buried
              in the general notifications list below. */}
          {gNotifications.filter(n => ["trip_alert", "sos"].includes(n.type) && dateGroupLabel(n.createdAt) === "Today").length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle size={13} /> From your driver today</p>
              {gNotifications.filter(n => ["trip_alert", "sos"].includes(n.type) && dateGroupLabel(n.createdAt) === "Today").map(n => (
                <div key={n.id} className="text-xs text-amber-900">
                  <p className="whitespace-pre-line font-medium">{n.text}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">{new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ))}
            </div>
          )}

          {myChildren.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-black text-gray-900 text-sm mb-1 flex items-center gap-2"><Users size={14} className="text-teal-600" /> My Children</h3>
              <p className="text-[11px] text-gray-400 mb-3">Mark a child absent, or say you're handling pickup/drop yourself today — either way the driver sees it automatically and won't wait.</p>
              <div className="space-y-3">
                {myChildren.map(c => {
                  const childStops: LiveStop[] = [];
                  if (c.pickupLat != null && c.pickupLng != null) childStops.push({ id: `${c.id}-pickup`, name: `${c.pickupStopName || "Pickup"} (Home → School)`, lat: c.pickupLat, lng: c.pickupLng, state: "upcoming" });
                  if (c.dropLat != null && c.dropLng != null && (c.dropLat !== c.pickupLat || c.dropLng !== c.pickupLng)) childStops.push({ id: `${c.id}-drop`, name: `${c.dropStopName || "Drop"} (School → Home)`, lat: c.dropLat, lng: c.dropLng, state: "upcoming" });
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-gray-900">{c.name}</span> {c.schoolName && <span className="text-gray-400 font-normal">({c.schoolName})</span>}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {c.pickupStopName ? `Pickup: ${c.pickupStopName}` : "No pickup point set"}{c.dropStopName ? ` · Drop: ${c.dropStopName}` : ""}
                          </p>
                        </div>
                        {c.absentToday ? (
                          <button onClick={() => cancelChildAbsence(c)} disabled={absenceBusyId === c.id}
                            className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50 shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                            {absenceBusyId === c.id ? <Loader2 size={11} className="animate-spin" /> : null}
                            {c.absenceKind === "self_arranged" ? "Self-managed today — Cancel" : "Absent today — Cancel"}
                          </button>
                        ) : (
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => markChildAbsence(c, "absent")} disabled={absenceBusyId === c.id}
                              className="flex items-center gap-1 font-bold px-2 py-1 rounded-lg transition disabled:opacity-50 text-gray-500 border border-gray-200 hover:bg-gray-50">
                              {absenceBusyId === c.id ? <Loader2 size={11} className="animate-spin" /> : null} Mark absent
                            </button>
                            <button onClick={() => markChildAbsence(c, "self_arranged")} disabled={absenceBusyId === c.id}
                              className="flex items-center gap-1 font-bold px-2 py-1 rounded-lg transition disabled:opacity-50 text-gray-500 border border-gray-200 hover:bg-gray-50">
                              I'll drop/pick up myself
                            </button>
                          </div>
                        )}
                      </div>
                      {childStops.length > 0 && (
                        <>
                          <button onClick={() => setExpandedChildId(expandedChildId === c.id ? null : c.id)} className="text-[11px] font-bold text-teal-600 hover:underline mt-1.5">
                            {expandedChildId === c.id ? "Hide map" : "Show pickup/drop on map"}
                          </button>
                          {expandedChildId === c.id && <div className="mt-2"><LiveMap driverPosition={null} stops={childStops} height="200px" autoFollow={false} /></div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gLoading && todayStatus.length === 0 ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={22} /></div>
          ) : todayStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No trips in the last couple of days — you'll see tracking here once your driver starts one.</p>
          ) : (
            groupNotificationsByDate(todayStatus).map(([dateLabel, entries]) => (
              <div key={dateLabel} className="space-y-3">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{dateLabel} <span className="font-normal normal-case text-gray-300">· {entries.length} trip{entries.length === 1 ? "" : "s"}</span></p>
                {entries.map(s => {
                  const liveStops: LiveStop[] = (gTripStops[s.tripId] || []).map(st => ({
                    id: st.id, name: st.studentNames?.length ? `${st.name} — ${st.studentNames.join(", ")}` : st.name,
                    lat: st.lat, lng: st.lng, state: "upcoming",
                  }));
                  const hasLive = s.tripStatus === "active" && s.liveLat != null && s.liveLng != null;
                  const fallbackStops: LiveStop[] = liveStops.length > 0 ? liveStops
                    : (s.stopLat != null && s.stopLng != null ? [{ id: s.tripId, name: s.stopName || "Stop", lat: s.stopLat, lng: s.stopLng, state: "upcoming" as const }] : []);
                  return (
                    <div key={s.tripPassengerId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-gray-900 text-sm">{s.passengerName} <span className="text-[10px] font-bold text-teal-600 ml-1">{s.direction === "pickup" ? "Home → School" : "School → Home"}</span></p>
                            <p className="text-xs text-gray-400">{s.tripName} · {s.driverName} · {s.vehicleNumber}{s.stopName ? ` · ${s.stopName}` : ""}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${s.status === "picked" ? "bg-green-50 text-green-700" : s.status === "absent" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}>
                            {s.status === "picked" ? "✓ Picked Up" : s.status === "absent" ? "Absent" : "Awaiting Pickup"}
                          </span>
                        </div>
                        {fallbackStops.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <button onClick={() => setExpandedTripMapId(expandedTripMapId === s.tripPassengerId ? null : s.tripPassengerId)} className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1">
                                <MapPin size={11} /> {expandedTripMapId === s.tripPassengerId ? "Hide live map" : "View Live Map"}
                              </button>
                              {hasLive && s.stopLat != null && s.stopLng != null && (
                                <span className="text-[11px] text-gray-400">
                                  ~{estimateEtaMinutes({ lat: s.liveLat!, lng: s.liveLng! }, { lat: s.stopLat, lng: s.stopLng })} min to {s.direction === "pickup" ? "pickup" : "drop"} point <span className="text-gray-300">(estimate)</span>
                                </span>
                              )}
                            </div>
                            {expandedTripMapId === s.tripPassengerId && (
                              <div className="mt-2">
                                <LiveMap driverPosition={hasLive ? { lat: s.liveLat!, lng: s.liveLng! } : null} driverLabel={`${s.driverName} — ${s.vehicleNumber}`} stops={fallbackStops} height="220px" autoFollow={hasLive} />
                              </div>
                            )}
                          </div>
                        )}
                        {s.tripStatus === "completed" && <p className="text-xs text-green-600 font-bold flex items-center gap-1.5"><CheckCircle size={13} /> Trip completed{s.direction === "drop" ? " — reached home safely" : " — reached school safely"}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
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
