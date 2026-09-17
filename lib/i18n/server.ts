import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

// Reads the user's saved locale cookie on the server, falling back to the
// default locale if it's missing or invalid.
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Convenience helper for Server Components: resolves the current locale and
// returns its translation dictionary in one call.
export async function getServerDictionary(): Promise<Dictionary> {
  const locale = await getServerLocale();
  return dictionaries[locale];
}
