"use client";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { categoriesConfig } from "../../dynamic/entityconfigs";

export default function CategoriesPage() {
  return <DynamicEntity config={categoriesConfig} />;
}