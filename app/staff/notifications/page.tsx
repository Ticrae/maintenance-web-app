"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { NotifTagBadge } from "@/components/ui/badges";
import { Toggle } from "@/components/ui/inputs";
import { useAppData } from "@/lib/app-data-context";
import type { NotifTag } from "@/lib/theme";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "status", label: "Status changes" },
  { key: "comment", label: "Comments" },
  { key: "urgent", label: "Urgent" },
];

export default function NotificationsPage() {
  const { notifGroups, notifPrefs, markAllRead, toggleNotifPref } = useAppData();
  const [filter, setFilter] = useState("all");

  const allItems = notifGroups.flatMap((g) => g.items);
  const unreadTotal = allItems.filter((i) => i.unread).length;
  const counts: Record<string, number> = {
    all: allItems.length,
    unread: unreadTotal,
    status: allItems.filter((i) => i.tag === "status").length,
    comment: allItems.filter((i) => i.tag === "comment").length,
    urgent: allItems.filter((i) => i.tag === "urgent").length,
  };

  function matches(tag: NotifTag, unread: boolean) {
    if (filter === "all") return true;
    if (filter === "unread") return unread;
    return tag === filter;
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadTotal} unread · Willow House`}
        actions={
          <Button variant="outline" onClick={markAllRead}>
            Mark all as read
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 lg:flex-row lg:p-7">
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-[10px] py-[6px] text-xs ${
                  filter === f.key
                    ? "bg-graphite text-white"
                    : "bg-chip text-body hover:bg-hover"
                }`}
              >
                {f.label} · {counts[f.key]}
              </button>
            ))}
          </div>

          {notifGroups.map((group) => {
            const items = group.items.filter((i) => matches(i.tag, i.unread));
            if (!items.length) return null;
            return (
              <div key={group.day} className="flex flex-col gap-2">
                <Eyebrow>{group.day}</Eyebrow>
                <div className="flex flex-col gap-2">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 rounded-lg border border-black/[.09] px-4 py-[14px] ${
                        n.unread ? "bg-[#f7f9fe]" : "bg-surface"
                      }`}
                    >
                      <span
                        className={`mt-[5px] h-[7px] w-[7px] flex-none rounded-full ${
                          n.unread ? "bg-link" : "bg-transparent"
                        }`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-medium text-ink">
                            {n.title}
                          </span>
                          <NotifTagBadge tag={n.tag} />
                        </div>
                        <span className="text-[13px] leading-[1.5] text-body">
                          {n.body}
                        </span>
                        <span className="font-mono text-[11px] text-eyebrow">
                          {n.meta}
                        </span>
                      </div>
                      <Button variant="outline" className="flex-none">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full flex-none flex-col gap-4 lg:w-[310px]">
          <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Notify me about</Eyebrow>
            <div className="flex flex-col gap-4">
              {notifPrefs.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[13px] font-medium text-ink">
                      {p.label}
                    </span>
                    <span className="text-[11.5px] leading-[1.4] text-meta">
                      {p.hint}
                    </span>
                  </div>
                  <Toggle on={p.on} onChange={() => toggleNotifPref(p.id)} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Delivery</Eyebrow>
            <div className="flex gap-2">
              <span className="rounded-full bg-graphite px-[10px] py-[5px] text-xs text-white">
                In app
              </span>
              <span className="rounded-full bg-graphite px-[10px] py-[5px] text-xs text-white">
                Email
              </span>
              <span className="rounded-full border border-black/[.14] px-[10px] py-[5px] text-xs text-muted">
                SMS
              </span>
            </div>
            <span className="text-[11.5px] leading-[1.45] text-meta">
              Urgent updates always come through in app, even when email is
              off.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
