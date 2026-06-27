"use client";

import { useSearchParams, useParams } from "next/navigation";

import DashboardPage from "../dashboard/page1";
import CategoriesPage from "../categories/page";
import StoreConfigsPage from "../store-configs/page";
import StoresPage from "../stores/page";
import ManageUsersPage from "../users/page";
import ItemsPage from "../items/page";

export default function DynamicPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const storeId = params.storeId as string;

  // default → dashboard
  const page = searchParams.get("page") || "dashboard";

  const COMPONENT_MAP: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage storeId={storeId}/>,
    categories: <CategoriesPage storeId={storeId} />,
    store_configs: <StoreConfigsPage storeId={storeId} />,
    stores: <StoresPage storeId={storeId} />,
    users: <ManageUsersPage storeId={storeId} />,
    items: <ItemsPage storeId={storeId} />,
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4 overflow-auto">
        {COMPONENT_MAP[page] || (
          <div className="text-red-500">❌ Page not found</div>
        )}
      </div>
    </div>
  );
}