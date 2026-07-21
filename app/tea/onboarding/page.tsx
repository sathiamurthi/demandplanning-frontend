"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Scale, Users, Truck, CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { teaAuthHeaders, teaUrl } from "@/lib/tea-api";

type GrowerDraft = { name: string; phone: string; land_acres: string };

const STEPS = ["Welcome", "Rates", "Growers", "Vehicle & Factory", "Done"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [rates, setRates] = useState({ grade_a_rate: "", grade_b_rate: "", grade_c_rate: "" });
  const [ratesSaved, setRatesSaved] = useState(false);

  const [growerDrafts, setGrowerDrafts] = useState<GrowerDraft[]>([{ name: "", phone: "", land_acres: "" }]);
  const [growersSaved, setGrowersSaved] = useState(0);

  const [factory, setFactory] = useState({ name: "", location: "", contact_name: "", contact_phone: "" });
  const [vehicle, setVehicle] = useState({ vehicle_number: "", driver_name: "", driver_phone: "" });
  const [factorySaved, setFactorySaved] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const finish = () => {
    localStorage.setItem("tea_onboarding_done", "1");
    router.push("/tea");
  };

  const saveRates = async () => {
    if (!rates.grade_a_rate) { next(); return; }
    setSaving(true);
    const r = await fetch(teaUrl("/rates"), {
      method: "POST", headers: teaAuthHeaders(),
      body: JSON.stringify({ ...rates, effective_date: new Date().toISOString().slice(0, 10), payment_mode: "full" }),
    });
    const d = await r.json();
    if (d.success) setRatesSaved(true);
    setSaving(false);
    next();
  };

  const addGrowerRow = () => setGrowerDrafts(d => [...d, { name: "", phone: "", land_acres: "" }]);
  const removeGrowerRow = (i: number) => setGrowerDrafts(d => d.filter((_, idx) => idx !== i));
  const updateGrowerRow = (i: number, field: keyof GrowerDraft, value: string) =>
    setGrowerDrafts(d => d.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const saveGrowers = async () => {
    const valid = growerDrafts.filter(g => g.name.trim());
    if (valid.length === 0) { next(); return; }
    setSaving(true);
    let count = 0;
    for (const g of valid) {
      const r = await fetch(teaUrl("/growers"), {
        method: "POST", headers: teaAuthHeaders(),
        body: JSON.stringify({ name: g.name, phone: g.phone || undefined, land_acres: g.land_acres ? parseFloat(g.land_acres) : undefined }),
      });
      const d = await r.json();
      if (d.success) count++;
    }
    setGrowersSaved(count);
    setSaving(false);
    next();
  };

  const saveVehicleAndFactory = async () => {
    setSaving(true);
    if (factory.name.trim()) {
      const r = await fetch(teaUrl("/factories"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(factory) });
      const d = await r.json();
      if (d.success) setFactorySaved(true);
    }
    if (vehicle.vehicle_number.trim()) {
      const r = await fetch(teaUrl("/vehicles"), { method: "POST", headers: teaAuthHeaders(), body: JSON.stringify(vehicle) });
      const d = await r.json();
      if (d.success) setVehicleSaved(true);
    }
    setSaving(false);
    next();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-emerald-500" : "bg-gray-200"}`} />
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
                <Leaf size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Welcome to TeaFactory360</h1>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Let's set up the basics — weekly rates, your growers, and your first vehicle & factory.
                Takes about 2 minutes, and every step can be skipped and done later from Settings.
              </p>
              <button onClick={next} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white px-6 py-3 rounded-xl text-sm font-semibold">
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1: Rates */}
          {step === 1 && (
            <div>
              <StepHeader icon={Scale} badgeClass="bg-blue-50 border-blue-100" iconClass="text-blue-600" title="This week's tea rates" desc="What you'll pay growers per kg, by grade. You can change this anytime in Settings." />
              <div className="grid grid-cols-3 gap-3 mb-6">
                <RateInput label="Grade A ₹/kg" value={rates.grade_a_rate} onChange={v => setRates({ ...rates, grade_a_rate: v })} />
                <RateInput label="Grade B ₹/kg" value={rates.grade_b_rate} onChange={v => setRates({ ...rates, grade_b_rate: v })} />
                <RateInput label="Grade C ₹/kg" value={rates.grade_c_rate} onChange={v => setRates({ ...rates, grade_c_rate: v })} />
              </div>
              <StepNav onBack={back} onNext={saveRates} saving={saving} nextLabel={rates.grade_a_rate ? "Save & Continue" : "Skip for now"} />
            </div>
          )}

          {/* Step 2: Growers */}
          {step === 2 && (
            <div>
              <StepHeader icon={Users} badgeClass="bg-green-50 border-green-100" iconClass="text-green-600" title="Add your first growers" desc="You can add more anytime from the Growers page." />
              <div className="space-y-2 mb-4">
                {growerDrafts.map((g, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="Name" value={g.name} onChange={e => updateGrowerRow(i, "name", e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
                    <input placeholder="Phone" value={g.phone} onChange={e => updateGrowerRow(i, "phone", e.target.value)}
                      className="w-32 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
                    <input placeholder="Acres" value={g.land_acres} onChange={e => updateGrowerRow(i, "land_acres", e.target.value)}
                      className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
                    {growerDrafts.length > 1 && (
                      <button onClick={() => removeGrowerRow(i)} className="text-gray-400 hover:text-red-600 px-2"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addGrowerRow} className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-medium mb-6">
                <Plus size={14} /> Add another grower
              </button>
              <StepNav onBack={back} onNext={saveGrowers} saving={saving} nextLabel={growerDrafts.some(g => g.name.trim()) ? "Save & Continue" : "Skip for now"} />
            </div>
          )}

          {/* Step 3: Vehicle & Factory */}
          {step === 3 && (
            <div>
              <StepHeader icon={Truck} badgeClass="bg-yellow-50 border-yellow-100" iconClass="text-yellow-600" title="Your first vehicle & factory" desc="Needed for dispatch and settlements. Add more later from Settings." />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Factory</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <input placeholder="Factory name" value={factory.name} onChange={e => setFactory({ ...factory, name: e.target.value })}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
                <input placeholder="Location" value={factory.location} onChange={e => setFactory({ ...factory, location: e.target.value })}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vehicle</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                <input placeholder="Vehicle number" value={vehicle.vehicle_number} onChange={e => setVehicle({ ...vehicle, vehicle_number: e.target.value })}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
                <input placeholder="Driver name" value={vehicle.driver_name} onChange={e => setVehicle({ ...vehicle, driver_name: e.target.value })}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
              </div>
              <StepNav onBack={back} onNext={saveVehicleAndFactory} saving={saving} nextLabel={(factory.name || vehicle.vehicle_number) ? "Save & Continue" : "Skip for now"} />
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">You're all set!</h1>
              <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-1.5">
                <p>{ratesSaved ? "✅" : "⏭️"} Weekly rates {ratesSaved ? "saved" : "skipped — set anytime in Settings"}</p>
                <p>{growersSaved > 0 ? "✅" : "⏭️"} {growersSaved > 0 ? `${growersSaved} grower${growersSaved > 1 ? "s" : ""} added` : "Growers skipped — add anytime"}</p>
                <p>{factorySaved ? "✅" : "⏭️"} Factory {factorySaved ? "added" : "skipped"}</p>
                <p>{vehicleSaved ? "✅" : "⏭️"} Vehicle {vehicleSaved ? "added" : "skipped"}</p>
              </div>
              <button onClick={finish} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors text-white px-6 py-3 rounded-xl text-sm font-semibold">
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {step > 0 && step < 4 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Step {step} of {STEPS.length - 2}
          </p>
        )}
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, badgeClass, iconClass, title, desc }: { icon: any; badgeClass: string; iconClass: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-10 h-10 border rounded-xl flex items-center justify-center shrink-0 ${badgeClass}`}>
        <Icon size={18} className={iconClass} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" />
    </div>
  );
}

function StepNav({ onBack, onNext, saving, nextLabel }: { onBack: () => void; onNext: () => void; saving: boolean; nextLabel: string }) {
  return (
    <div className="flex gap-3">
      <button onClick={onBack} className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
        <ArrowLeft size={14} /> Back
      </button>
      <button onClick={onNext} disabled={saving}
        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-medium">
        {saving ? "Saving…" : nextLabel} {!saving && <ArrowRight size={14} />}
      </button>
    </div>
  );
}
