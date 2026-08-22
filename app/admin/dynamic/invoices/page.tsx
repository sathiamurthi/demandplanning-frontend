"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { invoicesConfig } from "../../dynamic/entityconfigs";

export default function InvoicesPage() {
  return <DynamicEntity config={invoicesConfig} />;
}
