"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SLA_HOURS, isOverdue } from "@/lib/sla";
import { getRecurringProblems } from "@/app/actions/assets";
import type { Priority } from "@/lib/theme";

const OPEN_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];
const TREND_WINDOW_DAYS = 30;
const COST_WINDOW_DAYS = 90;
const STALE_RUN_DAYS = 3;
// Below this many recent occurrences, a "% increase" is just noise from small
// numbers (2 becoming 4 is a meaningless "100% up").
const TREND_MIN_COUNT = 3;
const TREND_MIN_PCT = 20;

export type AttentionRequest = { id: string; title: string; homeName: string };
export type StaleInspection = { id: string; templateName: string; homeName: string };
export type CostInsight = {
  totalCost: number;
  topAssets: { name: string; cost: number; pct: number }[];
} | null;
export type EmergingTrend = { category: string; changePct: number; homeCount: number } | null;

// The "what should I worry about" synthesis page — pulls together the
// overdue-request check (lib/sla.ts, already used elsewhere), the recurring-
// problem detection built for the reports/safety pages
// (app/actions/assets.ts), stale inspection runs (same signal Compliance
// uses), and two new aggregations: cost concentration and a category trend
// comparison. Nothing here is fabricated — sections with no real signal
// return null/empty rather than a placeholder number.
export async function getMaintenanceIntelligence(agencyId?: string) {
  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("app_settings")
    .select("sla_hours")
    .eq("id", true)
    .maybeSingle<{ sla_hours: Record<string, number> }>();
  const slaHours = settings?.sla_hours ?? DEFAULT_SLA_HOURS;

  let openQuery = admin
    .from("requests")
    .select("id, description, priority, created_at, homes(name)")
    .in("status", OPEN_STATUSES);
  if (agencyId) openQuery = openQuery.eq("agency_id", agencyId);
  const { data: openRows } = await openQuery.returns<
    { id: string; description: string; priority: Priority; created_at: string; homes: { name: string } | null }[]
  >();

  // Open requests already past their SLA deadline, capped to the 10 worst
  const immediateAttention: AttentionRequest[] = (openRows ?? [])
    .filter((r) => isOverdue(r.created_at, r.priority, slaHours))
    .map((r) => ({ id: r.id, title: r.description.split("\n")[0], homeName: r.homes?.name ?? "—" }))
    .slice(0, 10);

  const recurring = await getRecurringProblems(agencyId);

  let runsQuery = admin
    .from("inspection_runs")
    .select("id, started_at, homes(name), inspection_templates(name)")
    .eq("status", "in_progress");
  if (agencyId) runsQuery = runsQuery.eq("agency_id", agencyId);
  const { data: openRuns } = await runsQuery.returns<
    { id: string; started_at: string; homes: { name: string } | null; inspection_templates: { name: string } | null }[]
  >();
  const staleCutoff = Date.now() - STALE_RUN_DAYS * 86_400_000;
  const staleInspections: StaleInspection[] = (openRuns ?? [])
    .filter((r) => new Date(r.started_at).getTime() < staleCutoff)
    .map((r) => ({ id: r.id, templateName: r.inspection_templates?.name ?? "—", homeName: r.homes?.name ?? "—" }));

  // Which assets are driving repair spend over the last 90 days
  const costCutoff = new Date(Date.now() - COST_WINDOW_DAYS * 86_400_000).toISOString();
  let costQuery = admin
    .from("requests")
    .select("cost, asset_id, assets(name)")
    .eq("status", "Completed")
    .not("cost", "is", null)
    .gte("completed_at", costCutoff);
  if (agencyId) costQuery = costQuery.eq("agency_id", agencyId);
  const { data: costRows } = await costQuery.returns<
    { cost: number; asset_id: string | null; assets: { name: string } | null }[]
  >();

  let costInsight: CostInsight = null;
  const totalCost = (costRows ?? []).reduce((sum, r) => sum + r.cost, 0);
  if (totalCost > 0) {
    const byAsset = new Map<string, { name: string; cost: number }>();
    for (const r of costRows ?? []) {
      if (!r.asset_id) continue;
      const entry = byAsset.get(r.asset_id) ?? { name: r.assets?.name ?? "—", cost: 0 };
      entry.cost += r.cost;
      byAsset.set(r.asset_id, entry);
    }
    const topAssets = Array.from(byAsset.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 3)
      .map((a) => ({ ...a, pct: Math.round((a.cost / totalCost) * 100) }));
    costInsight = { totalCost, topAssets };
  }

  // Compare the last 30 days against the 30 days before that, per category,
  // to spot a category trending sharply upward
  const now = Date.now();
  const priorStart = new Date(now - 2 * TREND_WINDOW_DAYS * 86_400_000).toISOString();
  const windowStartMs = now - TREND_WINDOW_DAYS * 86_400_000;
  let trendQuery = admin.from("requests").select("category, home_id, created_at").gte("created_at", priorStart);
  if (agencyId) trendQuery = trendQuery.eq("agency_id", agencyId);
  const { data: trendRows } = await trendQuery.returns<{ category: string; home_id: string; created_at: string }[]>();

  const recentByCat = new Map<string, { count: number; homes: Set<string> }>();
  const priorByCat = new Map<string, number>();
  for (const r of trendRows ?? []) {
    const t = new Date(r.created_at).getTime();
    if (t >= windowStartMs) {
      const entry = recentByCat.get(r.category) ?? { count: 0, homes: new Set<string>() };
      entry.count += 1;
      entry.homes.add(r.home_id);
      recentByCat.set(r.category, entry);
    } else {
      priorByCat.set(r.category, (priorByCat.get(r.category) ?? 0) + 1);
    }
  }

  // Pick the single biggest qualifying increase (if any) to surface as the trend
  let emergingTrend: EmergingTrend = null;
  let bestPct = TREND_MIN_PCT;
  for (const [category, entry] of recentByCat) {
    if (entry.count < TREND_MIN_COUNT) continue;
    const prior = priorByCat.get(category) ?? 0;
    const pct = prior === 0 ? 100 : Math.round(((entry.count - prior) / prior) * 100);
    if (pct > bestPct) {
      bestPct = pct;
      emergingTrend = { category, changePct: pct, homeCount: entry.homes.size };
    }
  }

  return { immediateAttention, recurring, staleInspections, costInsight, emergingTrend };
}
