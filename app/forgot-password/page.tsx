"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("d.amos@upkeep.care");

  return (
    <AuthSplitShell>
      <AuthCard>
        <AuthLogo />
        {!sent ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                Forgot your password?
              </h1>
              <p className="text-sm leading-[1.5] text-subtle">
                Enter your work email and we&apos;ll send a link to set a new
                one. The link expires after 60 minutes.
              </p>
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Email
                </label>
                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
            <Link href="/login" className="text-sm text-link">
              ← Back to log in
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success">
              ✓
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                Check your email
              </h1>
              <p className="text-sm leading-[1.5] text-subtle">
                We sent a reset link to <strong className="text-ink">{email}</strong>.
                Click the link to set a new password.
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-panel px-4 py-3 text-[12.5px] leading-[1.5] text-meta">
              <span>Nothing arrived?</span>
              <span>
                Check spam, or ask your estate admin to confirm the email on
                your account.
              </span>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Resend link — available in 0:42
            </Button>
            <Link href="/login" className="text-sm text-link">
              ← Back to log in
            </Link>
          </>
        )}
      </AuthCard>
    </AuthSplitShell>
  );
}
