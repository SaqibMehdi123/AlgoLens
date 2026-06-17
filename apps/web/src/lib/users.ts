import "server-only";
import { randomUUID } from "node:crypto";
import { db, users } from "@algolens/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

type UserRow = typeof users.$inferSelect;

interface NewUserValues {
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
  passwordHash?: string | null;
}

/** Derive a schema-legal username from an email local-part (lowercase, alnum + underscore). */
export function baseUsername(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return cleaned.slice(0, 24) || "user";
}

/** Insert a user, allocating a unique `username` (required + unique), suffixing on collision. */
export async function allocateUser(values: NewUserValues): Promise<UserRow> {
  const base = baseUsername(values.email);
  for (let attempt = 0; attempt < 6; attempt++) {
    const username = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 6)}`;
    try {
      const [row] = await db()
        .insert(users)
        .values({ ...values, username })
        .returning();
      return row!;
    } catch (err) {
      if (attempt === 5) throw err; // exhausted retries — surface the conflict
    }
  }
  throw new Error("could not allocate a unique username");
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const [row] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  return row;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify an email/password pair. Returns the user on success, null otherwise (incl. OAuth-only). */
export async function verifyCredentials(email: string, password: string): Promise<UserRow | null> {
  const user = await findUserByEmail(email);
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
