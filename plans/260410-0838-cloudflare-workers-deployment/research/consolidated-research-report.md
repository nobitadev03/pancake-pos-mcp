# Research: Cloudflare Workers MCP Deployment

**Date:** 2026-04-10 | **Researchers:** 3 parallel agents

## Researcher 1: MCP SDK on Workers

### Key Findings
- `WebStandardStreamableHTTPServerTransport` uses Web Standard APIs only — works identically on Workers, Bun, Deno
- Import: `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js`
- `transport.handleRequest(req: Request): Promise<Response>` — perfect for Workers `fetch()`
- Session management is stateless — `sessionIdGenerator` called per new session, no persistent state
- MCP protocol is request-response — no cross-invocation state needed
- Workers CPU timeout: 30s standard, 300s Durable Objects — single API calls always finish within 30s
- Subrequest limits: 50 (free), 10,000 (paid) per invocation
- `crypto.randomUUID()` natively available on Workers

### Recommended Pattern
```typescript
export default {
  async fetch(req: Request): Promise<Response> {
    return transport.handleRequest(req);
  },
};
```

## Researcher 2: Testing Strategy

### Key Findings
- `@cloudflare/vitest-pool-workers` runs tests in actual Workers runtime (Miniflare)
- `SELF` helper sends requests to Worker without network — fast, deterministic
- Can mock outbound `fetch()` via Vitest `vi.fn()`
- MCP Inspector (`npx @modelcontextprotocol/inspector`) for manual E2E
- `wrangler dev` supports TypeScript natively via esbuild

### Recommended Test Structure
```
tests/
├── setup.test.ts          # Workers environment validation
├── worker.test.ts         # Fetch handler (health, auth, routing)
├── http-client.test.ts    # HTTP client (no rate limiter, retry logic)
└── e2e-mcp.test.ts        # MCP protocol (initialize, tools/list, tool calls)
```

## Researcher 3: Environment & Secrets

### Key Findings
- `nodejs_compat` flag + `compatibility_date >= 2025-04-01` → `process.env` auto-populated from vars/secrets
- **Existing `config.ts` works unchanged on Workers** — zero refactoring
- Secrets via `wrangler secret put KEY` — encrypted at rest, never visible after creation
- Vars (non-sensitive) in `wrangler.toml` `[vars]` section
- `.dev.vars` replaces `.env` for local `wrangler dev` — same dotenv syntax
- `.dev.vars` must be gitignored

### Dual-Runtime Strategy
No duplication needed. Same `loadConfig()` function works both runtimes:
- Bun/Node: `process.env` populated from `.env`
- Workers: `process.env` populated from secrets/vars via `nodejs_compat`
