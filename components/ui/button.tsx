import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "happy";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  className = "",
) {
  const base =
    "inline-flex hover:cursor-pointer items-center justify-center gap-2 rounded-md px-4 h-9 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-graphite text-white hover:bg-graphite-hover",
    outline: "border border-black/[.14] text-muted bg-surface hover:bg-hover",
    ghost: "text-muted hover:bg-hover",
    happy: "text-green-600 hover:bg-green-100",
  };
  return `${base} ${variants[variant]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
