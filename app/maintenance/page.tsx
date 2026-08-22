import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerDictionary } from "@/lib/i18n/server";
import { QueueView, type QueueRow } from "./queue-view";

const ACTIVE_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

export default async function JobQueuePage() {
  const dict = await getServerDictionary();
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
        .select("id, category, priority, status, description, assigned_to, created_at, homes(id, name)")
        .eq("agency_id", agencyId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            category: string;
            priority: QueueRow["priority"];
            status: string;
            description: string;
            assigned_to: string | null;
            created_at: string;
            homes: { id: string; name: string } | null;
          }[]
        >()
    : { data: [] };

  const rows = requests ?? [];

  const { data: homes } = agencyId
    ? await admin.from("homes").select("id, name").eq("agency_id", agencyId).order("name")
    : { data: [] };

  const assigneeIds = Array.from(new Set(rows.map((r) => r.assigned_to).filter((id): id is string => !!id)));
  const { data: assignees } = assigneeIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", assigneeIds)
    : { data: [] };
  const assigneeMap = Object.fromEntries(
    (assignees ?? []).map((a) => [a.id, [a.first_name, a.last_name].filter(Boolean).join(" ") || dict.common.unnamed])
  );

  const queue: QueueRow[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    priority: r.priority,
    status: r.status,
    description: r.description,
    created_at: r.created_at,
    homeId: r.homes?.id ?? "",
    homeName: r.homes?.name ?? "—",
    assigneeName: r.assigned_to ? assigneeMap[r.assigned_to] ?? dict.common.unnamed : null,
  }));

  return <QueueView queue={queue} homes={homes ?? []} />;
}
