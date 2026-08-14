"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { Checkbox } from "@/components/ui/inputs";
import { buttonClasses } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { homes } from "@/lib/fixtures";
import type { Priority } from "@/lib/theme";

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];
const CATEGORIES = ["Heating", "Electrical", "Fabric", "Grounds", "Safety"];

export default function JobQueuePage() {
  const { queue, acceptJob } = useAppData();
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [locationFilter, setLocationFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(
    new Set(["Heating"])
  );

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
        if (
          locationFilter.size &&
          ![...locationFilter].some((home) => j.meta.startsWith(home))
        )
          return false;
        return true;
      }),
    [queue, priorityFilter, locationFilter]
  );

  const activeCount =
    (priorityFilter.size ? 1 : 0) +
    (locationFilter.size ? 1 : 0) +
    (categoryFilter.size ? 1 : 0);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[240px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Priority
          </span>
          {PRIORITIES.map((p) => (
            <Checkbox
              key={p}
              checked={priorityFilter.has(p)}
              onChange={() => toggle(priorityFilter, p, setPriorityFilter)}
              label={p}
              count={queue.filter((j) => j.priority === p).length}
            />
          ))}
        </div>
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Location
          </span>
          {homes.map((h) => (
            <Checkbox
              key={h.id}
              checked={locationFilter.has(h.name)}
              onChange={() => toggle(locationFilter, h.name, setLocationFilter)}
              label={h.name}
            />
          ))}
        </div>
        <div className="flex flex-col gap-[10px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Category
          </span>
          <div className="flex flex-wrap gap-[6px]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggle(categoryFilter, c, setCategoryFilter)}
                className={`rounded-full px-[10px] py-[5px] text-xs ${
                  categoryFilter.has(c)
                    ? "bg-graphite text-white"
                    : "border border-black/[.14] text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="Job queue"
          subtitle={`${filtered.length} of ${queue.length} shown · ${activeCount} filters active`}
          actions={
            <>
              <div className="flex h-8 items-center rounded-md border border-black/[.14] px-3 text-[12.5px] text-muted">
                Sort: priority ▾
              </div>
              <div className="flex overflow-hidden rounded-md border border-black/[.14]">
                <span className="bg-graphite px-3 py-[7px] text-[12.5px] font-medium text-white">
                  List
                </span>
                <span className="px-3 py-[7px] text-[12.5px] text-muted">
                  Board
                </span>
              </div>
            </>
          }
        />
        <div className="flex flex-1 flex-col gap-3 overflow-auto bg-canvas p-4 sm:p-6">
          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-[2px] font-mono text-[10px] font-semibold uppercase tracking-[.09em] text-eyebrow">
                Active
              </span>
              {[...priorityFilter].length > 0 && (
                <span className="rounded-md bg-chip px-[9px] py-[6px] text-xs text-body">
                  {[...priorityFilter].join(" + ")}
                </span>
              )}
              {[...locationFilter].length > 0 && (
                <span className="rounded-md bg-chip px-[9px] py-[6px] text-xs text-body">
                  {[...locationFilter].join(", ")}
                </span>
              )}
              {[...categoryFilter].length > 0 && (
                <span className="rounded-md bg-chip px-[9px] py-[6px] text-xs text-body">
                  {[...categoryFilter].join(", ")}
                </span>
              )}
              <button
                onClick={() => {
                  setPriorityFilter(new Set());
                  setLocationFilter(new Set());
                  setCategoryFilter(new Set());
                }}
                className="text-xs text-meta hover:text-muted"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex flex-col gap-[9px]">
            {filtered.map((j) => (
              <JobCard
                key={j.ref}
                ref={j.ref}
                priority={j.priority}
                title={j.title}
                urgent={j.urgent}
                meta={j.meta}
                right={
                  <>
                    <span className="text-[12.5px] text-subtle">{j.assignee}</span>
                    <span className="font-mono text-[11.5px] text-eyebrow">{j.age}</span>
                  </>
                }
                actions={
                  j.action === "Accept" ? (
                    <button
                      onClick={() => acceptJob(j.ref)}
                      className={buttonClasses("primary")}
                    >
                      Accept
                    </button>
                  ) : (
                    <Link
                      href={`/maintenance/jobs/${j.ref}`}
                      className={buttonClasses("outline")}
                    >
                      Open
                    </Link>
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
