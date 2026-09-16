"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Priority } from "@/lib/theme";

export type TemplateStatus = "draft" | "published" | "archived";

// Template authoring: super_admin can manage any agency's checklists;
// agency_admin (supervisor) can manage their own agency's, same split as
// assets and contractors.
const AUTHOR_ROLES = ["super_admin", "agency_admin"] as const;
const RUNNER_ROLES = ["staff", "maintenance", "agency_admin"] as const;

function friendlyError(error: { code?: string; message: string }, fallback: string) {
  if (error.code === "23503") return fallback;
  return error.message;
}

function authoringPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/supervisor/inspections");
}

function runnerPaths() {
  revalidatePath("/staff/inspections");
  revalidatePath("/maintenance/inspections");
  revalidatePath("/supervisor/inspections");
}

// Confirms the given template belongs to the given agency — the ownership
// check every authoring write below applies for an agency_admin caller.
async function requireTemplateInAgency(
  admin: ReturnType<typeof createAdminClient>,
  templateId: string,
  agencyId: string
) {
  const { data: template } = await admin
    .from("inspection_templates")
    .select("id, agency_id")
    .eq("id", templateId)
    .maybeSingle();
  if (!template || template.agency_id !== agencyId) {
    throw new Error("This checklist isn't in your agency.");
  }
}

// Same check, but starting from an item id (looks up its parent template).
async function requireItemInAgency(admin: ReturnType<typeof createAdminClient>, itemId: string, agencyId: string) {
  const { data: item } = await admin
    .from("inspection_items")
    .select("template_id, inspection_templates(agency_id)")
    .eq("id", itemId)
    .maybeSingle<{ template_id: string; inspection_templates: { agency_id: string } | null }>();
  if (!item || item.inspection_templates?.agency_id !== agencyId) {
    throw new Error("This item isn't in your agency.");
  }
}

// --- Author templates -------------------------------------------------

export type TemplateListRow = {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
  agencies: { name: string } | null;
};

export async function getTemplates(agencyId?: string): Promise<(TemplateListRow & { itemCount: number })[]> {
  const admin = createAdminClient();
  let query = admin.from("inspection_templates").select("*, agencies(name)").order("updated_at", { ascending: false });
  if (agencyId) query = query.eq("agency_id", agencyId);

  const { data, error } = await query.returns<TemplateListRow[]>();

  if (error) {
    console.error("Failed to fetch inspection templates:", error);
    return [];
  }

  const templates = data ?? [];
  if (templates.length === 0) return [];

  const { data: items } = await admin
    .from("inspection_items")
    .select("template_id")
    .in("template_id", templates.map((t) => t.id));

  const counts: Record<string, number> = {};
  for (const i of items ?? []) counts[i.template_id] = (counts[i.template_id] ?? 0) + 1;

  return templates.map((t) => ({ ...t, itemCount: counts[t.id] ?? 0 }));
}

export type ItemRow = {
  id: string;
  template_id: string;
  section: string | null;
  label: string;
  sort_order: number;
};

export type TemplateDetail = TemplateListRow & { items: ItemRow[] };

export async function getTemplateDetail(id: string): Promise<TemplateDetail | null> {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  const { data: template, error } = await admin
    .from("inspection_templates")
    .select("*, agencies(name)")
    .eq("id", id)
    .maybeSingle<TemplateListRow>();
  if (error || !template) return null;
  if (profile.role === "agency_admin" && template.agency_id !== profile.agency_id) return null;

  const { data: items } = await admin
    .from("inspection_items")
    .select("*")
    .eq("template_id", id)
    .order("sort_order")
    .returns<ItemRow[]>();

  return { ...template, items: items ?? [] };
}

export async function createTemplate(input: { agency_id: string; name: string; description?: string }) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  if (profile.role === "agency_admin" && input.agency_id !== profile.agency_id) {
    throw new Error("Choose your own agency.");
  }
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("inspection_templates")
    .insert({
      agency_id: input.agency_id,
      name: input.name,
      description: input.description || null,
      created_by: profile.id,
      status: "draft",
    })
    .select("*, agencies(name)")
    .single<TemplateListRow>();

  if (error) throw new Error(error.message);

  authoringPaths();
  return data;
}

export async function updateTemplateMeta(
  id: string,
  input: { name: string; description?: string; status: TemplateStatus; agency_id: string }
) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireTemplateInAgency(admin, id, profile.agency_id!);
    if (input.agency_id !== profile.agency_id) throw new Error("Choose your own agency.");
  }

  const { error } = await admin
    .from("inspection_templates")
    .update({
      name: input.name,
      description: input.description || null,
      status: input.status,
      agency_id: input.agency_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  authoringPaths();
}

export async function deleteTemplate(id: string) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireTemplateInAgency(admin, id, profile.agency_id!);
  }

  const { count } = await admin
    .from("inspection_runs")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id);
  if (count && count > 0) {
    throw new Error("This template already has inspection runs recorded — archive it instead of deleting.");
  }

  const { error } = await admin.from("inspection_templates").delete().eq("id", id);
  if (error) {
    throw new Error(friendlyError(error, "Could not delete this template."));
  }

  authoringPaths();
}

export async function createItem(input: { template_id: string; section?: string; label: string }) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireTemplateInAgency(admin, input.template_id, profile.agency_id!);
  }

  const { data: existing } = await admin
    .from("inspection_items")
    .select("sort_order")
    .eq("template_id", input.template_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await admin.from("inspection_items").insert({
    template_id: input.template_id,
    section: input.section || null,
    label: input.label,
    sort_order: nextOrder,
  });

  if (error) throw new Error(error.message);

  authoringPaths();
}

export async function updateItem(id: string, input: { section?: string; label: string }) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireItemInAgency(admin, id, profile.agency_id!);
  }

  const { error } = await admin
    .from("inspection_items")
    .update({ section: input.section || null, label: input.label })
    .eq("id", id);

  if (error) throw new Error(error.message);

  authoringPaths();
}

export async function deleteItem(id: string) {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireItemInAgency(admin, id, profile.agency_id!);
  }

  const { error } = await admin.from("inspection_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  authoringPaths();
}

export async function moveItem(id: string, template_id: string, direction: "up" | "down") {
  const profile = await requireRole([...AUTHOR_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    await requireTemplateInAgency(admin, template_id, profile.agency_id!);
  }

  const { data: current } = await admin
    .from("inspection_items")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!current) return;

  const neighborOrder = direction === "up" ? current.sort_order - 1 : current.sort_order + 1;
  const { data: neighbor } = await admin
    .from("inspection_items")
    .select("id, sort_order")
    .eq("template_id", template_id)
    .eq("sort_order", neighborOrder)
    .maybeSingle();
  if (!neighbor) return;

  await admin.from("inspection_items").update({ sort_order: neighbor.sort_order }).eq("id", current.id);
  await admin.from("inspection_items").update({ sort_order: current.sort_order }).eq("id", neighbor.id);

  authoringPaths();
}

// --- Running inspections ---------------------------------------------------
//
// Everything below is for staff/maintenance/agency_admin walking a published
// template at one of their agency's homes.

export type RunnableTemplate = { id: string; name: string; description: string | null; itemCount: number };

export async function getRunnableTemplates(): Promise<RunnableTemplate[]> {
  const profile = await requireRole([...RUNNER_ROLES]);
  if (!profile.agency_id) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inspection_templates")
    .select("id, name, description")
    .eq("status", "published")
    .eq("agency_id", profile.agency_id)
    .order("name");

  if (error) {
    console.error("Failed to fetch runnable templates:", error);
    return [];
  }

  const templates = data ?? [];
  if (templates.length === 0) return [];

  const { data: items } = await admin
    .from("inspection_items")
    .select("template_id")
    .in("template_id", templates.map((t) => t.id));

  const counts: Record<string, number> = {};
  for (const i of items ?? []) counts[i.template_id] = (counts[i.template_id] ?? 0) + 1;

  return templates
    .filter((t) => (counts[t.id] ?? 0) > 0)
    .map((t) => ({ ...t, itemCount: counts[t.id] ?? 0 }));
}

export async function startRun(templateId: string, homeId: string) {
  const profile = await requireRole([...RUNNER_ROLES]);
  if (!profile.agency_id) throw new Error("Your account isn't linked to an agency yet.");

  const admin = createAdminClient();

  const { data: home } = await admin
    .from("homes")
    .select("id")
    .eq("id", homeId)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();
  if (!home) throw new Error("Choose a valid home.");

  const { data: template } = await admin
    .from("inspection_templates")
    .select("id")
    .eq("id", templateId)
    .eq("agency_id", profile.agency_id)
    .eq("status", "published")
    .maybeSingle();
  if (!template) throw new Error("Choose a valid checklist.");

  const { data, error } = await admin
    .from("inspection_runs")
    .insert({
      template_id: templateId,
      agency_id: profile.agency_id,
      home_id: homeId,
      performed_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  runnerPaths();
  return data.id as string;
}

export type ResultRow = { item_id: string; passed: boolean; notes: string | null; request_id: string | null };

export type RunDetail = {
  id: string;
  status: "in_progress" | "completed";
  homeName: string;
  template: { id: string; name: string; description: string | null };
  items: ItemRow[];
  results: ResultRow[];
};

export async function getRun(runId: string): Promise<RunDetail | null> {
  const profile = await requireRole([...RUNNER_ROLES]);
  const admin = createAdminClient();

  const { data: run } = await admin
    .from("inspection_runs")
    .select("id, status, performed_by, template_id, homes(name), inspection_templates(id, name, description)")
    .eq("id", runId)
    .maybeSingle<{
      id: string;
      status: "in_progress" | "completed";
      performed_by: string;
      template_id: string;
      homes: { name: string } | null;
      inspection_templates: { id: string; name: string; description: string | null } | null;
    }>();

  if (!run || run.performed_by !== profile.id || !run.inspection_templates) return null;

  const { data: items } = await admin
    .from("inspection_items")
    .select("*")
    .eq("template_id", run.template_id)
    .order("sort_order")
    .returns<ItemRow[]>();

  const { data: results } = await admin
    .from("inspection_results")
    .select("item_id, passed, notes, request_id")
    .eq("run_id", runId)
    .returns<ResultRow[]>();

  return {
    id: run.id,
    status: run.status,
    homeName: run.homes?.name ?? "—",
    template: run.inspection_templates,
    items: items ?? [],
    results: results ?? [],
  };
}

async function requireOwnRun(admin: ReturnType<typeof createAdminClient>, runId: string, performerId: string) {
  const { data: run } = await admin
    .from("inspection_runs")
    .select("id, performed_by, status, home_id, agency_id, template_id, inspection_templates(name)")
    .eq("id", runId)
    .maybeSingle<{
      id: string;
      performed_by: string;
      status: string;
      home_id: string;
      agency_id: string;
      template_id: string;
      inspection_templates: { name: string } | null;
    }>();

  if (!run || run.performed_by !== performerId) throw new Error("This inspection isn't yours to update.");
  if (run.status !== "in_progress") throw new Error("This inspection is already completed.");
  return run;
}

export async function recordResult(runId: string, itemId: string, input: { passed: boolean; notes?: string }) {
  const profile = await requireRole([...RUNNER_ROLES]);
  const admin = createAdminClient();
  await requireOwnRun(admin, runId, profile.id);

  const { error } = await admin
    .from("inspection_results")
    .upsert(
      { run_id: runId, item_id: itemId, passed: input.passed, notes: input.notes?.trim() || null },
      { onConflict: "run_id,item_id" }
    );

  if (error) throw new Error(error.message);

  runnerPaths();
}

export async function failItemAndCreateRequest(
  runId: string,
  itemId: string,
  input: { notes: string; category: string; priority: Priority }
) {
  const profile = await requireRole([...RUNNER_ROLES]);
  const admin = createAdminClient();
  const run = await requireOwnRun(admin, runId, profile.id);

  const { data: item } = await admin.from("inspection_items").select("label").eq("id", itemId).maybeSingle();
  if (!item) throw new Error("Item not found.");

  const description = [item.label, `Inspection: ${run.inspection_templates?.name ?? ""}`, input.notes.trim()]
    .filter(Boolean)
    .join("\n");

  const { data: request, error: requestError } = await admin
    .from("requests")
    .insert({
      agency_id: run.agency_id,
      home_id: run.home_id,
      category: input.category,
      priority: input.priority,
      status: "Open",
      description,
      reported_by: profile.id,
    })
    .select("id")
    .single();

  if (requestError) throw new Error(requestError.message);

  const { error: resultError } = await admin
    .from("inspection_results")
    .upsert(
      { run_id: runId, item_id: itemId, passed: false, notes: input.notes.trim() || null, request_id: request.id },
      { onConflict: "run_id,item_id" }
    );

  if (resultError) throw new Error(resultError.message);

  runnerPaths();
  revalidatePath("/admin/requests");
  revalidatePath("/supervisor/requests");
  revalidatePath("/maintenance");

  return request.id as string;
}

export async function completeRun(runId: string) {
  const profile = await requireRole([...RUNNER_ROLES]);
  const admin = createAdminClient();
  const run = await requireOwnRun(admin, runId, profile.id);

  const { data: items } = await admin.from("inspection_items").select("id").eq("template_id", run.template_id);
  const { data: results } = await admin.from("inspection_results").select("item_id").eq("run_id", runId);

  const answeredIds = new Set((results ?? []).map((r) => r.item_id));
  const unanswered = (items ?? []).filter((i) => !answeredIds.has(i.id));
  if (unanswered.length > 0) {
    throw new Error("Every item needs a Pass or Fail before you can finish.");
  }

  const { error } = await admin
    .from("inspection_runs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw new Error(error.message);

  runnerPaths();
}

export type RunHistoryRow = {
  id: string;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
  homes: { name: string } | null;
  inspection_templates: { name: string } | null;
};

export async function getRunHistory(): Promise<RunHistoryRow[]> {
  const profile = await requireRole([...RUNNER_ROLES]);
  if (!profile.agency_id) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inspection_runs")
    .select("id, status, started_at, completed_at, homes(name), inspection_templates(name)")
    .eq("agency_id", profile.agency_id)
    .eq("performed_by", profile.id)
    .order("started_at", { ascending: false })
    .limit(25)
    .returns<RunHistoryRow[]>();

  if (error) {
    console.error("Failed to fetch inspection run history:", error);
    return [];
  }

  return data ?? [];
}
