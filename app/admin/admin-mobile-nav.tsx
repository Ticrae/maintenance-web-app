"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { TABS } from "@/components/top-tabs";
import { signOut } from "@/app/actions/auth";
import { useDictionary } from "@/lib/i18n/language-provider";

function SignOutRow() {
  const { pending } = useFormStatus();
  const dict = useDictionary();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[48px] w-full items-center rounded-md px-3 text-left text-[15px] text-subtle hover:bg-hover disabled:opacity-50"
    >
      {pending ? dict.common.signingOut : dict.common.signOut}
    </button>
  );
}

export function AdminMobileNav({ active }: { active: string }) {
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
          <span className="rounded bg-ink px-[6px] py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[.08em] text-white">
            {dict.common.adminBadge}
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
                {dict.admin.nav.menu}
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
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-md px-3 text-[15px] ${
                    active === tab.key
                      ? "bg-hover font-semibold text-ink"
                      : "text-subtle hover:bg-hover"
                  }`}
                >
                  {dict.admin.nav[tab.key]}
                </Link>
              ))}
            </div>
            <form
              action={signOut}
              className="mt-auto border-t border-black/[.08] pl-36   flex  items-center"
            >
              <SignOutRow />
            </form>
          </div>
        </>
      )}
    </div>
  );
}
