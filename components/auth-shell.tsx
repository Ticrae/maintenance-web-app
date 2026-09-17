import { LanguageToggle } from "@/components/language-toggle";

// Shared building blocks for the unauthenticated auth pages (login, reset
// password, accept invite, etc): a top logo bar, a centered card, and the
// split layout with an optional promo panel on wide screens.
export function AuthLogo() {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <div className="flex items-center gap-[10px]">
        <div className="h-7 w-7 rounded-[7px] bg-graphite" />
        <span className="text-[15px] font-semibold tracking-[-.01em] text-ink">
          FixNest
        </span>
      </div>
      <LanguageToggle />
    </div>
  );
}

// Fixed-width card that centers auth form content
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[376px] flex-col gap-6">{children}</div>
  );
}

// Two-column layout: form on the left always, marketing `promo` content on
// the right only on large screens.
export function AuthSplitShell({
  children,
  promo,
}: {
  children: React.ReactNode;
  promo?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-1 items-center justify-center px-10 py-16">
        {children}
      </div>
      {promo && (
        <div className="hidden w-[600px] flex-none flex-col justify-center gap-8 bg-selected px-14 py-16 lg:flex">
          {promo}
        </div>
      )}
    </div>
  );
}
