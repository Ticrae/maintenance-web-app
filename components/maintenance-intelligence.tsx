"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Eyebrow } from "@/components/ui/misc";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { getMaintenanceIntelligence } from "@/app/actions/intelligence";

// Shared card wrapper for each intelligence panel below, with an icon +
// colored heading matching its severity `tone`.
function Section({
  icon,
  title,
  tone,
  children,
}: {
  icon: string;
  title: string;
  tone: "urgent" | "high" | "success" | "ink";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "urgent" ? "text-urgent" : tone === "high" ? "text-high" : tone === "success" ? "text-success" : "text-ink";
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
      <Eyebrow>
        <span className={toneClass}>
          {icon} {title}
        </span>
      </Eyebrow>
      {children}
    </div>
  );
}

// "What should I worry about?" insights page shared by supervisor/admin:
// urgent requests, recurring asset failures, stale inspections, cost and
// trend callouts. Renders an all-clear message when nothing is notable.
export function MaintenanceIntelligence({
  title,
  data,
  assetBasePath,
}: {
  title: string;
  data: Awaited<ReturnType<typeof getMaintenanceIntelligence>>;
  assetBasePath: string;
}) {
  const dict = useDictionary();
  const t = dict.common.intelligence;
  const { immediateAttention, recurring, staleInspections, costInsight, emergingTrend } = data;

  const nothingNotable =
    immediateAttention.length === 0 &&
    recurring.flaggedAssets.length === 0 &&
    staleInspections.length === 0 &&
    !costInsight &&
    !emergingTrend;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title={title} subtitle={t.subtitle} />
      <div className="flex flex-1 flex-col gap-4 bg-canvas p-4 sm:p-7">
        {nothingNotable && (
          <div className="rounded-lg border border-black/[.09] bg-surface p-8 text-center text-sm text-meta">{t.allClear}</div>
        )}

        {/* Urgent/critical open requests needing immediate action */}
        {immediateAttention.length > 0 && (
          <Section icon="🔴" title={t.immediateAttention} tone="urgent">
            <div className="flex flex-col gap-2">
              {immediateAttention.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[13px] text-body">
                  <span className="truncate pr-3">{r.title}</span>
                  <span className="flex-none font-mono text-[11px] text-eyebrow">{r.homeName}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Assets that have failed repeatedly within the tracked window */}
        {recurring.flaggedAssets.length > 0 && (
          <Section icon="🟠" title={t.recurringProblems} tone="high">
            <div className="flex flex-col gap-2">
              {recurring.flaggedAssets.map((a) => (
                <Link
                  key={a.id}
                  href={`${assetBasePath}/${a.id}`}
                  className="flex flex-col gap-[2px] rounded-md px-2 py-1 hover:bg-hover"
                >
                  <span className="text-[13px] font-medium text-ink">
                    {a.name} · {a.homeName}
                  </span>
                  <span className="text-[12px] text-subtle">
                    {dict.common.recurring.failuresInWindow(a.recentFailures, recurring.windowDays)}
                    {a.topCategory ? ` · ${dict.common.recurring.mostCommonIssue(a.topCategory)}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Inspections started but left incomplete for too long */}
        {staleInspections.length > 0 && (
          <Section icon="🟡" title={t.incompleteInspections} tone="high">
            <div className="flex flex-col gap-2">
              {staleInspections.map((s) => (
                <div key={s.id} className="text-[13px] text-body">
                  {s.templateName} · <span className="text-subtle">{s.homeName}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Total repair spend + which assets are driving it */}
        {costInsight && (
          <Section icon="💰" title={t.costInsight} tone="ink">
            <p className="text-[13px] text-body">{t.totalCostLine(costInsight.totalCost)}</p>
            {costInsight.topAssets.length > 0 && (
              <div className="flex flex-col gap-1">
                {costInsight.topAssets.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-[12.5px] text-subtle">
                    <span>{a.name}</span>
                    <span className="font-mono text-eyebrow">
                      ${a.cost.toFixed(2)} ({a.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* A request category rising sharply over the last 30 days */}
        {emergingTrend && (
          <Section icon="📈" title={t.emergingTrend} tone="ink">
            <p className="text-[13px] text-body">
              {t.trendLine(emergingTrend.category, emergingTrend.changePct)}
            </p>
            <p className="text-[12.5px] text-subtle">{t.trendHomes(emergingTrend.homeCount)}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
