"use client";

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface TeaVehiclePin { id: string; vehicle_number: string; driver_name?: string; live_lat: number | string | null; live_lng: number | string | null; minutes_since_update?: number | null; }

const vehicleIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid white;border-radius:9999px;box-shadow:0 1px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">🚚</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

export default function TeaFleetMap({ vehicles, height = "420px" }: { vehicles: TeaVehiclePin[]; height?: string }) {
  const withPos = vehicles.filter(v => v.live_lat != null && v.live_lng != null);
  const center: [number, number] = withPos.length
    ? [Number(withPos[0].live_lat), Number(withPos[0].live_lng)]
    : [11.4064, 76.6932]; // Nilgiris default

  return (
    <div style={{ height }} className="relative z-0 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {withPos.map(v => (
          <Marker key={v.id} position={[Number(v.live_lat), Number(v.live_lng)]} icon={vehicleIcon}>
            <Tooltip permanent direction="top" offset={[0, -10]} className="!text-[10px] !font-bold">{v.vehicle_number}</Tooltip>
            <Popup>
              {v.vehicle_number} {v.driver_name ? `— ${v.driver_name}` : ""}
              <br />
              {v.minutes_since_update != null ? `Updated ${Math.round(v.minutes_since_update)} min ago` : ""}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withPos.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm pointer-events-none">
          No vehicles broadcasting a live position yet
        </div>
      )}
    </div>
  );
}
