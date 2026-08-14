"use client";

import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`h-10 rounded-md border border-black/[.14] px-3 text-sm text-ink placeholder:text-eyebrow outline-none focus:border-[1.5px] focus:border-graphite ${className}`}
      {...rest}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`rounded-md border border-black/[.14] px-3 py-[10px] text-sm leading-[1.55] text-body placeholder:text-eyebrow outline-none focus:border-[1.5px] focus:border-graphite ${className}`}
      {...rest}
    />
  );
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 appearance-none rounded-md border border-black/[.14] bg-surface px-3 text-sm text-ink outline-none focus:border-[1.5px] focus:border-graphite ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number | string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[9px] select-none">
      <span
        className={`h-[15px] w-[15px] flex-none rounded-[3.5px] border ${
          checked ? "border-graphite bg-graphite" : "border-black/[.2]"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
      </span>
      <span className={`text-[13px] ${checked ? "text-ink" : "text-muted"}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-[11.5px] text-eyebrow">
          {count}
        </span>
      )}
    </label>
  );
}

export function Toggle({
  on,
  onChange,
  tone = "default",
}: {
  on: boolean;
  onChange: () => void;
  tone?: "default" | "urgent";
}) {
  const trackOn = tone === "urgent" ? "bg-urgent border-urgent" : "bg-graphite border-graphite";
  const trackOff =
    tone === "urgent" ? "bg-urgent-bg border-urgent-bd" : "bg-hover border-black/[.14]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative h-[22px] w-[38px] flex-none rounded-full border transition-colors ${
        on ? trackOn : trackOff
      }`}
    >
      <span
        className={`absolute top-[2px] h-4 w-4 rounded-full transition-all ${
          on ? "left-[18px] bg-white" : "left-[2px] bg-knob-off"
        }`}
      />
    </button>
  );
}
