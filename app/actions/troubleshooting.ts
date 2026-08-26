"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SafetyLevel, GuideStatus } from "@/lib/theme";

export type StepType = "instruction" | "question" | "information";
export type StepAction = "continue" | "create_request" | "finish" | "stop";

const SETTINGS_PATH = "/admin/settings";

function friendlyError(error: { code?: string; message: string }, fallback: string) {
  if (error.code === "23503") return fallback;
  return error.message;
}

// --- Asset types ---------------------------------------------------------

export async function getAssetTypes() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("asset_types").select("*").order("name");
  if (error) {
    console.error("Failed to fetch asset types:", error);
    return [];
  }
  return data ?? [];
}

export async function createAssetType(input: { name: string; description?: string }) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("asset_types")
    .insert({ name: input.name, description: input.description || null })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
  return data;
}

export async function updateAssetType(id: string, input: { name: string; description?: string }) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("asset_types")
    .update({
      name: input.name,
      description: input.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function deleteAssetType(id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("asset_types").delete().eq("id", id);
  if (error) {
    throw new Error(
      friendlyError(error, "This asset type is still used by a guide or asset. Remove those first.")
    );
  }

  revalidatePath(SETTINGS_PATH);
}

// --- Guides ----------------------------------------------------------------

export type GuideListRow = {
  id: string;
  agency_id: string;
  asset_type_id: string;
  problem: string;
  title: string;
  description: string | null;
  status: GuideStatus;
  version: number;
  created_at: string;
  updated_at: string;
  asset_types: { name: string } | null;
  agencies: { name: string } | null;
};

export async function getGuides(): Promise<(GuideListRow & { stepCount: number })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("troubleshooting_guides")
    .select("*, asset_types(name), agencies(name)")
    .order("updated_at", { ascending: false })
    .returns<GuideListRow[]>();

  if (error) {
    console.error("Failed to fetch guides:", error);
    return [];
  }

  const guides = data ?? [];
  if (guides.length === 0) return [];

  const { data: steps } = await admin
    .from("troubleshooting_steps")
    .select("guide_id")
    .in(
      "guide_id",
      guides.map((g) => g.id)
    );

  const counts: Record<string, number> = {};
  for (const s of steps ?? []) counts[s.guide_id] = (counts[s.guide_id] ?? 0) + 1;

  return guides.map((g) => ({ ...g, stepCount: counts[g.id] ?? 0 }));
}

export async function createGuide(input: {
  agency_id: string;
  asset_type_id: string;
  problem: string;
  title: string;
  description?: string;
}) {
  const profile = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("troubleshooting_guides")
    .insert({
      agency_id: input.agency_id,
      asset_type_id: input.asset_type_id,
      problem: input.problem,
      title: input.title,
      description: input.description || null,
      created_by: profile.id,
      status: "draft",
    })
    .select("*, asset_types(name), agencies(name)")
    .single<GuideListRow>();

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
  return data;
}

export async function updateGuideMeta(
  id: string,
  input: {
    title: string;
    problem: string;
    description?: string;
    status: GuideStatus;
    asset_type_id: string;
    agency_id: string;
  }
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("troubleshooting_guides")
    .update({
      title: input.title,
      problem: input.problem,
      description: input.description || null,
      status: input.status,
      asset_type_id: input.asset_type_id,
      agency_id: input.agency_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function deleteGuide(id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: steps } = await admin.from("troubleshooting_steps").select("id").eq("guide_id", id);
  const stepIds = (steps ?? []).map((s) => s.id);

  if (stepIds.length) {
    await admin.from("troubleshooting_options").delete().in("step_id", stepIds);
    await admin.from("troubleshooting_steps").delete().eq("guide_id", id);
  }

  const { error } = await admin.from("troubleshooting_guides").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

// --- Guide detail (steps + options) ----------------------------------------

export type OptionRow = {
  id: string;
  step_id: string;
  label: string;
  next_step_id: string | null;
  action: StepAction | null;
};

export type StepRow = {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  instruction: string;
  question: string | null;
  step_type: StepType;
  safety_level: SafetyLevel;
  options: OptionRow[];
};

export type GuideDetail = GuideListRow & { steps: StepRow[] };

export async function getGuideDetail(id: string): Promise<GuideDetail | null> {
  const admin = createAdminClient();

  const { data: guide, error } = await admin
    .from("troubleshooting_guides")
    .select("*, asset_types(name), agencies(name)")
    .eq("id", id)
    .maybeSingle<GuideListRow>();

  if (error || !guide) return null;

  const { data: steps } = await admin
    .from("troubleshooting_steps")
    .select("*")
    .eq("guide_id", id)
    .order("step_number")
    .returns<Omit<StepRow, "options">[]>();

  const stepRows = steps ?? [];
  const stepIds = stepRows.map((s) => s.id);

  const { data: options } = stepIds.length
    ? await admin
        .from("troubleshooting_options")
        .select("*")
        .in("step_id", stepIds)
        .returns<OptionRow[]>()
    : { data: [] };

  const optionsByStep: Record<string, OptionRow[]> = {};
  for (const o of options ?? []) {
    (optionsByStep[o.step_id] ??= []).push(o);
  }

  return {
    ...guide,
    steps: stepRows.map((s) => ({ ...s, options: optionsByStep[s.id] ?? [] })),
  };
}

// --- Steps -------------------------------------------------------------

export async function createStep(input: {
  guide_id: string;
  title: string;
  instruction: string;
  question?: string;
  step_type: StepType;
  safety_level: SafetyLevel;
}) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("troubleshooting_steps")
    .select("step_number")
    .eq("guide_id", input.guide_id)
    .order("step_number", { ascending: false })
    .limit(1);

  const nextNumber = (existing?.[0]?.step_number ?? 0) + 1;

  const { error } = await admin.from("troubleshooting_steps").insert({
    guide_id: input.guide_id,
    step_number: nextNumber,
    title: input.title,
    instruction: input.instruction,
    question: input.question || null,
    step_type: input.step_type,
    safety_level: input.safety_level,
  });

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function updateStep(
  id: string,
  input: {
    title: string;
    instruction: string;
    question?: string;
    step_type: StepType;
    safety_level: SafetyLevel;
  }
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("troubleshooting_steps")
    .update({
      title: input.title,
      instruction: input.instruction,
      question: input.question || null,
      step_type: input.step_type,
      safety_level: input.safety_level,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function deleteStep(id: string, guide_id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  await admin.from("troubleshooting_options").delete().eq("step_id", id);
  await admin.from("troubleshooting_options").update({ next_step_id: null }).eq("next_step_id", id);

  const { data: deleted } = await admin
    .from("troubleshooting_steps")
    .select("step_number")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("troubleshooting_steps").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (deleted) {
    const { data: rest } = await admin
      .from("troubleshooting_steps")
      .select("id, step_number")
      .eq("guide_id", guide_id)
      .gt("step_number", deleted.step_number)
      .order("step_number");

    for (const s of rest ?? []) {
      await admin
        .from("troubleshooting_steps")
        .update({ step_number: s.step_number - 1 })
        .eq("id", s.id);
    }
  }

  revalidatePath(SETTINGS_PATH);
}

export async function moveStep(id: string, guide_id: string, direction: "up" | "down") {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("troubleshooting_steps")
    .select("id, step_number")
    .eq("id", id)
    .maybeSingle();
  if (!current) return;

  const neighborNumber = direction === "up" ? current.step_number - 1 : current.step_number + 1;
  const { data: neighbor } = await admin
    .from("troubleshooting_steps")
    .select("id, step_number")
    .eq("guide_id", guide_id)
    .eq("step_number", neighborNumber)
    .maybeSingle();
  if (!neighbor) return;

  await admin.from("troubleshooting_steps").update({ step_number: neighbor.step_number }).eq("id", current.id);
  await admin.from("troubleshooting_steps").update({ step_number: current.step_number }).eq("id", neighbor.id);

  revalidatePath(SETTINGS_PATH);
}

// --- Options -------------------------------------------------------------

export async function createOption(input: {
  step_id: string;
  label: string;
  next_step_id?: string | null;
  action: StepAction;
}) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("troubleshooting_options").insert({
    step_id: input.step_id,
    label: input.label,
    next_step_id: input.action === "continue" ? input.next_step_id || null : null,
    action: input.action,
  });

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function updateOption(
  id: string,
  input: { label: string; next_step_id?: string | null; action: StepAction }
) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("troubleshooting_options")
    .update({
      label: input.label,
      next_step_id: input.action === "continue" ? input.next_step_id || null : null,
      action: input.action,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}

export async function deleteOption(id: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("troubleshooting_options").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(SETTINGS_PATH);
}
