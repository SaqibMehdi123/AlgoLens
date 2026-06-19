import * as Sentry from "@sentry/nextjs";

// Browser observability. Initializes only when NEXT_PUBLIC_SENTRY_DSN is set (docs/SETUP §6).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Instruments client-side navigations for tracing. No-op when Sentry is disabled.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
