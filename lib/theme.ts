export type Priority = "Urgent" | "High" | "Medium" | "Low";

export const PRIORITY: Record<
  Priority,
  { bg: string; fg: string; bar: string }
> = {
  Urgent: { bg: "bg-urgent-bg", fg: "text-urgent", bar: "bg-urgent" },
  High: { bg: "bg-high-bg", fg: "text-high", bar: "bg-high-bar" },
  Medium: { bg: "bg-chip", fg: "text-graphite", bar: "bg-eyebrow" },
  Low: { bg: "bg-selected", fg: "text-faint", bar: "bg-hairline" },
};

// These values mirror the roles stored in the database.
export type Role = "super_admin" | "agency_admin" | "maintenance" | "staff";

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  agency_admin: "Agency admin",
  maintenance: "Maintenance",
  staff: "Home staff",
};

export const ROLE_CHIP: Record<Role, { bg: string; fg: string }> = {
  staff: { bg: "bg-chip", fg: "text-graphite" },
  maintenance: { bg: "bg-link-bg", fg: "text-link" },
  agency_admin: { bg: "bg-success-bg", fg: "text-success" },
  super_admin: { bg: "bg-ink", fg: "text-white" },
};

export type Outcome = "Fixed" | "Contractor" | "Reopened";

export const OUTCOME: Record<Outcome, { bg: string; fg: string }> = {
  Fixed: { bg: "bg-success-bg", fg: "text-success" },
  Contractor: { bg: "bg-high-bg", fg: "text-high" },
  Reopened: { bg: "bg-urgent-bg", fg: "text-urgent" },
};

export type SafetyLevel = "safe" | "caution" | "maintenance_required";

export const SAFETY_LEVEL: Record<SafetyLevel, { bg: string; fg: string; dot: string }> = {
  safe: { bg: "bg-success-bg", fg: "text-success", dot: "🟢" },
  caution: { bg: "bg-high-bg", fg: "text-high", dot: "🟡" },
  maintenance_required: { bg: "bg-urgent-bg", fg: "text-urgent", dot: "🔴" },
};

export type GuideStatus = "draft" | "review" | "published" | "archived";

export const GUIDE_STATUS: Record<GuideStatus, { bg: string; fg: string }> = {
  draft: { bg: "bg-chip", fg: "text-graphite" },
  review: { bg: "bg-high-bg", fg: "text-high" },
  published: { bg: "bg-success-bg", fg: "text-success" },
  archived: { bg: "bg-selected", fg: "text-faint" },
};

export type NotifTag = "status" | "comment" | "urgent" | "reminder";

export const NOTIF_TAG: Record<
  NotifTag,
  { bg: string; fg: string; label: string; dot: string }
> = {
  status: { bg: "bg-chip", fg: "text-muted", label: "status", dot: "bg-eyebrow" },
  comment: { bg: "bg-link-bg", fg: "text-link", label: "comment", dot: "bg-link" },
  urgent: { bg: "bg-urgent-bg", fg: "text-urgent", label: "urgent", dot: "bg-urgent" },
  reminder: { bg: "bg-high-bg", fg: "text-high", label: "reminder", dot: "bg-high-bar" },
};
