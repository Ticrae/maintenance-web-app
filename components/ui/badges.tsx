import {
  PRIORITY,
  ROLE_CHIP,
  ROLE_LABEL,
  OUTCOME,
  NOTIF_TAG,
  type Priority,
  type Role,
  type Outcome,
  type NotifTag,
} from "@/lib/theme";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY[priority];
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[5px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {priority}
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
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[4px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const c = OUTCOME[outcome];
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[9px] py-[5px] text-[11.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {outcome}
    </span>
  );
}

export function NotifTagBadge({ tag }: { tag: NotifTag }) {
  const c = NOTIF_TAG[tag];
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[5px] px-[8px] py-[3px] text-[10.5px] font-medium ${c.bg} ${c.fg}`}
    >
      {c.label}
    </span>
  );
}

export function UnreadDot() {
  return <span className="h-[7px] w-[7px] flex-none rounded-full bg-link" aria-hidden />;
}
