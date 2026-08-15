import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomes } from "@/app/actions/homes";
import { nowMs } from "@/lib/date";
import { StaffSidebar } from "./staff-sidebar";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, home_id")
    .eq("id", user!.id)
    .maybeSingle<{ first_name: string | null; home_id: string | null }>();

  const homeId = profile?.home_id ?? null;
  const homes = await getHomes();
  const home = homes.find((h) => h.id === homeId);

  const admin = createAdminClient();
  const { data: requests } = homeId
    ? await admin.from("requests").select("id, status").eq("home_id", homeId)
    : { data: [] };

  const rows = requests ?? [];
  const openCount = rows.filter((r) => r.status === "Open").length;
  const inProgressCount = rows.filter(
    (r) =>
      r.status === "Assigned" ||
      r.status === "In Progress" ||
      r.status === "Waiting for Parts",
  ).length;
  const completedCount = rows.filter((r) => r.status === "Completed").length;

  const dayAgo = new Date(nowMs() - 24 * 3600_000).toISOString();
  const requestIds = rows.map((r) => r.id);
  const { count: recentComments } = requestIds.length
    ? await admin
        .from("request_comments")
        .select("id", { count: "exact", head: true })
        .in("request_id", requestIds)
        .gte("created_at", dayAgo)
    : { count: 0 };

  const name = profile?.first_name || "You";

  return (
    <div className="flex min-h-screen w-full md:h-screen">
      <StaffSidebar
        totalRequests={rows.length}
        openCount={openCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        recentActivityCount={recentComments ?? 0}
        name={name}
        subtitle={home?.name ?? "No home assigned"}
        initials={
          name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) || "?"
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
