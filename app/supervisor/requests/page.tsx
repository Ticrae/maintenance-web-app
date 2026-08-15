import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupervisorRequestsTable, type RequestRow, type Assignee } from "./requests-table";

export const dynamic = "force-dynamic";

export default async function SupervisorRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user!.id)
    .maybeSingle<{ agency_id: string | null }>();

  const agencyId = profile?.agency_id ?? null;
  const admin = createAdminClient();

  const { data: requests } = agencyId
    ? await admin
        .from("requests")
        .select("id, home_id, reported_by, assigned_to, category, priority, status, description, created_at, homes(name)")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .returns<RequestRow[]>()
    : { data: [] };

  const rows = requests ?? [];

  const personIds = Array.from(
    new Set(rows.flatMap((r) => [r.reported_by, r.assigned_to]).filter((id): id is string => !!id))
  );
  const { data: people } = personIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", personIds)
    : { data: [] };
  const profileMap = Object.fromEntries(
    (people ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"])
  );

  const { data: assignees } = agencyId
    ? await admin
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("agency_id", agencyId)
        .eq("role", "maintenance")
        .returns<Assignee[]>()
    : { data: [] };

  return <SupervisorRequestsTable requests={rows} profileMap={profileMap} assignees={assignees ?? []} />;
}
