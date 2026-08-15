"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { TextField } from "@/components/ui/inputs";
import { StatTile } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import type { Priority } from "@/lib/theme";
import type { RequestStatus } from "@/app/actions/requests";

export type StaffRequestRow = {
  id: string;
  category: string;
  priority: Priority;
  status: RequestStatus;
  description: string;
  created_at: string;
  updated_at: string;
  photoCount: number;
};

const GRID_COLS = "grid-cols-[104px_minmax(280px,1fr)_130px_118px_132px_100px]";

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function MyRequestsTable({
  requests,
  homeName,
  avgResponseMs,
}: {
  requests: StaffRequestRow[];
  homeName: string;
  avgResponseMs: number | null;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) => r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const awaiting = requests.filter((r) => r.status === "Open").length;
  const inProgress = requests.filter(
    (r) => r.status === "Assigned" || r.status === "In Progress" || r.status === "Waiting for Parts"
  ).length;
  const urgentOpen = requests.filter(
    (r) => r.priority === "Urgent" && r.status !== "Completed" && r.status !== "Cancelled"
  ).length;

  return (
    <>
      <PageHeader
        title="My requests"
        subtitle={homeName}
        actions={
          <>
            <TextField
              placeholder="Search issue or category…"
              className="w-full sm:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link href="/staff/new" className={buttonClasses("primary")}>
              New request
            </Link>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Awaiting acceptance" value={awaiting} />
          <StatTile label="In progress" value={inProgress} />
          <StatTile label="Urgent open" value={urgentOpen} valueClassName="text-urgent" />
          <StatTile
            label="Avg. response"
            value={avgResponseMs !== null ? formatDuration(avgResponseMs) : "—"}
            mono
          />
        </div>

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>Ref</span>
            <span>Issue</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Raised</span>
          </div>
          {filtered.map((r) => {
            const title = r.description.split("\n")[0];
            return (
              <Link
                key={r.id}
                href={`/staff/requests/${r.id}`}
                className={`${tableRowClass} ${GRID_COLS} cursor-pointer`}
              >
                <span className="font-mono text-xs font-medium text-faint">
                  {r.id.slice(0, 8).toUpperCase()}
                </span>
                <div className="flex min-w-0 items-center gap-2 pr-4">
                  <span className="truncate text-[13.5px] font-medium text-ink">{title}</span>
                  {r.photoCount > 0 && (
                    <span className="flex-none rounded border border-black/[.12] px-[5px] py-[3px] font-mono text-[10.5px] text-meta">
                      {r.photoCount} photo{r.photoCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-subtle">{r.category}</span>
                <PriorityBadge priority={r.priority} />
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[12.5px] font-medium text-ink">{r.status}</span>
                  <span className="font-mono text-[11px] text-eyebrow">
                    {relativeTime(r.updated_at)}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-eyebrow">
                  {relativeTime(r.created_at)}
                </span>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">No requests yet.</div>
          )}
        </div>
      </div>
    </>
  );
}
