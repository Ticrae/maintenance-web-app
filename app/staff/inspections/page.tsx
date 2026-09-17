import { createClient } from "@/lib/supabase/server";
import { getHomes } from "@/app/actions/homes";
import { getRunnableTemplates, getRunHistory } from "@/app/actions/inspections";
import { InspectionRunner } from "@/components/inspection-runner";
import { getServerDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

const FALLBACK_CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Structural", "Other"];

export const dynamic = "force-dynamic";

// Staff-facing inspections page: loads the checklists runnable at their
// agency's homes plus their own run history, and hands off to the shared
// InspectionRunner component.
export default async function StaffInspectionsPage() {
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
    .select("agency_id, home_id")
    .eq("id", user.id)
    .maybeSingle<{ agency_id: string | null; home_id: string | null }>();

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
      title={dict.staff.nav.inspections}
      runnable={runnable}
      history={history}
      homes={homes}
      defaultHomeId={profile?.home_id ?? ""}
      categories={settings?.categories ?? FALLBACK_CATEGORIES}
    />
  );
}
