"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TextField, Checkbox } from "@/components/ui/inputs";
import { StatTile } from "@/components/ui/misc";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { useDictionary } from "@/lib/i18n/language-provider";

export type CompletedRow = {
  id: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
  homeId: string;
  homeName: string;
  photoCount: number;
};

const GRID_COLS = "grid-cols-[96px_minmax(280px,1fr)_140px_130px_100px_120px]";

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function CompletedView({ completed, homes }: { completed: CompletedRow[]; homes: { id: string; name: string }[] }) {
  const dict = useDictionary();
  const t = dict.maintenance.completed;
  const [search, setSearch] = useState("");
  const [homeFilter, setHomeFilter] = useState<Set<string>>(new Set());
  const [missingEvidence, setMissingEvidence] = useState(false);

  function toggleHome(id: string) {
    const next = new Set(homeFilter);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHomeFilter(next);
  }

  const filtered = useMemo(
    () =>
      completed.filter((c) => {
        if (homeFilter.size && !homeFilter.has(c.homeId)) return false;
        if (missingEvidence && c.photoCount > 0) return false;
        const q = search.trim().toLowerCase();
        if (q && !c.description.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q))
          return false;
        return true;
      }),
    [completed, homeFilter, missingEvidence, search]
  );

  const medianMs = median(
    filtered.map((c) => new Date(c.updated_at).getTime() - new Date(c.created_at).getTime())
  );
  const withEvidence = filtered.filter((c) => c.photoCount > 0).length;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex w-full flex-none flex-col gap-6 border-b border-black/[.08] bg-panel px-[18px] py-5 md:w-[240px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            {dict.common.table.home}
          </span>
          {homes.map((h) => (
            <Checkbox
              key={h.id}
              checked={homeFilter.has(h.id)}
              onChange={() => toggleHome(h.id)}
              label={h.name}
            />
          ))}
        </div>
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
            {t.flags}
          </span>
          <Checkbox
            checked={missingEvidence}
            onChange={() => setMissingEvidence((v) => !v)}
            label={t.missingEvidence}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title={dict.maintenance.nav.completed}
          subtitle={t.subtitle(filtered.length)}
          actions={
            <TextField
              placeholder={t.searchPlaceholder}
              className="w-full sm:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        />
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-6">
          <div className="flex flex-wrap gap-3">
            <StatTile label={dict.maintenance.nav.completed} value={filtered.length} />
            <StatTile label={t.statMedianTime} value={medianMs !== null ? formatDuration(medianMs) : "—"} mono />
            <StatTile label={t.statWithEvidence} value={withEvidence} />
          </div>

          <div className={tableWrapClass}>
            <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
              <span>{dict.common.table.ref}</span>
              <span>{dict.common.table.issue}</span>
              <span>{dict.common.table.home}</span>
              <span>{t.colCompleted}</span>
              <span>{t.colOnJob}</span>
              <span>{t.colPhotos}</span>
            </div>
            {filtered.map((c) => (
              <div key={c.id} className={`${tableRowClass} ${GRID_COLS}`}>
                <span className="font-mono text-xs font-medium text-faint">
                  {c.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="truncate pr-4 text-[13.5px] font-medium text-ink">
                  {c.description.split("\n")[0]}
                </span>
                <span className="text-[13px] text-subtle">{c.homeName}</span>
                <span className="font-mono text-xs text-subtle">{formatDate(c.updated_at)}</span>
                <span className="font-mono text-xs text-subtle">
                  {formatDuration(new Date(c.updated_at).getTime() - new Date(c.created_at).getTime())}
                </span>
                <span className={`font-mono text-xs ${c.photoCount === 0 ? "text-urgent" : "text-subtle"}`}>
                  {c.photoCount === 0 ? t.none : `${c.photoCount} ✓`}
                </span>
              </div>
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
