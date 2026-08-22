"use client";

import {
  PRIORITY,
  ROLE_CHIP,
  OUTCOME,
  NOTIF_TAG,
  type Priority,
  type Role,
  type Outcome,
  type NotifTag,
} from "@/lib/theme";
import { useDictionary } from "@/lib/i18n/language-provider";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY[priority];
  const dict = useDictionary();
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[5px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {dict.common.priority[priority]}
    </span>
  );
}

export function UrgentTag() {
  return (
    <span className="inline-flex flex-none items-center rounded bg-urgent-bg px-[6px] py-[4px] font-mono text-[9.5px] font-semibold uppercase tracking-[.08em] text-urgent">
      urgent
    </span>
  );
}

export function RoleChip({ role }: { role: Role }) {
  const c = ROLE_CHIP[role];
  const dict = useDictionary();
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[4px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {dict.common.role[role]}
    </span>
  );
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const c = OUTCOME[outcome];
  const dict = useDictionary();
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[5px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {dict.common.outcome[outcome]}
    </span>
  );
}

export function NotifTagBadge({ tag }: { tag: NotifTag }) {
  const c = NOTIF_TAG[tag];
  const dict = useDictionary();
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[8px] py-[3px] text-[10.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {dict.common.notifTag[tag]}
    </span>
  );
}

export function UnreadDot() {
  return <span className="h-[7px] w-[7px] flex-none rounded-full bg-link" aria-hidden />;
}
