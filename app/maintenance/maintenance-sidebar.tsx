"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUserFooter,
} from "@/components/sidebar";
import { MaintenanceMobileNav } from "./maintenance-mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { useDictionary } from "@/lib/i18n/language-provider";

// Maintenance worker desktop sidebar; the same `navItems` list also feeds
// the mobile slide-over menu (MaintenanceMobileNav) so both stay in sync.
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

  const navItems = [
    { href: "/maintenance", label: t.queue, count: queueCount, active: pathname === "/maintenance" },
    { href: "/maintenance/jobs", label: t.myJobs, count: myJobsCount, active: pathname === "/maintenance/jobs" },
    {
      href: "/maintenance/completed",
      label: t.completed,
      count: completedCount,
      active: pathname === "/maintenance/completed",
    },
    {
      href: "/maintenance/inspections",
      label: t.inspections,
      active: pathname.startsWith("/maintenance/inspections"),
    },
  ];

  return (
    <>
      <SidebarShell width={240}>
        <SidebarLogo />
        <SidebarNavGroup>
          {navItems.map((item) => (
            <SidebarNavItem key={item.href} href={item.href} label={item.label} count={item.count} active={item.active} />
          ))}
        </SidebarNavGroup>
        <SidebarUserFooter
          initials={initials}
          name={name}
          subtitle={subtitle}
          actions={<SignOutButton />}
        />
      </SidebarShell>
      <MaintenanceMobileNav items={navItems} subtitle={subtitle} />
    </>
  );
}
