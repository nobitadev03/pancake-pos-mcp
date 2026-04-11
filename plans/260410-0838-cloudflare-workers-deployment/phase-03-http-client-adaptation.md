# Phase 3: HTTP Client Adaptation

## Context Links
- [plan.md](./plan.md) — Overview
- `src/api-client/pancake-http-client.ts` — Main HTTP client (modify)
- `src/api-client/request-builder.ts` — URL construction (unchanged)
- `src/api-client/response-parser.ts` — Response parsing (unchanged)

## Overview
- **Priority:** P0
- **Status:** COMPLETE
- **Description:** Make PancakeHttpClient Workers-compatible: reduce timeouts to fit 30s wall-clock limit, handle rate limiter scope

## Key Insights (Red-Team Validated)

### C2 FIX: Timeout Budget
Workers have 30s wall-clock limit (free tier). Current retry: 3 attempts × 30s timeout = 90s worst case.
**Fix:** Reduce `FETCH_TIMEOUT_MS` to 8s on Workers, and `MAX_RETRIES` to 2. Total worst case: 2 × 8s + 4s backoff = 20s < 30s.

### M4 FIX: Rate Limiter Scope
Removing rate limiter affects BOTH Workers AND Bun entry points. Two options:
- **Option A (recommended):** Make timeout/retry configurable via constructor. Workers passes lower values.
- **Option B:** Remove rate limiter entirely (Pancake API self-enforces 429).

**Decision:** Option A — make timeouts configurable. Rate limiter stays for Bun mode (protects against local burst), removed/ignored for Workers (stateless reset makes it useless).

### L1 FIX: Retry 429
Current code only retries `status >= 500`. A 429 from Pancake API should also trigger retry with backoff.

## Requirements
### Functional
- Make `FETCH_TIMEOUT_MS` and `MAX_RETRIES` configurable via constructor options
- Add 429 to retry conditions (with `Retry-After` header support)
- Default values unchanged for Bun mode (backward compatible)
- Workers mode passes lower timeouts

### Non-functional
- Zero changes to tool files (they call client methods which don't change)
- Existing Bun development flow unaffected
- Public API (get, getList, post, put, delete) unchanged

## Related Code Files
### Modify
- `src/api-client/pancake-http-client.ts` — Add configurable timeouts + 429 retry

### No changes
- `src/api-client/request-builder.ts`
- `src/api-client/response-parser.ts`
- All 23 tool files
- All 7 resource files

## Architecture: Configurable Client

```typescript
interface HttpClientOptions {
  fetchTimeoutMs?: number;   // Default: 30_000 (Bun), 8_000 (Workers)
  maxRetries?: number;        // Default: 3 (Bun), 2 (Workers)
  enableRateLimiter?: boolean; // Default: true (Bun), false (Workers)
}
```

## TDD: Tests First

### Test 1: Configurable timeout
```typescript
// tests/http-client.test.ts
import { describe, it, expect, vi } from "vitest";

describe("PancakeHttpClient configurable options", () => {
  it("uses default timeout when no options provided", async () => {
    const { PancakeHttpClient } = await import("../src/api-client/pancake-http-client.js");
    const client = new PancakeHttpClient({
      PANCAKE_API_KEY: "test",
      PANCAKE_SHOP_ID: "test",
      PANCAKE_BASE_URL: "https://api.test.com",
      PORT: 3000,
    });
    // Default timeout should be 30s
    expect((client as any).fetchTimeoutMs).toBe(30_000);
    expect((client as any).maxRetries).toBe(3);
  });

  it("accepts custom timeout for Workers mode", async () => {
    const { PancakeHttpClient } = await import("../src/api-client/pancake-http-client.js");
    const client = new PancakeHttpClient(
      {
        PANCAKE_API_KEY: "test",
        PANCAKE_SHOP_ID: "test",
        PANCAKE_BASE_URL: "https://api.test.com",
        PORT: 3000,
      },
      { fetchTimeoutMs: 8_000, maxRetries: 2, enableRateLimiter: false },
    );
    expect((client as any).fetchTimeoutMs).toBe(8_000);
    expect((client as any).maxRetries).toBe(2);
  });
});
```

### Test 2: 429 retry
```typescript
describe("PancakeHttpClient 429 retry", () => {
  it("retries on 429 Too Many Requests", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 1 }, success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    globalThis.fetch = mockFetch;

    const { PancakeHttpClient } = await import("../src/api-client/pancake-http-client.js");
    const client = new PancakeHttpClient(
      {
        PANCAKE_API_KEY: "test",
        PANCAKE_SHOP_ID: "test",
        PANCAKE_BASE_URL: "https://api.test.com",
        PORT: 3000,
      },
      { enableRateLimiter: false },
    );

    const result = await client.get("/orders/1");
    expect(result.data).toEqual({ id: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

### Test 3: Rate limiter disabled in Workers mode
```typescript
describe("Rate limiter control", () => {
  it("skips rate limiter when enableRateLimiter is false", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 1 }, success: true }), { status: 200 }),
    );
    globalThis.fetch = mockFetch;

    const { PancakeHttpClient } = await import("../src/api-client/pancake-http-client.js");
    const client = new PancakeHttpClient(
      {
        PANCAKE_API_KEY: "test",
        PANCAKE_SHOP_ID: "test",
        PANCAKE_BASE_URL: "https://api.test.com",
        PORT: 3000,
      },
      { enableRateLimiter: false },
    );

    // Should execute immediately without rate limit delay
    const start = Date.now();
    await client.get("/orders/1");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100); // No rate limit wait
  });
});
```

## Implementation Steps

1. **Write tests first** (see TDD section above)
2. **Add `HttpClientOptions` interface** to `pancake-http-client.ts`
3. **Modify constructor** to accept optional options parameter:
   ```typescript
   constructor(config: PancakeConfig, options?: HttpClientOptions) {
     // ... existing code
     this.fetchTimeoutMs = options?.fetchTimeoutMs ?? 30_000;
     this.maxRetries = options?.maxRetries ?? 3;
     this.enableRateLimiter = options?.enableRateLimiter ?? true;
   }
   ```
4. **Update `executeWithRetry`:**
   - Use `this.fetchTimeoutMs` instead of constant
   - Use `this.maxRetries` instead of constant
   - Add `response.status === 429` to retry condition
   - Check `Retry-After` header for 429 backoff
5. **Update `consumeToken`:**
   - Skip rate limiter if `this.enableRateLimiter === false`
6. **Update `src/worker.ts`** to pass Workers-optimized options:
   ```typescript
   const client = new PancakeHttpClient(config, {
     fetchTimeoutMs: 8_000,
     maxRetries: 2,
     enableRateLimiter: false,
   });
   ```
7. **Verify `src/index.ts`** still works unchanged (uses defaults)
8. **Run tests** — `bun run test tests/http-client.test.ts`
9. **Run typecheck** — `bun run typecheck`

## Todo List
- [ ] Write configurable timeout tests (TDD)
- [ ] Write 429 retry test (TDD)
- [ ] Write rate limiter disable test (TDD)
- [ ] Add HttpClientOptions interface
- [ ] Update constructor to accept options
- [ ] Update executeWithRetry for configurable timeout/retry + 429
- [ ] Update consumeToken for rate limiter toggle
- [ ] Update worker.ts to pass Workers options
- [ ] Verify index.ts (Bun) still works with defaults
- [ ] Verify tests pass
- [ ] Verify typecheck passes

## Success Criteria
- HTTP client accepts configurable timeouts (default unchanged = backward compatible)
- 429 responses trigger retry with backoff
- Rate limiter can be disabled via option
- Workers mode uses 8s timeout, 2 retries, no rate limiter
- Bun mode uses 30s timeout, 3 retries, rate limiter enabled (unchanged)
- All 23 tools still compile (unchanged public API)

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Breaking existing Bun mode | Defaults unchanged; option param is optional |
| 429 retry loop | Max 2 retries on Workers, 3 on Bun; exponential backoff |
| Workers 30s timeout breach | 2 × 8s + backoff = 20s max < 30s limit |

## Next Steps
- Phase 4: Integration Tests & E2E
