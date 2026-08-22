"use client";

import { useDictionary } from "@/lib/i18n/language-provider";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-eyebrow">
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  size = 28,
}: {
  initials: string;
  size?: 26 | 28;
}) {
  const sizes = {
    26: "h-[26px] w-[26px] text-[10px]",
    28: "h-7 w-7 text-[11px]",
  } as const;

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full bg-track font-semibold text-subtle ${sizes[size]}`}
    >
      {initials}
    </div>
  );
}

export function StatTile({
  label,
  value,
  valueClassName = "text-ink",
  mono = false,
  context,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  mono?: boolean;
  context?: string;
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-[5px] rounded-lg border border-black/[.09] bg-surface px-4 py-[14px]">
      <Eyebrow>{label}</Eyebrow>
      <span
        className={`text-2xl font-semibold leading-none ${valueClassName} ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
      {context && (
        <span className="font-mono text-[11.5px] text-meta">{context}</span>
      )}
    </div>
  );
}

export function PhotoPlaceholder({
  caption,
  className = "",
}: {
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-end rounded-md border border-black/[.1] bg-[repeating-linear-gradient(135deg,var(--color-stripe-a)_0_8px,var(--color-stripe-b)_8px_16px)] p-2 ${className}`}
    >
      {caption && (
        <span className="font-mono text-[9.5px] leading-[1.3] text-caption">
          {caption}
        </span>
      )}
    </div>
  );
}

export function AddPhotoTile({
  label,
  hint,
  className = "",
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  const dict = useDictionary();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-[5px] rounded-md border border-dashed border-black/[.2] ${className}`}
    >
      <span className="text-[13px] font-medium text-muted">{label ?? dict.common.addPhoto.label}</span>
      <span className="font-mono text-[10.5px] text-eyebrow">{hint ?? dict.common.addPhoto.hint}</span>
    </div>
  );
}

export function Stepper({ activeIndex }: { activeIndex: number }) {
  const dict = useDictionary();
  const steps = [
    dict.common.progressSteps.reported,
    dict.common.progressSteps.accepted,
    dict.common.progressSteps.onSite,
    dict.common.progressSteps.completed,
  ];
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 items-center">
          <div className="flex flex-1 flex-col gap-[7px]">
            <div
              className={`h-1 rounded-full ${
                i <= activeIndex ? "bg-graphite" : "bg-track"
              }`}
            />
            <span
              className={`text-xs ${
                i <= activeIndex ? "font-medium text-ink" : "text-eyebrow"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && <div className="w-[10px]" />}
        </div>
      ))}
    </div>
  );
}
