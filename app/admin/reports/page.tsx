import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SLA_HOURS } from "@/lib/sla";
import { nowMs } from "@/lib/date";
import { ReportsView, type UnassignedRow, type Assignee } from "./reports-view";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["Open", "Assigned", "In Progress"];

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default async function ReportsPage() {
  const admin = createAdminClient();

  const [{ data: requests }, { data: settings }, { data: assignees }] =
    await Promise.all([
      admin
        .from("requests")
        .select(
          "id, agency_id, home_id, category, priority, status, description, assigned_to, created_at, updated_at, homes(name)",
        )
        .returns<
          {
            id: string;
            agency_id: string;
            home_id: string;
            category: string;
            priority: string;
            status: string;
            description: string;
            assigned_to: string | null;
            created_at: string;
            updated_at: string;
            homes: { name: string } | null;
          }[]
        >(),
      admin
        .from("app_settings")
        .select("sla_hours")
        .eq("id", true)
        .maybeSingle<{ sla_hours: Record<string, number> }>(),
      admin
        .from("profiles")
        .select("id, first_name, last_name, agency_id")
        .in("role", ["maintenance", "agency_admin"])
        .returns<Assignee[]>(),
    ]);

  const rows = requests ?? [];
  const slaHours = settings?.sla_hours ?? DEFAULT_SLA_HOURS;

  const completed = rows.filter((r) => r.status === "Completed");
  const durations = completed.map(
    (r) => new Date(r.updated_at).getTime() - new Date(r.created_at).getTime(),
  );
  const medianMs = median(durations);

  const now = nowMs();
  const urgentCompleted = completed.filter((r) => r.priority === "Urgent");
  const urgentWithinSla = urgentCompleted.filter(
    (r) =>
      new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() <=
      (slaHours.Urgent ?? DEFAULT_SLA_HOURS.Urgent) * 3600_000,
  ).length;
  const urgentSlaPct = urgentCompleted.length
    ? Math.round((urgentWithinSla / urgentCompleted.length) * 100)
    : null;

  const openOver7Days = rows.filter(
    (r) =>
      ACTIVE_STATUSES.includes(r.status) &&
      now - new Date(r.created_at).getTime() > 7 * 86400_000,
  );
  const openOver7HomeCount = new Set(openOver7Days.map((r) => r.home_id)).size;

  const homeDurations: Record<
    string,
    { name: string; total: number; count: number }
  > = {};
  for (const r of completed) {
    const name = r.homes?.name ?? "—";
    if (!homeDurations[r.home_id])
      homeDurations[r.home_id] = { name, total: 0, count: 0 };
    homeDurations[r.home_id].total +=
      new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
    homeDurations[r.home_id].count += 1;
  }
  const homeAverages = Object.values(homeDurations).map((h) => ({
    home: h.name,
    avgMs: h.total / h.count,
  }));
  const maxHomeAvg = Math.max(1, ...homeAverages.map((h) => h.avgMs));
  const homeTimes = homeAverages
    .sort((a, b) => b.avgMs - a.avgMs)
    .map((h) => ({
      home: h.home,
      pct: Math.round((h.avgMs / maxHomeAvg) * 100),
      value: formatDuration(h.avgMs),
      tone:
        h.avgMs > 48 * 3600_000
          ? ("red" as const)
          : h.avgMs > 24 * 3600_000
            ? ("amber" as const)
            : ("default" as const),
    }));

  const categoryCounts: Record<string, number> = {};
  for (const r of rows)
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));
  const categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => ({
      category,
      value,
      pct: Math.round((value / maxCategoryCount) * 100),
    }));

  const unassigned: UnassignedRow[] = rows
    .filter((r) => !r.assigned_to && ACTIVE_STATUSES.includes(r.status))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((r) => ({
      id: r.id,
      agencyId: r.agency_id,
      title: r.description.split("\n")[0],
      home: r.homes?.name ?? "—",
      created_at: r.created_at,
      waitLong: now - new Date(r.created_at).getTime() > 24 * 3600_000,
    }));

  return (
    <ReportsView
      totalRequests={rows.length}
      medianResponse={medianMs !== null ? formatDuration(medianMs) : "—"}
      urgentSlaPct={urgentSlaPct}
      openOver7Days={openOver7Days.length}
      openOver7HomeCount={openOver7HomeCount}
      homeTimes={homeTimes}
      categories={categories}
      unassigned={unassigned}
      assignees={assignees ?? []}
    />
  );
}
