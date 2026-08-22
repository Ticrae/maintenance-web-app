"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUserFooter,
  MobileTabBar,
} from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { useDictionary } from "@/lib/i18n/language-provider";

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
  const dict = useDictionary();
  const t = dict.maintenance.nav;

  return (
    <>
      <SidebarShell width={240}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/maintenance"
            label={t.queue}
            count={queueCount}
            active={pathname === "/maintenance"}
          />
          <SidebarNavItem
            href="/maintenance/jobs"
            label={t.myJobs}
            count={myJobsCount}
            active={pathname === "/maintenance/jobs"}
          />
          <SidebarNavItem
            href="/maintenance/completed"
            label={t.completed}
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
      <MobileTabBar
        items={[
          { href: "/maintenance", label: t.queue, count: queueCount, active: pathname === "/maintenance" },
          {
            href: "/maintenance/jobs",
            label: t.myJobs,
            count: myJobsCount,
            active: pathname === "/maintenance/jobs",
          },
          {
            href: "/maintenance/completed",
            label: t.completed,
            count: completedCount,
            active: pathname === "/maintenance/completed",
          },
        ]}
      />
    </>
  );
}
