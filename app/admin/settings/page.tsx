import { createClient } from "@/lib/supabase/server";
import { getAssetTypes, getGuides } from "@/app/actions/troubleshooting";
import { getAgencies } from "@/app/actions/homes";
import { getTemplates } from "@/app/actions/inspections";
import { SettingsShell } from "./settings-shell";
import type { AppSettings } from "./settings-form";

export const dynamic = "force-dynamic";

// Loads everything for the tabbed settings shell: platform settings,
// troubleshooting-guide authoring data (asset types/agencies/guides), and
// inspection-checklist authoring data (templates).
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories, sla_hours, updated_at")
    .eq("id", true)
    .maybeSingle<AppSettings>();

  const [assetTypes, agencies, guides, templates] = await Promise.all([
    getAssetTypes(),
    getAgencies(),
    getGuides(),
    getTemplates(),
  ]);

  return (
    <SettingsShell
      settings={settings}
      assetTypes={assetTypes}
      agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
      guides={guides}
      templates={templates}
    />
  );
}
