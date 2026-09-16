import { getAssets } from "@/app/actions/assets";
import { getAssetTypes } from "@/app/actions/troubleshooting";
import { getHomes } from "@/app/actions/homes";
import { AssetsView } from "@/components/assets-view";

export const dynamic = "force-dynamic";

export default async function AdminAssetsPage() {
  const [assets, assetTypes, homes] = await Promise.all([
    getAssets(),
    getAssetTypes(),
    getHomes(),
  ]);

  return (
    <AssetsView
      assets={assets}
      homes={homes.map((h) => ({ id: h.id, name: h.name })).sort((a, b) => a.name.localeCompare(b.name))}
      assetTypes={assetTypes.map((t) => ({ id: t.id, name: t.name }))}
      basePath="/admin/assets"
      namespace="admin"
    />
  );
}
