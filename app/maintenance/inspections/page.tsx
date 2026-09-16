import { createClient } from "@/lib/supabase/server";
import { getHomes } from "@/app/actions/homes";
import { getRunnableTemplates, getRunHistory } from "@/app/actions/inspections";
import { InspectionRunner } from "@/components/inspection-runner";
import { getServerDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

const FALLBACK_CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Structural", "Other"];

export const dynamic = "force-dynamic";

export default async function MaintenanceInspectionsPage() {
  const dict = await getServerDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle<{ agency_id: string | null }>();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories")
    .eq("id", true)
    .maybeSingle<{ categories: string[] }>();

  const allHomes = await getHomes();
  const homes = allHomes
    .filter((h) => h.agency_id === profile?.agency_id)
    .map((h) => ({ id: h.id, name: h.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [runnable, history] = await Promise.all([getRunnableTemplates(), getRunHistory()]);

  return (
    <InspectionRunner
      title={dict.maintenance.nav.inspections}
      runnable={runnable}
      history={history}
      homes={homes}
      defaultHomeId=""
      categories={settings?.categories ?? FALLBACK_CATEGORIES}
    />
  );
}
