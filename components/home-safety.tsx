"use client";

import Link from "next/link";
import { Eyebrow } from "@/components/ui/misc";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { getHomeSafetySummary } from "@/app/actions/safety";

// Traffic-light indicator: green when clear, yellow for a small count,
// red once it climbs past 2
function dotFor(count: number): string {
  if (count === 0) return "🟢";
  if (count <= 2) return "🟡";
  return "🔴";
}

// Home safety summary card: key counts (open/overdue/safety/critical) plus
// a per-home "needs attention" breakdown when anything is flagged.
export function HomeSafety({
  summary,
  assetBasePath,
}: {
  summary: Awaited<ReturnType<typeof getHomeSafetySummary>>;
  assetBasePath: string;
}) {
  const dict = useDictionary();
  const t = dict.common.homeSafety;
  const { totals, attentionRequired } = summary;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
      <Eyebrow>🏠 {t.title}</Eyebrow>

      <div className="flex flex-col gap-2">
        {[
          { label: t.openMaintenance, dot: "🟢", value: totals.open },
          { label: t.overdueRequests, dot: dotFor(totals.overdue), value: totals.overdue },
          { label: t.safetyIssues, dot: dotFor(totals.safetyIssues), value: totals.safetyIssues },
          { label: t.criticalAssets, dot: dotFor(totals.criticalAssets), value: totals.criticalAssets },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-black/[.06] py-2 last:border-b-0">
            <span className="text-[13px] text-body">{row.label}</span>
            <span className="font-mono text-[13px] text-ink">
              {row.dot} {row.value}
            </span>
          </div>
        ))}
        {[t.preventiveTasks, t.inspections, t.contractorWork].map((label) => (
          <div key={label} className="flex items-center justify-between border-b border-black/[.06] py-2 last:border-b-0">
            <span className="text-[13px] text-faint">{label}</span>
            <span className="font-mono text-[11.5px] text-faint">{t.comingSoon}</span>
          </div>
        ))}
      </div>

      {attentionRequired.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-black/[.07] pt-4">
          <span className="text-[13px] font-semibold text-urgent">{t.attentionRequired}</span>
          {attentionRequired.map((home) => (
            <div key={home.homeId} className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-ink">{home.homeName}</span>
              <ul className="flex flex-col gap-[3px] pl-4 text-[12.5px] text-subtle">
                {home.overdueCount > 0 && <li className="list-disc">{t.overdueLine(home.overdueCount)}</li>}
                {home.safetyOpenCount > 0 && <li className="list-disc">{t.safetyLine(home.safetyOpenCount)}</li>}
                {home.flaggedAssets.map((a) => (
                  <li key={a.id} className="list-disc">
                    <Link href={`${assetBasePath}/${a.id}`} className="hover:text-link hover:underline">
                      {t.flaggedAssetLine(a.name, a.recentFailures, a.topCategory)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {attentionRequired.length === 0 && (
        <p className="border-t border-black/[.07] pt-4 text-[12.5px] text-meta">{t.allClear}</p>
      )}
    </div>
  );
}
