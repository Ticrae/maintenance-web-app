import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsTable, type RequestRow, type Assignee } from "./requests-table";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("requests")
    .select("*, homes(name), agencies(name)")
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  const rows = requests ?? [];

  const personIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.reported_by, r.assigned_to]).filter((id): id is string => !!id)
    )
  );

  const { data: people } = personIds.length
    ? await admin
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", personIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (people ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed",
    ])
  );

  const { data: assignees } = await admin
    .from("profiles")
    .select("id, first_name, last_name, agency_id, home_id")
    .in("role", ["maintenance", "agency_admin"])
    .returns<Assignee[]>();

  return (
    <RequestsTable
      requests={rows}
      profileMap={profileMap}
      assignees={assignees ?? []}
    />
  );
}
