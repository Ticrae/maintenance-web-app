"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/language-provider";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dict = useDictionary();
  const t = dict.auth.forgotPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthSplitShell>
      <AuthCard>
        <AuthLogo />

        {!sent ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                {t.title}
              </h1>

              <p className="text-sm leading-[1.5] text-subtle">
                {t.subtitle}
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  {t.email}
                </label>

                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.submitting : t.submit}
              </Button>
            </form>

            <Link href="/login" className="text-sm text-link">
              {t.backToLogin}
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success">
              ✓
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                {t.checkEmailTitle}
              </h1>

              <p className="text-sm leading-[1.5] text-subtle">
                {t.checkEmailBody(email)}
              </p>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-panel px-4 py-3 text-[12.5px] leading-[1.5] text-meta">
              <span>{t.nothingArrived}</span>

              <span>
                {t.spamHint}
              </span>
            </div>

            <Link href="/login" className="text-sm text-link">
              {t.backToLogin}
            </Link>
          </>
        )}
      </AuthCard>
    </AuthSplitShell>
  );
}
