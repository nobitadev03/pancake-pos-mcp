---
status: pending
created: 2026-04-09
updated: 2026-04-09
blockedBy: []
blocks: []
---

# Pancake POS MCP Server — Implementation Plan

**Brainstorm:** `plans/reports/brainstorm-260409-pancake-pos-mcp-design.md`
**API Docs:** `docs/poscake-api-docs.md`
**OpenAPI Spec:** `docs/pancake-openapi-spec.json`

## Overview

Build MCP server wrapping Pancake POS REST API (137+ endpoints) using Bun + TypeScript + `@modelcontextprotocol/sdk`. Domain-grouped ~23 tools, 7 MCP Resources, stdio + Streamable HTTP transports.

## Critical Note: URL Pattern

Actual API uses `/shops/<SHOP_ID>/<resource>?api_key=<api_key>` (per `poscake-api-docs.md`), not `/api/v1/<resource>`. The HTTP client must inject shop_id into URL path.

**Base URL:** `https://pos.pages.fm/api/v1`
**Actual pattern:** `https://pos.pages.fm/api/v1/shops/{SHOP_ID}/{resource}?api_key={API_KEY}`

## Phases

| # | Phase | Tools | Priority | Status |
|---|-------|-------|----------|--------|
| 1 | [Foundation + Core POS](phase-01-foundation-and-core-pos.md) | 4 tools + infra | P0 | complete |
| 2 | [Supply Chain](phase-02-supply-chain.md) | 5 tools | P1 | complete |
| 3 | [Sales Extensions](phase-03-sales-extensions.md) | 4 tools | P1 | complete |
| 4 | [CRM + Multi-Channel](phase-04-crm-and-multichannel.md) | 5 tools | P2 | complete |
| 5 | [Operations + Polish](phase-05-operations-and-polish.md) | 5 tools + tests + docs | P2 | partial (tools done, tests + README pending) |

## Architecture

```
src/
├── index.ts                     # Entry point, transport setup
├── server.ts                    # MCP server, tool/resource registration
├── config.ts                    # Env config + Zod validation
├── api-client/
│   ├── pancake-http-client.ts   # Auth, rate limit, retry, shop_id injection
│   ├── request-builder.ts       # URL + query param construction
│   └── response-parser.ts       # Normalize responses + errors
├── tools/
│   ├── tool-registry.ts         # Auto-register all tools
│   └── *.ts                     # 23 tool files
├── resources/
│   ├── resource-registry.ts     # Auto-register all resources
│   └── reference-data.ts        # Static reference data
└── shared/
    ├── schemas.ts               # Shared Zod schemas (pagination, filters)
    ├── pagination-helpers.ts    # Pagination normalization
    └── error-handler.ts         # Unified error formatting
```

## Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol
- `zod` — Input validation
- No HTTP client library (Bun native fetch)

## Key Constraints

- Rate limit: 1000 req/min, 10000 req/hour
- Auth: `api_key` query parameter
- Pagination: `page_number` + `page_size` (offset-based, default 30)
- Response: `{ data, success, page_number, page_size, total_entries, total_pages }`
- English tool descriptions, Vietnamese data passthrough
