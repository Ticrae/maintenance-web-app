"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsState = { error?: string } | undefined;

// Updates the single platform-wide settings row (request categories + SLA
// hours per priority). Super-admin only; returns an error object rather than
// throwing so the settings form can display it inline.
export async function updateSettings(_: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireSuperAdmin();

  const categories = String(formData.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (categories.length === 0) return { error: "Add at least one category." };

  const slaHours: Record<string, number> = {};
  for (const priority of ["Urgent", "High", "Medium", "Low"]) {
    const raw = Number(formData.get(`sla_${priority}`));
    if (!Number.isFinite(raw) || raw <= 0) {
      return { error: `Enter a valid SLA target for ${priority}.` };
    }
    slaHours[priority] = raw;
  }

  // app_settings is a singleton table with a single row keyed by id=true
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ categories, sla_hours: slaHours, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return undefined;
}
