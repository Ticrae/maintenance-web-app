"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Eyebrow } from "@/components/ui/misc";
import { NotifTagBadge } from "@/components/ui/badges";
import type { NotifTag } from "@/lib/theme";
import { useDictionary } from "@/lib/i18n/language-provider";

export type NotifItem = {
  id: string;
  tag: NotifTag;
  title: string;
  body: string;
  meta: string;
  timestamp: string;
  day: string;
};

export function NotificationsList({ items, homeName }: { items: NotifItem[]; homeName: string }) {
  const [filter, setFilter] = useState("all");
  const dict = useDictionary();
  const t = dict.staff.notifications;

  const FILTERS: { key: string; label: string }[] = [
    { key: "all", label: dict.common.all },
    { key: "status", label: t.filterStatus },
    { key: "comment", label: t.filterComments },
    { key: "urgent", label: t.filterUrgent },
  ];

  const counts: Record<string, number> = {
    all: items.length,
    status: items.filter((i) => i.tag === "status").length,
    comment: items.filter((i) => i.tag === "comment").length,
    urgent: items.filter((i) => i.tag === "urgent").length,
  };

  const groups = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((i) => i.tag === filter);
    const byDay = new Map<string, NotifItem[]>();
    for (const item of filtered) {
      if (!byDay.has(item.day)) byDay.set(item.day, []);
      byDay.get(item.day)!.push(item);
    }
    return Array.from(byDay.entries());
  }, [items, filter]);

  return (
    <>
      <PageHeader title={dict.staff.nav.notifications} subtitle={t.subtitle(homeName)} />
      <div className="flex flex-1 flex-col gap-5 overflow-auto bg-canvas p-4 sm:p-7">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-[10px] py-[6px] text-xs ${
                filter === f.key ? "bg-graphite text-white" : "bg-chip text-body hover:bg-hover"
              }`}
            >
              {f.label} · {counts[f.key]}
            </button>
          ))}
        </div>

        {groups.map(([day, dayItems]) => (
          <div key={day} className="flex flex-col gap-2">
            <Eyebrow>{day}</Eyebrow>
            <div className="flex flex-col gap-2">
              {dayItems.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-black/[.09] bg-surface px-4 py-[14px]"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium text-ink">{n.title}</span>
                      <NotifTagBadge tag={n.tag} />
                    </div>
                    {n.body && <span className="text-[13px] leading-[1.5] text-body">{n.body}</span>}
                    <span className="font-mono text-[11px] text-eyebrow">{n.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <span className="py-2 text-sm text-meta">{t.noRecentActivity}</span>
        )}
      </div>
    </>
  );
}
