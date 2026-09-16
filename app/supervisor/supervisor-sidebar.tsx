"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUserFooter,
} from "@/components/sidebar";
import { SupervisorMobileNav } from "./supervisor-mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { useDictionary } from "@/lib/i18n/language-provider";

export function SupervisorSidebar({
  openCount,
  name,
  subtitle,
  initials,
}: {
  openCount: number;
  name: string;
  subtitle: string;
  initials: string;
}) {
  const pathname = usePathname();
  const dict = useDictionary();
  const t = dict.supervisor.nav;

  const navItems = [
    { href: "/supervisor/intelligence", label: t.intelligence, active: pathname.startsWith("/supervisor/intelligence") },
    { href: "/supervisor", label: t.overview, active: pathname === "/supervisor" },
    { href: "/supervisor/requests", label: t.requests, count: openCount, active: pathname === "/supervisor/requests" },
    { href: "/supervisor/assets", label: t.assets, active: pathname.startsWith("/supervisor/assets") },
    { href: "/supervisor/inspections", label: t.inspections, active: pathname.startsWith("/supervisor/inspections") },
    { href: "/supervisor/compliance", label: t.compliance, active: pathname.startsWith("/supervisor/compliance") },
    { href: "/supervisor/contractors", label: t.contractors, active: pathname.startsWith("/supervisor/contractors") },
  ];

  return (
    <>
      <SidebarShell width={230}>
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
      <SupervisorMobileNav items={navItems} subtitle={subtitle} />
    </>
  );
}
