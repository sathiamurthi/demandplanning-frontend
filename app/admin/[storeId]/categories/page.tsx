import { DynamicEntity } from "../../dynamic/dynamicentity";
import { categoriesConfig } from "../../dynamic/entityconfigs";

export default function CategoriesPage({ storeId }: { storeId: string }) {
  return (
    <DynamicEntity 
      config={categoriesConfig} 
      storeId={storeId}   // 
    />
  );
}