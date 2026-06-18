"use client";

import { Button } from "@algolens/ui";
import { useActionState } from "react";
import {
  loginWithPassword,
  registerWithPassword,
  type AuthFormState,
} from "@/lib/auth-actions";

const inputClass =
  "w-full rounded-[10px] border border-border-strong bg-elevated px-3 py-3 text-sm text-foreground placeholder:text-muted transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/25";

/** Email + password form for /login and /register. Uses a server action via useActionState. */
export function CredentialsForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginWithPassword : registerWithPassword;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {mode === "register" && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-mono text-xs text-secondary">Name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={80} className={inputClass} placeholder="Ada Lovelace" />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-secondary">Email</span>
        <input name="email" type="email" autoComplete="email" required className={inputClass} placeholder="you@example.com" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-secondary">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : undefined}
          className={inputClass}
          placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-swap">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
