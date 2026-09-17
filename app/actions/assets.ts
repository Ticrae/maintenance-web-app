"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type AssetStatus = "active" | "out_of_service" | "retired";

export type AssetRow = {
  id: string;
  agency_id: string;
  home_id: string;
  asset_type_id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  status: AssetStatus;
  purchase_price: number | null;
  created_at: string;
  asset_types: { name: string } | null;
  homes: { name: string } | null;
};

const ASSET_SELECT = "*, asset_types(name), homes(name)";

// Revalidates every route that could be showing this asset (both admin's and
// supervisor's list/detail pages, since asset writes are shared across roles)
function assetPaths(assetId?: string) {
  revalidatePath("/admin/assets");
  revalidatePath("/supervisor/assets");
  if (assetId) {
    revalidatePath(`/admin/assets/${assetId}`);
    revalidatePath(`/supervisor/assets/${assetId}`);
  }
}

// Confirms the given home belongs to the given agency, throwing the same
// error an agency_admin would see if they tried to reach outside their own
// agency (mirrors the ownership check in app/actions/requests.ts's assignRequest).
async function requireHomeInAgency(
  admin: ReturnType<typeof createAdminClient>,
  homeId: string,
  agencyId: string
) {
  const { data: home } = await admin
    .from("homes")
    .select("id, agency_id")
    .eq("id", homeId)
    .maybeSingle();
  if (!home || home.agency_id !== agencyId) {
    throw new Error("Choose a home in your agency.");
  }
  return home;
}

// --- Reads -------------------------------------------------------------

// Lists assets, optionally scoped to one agency (unscoped = platform-wide, for admin)
export async function getAssets(agencyId?: string) {
  const admin = createAdminClient();
  let query = admin.from("assets").select(ASSET_SELECT).order("name");
  if (agencyId) query = query.eq("agency_id", agencyId);

  const { data, error } = await query.returns<AssetRow[]>();
  if (error) {
    console.error("Failed to fetch assets:", error);
    return [];
  }
  return data ?? [];
}

// Active assets for a single home, used to populate the "which item?"
// picker on the new-request form
export async function getAssetsForHome(homeId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assets")
    .select("id, name, asset_types(name)")
    .eq("home_id", homeId)
    .eq("status", "active")
    .order("name")
    .returns<{ id: string; name: string; asset_types: { name: string } | null }[]>();

  if (error) {
    console.error("Failed to fetch assets for home:", error);
    return [];
  }
  return data ?? [];
}

const RECENT_FAILURE_WINDOW_DAYS = 90;
const RECENT_FAILURE_THRESHOLD = 3;
// Repairs totalling at least half the asset's purchase price is the usual
// rule-of-thumb tipping point for "repair vs. replace" recommendations.
const REPAIR_COST_RATIO_THRESHOLD = 0.5;

export type AssetCaseFileRequest = {
  id: string;
  description: string;
  status: string;
  priority: string;
  cost: number | null;
  resolution_notes: string | null;
  created_at: string;
  completed_at: string | null;
};

// Builds the full "case file" view for one asset: its request history plus
// derived stats (total cost, downtime, recent failure count, cost-by-year,
// and whether it crosses either replacement-recommendation threshold).
export async function getAssetCaseFile(assetId: string) {
  const admin = createAdminClient();

  const { data: asset } = await admin
    .from("assets")
    .select(ASSET_SELECT)
    .eq("id", assetId)
    .maybeSingle<AssetRow>();
  if (!asset) return null;

  const { data: requests } = await admin
    .from("requests")
    .select("id, description, status, priority, cost, resolution_notes, created_at, completed_at")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .returns<AssetCaseFileRequest[]>();

  const history = requests ?? [];

  const totalCost = history.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  const totalDowntimeDays = history.reduce((sum, r) => {
    if (!r.completed_at) return sum;
    const days = (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000;
    return sum + Math.max(0, Math.round(days));
  }, 0);

  const recentCutoff = Date.now() - RECENT_FAILURE_WINDOW_DAYS * 86_400_000;
  const recentFailures = history.filter((r) => new Date(r.created_at).getTime() >= recentCutoff).length;

  const costByYear: { year: number; total: number }[] = Object.entries(
    history.reduce<Record<number, number>>((byYear, r) => {
      if (!r.cost) return byYear;
      const year = new Date(r.created_at).getFullYear();
      byYear[year] = (byYear[year] ?? 0) + r.cost;
      return byYear;
    }, {})
  )
    .map(([year, total]) => ({ year: Number(year), total }))
    .sort((a, b) => a.year - b.year);

  const repairToPurchaseRatio =
    asset.purchase_price && asset.purchase_price > 0 ? totalCost / asset.purchase_price : null;

  return {
    asset,
    history,
    totalCost,
    totalDowntimeDays,
    failureCount: history.length,
    recentFailures,
    suggestReplacement: recentFailures >= RECENT_FAILURE_THRESHOLD,
    costByYear,
    repairToPurchaseRatio,
    suggestReplacementByCost: repairToPurchaseRatio !== null && repairToPurchaseRatio >= REPAIR_COST_RATIO_THRESHOLD,
  };
}

export type FlaggedAsset = {
  id: string;
  name: string;
  homeId: string;
  homeName: string;
  failureCount: number;
  recentFailures: number;
  topCategory: string | null;
};

export type AssetTypeFailureCount = { assetType: string; count: number };

// Surveys every asset-linked request to spot patterns across the whole
// agency (or, unfiltered, the whole app): which individual assets are
// failing repeatedly right now, and which asset types generate the most
// requests overall. Powers the "Recurring Problems" sections on the admin
// reports page and the supervisor overview.
export async function getRecurringProblems(agencyId?: string) {
  const admin = createAdminClient();

  let query = admin
    .from("requests")
    .select("asset_id, category, created_at, assets!inner(id, name, agency_id, home_id, homes(name), asset_types(name))")
    .not("asset_id", "is", null);
  if (agencyId) query = query.eq("assets.agency_id", agencyId);

  const { data } = await query.returns<
    {
      asset_id: string;
      category: string;
      created_at: string;
      assets: {
        id: string;
        name: string;
        home_id: string;
        homes: { name: string } | null;
        asset_types: { name: string } | null;
      };
    }[]
  >();

  const rows = data ?? [];
  const recentCutoff = Date.now() - RECENT_FAILURE_WINDOW_DAYS * 86_400_000;

  const byAsset = new Map<
    string,
    { name: string; homeId: string; homeName: string; total: number; recent: number; categories: Record<string, number> }
  >();
  const byAssetType: Record<string, number> = {};

  for (const r of rows) {
    const typeName = r.assets.asset_types?.name ?? "Other";
    byAssetType[typeName] = (byAssetType[typeName] ?? 0) + 1;

    const entry = byAsset.get(r.asset_id) ?? {
      name: r.assets.name,
      homeId: r.assets.home_id,
      homeName: r.assets.homes?.name ?? "—",
      total: 0,
      recent: 0,
      categories: {},
    };
    entry.total += 1;
    if (new Date(r.created_at).getTime() >= recentCutoff) entry.recent += 1;
    entry.categories[r.category] = (entry.categories[r.category] ?? 0) + 1;
    byAsset.set(r.asset_id, entry);
  }

  const flaggedAssets: FlaggedAsset[] = Array.from(byAsset.entries())
    .filter(([, v]) => v.recent >= RECENT_FAILURE_THRESHOLD)
    .map(([id, v]) => ({
      id,
      name: v.name,
      homeId: v.homeId,
      homeName: v.homeName,
      failureCount: v.total,
      recentFailures: v.recent,
      topCategory:
        Object.entries(v.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.recentFailures - a.recentFailures);

  const assetTypeCounts: AssetTypeFailureCount[] = Object.entries(byAssetType)
    .map(([assetType, count]) => ({ assetType, count }))
    .sort((a, b) => b.count - a.count);

  return { flaggedAssets, assetTypeCounts, windowDays: RECENT_FAILURE_WINDOW_DAYS };
}

// --- Writes --------------------------------------------------------------

export type AssetInput = {
  home_id: string;
  asset_type_id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  location?: string;
  purchase_price?: number;
};

// Creates an asset under the given home; an agency_admin can only target a
// home in their own agency, while super_admin can target any home.
export async function createAsset(input: AssetInput) {
  const profile = await requireRole(["super_admin", "agency_admin"]);
  const admin = createAdminClient();

  const home =
    profile.role === "agency_admin"
      ? await requireHomeInAgency(admin, input.home_id, profile.agency_id!)
      : (
          await admin.from("homes").select("id, agency_id").eq("id", input.home_id).maybeSingle()
        ).data;

  if (!home) throw new Error("Choose a valid home.");

  const { data, error } = await admin
    .from("assets")
    .insert({
      agency_id: home.agency_id,
      home_id: input.home_id,
      asset_type_id: input.asset_type_id,
      name: input.name,
      manufacturer: input.manufacturer || null,
      model: input.model || null,
      serial_number: input.serial_number || null,
      location: input.location || null,
      purchase_price: input.purchase_price ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  assetPaths();
  return data;
}

// Updates an existing asset's fields; enforces that an agency_admin can only
// touch assets (and reassign to homes) within their own agency.
export async function updateAsset(id: string, input: AssetInput) {
  const profile = await requireRole(["super_admin", "agency_admin"]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireHomeInAgency(admin, input.home_id, profile.agency_id!);
    const { data: existing } = await admin.from("assets").select("agency_id").eq("id", id).maybeSingle();
    if (!existing || existing.agency_id !== profile.agency_id) {
      throw new Error("This asset isn't in your agency.");
    }
  }

  const { error } = await admin
    .from("assets")
    .update({
      home_id: input.home_id,
      asset_type_id: input.asset_type_id,
      name: input.name,
      manufacturer: input.manufacturer || null,
      model: input.model || null,
      serial_number: input.serial_number || null,
      location: input.location || null,
      purchase_price: input.purchase_price ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  assetPaths(id);
}

// Soft-deletes an asset (marks it retired rather than removing the row) so
// its request history and cost data remain intact
export async function retireAsset(id: string) {
  const profile = await requireRole(["super_admin", "agency_admin"]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    const { data: existing } = await admin.from("assets").select("agency_id").eq("id", id).maybeSingle();
    if (!existing || existing.agency_id !== profile.agency_id) {
      throw new Error("This asset isn't in your agency.");
    }
  }

  const { error } = await admin
    .from("assets")
    .update({ status: "retired", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  assetPaths(id);
}
