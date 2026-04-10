---
name: Pancake POS MCP — recurring patterns and known issues
description: Architecture conventions, validated patterns, and known bugs found during review of phases 1–5
type: project
---

## Tool pattern (all 23 tools)
- discriminatedUnion schema (strict) + flat schema in tool-registry (MCP-compat) + try/catch with formatToolError
- handler receives `z.infer<typeof xyzToolSchema>` — fully typed, no runtime unknowns after parse
- `client.getList(path, params)` for paginated list, `client.get/post/put/delete` for single-item ops
- `formatPaginatedResult()` wraps all list responses

## Known bugs found in phases 2–5 review (2026-04-10)

### Path traversal (Critical)
- `buildRequestUrl` in `request-builder.ts` does NOT encode path segments
- `new URL(path, base)` normalizes `../` — attacker can escape intended path
- `address-lookup-tool.ts` most severe: can escape shop scope entirely
- All tools with plain `z.string()` IDs (no uuid()) are affected
- Fix: `encodeURIComponent` in `buildRequestUrl` or pattern-check in IDs
- `warehouses-tool.ts` is safe — uses `z.string().uuid()`

### getRaw missing error check (Critical)
- `PancakeHttpClient.getRaw()` skips `response.ok` check unlike `get()`/`getList()`
- HTTP errors silently returned as data — no PancakeApiError thrown
- Only `address-lookup-tool.ts` uses getRaw

## Inconsistencies to watch
- `shop-info-tool.ts` uses `client.post("shop/update")` not `client.put(...)` — unique pattern
- `promotions-tool.ts` UpdateAction missing `applicable_product_ids` (present in CreateAction)
- Discount value has no bounds (`z.number()` accepts negative or >100%)

## URL routing
- globalPrefixes in request-builder: `["partners", "/partners", "address", "/address"]`
- Everything else routes to `/shops/{shopId}/{path}`
- crm/*, ecommerce/*, livestream, statistics/* all go through shop scope
