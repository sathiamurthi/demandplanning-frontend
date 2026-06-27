import { useState } from "react";
import { User } from "@/lib/types";
import EditUser from "./EditUser";

export default function UsersTable({ users }: { users: User[] }) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <>
      <table className="w-full border-collapse border border-gray-700">
        <thead>…</thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="hover:bg-[#1f2430]">
              <td className="px-4 py-2 border">{u.name}</td>
              <td className="px-4 py-2 border">{u.email}</td>
              <td className="px-4 py-2 border">{u.role}</td>
              <td className="px-4 py-2 border">{u.industry}</td>
              <td className="px-4 py-2 border">{u.status}</td>
              <td className="px-4 py-2 border flex space-x-3">
                <button
                  className="text-blue-400 hover:text-blue-600"
                  onClick={() => setEditingUser(u)}
                >
                  ✏️
                </button>
                <button className="text-red-400 hover:text-red-600">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <EditUser
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(updated) => {
            const newList = users.map(u => u.id === updated.id ? updated : u);
            setEditingUser(null);
            // refresh parent state if needed
          }}
        />
      )}
    </>
  );
}
