import { defineConfig } from "vitest/config";

/**
 * Shared Vitest config. Uses a single persistent fork (no worker-pool churn) — robust on Windows
 * and on paths containing spaces, where tinypool's short-lived workers can exit unexpectedly.
 */
export default defineConfig({
  test: {
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
  },
});
