import type { Role } from "./theme";

// Where each user role lands after login / when hitting a role-gated route
export const roleDestinations: Record<Role, string> = {
  staff: "/staff",
  maintenance: "/maintenance",
  agency_admin: "/supervisor",
  super_admin: "/admin/reports",
};

// Type guard: narrows an unknown value (e.g. from a DB row or JWT claim)
// into a known Role by checking it's one of the roleDestinations keys.
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in roleDestinations;
}
