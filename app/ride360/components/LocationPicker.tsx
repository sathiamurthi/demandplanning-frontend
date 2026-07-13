"use client";

import { useState, useRef } from "react";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import { searchAddress, reverseGeocode } from "../lib/geo";
import type { GeoPoint } from "../lib/types";

export default function LocationPicker({
  label, placeholder, value, onChange, allowCurrentLocation,
}: {
  label: string; placeholder: string; value: GeoPoint | null; onChange: (p: GeoPoint) => void; allowCurrentLocation?: boolean;
}) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (v: string) => {
    setQuery(v);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const r = await searchAddress(v);
      setResults(r);
      setLoading(false);
    }, 500);
  };

  const pick = (p: GeoPoint) => {
    onChange(p);
    setQuery(p.address);
    setResults([]);
    setOpen(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      pick({ lat: pos.coords.latitude, lng: pos.coords.longitude, address });
      setLoading(false);
    }, () => setLoading(false));
  };

  return (
    <div className="relative">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</label>
      <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-teal-400">
        <MapPin size={14} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none min-w-0"
        />
        {loading && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
        {allowCurrentLocation && (
          <button type="button" onClick={useCurrentLocation} className="text-teal-600 shrink-0" title="Use current location">
            <Crosshair size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-teal-50 border-b border-gray-50 last:border-0">
              {r.address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
