import type { Priority } from "@/lib/theme";

// Fallback SLA windows (in hours) per priority, used when an agency hasn't
// configured its own custom SLA hours.
export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  Urgent: 4,
  High: 24,
  Medium: 48,
  Low: 72,
};

// Computes the deadline for a request: created time + the applicable SLA
// window, preferring an agency-configured override over the default.
export function dueAt(createdAt: string, priority: Priority, slaHours: Record<string, number>) {
  const hours = slaHours[priority] ?? DEFAULT_SLA_HOURS[priority];
  return new Date(new Date(createdAt).getTime() + hours * 3600_000);
}

// Whether a request's SLA deadline has already passed relative to now
export function isOverdue(createdAt: string, priority: Priority, slaHours: Record<string, number>) {
  return dueAt(createdAt, priority, slaHours).getTime() < Date.now();
}
