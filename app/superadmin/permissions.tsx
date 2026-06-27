"use client";
import { useEffect, useState } from "react";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    fetch("/api/superadmin/permissions")
      .then(res => res.json())
      .then(setPermissions);
  }, []);

  return (
    <div>
      <h2 className="text-xl mb-4">Manage Permissions</h2>
      <ul>
        {permissions.map((p: any) => (
          <li key={p.id} className="flex justify-between">
            {p.name}
            <button className="bg-green-500 px-2 py-1 rounded">Assign</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
