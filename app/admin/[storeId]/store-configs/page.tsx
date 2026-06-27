"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { storeConfigsConfig } from "../../dynamic/entityconfigs";

export default function StoreConfigsPage({ storeId }: { storeId: string }) {
  return (
    <DynamicEntity 
      config={storeConfigsConfig} 
      storeId={storeId}   // 
    />
  );
}