import "server-only";
import { randomUUID } from "node:crypto";
import { authAccounts, db, users } from "@algolens/db";
import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

/**
 * Auth.js adapter mapped onto AlgoLens's bespoke identity schema (docs/03 §1). The stock
 * `@auth/drizzle-adapter` expects its own table/column shape (`sessionToken`, `name`, `image`,
 * `emailVerified`, integer `expires_at`, a `verification_tokens` table). Ours differs — `users`
 * carries `citext` email + a required unique `username` + `role`; `auth_accounts` stores
 * timestamp `expires_at` — so we implement the handful of methods we actually use instead of
 * reshaping the schema. Session/verification-token methods are intentionally absent: we use the
 * JWT session strategy (ADR-0006), so Auth.js never calls them.
 */

type UserRow = typeof users.$inferSelect;

function toAdapterUser(u: UserRow): AdapterUser {
  return {
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerifiedAt ?? null,
    name: u.displayName,
    image: u.avatarUrl,
    role: u.role,
  };
}

/** Derive a schema-legal username from an email local-part (lowercase, alnum + underscore). */
function baseUsername(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return cleaned.slice(0, 24) || "user";
}

export function AlgoLensAdapter(): Adapter {
  return {
    async createUser(user) {
      const base = baseUsername(user.email);
      // `username` is NOT NULL UNIQUE but Auth.js doesn't supply one — allocate a unique handle,
      // suffixing on collision. The DB-generated id is returned and used by linkAccount.
      for (let attempt = 0; attempt < 6; attempt++) {
        const username = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 6)}`;
        try {
          const [row] = await db()
            .insert(users)
            .values({
              email: user.email,
              username,
              displayName: user.name ?? null,
              avatarUrl: user.image ?? null,
              emailVerifiedAt: user.emailVerified ?? null,
            })
            .returning();
          return toAdapterUser(row!);
        } catch (err) {
          if (attempt === 5) throw err; // exhausted retries — surface the conflict
        }
      }
      throw new Error("createUser: could not allocate a unique username");
    },

    async getUser(id) {
      const [row] = await db().select().from(users).where(eq(users.id, id)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByEmail(email) {
      const [row] = await db().select().from(users).where(eq(users.email, email)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [acct] = await db()
        .select({ userId: authAccounts.userId })
        .from(authAccounts)
        .where(
          and(
            eq(authAccounts.provider, provider),
            eq(authAccounts.providerAccountId, providerAccountId),
          ),
        )
        .limit(1);
      if (!acct) return null;
      const [row] = await db().select().from(users).where(eq(users.id, acct.userId)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async updateUser(user) {
      const [row] = await db()
        .update(users)
        .set({
          displayName: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
          email: user.email ?? undefined,
          emailVerifiedAt: user.emailVerified ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      return toAdapterUser(row!);
    },

    async deleteUser(id) {
      // auth_accounts cascades via its FK (onDelete: "cascade").
      await db().delete(users).where(eq(users.id, id));
    },

    async linkAccount(account: AdapterAccount) {
      await db()
        .insert(authAccounts)
        .values({
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          expiresAt:
            typeof account.expires_at === "number"
              ? new Date(account.expires_at * 1000)
              : null,
        });
      return account;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db()
        .delete(authAccounts)
        .where(
          and(
            eq(authAccounts.provider, provider),
            eq(authAccounts.providerAccountId, providerAccountId),
          ),
        );
    },
  };
}
