"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Locale } from "@/lib/i18n/config";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

// Sits inline in whatever header/footer chrome renders it (admin's top bar,
// the staff/maintenance/supervisor sidebar footer and mobile bar, and the
// auth pages' logo row) rather than floating fixed over the page, so it's
// part of the header everywhere without ever overlapping other controls.
export function LanguageToggle({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];

  // Some header bars (e.g. admin's, which scrolls horizontally on narrow
  // screens) set overflow-x, which per the CSS spec forces overflow-y to
  // "auto" too — an absolutely-positioned dropdown inside that bar would
  // get clipped/grow the bar instead of floating over the page. Portaling
  // to <body> and positioning from the button's own screen coordinates
  // sidesteps that entirely, regardless of what ancestor it's rendered in.
  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={compact ? `Language: ${current.label}` : undefined}
        className={`flex items-center gap-[6px] whitespace-nowrap rounded-full border px-3 py-[6px] text-[12px] font-medium transition-colors ${
          inverted
            ? "border-white/[.18] text-white hover:bg-white/[.1]"
            : "border-black/[.1] bg-surface text-body hover:bg-hover"
        }`}
      >
        <span aria-hidden>🌐</span>
        {!compact && current.label}
        <span aria-hidden className={`text-[10px] ${inverted ? "text-white/60" : "text-meta"}`}>
          ▾
        </span>
      </button>

      {open &&
        menuPos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              role="listbox"
              aria-label="Language"
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed z-50 flex flex-col gap-[2px] rounded-lg border border-black/[.09] bg-surface p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]"
            >
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={locale === opt.value}
                  onClick={() => {
                    setLocale(opt.value);
                    setOpen(false);
                  }}
                  className={`whitespace-nowrap rounded-md px-3 py-[7px] text-left text-[12.5px] font-medium ${
                    locale === opt.value ? "bg-graphite text-white" : "text-body hover:bg-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
