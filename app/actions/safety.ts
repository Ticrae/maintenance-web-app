"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SLA_HOURS, isOverdue } from "@/lib/sla";
import type { Priority } from "@/lib/theme";
import { getRecurringProblems } from "@/app/actions/assets";

const OPEN_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

// "Safety-related" has no dedicated flag on requests yet, so Urgent doubles
// as the signal — the staff-facing urgent toggle is already described as
// "risk to a resident or the building" (see lib/i18n/dictionaries/auth or
// staff copy for that wording), which is the same thing this dashboard cares
// about.
const SAFETY_PRIORITY: Priority = "Urgent";

// Structured facts rather than pre-formatted strings, so the UI can render
// them through the dictionary and stay translated (matching how the rest of
// this app keeps user-facing text out of server actions).
export type AttentionItem = {
  homeId: string;
  homeName: string;
  overdueCount: number;
  safetyOpenCount: number;
  flaggedAssets: { id: string; name: string; recentFailures: number; topCategory: string | null }[];
};

export async function getHomeSafetySummary(agencyId?: string) {
  const admin = createAdminClient();

  let homesQuery = admin.from("homes").select("id, name").order("name");
  if (agencyId) homesQuery = homesQuery.eq("agency_id", agencyId);

  const [{ data: homes }, { data: settings }, recurring] = await Promise.all([
    homesQuery,
    admin.from("app_settings").select("sla_hours").eq("id", true).maybeSingle<{ sla_hours: Record<string, number> }>(),
    getRecurringProblems(agencyId),
  ]);

  const homeRows = homes ?? [];
  const slaHours = settings?.sla_hours ?? DEFAULT_SLA_HOURS;

  let requestsQuery = admin
    .from("requests")
    .select("home_id, priority, status, created_at, agency_id")
    .in("status", OPEN_STATUSES);
  if (agencyId) requestsQuery = requestsQuery.eq("agency_id", agencyId);

  const { data: requests } = await requestsQuery.returns<
    { home_id: string; priority: Priority; status: string; created_at: string; agency_id: string }[]
  >();
  const rows = requests ?? [];

  const flaggedByHome = new Map<string, typeof recurring.flaggedAssets>();
  for (const a of recurring.flaggedAssets) {
    const list = flaggedByHome.get(a.homeId) ?? [];
    list.push(a);
    flaggedByHome.set(a.homeId, list);
  }

  let totalOpen = 0;
  let totalOverdue = 0;
  let totalSafety = 0;

  const attentionRequired: AttentionItem[] = [];

  for (const home of homeRows) {
    const homeRequests = rows.filter((r) => r.home_id === home.id);
    const overdue = homeRequests.filter((r) => isOverdue(r.created_at, r.priority, slaHours));
    const safetyOpen = homeRequests.filter((r) => r.priority === SAFETY_PRIORITY);
    const flagged = flaggedByHome.get(home.id) ?? [];

    totalOpen += homeRequests.length;
    totalOverdue += overdue.length;
    totalSafety += safetyOpen.length;

    if (overdue.length > 0 || safetyOpen.length > 0 || flagged.length > 0) {
      attentionRequired.push({
        homeId: home.id,
        homeName: home.name,
        overdueCount: overdue.length,
        safetyOpenCount: safetyOpen.length,
        flaggedAssets: flagged.map((a) => ({
          id: a.id,
          name: a.name,
          recentFailures: a.recentFailures,
          topCategory: a.topCategory,
        })),
      });
    }
  }

  return {
    totals: {
      open: totalOpen,
      overdue: totalOverdue,
      safetyIssues: totalSafety,
      criticalAssets: recurring.flaggedAssets.length,
    },
    attentionRequired,
  };
}
