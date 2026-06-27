"use client";
import { useState } from "react";
import { createUser } from "@/lib/users";
import { User } from "@/lib/types";

export default function AddUser({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: User) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", industry: "", status: "Active" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createUser(form);
    if (res.success) {
      onSuccess(res.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-[#161a23] p-6 rounded w-96 space-y-4">
        <h2 className="text-xl font-bold">Add User</h2>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <input name="role" placeholder="Role" value={form.role} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded" />
        <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 bg-gray-800 text-white rounded">
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}
