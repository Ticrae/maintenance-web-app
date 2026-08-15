"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUserFooter,
} from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";

export function MaintenanceSidebar({
  queueCount,
  myJobsCount,
  completedCount,
  name,
  subtitle,
  initials,
}: {
  queueCount: number;
  myJobsCount: number;
  completedCount: number;
  name: string;
  subtitle: string;
  initials: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarShell width={240}>
      <SidebarLogo />
      <SidebarNavGroup>
        <SidebarNavItem
          href="/maintenance"
          label="Queue"
          count={queueCount}
          active={pathname === "/maintenance"}
        />
        <SidebarNavItem
          href="/maintenance/jobs"
          label="My jobs"
          count={myJobsCount}
          active={pathname === "/maintenance/jobs"}
        />
        <SidebarNavItem
          href="/maintenance/completed"
          label="Completed"
          count={completedCount}
          active={pathname === "/maintenance/completed"}
        />
      </SidebarNavGroup>
      <SidebarUserFooter
        initials={initials}
        name={name}
        subtitle={subtitle}
        actions={<SignOutButton />}
      />
    </SidebarShell>
  );
}
