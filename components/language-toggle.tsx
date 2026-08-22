"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import type { Locale } from "@/lib/i18n/config";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+14px)] right-[40%] md:right-4 z-50 flex items-center gap-[2px] rounded-full border border-black/[.1] bg-surface p-[3px] shadow-[0_6px_18px_rgba(0,0,0,.12)]"
      role="group"
      aria-label="Language"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          className={`rounded-full px-3 py-[6px] font-mono text-[11px] font-semibold tracking-[.04em] transition-colors ${
            locale === opt.value
              ? "bg-graphite text-white"
              : "text-muted hover:bg-hover"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
