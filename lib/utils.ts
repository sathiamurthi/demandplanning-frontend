// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  const strategy = (process.env.NEXT_PUBLIC_TOKEN_STRATEGY || "localStorage") as "cookie" | "localStorage";

  if (strategy === "localStorage") {
    return localStorage.getItem("tenantId");
  } else if (strategy === "cookie") {
    const match = document.cookie.match(/tenantId=([^;]+)/);
    return match ? match[1] : null;
  }
  return null;
}

export function getStoreId(): string | null {
  if (typeof window === "undefined") return null;
  const strategy = (process.env.NEXT_PUBLIC_TOKEN_STRATEGY || "localStorage") as "cookie" | "localStorage";

  if (strategy === "localStorage") {
    return localStorage.getItem("storeId");
  } else if (strategy === "cookie") {
    const match = document.cookie.match(/storeId=([^;]+)/);
    return match ? match[1] : null;
  }
  return null;
}




export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
