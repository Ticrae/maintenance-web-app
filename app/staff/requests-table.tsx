"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/inputs";
import { StatTile } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/ui/badges";
import {
  tableWrapClass,
  tableHeadRowClass,
  tableRowClass,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import type { Priority } from "@/lib/theme";
import type { RequestStatus } from "@/app/actions/requests";
import { useDictionary } from "@/lib/i18n/language-provider";

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

const STATUS_FILTERS: Record<string, RequestStatus[]> = {
  open: ["Open"],
  "in-progress": ["Assigned", "In Progress", "Waiting for Parts"],
  completed: ["Completed"],
};

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
  statusFilter,
}: {
  requests: StaffRequestRow[];
  homeName: string;
  avgResponseMs: number | null;
  statusFilter?: string;
}) {
  const [search, setSearch] = useState("");
  const dict = useDictionary();
  const t = dict.staff.myRequests;

  const activeStatuses = statusFilter ? STATUS_FILTERS[statusFilter] : undefined;

  const filtered = useMemo(() => {
    let list = requests;
    if (activeStatuses) {
      list = list.filter((r) => activeStatuses.includes(r.status));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [requests, search, activeStatuses]);

  const awaiting = requests.filter((r) => r.status === "Open").length;
  const inProgress = requests.filter(
    (r) =>
      r.status === "Assigned" ||
      r.status === "In Progress" ||
      r.status === "Waiting for Parts",
  ).length;
  const urgentOpen = requests.filter(
    (r) =>
      r.priority === "Urgent" &&
      r.status !== "Completed" &&
      r.status !== "Cancelled",
  ).length;

  const filterLabel =
    statusFilter === "open"
      ? dict.common.status.Open
      : statusFilter === "in-progress"
        ? t.statInProgress
        : statusFilter === "completed"
          ? dict.common.status.Completed
          : null;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={homeName}
        actions={
          <>
            <TextField
              placeholder={t.searchPlaceholder}
              className="w-full sm:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link
              href="/staff/new"
              className={buttonClasses("primary", "!text-white")}
            >
              {t.newRequest}
            </Link>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label={t.statAwaiting} value={awaiting} />
          <StatTile label={t.statInProgress} value={inProgress} />
          <StatTile
            label={dict.common.stat.urgentOpen}
            value={urgentOpen}
            valueClassName="text-urgent"
          />
          <StatTile
            label={t.statAvgResponse}
            value={avgResponseMs !== null ? formatDuration(avgResponseMs) : "—"}
            mono
          />
        </div>

        {filterLabel && (
          <div className="flex items-center gap-2 text-[12.5px] text-muted">
            <span>
              {dict.common.table.status}: <span className="font-medium text-ink">{filterLabel}</span>
            </span>
            <Link href="/staff" className="text-eyebrow hover:text-ink">
              {t.clearFilter}
            </Link>
          </div>
        )}

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>{dict.common.table.ref}</span>
            <span>{dict.common.table.issue}</span>
            <span>{dict.common.table.category}</span>
            <span>{dict.common.table.priority}</span>
            <span>{dict.common.table.status}</span>
            <span>{t.colRaised}</span>
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
                  <span className="truncate text-[13.5px] font-medium text-ink">
                    {title}
                  </span>
                  {r.photoCount > 0 && (
                    <span className="flex-none rounded border border-black/[.12] px-[5px] py-[3px] font-mono text-[10.5px] text-meta">
                      {t.photoCount(r.photoCount)}
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-subtle">{r.category}</span>
                <PriorityBadge priority={r.priority} />
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[12.5px] font-medium text-ink">
                    {dict.common.status[r.status]}
                  </span>
                  <span className="font-mono text-[11px] text-eyebrow">
                    {relativeTime(r.updated_at, dict.common.time)}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-eyebrow">
                  {relativeTime(r.created_at, dict.common.time)}
                </span>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">
              {t.noRequestsYet}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
