"use client";
import { useState, useEffect } from "react";
import UsersTable from "@/components/UsersTable";
import TenantsTable from "@/components/TenantsTable";
import IndustriesTable from "@/components/IndustriesTable";
import AddUser from "@/components/AddUser";
import AddTenant from "@/components/AddTenant";
import AddIndustry from "@/components/AddIndustry";
import { getUsers } from "@/lib/users";
import { getTenants } from "@/lib/tenants";
import { getIndustries } from "@/lib/industries";
import { ApiResponse, User, Tenant, Industry } from "@/lib/types";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"users"|"tenants"|"industries">("users");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddIndustry, setShowAddIndustry] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let res: ApiResponse<any[]> | undefined;
      if (activeTab === "users") res = await getUsers();
      else if (activeTab === "tenants") res = await getTenants();
      else if (activeTab === "industries") res = await getIndustries();
      if (res?.success) setData(res.data);
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const filtered = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-700 mb-6">
        {["users","tenants","industries"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 ${activeTab===tab ? "border-b-2 border-blue-500 text-blue-400 font-semibold" : "text-gray-400 hover:text-white"}`}
          >
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#161a23] text-white px-3 py-2 rounded border border-gray-700"
        />
        <button
          onClick={() => {
            if (activeTab === "users") setShowAddUser(true);
            if (activeTab === "tenants") setShowAddTenant(true);
            if (activeTab === "industries") setShowAddIndustry(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add {activeTab.slice(0,1).toUpperCase()+activeTab.slice(1)}
        </button>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <>
          {activeTab==="users" && <UsersTable users={filtered as User[]} />}
          {activeTab==="tenants" && <TenantsTable tenants={filtered as Tenant[]} />}
          {activeTab==="industries" && <IndustriesTable industries={filtered as Industry[]} />}
        </>
      )}

      {/* Modals */}
      {showAddUser && (
        <AddUser
          onClose={() => setShowAddUser(false)}
          onSuccess={(newUser) => setData([...data, newUser])}
        />
      )}
      {showAddTenant && (
        <AddTenant
          onClose={() => setShowAddTenant(false)}
          onSuccess={(newTenant) => setData([...data, newTenant])}
        />
      )}
      {showAddIndustry && (
        <AddIndustry
          onClose={() => setShowAddIndustry(false)}
          onSuccess={(newIndustry) => setData([...data, newIndustry])}
        />
      )}
    </div>
  );
}
