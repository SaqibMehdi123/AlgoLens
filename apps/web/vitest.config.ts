import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared";

export default mergeConfig(
  shared,
  defineConfig({
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
  }),
);
