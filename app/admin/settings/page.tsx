import { createClient } from "@/lib/supabase/server";
import { getAssetTypes, getGuides } from "@/app/actions/troubleshooting";
import { getAgencies } from "@/app/actions/homes";
import { SettingsShell } from "./settings-shell";
import type { AppSettings } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories, sla_hours, updated_at")
    .eq("id", true)
    .maybeSingle<AppSettings>();

  const [assetTypes, agencies, guides] = await Promise.all([
    getAssetTypes(),
    getAgencies(),
    getGuides(),
  ]);

  return (
    <SettingsShell
      settings={settings}
      assetTypes={assetTypes}
      agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
      guides={guides}
    />
  );
}
