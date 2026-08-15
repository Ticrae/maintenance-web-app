"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { Select } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import { assignRequest } from "@/app/actions/requests";

const TONE_FILL: Record<string, string> = { default: "bg-graphite", amber: "bg-high-bar", red: "bg-urgent" };
const TONE_TEXT: Record<string, string> = { default: "text-ink", amber: "text-high", red: "text-urgent" };

export type UnassignedRow = {
  id: string;
  agencyId: string;
  title: string;
  home: string;
  created_at: string;
  waitLong: boolean;
};

export type Assignee = { id: string; first_name: string | null; last_name: string | null; agency_id: string | null };

function assigneeName(a: Assignee) {
  return [a.first_name, a.last_name].filter(Boolean).join(" ") || "Unnamed";
}

export function ReportsView({
  totalRequests,
  medianResponse,
  urgentSlaPct,
  openOver7Days,
  openOver7HomeCount,
  homeTimes,
  categories,
  unassigned,
  assignees,
}: {
  totalRequests: number;
  medianResponse: string;
  urgentSlaPct: number | null;
  openOver7Days: number;
  openOver7HomeCount: number;
  homeTimes: { home: string; pct: number; value: string; tone: "default" | "amber" | "red" }[];
  categories: { category: string; value: number; pct: number }[];
  unassigned: UnassignedRow[];
  assignees: Assignee[];
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAssign(requestId: string, userId: string) {
    if (!userId) return;
    setError(null);
    startTransition(async () => {
      try {
        await assignRequest(requestId, userId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not assign this request.");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title="Reports" subtitle="Response times and workload across all homes" />
      <div className="flex flex-1 flex-col gap-5 bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Total requests" value={totalRequests} />
          <StatTile label="Median response" value={medianResponse} mono />
          <StatTile label="Urgent within SLA" value={urgentSlaPct !== null ? `${urgentSlaPct}%` : "—"} />
          <StatTile
            label="Open over 7 days"
            value={openOver7Days}
            valueClassName="text-urgent"
            context={`across ${openOver7HomeCount} homes`}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Median response time by home</Eyebrow>
            <div className="flex flex-col gap-3">
              {homeTimes.map((h) => (
                <div key={h.home} className="flex items-center gap-3">
                  <span className="w-[110px] flex-none truncate text-[12.5px] text-body">{h.home}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-selected">
                    <div className={`h-full rounded-full ${TONE_FILL[h.tone]}`} style={{ width: `${h.pct}%` }} />
                  </div>
                  <span className={`w-14 flex-none text-right font-mono text-[11.5px] ${TONE_TEXT[h.tone]}`}>
                    {h.value}
                  </span>
                </div>
              ))}
              {homeTimes.length === 0 && <span className="text-sm text-meta">No completed requests yet.</span>}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Requests by category</Eyebrow>
            <div className="flex flex-col gap-3">
              {categories.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-[140px] flex-none truncate text-[12.5px] text-body">{c.category}</span>
                  <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-selected">
                    <div className="h-full rounded-full bg-graphite" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="w-8 flex-none text-right font-mono text-[11.5px] text-eyebrow">{c.value}</span>
                </div>
              ))}
              {categories.length === 0 && <span className="text-sm text-meta">No requests yet.</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>Unassigned — needs a manual assignment</Eyebrow>
            <span className="font-mono text-[11.5px] text-eyebrow">{unassigned.length} waiting</span>
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {unassigned.map((u) => {
              const eligible = assignees.filter((a) => a.agency_id === u.agencyId);
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[90px_minmax(180px,1fr)_150px_100px_220px] items-center gap-3 overflow-x-auto rounded-md border border-black/[.08] px-4 py-3"
                >
                  <span className="font-mono text-xs font-medium text-faint">{u.id.slice(0, 8).toUpperCase()}</span>
                  <span className="truncate text-[13px] font-medium text-ink">{u.title}</span>
                  <span className="text-[13px] text-subtle">{u.home}</span>
                  <span className={`font-mono text-xs ${u.waitLong ? "text-urgent" : "text-meta"}`}>
                    {relativeTime(u.created_at)}
                  </span>
                  <Select className="h-8 text-xs" defaultValue="" onChange={(e) => handleAssign(u.id, e.target.value)}>
                    <option value="">Assign to…</option>
                    {eligible.map((a) => (
                      <option key={a.id} value={a.id}>
                        {assigneeName(a)}
                      </option>
                    ))}
                  </Select>
                </div>
              );
            })}
            {unassigned.length === 0 && <span className="py-2 text-sm text-meta">All requests are assigned.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
