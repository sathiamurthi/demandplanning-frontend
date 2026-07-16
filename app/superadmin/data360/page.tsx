"use client";
import { Database } from "lucide-react";
import AccountTable from "../components/AccountTable";

export default function Data360SuperAdmin() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600/20 rounded-xl flex items-center justify-center">
          <Database className="text-teal-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data360</h1>
          <p className="text-xs text-gray-500">Registered users — suspend a login, or send a payment reminder.</p>
        </div>
      </div>

      <AccountTable
        listUrl="/v1/superadmin/data360/users"
        actionBase="/v1/superadmin/data360/users"
        emptyLabel="No Data360 users yet."
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "purchased_document_quota", label: "Purchased Docs" },
          { key: "created_at", label: "Registered", render: r => new Date(r.created_at).toLocaleDateString("en-IN") },
        ]}
      />
    </div>
  );
}
