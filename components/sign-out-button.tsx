"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n/language-provider";

// Reads the enclosing <form>'s pending state via useFormStatus to show a
// "signing out…" label while the sign-out server action runs.
function SubmitButton({ inverted }: { inverted?: boolean }) {
  const { pending } = useFormStatus();
  const dict = useDictionary();

  return (
    <button
      type="submit"
      className={
        inverted
          ? "inline-flex h-8 items-center justify-center rounded-md border border-white/[.18] px-3 text-xs font-medium text-white transition-colors hover:bg-white/[.1] disabled:opacity-50"
          : buttonClasses("ghost", "h-8 px-2 text-xs")
      }
      disabled={pending}
    >
      {pending ? dict.common.signingOut : dict.common.signOut}
    </button>
  );
}

// A <form> wrapping the sign-out server action; `inverted` selects the
// light-on-dark styling variant used on dark-background sidebars.
export function SignOutButton({ inverted = false }: { inverted?: boolean }) {
  return (
    <form action={signOut}>
      <SubmitButton inverted={inverted} />
    </form>
  );
}
