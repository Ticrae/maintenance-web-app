import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CompletedView, type CompletedRow } from "./completed-view";

export default async function CompletedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user!.id)
    .maybeSingle<{ agency_id: string | null }>();

  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("requests")
    .select("id, category, description, created_at, updated_at, homes(id, name)")
    .eq("assigned_to", user!.id)
    .eq("status", "Completed")
    .order("updated_at", { ascending: false })
    .returns<
      {
        id: string;
        category: string;
        description: string;
        created_at: string;
        updated_at: string;
        homes: { id: string; name: string } | null;
      }[]
    >();

  const rows = requests ?? [];
  const ids = rows.map((r) => r.id);

  const { data: photos } = ids.length
    ? await admin.from("request_photos").select("request_id").in("request_id", ids)
    : { data: [] };

  const photoCounts: Record<string, number> = {};
  for (const p of photos ?? []) {
    photoCounts[p.request_id] = (photoCounts[p.request_id] ?? 0) + 1;
  }

  const { data: homes } = profile?.agency_id
    ? await admin.from("homes").select("id, name").eq("agency_id", profile.agency_id).order("name")
    : { data: [] };

  const completed: CompletedRow[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    created_at: r.created_at,
    updated_at: r.updated_at,
    homeId: r.homes?.id ?? "",
    homeName: r.homes?.name ?? "—",
    photoCount: photoCounts[r.id] ?? 0,
  }));

  return <CompletedView completed={completed} homes={homes ?? []} />;
}
