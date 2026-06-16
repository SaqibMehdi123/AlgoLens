import { Button } from "@algolens/ui";
import { auth, signIn, signOut } from "@/auth";

export const metadata = { title: "Sign in — AlgoLens" };

// Reads at request time on the server; gates which provider buttons appear.
const githubOn = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
const googleOn = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export default async function LoginPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          {session ? "You're signed in" : "Sign in to AlgoLens"}
        </h1>
        <p className="text-sm text-muted">
          {session
            ? "Your progress, submissions, and review schedule will roam across devices."
            : "Accounts sync your progress, practice submissions, and spaced-repetition schedule across devices. Until you sign in, everything is saved locally on this device."}
        </p>
      </div>

      {session ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-subtle bg-surface p-6">
          <p className="text-sm text-secondary">
            Signed in as <span className="font-medium text-foreground">{session.user?.email}</span>
            {session.user?.role && session.user.role !== "learner" ? (
              <span className="ml-2 rounded-full bg-raised px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                {session.user.role}
              </span>
            ) : null}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      ) : githubOn || googleOn ? (
        <div className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface p-6">
          {githubOn && (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
            >
              <Button type="submit" className="w-full">
                Continue with GitHub
              </Button>
            </form>
          )}
          {googleOn && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="secondary" className="w-full">
                Continue with Google
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-subtle bg-surface p-6 text-center text-sm text-muted">
          OAuth isn't configured. Add <code className="text-secondary">AUTH_GITHUB_ID/SECRET</code> or{" "}
          <code className="text-secondary">AUTH_GOOGLE_ID/SECRET</code> to the repo-root{" "}
          <code className="text-secondary">.env</code> (see <code className="text-secondary">docs/SETUP.md</code> §3),
          then restart the dev server.
        </div>
      )}
    </main>
  );
}
