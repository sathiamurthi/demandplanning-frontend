"use client";
import { useState } from "react";

export default function Subscriptions() {
  const [tenantId, setTenantId] = useState("");
  const [plan, setPlan] = useState("");

  const updateSubscription = async () => {
    await fetch("/api/superadmin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, plan }),
    });
    alert("Subscription updated");
    setTenantId("");
    setPlan("");
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Manage Subscriptions</h2>
      <input
        value={tenantId}
        onChange={e => setTenantId(e.target.value)}
        placeholder="Tenant ID"
        className="w-full p-2 mb-2 rounded"
      />
      <input
        value={plan}
        onChange={e => setPlan(e.target.value)}
        placeholder="Plan Name"
        className="w-full p-2 mb-2 rounded"
      />
      <button
        onClick={updateSubscription}
        className="bg-[#6c63ff] px-4 py-2 rounded"
      >
        Update Subscription
      </button>
    </div>
  );
}
