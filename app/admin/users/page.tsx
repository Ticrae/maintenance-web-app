import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable, type UserRow, type AgencyOption, type HomeOption } from "./users-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const [{ data: profiles }, { data: agencies }, { data: homes }, { data: authList }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, first_name, last_name, phone, role, agency_id, home_id, created_at")
        .order("created_at", { ascending: false }),
      admin.from("agencies").select("id, name").order("name"),
      admin.from("homes").select("id, name, agency_id").order("name"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const emailMap = Object.fromEntries(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );

  const rows: UserRow[] = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? "—",
  }));

  return (
    <UsersTable
      users={rows}
      agencies={(agencies ?? []) as AgencyOption[]}
      homes={(homes ?? []) as HomeOption[]}
      currentUserId={currentUser?.id ?? null}
    />
  );
}
