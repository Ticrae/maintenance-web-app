"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { getStaffSidebarCounts } from "@/app/actions/requests";

export type StaffStatusFilter = "open" | "in-progress" | "completed" | "cancelled";

// Staff desktop sidebar + mobile tab bar: nav links, status-filter shortcuts
// (applied via the `?status=` query param on the requests list), and the
// signed-in user footer.
export function StaffSidebar({
  totalRequests,
  openCount,
  inProgressCount,
  completedCount,
  cancelledCount,
  recentActivityCount,
  name,
  subtitle,
  initials,
}: {
  totalRequests: number;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  recentActivityCount: number;
  name: string;
  subtitle: string;
  initials: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const dict = useDictionary();
  const t = dict.staff.nav;

  // The layout that first computes these counts is cached client-side by
  // Next.js and doesn't re-run on soft navigation, so they'd otherwise drift
  // stale against the always-freshly-rendered requests table. Re-fetch them
  // here on every navigation within /staff to keep the two in sync.
  const [counts, setCounts] = useState({
    totalRequests,
    openCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    recentActivityCount,
  });

  useEffect(() => {
    let cancelled = false;
    getStaffSidebarCounts()
      .then((fresh) => {
        if (!cancelled) setCounts(fresh);
      })
      .catch(() => {
        // Keep showing the last known-good counts rather than nothing.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParamsKey]);

  // Status filter only applies on the requests list itself, not other staff pages
  const activeStatus =
    pathname === "/staff" ? searchParams.get("status") : null;

  const filters: { key: StaffStatusFilter; label: string }[] = [
    { key: "open", label: t.openCount(counts.openCount) },
    { key: "in-progress", label: t.inProgressCount(counts.inProgressCount) },
    { key: "completed", label: t.completedCount(counts.completedCount) },
    { key: "cancelled", label: t.cancelledCount(counts.cancelledCount) },
  ];

  return (
    <>
      <SidebarShell width={230}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/staff"
            label={t.myRequests}
            count={counts.totalRequests}
            active={pathname === "/staff" && !activeStatus}
          />

          <SidebarNavItem
            href="/staff/notifications"
            label={t.notifications}
            badge={counts.recentActivityCount || undefined}
            active={pathname === "/staff/notifications"}
          />
          <SidebarNavItem
            href="/staff/inspections"
            label={t.inspections}
            active={pathname.startsWith("/staff/inspections")}
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
            count: counts.totalRequests,
            active: pathname === "/staff",
          },
          {
            href: "/staff/notifications",
            label: t.notifications,
            count: counts.recentActivityCount || undefined,
            active: pathname === "/staff/notifications",
          },
          {
            href: "/staff/inspections",
            label: t.inspections,
            active: pathname.startsWith("/staff/inspections"),
          },
        ]}
      />
    </>
  );
}
