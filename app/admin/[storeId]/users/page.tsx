"use client";
import { useStore } from "../../appshell";
import { DynamicEntity } from "../../dynamic/dynamicentity";
import { getUsersConfig } from "../../dynamic/entityconfigs";

export default function ManageUsersPage({ storeId }: { storeId: string }){
  const { stores } = useStore(); // hook gives you stores array
  const usersConfig = getUsersConfig(stores);
  return (
    <DynamicEntity
      config={usersConfig}
      storeId={storeId}   // still pass storeId if DynamicEntity needs it
    />
  );
}