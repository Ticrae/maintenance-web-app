"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { buttonClasses } from "@/components/ui/button";
import { relativeTime } from "@/lib/date";
import { dueAt, isOverdue } from "@/lib/sla";
import { updateJobStage, completeJob, type RequestStatus } from "@/app/actions/requests";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Priority } from "@/lib/theme";

export type MyJobRow = {
  id: string;
  category: string;
  priority: Priority;
  status: string;
  description: string;
  created_at: string;
  homeName: string;
};

type GroupKey = "overdue" | "today" | "parts";

const GROUP_TONE: Record<GroupKey, string> = {
  overdue: "text-urgent",
  today: "text-ink",
  parts: "text-ink",
};

export function MyJobsView({ jobs, slaHours }: { jobs: MyJobRow[]; slaHours: Record<string, number> }) {
  const dict = useDictionary();
  const t = dict.maintenance.myJobs;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const CTA: Record<string, { label: string; next: RequestStatus | "complete" }> = {
    Assigned: { label: t.cta.startWork, next: "In Progress" },
    "In Progress": { label: t.cta.markComplete, next: "complete" },
    "Waiting for Parts": { label: t.cta.resume, next: "In Progress" },
  };

  const STAGE_LABEL: Record<string, string> = {
    Assigned: t.stage.Assigned,
    "In Progress": t.stage["In Progress"],
    "Waiting for Parts": t.stage["Waiting for Parts"],
  };

  const groups = useMemo(() => {
    const overdue: MyJobRow[] = [];
    const today: MyJobRow[] = [];
    const parts: MyJobRow[] = [];
    for (const j of jobs) {
      if (j.status === "Waiting for Parts") parts.push(j);
      else if (isOverdue(j.created_at, j.priority, slaHours)) overdue.push(j);
      else today.push(j);
    }
    return [
      { key: "overdue" as GroupKey, label: t.overdue, items: overdue },
      { key: "today" as GroupKey, label: t.dueToday, items: today },
      { key: "parts" as GroupKey, label: t.waitingOnParts, items: parts },
    ];
  }, [jobs, slaHours, t]);

  const overdueCount = groups.find((g) => g.key === "overdue")?.items.length ?? 0;
  const todayCount = groups.find((g) => g.key === "today")?.items.length ?? 0;
  const partsCount = groups.find((g) => g.key === "parts")?.items.length ?? 0;

  async function handleCta(job: MyJobRow) {
    const cta = CTA[job.status];
    if (!cta) return;
    setError(null);
    setPendingId(job.id);
    try {
      if (cta.next === "complete") await completeJob(job.id);
      else await updateJobStage(job.id, cta.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.updateError);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[220px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            {t.overview}
          </span>
          <Row label={t.dueToday} value={todayCount} />
          <Row label={t.overdue} value={overdueCount} tone="text-urgent" />
          <Row label={t.waitingOnParts} value={partsCount} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader title={dict.maintenance.nav.myJobs} subtitle={t.subtitle(jobs.length)} />
        <div className="flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 sm:p-6">
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {groups
            .filter((g) => g.items.length)
            .map((group) => (
              <div key={group.key} className="flex flex-col gap-[9px]">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-semibold ${GROUP_TONE[group.key]}`}>
                    {group.label}
                  </span>
                  <span className="font-mono text-xs text-eyebrow">{group.items.length}</span>
                </div>
                {group.items.map((j) => {
                  const due = dueAt(j.created_at, j.priority, slaHours);
                  const overdue = group.key === "overdue";
                  const cta = CTA[j.status];
                  return (
                    <JobCard
                      key={j.id}
                      ref={j.id.slice(0, 8).toUpperCase()}
                      priority={j.priority}
                      title={j.description.split("\n")[0]}
                      urgent={j.priority === "Urgent"}
                      meta={`${j.homeName} · ${j.category}`}
                      right={
                        <>
                          <span className="text-[12.5px] capitalize text-subtle">
                            {STAGE_LABEL[j.status] ?? j.status}
                          </span>
                          <span className={`font-mono text-[11.5px] ${overdue ? "text-urgent" : "text-eyebrow"}`}>
                            {t.due(relativeTime(due.toISOString(), dict.common.time))}
                          </span>
                        </>
                      }
                      actions={
                        <div className="flex flex-col gap-2">
                          <Link href={`/maintenance/jobs/${j.id}`} className={buttonClasses("outline")}>
                            {t.update}
                          </Link>
                          {cta && (
                            <button
                              onClick={() => handleCta(j)}
                              disabled={pendingId === j.id}
                              className={buttonClasses("primary")}
                            >
                              {pendingId === j.id ? t.saving : cta.label}
                            </button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ))}
          {jobs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">{t.noActiveJobs}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone = "text-ink" }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between text-[13px] text-body">
      <span>{label}</span>
      <span className={`font-mono font-medium ${tone}`}>{value}</span>
    </div>
  );
}
