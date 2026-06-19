import * as Sentry from "@sentry/nextjs";

/**
 * Server/edge observability. Sentry initializes ONLY when SENTRY_DSN is set — absent keys = fully
 * disabled, no behavior change (docs/SETUP §6). No source-map upload (no withSentryConfig), so the
 * build stays plain; this is runtime error capture only.
 */
export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

// Captures errors thrown in nested React Server Components (Next 15 hook). No-op if Sentry is off.
export const onRequestError = Sentry.captureRequestError;
