"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";
import { allocateUser, findUserByEmail, hashPassword } from "@/lib/users";

export type AuthFormState = { error?: string } | undefined;

/** Email/password sign-in. On success Auth.js redirects (NEXT_REDIRECT); we re-throw that. */
export async function loginWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // re-throw the redirect
  }
  return undefined;
}

/** Create an email/password account, then sign in. Generic, enumeration-aware-enough messaging. */
export async function registerWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { name, email, password } = parsed.data;
  if (await findUserByEmail(email)) {
    return { error: "An account with this email already exists — try signing in." };
  }

  const passwordHash = await hashPassword(password);
  await allocateUser({ email, displayName: name, passwordHash });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    // Account was created; if auto-sign-in trips, send them to the login page.
    if (error instanceof AuthError) return { error: "Account created — please sign in." };
    throw error;
  }
  return undefined;
}
