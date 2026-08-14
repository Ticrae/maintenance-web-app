export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-[62px] flex-none flex-col items-stretch justify-center gap-3 border-b border-black/[.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7"
    >
      <div className="flex flex-col gap-[2px]">
        <span className="text-[17px] font-semibold tracking-[-.01em] text-ink">
          {title}
        </span>
        {subtitle && <span className="text-xs text-meta">{subtitle}</span>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-[10px]">{actions}</div>}
    </div>
  );
}
