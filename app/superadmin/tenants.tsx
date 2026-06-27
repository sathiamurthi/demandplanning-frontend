"use client";
import { useEffect, useState } from "react";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    fetch("/api/superadmin/tenants").then(res => res.json()).then(setTenants);
  }, []);

  return (
    <div>
      <h2 className="text-xl mb-4">Manage Tenants</h2>
      <ul>
        {tenants.map((t: any) => (
          <li key={t.id} className="flex justify-between">
            {t.companyName} ({t.status})
            <button className="bg-green-500 px-2 py-1 rounded">Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
