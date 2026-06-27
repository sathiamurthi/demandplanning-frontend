"use client";

import { Suspense } from "react";
import { DynamicDashboard } from "./dynamicdashboard";
import { useStore } from "../appshell";

function DashboardInner() {
  const { storeId, loading: storeLoading } = useStore();

  if (storeLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-7 w-44 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-56 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="text-4xl mb-3">🏪</div>
        <p className="font-semibold text-gray-700">No store selected</p>
        <p className="text-sm text-gray-400 mt-1">
          Select a store from the dropdown in the top bar, or create one under <strong>Stores</strong>.
        </p>
      </div>
    );
  }

  return (
    <DynamicDashboard
      config={{ storeId, title: "Dashboard", refreshInterval: 60_000 }}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-7 w-44 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
