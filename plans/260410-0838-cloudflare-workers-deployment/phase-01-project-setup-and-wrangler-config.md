# Phase 1: Project Setup & Wrangler Config

## Context Links
- [plan.md](./plan.md) — Overview
- [Cloudflare Workers MCP Guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- `package.json` — Current dependencies
- `tsconfig.json` — TypeScript config

## Overview
- **Priority:** P0
- **Status:** COMPLETE
- **Description:** Add Wrangler tooling, test infrastructure, and Workers-specific config files

## Key Insights
- `nodejs_compat` flag makes `process.env` work on Workers — no config.ts changes needed
- Wrangler bundles TypeScript natively — no build step required
- `.dev.vars` replaces `.env` for local Workers dev
- `vitest` + `@cloudflare/vitest-pool-workers` for TDD in Workers runtime

## Requirements
### Functional
- `wrangler.toml` with correct entry point, compat date, and flags
- `.dev.vars` template for local development secrets
- Vitest configured with Workers pool
- Package scripts for Workers dev/deploy/test

### Non-functional
- Existing `bun run typecheck` must still pass
- Existing `bun run start` (stdio/http) must still work
- No breaking changes to current development flow

## Related Code Files
### Modify
- `package.json` — Add devDependencies + scripts
- `tsconfig.json` — Add Workers types (optional, via `@cloudflare/workers-types`)
- `.gitignore` — Add `.dev.vars`, `.wrangler/`

### Create
- `wrangler.toml` — Workers deployment config
- `.dev.vars` — Local secrets template (gitignored)
- `vitest.config.ts` — Vitest with Workers pool
- `.dev.vars.example` — Template for team reference

## TDD: Tests First

### Test 1: Vitest config loads correctly
```typescript
// tests/setup.test.ts
import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("vitest runs in workers environment", () => {
    // Verify we're in a Workers-like environment
    expect(typeof globalThis.Response).toBe("function");
    expect(typeof globalThis.Request).toBe("function");
    expect(typeof crypto.randomUUID).toBe("function");
  });
});
```

## Implementation Steps

1. **Install dev dependencies**
   ```bash
   bun add -d wrangler vitest @cloudflare/vitest-pool-workers @cloudflare/workers-types
   ```

2. **Create `wrangler.toml`**
   ```toml
   name = "pancake-pos-mcp"
   main = "src/worker.ts"
   compatibility_date = "2026-04-01"
   compatibility_flags = ["nodejs_compat"]
   workers_dev = true
   ```

3. **Create `.dev.vars`** (gitignored)
   ```
   PANCAKE_API_KEY=your_api_key_here
   PANCAKE_SHOP_ID=your_shop_id_here
   MCP_AUTH_TOKEN=your_auth_token_here
   ```

4. **Create `.dev.vars.example`** (committed)
   ```
   PANCAKE_API_KEY=your_api_key_here
   PANCAKE_SHOP_ID=your_shop_id_here
   MCP_AUTH_TOKEN=optional_auth_token
   ```

5. **Create `vitest.config.ts`**
   ```typescript
   import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

   export default defineWorkersConfig({
     test: {
       poolOptions: {
         workers: {
           wrangler: { configPath: "./wrangler.toml" },
         },
       },
     },
   });
   ```

6. **Update `package.json` scripts**
   ```json
   {
     "scripts": {
       "start": "bun run src/index.ts",
       "start:stdio": "bun run src/index.ts --stdio",
       "start:http": "bun run src/index.ts --http",
       "typecheck": "bun run --bun tsc --noEmit",
       "dev:workers": "wrangler dev",
       "deploy": "wrangler deploy",
       "test": "vitest run",
       "test:watch": "vitest"
     }
   }
   ```

7. **Update `.gitignore`**
   ```
   .dev.vars
   .wrangler/
   ```

8. **Run tests** — `bun run test` should pass setup test
9. **Run typecheck** — `bun run typecheck` should still pass

## Todo List
- [ ] Install wrangler, vitest, and CF worker types
- [ ] Create wrangler.toml
- [ ] Create .dev.vars + .dev.vars.example
- [ ] Create vitest.config.ts
- [ ] Write setup test (TDD)
- [ ] Update package.json scripts
- [ ] Update .gitignore
- [ ] Verify typecheck still passes

## Success Criteria
- `bun run test` passes (vitest runs in Workers pool)
- `bun run typecheck` passes (no regression)
- `wrangler dev` starts without errors (even before worker.ts exists — will show missing file error, that's expected)
- `.dev.vars` is gitignored

## Security Considerations
- `.dev.vars` must be gitignored (contains real API keys)
- No secrets in `wrangler.toml` `[vars]` section (only non-sensitive defaults)
- `.dev.vars.example` contains only placeholder values

## Next Steps
- Phase 2: Create `src/worker.ts` Workers entry point
