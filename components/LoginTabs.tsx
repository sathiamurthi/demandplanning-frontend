"use client";
import { useState } from "react";
import UserLoginForm from "./UserLoginForm";
import Registration from "./Registration";

export default function LoginTabs() {
  const [activeTab, setActiveTab] = useState<"user" | "employer">("user");

  return (
    <div className="max-w-md w-full mx-auto bg-[#161a23] rounded-xl shadow-lg p-8">
      {/* Tab Switcher */}
      <div className="flex mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === "user"
              ? "text-[#6c63ff] border-b-2 border-[#6c63ff]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          User Login
        </button>
        <button
          onClick={() => setActiveTab("employer")}
          className={`flex-1 py-2 text-center font-semibold transition-colors ${
            activeTab === "employer"
              ? "text-[#6c63ff] border-b-2 border-[#6c63ff]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Employer Registration
        </button>
      </div>

      {/* Conditional Rendering */}
      {activeTab === "user" ? <UserLoginForm /> : <Registration />}
    </div>
  );
}
