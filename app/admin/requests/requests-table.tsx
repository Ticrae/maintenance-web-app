"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/ui/badges";
import { TextField, Select } from "@/components/ui/inputs";
import {
  tableWrapClass,
  tableHeadRowClass,
  tableRowClass,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import type { Priority } from "@/lib/theme";
import {
  updateRequestStatus,
  assignRequest,
  type RequestStatus,
} from "@/app/actions/requests";

export type RequestRow = {
  id: string;
  agency_id: string;
  home_id: string;
  reported_by: string;
  assigned_to: string | null;
  category: string;
  priority: Priority;
  status: RequestStatus;
  description: string;
  created_at: string;
  homes: { name: string } | null;
  agencies: { name: string } | null;
};

export type Assignee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  agency_id: string | null;
  home_id: string | null;
};

const STATUSES: RequestStatus[] = [
  "Open",
  "Assigned",
  "In Progress",
  "Waiting for Parts",
  "Completed",
  "Cancelled",
];
const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];
const GRID_COLS =
  "grid-cols-[84px_minmax(220px,1fr)_140px_110px_90px_140px_160px_130px_100px]";

function assigneeName(a: Assignee) {
  return [a.first_name, a.last_name].filter(Boolean).join(" ") || "Unnamed";
}

export function RequestsTable({
  requests,
  profileMap,
  assignees,
}: {
  requests: RequestRow[];
  profileMap: Record<string, string>;
  assignees: Assignee[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">(
    "All",
  );
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (priorityFilter !== "All" && r.priority !== priorityFilter)
        return false;
      if (
        q &&
        !r.description.toLowerCase().includes(q) &&
        !(r.homes?.name ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [requests, search, statusFilter, priorityFilter]);

  const openCount = requests.filter((r) => r.status === "Open").length;
  const urgentOpen = requests.filter(
    (r) => r.priority === "Urgent" && r.status !== "Completed" && r.status !== "Cancelled",
  ).length;
  const unassigned = requests.filter((r) => !r.assigned_to).length;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader
        title="Requests"
        subtitle="Every maintenance request across all homes"
        actions={
          <TextField
            placeholder="Search description or home…"
            className="w-full sm:w-[260px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 bg-canvas p-4 sm:p-7">
        <div className="flex gap-3">
          <StatTile label="Total requests" value={requests.length} />
          <StatTile label="Open" value={openCount} />
          <StatTile
            label="Urgent open"
            value={urgentOpen}
            valueClassName="text-urgent"
          />
          <StatTile label="Unassigned" value={unassigned} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-[6px] text-xs ${
                  statusFilter === s
                    ? "bg-graphite text-white"
                    : "border border-black/[.14] text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["All", ...PRIORITIES] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full px-3 py-[6px] text-xs ${
                  priorityFilter === p
                    ? "bg-graphite text-white"
                    : "border border-black/[.14] text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>Ref</span>
            <span>Issue</span>
            <span>Home</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Assigned to</span>
            <span>Reported by</span>
            <span>Created</span>
          </div>
          {filtered.map((r) => {
            const eligible = assignees.filter(
              (a) => a.agency_id === r.agency_id,
            );
            return (
              <div key={r.id} className={`${tableRowClass} ${GRID_COLS}`}>
                <span className="font-mono text-xs font-medium text-faint">
                  {r.id.slice(0, 8)}
                </span>
                <span className="truncate pr-3 text-[13.5px] font-medium text-ink">
                  {r.description}
                </span>
                <div className="flex flex-col gap-[2px] pr-3">
                  <span className="truncate text-[13px] text-subtle">
                    {r.homes?.name ?? "—"}
                  </span>
                  <span className="truncate font-mono text-[10.5px] text-eyebrow">
                    {r.agencies?.name ?? ""}
                  </span>
                </div>
                <span className="truncate pr-3 text-[13px] text-subtle">
                  {r.category}
                </span>
                <PriorityBadge priority={r.priority} />
                <Select
                  value={r.status}
                  className="h-8 text-xs"
                  onChange={(e) => {
                    const status = e.target.value as RequestStatus;
                    startTransition(() => {
                      updateRequestStatus(r.id, status);
                    });
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Select
                  value={r.assigned_to ?? ""}
                  className="h-8 text-xs"
                  onChange={(e) => {
                    const userId = e.target.value || null;
                    startTransition(() => {
                      assignRequest(r.id, userId);
                    });
                  }}
                >
                  <option value="">Unassigned</option>
                  {eligible.map((a) => (
                    <option key={a.id} value={a.id}>
                      {assigneeName(a)}
                    </option>
                  ))}
                </Select>
                <span className="truncate pr-3 text-[13px] text-subtle">
                  {profileMap[r.reported_by] ?? "—"}
                </span>
                <span className="font-mono text-[11px] text-eyebrow">
                  {relativeTime(r.created_at)}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">
              No requests match.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
