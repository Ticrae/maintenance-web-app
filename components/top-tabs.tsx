import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export const TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/homes", label: "Homes & staff" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function TopTabs({ active }: { active: string }) {
  return (
    <div className="flex min-h-[62px] flex-none items-center gap-3 overflow-x-auto border-b border-black/[.08] px-4 py-3 sm:px-7">
      <div className="flex items-center gap-[10px]">
        <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
        <span className="text-sm font-semibold tracking-[-.01em] text-ink">
          Upkeep
        </span>
        <span className="rounded bg-ink px-[6px] py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[.08em] text-white">
          admin
        </span>
      </div>
      <div className="flex flex-none items-center gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`rounded-md px-3 py-2 text-[13px] ${
              active === tab.label
                ? "bg-hover font-medium text-ink"
                : "text-subtle hover:bg-hover"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex-none">
        <SignOutButton />
      </div>
    </div>
  );
}
