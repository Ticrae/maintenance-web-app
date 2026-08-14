"use client";

import { usePathname } from "next/navigation";
import { TABS, TopTabs } from "@/components/top-tabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active =
    TABS.find((tab) => pathname.startsWith(tab.href))?.label ?? "Reports";

  return (
    <div className="flex min-h-screen w-full flex-col md:h-screen">
      <TopTabs active={active} />
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
