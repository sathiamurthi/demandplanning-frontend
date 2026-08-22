"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { quotationsConfig } from "../../dynamic/entityconfigs";

export default function QuotationsPage() {
  return <DynamicEntity config={quotationsConfig} />;
}
