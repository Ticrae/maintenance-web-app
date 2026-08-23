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

  return (
    <>
      <SidebarShell width={230}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/supervisor"
            label={t.overview}
            active={pathname === "/supervisor"}
          />
          <SidebarNavItem
            href="/supervisor/requests"
            label={t.requests}
            count={openCount}
            active={pathname === "/supervisor/requests"}
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
          {
            href: "/supervisor",
            label: t.overview,
            active: pathname === "/supervisor",
          },
          {
            href: "/supervisor/requests",
            label: t.requests,
            count: openCount,
            active: pathname === "/supervisor/requests",
          },
        ]}
      />
    </>
  );
}
