"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { Select } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import { assignRequest } from "@/app/actions/requests";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

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

function assigneeName(a: Assignee, dict: Dictionary) {
  return [a.first_name, a.last_name].filter(Boolean).join(" ") || dict.common.unnamed;
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
  const dict = useDictionary();
  const t = dict.admin.reports;

  function handleAssign(requestId: string, userId: string) {
    if (!userId) return;
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
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-1 flex-col gap-5 bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label={dict.common.stat.totalRequests} value={totalRequests} />
          <StatTile label={t.medianResponse} value={medianResponse} mono />
          <StatTile label={t.urgentWithinSla} value={urgentSlaPct !== null ? `${urgentSlaPct}%` : "—"} />
          <StatTile
            label={t.openOver7Days}
            value={openOver7Days}
            valueClassName="text-urgent"
            context={t.acrossHomes(openOver7HomeCount)}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.medianResponseByHome}</Eyebrow>
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
              {homeTimes.length === 0 && <span className="text-sm text-meta">{t.noCompletedRequests}</span>}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.requestsByCategory}</Eyebrow>
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
              {categories.length === 0 && <span className="text-sm text-meta">{t.noRequestsYet}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>{t.unassignedHeading}</Eyebrow>
            <span className="font-mono text-[11.5px] text-eyebrow">{t.waiting(unassigned.length)}</span>
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
                  className="flex flex-col gap-2 rounded-md border border-black/[.08] px-4 py-3 sm:grid sm:grid-cols-[90px_minmax(180px,1fr)_150px_100px_220px] sm:items-center sm:gap-3 sm:overflow-x-auto"
                >
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    <span className="font-mono text-xs font-medium text-faint sm:order-1">{u.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`font-mono text-xs sm:order-4 ${u.waitLong ? "text-urgent" : "text-meta"}`}>
                      {relativeTime(u.created_at, dict.common.time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    <span className="truncate text-[13px] font-medium text-ink sm:order-2">{u.title}</span>
                    <span className="flex-none text-[13px] text-subtle sm:order-3">{u.home}</span>
                  </div>
                  <Select className="h-9 text-xs sm:order-5 sm:h-8" defaultValue="" onChange={(e) => handleAssign(u.id, e.target.value)}>
                    <option value="">{dict.common.assignTo}</option>
                    {eligible.map((a) => (
                      <option key={a.id} value={a.id}>
                        {assigneeName(a, dict)}
                      </option>
                    ))}
                  </Select>
                </div>
              );
            })}
            {unassigned.length === 0 && <span className="py-2 text-sm text-meta">{t.allAssigned}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
