"use client";

import { PageHeader } from "@/components/page-header";
import { PriorityBadge } from "@/components/ui/badges";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { useAppData } from "@/lib/app-data-context";
import { SignOutButton } from "@/components/sign-out-button";

export default function SupervisorPage() {
  const { homes, queue, unassigned } = useAppData();
  const urgentJobs = queue.filter((job) => job.urgent);
  const openRequests = homes.reduce((total, home) => total + home.open, 0);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PageHeader
        title="Supervisor overview"
        subtitle="Monitor active work and priorities across your homes"
        actions={<SignOutButton />}
      />
      <main className="flex flex-1 flex-col gap-5 p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Open requests" value={openRequests} context="across 6 homes" />
          <StatTile label="Urgent jobs" value={urgentJobs.length} valueClassName="text-urgent" context="need attention" />
          <StatTile label="Unassigned work" value={unassigned.length} context="awaiting allocation" />
        </div>

        <section className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>Urgent work</Eyebrow>
          {urgentJobs.length ? urgentJobs.map((job) => (
            <div key={job.ref} className="grid grid-cols-[90px_minmax(160px,1fr)_180px_100px] items-center gap-3 overflow-x-auto rounded-md border border-black/[.08] px-4 py-3">
              <span className="font-mono text-xs font-medium text-faint">{job.ref}</span>
              <span className="text-[13px] font-medium text-ink">{job.title}</span>
              <span className="text-[13px] text-subtle">{job.assignee}</span>
              <PriorityBadge priority={job.priority} />
            </div>
          )) : <p className="text-sm text-meta">There are no urgent jobs right now.</p>}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>Open requests by home</Eyebrow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {homes.map((home) => (
              <div key={home.id} className="rounded-md border border-black/[.08] px-4 py-3">
                <p className="text-[13px] font-medium text-ink">{home.name}</p>
                <p className="mt-1 font-mono text-xs text-meta">{home.open} open requests</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
