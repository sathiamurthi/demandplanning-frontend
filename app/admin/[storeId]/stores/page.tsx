"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { storesConfig } from "../../dynamic/entityconfigs";

export default function StoresPage({ storeId }: { storeId: string }) {
  return (
    <DynamicEntity 
      config={storesConfig} 
      storeId={storeId}   // 
    />
  );
}