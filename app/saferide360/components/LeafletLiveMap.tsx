"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMapProps } from "../lib/mapProvider";

const vehicleIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:30px;height:30px;background:#0d9488;border:3px solid white;border-radius:9999px;box-shadow:0 1px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;">🚐</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});
const stopDoneIcon = new L.DivIcon({
  className: "", html: `<div style="width:14px;height:14px;background:#16a34a;border:2px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(22,163,74,0.35)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});
const stopUpcomingIcon = new L.DivIcon({
  className: "", html: `<div style="width:14px;height:14px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(245,158,11,0.35)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

// This is the actual fix for "not showing the current location dynamically":
// react-leaflet's <MapContainer center=.../> only sets the INITIAL view —
// changing that prop on re-render does nothing, a well-known react-leaflet
// gotcha. Following a live-moving vehicle needs an imperative map.flyTo()
// call every time the position changes, which is what this component does.
function FollowVehicle({ position, autoFollow }: { position: [number, number] | null; autoFollow: boolean }) {
  const map = useMap();
  const firstFix = useRef(true);
  useEffect(() => {
    if (!position || !autoFollow) return;
    if (firstFix.current) {
      map.setView(position, 15);
      firstFix.current = false;
    } else {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [position?.[0], position?.[1], autoFollow, map]);
  return null;
}

export default function LeafletLiveMap({ driverPosition, driverLabel, stops, height = "320px", autoFollow = true }: LiveMapProps) {
  const vehiclePos: [number, number] | null = driverPosition ? [driverPosition.lat, driverPosition.lng] : null;
  const fallbackCenter: [number, number] = vehiclePos || (stops[0] ? [stops[0].lat, stops[0].lng] : [12.9716, 77.5946]);
  const routePoints: [number, number][] = stops.map(s => [s.lat, s.lng]);

  return (
    <div style={{ height }} className="relative z-0 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={fallbackCenter} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: "#0d9488", weight: 3, dashArray: "6 6" }} />}
        {stops.map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={s.state === "done" ? stopDoneIcon : stopUpcomingIcon}>
            <Popup>{s.name} — {s.state === "done" ? "Completed" : "Upcoming"}</Popup>
          </Marker>
        ))}
        {vehiclePos && (
          <Marker position={vehiclePos} icon={vehicleIcon}>
            <Popup>{driverLabel || "Vehicle"}</Popup>
          </Marker>
        )}
        <FollowVehicle position={vehiclePos} autoFollow={autoFollow} />
      </MapContainer>
    </div>
  );
}
