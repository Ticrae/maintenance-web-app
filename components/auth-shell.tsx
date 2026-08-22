export function AuthLogo() {
  return (
    <div className="flex items-center gap-[10px]">
      <div className="h-7 w-7 rounded-[7px] bg-graphite" />
      <span className="text-[15px] font-semibold tracking-[-.01em] text-ink">
        FixNest
      </span>
    </div>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[376px] flex-col gap-6">{children}</div>
  );
}

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
