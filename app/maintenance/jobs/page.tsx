"use client";

import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { Button, buttonClasses } from "@/components/ui/button";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import type { JobStage } from "@/lib/fixtures";

const CTA: Record<JobStage, string> = {
  accepted: "Start",
  site: "Complete",
  parts: "Notes",
};

const GROUP_TONE: Record<string, string> = {
  Overdue: "text-urgent",
  Today: "text-ink",
  "Waiting on parts": "text-ink",
};

export default function MyJobsPage() {
  const { myJobGroups, setJobStage, markJobCompleted } = useAppData();

  const overdue = myJobGroups.find((g) => g.label === "Overdue")?.items.length ?? 0;
  const today = myJobGroups.find((g) => g.label === "Today")?.items.length ?? 0;
  const parts =
    myJobGroups.find((g) => g.label === "Waiting on parts")?.items.length ?? 0;

  function handleCta(ref: string, stage: JobStage) {
    if (stage === "accepted") setJobStage(ref, "site");
    else if (stage === "site") markJobCompleted(ref);
    else setJobStage(ref, "site");
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[220px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Today
          </span>
          <Row label="Due today" value={today} />
          <Row label="Overdue" value={overdue} tone="text-urgent" />
          <Row label="Waiting on parts" value={parts} />
          <Row label="Homes on round" value={2} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Route
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[13px] text-body">
              <span className="font-mono text-xs text-eyebrow">09:30</span>
              Willow House
            </div>
            <div className="flex items-center gap-2 text-[13px] text-body">
              <span className="font-mono text-xs text-eyebrow">13:15</span>
              St Marks Lodge
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="My jobs"
          subtitle="6 accepted · Thursday 13 August"
          actions={
            <>
              <div className="flex h-8 items-center rounded-md border border-black/[.14] px-3 text-[12.5px] text-muted">
                Sort: due date ▾
              </div>
              <Button variant="primary">Print round sheet</Button>
            </>
          }
        />
        <div className="flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 sm:p-6">
          {myJobGroups
            .filter((g) => g.items.length)
            .map((group) => (
              <div key={group.label} className="flex flex-col gap-[9px]">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-semibold ${GROUP_TONE[group.label]}`}>
                    {group.label}
                  </span>
                  <span className="font-mono text-xs text-eyebrow">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((j) => (
                  <JobCard
                    key={j.ref}
                    ref={j.ref}
                    priority={j.priority}
                    title={j.title}
                    urgent={j.urgent}
                    meta={j.meta}
                    right={
                      <>
                        <span className="text-[12.5px] capitalize text-subtle">
                          {j.stage === "site" ? "On site" : j.stage === "parts" ? "Parts ordered" : "Accepted"}
                        </span>
                        <span
                          className={`font-mono text-[11.5px] ${
                            j.overdue ? "text-urgent" : "text-eyebrow"
                          }`}
                        >
                          {j.due}
                        </span>
                      </>
                    }
                    actions={
                      <>
                        <Link
                          href={`/maintenance/jobs/${j.ref}`}
                          className={buttonClasses("outline")}
                        >
                          Update
                        </Link>
                        <button
                          onClick={() => handleCta(j.ref, j.stage)}
                          className={buttonClasses("primary")}
                        >
                          {CTA[j.stage]}
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[13px] text-body">
      <span>{label}</span>
      <span className={`font-mono font-medium ${tone}`}>{value}</span>
    </div>
  );
}
