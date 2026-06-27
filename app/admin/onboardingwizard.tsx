"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api";

interface TenantOnboardingWizardProps {
  status: any;
  tenantId: string;
  onClose: () => void;
}

export default function TenantOnboardingWizard({
  status,
  tenantId,
  onClose,
}: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [industries, setIndustries] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");

  // Load industries when wizard opens
  useEffect(() => {
    async function loadIndustries() {
      try {
        const res = await apiGet("/industries") as any; // backend endpoint
        setIndustries(res.data);
      } catch (err) {
        console.error("Failed to load industries", err);
      }
    }
    loadIndustries();
  }, []);

  // Load stores for tenant
  useEffect(() => {
    async function loadStores() {
      try {
        const res = await apiGet(`/tenants/${tenantId}/stores`) as any;
        setStores(res.data);
      } catch (err) {
        console.error("Failed to load stores", err);
      }
    }
    loadStores();
  }, [tenantId]);

  const steps = [
    {
      key: "industries",
      label: "Link tenant to industries",
      content: (
        <div className="space-y-3">
          <p className="text-gray-700">Select industries your tenant belongs to.</p>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="">Choose industry</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.display_name}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            disabled={!selectedIndustry}
            onClick={async () => {
              await apiPost(`/tenants/${tenantId}/tenant_industries`, {entity:'tenant_industries', industryId: selectedIndustry });
              setSelectedIndustry("");
            }}
          >
            Add Industry
          </button>
        </div>
      ),
    },
    {
      key: "store",
      label: "Configure at least one store",
      content: (
        <div className="space-y-3">
          <p className="text-gray-700">Create your first store configuration.</p>
          {stores.length > 0 ? (
            <ul className="list-disc pl-5">
              {stores.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No stores yet.</p>
          )}
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await apiPost(`/tenants/${tenantId}/stores`, {
                name: "Main Store",
                industryId: industries[0]?.id, // example: first industry
              });
              const res = await apiGet(`/tenants/${tenantId}/stores`) as any;
              setStores(res.data);
            }}
          >
            Add Store
          </button>
        </div>
      ),
    },
    {
      key: "admin",
      label: "Create an admin user",
      content: (
        <div className="space-y-3">
          <p className="text-gray-700">Invite or create your first admin user.</p>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await apiPost(`/tenants/${tenantId}/users`, {
                email: "admin@company.com",
                firstName: "Admin",
                lastName: "User",
              });
              onClose(); // finish wizard
            }}
          >
            Add Admin User
          </button>
        </div>
      ),
    },
  ];

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px]">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <h3 className="text-lg font-bold mb-2">{steps[currentStep].label}</h3>
        <div className="mb-4">{steps[currentStep].content}</div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            className="bg-gray-300 px-3 py-1 rounded"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Back
          </button>
          {currentStep < steps.length - 1 ? (
            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={nextStep}>
              Next
            </button>
          ) : (
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={onClose}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
