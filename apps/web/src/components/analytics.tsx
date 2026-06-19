"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";

// PostHog initializes only when NEXT_PUBLIC_POSTHOG_KEY is set (docs/SETUP §6) — absent = disabled.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
let started = false;

/** Env-flagged product analytics. Renders nothing; captures a pageview on each route change. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!KEY || started) return;
    posthog.init(KEY, { api_host: HOST, capture_pageview: false, capture_pageleave: true });
    started = true;
  }, []);

  useEffect(() => {
    if (KEY && started) posthog.capture("$pageview");
  }, [pathname]);

  return null;
}
