---
status: complete
created: 2026-04-10
updated: 2026-04-11
blockedBy: []
blocks: []
---

# Cloudflare Workers Deployment — Implementation Plan

**Brainstorm:** Discussed in session 2026-04-10
**Research:** `research/` directory
**Red-Team Review:** All critical issues addressed (see below)

## Overview

Deploy Pancake POS MCP server to Cloudflare Workers using standard `@modelcontextprotocol/sdk` with `WebStandardStreamableHTTPServerTransport`. Minimal adapter approach — keeps all business logic unchanged, only adds Workers entry point + config.

## Key Decisions

- **SDK:** Keep `@modelcontextprotocol/sdk` (NOT Cloudflare Agents SDK)
- **Transport:** `WebStandardStreamableHTTPServerTransport` — **stateless mode, per-request** (see C1 fix)
- **Auth:** Bearer token via Workers secrets, **timing-safe comparison** (see H2 fix)
- **Rate Limiter:** Configurable — enabled for Bun (default), disabled for Workers
- **Config:** Use `nodejs_compat` flag → `process.env` works unchanged on Workers
- **CORS:** Headers included on all `/mcp` responses (see H3 fix)
- **TDD:** Tests written before implementation in each phase

## Red-Team Fixes Applied

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| C1 | Critical | Single shared transport rejects 2nd client `initialize` | Per-request transport + server creation in `worker.ts` |
| C2 | Critical | 3×30s retry = 90s exceeds Workers 30s limit | Configurable timeout: 8s timeout, 2 retries for Workers |
| H2 | High | Bearer token `===` comparison leaks timing info | `crypto.subtle.timingSafeEqual()` |
| H3 | High | No CORS headers blocks browser MCP clients | OPTIONS preflight + CORS on all `/mcp` responses |
| M1 | Medium | Only POST routed to transport | All methods (GET/POST/DELETE) delegated to transport |
| L1 | Low | 429 not retried | Added 429 to retry conditions with backoff |

## Phases

| # | Phase | Priority | Status |
|---|-------|----------|--------|
| 1 | [Project Setup & Wrangler Config](phase-01-project-setup-and-wrangler-config.md) | P0 | COMPLETE |
| 2 | [Workers Entry Point](phase-02-workers-entry-point.md) | P0 | COMPLETE |
| 3 | [HTTP Client Adaptation](phase-03-http-client-adaptation.md) | P0 | COMPLETE |
| 4 | [Integration Tests & E2E](phase-04-integration-tests-and-e2e.md) | P1 | COMPLETE |
| 5 | [Deploy & Documentation](phase-05-deploy-and-documentation.md) | P1 | COMPLETE |

## Architecture

```
src/
├── index.ts                     # Local entry (Bun — unchanged)
├── worker.ts                    # NEW: CF Workers entry (per-request MCP lifecycle)
├── server.ts                    # MCP server factory (unchanged)
├── config.ts                    # Env config (unchanged — nodejs_compat)
├── api-client/
│   ├── pancake-http-client.ts   # Configurable timeout/retry/rate-limiter
│   ├── request-builder.ts       # Unchanged
│   └── response-parser.ts       # Unchanged
├── tools/*                      # 23 tools (unchanged)
├── resources/*                  # 7 resources (unchanged)
└── shared/*                     # Schemas, errors (unchanged)

New files:
├── wrangler.toml                # Workers config
├── .dev.vars                    # Local secrets for wrangler dev
└── tests/
    ├── setup.test.ts            # Workers environment validation
    ├── worker.test.ts           # Fetch handler + CORS + auth + multi-client
    ├── http-client.test.ts      # Configurable timeout + 429 retry
    └── e2e-mcp.test.ts          # MCP protocol E2E
```

## Request Flow (Workers)

```
Client Request
    ↓
Worker fetch()
    ↓
CORS preflight? → 204 + headers
    ↓
/health? → 200 JSON
    ↓
/mcp? → Bearer auth check (timing-safe)
    ↓
Create fresh McpServer + Transport (per-request)
    ↓
transport.handleRequest(req) → Response
    ↓
Add CORS headers → Return to client
```

## Dependencies

- `@modelcontextprotocol/sdk` ^1.29.0 (keep)
- `zod` ^4.3.6 (keep)
- `wrangler` (devDependency, NEW)
- `vitest` (devDependency, NEW — for TDD)
- `@cloudflare/vitest-pool-workers` (devDependency, NEW — Workers test runtime)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Workers 30s wall-clock limit | Low | High | 8s timeout × 2 retries = 20s max (C2 fix) |
| Per-request server creation perf | Low | Medium | McpServer is lightweight (~5ms); warm start reuses module |
| Subrequest limit (50 free) | Medium | Medium | Upgrade to paid Workers ($5/mo) for 10k limit |
| MCP SDK future breaking change | Low | Medium | Pin SDK version; test before upgrading |
| `process.env` not populated at module scope | Low | Medium | Test with `wrangler dev`; fallback: use `env` binding |

## Constraints

- Zero changes to 23 tool files
- Zero changes to 7 resource files
- `src/index.ts` (local entry) unchanged — Bun development continues working
- `PancakeHttpClient` public API unchanged (only constructor gains optional param)
- All existing `bun run typecheck` must pass
