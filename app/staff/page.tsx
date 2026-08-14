"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonClasses } from "@/components/ui/button";
import { TextField } from "@/components/ui/inputs";
import { StatTile } from "@/components/ui/misc";
import { PriorityBadge, UnreadDot } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { useAppData } from "@/lib/app-data-context";

const GRID_COLS = "grid-cols-[104px_minmax(280px,1fr)_150px_130px_118px_132px]";

export default function MyRequestsPage() {
  const { myRequests } = useAppData();

  const awaiting = myRequests.filter((r) => r.status === "Open").length;
  const inProgress = myRequests.filter(
    (r) => r.status === "In progress" || r.status === "Accepted"
  ).length;
  const urgentOpen = myRequests.filter(
    (r) => r.priority === "Urgent" && r.status !== "Completed"
  ).length;

  return (
    <>
      <PageHeader
        title="My requests"
        subtitle="Willow House · 24 residents"
        actions={
          <>
            <TextField placeholder="Search reference or room…" className="w-full sm:w-[250px]" />
            <Link href="/staff/new" className={buttonClasses("primary")}>
              New request
            </Link>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Awaiting acceptance" value={awaiting} />
          <StatTile label="In progress" value={inProgress} />
          <StatTile label="Urgent open" value={urgentOpen} valueClassName="text-urgent" />
          <StatTile label="Avg. response" value="4h 12m" mono />
        </div>

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>Ref</span>
            <span>Issue</span>
            <span>Location</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
          </div>
          {myRequests.map((r) => (
            <div
              key={r.ref}
              className={`${tableRowClass} ${GRID_COLS}`}
            >
              <span className="font-mono text-xs font-medium text-faint">{r.ref}</span>
              <div className="flex min-w-0 items-center gap-2 pr-4">
                <span className="truncate text-[13.5px] font-medium text-ink">
                  {r.title}
                </span>
                {r.photos > 0 && (
                  <span className="flex-none rounded border border-black/[.12] px-[5px] py-[3px] font-mono text-[10.5px] text-meta">
                    {r.photos} photo{r.photos > 1 ? "s" : ""}
                  </span>
                )}
                {r.unread && <UnreadDot />}
              </div>
              <span className="text-[13px] text-subtle">{r.location}</span>
              <span className="text-[13px] text-subtle">{r.category}</span>
              <PriorityBadge priority={r.priority} />
              <div className="flex flex-col gap-[3px]">
                <span className="text-[12.5px] font-medium text-ink">{r.status}</span>
                <span className="font-mono text-[11px] text-eyebrow">{r.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
