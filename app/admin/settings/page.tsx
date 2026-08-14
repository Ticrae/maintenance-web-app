import { createClient } from "@/lib/supabase/server";
import { SettingsForm, type AppSettings } from "./settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories, sla_hours, updated_at")
    .eq("id", true)
    .maybeSingle<AppSettings>();

  return <SettingsForm settings={settings} />;
}
