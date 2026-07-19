import "server-only";

export type Role = "OWNER" | "MANAGER" | "SALES_REP" | "SUPPORT";

// Ordered loosely by privilege — used only for the "manager or above" checks
// below, not for a strict total ordering of every permission.
const RANK: Record<Role, number> = { SUPPORT: 0, SALES_REP: 1, MANAGER: 2, OWNER: 3 };

export function isManagerOrAbove(role: Role) {
  return RANK[role] >= RANK.MANAGER;
}

/** Owners/managers can edit or delete any record; sales reps only their own; support is read-only. */
export function canManageRecord(role: Role, isOwnerOfRecord: boolean) {
  if (role === "SUPPORT") return false;
  if (isManagerOrAbove(role)) return true;
  return isOwnerOfRecord;
}

export function canCreateRecords(role: Role) {
  return role !== "SUPPORT";
}

export function canAccessAdmin(role: Role) {
  return isManagerOrAbove(role);
}
