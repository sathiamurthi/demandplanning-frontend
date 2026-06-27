"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import ProfilePanel from "@/components/ProfilePanel";
import AdminDashboard from "./dashboard";
import TenantOnboardingWizard from "./onboardingwizard";
import { apiGet } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { getTenantId } from "@/lib/utils";

export default function Admin1Page() {
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);

  const tenantId = getTenantId(); // from auth/session

  useEffect(() => {
    async function fetchStatus() {
      const res = await apiGet<ApiResponse<any[]>>(`/tenants/${tenantId}/dashboard/onboarding-status`);
      setStatus(res.data);
    }
    fetchStatus();
  }, [tenantId]);

  const steps = ["hasIndustries", "hasStoreConfig", "hasAdminUser"];
  const allDone = status && steps.every((step) => status[step]);

  return (
    <div className="flex h-screen bg-[#0f111a]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <button
            className="text-white lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "←" : "→"}
          </button>
          <div className="flex-1 flex justify-start">
            <ProfilePanel />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Show onboarding banner if incomplete */}
          {!allDone && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded">
              <h3 className="font-bold">Tenant Onboarding Incomplete</h3>
              <p className="text-sm mt-1">
                Your tenant setup is not finished. Please complete the required steps.
              </p>
              <button
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => setShowWizard(true)}
              >
                Start Onboarding
              </button>
            </div>
          )}

          {/* Admin dashboard content */}
          <AdminDashboard  />
        </main>
      </div>

      {/* Onboarding wizard popup */}
      {showWizard && status && (
        <TenantOnboardingWizard
          status={status}
          tenantId={tenantId ?? ""}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
function getTenant() {
  throw new Error("Function not implemented.");
}

