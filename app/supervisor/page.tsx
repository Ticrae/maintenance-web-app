import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { PriorityBadge } from "@/components/ui/badges";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { SignOutButton } from "@/components/sign-out-button";
import { getServerDictionary } from "@/lib/i18n/server";

const ACTIVE_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

export default async function SupervisorPage() {
  const dict = await getServerDictionary();
  const t = dict.supervisor.overview;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user!.id)
    .maybeSingle<{ agency_id: string | null }>();

  const agencyId = profile?.agency_id ?? null;
  const admin = createAdminClient();

  const { data: homes } = agencyId
    ? await admin.from("homes").select("id, name").eq("agency_id", agencyId).order("name")
    : { data: [] };

  const { data: requests } = agencyId
    ? await admin
        .from("requests")
        .select("id, description, priority, assigned_to, home_id")
        .eq("agency_id", agencyId)
        .in("status", ACTIVE_STATUSES)
    : { data: [] };

  const rows = requests ?? [];

  const assigneeIds = Array.from(new Set(rows.map((r) => r.assigned_to).filter((id): id is string => !!id)));
  const { data: assignees } = assigneeIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", assigneeIds)
    : { data: [] };
  const assigneeMap = Object.fromEntries(
    (assignees ?? []).map((a) => [a.id, [a.first_name, a.last_name].filter(Boolean).join(" ") || dict.common.unnamed])
  );

  const urgentJobs = rows.filter((r) => r.priority === "Urgent");
  const unassignedCount = rows.filter((r) => !r.assigned_to).length;
  const homeCounts: Record<string, number> = {};
  for (const r of rows) homeCounts[r.home_id] = (homeCounts[r.home_id] ?? 0) + 1;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <Link href="/supervisor/requests" className={buttonClasses("outline")}>
              {t.viewAllRequests}
            </Link>
            <SignOutButton />
          </>
        }
      />
      <main className="flex flex-1 flex-col gap-5 p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile
            label={t.openRequests}
            value={rows.length}
            context={t.acrossHomes((homes ?? []).length)}
          />
          <StatTile
            label={t.urgentJobs}
            value={urgentJobs.length}
            valueClassName="text-urgent"
            context={t.needAttention}
          />
          <StatTile label={t.unassignedWork} value={unassignedCount} context={t.awaitingAllocation} />
        </div>

        <section className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>{t.urgentWorkHeading}</Eyebrow>
          {urgentJobs.length ? (
            urgentJobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-[90px_minmax(160px,1fr)_180px_100px] items-center gap-3 overflow-x-auto rounded-md border border-black/[.08] px-4 py-3"
              >
                <span className="font-mono text-xs font-medium text-faint">
                  {job.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-[13px] font-medium text-ink">
                  {job.description.split("\n")[0]}
                </span>
                <span className="text-[13px] text-subtle">
                  {job.assigned_to ? assigneeMap[job.assigned_to] ?? dict.common.unnamed : dict.common.unassigned}
                </span>
                <PriorityBadge priority="Urgent" />
              </div>
            ))
          ) : (
            <p className="text-sm text-meta">{t.noUrgentJobs}</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>{t.openRequestsByHome}</Eyebrow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(homes ?? []).map((home) => (
              <div key={home.id} className="rounded-md border border-black/[.08] px-4 py-3">
                <p className="text-[13px] font-medium text-ink">{home.name}</p>
                <p className="mt-1 font-mono text-xs text-meta">
                  {t.openRequestsCount(homeCounts[home.id] ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
