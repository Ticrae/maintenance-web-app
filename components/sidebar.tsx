import Link from "next/link";
import { Avatar } from "@/components/ui/misc";

export function SidebarShell({
  width = 230,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`hidden flex-none flex-col border-r border-black/[.08] bg-panel py-5 md:flex ${
        width === 240 ? "w-[240px]" : "w-[230px]"
      }`}
    >
      {children}
    </div>
  );
}

export function SidebarLogo({ adminChip = false }: { adminChip?: boolean }) {
  return (
    <div className="flex items-center gap-[10px] px-[18px] pb-[22px]">
      <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
      <span className="text-sm font-semibold tracking-[-.01em] text-ink">
        FixNest
      </span>
      {adminChip && (
        <span className="rounded bg-ink px-[6px] py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[.08em] text-white">
          admin
        </span>
      )}
    </div>
  );
}

export function SidebarNavItem({
  href,
  label,
  count,
  active,
  badge,
  disabled,
}: {
  href?: string;
  label: string;
  count?: number | string;
  active?: boolean;
  badge?: number | string;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center justify-between rounded-md px-3 py-[9px] text-[13.5px] ${
        active
          ? "bg-graphite font-medium text-white"
          : disabled
            ? "cursor-default text-eyebrow"
            : "text-muted hover:bg-hover "
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`font-mono text-xs ${active ? "opacity-70" : "text-eyebrow"}`}
        >
          {count}
        </span>
      )}
      {badge !== undefined && (
        <span
          className={`min-w-[18px] rounded-full px-[5px] py-[1px] text-center font-mono text-[10.5px] font-semibold ${
            active ? "bg-white text-graphite" : "bg-urgent text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
  if (!href || disabled) return <div className="px-3">{inner}</div>;
  return (
    <Link href={href} className="px-3 !no-underline">
      {inner}
    </Link>
  );
}

export function SidebarNavGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-[2px] px-0">{children}</div>;
}

export function SidebarSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-[18px] mb-[10px] mt-[26px] font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
      {children}
    </div>
  );
}

export function MobileTabBar({
  items,
}: {
  items: {
    href: string;
    label: string;
    count?: number | string;
    active?: boolean;
  }[];
}) {
  return (
    <div className="sticky top-0 z-10 flex-none bg-canvas px-4 pb-3 pt-4 md:hidden">
      <div className="flex gap-1 rounded-2xl bg-hover p-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-1">
            <span
              className={`flex w-full items-center justify-center gap-[6px] whitespace-nowrap rounded-xl px-2 py-[9px] text-[13px] transition-colors ${
                item.active
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "font-medium text-muted"
              }`}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={`min-w-[18px] rounded-full px-[5px] py-[1px] text-center font-mono text-[10.5px] font-semibold ${
                    item.active
                      ? "bg-graphite text-white"
                      : "bg-track text-muted"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MobileUserBar({
  initials,
  name,
  subtitle,
  actions,
}: {
  initials: string;
  name: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 flex-none bg-[linear-gradient(to_top,var(--color-canvas)_60%,transparent)] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 md:hidden">
      <div className="flex items-center gap-[10px] rounded-2xl bg-graphite px-3 py-[10px] shadow-lg">
        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-white/[.13] text-[12px] font-semibold text-white">
          {initials}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13.5px] font-semibold text-white">
            {name}
          </span>
          <span className="truncate text-[11px] text-white/45">{subtitle}</span>
        </div>
        {actions && <div className="ml-auto flex-none">{actions}</div>}
      </div>
    </div>
  );
}

export function SidebarUserFooter({
  initials,
  name,
  subtitle,
  actions,
}: {
  initials: string;
  name: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mt-auto flex items-center gap-[10px] border-t border-black/[.07] px-[18px] pt-[14px]">
      <Avatar initials={initials} size={28} />
      <div className="flex flex-col">
        <span className="text-[12.5px] font-medium text-ink">{name}</span>
        <span className="text-[11.5px] text-meta">{subtitle}</span>
      </div>
      {actions && <div className="ml-auto w-[60%]">{actions}</div>}
    </div>
  );
}
