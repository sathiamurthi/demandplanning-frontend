"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { itemsConfig } from "../../dynamic/entityconfigs";

export default function ItemsPage({ storeId }: { storeId: string }) {
  return (
    <DynamicEntity 
      config={itemsConfig} 
      storeId={storeId}   // 
    />
  );
}