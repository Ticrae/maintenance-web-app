/**
 * Produces a stable date for server and client rendering.
 * `toLocaleDateString` may differ between the Node runtime and a browser.
 */
export function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

/** Current time in ms, isolated from component bodies for the purity lint rule. */
export function nowMs() {
  return Date.now();
}

export type RelativeTimeDict = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  yesterday: string;
  daysAgo: (n: number) => string;
};

const EN_RELATIVE_TIME: RelativeTimeDict = {
  justNow: "just now",
  minutesAgo: (n) => `${n}m ago`,
  hoursAgo: (n) => `${n}h ago`,
  yesterday: "yesterday",
  daysAgo: (n) => `${n}d ago`,
};

/** Renders a timestamp as a short relative string, e.g. "18m ago", "yesterday". */
export function relativeTime(value: string, dict: RelativeTimeDict = EN_RELATIVE_TIME) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return dict.justNow;
  if (minutes < 60) return dict.minutesAgo(minutes);
  if (hours < 24) return dict.hoursAgo(hours);
  if (days === 1) return dict.yesterday;
  if (days < 7) return dict.daysAgo(days);
  return formatDate(value);
}
