import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SLA_HOURS } from "@/lib/sla";
import { MyJobsView, type MyJobRow } from "./my-jobs-view";

export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("requests")
    .select("id, category, priority, status, description, created_at, homes(name)")
    .eq("assigned_to", user!.id)
    .in("status", ["Assigned", "In Progress", "Waiting for Parts"])
    .order("created_at", { ascending: true })
    .returns<
      {
        id: string;
        category: string;
        priority: MyJobRow["priority"];
        status: string;
        description: string;
        created_at: string;
        homes: { name: string } | null;
      }[]
    >();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("sla_hours")
    .eq("id", true)
    .maybeSingle<{ sla_hours: Record<string, number> }>();

  const jobs: MyJobRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    priority: r.priority,
    status: r.status,
    description: r.description,
    created_at: r.created_at,
    homeName: r.homes?.name ?? "—",
  }));

  return <MyJobsView jobs={jobs} slaHours={settings?.sla_hours ?? DEFAULT_SLA_HOURS} />;
}
