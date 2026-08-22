"use client";
import { DynamicEntity } from "../dynamicentity";
import { attendanceConfig } from "../entityconfigs";

export default function AttendancePage() {
  return <DynamicEntity config={attendanceConfig} />;
}
