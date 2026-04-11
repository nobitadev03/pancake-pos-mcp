# Brainstorm Report: Cloudflare Workers Deployment
**Date:** 2026-04-10 | **Status:** Approved

## Problem Statement
Deploy Pancake POS MCP server (Bun + TypeScript, 23 tools, 7 resources) to Cloudflare Workers for edge deployment — global low-latency access, zero infrastructure management.

## Evaluated Approaches

### Approach 1: Cloudflare Agents SDK (Rejected)
- CF's proprietary `agents` package with Durable Objects
- **Pros:** Session state persistence, built-in CF tooling
- **Cons:** Vendor lock-in, completely different API from standard MCP SDK, requires rewriting server.ts + all tools
- **Verdict:** Overkill for stateless API proxy; adds complexity for no benefit

### Approach 2: Standard MCP SDK on Workers — Single Shared Transport (Rejected)
- One `WebStandardStreamableHTTPServerTransport` at module scope
- **Pros:** Simple, minimal code
- **Cons:** CRITICAL: SDK rejects 2nd client `initialize` → only 1 client can ever connect
- **Verdict:** Architectural flaw confirmed by SDK source code analysis

### Approach 3: Standard MCP SDK — Per-Request Transport (Approved)
- Create fresh McpServer + Transport per request in stateless mode
- **Pros:** Multi-client safe, no session state to manage, portable across serverless platforms
- **Cons:** Per-request server creation overhead (~5ms)
- **Verdict:** Correct pattern for serverless; SDK explicitly supports stateless mode

## Final Recommended Solution

**Per-request stateless MCP on Cloudflare Workers** with:
- Fresh `McpServer` + `WebStandardStreamableHTTPServerTransport` per request
- `enableJsonResponse: true` (JSON, not SSE)
- Shared `PancakeHttpClient` + config at module scope
- Timing-safe Bearer token auth
- CORS support for browser-based clients
- Configurable timeout/retry for Workers (8s/2 retries) vs Bun (30s/3 retries)

## Implementation Plan
5 phases, detailed at: `plans/260410-0838-cloudflare-workers-deployment/`

| Phase | Scope | Files Changed |
|-------|-------|--------------|
| 1. Setup | wrangler.toml, vitest, .dev.vars | 4 new, 3 modified |
| 2. Entry Point | src/worker.ts | 1 new |
| 3. HTTP Client | Configurable timeout/retry | 1 modified |
| 4. Tests | E2E MCP protocol tests | 4 new test files |
| 5. Deploy | wrangler deploy, docs | 2 modified |

**Zero changes** to 23 tool files, 7 resource files, src/index.ts (Bun entry).

## Success Metrics
- Worker deployed and accessible at `*.workers.dev/mcp`
- Multiple concurrent MCP clients can connect
- Health check returns 200
- All 23 tools and 7 resources accessible via MCP Inspector
- Claude Desktop connects via `mcp-remote` proxy
- Cold start < 100ms
- Total request time < 30s (Workers limit)

## Risks & Mitigations
- **Workers 30s limit:** 8s timeout × 2 retries = 20s max
- **Subrequest limit (50 free):** Upgrade to paid ($5/mo) for 10k
- **process.env at module scope:** Test with `wrangler dev`; fallback: `env` binding
