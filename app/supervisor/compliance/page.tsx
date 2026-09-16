import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getComplianceSummary } from "@/app/actions/compliance";
import { getHomes } from "@/app/actions/homes";
import { ComplianceView } from "@/components/compliance-view";

export const dynamic = "force-dynamic";

export default async function SupervisorCompliancePage() {
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

  const [summary, allHomes] = await Promise.all([
    agencyId ? getComplianceSummary(agencyId) : Promise.resolve({
      completedCount: 0,
      notesRate: null,
      photoRate: null,
      criticalCount: 0,
      criticalDocumentedRate: null,
      photoCount: 0,
      staleInspectionCount: 0,
    }),
    getHomes(),
  ]);

  const homes = allHomes
    .filter((h) => h.agency_id === agencyId)
    .map((h) => ({ id: h.id, name: h.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <ComplianceView summary={summary} homes={homes} namespace="supervisor" />;
}
