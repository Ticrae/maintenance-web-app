"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/ui/misc";
import { PriorityBadge } from "@/components/ui/badges";
import { TextField, Select } from "@/components/ui/inputs";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import type { Priority } from "@/lib/theme";
import { assignRequest, type RequestStatus } from "@/app/actions/requests";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type RequestRow = {
  id: string;
  home_id: string;
  reported_by: string;
  assigned_to: string | null;
  category: string;
  priority: Priority;
  status: RequestStatus;
  description: string;
  created_at: string;
  homes: { name: string } | null;
};

export type Assignee = { id: string; first_name: string | null; last_name: string | null };

const STATUSES: (RequestStatus | "All")[] = [
  "All",
  "Open",
  "Assigned",
  "In Progress",
  "Waiting for Parts",
  "Completed",
  "Cancelled",
];
const PRIORITIES: (Priority | "All")[] = ["All", "Urgent", "High", "Medium", "Low"];
const GRID_COLS = "grid-cols-[84px_minmax(220px,1fr)_140px_110px_90px_100px_160px_130px]";

function assigneeName(a: Assignee, dict: Dictionary) {
  return [a.first_name, a.last_name].filter(Boolean).join(" ") || dict.common.unnamed;
}

export function SupervisorRequestsTable({
  requests,
  profileMap,
  assignees,
}: {
  requests: RequestRow[];
  profileMap: Record<string, string>;
  assignees: Assignee[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dict = useDictionary();
  const t = dict.supervisor.requests;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (priorityFilter !== "All" && r.priority !== priorityFilter) return false;
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
    (r) => r.priority === "Urgent" && r.status !== "Completed" && r.status !== "Cancelled"
  ).length;
  const unassigned = requests.filter((r) => !r.assigned_to).length;

  function handleAssign(requestId: string, userId: string | null) {
    setError(null);
    startTransition(async () => {
      try {
        await assignRequest(requestId, userId);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.assignError);
      }
    });
  }

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <TextField
            placeholder={t.searchPlaceholder}
            className="w-full sm:w-[260px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label={dict.common.stat.totalRequests} value={requests.length} />
          <StatTile label={dict.common.stat.open} value={openCount} />
          <StatTile label={dict.common.stat.urgentOpen} value={urgentOpen} valueClassName="text-urgent" />
          <StatTile label={dict.common.stat.unassigned} value={unassigned} />
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-[6px] text-xs ${
                  statusFilter === s
                    ? "bg-graphite text-white"
                    : "border border-black/[.14] text-muted"
                }`}
              >
                {s === "All" ? dict.common.all : dict.common.status[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full px-3 py-[6px] text-xs ${
                  priorityFilter === p
                    ? "bg-graphite text-white"
                    : "border border-black/[.14] text-muted"
                }`}
              >
                {p === "All" ? dict.common.all : dict.common.priority[p]}
              </button>
            ))}
          </div>
        </div>

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>{dict.common.table.ref}</span>
            <span>{dict.common.table.issue}</span>
            <span>{dict.common.table.home}</span>
            <span>{dict.common.table.category}</span>
            <span>{dict.common.table.priority}</span>
            <span>{dict.common.table.status}</span>
            <span>{dict.common.table.assignedTo}</span>
            <span>{dict.common.table.reportedBy}</span>
          </div>
          {filtered.map((r) => (
            <div key={r.id} className={`${tableRowClass} ${GRID_COLS}`}>
              <span className="font-mono text-xs font-medium text-faint">
                {r.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="truncate pr-3 text-[13.5px] font-medium text-ink">
                {r.description.split("\n")[0]}
              </span>
              <span className="truncate pr-3 text-[13px] text-subtle">{r.homes?.name ?? "—"}</span>
              <span className="truncate pr-3 text-[13px] text-subtle">{r.category}</span>
              <PriorityBadge priority={r.priority} />
              <span className="text-[12.5px] font-medium text-ink">{dict.common.status[r.status]}</span>
              <Select
                value={r.assigned_to ?? ""}
                className="h-8 text-xs"
                onChange={(e) => handleAssign(r.id, e.target.value || null)}
              >
                <option value="">{dict.common.unassigned}</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {assigneeName(a, dict)}
                  </option>
                ))}
              </Select>
              <span className="truncate pr-3 text-[13px] text-subtle">
                {profileMap[r.reported_by] ?? "—"}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">{t.noMatch}</div>
          )}
        </div>
      </div>
    </>
  );
}
