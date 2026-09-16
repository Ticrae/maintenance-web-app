import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssets } from "@/app/actions/assets";
import { getAssetTypes } from "@/app/actions/troubleshooting";
import { getHomes } from "@/app/actions/homes";
import { AssetsView } from "@/components/assets-view";

export const dynamic = "force-dynamic";

export default async function SupervisorAssetsPage() {
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

  const [assets, assetTypes, allHomes] = await Promise.all([
    agencyId ? getAssets(agencyId) : Promise.resolve([]),
    getAssetTypes(),
    getHomes(),
  ]);

  const homes = allHomes
    .filter((h) => h.agency_id === agencyId)
    .map((h) => ({ id: h.id, name: h.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AssetsView
      assets={assets}
      homes={homes}
      assetTypes={assetTypes.map((t) => ({ id: t.id, name: t.name }))}
      basePath="/supervisor/assets"
      namespace="supervisor"
    />
  );
}
