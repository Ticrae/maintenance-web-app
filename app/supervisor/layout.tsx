import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupervisorSidebar } from "./supervisor-sidebar";
import { MobileUserBar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { getServerDictionary } from "@/lib/i18n/server";

const ACTIVE_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getServerDictionary();
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

  const { count: openCount } = agencyId
    ? await admin
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .in("status", ACTIVE_STATUSES)
    : { count: 0 };

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || dict.supervisor.layout.you;
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  const subtitle = agency?.name ?? dict.common.role.agency_admin;

  return (
    <div className="supervisor-shell flex min-h-screen w-full flex-col md:h-screen md:flex-row">
      <SupervisorSidebar
        openCount={openCount ?? 0}
        name={name}
        subtitle={subtitle}
        initials={initials}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {children}
        <MobileUserBar
          initials={initials}
          name={name}
          subtitle={subtitle}
          actions={<SignOutButton inverted />}
        />
      </div>
    </div>
  );
}
