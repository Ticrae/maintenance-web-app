"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const STALE_RUN_DAYS = 3;

export type ComplianceSummary = {
  completedCount: number;
  notesRate: number | null;
  photoRate: number | null;
  criticalCount: number;
  criticalDocumentedRate: number | null;
  photoCount: number;
  staleInspectionCount: number;
};

// A snapshot of "can we show this was actually done" evidence — completion
// notes and photo coverage on closed requests, whether critical (Urgent)
// requests got documented, and inspections that were started but never
// finished. Only reports what the app actually has data for; no fabricated
// rows for preventive-maintenance scheduling or contractor visits, since
// neither exists yet.
export async function getComplianceSummary(agencyId?: string): Promise<ComplianceSummary> {
  const admin = createAdminClient();

  let requestsQuery = admin
    .from("requests")
    .select("id, priority, resolution_notes")
    .eq("status", "Completed");
  if (agencyId) requestsQuery = requestsQuery.eq("agency_id", agencyId);

  const { data: completed } = await requestsQuery.returns<
    { id: string; priority: string; resolution_notes: string | null }[]
  >();
  const completedRows = completed ?? [];

  const withNotes = completedRows.filter((r) => r.resolution_notes);
  const critical = completedRows.filter((r) => r.priority === "Urgent");
  const criticalDocumented = critical.filter((r) => r.resolution_notes);

  const { data: photoRows } = completedRows.length
    ? await admin
        .from("request_photos")
        .select("request_id")
        .in("request_id", completedRows.map((r) => r.id))
    : { data: [] };
  const withPhotos = new Set((photoRows ?? []).map((p) => p.request_id));

  let runsQuery = admin
    .from("inspection_runs")
    .select("id, started_at")
    .eq("status", "in_progress");
  if (agencyId) runsQuery = runsQuery.eq("agency_id", agencyId);

  const { data: openRuns } = await runsQuery.returns<{ id: string; started_at: string }[]>();
  const staleCutoff = Date.now() - STALE_RUN_DAYS * 86_400_000;
  const staleInspectionCount = (openRuns ?? []).filter((r) => new Date(r.started_at).getTime() < staleCutoff).length;

  return {
    completedCount: completedRows.length,
    notesRate: completedRows.length ? withNotes.length / completedRows.length : null,
    photoRate: completedRows.length ? withPhotos.size / completedRows.length : null,
    criticalCount: critical.length,
    criticalDocumentedRate: critical.length ? criticalDocumented.length / critical.length : null,
    photoCount: withPhotos.size,
    staleInspectionCount,
  };
}

export type HomeActivityReport = {
  homeName: string;
  agencyName: string;
  year: number;
  month: number;
  received: number;
  completed: number;
  outstanding: number;
  criticalIssues: number;
  inspectionsCompleted: number;
};

// Builds a single home's monthly activity report (requests received/
// completed/outstanding, critical issues, inspections completed) for the
// printable compliance report card.
export async function getHomeActivityReport(
  homeId: string,
  year: number,
  month: number
): Promise<HomeActivityReport | null> {
  const admin = createAdminClient();

  const { data: home } = await admin
    .from("homes")
    .select("name, agencies(name)")
    .eq("id", homeId)
    .maybeSingle<{ name: string; agencies: { name: string } | null }>();
  if (!home) return null;

  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 1)).toISOString();

  const { data: requests } = await admin
    .from("requests")
    .select("status, priority")
    .eq("home_id", homeId)
    .gte("created_at", start)
    .lt("created_at", end)
    .returns<{ status: string; priority: string }[]>();
  const rows = requests ?? [];

  const completed = rows.filter((r) => r.status === "Completed").length;
  const criticalIssues = rows.filter((r) => r.priority === "Urgent").length;

  const { count: inspectionsCompleted } = await admin
    .from("inspection_runs")
    .select("id", { count: "exact", head: true })
    .eq("home_id", homeId)
    .eq("status", "completed")
    .gte("completed_at", start)
    .lt("completed_at", end);

  return {
    homeName: home.name,
    agencyName: home.agencies?.name ?? "—",
    year,
    month,
    received: rows.length,
    completed,
    outstanding: rows.length - completed,
    criticalIssues,
    inspectionsCompleted: inspectionsCompleted ?? 0,
  };
}
