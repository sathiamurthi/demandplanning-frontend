"use client";

import { DynamicEntity } from "../../dynamic/dynamicentity";
import { getUsersConfig } from "../../dynamic/entityconfigs";
import { useStore } from "../appshell";

function UsersPageInner() {
  const { stores } = useStore();
  const config = getUsersConfig(stores);
  return <DynamicEntity config={config} />;
}

export default function ManageUsersPage() {
  return <UsersPageInner />;
}
