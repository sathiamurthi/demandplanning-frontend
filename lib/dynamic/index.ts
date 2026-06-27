import { CATEGORY_ENTITY_CONFIG } from "./categoryentity";
import { STORE_CONFIG_ENTITY_CONFIG } from "./store.config.config";
import { STORE_ENTITY_CONFIG } from "./storeconfig";


// Merge all configs into one dictionary
export const ENTITY_CONFIG: Record<string, any> = {
  categories: CATEGORY_ENTITY_CONFIG,
  store_config: STORE_CONFIG_ENTITY_CONFIG,
  stores:STORE_ENTITY_CONFIG
}