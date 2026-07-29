"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Car, MapPin, Zap, PiggyBank, ArrowRight, ChevronRight, X, Loader2,
  CheckCircle, XCircle, LogOut, Package, MessageSquare, Navigation,
  Play, Square, Clock, TrendingUp, User, Phone, Mail, ShieldCheck,
  Fuel, Gauge, Sparkles, Plus, Radar, IndianRupee, Bell, Truck, Bike, MessageCircle, Copy, Share2,
} from "lucide-react";
import LocationPicker from "./components/LocationPicker";
import { haversineKm, analyzeEmptyRide, estimateFare, piggyContribution, reverseGeocode, isLocationInIndia } from "./lib/geo";
import { analyzeDriver } from "./lib/analytics";
import { ride360Api, getToken, setToken, clearToken, getStoredRole, setStoredRole } from "./lib/api";
import type {
  DriverProfile, CustomerProfile, GeoPoint, Ride, CustomerRequest, RideProvider, VehicleType, FuelLog, AppNotification,
} from "./lib/types";

const VEHICLE_FILTER_ICON: Record<VehicleType, any> = { auto: Car, cab: Car, transport: Truck, bike: Bike };

const RideMap = dynamic(() => import("./components/RideMap"), { ssr: false, loading: () => <div className="h-[260px] bg-slate-100 rounded-xl animate-pulse" /> });

// ── Onboarding copy (matches the validated reference design) ────────────────
const ONBOARDING = [
  { title: "Track every ride", desc: "Log your Self, Ola & Uber rides with live map tracking from source to destination.", icon: Car },
  { title: "AI on empty rides", desc: "Get smart tips to reduce empty km, save fuel, and find nearby ride or parcel requests.", icon: Zap },
  { title: "Grow your Piggy", desc: "Auto-save a slice of every fare. Watch your savings grow ride by ride.", icon: PiggyBank },
];

type View =
  | "landing" | "onboarding" | "auth"
  | "driverProfileSetup" | "driverDashboard" | "driverActiveRide" | "driverRequests" | "driverProfile" | "driverAnalysis"
  | "customerHome" | "customerNewRequest" | "customerMyRequests" | "customerNearbyDrivers";

const PROVIDER_LABEL: Record<RideProvider, string> = { self: "Self", ola: "Ola", uber: "Uber", rideconnect360: "RideConnect360" };

const RIDE360_URL = "https://www.demandgeniusai.com/ride360";
const buildDriverInviteMsg = (refLink: string) =>
  `🚕 *Join Ride360* — track every ride, cut empty km with AI, and auto-save into your Piggy fund!\n\n` +
  `✅ Log Self/Ola/Uber rides with live map tracking\n` +
  `✅ AI shows the real cost of every empty run — and finds nearby customers instantly\n` +
  `✅ Auto-save a % of every fare into your Piggy, hassle-free\n` +
  `✅ Free to join, takes 2 minutes — no app store needed\n\n` +
  `👉 Join free: ${refLink}`;
const buildCustomerInviteMsg = (refLink: string) =>
  `🚗 *Need a ride or want to send a package fast?* Try Ride360 — nearby drivers running empty reach out to YOU directly.\n\n` +
  `✅ Post what you need, nearby drivers respond\n` +
  `✅ Or browse drivers within 5km and reach out yourself\n` +
  `✅ Negotiate price directly, no surge pricing\n` +
  `✅ Works right in your browser — no app store needed\n\n` +
  `👉 Try it free: ${refLink}`;
const inviteCountKey = (id: string) => `ride360_invite_count_${id}`;

const REQ_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function Ride360Page() {
  const [view, setView] = useState<View>("landing");
  const [role, setRole] = useState<"driver" | "customer">("driver");
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [onboardStep, setOnboardStep] = useState(0);

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<CustomerRequest[]>([]); // "mine" — claimed-by-me (driver) or submitted-by-me (customer)
  const [requestPool, setRequestPool] = useState<(CustomerRequest & { distKm?: number })[]>([]); // open, unclaimed — browsed by a driver after an empty run
  const [nearbyDriversRaw, setNearbyDriversRaw] = useState<{ ride: Ride; driver: { id: string; name: string; vehicleType: string; vehicleNumber: string } }[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const referredByRef = useRef<string | undefined>(undefined);
  const [currentLocLabel, setCurrentLocLabel] = useState<string>("Detecting your location…");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPick, setLocationPick] = useState<GeoPoint | null>(null);
  const locationOverriddenRef = useRef(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [nearbyRangeKm, setNearbyRangeKm] = useState(5);

  // Customer-initiated outreach to a specific driver's empty run
  const [targetDriverRide, setTargetDriverRide] = useState<Ride | null>(null);
  const [targetDriverInfo, setTargetDriverInfo] = useState<{ name: string; vehicleType: string } | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | "all">("all");

  // Invite Friends/Drivers modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteEmailTo, setInviteEmailTo] = useState("");
  const [inviteEmailSent, setInviteEmailSent] = useState(false);

  // Price negotiation in a thread
  const [proposeAmount, setProposeAmount] = useState("");

  // Fuel log form
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelDate, setFuelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fuelLiters, setFuelLiters] = useState(""); const [fuelCost, setFuelCost] = useState(""); const [fuelOdometer, setFuelOdometer] = useState("");

  // Odometer at ride close
  const [closingOdometerKm, setClosingOdometerKm] = useState("");

  // Auth form state
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("auto");
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const [authErr, setAuthErr] = useState(""); const [authBusy, setAuthBusy] = useState(false);

  // Profile setup
  const [vehicleNumber, setVehicleNumber] = useState(""); const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState(""); const [piggyPct, setPiggyPct] = useState(10);

  // Active ride
  const [rideKind, setRideKind] = useState<"paid" | "empty">("paid");
  const [provider, setProvider] = useState<RideProvider>("self");
  const [source, setSource] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [fare, setFare] = useState<number>(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [rideElapsedSec, setRideElapsedSec] = useState(0);
  const [showResultsFor, setShowResultsFor] = useState<string | null>(null);
  const [nearbyOpen, setNearbyOpen] = useState(false);

  // Customer request form
  const [reqType, setReqType] = useState<"ride" | "parcel">("ride");
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [drop, setDrop] = useState<GeoPoint | null>(null);
  const [reqDesc, setReqDesc] = useState(""); const [reqAmount, setReqAmount] = useState("");

  const [focusedThread, setFocusedThread] = useState<CustomerRequest | null>(null);
  const [threadMsg, setThreadMsg] = useState("");

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = "Ride360 — Track Rides, Beat Empty Km, Grow Your Piggy";
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) referredByRef.current = ref;

    (async () => {
      const token = getToken();
      if (token) {
        try {
          const { role, user } = await ride360Api.me();
          if (role === "driver") {
            const d = user as DriverProfile;
            setDriver(d);
            setView(d.profileComplete ? "driverDashboard" : "driverProfileSetup");
            const [rideList, fuelList, notifList] = await Promise.all([ride360Api.listRides(), ride360Api.listFuelLogs(), ride360Api.listNotifications()]);
            setRides(rideList); setFuelLogs(fuelList); setNotifications(notifList);
          } else {
            const c = user as CustomerProfile;
            setCustomer(c);
            setView("customerHome");
            const [reqList, notifList] = await Promise.all([ride360Api.listMyRequests(), ride360Api.listNotifications()]);
            setRequests(reqList); setNotifications(notifList);
          }
        } catch {
          clearToken();
        }
      }
      setBootLoading(false);
    })();

    let watchId: number | null = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (isLocationInIndia(loc.lat, loc.lng)) {
            setCurrentLoc(loc);
            setCurrentLocLabel(await reverseGeocode(loc.lat, loc.lng));
          } else {
            setCurrentLocLabel("Location outside India — tap Change to set it");
          }
        },
        () => setCurrentLocLabel("Location unavailable — tap Change to set it")
      );
      watchId = navigator.geolocation.watchPosition(
        pos => {
          if (!locationOverriddenRef.current && isLocationInIndia(pos.coords.latitude, pos.coords.longitude)) {
            setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      setCurrentLocLabel("Location unavailable — tap Change to set it");
    }
    return () => {
      document.title = "NexusOS";
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Sync live position onto the active empty ride so other logged-in sessions
  // (e.g. a customer browsing Nearby Drivers) see an approximate live distance.
  useEffect(() => {
    if (!currentLoc || !activeRideId) return;
    const ride = rides.find(r => r.id === activeRideId);
    if (!ride || ride.kind !== "empty") return;
    ride360Api.updateRideLive(activeRideId, currentLoc.lat, currentLoc.lng)
      .then(updated => setRides(prev => prev.map(r => (r.id === activeRideId ? updated : r))))
      .catch(() => {});
  }, [currentLoc, activeRideId]);

  // Notification tracking: every outreach/message/status action is recorded
  // server-side as a persistent AppNotification the moment it happens (see
  // ride360.router.ts), so it's there whenever the recipient next opens the
  // app. This client polls for new ones every 20s while logged in to surface
  // a toast — there's no push service behind Ride360, so nothing reaches a
  // closed tab or a different device instantly; polling is the honest
  // approximation of "real-time" available here.
  const notificationsRef = useRef<AppNotification[]>([]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  useEffect(() => {
    if (!driver && !customer) return;
    const poll = async () => {
      try {
        const incoming = await ride360Api.listNotifications();
        const prevIds = new Set(notificationsRef.current.map(n => n.id));
        incoming.filter(n => !prevIds.has(n.id) && !n.read).forEach(n => toast.info(n.text));
        setNotifications(incoming);
      } catch {}
    };
    const interval = setInterval(poll, 20000);
    return () => clearInterval(interval);
  }, [driver, customer]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const markNotificationsRead = async () => {
    if (unreadNotifCount === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await ride360Api.markNotificationsRead(); } catch {}
  };

  const go = (v: View) => setView(v);

  // ── Location ─────────────────────────────────────────────────────────────
  const applyLocationPick = (p: GeoPoint) => {
    locationOverriddenRef.current = true;
    setCurrentLoc({ lat: p.lat, lng: p.lng });
    setCurrentLocLabel(p.address);
    setLocationPick(null);
    setShowLocationModal(false);
  };

  const useDeviceLocationNow = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!isLocationInIndia(loc.lat, loc.lng)) {
        toast.error("Location must be in India.");
        return;
      }
      locationOverriddenRef.current = false;
      setCurrentLoc(loc);
      setCurrentLocLabel(await reverseGeocode(loc.lat, loc.lng));
      setShowLocationModal(false);
    });
  };

  // ── Invite Friends/Drivers ───────────────────────────────────────────────
  const myId = driver?.id || customer?.id || "";
  const inviteRefLink = `${RIDE360_URL}?ref=${myId}`;
  const inviteCount = (() => { try { return parseInt(localStorage.getItem(inviteCountKey(myId)) || "0"); } catch { return 0; } })();
  const bumpInviteCount = () => { try { localStorage.setItem(inviteCountKey(myId), String(inviteCount + 1)); } catch {} };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteRefLink).then(() => { setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); });
    bumpInviteCount();
    toast.success("Invite link copied!");
  };
  const shareInviteWhatsApp = () => {
    const msg = driver ? buildDriverInviteMsg(inviteRefLink) : buildCustomerInviteMsg(inviteRefLink);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    bumpInviteCount();
  };
  const sendInviteEmail = () => {
    if (!inviteEmailTo.trim()) return;
    const s = encodeURIComponent(`Join me on Ride360${driver ? "" : " — need a ride?"}`);
    const b = encodeURIComponent(
      driver
        ? `Hi!\n\nI've been using Ride360 to track my rides, cut empty km with AI cost tips, and auto-save into a Piggy fund from every fare.\n\nJoin free using my link: ${inviteRefLink}\n\nSee you there!`
        : `Hi!\n\nI've been using Ride360 to get rides/couriers from nearby drivers running empty, without surge pricing.\n\nTry it free using my link: ${inviteRefLink}\n\nSee you there!`
    );
    window.open(`mailto:${inviteEmailTo}?subject=${s}&body=${b}`, "_blank");
    setInviteEmailSent(true); setTimeout(() => { setInviteEmailSent(false); setInviteEmailTo(""); }, 2000);
    bumpInviteCount();
  };

  // ── Auth handlers ────────────────────────────────────────────────────────
  const resetAuthFields = () => { setName(""); setEmail(""); setPassword(""); setPhone(""); setOtp(""); setOtpSent(false); setAuthErr(""); };

  const loadDriverData = async () => {
    const [rideList, fuelList, notifList] = await Promise.all([ride360Api.listRides(), ride360Api.listFuelLogs(), ride360Api.listNotifications()]);
    setRides(rideList); setFuelLogs(fuelList); setNotifications(notifList);
  };
  const loadCustomerData = async () => {
    const [reqList, notifList] = await Promise.all([ride360Api.listMyRequests(), ride360Api.listNotifications()]);
    setRequests(reqList); setNotifications(notifList);
  };

  const handleDriverRegister = async () => {
    setAuthErr("");
    if (!name.trim() || !email.trim() || !password.trim()) { setAuthErr("Name, email, and password are required."); return; }
    setAuthBusy(true);
    try {
      const { token, user } = await ride360Api.registerDriver(name.trim(), email.trim(), password, vehicleType, referredByRef.current);
      setToken(token); setStoredRole("driver");
      setDriver(user); resetAuthFields(); await loadDriverData(); go("driverProfileSetup");
    } catch (e: any) { setAuthErr(e.message || "Registration failed."); } finally { setAuthBusy(false); }
  };

  const handleDriverLogin = async () => {
    setAuthErr("");
    if (!email.trim() || !password.trim()) { setAuthErr("Email and password are required."); return; }
    setAuthBusy(true);
    try {
      const { token, user } = await ride360Api.loginDriver(email.trim(), password);
      setToken(token); setStoredRole("driver");
      setDriver(user); resetAuthFields(); await loadDriverData();
      go(user.profileComplete ? "driverDashboard" : "driverProfileSetup");
    } catch (e: any) { setAuthErr(e.message || "Login failed."); } finally { setAuthBusy(false); }
  };

  const handleSocialLogin = async (method: "google" | "linkedin") => {
    const demoName = method === "google" ? "Ravi Kumar" : "Ravi Kumar (LinkedIn)";
    const demoEmail = method === "google" ? "ravi.kumar.demo@gmail.com" : "ravi.kumar.demo@linkedin.com";
    setAuthBusy(true);
    try {
      const { token, user } = await ride360Api.socialLoginDriver(method, demoName, demoEmail, referredByRef.current);
      setToken(token); setStoredRole("driver");
      setDriver(user); resetAuthFields(); await loadDriverData();
      go(user.profileComplete ? "driverDashboard" : "driverProfileSetup");
    } catch (e: any) { setAuthErr(e.message || "Login failed."); } finally { setAuthBusy(false); }
  };

  const handleSendOtp = () => {
    setAuthErr("");
    if (phone.trim().length < 10) { setAuthErr("Enter a valid 10-digit phone number."); return; }
    setOtpSent(true);
    setOtp("1234"); // demo mode — no SMS gateway wired up, code is pre-filled
  };
  const handleVerifyOtp = async () => {
    setAuthErr("");
    if (otp.trim().length < 4) { setAuthErr("Enter the OTP sent to your phone."); return; }
    setAuthBusy(true);
    try {
      const { token, user } = await ride360Api.loginCustomer(phone.trim(), referredByRef.current);
      setToken(token); setStoredRole("customer");
      setCustomer(user); resetAuthFields(); await loadCustomerData(); go("customerHome");
    } catch (e: any) { setAuthErr(e.message || "Login failed."); } finally { setAuthBusy(false); }
  };

  const handleLogout = () => {
    clearToken();
    setDriver(null); setCustomer(null);
    setRides([]); setRequests([]); setFuelLogs([]); setNotifications([]); setRequestPool([]); setNearbyDriversRaw([]);
    go("landing");
  };

  // ── Driver profile setup ─────────────────────────────────────────────────
  const saveProfileSetup = async () => {
    if (!driver) return;
    if (!vehicleNumber.trim() || !licenseNumber.trim()) { setAuthErr("Vehicle number and license number are required."); return; }
    try {
      const updated = await ride360Api.updateDriverProfile({ vehicleNumber: vehicleNumber.trim(), licenseNumber: licenseNumber.trim(), licenseExpiry, piggyPct, profileComplete: true });
      setDriver(updated);
      go("driverDashboard");
    } catch (e: any) { setAuthErr(e.message || "Could not save profile."); }
  };

  // ── Ride lifecycle ───────────────────────────────────────────────────────
  const startRide = async () => {
    if (!driver || !source || !destination) return;
    const distanceKm = haversineKm(source, destination);
    try {
      const newRide = await ride360Api.startRide({
        kind: rideKind, provider: rideKind === "paid" ? provider : undefined,
        source, destination, fare: rideKind === "paid" ? fare : undefined, distanceKm,
      });
      setRides(prev => [newRide, ...prev]);
      setActiveRideId(newRide.id); setShowStartModal(false); setRideElapsedSec(0);
      go("driverActiveRide");
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => setRideElapsedSec(s => s + 1), 1000);
    } catch (e: any) { toast.error(e.message || "Could not start ride."); }
  };

  const endRide = async () => {
    if (!activeRideId || !driver) return;
    if (tickRef.current) clearInterval(tickRef.current);
    const ride = rides.find(r => r.id === activeRideId);
    if (!ride) return;
    const durationMin = Math.max(1, Math.round(rideElapsedSec / 60));
    const odometerEndKm = closingOdometerKm.trim() ? Number(closingOdometerKm) : undefined;
    const piggyContrib = ride.kind === "paid" ? piggyContribution(ride.fare || 0, driver.piggyPct) : undefined;
    const costAnalysis = ride.kind === "empty" ? analyzeEmptyRide(ride.distanceKm) : undefined;
    if (ride.kind === "empty") ride360Api.logAIUsage("empty_ride_analysis");
    try {
      const { ride: updatedRide, driver: updatedDriver } = await ride360Api.endRide(activeRideId, {
        durationMin, odometerEndKm, piggyContribution: piggyContrib, costAnalysis,
      });
      setDriver(updatedDriver);
      setRides(prev => prev.map(r => (r.id === activeRideId ? updatedRide : r)));
      if (ride.matchedRequestId) {
        setRequests(prev => prev.map(r => (r.id === ride.matchedRequestId ? { ...r, status: "completed" as const } : r)));
      }
      setShowResultsFor(activeRideId);
      setActiveRideId(null);
      setClosingOdometerKm("");
    } catch (e: any) { toast.error(e.message || "Could not end ride."); }
  };

  const startRideConnectRide = async (req: CustomerRequest) => {
    if (!driver) return;
    const distanceKm = haversineKm(req.pickup, req.drop);
    try {
      const newRide = await ride360Api.startRide({
        kind: "paid", provider: "rideconnect360", source: req.pickup, destination: req.drop,
        fare: req.currentAmount, distanceKm, matchedRequestId: req.id,
      });
      setRides(prev => [newRide, ...prev]);
      setActiveRideId(newRide.id); setRideElapsedSec(0);
      setFocusedThread(null);
      go("driverActiveRide");
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => setRideElapsedSec(s => s + 1), 1000);
    } catch (e: any) { toast.error(e.message || "Could not start ride."); }
  };

  const addFuelLog = async () => {
    if (!driver || !fuelLiters.trim() || !fuelCost.trim() || !fuelOdometer.trim()) return;
    try {
      const log = await ride360Api.addFuelLog({ date: fuelDate, liters: Number(fuelLiters), totalCost: Number(fuelCost), odometerKm: Number(fuelOdometer) });
      setFuelLogs(prev => [log, ...prev]);
      setFuelLiters(""); setFuelCost(""); setFuelOdometer("");
      setShowFuelModal(false);
    } catch (e: any) { toast.error(e.message || "Could not save fuel log."); }
  };

  const activeRide = rides.find(r => r.id === activeRideId);
  const resultRide = rides.find(r => r.id === showResultsFor);

  const driverFuelLogs = fuelLogs; // already scoped to the logged-in driver by the backend
  const driverStats = useMemo(
    () => (driver ? analyzeDriver(rides, driverFuelLogs, requests) : null),
    [driver, rides, driverFuelLogs, requests]
  );

  useEffect(() => {
    if (driver && view === "driverAnalysis") ride360Api.logAIUsage("ai_suggestions");
  }, [view, driver]);

  // Open pool of pending, unclaimed requests — fetched on demand when the
  // driver taps "Find Nearby Requests" after an empty run.
  const loadNearbyRequestPool = async () => {
    if (!resultRide) return;
    try {
      const pool = await ride360Api.listRequestPool();
      const origin = resultRide.destination;
      const withDist = pool
        .map(r => ({ ...r, distKm: haversineKm(origin, r.pickup) }))
        .sort((a, b) => (a.distKm ?? 0) - (b.distKm ?? 0))
        .slice(0, 8);
      setRequestPool(withDist);
    } catch { setRequestPool([]); }
  };
  const nearbyRequests = requestPool;

  const reachOut = async (reqId: string, originEmptyRideId?: string) => {
    if (!driver) return;
    try {
      const updated = await ride360Api.reachOut(reqId, originEmptyRideId);
      setRequests(prev => [updated, ...prev.filter(r => r.id !== reqId)]);
      setRequestPool(prev => prev.filter(r => r.id !== reqId));
      toast.success("Reached out!");
    } catch (e: any) { toast.error(e.message || "Could not reach out."); }
  };

  const demoConfirm = async (reqId: string, status: "confirmed" | "rejected") => {
    try {
      const updated = await ride360Api.setRequestStatus(reqId, status);
      setRequests(prev => prev.map(r => (r.id === reqId ? updated : r)));
      setFocusedThread(prev => (prev && prev.id === reqId ? updated : prev));
    } catch (e: any) { toast.error(e.message || "Could not update status."); }
  };

  const sendThreadMessage = async (_from: "driver" | "customer") => {
    if (!focusedThread || !threadMsg.trim()) return;
    const text = threadMsg.trim();
    setThreadMsg("");
    try {
      const updated = await ride360Api.sendMessage(focusedThread.id, text);
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setFocusedThread(updated);
    } catch (e: any) { toast.error(e.message || "Could not send message."); }
  };

  const proposePrice = async (_from: "driver" | "customer") => {
    if (!focusedThread || !proposeAmount.trim()) return;
    const amount = Number(proposeAmount);
    setProposeAmount("");
    try {
      const updated = await ride360Api.sendMessage(focusedThread.id, undefined, amount);
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setFocusedThread(updated);
    } catch (e: any) { toast.error(e.message || "Could not propose price."); }
  };

  // ── Customer request ─────────────────────────────────────────────────────
  const submitRequest = async () => {
    if (!customer || !pickup || !drop || !reqDesc.trim() || !reqAmount) return;
    if (!isLocationInIndia(pickup.lat, pickup.lng) || !isLocationInIndia(drop.lat, drop.lng)) {
      toast.error("Pickup and drop locations must be in India.");
      return;
    }
    const amount = Number(reqAmount);
    try {
      const req = await ride360Api.createRequest({
        type: reqType, pickup, drop, description: reqDesc.trim(), offeredAmount: amount,
        targetDriverId: targetDriverRide?.driverId, originEmptyRideId: targetDriverRide?.id,
      });
      setRequests(prev => [req, ...prev]);
      setPickup(null); setDrop(null); setReqDesc(""); setReqAmount(""); setTargetDriverRide(null); setTargetDriverInfo(null);
      go("customerMyRequests");
    } catch (e: any) { toast.error(e.message || "Could not submit request."); }
  };

  const myRequests = requests;
  const driverThreads = requests;

  // Drivers currently running empty, fetched on demand when a customer opens Nearby Drivers.
  const loadNearbyDrivers = async () => {
    try { setNearbyDriversRaw(await ride360Api.listNearbyDrivers()); } catch { setNearbyDriversRaw([]); }
  };
  useEffect(() => {
    if (view === "customerNearbyDrivers" && customer) loadNearbyDrivers();
  }, [view, customer]);

  const nearbyDrivers = useMemo(() => {
    if (!currentLoc) return [];
    return nearbyDriversRaw
      .map(({ ride, driver: info }) => {
        const pos = ride.liveLat != null && ride.liveLng != null ? { lat: ride.liveLat, lng: ride.liveLng } : ride.source;
        return { ride, info, pos, distKm: haversineKm(currentLoc, pos) };
      })
      .filter(x => x.distKm <= nearbyRangeKm)
      .filter(x => vehicleFilter === "all" || x.info.vehicleType === vehicleFilter)
      .sort((a, b) => a.distKm - b.distKm);
  }, [nearbyDriversRaw, currentLoc, vehicleFilter, nearbyRangeKm]);

  const fmtTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => go(driver ? "driverDashboard" : customer ? "customerHome" : "landing")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center"><Car size={16} className="text-white" /></div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-sm leading-none">Ride360</p>
              <p className="text-[9px] text-amber-600 font-semibold leading-none mt-1">Track. Match. Save.</p>
            </div>
          </button>
          {driver && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => go("driverDashboard")} className={`hover:text-amber-600 transition ${view === "driverDashboard" || view === "driverActiveRide" ? "text-amber-600 font-bold" : ""}`}>Dashboard</button>
              <button onClick={() => go("driverRequests")} className={`hover:text-amber-600 transition ${view === "driverRequests" ? "text-amber-600 font-bold" : ""}`}>Requests</button>
              <button onClick={() => go("driverAnalysis")} className={`hover:text-amber-600 transition ${view === "driverAnalysis" ? "text-amber-600 font-bold" : ""}`}>Fuel &amp; AI</button>
              <button onClick={() => go("driverProfile")} className={`hover:text-amber-600 transition ${view === "driverProfile" ? "text-amber-600 font-bold" : ""}`}>Profile</button>
            </div>
          )}
          {customer && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => go("customerHome")} className={`hover:text-amber-600 transition ${view === "customerHome" || view === "customerNewRequest" ? "text-amber-600 font-bold" : ""}`}>New Request</button>
              <button onClick={() => go("customerNearbyDrivers")} className={`hover:text-amber-600 transition ${view === "customerNearbyDrivers" ? "text-amber-600 font-bold" : ""}`}>Nearby Drivers</button>
              <button onClick={() => go("customerMyRequests")} className={`hover:text-amber-600 transition ${view === "customerMyRequests" ? "text-amber-600 font-bold" : ""}`}>My Requests</button>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {(driver || customer) ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifPanel(v => !v); if (!showNotifPanel) markNotificationsRead(); }}
                    className="relative p-2 text-gray-400 hover:text-amber-600 transition"
                  >
                    <Bell size={17} />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                    )}
                  </button>
                  {showNotifPanel && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl z-40">
                      <div className="p-3 border-b border-gray-100 font-black text-gray-900 text-sm">Notifications</div>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">No notifications yet.</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.slice(0, 20).map(n => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setShowNotifPanel(false);
                                if (n.requestId) {
                                  const req = requests.find(r => r.id === n.requestId);
                                  if (req) setFocusedThread(req);
                                }
                              }}
                              className="w-full text-left p-3 hover:bg-gray-50 transition text-xs text-gray-700"
                            >
                              {n.text}
                              <span className="block text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm">
                  {driver ? driver.name[0] : customer?.phone.slice(-2)}
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut size={16} /></button>
              </>
            ) : (
              <button onClick={() => go("onboarding")} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition">Get Started</button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Location bar ── */}
      {(driver || customer) && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-2 text-xs">
          <MapPin size={13} className="text-amber-600 shrink-0" />
          <span className="text-amber-900 font-medium truncate max-w-xs sm:max-w-md">{currentLocLabel}</span>
          <button onClick={() => { setLocationPick(currentLoc ? { ...currentLoc, address: currentLocLabel } : null); setShowLocationModal(true); }} className="text-amber-700 font-bold hover:underline shrink-0">Change</button>
        </div>
      )}

      {/* ── Change location modal ── */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowLocationModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base">Set Your Location</h3>
              <button onClick={() => setShowLocationModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <LocationPicker label="Search for your location" placeholder="Area, street, landmark…" value={locationPick} onChange={applyLocationPick} allowCurrentLocation />
            <button onClick={useDeviceLocationNow} className="w-full flex items-center justify-center gap-2 border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-sm py-2.5 rounded-xl transition">
              <Navigation size={14} /> Use My Device's Current Location
            </button>
          </div>
        </div>
      )}

      {/* ── Invite Friends/Drivers modal ── */}
      {showInviteModal && (driver || customer) && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Share2 size={15} className="text-amber-600" /> {driver ? "Invite Drivers" : "Invite Friends"}</span>
              <button onClick={() => setShowInviteModal(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-amber-600">{inviteCount}</p>
                <p className="text-xs text-amber-700 mt-0.5">Invites sent so far</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Your invite link</p>
                <div className="flex gap-2">
                  <input value={inviteRefLink} readOnly className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 focus:outline-none" />
                  <button onClick={copyInviteLink} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition border ${inviteCopied ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>
                    {inviteCopied ? <><CheckCircle size={12} />Copied!</> : <><Copy size={12} />Copy</>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={shareInviteWhatsApp} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 transition">
                  <MessageCircle size={15} />WhatsApp
                </button>
                <button onClick={copyInviteLink} className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                  <Copy size={15} />Copy Link
                </button>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Or send by email</p>
                <div className="flex gap-2">
                  <input value={inviteEmailTo} onChange={e => setInviteEmailTo(e.target.value)} placeholder="friend@email.com" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400" />
                  <button onClick={sendInviteEmail} disabled={!inviteEmailTo.trim()} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition ${inviteEmailSent ? "bg-emerald-100 text-emerald-600" : "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40"}`}>
                    {inviteEmailSent ? "Sent!" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ LANDING ══════════════════════ */}
      {view === "landing" && (
        <>
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white">
            <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/20">
                <Zap size={12} className="text-yellow-200" /> For Auto, Cab & Transport Drivers
              </div>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                Track Every Ride.<br /><span className="text-yellow-200">Beat Every Empty Km.</span>
              </h1>
              <p className="text-amber-50 text-sm sm:text-base max-w-xl mx-auto mb-8">
                Log Self, Ola & Uber rides with live map tracking, get AI cost tips on empty runs, match with nearby ride or parcel requests, and auto-save a slice of every fare.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => { setRole("driver"); go("onboarding"); }} className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition">
                  I'm a Driver <ArrowRight size={16} />
                </button>
                <button onClick={() => { setRole("customer"); go("auth"); }} className="border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl transition">
                  I Need a Ride / Courier
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ONBOARDING.map(o => {
                const Icon = o.icon;
                return (
                  <div key={o.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4 text-amber-600"><Icon size={20} /></div>
                    <h3 className="font-black text-gray-900 text-sm mb-1.5">{o.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{o.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="bg-gray-900 text-white py-10">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center"><Car size={16} className="text-white" /></div>
                <div><p className="font-black text-sm">Ride360</p><p className="text-gray-400 text-xs">Track. Match. Save.</p></div>
              </div>
              <Link href="/" className="text-amber-400 hover:text-white transition text-xs">← Back to DemandGeniusAI</Link>
            </div>
          </footer>
        </>
      )}

      {/* ══════════════════════ ONBOARDING ══════════════════════ */}
      {view === "onboarding" && (
        <div className="min-h-[calc(100vh-61px)] bg-gray-900 text-white flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="flex gap-1.5 mb-8">
              {ONBOARDING.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i === onboardStep ? "bg-amber-400" : "bg-white/20"}`} />)}
            </div>
            {(() => { const Icon = ONBOARDING[onboardStep].icon; return <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 text-amber-300"><Icon size={30} /></div>; })()}
            <h2 className="text-2xl font-black mb-3">{ONBOARDING[onboardStep].title}</h2>
            <p className="text-white/60 text-sm mb-10">{ONBOARDING[onboardStep].desc}</p>
            <button onClick={() => { if (onboardStep < 2) setOnboardStep(s => s + 1); else { setRole("driver"); go("auth"); } }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl text-sm transition">
              {onboardStep < 2 ? "Next" : "Get Started"}
            </button>
            <button onClick={() => { setRole("driver"); go("auth"); }} className="w-full text-center text-white/40 hover:text-white/70 text-xs mt-4 transition">Skip</button>
          </div>
        </div>
      )}

      {/* ══════════════════════ AUTH ══════════════════════ */}
      {view === "auth" && (
        <div className="min-h-[calc(100vh-61px)] bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">Welcome to Ride360</h2>
              <button onClick={() => go("landing")} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(["driver", "customer"] as const).map(r => (
                <button key={r} onClick={() => { setRole(r); setAuthErr(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${role === r ? "bg-white text-amber-700 shadow" : "text-gray-500"}`}>
                  {r === "driver" ? "Driver" : "Customer"}
                </button>
              ))}
            </div>

            {role === "driver" && (
              <>
                <div className="flex bg-gray-50 rounded-xl p-1">
                  {(["register", "login"] as const).map(t => (
                    <button key={t} onClick={() => { setAuthTab(t); setAuthErr(""); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${authTab === t ? "bg-white text-amber-700 shadow" : "text-gray-400"}`}>
                      {t === "register" ? "Create Account" : "Sign In"}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {authTab === "register" && (
                    <>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                      <select value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400">
                        <option value="auto">Auto Rickshaw</option>
                        <option value="cab">Cab</option>
                        <option value="transport">Transport / Goods Vehicle</option>
                        <option value="bike">Bike / Two-Wheeler</option>
                      </select>
                    </>
                  )}
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  {authTab === "login" && <button className="text-xs text-amber-600 font-bold hover:underline">Forgot password?</button>}
                </div>
                {authErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>}
                <button onClick={authTab === "register" ? handleDriverRegister : handleDriverLogin}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  <CheckCircle size={15} /> {authTab === "register" ? "Create Account" : "Sign In"}
                </button>
                <div className="flex items-center gap-3"><div className="h-px flex-1 bg-gray-200" /><span className="text-[10px] text-gray-400">OR CONTINUE WITH</span><div className="h-px flex-1 bg-gray-200" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSocialLogin("google")} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2.5 rounded-xl transition">
                    <span className="text-red-500 font-black">G</span> Google
                  </button>
                  <button onClick={() => handleSocialLogin("linkedin")} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2.5 rounded-xl transition">
                    <span className="text-blue-600 font-black">in</span> LinkedIn
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400">Social login is simulated in this preview — no real Google/LinkedIn account is used.</p>
              </>
            )}

            {role === "customer" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">No profile needed — just verify your number and start requesting a ride or courier.</p>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-amber-400">
                  <Phone size={14} className="text-gray-400" />
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="flex-1 text-sm outline-none" disabled={otpSent} />
                </div>
                {otpSent && (
                  <>
                    <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Demo mode — no SMS is sent. Your code is pre-filled below; just tap Verify.
                    </p>
                    <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter OTP" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                  </>
                )}
                {authErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>}
                {!otpSent ? (
                  <button onClick={handleSendOtp} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition">Send OTP</button>
                ) : (
                  <button onClick={handleVerifyOtp} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition">Verify &amp; Continue</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER PROFILE SETUP ══════════════════════ */}
      {view === "driverProfileSetup" && driver && (
        <div className="min-h-[calc(100vh-61px)] bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="font-black text-gray-900 text-lg">Complete Your Driver Profile</h2>
              <p className="text-xs text-gray-500 mt-1">Vehicle and license details are required before you can start tracking rides.</p>
            </div>
            <div className="space-y-3">
              <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="Vehicle / Auto Number (e.g. KA05 AB 1234)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value.toUpperCase())} placeholder="Driving License Number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">License Expiry</label>
                <input type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                  <span>Auto-save into Piggy</span><span className="text-amber-600">{piggyPct}% of every fare</span>
                </label>
                <input type="range" min={0} max={30} value={piggyPct} onChange={e => setPiggyPct(Number(e.target.value))} className="w-full mt-2 accent-amber-500" />
              </div>
            </div>
            {authErr && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authErr}</p>}
            <button onClick={saveProfileSetup} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
              <ShieldCheck size={15} /> Save &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER DASHBOARD ══════════════════════ */}
      {view === "driverDashboard" && driver && (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Welcome back, {driver.name.split(" ")[0]}</h2>
              <p className="text-sm text-gray-500">{driver.vehicleType} · {driver.vehicleNumber || "no vehicle number set"}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFuelModal(true)} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition">
                <Fuel size={15} className="text-amber-500" /> Log Fuel
              </button>
              <button onClick={() => setShowStartModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">
                <Play size={15} /> Start a Ride
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piggy Balance</span><PiggyBank size={16} className="text-amber-500" /></div>
              <p className="text-2xl font-black text-gray-900">₹{driver.piggyBalance.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 mt-1">{driver.piggyPct}% auto-saved per fare</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rides Logged</span><Car size={16} className="text-amber-500" /></div>
              <p className="text-2xl font-black text-gray-900">{rides.filter(r => r.driverId === driver.id).length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Open Requests</span><MessageSquare size={16} className="text-amber-500" /></div>
              <p className="text-2xl font-black text-gray-900">{driverThreads.filter(r => r.status === "pending").length}</p>
            </div>
          </div>

          <button onClick={() => go("driverAnalysis")} className="w-full bg-white border border-gray-200 hover:border-amber-300 hover:shadow-sm rounded-2xl p-4 flex items-center justify-between transition-all">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><Sparkles size={16} className="text-amber-500" /> AI Analysis — fuel, mileage &amp; empty-run performance</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Navigation size={14} className="text-amber-500" /> Your Location</h3>
              <button onClick={() => { setLocationPick(currentLoc ? { ...currentLoc, address: currentLocLabel } : null); setShowLocationModal(true); }} className="text-xs font-bold text-amber-600 hover:underline">Change</button>
            </div>
            <p className="text-xs text-gray-500 mb-2 truncate">{currentLocLabel}</p>
            <RideMap current={currentLoc} height="240px" />
          </div>

          <div>
            <h3 className="font-black text-gray-900 mb-3">Recent Rides</h3>
            {rides.filter(r => r.driverId === driver.id).length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-400">No rides logged yet. Tap "Start a Ride" above.</div>
            ) : (
              <div className="space-y-2">
                {rides.filter(r => r.driverId === driver.id).slice(0, 6).map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.source.address.split(",")[0]} → {r.destination.address.split(",")[0]}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.kind === "paid" ? `${PROVIDER_LABEL[r.provider || "self"]} · ₹${r.fare}` : "Empty run"} · {r.distanceKm.toFixed(1)} km{r.odometerEndKm ? ` · odo ${r.odometerEndKm.toLocaleString("en-IN")} km` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${r.status === "active" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Start Ride modal ── */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowStartModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-lg">Start a Ride</h3>
                <button onClick={() => setShowStartModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["paid", "empty"] as const).map(k => (
                  <button key={k} onClick={() => setRideKind(k)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${rideKind === k ? "bg-white text-amber-700 shadow" : "text-gray-500"}`}>
                    {k === "paid" ? "Paid Ride" : "Empty Run"}
                  </button>
                ))}
              </div>
              {rideKind === "paid" && (
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Provider</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["self", "ola", "uber"] as RideProvider[]).map(p => (
                      <button key={p} onClick={() => setProvider(p)} className={`py-2 rounded-lg text-xs font-bold border-2 capitalize transition ${provider === p ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500"}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}
              <LocationPicker label="Source" placeholder="Pickup location" value={source} onChange={p => { setSource(p); if (destination && rideKind === "paid") setFare(estimateFare(haversineKm(p, destination))); }} allowCurrentLocation />
              <LocationPicker label="Destination" placeholder="Where are you headed" value={destination} onChange={p => { setDestination(p); if (source && rideKind === "paid") setFare(estimateFare(haversineKm(source, p))); }} />
              {rideKind === "paid" && (
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Fare (₹)</label>
                  <input type="number" value={fare} onChange={e => setFare(Number(e.target.value))} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
                </div>
              )}
              {source && destination && (
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 flex items-center justify-between">
                  <span>Estimated distance</span><span className="font-bold text-gray-900">{haversineKm(source, destination).toFixed(1)} km</span>
                </div>
              )}
              <button onClick={startRide} disabled={!source || !destination}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                <Play size={15} /> Start Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ ACTIVE RIDE ══════════════════════ */}
      {view === "driverActiveRide" && activeRide && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${activeRide.kind === "paid" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                  {activeRide.kind === "paid" ? `Paid Ride · ${PROVIDER_LABEL[activeRide.provider || "self"]}` : "Empty Run"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-2xl font-black text-gray-900"><Clock size={20} className="text-amber-500" />{fmtTime(rideElapsedSec)}</div>
            </div>
            <RideMap current={currentLoc} source={activeRide.source} destination={activeRide.destination} height="280px" />
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div><p className="text-[10px] font-black text-gray-400 uppercase">From</p><p className="text-gray-900 font-medium truncate">{activeRide.source.address.split(",")[0]}</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">To</p><p className="text-gray-900 font-medium truncate">{activeRide.destination.address.split(",")[0]}</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">Distance</p><p className="text-gray-900 font-bold">{activeRide.distanceKm.toFixed(1)} km</p></div>
              {activeRide.kind === "paid" && <div><p className="text-[10px] font-black text-gray-400 uppercase">Fare</p><p className="text-gray-900 font-bold">₹{activeRide.fare}</p></div>}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5"><Gauge size={13} className="text-amber-500" /> Closing Odometer (km) — optional</label>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-2">Mark your actual odometer reading for accurate mileage tracking — the distance above is a GPS estimate, not the real road distance.</p>
            <input type="number" value={closingOdometerKm} onChange={e => setClosingOdometerKm(e.target.value)} placeholder="e.g. 48213" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <button onClick={endRide} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl text-sm transition">
            <Square size={15} /> End Ride
          </button>
        </div>
      )}

      {/* ── Ride result modal ── */}
      {resultRide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => { setShowResultsFor(null); setNearbyOpen(false); go("driverDashboard"); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              {resultRide.kind === "paid" ? (
                <>
                  <div className="text-center">
                    <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                    <h3 className="font-black text-gray-900 text-lg">Ride Complete</h3>
                    <p className="text-sm text-gray-500 mt-1">{resultRide.distanceKm.toFixed(1)} km · {resultRide.durationMin} min · ₹{resultRide.fare}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><PiggyBank size={18} className="text-amber-600" /><span className="text-sm font-bold text-amber-800">Added to Piggy</span></div>
                    <span className="text-lg font-black text-amber-700">+₹{resultRide.piggyContribution}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <Zap size={40} className="text-orange-500 mx-auto mb-3" />
                    <h3 className="font-black text-gray-900 text-lg">Empty Run — AI Cost Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-black text-gray-400 uppercase">Fuel Cost</p><p className="text-lg font-black text-gray-900">₹{resultRide.costAnalysis?.fuelCost}</p></div>
                    <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-black text-gray-400 uppercase">Lost Fare Potential</p><p className="text-lg font-black text-gray-900">₹{resultRide.costAnalysis?.opportunityCost}</p></div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">{resultRide.costAnalysis?.tip}</div>
                  {!nearbyOpen ? (
                    <button onClick={() => { setNearbyOpen(true); loadNearbyRequestPool(); }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition">Find Nearby Requests</button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nearby Requests</p>
                      {nearbyRequests.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No pending requests near your route right now.</p>
                      ) : nearbyRequests.map((r: any) => (
                        <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {r.type === "parcel" ? <Package size={12} className="text-gray-400" /> : <Car size={12} className="text-gray-400" />}
                                <span className="text-xs font-bold text-gray-900 capitalize">{r.type}</span>
                                <span className="text-[10px] text-gray-400">· {r.distKm.toFixed(1)} km away</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 truncate">{r.pickup.address.split(",")[0]} → {r.drop.address.split(",")[0]}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{r.description}</p>
                            </div>
                            <span className="text-sm font-black text-amber-600 shrink-0">₹{r.offeredAmount}</span>
                          </div>
                          <button onClick={() => reachOut(r.id, resultRide?.id)} className="mt-2 w-full text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 py-2 rounded-lg transition">Reach Out to Customer</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <button onClick={() => { setShowResultsFor(null); setNearbyOpen(false); go("driverDashboard"); }} className="w-full text-center text-xs text-gray-400 hover:text-gray-600">Back to Dashboard</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ DRIVER REQUESTS ══════════════════════ */}
      {view === "driverRequests" && driver && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <h2 className="text-xl font-black text-gray-900">Your Requests</h2>
          {driverThreads.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-400">You haven't reached out to any requests yet — find them from an empty run summary.</div>
          ) : (
            <div className="space-y-2">
              {driverThreads.map(r => (
                <button key={r.id} onClick={() => setFocusedThread(r)} className="w-full text-left bg-white border border-gray-200 hover:border-amber-300 rounded-2xl p-4 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.type === "parcel" ? <Package size={13} className="text-gray-400" /> : <Car size={13} className="text-gray-400" />}
                        <p className="text-sm font-bold text-gray-900 truncate">{r.pickup.address.split(",")[0]} → {r.drop.address.split(",")[0]}</p>
                        {r.contactInitiatedBy === "customer" && <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full shrink-0">Customer reached out</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{r.description} · ₹{r.currentAmount}{r.currentAmount !== r.offeredAmount ? ` (was ₹${r.offeredAmount})` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${REQ_STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ DRIVER PROFILE ══════════════════════ */}
      {view === "driverProfile" && driver && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <h2 className="text-xl font-black text-gray-900">Profile</h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">{driver.name[0]}</div>
              <div><p className="font-black text-gray-900">{driver.name}</p><p className="text-sm text-gray-500">{driver.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-[10px] font-black text-gray-400 uppercase">Vehicle Type</p><p className="text-gray-900 font-medium capitalize">{driver.vehicleType}</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">Vehicle Number</p><p className="text-gray-900 font-medium">{driver.vehicleNumber || "—"}</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">License Number</p><p className="text-gray-900 font-medium">{driver.licenseNumber || "—"}</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">License Expiry</p><p className="text-gray-900 font-medium">{driver.licenseExpiry || "—"}</p></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2"><PiggyBank size={16} className="text-amber-500" /> Piggy Savings</h3>
            <p className="text-3xl font-black text-gray-900">₹{driver.piggyBalance.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{driver.piggyPct}% auto-saved from every paid fare</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-black text-green-900 mb-1.5 flex items-center gap-2"><MessageCircle size={16} className="text-green-600" /> Invite Other Drivers</h3>
            <p className="text-xs text-green-700 mb-3">Know another auto/cab/transport driver? Share Ride360 with them.</p>
            <button onClick={() => setShowInviteModal(true)} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition">
              <Share2 size={15} /> Invite Drivers
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-bold px-4 py-2.5 rounded-xl transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      {/* ══════════════════════ FUEL & AI ANALYSIS ══════════════════════ */}
      {view === "driverAnalysis" && driver && driverStats && (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" /> Fuel &amp; AI Analysis</h2>
            <button onClick={() => setShowFuelModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
              <Plus size={14} /> Log Fuel Fill-up
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid Rides</p>
              <p className="text-xl font-black text-gray-900 mt-1">{driverStats.ridesPaidCount}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empty Runs</p>
              <p className="text-xl font-black text-gray-900 mt-1">{driverStats.ridesEmptyCount}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fare Earned</p>
              <p className="text-xl font-black text-gray-900 mt-1">₹{driverStats.totalFareEarned.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piggy Saved</p>
              <p className="text-xl font-black text-gray-900 mt-1">₹{driverStats.totalPiggySaved.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2"><Gauge size={14} className="text-amber-500" /> Mileage</h3>
            {driverStats.avgMileageKmPerL !== null ? (
              <>
                <p className="text-2xl font-black text-gray-900">{driverStats.avgMileageKmPerL.toFixed(1)} km/L</p>
                <p className="text-xs text-gray-400 mt-1">
                  {driverStats.mileageSource === "odometer"
                    ? "Calculated from odometer readings between fuel fill-ups — the real figure."
                    : "Estimated from GPS ride distance ÷ fuel logged — log two fill-ups with odometer readings for the real figure."}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Log at least one fuel fill-up to see mileage here.</p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
              <div><p className="text-[10px] font-black text-gray-400 uppercase">Fuel Logged</p><p className="text-gray-900 font-bold">{driverStats.totalFuelLiters.toFixed(1)} L</p></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase">Fuel Cost</p><p className="text-gray-900 font-bold">₹{driverStats.totalFuelCost.toLocaleString("en-IN")}</p></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Empty-Run Conversion (RideConnect360)</h3>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-black text-gray-900">{driverStats.conversionRatePct}%</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{driverStats.emptyRidesConverted} of {driverStats.emptyRidesTotal} empty runs encashed</p>
              </div>
              <div className="h-10 border-l border-gray-100" />
              <div>
                <p className="text-2xl font-black text-gray-900">₹{driverStats.rideConnectEarnings.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Earned via matched RideConnect360 rides</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-black text-amber-900 text-sm mb-3 flex items-center gap-2"><Sparkles size={14} /> AI Suggestions</h3>
            <ul className="space-y-2">
              {driverStats.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-2"><ChevronRight size={13} className="shrink-0 mt-0.5" /><span>{s}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2"><Fuel size={15} className="text-amber-500" /> Fuel Log</h3>
            {driverFuelLogs.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-400">No fuel fill-ups logged yet.</div>
            ) : (
              <div className="space-y-2">
                {driverFuelLogs.slice(0, 10).map(f => (
                  <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{f.liters.toFixed(1)} L · ₹{f.totalCost.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.date} · odo {f.odometerKm.toLocaleString("en-IN")} km</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Log Fuel modal ── */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowFuelModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Fuel size={16} className="text-amber-500" /> Log Fuel Fill-up</h3>
              <button onClick={() => setShowFuelModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Date</label>
              <input type="date" value={fuelDate} onChange={e => setFuelDate(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Liters</label>
                <input type="number" value={fuelLiters} onChange={e => setFuelLiters(e.target.value)} placeholder="e.g. 4.5" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Cost (₹)</label>
                <input type="number" value={fuelCost} onChange={e => setFuelCost(e.target.value)} placeholder="e.g. 432" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5"><Gauge size={13} className="text-amber-500" /> Odometer Reading (km)</label>
              <input type="number" value={fuelOdometer} onChange={e => setFuelOdometer(e.target.value)} placeholder="e.g. 48213" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
              <p className="text-[11px] text-gray-400 mt-1">Used to calculate real mileage between fill-ups — more accurate than GPS distance.</p>
            </div>
            <button onClick={addFuelLog} disabled={!fuelLiters.trim() || !fuelCost.trim() || !fuelOdometer.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition">
              Save Fill-up
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════ CUSTOMER HOME / NEW REQUEST ══════════════════════ */}
      {(view === "customerHome" || view === "customerNewRequest") && customer && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">{targetDriverRide ? "Reach out to this driver" : "Need a ride or send a package?"}</h2>
            <p className="text-sm text-gray-500">{targetDriverRide ? "This goes straight to the driver you picked — they'll see it as a direct outreach." : "Describe what you need — nearby drivers running empty will reach out."}</p>
          </div>
          {targetDriverRide && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-sky-800">
                <Radar size={15} className="text-sky-600 shrink-0" />
                <span>Reaching out to <b>{targetDriverInfo?.name || "this driver"}</b> ({targetDriverInfo?.vehicleType})</span>
              </div>
              <button onClick={() => { setTargetDriverRide(null); setTargetDriverInfo(null); }} className="text-xs font-bold text-sky-700 hover:underline shrink-0">Cancel</button>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(["ride", "parcel"] as const).map(t => (
                <button key={t} onClick={() => setReqType(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition ${reqType === t ? "bg-white text-amber-700 shadow" : "text-gray-500"}`}>{t}</button>
              ))}
            </div>
            <LocationPicker label="Pickup" placeholder="Where should the driver pick up from" value={pickup} onChange={setPickup} allowCurrentLocation />
            <LocationPicker label="Drop" placeholder="Destination" value={drop} onChange={setDrop} />
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</label>
              <textarea value={reqDesc} onChange={e => setReqDesc(e.target.value)} rows={3} placeholder={reqType === "ride" ? "e.g. 2 passengers, need AC cab" : "e.g. small box, fragile, needs care"} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Offered Amount (₹)</label>
              <input type="number" value={reqAmount} onChange={e => setReqAmount(e.target.value)} placeholder="150" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <button onClick={submitRequest} disabled={!pickup || !drop || !reqDesc.trim() || !reqAmount}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition">
              Post Request
            </button>
          </div>
          {!targetDriverRide && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h3 className="font-black text-green-900 mb-1.5 flex items-center gap-2 text-sm"><MessageCircle size={15} className="text-green-600" /> Know someone who needs a ride?</h3>
              <p className="text-xs text-green-700 mb-3">Share Ride360 with friends and family.</p>
              <button onClick={() => setShowInviteModal(true)} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition">
                <Share2 size={15} /> Invite Friends
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ CUSTOMER NEARBY DRIVERS ══════════════════════ */}
      {view === "customerNearbyDrivers" && customer && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Radar size={18} className="text-amber-500" /> Nearby Drivers</h2>
            <p className="text-sm text-gray-500 mt-1">Drivers currently running empty within {nearbyRangeKm} km — reach out directly instead of waiting.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setVehicleFilter("all")} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${vehicleFilter === "all" ? "bg-amber-500 border-amber-500 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>All</button>
            {(["auto", "cab", "transport", "bike"] as VehicleType[]).map(vt => {
              const Icon = VEHICLE_FILTER_ICON[vt];
              return (
                <button key={vt} onClick={() => setVehicleFilter(vt)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border capitalize transition ${vehicleFilter === vt ? "bg-amber-500 border-amber-500 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  <Icon size={12} /> {vt}
                </button>
              );
            })}
          </div>

          {/* Search range slider */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span>Search Range</span>
              <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">{nearbyRangeKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={nearbyRangeKm}
              onChange={(e) => setNearbyRangeKm(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
              <span>1 km</span>
              <span>13 km</span>
              <span>25 km</span>
            </div>
          </div>

          <RideMap
            current={currentLoc}
            height="280px"
            rangeKm={nearbyRangeKm}
            markers={nearbyDrivers.map(({ ride, info, pos }) => ({ id: ride.id, lat: pos.lat, lng: pos.lng, label: `${info.name} · ${info.vehicleType} · ${info.vehicleNumber || "no vehicle number"}` }))}
          />

          {nearbyDrivers.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-400">No {vehicleFilter === "all" ? "" : vehicleFilter + " "}drivers running empty within {nearbyRangeKm} km right now. Post a request instead and one will find you.</div>
          ) : (
            <div className="space-y-2">
              {nearbyDrivers.map(({ ride, info, distKm }) => (
                <div key={ride.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black shrink-0">{info.name[0]}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{info.name} · <span className="capitalize text-gray-500 font-medium">{info.vehicleType}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">{distKm.toFixed(1)} km away · {info.vehicleNumber || "no vehicle number"}</p>
                    </div>
                  </div>
                  <button onClick={() => { setTargetDriverRide(ride); setTargetDriverInfo({ name: info.name, vehicleType: info.vehicleType }); go("customerNewRequest"); }} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition">Reach Out</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ CUSTOMER MY REQUESTS ══════════════════════ */}
      {view === "customerMyRequests" && customer && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <h2 className="text-xl font-black text-gray-900">My Requests</h2>
          {myRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-sm text-gray-400">
              No requests yet. <button onClick={() => go("customerHome")} className="text-amber-600 font-bold hover:underline">Post one now →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {myRequests.map(r => (
                <button key={r.id} onClick={() => setFocusedThread(r)} className="w-full text-left bg-white border border-gray-200 hover:border-amber-300 rounded-2xl p-4 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{r.pickup.address.split(",")[0]} → {r.drop.address.split(",")[0]}</p>
                        {r.contactInitiatedBy === "customer" && <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full shrink-0">You reached out</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{r.description} · ₹{r.currentAmount}{r.currentAmount !== r.offeredAmount ? ` (was ₹${r.offeredAmount})` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${REQ_STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Thread modal (shared driver/customer) ── */}
      {focusedThread && (() => {
        const canDecide = focusedThread.contactInitiatedBy === "driver" ? !!customer : !!driver;
        const closeThread = () => { setFocusedThread(null); setProposeAmount(""); setThreadMsg(""); };
        return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={closeThread}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-sm">{focusedThread.pickup.address.split(",")[0]} → {focusedThread.drop.address.split(",")[0]}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {focusedThread.description} · <span className="font-bold text-gray-600">₹{focusedThread.currentAmount}</span>
                  {focusedThread.currentAmount !== focusedThread.offeredAmount && <span className="line-through ml-1">₹{focusedThread.offeredAmount}</span>}
                </p>
              </div>
              <button onClick={closeThread} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
              {focusedThread.messages.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No messages yet.</p>}
              {focusedThread.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "driver" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.from === "driver" ? "bg-white border border-gray-200 text-gray-800 rounded-bl-sm" : "bg-amber-500 text-white rounded-br-sm"}`}>
                    {m.amount != null && <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide opacity-70 mb-0.5"><IndianRupee size={9} /> Price Proposal</span>}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-3">
              {focusedThread.status === "pending" && canDecide && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { demoConfirm(focusedThread.id, "rejected"); setFocusedThread({ ...focusedThread, status: "rejected" }); }} className="flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs py-2 rounded-xl transition"><XCircle size={13} /> Reject</button>
                  <button onClick={() => { demoConfirm(focusedThread.id, "confirmed"); setFocusedThread({ ...focusedThread, status: "confirmed" }); }} className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-xl transition"><CheckCircle size={13} /> Confirm</button>
                </div>
              )}
              {focusedThread.status === "pending" && !canDecide && (
                <p className="text-center text-[11px] text-gray-400">Waiting for {focusedThread.contactInitiatedBy === "driver" ? "the customer" : "the driver"} to respond…</p>
              )}
              {focusedThread.status === "confirmed" && driver && (
                <button onClick={() => startRideConnectRide(focusedThread)} className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl transition">
                  <Play size={13} /> Start RideConnect360 Ride · ₹{focusedThread.currentAmount}
                </button>
              )}
              {focusedThread.status !== "rejected" && focusedThread.status !== "completed" && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={proposeAmount} onChange={e => setProposeAmount(e.target.value)} placeholder="Propose new price" className="w-full border border-gray-200 rounded-xl pl-7 pr-2 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <button onClick={() => proposePrice(driver ? "driver" : "customer")} disabled={!proposeAmount.trim()} className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-bold px-3 rounded-xl transition shrink-0">Propose</button>
                </div>
              )}
              <div className="flex gap-2">
                <input value={threadMsg} onChange={e => setThreadMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendThreadMessage(driver ? "driver" : "customer")} placeholder="Add a comment…" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                <button onClick={() => sendThreadMessage(driver ? "driver" : "customer")} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 rounded-xl transition">Send</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
