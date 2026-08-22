export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fixnest_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fr";
}
