"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarSectionLabel,
  SidebarUserFooter,
  MobileTabBar,
} from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { useDictionary } from "@/lib/i18n/language-provider";

export type StaffStatusFilter = "open" | "in-progress" | "completed";

export function StaffSidebar({
  totalRequests,
  openCount,
  inProgressCount,
  completedCount,
  recentActivityCount,
  name,
  subtitle,
  initials,
}: {
  totalRequests: number;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  recentActivityCount: number;
  name: string;
  subtitle: string;
  initials: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dict = useDictionary();
  const t = dict.staff.nav;

  const activeStatus =
    pathname === "/staff" ? searchParams.get("status") : null;

  const filters: { key: StaffStatusFilter; label: string }[] = [
    { key: "open", label: t.openCount(openCount) },
    { key: "in-progress", label: t.inProgressCount(inProgressCount) },
    { key: "completed", label: t.completedCount(completedCount) },
  ];

  return (
    <>
      <SidebarShell width={230}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/staff"
            label={t.myRequests}
            count={totalRequests}
            active={pathname === "/staff" && !activeStatus}
          />

          <SidebarNavItem
            href="/staff/notifications"
            label={t.notifications}
            badge={recentActivityCount || undefined}
            active={pathname === "/staff/notifications"}
          />
        </SidebarNavGroup>
        <SidebarSectionLabel>{t.filter}</SidebarSectionLabel>
        <div className="flex flex-col gap-[2px] px-3">
          {filters.map((f) => {
            const active = activeStatus === f.key;
            return (
              <Link
                key={f.key}
                href={active ? "/staff" : `/staff?status=${f.key}`}
                className={`rounded-md px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-graphite font-medium text-white"
                    : "text-muted hover:bg-hover"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <SidebarUserFooter
          initials={initials}
          name={name}
          subtitle={subtitle}
          actions={<SignOutButton />}
        />
      </SidebarShell>
      <MobileTabBar
        items={[
          {
            href: "/staff",
            label: t.myRequests,
            count: totalRequests,
            active: pathname === "/staff",
          },
          {
            href: "/staff/notifications",
            label: t.notifications,
            count: recentActivityCount || undefined,
            active: pathname === "/staff/notifications",
          },
        ]}
      />
    </>
  );
}
