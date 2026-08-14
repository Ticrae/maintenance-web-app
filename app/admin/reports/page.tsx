"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { useAppData } from "@/lib/app-data-context";
import { homeTimes, categories } from "@/lib/fixtures";

const TONE_FILL: Record<string, string> = {
  default: "bg-graphite",
  amber: "bg-high-bar",
  red: "bg-urgent",
};

const TONE_TEXT: Record<string, string> = {
  default: "text-ink",
  amber: "text-high",
  red: "text-urgent",
};

const WIDTH_CLASS: Record<number, string> = {
  30: "w-[30%]",
  33: "w-[33%]",
  38: "w-[38%]",
  44: "w-[44%]",
  52: "w-[52%]",
  64: "w-[64%]",
  69: "w-[69%]",
  88: "w-[88%]",
  100: "w-full",
};

export default function ReportsPage() {
  const { unassigned, assignJob } = useAppData();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader
        title="Reports"
        subtitle="Response times and workload across all homes"
        actions={
          <>
            <div className="flex h-8 items-center rounded-md border border-black/[.14] px-3 text-[12.5px] text-muted">
              Last 30 days ▾
            </div>
            <Button>Export history</Button>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-5 bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Requests raised" value={412} context="+8% vs prev." />
          <StatTile
            label="Median response"
            value="3h 48m"
            mono
            context="−41m vs prev."
          />
          <StatTile label="Urgent within 4h" value="91%" context="target 95%" />
          <StatTile
            label="Open over 7 days"
            value={14}
            valueClassName="text-urgent"
            context="across 6 homes"
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Median response time by home</Eyebrow>
            <div className="flex flex-col gap-3">
              {homeTimes.map((h) => (
                <div key={h.home} className="flex items-center gap-3">
                  <span className="w-[110px] flex-none truncate text-[12.5px] text-body">
                    {h.home}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-selected">
                    <div
                      className={`h-full rounded-full ${TONE_FILL[h.tone]} ${WIDTH_CLASS[h.pct]}`}
                    />
                  </div>
                  <span className={`w-14 flex-none text-right font-mono text-[11.5px] ${TONE_TEXT[h.tone]}`}>
                    {h.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Requests by category</Eyebrow>
            <div className="flex flex-col gap-3">
              {categories.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-[140px] flex-none truncate text-[12.5px] text-body">
                    {c.category}
                  </span>
                  <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-selected">
                    <div
                      className={`h-full rounded-full bg-graphite ${WIDTH_CLASS[c.pct]}`}
                    />
                  </div>
                  <span className="w-8 flex-none text-right font-mono text-[11.5px] text-eyebrow">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Unassigned — needs a manual assignment</Eyebrow>
            <span className="font-mono text-[11.5px] text-eyebrow">
              {unassigned.length} waiting
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {unassigned.map((u) => (
              <div
                key={u.ref}
                className="grid grid-cols-[90px_minmax(180px,1fr)_150px_100px_220px] items-center gap-3 overflow-x-auto rounded-md border border-black/[.08] px-4 py-3"
              >
                <span className="font-mono text-xs font-medium text-faint">{u.ref}</span>
                <span className="truncate text-[13px] font-medium text-ink">{u.title}</span>
                <span className="text-[13px] text-subtle">{u.home}</span>
                <span className={`font-mono text-xs ${u.waitLong ? "text-urgent" : "text-meta"}`}>
                  {u.waiting}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 flex-1 items-center rounded-md border border-black/[.14] px-2 text-xs text-muted">
                    {u.suggest}
                  </div>
                  <button
                    onClick={() => assignJob(u.ref, u.suggest)}
                    className="rounded-md bg-graphite px-3 py-[7px] text-xs font-medium text-white hover:bg-graphite-hover"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
            {unassigned.length === 0 && (
              <span className="py-2 text-sm text-meta">
                All requests are assigned.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
