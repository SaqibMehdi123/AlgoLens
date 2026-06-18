import { Check, Repeat, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthHeader } from "@/components/auth/auth-header";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata = { title: "Create your account" };

const perks = [
  { icon: Check, title: "Sync progress, XP & streaks", desc: "Pick up on any device, right where you left off." },
  { icon: Repeat, title: "Scheduled spaced repetition", desc: "Reviews surface at the right interval to retain." },
  { icon: Save, title: "Saved submissions", desc: "Your judge history, kept across sessions." },
];

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-[100dvh] w-screen flex-col overflow-x-clip bg-background">
      <AuthHeader
        right={
          <span className="font-mono text-[13px] text-muted">
            Have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </span>
        }
      />

      <main className="flex flex-1 flex-wrap">
        {/* Value panel */}
        <section className="relative flex min-w-[320px] flex-1 basis-[440px] items-center justify-center overflow-hidden border-r border-subtle bg-elevated px-12 py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{ backgroundImage: "radial-gradient(var(--subtle) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
            aria-hidden
          />
          <div className="relative max-w-[420px]">
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-1px] text-foreground">
              Create your account
            </h1>
            <p className="mt-4 text-base leading-relaxed text-secondary">
              Everything works on-device for free. An account keeps your progress in sync.
            </p>
            <ul className="mt-7 flex flex-col gap-4">
              {perks.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                    <div className="text-[13px] text-secondary">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Form */}
        <section className="flex min-w-[320px] flex-1 basis-[440px] items-center justify-center px-6 py-12">
          <div className="w-full max-w-[380px]">
            <CredentialsForm mode="register" />

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-subtle" />
              <span className="font-mono text-[11.5px] text-muted">or sign up with</span>
              <span className="h-px flex-1 bg-subtle" />
            </div>

            <OAuthButtons redirectTo="/dashboard" />

            <p className="mt-4 text-center text-[12.5px] leading-relaxed text-muted">
              GitHub &amp; Google create your account automatically on first use.
            </p>
            <p className="mt-4 text-center font-mono text-[12.5px] text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
