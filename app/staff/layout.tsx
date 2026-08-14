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
import { useAppData } from "@/lib/app-data-context";
import { currentUser } from "@/lib/fixtures";
import { SignOutButton } from "@/components/sign-out-button";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { myRequests, notifGroups } = useAppData();

  const unreadCount = notifGroups.reduce(
    (n, g) => n + g.items.filter((i) => i.unread).length,
    0
  );
  const openCount = myRequests.filter((r) => r.status === "Open").length;
  const inProgressCount = myRequests.filter(
    (r) => r.status === "In progress" || r.status === "Accepted"
  ).length;
  const completedCount = myRequests.filter((r) => r.status === "Completed").length;

  return (
    <div className="flex min-h-screen w-full md:h-screen">
      <SidebarShell width={230}>
        <SidebarLogo />
        <SidebarNavGroup>
          <SidebarNavItem
            href="/staff"
            label="My requests"
            count={myRequests.length}
            active={pathname === "/staff"}
          />
          <SidebarNavItem label="Home activity" disabled />
          <SidebarNavItem
            href="/staff/notifications"
            label="Notifications"
            badge={unreadCount || undefined}
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
          initials={currentUser.staff.initials}
          name={currentUser.staff.name}
          subtitle={currentUser.staff.subtitle}
          actions={<SignOutButton />}
        />
      </SidebarShell>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
