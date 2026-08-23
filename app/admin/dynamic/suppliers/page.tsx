import React from "react";
import { DynamicEntity } from "../dynamicentity";
import { suppliersConfig } from "../entityconfigs";

export default function SuppliersPage() {
  return <DynamicEntity config={suppliersConfig} />;
}
