"use client";
import { DynamicEntity } from "../dynamicentity";
import { timesheetsConfig } from "../entityconfigs";

export default function TimesheetsPage() {
  return <DynamicEntity config={timesheetsConfig} />;
}
