"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={buttonClasses("ghost", "h-8 px-2 text-xs")}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}
