import { Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-md flex-col justify-center gap-7 px-4 py-12">
      <div className="space-y-3 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          AlgoLens
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted">
          Sign in to sync your progress, submissions, and review schedule across devices.
        </p>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface p-6 shadow-sm">
        <OAuthButtons redirectTo="/dashboard" />
      </div>

      <p className="text-center text-sm text-muted">
        New to AlgoLens?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
