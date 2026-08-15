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

/** Renders a timestamp as a short relative string, e.g. "18m ago", "yesterday". */
export function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}
