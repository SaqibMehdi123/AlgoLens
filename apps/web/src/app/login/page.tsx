import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthHeader } from "@/components/auth/auth-header";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-[100dvh] w-screen flex-col overflow-x-clip bg-background">
      <AuthHeader
        right={
          <span className="font-mono text-[13px] text-muted">
            New here?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </span>
        }
      />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-secondary">Sign in to sync your progress and reviews.</p>

          <div className="mt-7">
            <CredentialsForm mode="login" />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-subtle" />
            <span className="font-mono text-[11.5px] text-muted">or continue with</span>
            <span className="h-px flex-1 bg-subtle" />
          </div>

          <OAuthButtons redirectTo="/dashboard" />

          <p className="mt-5 text-center font-mono text-[12.5px] text-secondary">
            New to AlgoLens?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
