"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { unitsConfig } from "../../dynamic/entityconfigs";

export default function UnitsPage() {
  return <DynamicEntity config={unitsConfig} />;
}
