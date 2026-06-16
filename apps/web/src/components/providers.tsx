"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client provider boundary. Scoped to the nav (not the whole tree) so pages stay server-rendered /
 * static; the nav reads the session client-side via `useSession()` and updates after hydration.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
