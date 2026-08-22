"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";
import { PhotoPlaceholder } from "@/components/ui/misc";
import { useDictionary } from "@/lib/i18n/language-provider";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function SessionMessage({ t }: { t: ReturnType<typeof useDictionary>["auth"]["login"] }) {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired");
  const error = searchParams.get("error");

  if (!expired && !error) return null;

  const message = expired
    ? t.sessionExpired
    : error === "no_access"
      ? t.noAccess
      : t.oauthError;

  return (
    <p className="text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loginState, loginAction, isPending] = useActionState(
    signIn,
    undefined,
  );
  const dict = useDictionary();
  const t = dict.auth.login;

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <AuthSplitShell
      promo={
        <>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-eyebrow">
            {t.promoEyebrow}
          </span>
          <h2 className="max-w-sm text-[28px] font-semibold leading-[1.2] tracking-[-.02em] text-ink">
            {t.promoHeadline}
          </h2>
          <PhotoPlaceholder className="h-64 w-full" />
          <div className="flex gap-8 font-mono text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">2</span>
              <span className="text-xs text-meta">{t.statHomes}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">3h 48m</span>
              <span className="text-xs text-meta">{t.statMedianResponse}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-ink">412</span>
              <span className="text-xs text-meta">{t.statJobsLastMonth}</span>
            </div>
          </div>
        </>
      }
    >
      <AuthCard>
        <AuthLogo />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
            {t.title}
          </h1>
          <p className="text-sm text-subtle">
            {t.subtitle}
          </p>
        </div>
        <Suspense fallback={null}>
          <SessionMessage t={t} />
        </Suspense>
        <form className="flex flex-col gap-4" action={loginAction}>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">{t.email}</label>
            <TextField
              type="email"
              name="email"
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-body">
                {t.password}
              </label>
              <Link href="/forgot-password" className="text-xs text-link">
                {t.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <TextField
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                required
                className="w-full pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted"
              >
                {showPassword ? t.hide : t.show}
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
            {t.keepSignedIn}
          </label>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t.submitting : t.submit}
          </Button>
          {loginState?.error && (
            <p className="text-sm text-red-700" role="alert">
              {loginState.error}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-eyebrow">
            <div className="h-px flex-1 bg-black/[.08]" />
            {t.or}
            <div className="h-px flex-1 bg-black/[.08]" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            {t.google}
          </Button>
        </form>
        <p className="text-[12.5px] leading-[1.5] text-meta">
          {t.noAccount}
        </p>
      </AuthCard>
    </AuthSplitShell>
  );
}
