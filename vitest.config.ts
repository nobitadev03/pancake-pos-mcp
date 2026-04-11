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
        bindings: {
          PANCAKE_API_KEY: "test-api-key",
          PANCAKE_SHOP_ID: "test-shop-id",
          MCP_AUTH_TOKEN: "test-token",
          PANCAKE_BASE_URL: "https://pos.pages.fm/api/v1",
        },
      },
    }),
  ],
  test: {
    pool: cloudflarePool({
      main: "./src/worker.ts",
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: {
          PANCAKE_API_KEY: "test-api-key",
          PANCAKE_SHOP_ID: "test-shop-id",
          MCP_AUTH_TOKEN: "test-token",
          PANCAKE_BASE_URL: "https://pos.pages.fm/api/v1",
        },
      },
    }),
  },
});
