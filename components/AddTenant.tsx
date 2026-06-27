"use client";
import { useState } from "react";
import { createTenant } from "@/lib/tenants";
import { Tenant } from "@/lib/types";

export default function AddTenant({ onClose, onSuccess }: { onClose: () => void; onSuccess: (t: Tenant) => void }) {
  const [form, setForm] = useState({ companyName: "", adminEmail: "", status: "pending" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTenant(form);
    if (res.success) {
      onSuccess(res.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-[#161a23] p-6 rounded w-96 space-y-4">
        <h2 className="text-xl font-bold">Add Tenant</h2>
        <input name="companyName" placeholder="Company Name" value={form.companyName} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <input name="adminEmail" placeholder="Admin Email" value={form.adminEmail} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded">
          <option>pending</option>
          <option>approved</option>
          <option>inactive</option>
        </select>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}
