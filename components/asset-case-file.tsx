"use client";

import Link from "next/link";
import { StatTile, Eyebrow } from "@/components/ui/misc";
import { AssetStatusBadge } from "@/components/ui/badges";
import { tableWrapClass } from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { getAssetCaseFile } from "@/app/actions/assets";
import type { RequestStatus } from "@/app/actions/requests";

// Must match the window used server-side in getAssetCaseFile's
// `recentFailures` calculation, since it's only used here for display text.
const RECENT_FAILURE_WINDOW_DAYS = 90;

// Full detail page for a single asset: replacement warnings, cost/downtime
// stats, cost-by-year breakdown, and its full maintenance request history.
export function AssetCaseFile({
  data,
  backHref,
}: {
  data: Awaited<ReturnType<typeof getAssetCaseFile>>;
  backHref: string;
}) {
  const dict = useDictionary();
  const t = dict.common.caseFile;

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas p-7">
        <p className="text-sm text-meta">{t.notFound}</p>
        <Link href={backHref} className="text-sm text-link">
          {t.backToAssets}
        </Link>
      </div>
    );
  }

  const {
    asset,
    history,
    totalCost,
    totalDowntimeDays,
    failureCount,
    recentFailures,
    suggestReplacement,
    costByYear,
    repairToPurchaseRatio,
    suggestReplacementByCost,
  } = data;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex min-h-[62px] flex-none flex-col gap-1 border-b border-black/[.08] px-4 py-3 sm:px-7">
        <Link href={backHref} className="w-fit text-[13px] text-meta hover:text-ink">
          {t.backToAssets}
        </Link>
        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="text-lg font-semibold tracking-[-.01em] text-ink">{asset.name}</span>
          <AssetStatusBadge status={asset.status} />
        </div>
        <span className="font-mono text-xs text-meta">
          {asset.asset_types?.name ?? "—"} · {asset.homes?.name ?? "—"}
          {asset.location ? ` · ${asset.location}` : ""}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-canvas p-4 sm:p-7">
        {/* Flagged when this asset has failed too many times recently */}
        {suggestReplacement && (
          <div className="rounded-md border border-urgent-bd bg-urgent-bg px-4 py-3 text-[13px] leading-[1.5] text-urgent">
            {t.replacementWarning(recentFailures, RECENT_FAILURE_WINDOW_DAYS)}
          </div>
        )}
        {/* Flagged when repair costs have eaten up too much of the purchase price */}
        {suggestReplacementByCost && repairToPurchaseRatio !== null && (
          <div className="rounded-md border border-urgent-bd bg-urgent-bg px-4 py-3 text-[13px] leading-[1.5] text-urgent">
            {t.costRatioWarning(Math.round(repairToPurchaseRatio * 100))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <StatTile label={t.totalCost} value={`$${totalCost.toFixed(2)}`} mono />
          <StatTile label={t.downtime} value={t.downtimeDays(totalDowntimeDays)} />
          <StatTile label={t.failures} value={failureCount} />
          {asset.purchase_price !== null && (
            <StatTile label={t.purchasePrice} value={`$${asset.purchase_price.toFixed(2)}`} mono />
          )}
        </div>

        {costByYear.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-4">
            <Eyebrow>{t.costByYear}</Eyebrow>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {costByYear.map((y) => (
                <div key={y.year} className="flex flex-col gap-[2px]">
                  <span className="font-mono text-[11px] text-eyebrow">{y.year}</span>
                  <span className="font-mono text-[13px] font-medium text-ink">${y.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(asset.manufacturer || asset.model || asset.serial_number) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-black/[.09] bg-surface p-4 text-[12.5px] text-subtle">
            {asset.manufacturer && <span>{asset.manufacturer}</span>}
            {asset.model && <span>{asset.model}</span>}
            {asset.serial_number && <span className="font-mono text-eyebrow">SN {asset.serial_number}</span>}
          </div>
        )}

        {/* Every request ever linked to this asset, newest first */}
        <div className="flex flex-col gap-3">
          <Eyebrow>{t.historyTitle}</Eyebrow>
          <div className={tableWrapClass}>
            {history.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-meta">{t.noHistoryYet}</div>
            )}
            {history.map((r, i) => (
              <div
                key={r.id}
                className={`flex flex-col gap-2 px-4 py-[14px] ${
                  i < history.length - 1 ? "border-b border-black/[.06]" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-eyebrow">
                    {relativeTime(r.created_at, dict.common.time)}
                  </span>
                  <span className="text-[12px] font-medium text-ink">
                    {dict.common.status[r.status as RequestStatus] ?? r.status}
                  </span>
                </div>
                <span className="text-[13.5px] font-medium text-ink">{r.description.split("\n")[0]}</span>
                <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-subtle">
                  <span>
                    {t.resolutionLabel}: {r.resolution_notes || t.noResolution}
                  </span>
                  {r.cost !== null && (
                    <span className="font-mono text-eyebrow">
                      {t.costLabel}: ${r.cost.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
