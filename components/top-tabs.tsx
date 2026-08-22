"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { useDictionary } from "@/lib/i18n/language-provider";

export const TABS = [
  { href: "/admin/reports", key: "reports" },
  { href: "/admin/requests", key: "requests" },
  { href: "/admin/homes", key: "homesAndStaff" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/settings", key: "settings" },
] as const;

export function TopTabs({ active }: { active: string }) {
  const dict = useDictionary();

  return (
    <div className="hidden min-h-[62px] flex-none items-center gap-3 overflow-x-auto border-b border-black/[.08] px-4 py-3 sm:px-7 md:flex">
      <div className="flex items-center gap-[10px]">
        <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
        <span className="text-sm font-semibold tracking-[-.01em] text-ink">
          {dict.common.brand}
        </span>
        <span className="rounded bg-ink px-[6px] py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[.08em] text-white">
          {dict.common.adminBadge}
        </span>
      </div>
      <div className="flex flex-none items-center gap-1 !text-graphite">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-md px-3 py-2 text-[13px] ${
              active === tab.key
                ? "bg-hover font-medium text-ink"
                : "text-subtle hover:bg-hover"
            }`}
          >
            {dict.admin.nav[tab.key]}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex-none">
        <SignOutButton />
      </div>
    </div>
  );
}
