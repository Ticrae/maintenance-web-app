/**
 * Produces a stable date for server and client rendering.
 * `toLocaleDateString` may differ between the Node runtime and a browser.
 */
export function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
