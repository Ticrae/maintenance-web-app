"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthLogo, AuthSplitShell } from "@/components/auth-shell";
import { TextField } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");

  const hasLength = password.length >= 10;
  const hasNumberOrSymbol = /[0-9\W]/.test(password);
  const strength = [hasLength, hasNumberOrSymbol, password.length > 0].filter(
    Boolean
  ).length;

  return (
    <AuthSplitShell>
      <AuthCard>
        <AuthLogo />
        {!expired ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                Set a new password
              </h1>
              <p className="text-sm text-subtle">
                Signing in as{" "}
                <strong className="text-ink">d.amos@upkeep.care</strong>
              </p>
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                router.push("/staff");
              }}
            >
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  New password
                </label>
                <TextField
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex gap-1 pt-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < strength ? "bg-graphite" : "bg-track"
                      }`}
                    />
                  ))}
                </div>
                <ul className="flex flex-col gap-[3px] pt-1 text-xs">
                  <li className={hasLength ? "text-success" : "text-meta"}>
                    {hasLength ? "✓" : "·"} At least 10 characters
                  </li>
                  <li
                    className={hasNumberOrSymbol ? "text-success" : "text-meta"}
                  >
                    {hasNumberOrSymbol ? "✓" : "·"} One number or symbol
                  </li>
                  <li className="text-meta">
                    · Not a password you&apos;ve used before
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Confirm password
                </label>
                <TextField type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Save and log in
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setExpired(true)}
              className="self-start text-xs text-eyebrow hover:text-meta"
            >
              (demo) simulate expired link
            </button>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-urgent-bg text-urgent">
              !
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-.02em] text-ink">
                This link has expired
              </h1>
              <p className="text-sm leading-[1.5] text-subtle">
                Reset links last 60 minutes for security. Request a fresh one
                and we&apos;ll email it straight away.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.push("/forgot-password")}>
              Send a new link
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
