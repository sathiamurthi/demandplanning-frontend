"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "../lib/types";

// Bundlers break Leaflet's default marker icon URLs — point them at the CDN instead.
const greenIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  className: "hue-rotate-[90deg]",
});
const redIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const dotIcon = new L.DivIcon({
  className: "", html: `<div style="width:16px;height:16px;background:#0d9488;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(13,148,136,0.35)"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const driverIcon = new L.DivIcon({
  className: "", html: `<div style="width:28px;height:28px;background:#f59e0b;border:3px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:14px;">🚗</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 14); return; }
    map.fitBounds(points, { padding: [40, 40] });
  }, [JSON.stringify(points), map]);
  return null;
}

export interface MapDriverMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export default function RideMap({
  current, source, destination, height = "260px", markers, rangeKm,
}: {
  current?: { lat: number; lng: number } | null;
  source?: GeoPoint | null;
  destination?: GeoPoint | null;
  height?: string;
  markers?: MapDriverMarker[];
  rangeKm?: number; // draws a radius circle around `current` to visualize a search range
}) {
  const points: [number, number][] = [
    ...(current ? [[current.lat, current.lng] as [number, number]] : []),
    ...(source ? [[source.lat, source.lng] as [number, number]] : []),
    ...(destination ? [[destination.lat, destination.lng] as [number, number]] : []),
    ...((markers || []).map(m => [m.lat, m.lng] as [number, number])),
  ];
  const center: [number, number] = points[0] || [12.9716, 77.5946]; // Bengaluru fallback

  return (
    <div style={{ height }} className="relative z-0 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {current && rangeKm && <Circle center={[current.lat, current.lng]} radius={rangeKm * 1000} pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.08, weight: 1.5 }} />}
        {current && <Marker position={[current.lat, current.lng]} icon={dotIcon} />}
        {source && <Marker position={[source.lat, source.lng]} icon={greenIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={redIcon} />}
        {(markers || []).map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={driverIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {source && destination && (
          <Polyline positions={[[source.lat, source.lng], [destination.lat, destination.lng]]} pathOptions={{ color: "#0d9488", weight: 4, dashArray: "6 6" }} />
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
