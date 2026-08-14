"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn } from "@/app/actions/auth";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";
import { PhotoPlaceholder } from "@/components/ui/misc";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loginState, loginAction, isPending] = useActionState(signIn, undefined);

  return (
    <AuthSplitShell
      promo={
        <>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-eyebrow">
            Estate maintenance
          </span>
          <h2 className="max-w-sm text-[28px] font-semibold leading-[1.2] tracking-[-.02em] text-ink">
            Report it once. Everyone sees where it stands.
          </h2>
          <PhotoPlaceholder className="h-64 w-full" />
          <div className="flex gap-8 font-mono text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">6</span>
              <span className="text-xs text-meta">homes</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">3h 48m</span>
              <span className="text-xs text-meta">median response</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">412</span>
              <span className="text-xs text-meta">jobs last month</span>
            </div>
          </div>
        </>
      }
    >
      <AuthCard>
        <AuthLogo />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
            Log in
          </h1>
          <p className="text-sm text-subtle">
            Use the work email your home manager set you up with.
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          action={loginAction}
        >
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">Email</label>
            <TextField
              type="email"
              name="email"
              placeholder="you@organisation.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-body">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-link">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <TextField
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-[9px] text-[13px] text-body select-none">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={() => setKeepSignedIn((v) => !v)}
              className="h-[15px] w-[15px] rounded-[3.5px] accent-graphite"
            />
            Keep me signed in on this device
          </label>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Logging in…" : "Log in"}
          </Button>
          {loginState?.error && (
            <p className="text-sm text-red-700" role="alert">
              {loginState.error}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-eyebrow">
            <div className="h-px flex-1 bg-black/[.08]" />
            or
            <div className="h-px flex-1 bg-black/[.08]" />
          </div>
          <Button type="button" variant="outline" className="w-full" disabled>
            Organisation SSO (coming soon)
          </Button>
        </form>
        <p className="text-[12.5px] leading-[1.5] text-meta">
          No account? Your home manager or estate admin creates it for you.
          Trouble getting in — call the estate office on 0118 496 2210.
        </p>
      </AuthCard>
    </AuthSplitShell>
  );
}
