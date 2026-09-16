import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContractors } from "@/app/actions/contractors";
import { getAgencies } from "@/app/actions/homes";
import { ContractorsView } from "@/components/contractors-view";

export const dynamic = "force-dynamic";

export default async function SupervisorContractorsPage() {
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

  const [contractors, agencies] = await Promise.all([
    agencyId ? getContractors(agencyId) : Promise.resolve([]),
    getAgencies(),
  ]);

  const myAgency = agencies.filter((a) => a.id === agencyId).map((a) => ({ id: a.id, name: a.name }));

  return <ContractorsView contractors={contractors} agencies={myAgency} namespace="supervisor" />;
}
