import { getContractors } from "@/app/actions/contractors";
import { getAgencies } from "@/app/actions/homes";
import { ContractorsView } from "@/components/contractors-view";

export const dynamic = "force-dynamic";

// Platform-wide contractor directory, using the shared ContractorsView (unscoped)
export default async function AdminContractorsPage() {
  const [contractors, agencies] = await Promise.all([getContractors(), getAgencies()]);

  return (
    <ContractorsView
      contractors={contractors}
      agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
      namespace="admin"
    />
  );
}
