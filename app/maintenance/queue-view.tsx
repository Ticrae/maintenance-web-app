"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { Checkbox } from "@/components/ui/inputs";
import { buttonClasses } from "@/components/ui/button";
import { relativeTime } from "@/lib/date";
import { acceptRequest } from "@/app/actions/requests";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Priority } from "@/lib/theme";

export type QueueRow = {
  id: string;
  category: string;
  priority: Priority;
  status: string;
  description: string;
  created_at: string;
  homeId: string;
  homeName: string;
  assigneeName: string | null;
};

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

export function QueueView({ queue, homes }: { queue: QueueRow[]; homes: { id: string; name: string }[] }) {
  const dict = useDictionary();
  const t = dict.maintenance.queue;
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [homeFilter, setHomeFilter] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const filtered = useMemo(
    () =>
      queue.filter((j) => {
        if (priorityFilter.size && !priorityFilter.has(j.priority)) return false;
        if (homeFilter.size && !homeFilter.has(j.homeId)) return false;
        return true;
      }),
    [queue, priorityFilter, homeFilter]
  );

  const activeCount = (priorityFilter.size ? 1 : 0) + (homeFilter.size ? 1 : 0);

  async function handleAccept(id: string) {
    setError(null);
    setPendingId(id);
    try {
      await acceptRequest(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.acceptError);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[240px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            {dict.common.table.priority}
          </span>
          {PRIORITIES.map((p) => (
            <Checkbox
              key={p}
              checked={priorityFilter.has(p)}
              onChange={() => toggle(priorityFilter, p, setPriorityFilter)}
              label={dict.common.priority[p]}
              count={queue.filter((j) => j.priority === p).length}
            />
          ))}
        </div>
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            {t.location}
          </span>
          {homes.map((h) => (
            <Checkbox
              key={h.id}
              checked={homeFilter.has(h.id)}
              onChange={() => toggle(homeFilter, h.id, setHomeFilter)}
              label={h.name}
            />
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title={t.title}
          subtitle={t.subtitle(filtered.length, queue.length, activeCount)}
        />
        <div className="flex flex-1 flex-col gap-3 overflow-auto bg-canvas p-4 sm:p-6">
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-[2px] font-mono text-[10px] font-semibold uppercase tracking-[.09em] text-eyebrow">
                {t.active}
              </span>
              {[...priorityFilter].length > 0 && (
                <span className="rounded-md bg-chip px-[9px] py-[6px] text-xs text-body">
                  {[...priorityFilter].map((p) => dict.common.priority[p]).join(" + ")}
                </span>
              )}
              {[...homeFilter].length > 0 && (
                <span className="rounded-md bg-chip px-[9px] py-[6px] text-xs text-body">
                  {t.homesCount(homeFilter.size)}
                </span>
              )}
              <button
                onClick={() => {
                  setPriorityFilter(new Set());
                  setHomeFilter(new Set());
                }}
                className="text-xs text-meta hover:text-muted"
              >
                {t.clearAll}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-[9px]">
            {filtered.map((j) => (
              <JobCard
                key={j.id}
                ref={j.id.slice(0, 8).toUpperCase()}
                priority={j.priority}
                title={j.description.split("\n")[0]}
                urgent={j.priority === "Urgent"}
                meta={`${j.homeName} · ${j.category}`}
                right={
                  <>
                    <span className="text-[12.5px] text-subtle">{j.assigneeName ?? dict.common.unassigned}</span>
                    <span className="font-mono text-[11.5px] text-eyebrow">
                      {relativeTime(j.created_at, dict.common.time)}
                    </span>
                  </>
                }
                actions={
                  !j.assigneeName ? (
                    <button
                      onClick={() => handleAccept(j.id)}
                      disabled={pendingId === j.id}
                      className={buttonClasses("primary")}
                    >
                      {pendingId === j.id ? t.accepting : t.accept}
                    </button>
                  ) : (
                    <Link href={`/maintenance/jobs/${j.id}`} className={buttonClasses("outline")}>
                      {t.open}
                    </Link>
                  )
                }
              />
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-meta">{t.noMatch}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
