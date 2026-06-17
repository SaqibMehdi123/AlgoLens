import NextAuth, { type NextAuthConfig, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { AlgoLensAdapter } from "./auth-adapter";
import { loginSchema } from "@/lib/auth-schemas";
import { verifyCredentials } from "@/lib/users";

// Only enable a provider when its credentials are present, so the app still boots (and builds)
// without OAuth configured. Auth.js reads AUTH_GITHUB_ID/SECRET and AUTH_GOOGLE_ID/SECRET itself.
const providers: NextAuthConfig["providers"] = [];
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) providers.push(GitHub);
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);
const oauthEnabled = providers.length > 0;

// Email/password — always available. `authorize` validates input then bcrypt-checks the hash.
providers.push(
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (creds) => {
      const parsed = loginSchema.safeParse(creds);
      if (!parsed.success) return null;
      const user = await verifyCredentials(parsed.data.email, parsed.data.password);
      if (!user) return null;
      return { id: user.id, email: user.email, name: user.displayName, role: user.role };
    },
  }),
);

export const authConfig: NextAuthConfig = {
  adapter: AlgoLensAdapter(),
  // JWT sessions (ADR-0006): edge-safe, serverless-friendly, and a fit for our bespoke schema
  // (our `sessions` table is `tokenHash`-shaped, not the adapter's `sessionToken` shape).
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      // `user` is present only on initial sign-in; persist id + role into the token thereafter.
      if (user) {
        token.uid = user.id;
        token.role = user.role ?? "learner";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.uid === "string") session.user.id = token.uid;
        const role = token.role;
        session.user.role = role === "author" || role === "admin" ? role : "learner";
      }
      return session;
    },
  },
};

// Annotate the exports with NextAuthResult member types to dodge the pnpm "inferred type cannot be
// named" portability error (TS2742) — the inferred types otherwise point at deep .pnpm paths.
const result: NextAuthResult = NextAuth(authConfig);
export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;

/** True when at least one OAuth provider is configured — drives the OAuth section of the auth UI. */
export const authEnabled = oauthEnabled;
