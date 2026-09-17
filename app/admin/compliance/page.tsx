import { getComplianceSummary } from "@/app/actions/compliance";
import { getHomes } from "@/app/actions/homes";
import { ComplianceView } from "@/components/compliance-view";

export const dynamic = "force-dynamic";

// Platform-wide compliance dashboard, using the shared ComplianceView (unscoped)
export default async function AdminCompliancePage() {
  const [summary, homes] = await Promise.all([getComplianceSummary(), getHomes()]);

  return (
    <ComplianceView
      summary={summary}
      homes={homes.map((h) => ({ id: h.id, name: h.name })).sort((a, b) => a.name.localeCompare(b.name))}
      namespace="admin"
    />
  );
}
