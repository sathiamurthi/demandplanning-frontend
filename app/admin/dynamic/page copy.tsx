// app/admin/[entity]/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import DynamicEntityPage from "./dynamicpage";
import { ENTITY_CONFIG } from "@/lib/dynamic";

export default function CategoryPage1() {
  const searchParams = useSearchParams();

  // Read ?page=... from query string
  const pageinfo = searchParams.getAll("page");

  // If you only expect one entity, take the first
  const entity = pageinfo.length > 0 ? pageinfo[0] : null;

  console.log("Page info:", pageinfo);
  console.log("Entity:", entity);

  // ✅ safer lookup
  const config = entity && ENTITY_CONFIG[entity as keyof typeof ENTITY_CONFIG];

  if (!config) {
    return (
      <div className="p-6 text-red-500">
        ❌ No configuration found for "{entity}"
      </div>
    );
  }

  return <DynamicEntityPage config={config} />;
}
