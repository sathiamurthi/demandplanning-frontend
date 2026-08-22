"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { leadsConfig } from "../../dynamic/entityconfigs";

export default function LeadsPage() {
  return <DynamicEntity config={leadsConfig} />;
}
