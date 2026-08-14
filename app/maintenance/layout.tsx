"use client";

import { usePathname } from "next/navigation";
import {
  SidebarShell,
  SidebarLogo,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUserFooter,
} from "@/components/sidebar";
import { useAppData } from "@/lib/app-data-context";
import { currentUser } from "@/lib/fixtures";
import { SignOutButton } from "@/components/sign-out-button";

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { queue, myJobGroups, completed } = useAppData();
  const myJobsCount = myJobGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="flex min-h-screen w-full md:h-screen">
      <SidebarShell width={240}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/maintenance"
            label="Queue"
            count={queue.length}
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
            count={completed.length}
            active={pathname === "/maintenance/completed"}
          />
        </SidebarNavGroup>
        <SidebarUserFooter
          initials={currentUser.maintenance.initials}
          name={currentUser.maintenance.name}
          subtitle={currentUser.maintenance.subtitle}
          actions={<SignOutButton />}
        />
      </SidebarShell>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}
