import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata = { title: "Create your account" };

const perks = [
  "Progress, XP & streaks that roam across devices",
  "Spaced-repetition review scheduled for you (SM-2)",
  "Your practice submissions and solved set, saved",
];

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-7 px-4 py-12">
      <div className="space-y-3 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          AlgoLens
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted">Free, no credit card. Email &amp; password, or one click with GitHub / Google.</p>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface p-6 shadow-sm">
        <ul className="mb-5 space-y-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-secondary">
              <Check className="mt-0.5 size-4 shrink-0 text-sorted" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>

        <CredentialsForm mode="register" />

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-subtle" />
          or sign up with
          <span className="h-px flex-1 bg-subtle" />
        </div>

        <OAuthButtons redirectTo="/dashboard" />
      </div>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
