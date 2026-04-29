import { defineConfig } from "vitest/config";
import {
  cloudflarePool,
  cloudflareTest,
} from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: "./src/worker.ts",
      miniflare: {
        compatibilityDate: "2026-04-01",
        compatibilityFlags: ["nodejs_compat"],
        bindings: {
          PANCAKE_POS_API_KEY: "test-api-key",
          PANCAKE_POS_SHOP_ID: "test-shop-id",
          MCP_AUTH_TOKEN: "test-token",
          PANCAKE_POS_BASE_URL: "https://pos.pages.fm/api/v1",
        },
      },
    }),
  ],
  test: {
    pool: cloudflarePool({
      main: "./src/worker.ts",
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        compatibilityDate: "2026-04-01",
        compatibilityFlags: ["nodejs_compat"],
        bindings: {
          PANCAKE_POS_API_KEY: "test-api-key",
          PANCAKE_POS_SHOP_ID: "test-shop-id",
          MCP_AUTH_TOKEN: "test-token",
          PANCAKE_POS_BASE_URL: "https://pos.pages.fm/api/v1",
        },
      },
    }),
  },
});
