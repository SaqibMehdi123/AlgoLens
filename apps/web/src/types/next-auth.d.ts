import type { DefaultSession } from "next-auth";

type AlgoLensRole = "learner" | "author" | "admin";

// Surface our domain fields (stable user id + role) on the session, the User passed to callbacks,
// the JWT, and the adapter user — so the auth code is fully typed end to end.
declare module "next-auth" {
  interface Session {
    user: { id: string; role: AlgoLensRole } & DefaultSession["user"];
  }
  interface User {
    role?: AlgoLensRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: AlgoLensRole;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: AlgoLensRole;
  }
}
