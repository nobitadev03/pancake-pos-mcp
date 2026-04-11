# Phase 2: Workers Entry Point

## Context Links
- [plan.md](./plan.md) — Overview
- [Phase 1](./phase-01-project-setup-and-wrangler-config.md) — Prerequisites
- `src/index.ts` — Current Bun entry point (reference)
- `src/server.ts` — MCP server factory (reused)
- `src/config.ts` — Config loader (reused via `nodejs_compat`)
- SDK source: `node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js`

## Overview
- **Priority:** P0
- **Status:** COMPLETE
- **Description:** Create `src/worker.ts` — Cloudflare Workers fetch handler with per-request MCP server + transport lifecycle

## Key Insights (Red-Team Validated)

### C1 FIX: Per-Request Transport + Server
The SDK's `WebStandardStreamableHTTPServerTransport` in **stateful mode** stores `this._initialized = true` after first `initialize` call (line 425-428) and rejects all subsequent `initialize` requests with `"Server already initialized"`. In **stateless mode** (sessionIdGenerator: undefined), it throws `"Stateless transport cannot be reused"` (line 139-141) on second `handleRequest()`.

**Solution:** Create a **new transport + new server per request**. This is the correct pattern for serverless (Workers, Lambda, etc.) where each invocation is isolated:
- Each request gets fresh `McpServer` + `WebStandardStreamableHTTPServerTransport`
- No session state persists between requests (stateless mode)
- `PancakeHttpClient` + config shared at module scope (stateless, safe to reuse)
- `enableJsonResponse: true` returns plain JSON instead of SSE — simpler for Workers

### H2 FIX: Timing-Safe Token Comparison
Use `crypto.subtle.timingSafeEqual()` instead of `===` for Bearer token comparison.

### H3 FIX: CORS Headers
Add `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` + OPTIONS preflight handler for browser-based MCP clients.

### M1 FIX: Route All Methods
Delegate ALL HTTP methods on `/mcp` to `transport.handleRequest(req)` — the transport handles GET (SSE), POST (JSON-RPC), DELETE (session close) internally.

## Requirements
### Functional
- `/mcp` endpoint creates per-request transport + server, delegates to MCP
- `/health` endpoint returns JSON health check
- Bearer token auth enforced with timing-safe comparison when `MCP_AUTH_TOKEN` is set
- OPTIONS preflight returns CORS headers
- All other paths return 404

### Non-functional
- Must reuse `createServer()`, `loadConfig()`, `PancakeHttpClient` unchanged
- No `Bun.serve()` — uses Workers `export default { fetch }` pattern
- Cold start < 100ms (per-request server creation is lightweight)

## Related Code Files
### Create
- `src/worker.ts` — Workers entry point

### Read (context)
- `src/index.ts` — Reference for current HTTP handler pattern
- `src/server.ts` — `createServer(client)` signature
- `src/config.ts` — `loadConfig()` signature

### No changes
- All tool files, resource files, shared files, api-client files

## TDD: Tests First

### Test 1: Health endpoint
```typescript
// tests/worker.test.ts
import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Worker fetch handler", () => {
  it("returns health check on /health", async () => {
    const res = await SELF.fetch("http://localhost/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("returns 404 on unknown paths", async () => {
    const res = await SELF.fetch("http://localhost/unknown");
    expect(res.status).toBe(404);
  });

  it("returns CORS headers on OPTIONS preflight", async () => {
    const res = await SELF.fetch("http://localhost/mcp", { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
```

### Test 2: Auth enforcement
```typescript
describe("MCP endpoint auth", () => {
  it("returns 401 without Bearer token when MCP_AUTH_TOKEN is set", async () => {
    const res = await SELF.fetch("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
    });
    expect(res.status).toBe(401);
  });

  it("accepts valid Bearer token and processes MCP request", async () => {
    const res = await SELF.fetch("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
        id: 1,
      }),
    });
    expect(res.status).toBe(200);
  });
});
```

### Test 3: Multiple clients (C1 fix validation)
```typescript
describe("Multi-client support (C1 fix)", () => {
  it("handles two sequential initialize requests from different clients", async () => {
    // Client A initializes
    const resA = await SELF.fetch("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "client-a", version: "1.0" },
        },
        id: 1,
      }),
    });
    expect(resA.status).toBe(200);

    // Client B initializes (must NOT get "Server already initialized")
    const resB = await SELF.fetch("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "client-b", version: "1.0" },
        },
        id: 1,
      }),
    });
    expect(resB.status).toBe(200);
    const jsonB = await resB.json();
    // Must NOT have error about "Server already initialized"
    expect(jsonB.error).toBeUndefined();
    expect(jsonB.result).toBeDefined();
  });
});
```

## Implementation Steps

1. **Write tests first** (see TDD section above)
2. **Create `src/worker.ts`:**

```typescript
import { loadConfig } from "./config.js";
import { PancakeHttpClient } from "./api-client/pancake-http-client.js";

// Module-level init: config + HTTP client shared across requests (stateless, safe)
const config = loadConfig();
const client = new PancakeHttpClient(config);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
} as const;

/**
 * Timing-safe comparison for Bearer tokens.
 * Prevents timing side-channel attacks on token verification.
 */
async function verifyToken(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const a = encoder.encode(provided);
  const b = encoder.encode(expected);
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

/**
 * Creates a fresh MCP server + transport per request.
 * Required because WebStandardStreamableHTTPServerTransport in stateless mode
 * throws on reuse, and stateful mode rejects re-initialization.
 */
async function createPerRequestMcp() {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );
  const { createServer } = await import("./server.js");

  const server = createServer(client);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
    enableJsonResponse: true,      // return JSON, not SSE
  });

  await server.connect(transport);
  return transport;
}

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check — no auth required
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", transport: "streamable-http" }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    // MCP endpoint — auth + per-request transport
    if (url.pathname === "/mcp") {
      // Auth enforcement
      const authToken = config.MCP_AUTH_TOKEN;
      if (authToken) {
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || !(await verifyToken(token, authToken))) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
          );
        }
      }

      // Create fresh MCP server + transport per request (C1 fix)
      const transport = await createPerRequestMcp();
      const response = await transport.handleRequest(req);

      // Add CORS headers to transport response
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        newHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

3. **Verify `wrangler.toml` points to `src/worker.ts`**
4. **Run tests** — `bun run test tests/worker.test.ts`
5. **Run typecheck** — `bun run typecheck`
6. **Test locally** — `wrangler dev` → curl health + MCP initialize
7. **Test multi-client** — Two sequential curl initialize calls must both succeed

## Todo List
- [ ] Write worker fetch handler tests (TDD)
- [ ] Write auth enforcement tests with timing-safe comparison (TDD)
- [ ] Write multi-client test (C1 validation) (TDD)
- [ ] Write CORS preflight test (TDD)
- [ ] Create src/worker.ts with per-request transport lifecycle
- [ ] Verify tests pass
- [ ] Verify typecheck passes
- [ ] Test with `wrangler dev`
- [ ] Test multi-client via curl

## Success Criteria
- All worker tests pass
- Two sequential `initialize` requests both return 200 (C1 fixed)
- `/health` returns health check JSON
- `/mcp` returns 401 without valid token (timing-safe)
- OPTIONS returns CORS headers
- Unknown paths return 404
- `wrangler dev` starts and serves requests

## Security Considerations
- Bearer token verified with `crypto.subtle.timingSafeEqual()` (H2 fix)
- CORS headers included on all /mcp responses (H3 fix)
- No secrets exposed in error responses
- Config loaded once at module scope — stateless, safe to share
- Per-request MCP isolation prevents cross-client data leakage

## Next Steps
- Phase 3: HTTP Client Adaptation (timeout reduction for Workers)
