"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { storesConfig } from "../../dynamic/entityconfigs";

export default function StoresPage() {
  return <DynamicEntity config={storesConfig} />;
}