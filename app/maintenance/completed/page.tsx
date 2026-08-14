"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TextField, Checkbox } from "@/components/ui/inputs";
import { StatTile } from "@/components/ui/misc";
import { OutcomeBadge } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { useAppData } from "@/lib/app-data-context";
import { homes } from "@/lib/fixtures";

const GRID_COLS = "grid-cols-[96px_minmax(280px,1fr)_140px_130px_100px_90px_120px]";
const PERIODS = ["This week", "Last 30 days", "This year"];

export default function CompletedPage() {
  const { completed } = useAppData();
  const [period, setPeriod] = useState("Last 30 days");
  const [homeFilter, setHomeFilter] = useState<Set<string>>(
    new Set(["Willow House", "St Marks Lodge"])
  );
  const [reopenedOnly, setReopenedOnly] = useState(false);
  const [missingEvidence, setMissingEvidence] = useState(false);

  function toggleHome(name: string) {
    const next = new Set(homeFilter);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setHomeFilter(next);
  }

  const filtered = useMemo(
    () =>
      completed.filter((c) => {
        if (homeFilter.size && !homeFilter.has(c.home)) return false;
        if (reopenedOnly && c.outcome !== "Reopened") return false;
        if (missingEvidence && c.photos > 0) return false;
        return true;
      }),
    [completed, homeFilter, reopenedOnly, missingEvidence]
  );

  const reopenedCount = filtered.filter((c) => c.outcome === "Reopened").length;
  const fixedFirstVisit = filtered.length
    ? Math.round(
        (filtered.filter((c) => c.outcome === "Fixed").length / filtered.length) * 100
      )
    : 0;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[240px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Period
          </span>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-2 text-left text-[13px] ${
                period === p ? "bg-hover font-medium text-ink" : "text-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Home
          </span>
          {homes.slice(0, 4).map((h) => (
            <Checkbox
              key={h.id}
              checked={homeFilter.has(h.name)}
              onChange={() => toggleHome(h.name)}
              label={h.name}
            />
          ))}
        </div>
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            Flags
          </span>
          <Checkbox
            checked={reopenedOnly}
            onChange={() => setReopenedOnly((v) => !v)}
            label="Reopened only"
          />
          <Checkbox
            checked={missingEvidence}
            onChange={() => setMissingEvidence((v) => !v)}
            label="Missing evidence"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="Completed"
          subtitle={`${filtered.length} jobs · ${period.toLowerCase()} · ${homeFilter.size || homes.length} homes`}
          actions={
            <>
              <TextField placeholder="Search reference or issue…" className="w-full sm:w-[250px]" />
              <Button>Export CSV</Button>
            </>
          }
        />
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-6">
          <div className="flex flex-wrap gap-3">
            <StatTile label="Completed" value={filtered.length} />
            <StatTile label="Median time on job" value="1h 05m" mono />
            <StatTile label="First-visit fix" value={`${fixedFirstVisit}%`} />
            <StatTile
              label="Reopened"
              value={reopenedCount}
              valueClassName="text-urgent"
            />
          </div>

          <div className={tableWrapClass}>
            <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
              <span>Ref</span>
              <span>Issue</span>
              <span>Home</span>
              <span>Completed</span>
              <span>On job</span>
              <span>Photos</span>
              <span>Outcome</span>
            </div>
            {filtered.map((c) => (
              <div key={c.ref} className={`${tableRowClass} ${GRID_COLS}`}>
                <span className="font-mono text-xs font-medium text-faint">{c.ref}</span>
                <span className="truncate pr-4 text-[13.5px] font-medium text-ink">
                  {c.title}
                </span>
                <span className="text-[13px] text-subtle">{c.home}</span>
                <span className="font-mono text-xs text-subtle">{c.done}</span>
                <span className="font-mono text-xs text-subtle">{c.onJob}</span>
                <span
                  className={`font-mono text-xs ${
                    c.photos === 0 ? "text-urgent" : "text-subtle"
                  }`}
                >
                  {c.photos === 0 ? "none" : `${c.photos} ✓`}
                </span>
                <OutcomeBadge outcome={c.outcome} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
