// Supported UI languages, the fallback used when no preference is set, and
// the cookie name used to persist the user's chosen locale across requests.
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fixnest_locale";

// Type guard used to safely narrow an unknown/cookie string into a Locale
export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fr";
}
