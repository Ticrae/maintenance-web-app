import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MaintenanceSidebar } from "./maintenance-sidebar";

const ACTIVE_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, agency_id")
    .eq("id", user!.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      agency_id: string | null;
    }>();

  const agencyId = profile?.agency_id ?? null;
  const admin = createAdminClient();

  const { data: agency } = agencyId
    ? await admin.from("agencies").select("name").eq("id", agencyId).maybeSingle<{ name: string }>()
    : { data: null };

  const { count: queueCount } = agencyId
    ? await admin
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .in("status", ACTIVE_STATUSES)
    : { count: 0 };

  const { count: myJobsCount } = await admin
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", user!.id)
    .in("status", ["Assigned", "In Progress", "Waiting for Parts"]);

  const { count: completedCount } = await admin
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", user!.id)
    .eq("status", "Completed");

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "You";

  return (
    <div className="flex min-h-screen w-full md:h-screen">
      <MaintenanceSidebar
        queueCount={queueCount ?? 0}
        myJobsCount={myJobsCount ?? 0}
        completedCount={completedCount ?? 0}
        name={name}
        subtitle={agency?.name ?? "Maintenance"}
        initials={name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
      />
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}
