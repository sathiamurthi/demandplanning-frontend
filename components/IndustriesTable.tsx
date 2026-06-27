import { Industry, User } from "@/lib/types";

export default function TenantsTable({ industries }: { industries: Industry[] }) {
  return (
    <table className="w-full border-collapse border border-gray-700">
      <thead>
        <tr className="bg-[#161a23]">
          <th className="px-4 py-2 border">Name</th>
          <th className="px-4 py-2 border">Description</th>
          <th className="px-4 py-2 border">Status</th>
        </tr>
      </thead>
      <tbody>
        {industries.map(u => (
          <tr key={u.id} className="hover:bg-[#1f2430]">
            <td className="px-4 py-2 border">{u.name}</td>
            <td className="px-4 py-2 border">{u.description}</td>
            <td className="px-4 py-2 border">{u.status}</td>
            <td className="px-4 py-2 border">
              <span className={`px-2 py-1 rounded text-sm ${u.status==="Active" ? "bg-green-700 text-white" : "bg-red-700 text-white"}`}>
                {u.status}
              </span>
            </td>
            <td className="px-4 py-2 border flex space-x-3">
              <button className="text-blue-400 hover:text-blue-600">✏️</button>
              <button className="text-red-400 hover:text-red-600">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
