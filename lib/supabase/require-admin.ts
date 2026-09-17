import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/theme";

export type AuthedProfile = {
  id: string;
  role: Role;
  agency_id: string | null;
  home_id: string | null;
};

// Loads the current logged-in user's profile and throws unless their role is
// in the allowed list — used to guard server actions/pages by role.
export async function requireRole(allowed: Role[]): Promise<AuthedProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agency_id, home_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !allowed.includes(profile.role as Role)) throw new Error("Forbidden");

  return {
    id: user.id,
    role: profile.role as Role,
    agency_id: profile.agency_id,
    home_id: profile.home_id,
  };
}

// Shorthand guard for super-admin-only server actions/pages
export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}
