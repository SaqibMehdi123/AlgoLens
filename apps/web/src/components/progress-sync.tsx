"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { progressStore } from "@/lib/progress";

/**
 * Mirrors device-local lesson progress to the account when signed in (ADR-0003 transport swap),
 * non-breakingly: localStorage stays the source of truth for the UI. On sign-in it hydrates from
 * the server (merge), then PUTs local changes as they happen. Signed-out → does nothing. Renders
 * nothing.
 */
export function ProgressSync() {
  const { status } = useSession();
  const hydrated = useRef(false);
  const lastSent = useRef<Record<string, string>>({});

  useEffect(() => {
    if (status !== "authenticated") return;
    const store = progressStore();
    let cancelled = false;

    // Hydrate once from the account, taking the further-along of local vs server.
    if (!hydrated.current) {
      hydrated.current = true;
      fetch("/api/v1/progress")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { lessons?: Record<string, { status?: string; scrollPct?: number; completedAt?: string | null }> } | null) => {
          if (!cancelled && data?.lessons) store.merge(data.lessons);
        })
        .catch(() => {});
    }

    // Mirror local changes up (fire-and-forget, deduped by serialized payload).
    function syncUp() {
      const snap = store.getSnapshot();
      for (const [slug, lp] of Object.entries(snap.lessons)) {
        const body = JSON.stringify({
          status: lp.completedAt ? "completed" : "in_progress",
          scrollPct: lp.scrollPct,
        });
        if (lastSent.current[slug] === body) continue;
        lastSent.current[slug] = body;
        fetch(`/api/v1/progress/lessons/${slug}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body,
        }).catch(() => {});
      }
    }

    syncUp();
    const unsubscribe = store.subscribe(syncUp);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [status]);

  return null;
}
