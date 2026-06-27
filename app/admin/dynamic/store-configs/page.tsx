"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { storeConfigsConfig } from "../../dynamic/entityconfigs";

export default function StoreConfigsPage() {
  return <DynamicEntity config={storeConfigsConfig} />;
}