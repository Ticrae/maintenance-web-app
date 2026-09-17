import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssetCaseFile } from "@/app/actions/assets";
import { AssetCaseFile } from "@/components/asset-case-file";

export const dynamic = "force-dynamic";

// Single-asset case file, scoped to the supervisor's own agency (shows "not
// found" via a null `data` prop if the asset belongs to another agency)
export default async function SupervisorAssetCaseFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const data = await getAssetCaseFile(id);
  // Scope to the supervisor's own agency, same as the rest of /supervisor.
  const scoped = data && data.asset.agency_id === profile?.agency_id ? data : null;

  return <AssetCaseFile data={scoped} backHref="/supervisor/assets" />;
}
