# Code Review: Pancake POS MCP Server - Phase 1 Implementation

**Reviewer:** code-reviewer  
**Date:** 2026-04-09  
**Scope:** All 16 source files in `src/` (~1348 LOC)  
**TypeScript:** Compiles clean (`bun run typecheck` passes)  
**SDK:** @modelcontextprotocol/sdk@1.29.0, zod@4.3.6

---

## Overall Assessment

Solid Phase 1 foundation. Clean TypeScript, well-separated concerns, consistent patterns. The domain-grouped tool design with discriminated unions is effective. Several issues need attention before production deployment, most critically around the HTTP transport architecture and a synchronous busy-wait in the rate limiter.

---

## Critical Issues (Blocking)

### C1. Synchronous Busy-Wait in Rate Limiter Blocks Event Loop

**File:** `src/api-client/pancake-http-client.ts:110-114`  
**Impact:** Blocks the entire Bun event loop. In HTTP transport mode, ALL concurrent MCP requests freeze while one client waits for a rate-limit token. In stdio mode the impact is lower (single client), but it still blocks heartbeats and transport I/O.

```typescript
// Current: busy-wait loop
const start = Date.now();
while (Date.now() - start < waitMs) {
  // busy wait
}
```

**Fix:** Make `consumeToken` async and `await` a real sleep:

```typescript
private async consumeToken(): Promise<void> {
  this.refillTokens();
  if (this.tokens <= 0) {
    const waitMs = this.refillRateMs;
    console.error(`[PancakeHTTP] Rate limit reached, waiting ${waitMs}ms`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    this.refillTokens();
  }
  this.tokens--;
}
```

This requires `executeWithRetry` to `await this.consumeToken()` (already in async context, so just adding `await`).

### C2. HTTP Transport Supports Only One Session at a Time

**File:** `src/index.ts:22-49`  
**Impact:** The code creates a single `WebStandardStreamableHTTPServerTransport` instance connected to one `McpServer`. This transport manages exactly one session (`this.sessionId`). A second client attempting `initialize` will either fail or overwrite the first client's session. This makes HTTP mode unsuitable for any multi-client scenario.

**Fix:** Create a new transport + server pair per session. The SDK pattern for multi-client HTTP:

```typescript
const sessions = new Map<string, { server: McpServer; transport: WebStandardStreamableHTTPServerTransport }>();

Bun.serve({
  port: config.PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== "/mcp") {
      if (url.pathname === "/health") return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
      return new Response("Not Found", { status: 404 });
    }

    // Extract session from header
    const sessionId = req.headers.get("mcp-session-id");

    if (sessionId && sessions.has(sessionId)) {
      return sessions.get(sessionId)!.transport.handleRequest(req);
    }

    // New session: create transport + server
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => { sessions.set(id, { server, transport }); },
    });
    const server = createServer(client);
    await server.connect(transport);
    return transport.handleRequest(req);
  },
});
```

Alternatively, if single-session is the intended deployment model, document this limitation explicitly and consider removing `sessionIdGenerator` to run in stateless mode.

### C3. No Authentication on HTTP Transport Endpoint

**File:** `src/index.ts:34`  
**Impact:** The `/mcp` endpoint is completely unauthenticated. Anyone who can reach the port can invoke all tools including `delete` orders, `create` customers, and `ship` orders. The MCP server has full write access to the Pancake POS API via the configured `api_key`.

**Fix:** Add bearer token or shared-secret authentication:

```typescript
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

async fetch(req: Request): Promise<Response> {
  if (url.pathname === "/mcp") {
    if (MCP_AUTH_TOKEN) {
      const auth = req.headers.get("Authorization");
      if (auth !== `Bearer ${MCP_AUTH_TOKEN}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }
    return transport.handleRequest(req);
  }
}
```

---

## High Priority

### H1. API Key Leaked in URL (Query Parameter)

**File:** `src/api-client/request-builder.ts:37`  
**Impact:** The `api_key` is appended as a query parameter: `url.searchParams.set("api_key", apiKey)`. This means:
- The key appears in server access logs, proxy logs, CDN logs, and browser history
- Any error reporting that logs URLs will capture it (even with `redactUrl`, only console logs are covered)
- Fetch errors from Bun may include the full URL in stack traces

This is how the Pancake API works (query param auth), so it cannot be moved to a header. However:

**Mitigation:**
1. Ensure `redactUrl` is used everywhere a URL could be logged. Currently it's used in retry logs but not in `PancakeApiError` messages. The `parseResponse`/`parsePaginatedResponse` functions receive `url` but don't log it (good). But if these functions ever include URL in error messages, the key would leak.
2. Consider stripping the `url` param from `parseResponse`/`parsePaginatedResponse` since it's unused -- remove the footgun.

### H2. Missing Hourly Rate Limit (Only Per-Minute Implemented)

**File:** `src/api-client/pancake-http-client.ts`  
**Impact:** The design doc specifies 1000/min AND 10000/hour. Only the per-minute bucket is implemented. Sustained traffic at 999 req/min for 11+ minutes will exceed the hourly limit and trigger API-side 429 responses.

**Fix:** Add a second token bucket for hourly limits, or implement a dual-window rate limiter.

### H3. `page_size` Unbounded in Tool Registry Schema

**File:** `src/tools/tool-registry.ts:27-28`  
**Impact:** The raw schema in `tool-registry.ts` declares `page_size: z.number().int().optional()` with no `.max()` constraint, while the shared `PaginationParams` schema in `schemas.ts` has `.max(200)`. The discriminated union schemas in individual tool files spread `PaginationParams.shape` (which includes the max constraint), so runtime validation does catch it. But the JSON Schema exposed to LLM clients via the tool listing will NOT show the max constraint -- the LLM may request `page_size: 10000`.

**Fix:** Add `.max(200)` to the raw schema in `tool-registry.ts`, or better yet, reference `PaginationParams` fields directly instead of duplicating.

### H4. `tool()` Is Deprecated in SDK 1.29.0

**File:** `src/tools/tool-registry.ts`  
**Impact:** All tool registrations use `server.tool()` which the SDK marks as `@deprecated` in favor of `server.registerTool()`. Future SDK versions may remove it.

**Fix:** Migrate to `registerTool`:
```typescript
server.registerTool("manage_orders", {
  description: "...",
  inputSchema: { action: z.enum([...]), ... },
}, async (args) => { ... });
```

### H5. Unused `url` Parameter in Response Parsers

**File:** `src/api-client/response-parser.ts:7,31`  
**Impact:** Both `parseResponse` and `parsePaginatedResponse` accept a `url: string` parameter that is never used. This is a latent security risk -- a future developer might add it to error messages, leaking the API key.

**Fix:** Remove the `url` parameter from both function signatures.

---

## Medium Priority

### M1. Shipping Partners Cache Never Invalidates

**File:** `src/resources/reference-data-resources.ts:87-99`  
**Impact:** `cachedPartners` is a module-level variable set once and never cleared. If shipping partners change (new partner onboarded, partner disabled), the MCP server will serve stale data until restarted.

**Fix:** Add TTL-based invalidation:
```typescript
let cachedPartners: { data: unknown[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getShippingPartners(client: PancakeHttpClient): Promise<unknown[]> {
  if (cachedPartners && Date.now() - cachedPartners.fetchedAt < CACHE_TTL_MS) {
    return cachedPartners.data;
  }
  // ... fetch and cache with timestamp
}
```

### M2. Race Condition in Shipping Partners Cache

**File:** `src/resources/reference-data-resources.ts:89-98`  
**Impact:** Two concurrent calls to `getShippingPartners` when cache is empty will both initiate API requests. Not harmful (just redundant), but indicates missing concurrency handling.

**Fix:** Use a promise-based cache:
```typescript
let cachedPartnersPromise: Promise<unknown[]> | null = null;

export function getShippingPartners(client: PancakeHttpClient): Promise<unknown[]> {
  if (!cachedPartnersPromise) {
    cachedPartnersPromise = fetchPartners(client);
  }
  return cachedPartnersPromise;
}
```

### M3. `PancakeResponse<T>` Type Erases API Shape via `as unknown as`

**File:** `src/api-client/response-parser.ts:25`  
**Impact:** `return json as unknown as PancakeResponse<T>` is a double type assertion that bypasses all type checking. If the API returns `{ data: null, success: true }`, the code happily passes `null` as `T`. Since the Pancake API is external, this could produce runtime errors downstream.

**Fix:** At minimum, validate that `json.data` exists:
```typescript
if (!('data' in json)) {
  throw new PancakeApiError("MALFORMED_RESPONSE", "API response missing 'data' field", response.status);
}
```

### M4. Path Prefix Logic Is Fragile

**File:** `src/api-client/request-builder.ts:33-34`  
**Impact:** `const needsShopPrefix = !path.startsWith("/partners")` is a hardcoded exemption for one path. As more endpoints are added (Phase 2+), this will need constant maintenance. Paths like `/webhooks` or `/reports` that don't need shop prefix will break.

**Fix:** Accept a `skipShopPrefix` boolean parameter, or maintain a set of top-level paths, or let the caller pass the full path.

### M5. Schema Drift Between Tool Registry and Discriminated Unions

**File:** `src/tools/tool-registry.ts` vs individual tool files  
**Impact:** The raw schema in `tool-registry.ts` for `manage_orders` lists a subset of fields compared to what the discriminated union in `orders-tool.ts` accepts. For example:
- `bill_email`, `is_free_shipping`, `received_at_shop`, `note_print`, `shipping_fee`, `total_discount`, `surcharge`, `custom_id`, `customer_pay_fee` exist in `ordersToolSchema` (CreateAction) but are missing from the raw schema in tool-registry
- `service_type_id`, `pick_shift`, `required_note` exist in ShipAction but not in the raw schema

This means the LLM never sees these fields in the JSON Schema, so it won't use them. It also means if a user manually passes them, Zod validation on the discriminated union will accept them, but the SDK's own schema validation (from the raw shape) may strip them.

**Fix:** Ensure 1:1 correspondence between the raw shape and the union schema, or generate the raw shape from the union schema programmatically.

### M6. Error Messages May Leak Internal Details

**File:** `src/shared/error-handler.ts:14`  
**Impact:** For non-`PancakeApiError` exceptions, `error.message` is passed through directly. If a dependency throws an error containing a file path, stack trace, or internal state, this leaks to the LLM (and potentially to end users through the MCP client).

**Fix:** Sanitize generic error messages or map them to safe codes:
```typescript
} else if (error instanceof Error) {
  code = "INTERNAL_ERROR";
  message = "An internal error occurred. Check server logs for details.";
  console.error("[PancakeTools] Internal error:", error); // log full error server-side
}
```

### M7. No Request Timeout on Fetch Calls

**File:** `src/api-client/pancake-http-client.ts:76`  
**Impact:** `fetch(url, init)` has no timeout. If the Pancake API hangs (connection accepted but no response), the MCP tool call hangs indefinitely, blocking the LLM interaction.

**Fix:** Add `AbortSignal.timeout`:
```typescript
const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
```

---

## Low Priority

### L1. `sleep` Function Should Be a Shared Utility

**File:** `src/api-client/pancake-http-client.ts:133-135`  
**Impact:** Minor duplication risk. The `sleep` helper is defined at module scope but not exported. Other modules needing delays would duplicate it.

### L2. Health Check Doesn't Report Useful Diagnostics

**File:** `src/index.ts:39-42`  
**Impact:** The `/health` endpoint returns a static `{ status: "ok" }`. It doesn't check if the Pancake API is reachable or if the `api_key` is valid. For production monitoring, a shallow API probe (e.g., fetching partners or a lightweight endpoint) would be more useful.

### L3. Console Logging Could Be Structured

**File:** Multiple files  
**Impact:** All logging uses `console.error` with ad-hoc formatting. For production observability, structured JSON logging (with timestamp, level, context) would be more useful.

### L4. `resource()` Is Also Deprecated

**File:** `src/resources/resource-registry.ts`  
**Impact:** Similar to `tool()`, `resource()` is deprecated in favor of `registerResource()` in SDK 1.29.0.

---

## Positive Observations

1. **Clean separation of concerns**: api-client / tools / resources / shared -- well-structured
2. **Discriminated union pattern**: Elegant solution for action dispatch with full type narrowing in switch cases
3. **Dual-layer validation**: Raw shape for JSON Schema visibility + discriminated union for runtime -- smart trade-off
4. **`redactUrl` helper**: Proactive security measure for logging
5. **Consistent error handling**: Every tool handler has try/catch with `formatToolError`
6. **All files under 200 lines**: Excellent modularity discipline
7. **Zod-validated config**: Fail-fast on startup with clear error messages
8. **TypeScript strict mode enabled**: With `noUncheckedIndexedAccess` -- above-average strictness

---

## Metrics

| Metric | Value |
|--------|-------|
| Files | 16 |
| Total LOC | 1,348 |
| TypeScript Errors | 0 |
| Largest File | `orders-tool.ts` (165 lines) |
| Critical Issues | 3 |
| High Issues | 5 |
| Medium Issues | 7 |
| Low Issues | 4 |

---

## Recommended Action Plan (Priority Order)

1. **[C1] Fix busy-wait** -- make `consumeToken` async (5 min fix, highest impact)
2. **[C3] Add HTTP auth** -- bearer token or shared secret on `/mcp` endpoint
3. **[C2] Fix or document HTTP single-session** -- either support multi-client or document limitation
4. **[H5] Remove unused `url` param** from response parsers (eliminate footgun)
5. **[H3] Add `max(200)` to raw `page_size`** in tool-registry
6. **[M5] Align raw schemas with discriminated unions** -- LLM can't use fields it can't see
7. **[M7] Add fetch timeout** -- prevent indefinite hangs
8. **[M3] Validate response shape** -- at minimum check `data` field exists
9. **[M6] Sanitize generic errors** -- don't leak internals to LLM
10. **[H2] Add hourly rate limit** -- match design spec
11. **[H4/L4] Migrate to `registerTool`/`registerResource`** -- future-proof against SDK changes
12. **[M1/M2] Fix partners cache** -- add TTL and promise-based dedup

---

## Unresolved Questions

1. Does the Pancake API enforce rate limits per-key server-side? If yes, how does it signal 429 -- is there a `Retry-After` header the retry logic should respect?
2. Is multi-client HTTP access actually needed for Phase 1, or is stdio the primary transport with HTTP as a debug/dev convenience?
3. The `order_sources` field in `ListAction` has type `z.array(z.array(z.string()))` -- is this `[[source_code, account_id]]` format confirmed from API docs? Unusual shape that an LLM may struggle with.
