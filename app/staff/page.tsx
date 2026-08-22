import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomes } from "@/app/actions/homes";
import { getServerDictionary } from "@/lib/i18n/server";
import { MyRequestsTable, type StaffRequestRow } from "./requests-table";

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const dict = await getServerDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_id")
    .eq("id", user!.id)
    .maybeSingle<{ home_id: string | null }>();

  const homeId = profile?.home_id ?? null;
  const homes = await getHomes();
  const home = homes.find((h) => h.id === homeId);

  const admin = createAdminClient();

  const { data: requests } = homeId
    ? await admin
        .from("requests")
        .select("id, category, priority, status, description, created_at, updated_at")
        .eq("home_id", homeId)
        .order("created_at", { ascending: false })
        .returns<Omit<StaffRequestRow, "photoCount">[]>()
    : { data: [] };

  const rows = requests ?? [];
  const ids = rows.map((r) => r.id);

  const { data: photos } = ids.length
    ? await admin.from("request_photos").select("request_id").in("request_id", ids)
    : { data: [] };

  const photoCounts: Record<string, number> = {};
  for (const p of photos ?? []) {
    photoCounts[p.request_id] = (photoCounts[p.request_id] ?? 0) + 1;
  }

  const withPhotos: StaffRequestRow[] = rows.map((r) => ({
    ...r,
    photoCount: photoCounts[r.id] ?? 0,
  }));

  const completed = rows.filter((r) => r.status === "Completed");
  const avgResponseMs =
    completed.length > 0
      ? completed.reduce(
          (sum, r) => sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()),
          0
        ) / completed.length
      : null;

  return (
    <MyRequestsTable
      requests={withPhotos}
      homeName={home?.name ?? dict.staff.layout.noHomeAssigned}
      avgResponseMs={avgResponseMs}
      statusFilter={status}
    />
  );
}
