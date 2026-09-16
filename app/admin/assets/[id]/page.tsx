import { getAssetCaseFile } from "@/app/actions/assets";
import { AssetCaseFile } from "@/components/asset-case-file";

export const dynamic = "force-dynamic";

export default async function AdminAssetCaseFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAssetCaseFile(id);

  return <AssetCaseFile data={data} backHref="/admin/assets" />;
}
