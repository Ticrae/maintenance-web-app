import { createClient } from "@/lib/supabase/server";
import { getHomes, getAgencies } from "@/app/actions/homes";
import { getRunnableTemplates, getRunHistory, getTemplates } from "@/app/actions/inspections";
import { SupervisorInspectionsShell } from "./inspections-shell";
import { getServerDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

const FALLBACK_CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Structural", "Other"];

export const dynamic = "force-dynamic";

// Unlike staff/maintenance, supervisor also gets checklist-authoring
// (InspectionManager), so this loads both run data and template data and
// hands off to a shell that tabs between the two.
export default async function SupervisorInspectionsPage() {
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

  const agencyId = profile?.agency_id ?? null;

  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories")
    .eq("id", true)
    .maybeSingle<{ categories: string[] }>();

  const allHomes = await getHomes();
  const homes = allHomes
    .filter((h) => h.agency_id === agencyId)
    .map((h) => ({ id: h.id, name: h.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [runnable, history, allAgencies, templates] = await Promise.all([
    getRunnableTemplates(),
    getRunHistory(),
    getAgencies(),
    agencyId ? getTemplates(agencyId) : Promise.resolve([]),
  ]);

  const myAgency = allAgencies.filter((a) => a.id === agencyId).map((a) => ({ id: a.id, name: a.name }));

  return (
    <SupervisorInspectionsShell
      title={dict.supervisor.nav.inspections}
      runnable={runnable}
      history={history}
      homes={homes}
      defaultHomeId=""
      categories={settings?.categories ?? FALLBACK_CATEGORIES}
      agencies={myAgency}
      templates={templates}
    />
  );
}
