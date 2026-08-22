"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/language-provider";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dict = useDictionary();
  const t = dict.auth.resetPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  }

  return (
    <AuthSplitShell>
      <AuthCard>
        <AuthLogo />

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
            {t.title}
          </h1>

          <p className="text-sm leading-[1.5] text-subtle">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.newPassword}
            </label>

            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.confirmPassword}
            </label>

            <TextField
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.submitting : t.submit}
          </Button>
        </form>
      </AuthCard>
    </AuthSplitShell>
  );
}
