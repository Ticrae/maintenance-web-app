import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceIntelligence } from "@/app/actions/intelligence";
import { MaintenanceIntelligence } from "@/components/maintenance-intelligence";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// Supervisor's own agency's "maintenance intelligence" insights, using the shared component
export default async function SupervisorIntelligencePage() {
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
  const data = await getMaintenanceIntelligence(agencyId ?? undefined);

  return <MaintenanceIntelligence title={dict.supervisor.nav.intelligence} data={data} assetBasePath="/supervisor/assets" />;
}
