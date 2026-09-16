"use client";

import { useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/lib/i18n/language-provider";

export type SupervisorNavItem = {
  href: string;
  label: string;
  active: boolean;
  count?: number;
};

export function SupervisorMobileNav({
  items,
  subtitle,
}: {
  items: SupervisorNavItem[];
  subtitle: string;
}) {
  const [open, setOpen] = useState(false);
  const dict = useDictionary();

  return (
    <div className="flex-none border-b border-black/[.08] px-4 py-3 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-[10px]">
          <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
          <span className="text-sm font-semibold tracking-[-.01em] text-ink">
            {dict.common.brand}
          </span>
          <span className="truncate rounded bg-ink px-[6px] py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[.08em] text-white">
            {subtitle}
          </span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 flex-none flex-col items-center justify-center gap-1 rounded-md hover:bg-hover"
        >
          <span className="h-[2px] w-5 rounded-full bg-ink" />
          <span className="h-[2px] w-5 rounded-full bg-ink" />
          <span className="h-[2px] w-5 rounded-full bg-ink" />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/35"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-20 flex h-full w-[268px] flex-col bg-panel shadow-[-14px_0_34px_rgba(0,0,0,.14)]">
            <div className="flex items-center justify-between border-b border-black/[.08] px-4 py-[14px]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
                {dict.common.menu}
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-lg text-meta hover:bg-hover hover:text-muted"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-[2px] p-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[48px] items-center justify-between rounded-md px-3 text-[15px] ${
                    item.active
                      ? "bg-hover font-semibold text-ink"
                      : "text-subtle hover:bg-hover"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="font-mono text-xs text-eyebrow">{item.count}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
