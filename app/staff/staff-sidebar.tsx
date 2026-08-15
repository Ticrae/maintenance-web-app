"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarSectionLabel,
  SidebarUserFooter,
} from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";

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

  return (
    <SidebarShell width={230}>
      <SidebarLogo />
      <SidebarNavGroup>
        <SidebarNavItem
          href="/staff"
          label="My requests"
          count={totalRequests}
          active={pathname === "/staff"}
        />

        <SidebarNavItem
          href="/staff/notifications"
          label="Notifications"
          badge={recentActivityCount || undefined}
          active={pathname === "/staff/notifications"}
        />
      </SidebarNavGroup>
      <SidebarSectionLabel>Filter</SidebarSectionLabel>
      <div className="flex flex-col gap-[2px] px-3">
        <div className="rounded-md bg-hover px-3 py-2 text-[13px] text-muted">
          Open · {openCount}
        </div>
        <div className="rounded-md px-3 py-2 text-[13px] text-muted">
          In progress · {inProgressCount}
        </div>
        <div className="rounded-md px-3 py-2 text-[13px] text-muted">
          Completed · {completedCount}
        </div>
      </div>
      <SidebarUserFooter
        initials={initials}
        name={name}
        subtitle={subtitle}
        actions={<SignOutButton />}
      />
    </SidebarShell>
  );
}
