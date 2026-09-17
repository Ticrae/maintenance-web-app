import { getMaintenanceIntelligence } from "@/app/actions/intelligence";
import { MaintenanceIntelligence } from "@/components/maintenance-intelligence";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// Platform-wide "maintenance intelligence" insights (no agency scoping,
// unlike the supervisor version of this page), using the shared component
export default async function AdminIntelligencePage() {
  const dict = await getServerDictionary();
  const data = await getMaintenanceIntelligence();

  return <MaintenanceIntelligence title={dict.admin.nav.intelligence} data={data} assetBasePath="/admin/assets" />;
}
