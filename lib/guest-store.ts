const GUEST_KEY = "nexus.guest.v1";

export interface GuestIdentity {
  id: string;    // e.g. "guest_a7k2x9"
  name: string;
  phone?: string;
  createdAt: string;
}

function randomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "guest_";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (const b of arr) result += chars[b % chars.length];
  return result;
}

export function getGuest(): GuestIdentity | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestIdentity;
  } catch { return null; }
}

export function createGuest(name: string, phone?: string): GuestIdentity {
  const guest: GuestIdentity = {
    id:        randomId(),
    name:      name.trim(),
    ...(phone?.trim() && { phone: phone.trim() }),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
  return guest;
}

export function clearGuest(): void {
  localStorage.removeItem(GUEST_KEY);
}

/** Namespace per-guest data so two users sharing a device stay isolated */
export function guestKey(guestId: string, namespace: string): string {
  return `nexus.${guestId}.${namespace}`;
}
