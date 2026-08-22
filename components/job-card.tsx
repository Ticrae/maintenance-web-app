"use client";

import Link from "next/link";
import { PRIORITY, type Priority } from "@/lib/theme";
import { UrgentTag } from "@/components/ui/badges";
import { useDictionary } from "@/lib/i18n/language-provider";

export function JobCard({
  ref: jobRef,
  priority,
  title,
  urgent,
  meta,
  right,
  actions,
}: {
  ref: string;
  priority: Priority;
  title: string;
  urgent: boolean;
  meta: string;
  right: React.ReactNode;
  actions: React.ReactNode;
}) {
  const c = PRIORITY[priority];
  const dict = useDictionary();
  return (
    <div className="flex items-stretch gap-0 overflow-hidden rounded-lg border border-black/[.09] bg-surface hover:border-black/[.18]">
      <div className={`w-[3px] flex-none ${c.bar}`} />
      <div className="flex flex-1 flex-wrap items-center gap-3 py-[14px] pl-[13px] pr-4 sm:flex-nowrap sm:gap-4">
        <div className="flex w-[74px] flex-none flex-col gap-1">
          <span className="font-mono text-[11.5px] font-medium text-faint">
            {jobRef}
          </span>
          <span className={`text-[10.5px] font-medium ${c.fg}`}>{dict.common.priority[priority]}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{title}</span>
            {urgent && <UrgentTag />}
          </div>
          <span className="font-mono text-xs text-meta">{meta}</span>
        </div>
        <div className="flex min-w-[120px] flex-1 flex-col gap-1 sm:w-[160px] sm:flex-none">{right}</div>
        <div className="flex flex-none items-center gap-[9px]">{actions}</div>
      </div>
    </div>
  );
}

export function JobCardLink({ href, refLabel }: { href: string; refLabel: string }) {
  const dict = useDictionary();
  return (
    <Link
      href={href}
      className="rounded-md border border-black/[.14] px-3 py-2 text-[12.5px] font-medium text-muted hover:bg-hover"
    >
      {dict.common.openRef(refLabel)}
    </Link>
  );
}
