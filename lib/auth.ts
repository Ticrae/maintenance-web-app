import type { Role } from "./theme";

export const roleDestinations: Record<Role, string> = {
  staff: "/staff",
  maintenance: "/maintenance",
  agency_admin: "/supervisor",
  super_admin: "/admin/reports",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in roleDestinations;
}
