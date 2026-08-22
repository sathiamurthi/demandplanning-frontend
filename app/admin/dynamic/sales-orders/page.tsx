"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { salesOrdersConfig } from "../../dynamic/entityconfigs";

export default function SalesOrdersPage() {
  return <DynamicEntity config={salesOrdersConfig} />;
}
