import type { Priority } from "@/lib/theme";

export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  Urgent: 4,
  High: 24,
  Medium: 48,
  Low: 72,
};

export function dueAt(createdAt: string, priority: Priority, slaHours: Record<string, number>) {
  const hours = slaHours[priority] ?? DEFAULT_SLA_HOURS[priority];
  return new Date(new Date(createdAt).getTime() + hours * 3600_000);
}

export function isOverdue(createdAt: string, priority: Priority, slaHours: Record<string, number>) {
  return dueAt(createdAt, priority, slaHours).getTime() < Date.now();
}
