import { Button } from "@algolens/ui";
import { Github } from "lucide-react";
import { signIn } from "@/auth";

// Read at request time on the server; only render a provider that's actually configured.
const githubOn = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
const googleOn = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** Shared OAuth sign-in buttons used by both /login and /register (same flow, different framing). */
export function OAuthButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  if (!githubOn && !googleOn) {
    return (
      <div className="rounded-lg border border-subtle bg-raised p-4 text-center text-sm text-muted">
        OAuth isn&apos;t configured. Add <code className="text-secondary">AUTH_GITHUB_ID/SECRET</code> or{" "}
        <code className="text-secondary">AUTH_GOOGLE_ID/SECRET</code> to the repo-root{" "}
        <code className="text-secondary">.env</code> (see <code className="text-secondary">docs/SETUP.md</code> §3),
        then restart the dev server.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {githubOn && (
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo });
          }}
        >
          <Button type="submit" size="lg" variant="secondary" className="w-full">
            <Github className="size-[18px]" />
            Continue with GitHub
          </Button>
        </form>
      )}
      {googleOn && (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <Button type="submit" size="lg" variant="secondary" className="w-full">
            <GoogleGlyph />
            Continue with Google
          </Button>
        </form>
      )}
    </div>
  );
}

/** Tiny inline Google "G" (lucide ships no brand marks). Uses currentColor-independent brand hues. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
