# Phase 4: Integration Tests & E2E

## Context Links
- [plan.md](./plan.md) — Overview
- [Phase 2](./phase-02-workers-entry-point.md) — Worker entry point
- [Phase 3](./phase-03-http-client-adaptation.md) — HTTP client adaptation

## Overview
- **Priority:** P1
- **Status:** COMPLETE
- **Description:** End-to-end MCP protocol tests validating the full stack on Workers runtime: tool listing, tool calls, resource reads, error handling

## Key Insights
- `@cloudflare/vitest-pool-workers` provides `SELF` helper for sending requests to the Worker
- MCP uses JSON-RPC 2.0 over HTTP — can test by sending raw JSON-RPC requests
- MCP Inspector (`npx @modelcontextprotocol/inspector`) for manual E2E validation
- Focus on protocol correctness, not individual tool logic (tools are already proven)

## Requirements
### Functional
- Test MCP `initialize` handshake
- Test `tools/list` returns all 23 tools
- Test `resources/list` returns all 7 resources
- Test a tool call (e.g., `manage_orders` with `action: "list"`) — mock Pancake API
- Test error handling (invalid JSON-RPC, missing auth)

### Non-functional
- Tests run in Workers runtime (via vitest pool)
- Tests must not call real Pancake API (mock outbound fetch)
- Test execution < 30s

## Related Code Files
### Create
- `tests/e2e-mcp.test.ts` — MCP protocol E2E tests

### Read (context)
- `src/worker.ts` — Worker entry point
- `src/tools/tool-registry.ts` — Tool names for assertion

## TDD: Tests First

### Test 1: MCP Initialize Handshake
```typescript
// tests/e2e-mcp.test.ts
import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

const AUTH_HEADER = { "Authorization": "Bearer test-token" };

function jsonRpcRequest(method: string, params: unknown = {}, id: number = 1) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADER,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id,
    }),
  };
}

describe("MCP Protocol E2E", () => {
  it("completes initialize handshake", async () => {
    const res = await SELF.fetch(
      "http://localhost/mcp",
      jsonRpcRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBeDefined();
    expect(json.result.serverInfo.name).toBe("pancake-pos");
  });
});
```

### Test 2: Tools List
```typescript
describe("MCP Tools", () => {
  it("lists all 23 tools", async () => {
    // After initialize, list tools
    const res = await SELF.fetch(
      "http://localhost/mcp",
      jsonRpcRequest("tools/list"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.tools.length).toBe(23);

    // Verify key tool names exist
    const names = json.result.tools.map((t: any) => t.name);
    expect(names).toContain("manage_orders");
    expect(names).toContain("manage_products");
    expect(names).toContain("get_statistics");
    expect(names).toContain("lookup_address");
  });
});
```

### Test 3: Resources List
```typescript
describe("MCP Resources", () => {
  it("lists all 7 resources", async () => {
    const res = await SELF.fetch(
      "http://localhost/mcp",
      jsonRpcRequest("resources/list"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.resources.length).toBe(7);
  });
});
```

### Test 4: Error Handling
```typescript
describe("Error handling", () => {
  it("returns 401 without auth token", async () => {
    const res = await SELF.fetch("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns JSON-RPC error for invalid method", async () => {
    const res = await SELF.fetch(
      "http://localhost/mcp",
      jsonRpcRequest("nonexistent/method"),
    );
    expect(res.status).toBe(200); // JSON-RPC errors are still 200
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
```

## Implementation Steps

1. **Write all E2E tests first** (see TDD section)
2. **Configure `.dev.vars` with test token:**
   ```
   MCP_AUTH_TOKEN=test-token
   PANCAKE_API_KEY=test-key
   PANCAKE_SHOP_ID=test-shop
   ```
3. **Run tests** — `bun run test tests/e2e-mcp.test.ts`
4. **Fix any failing tests** (may need to adjust Worker init or transport config)
5. **Manual E2E with MCP Inspector:**
   ```bash
   wrangler dev &
   npx @modelcontextprotocol/inspector http://localhost:8787/mcp
   ```
6. **Verify all 23 tools and 7 resources appear in Inspector**

## Todo List
- [ ] Write MCP initialize handshake test
- [ ] Write tools/list test (assert 23 tools)
- [ ] Write resources/list test (assert 7 resources)
- [ ] Write auth error test
- [ ] Write invalid method error test
- [ ] Run all tests and fix failures
- [ ] Manual E2E with MCP Inspector

## Success Criteria
- All E2E tests pass in Workers runtime
- MCP Inspector shows 23 tools and 7 resources
- Auth enforcement works correctly
- Error responses follow JSON-RPC 2.0 format
- No real Pancake API calls during tests

## Security Considerations
- Tests use mock credentials only
- No real API keys in test fixtures
- Auth bypass not possible in test environment

## Next Steps
- Phase 5: Deploy & Documentation
