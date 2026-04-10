# Code Review: Phases 2–5 Tool Files
**Date:** 2026-04-10
**Scope:** 19 new tool files + 3 modified infrastructure files (phases 2–5)
**TypeScript:** Clean — `tsc --noEmit` passes with zero errors
**Score: 7.5 / 10**

---

## Scope

| Category | Files |
|---|---|
| Supply chain | warehouses, suppliers, purchases, transfers, stocktaking |
| Sales extensions | returns, combos, promotions, vouchers |
| CRM + multi-channel | crm-contacts, crm-deals, crm-activities, ecommerce, livestream |
| Operations | employees, webhooks, statistics, shop-info, address-lookup |
| Infrastructure | tool-registry.ts, pancake-http-client.ts, request-builder.ts |

---

## Critical Issues (must fix)

### 1. Path traversal via unvalidated IDs in URL path segments

**Affected files:** `address-lookup-tool.ts` (most severe), and all tools using plain `z.string()` IDs directly in template-literal paths.

The `URL` constructor normalizes `../` sequences before building the final request URL. An LLM or downstream caller can pass a malicious ID to escape the intended URL path:

```
province_id = "../../../admin/config"
→ buildRequestUrl produces: /address/districts/../../../admin/config
→ URL constructor normalizes to: /admin/config?api_key=***
```

Verified via Node test:
```
fullPath: /address/districts/../../../admin/config
final URL: https://pos.pancake.vn/admin/config?api_key=***
```

The same class of issue applies to any tool with a plain `z.string()` ID that is interpolated into a URL path — `transfer_id`, `purchase_id`, `stocktaking_id`, `return_id`, `combo_id`, `promotion_id`, `voucher_id`, `contact_id`, `deal_id`, `activity_id`, `livestream_id`, `employee_id`, `webhook_id`, `supplier_id`.

The `warehouses-tool.ts` is safe because it uses `z.string().uuid()`, which structurally prevents `../` payloads.

**Severity:** High for address-lookup (path escapes shop scope entirely). Medium for shop-scoped tools (attacker remains within `/shops/{id}/` namespace, but can traverse to sibling paths like `shop`, `orders`, etc.).

**Fix:** Apply `encodeURIComponent()` when building path segments, or add a format constraint (`z.string().regex(/^[\w-]+$/)`) to all ID fields. The `buildRequestUrl` function in `request-builder.ts` is the right central fix point:

```ts
// In buildRequestUrl, when appending path:
const safePath = path.split("/").map(encodeURIComponent).join("/");
// Or strip ../  before URL construction:
if (path.includes("..")) throw new Error("Invalid path segment");
```

---

### 2. `getRaw` silently swallows HTTP errors

**File:** `pancake-http-client.ts` (getRaw method), consumed by `address-lookup-tool.ts`

`getRaw` does not call `parseResponse` and has no `response.ok` check. A 401, 403, or 404 from the address API is returned as raw JSON and passed through to the caller as `{ data: <error-object> }` — indistinguishable from success. The error is not caught by `formatToolError` because no exception is thrown.

```ts
async getRaw<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = buildRequestUrl(...);
  const response = await this.executeWithRetry(url, { method: "GET" });
  const json = await response.json() as T;  // no response.ok check
  return json;
}
```

**Fix:** Add a `response.ok` guard before `response.json()`, or reuse `parseResponse` with a generic return type.

---

## Warnings (should fix)

### 3. Webhook SSRF: `z.string().url()` does not restrict to safe schemes or external hosts

**File:** `webhooks-tool.ts`

Zod's `.url()` validator accepts `http://localhost/`, `http://169.254.169.254/` (AWS metadata), `file://`, etc. The webhook URL is registered with the Pancake server, which will then make outbound HTTP calls — creating a potential SSRF vector against the Pancake backend's network.

This is a trust-boundary issue: the MCP tool accepts a URL from an LLM and forwards it to a third-party service that will make requests to that URL.

**Fix:** At minimum document the constraint. If controllable, add `.refine()` to reject private IP ranges and non-https schemes.

---

### 4. `promotions-tool.ts` UpdateAction missing `applicable_product_ids`

**File:** `promotions-tool.ts`

`CreateAction` has `applicable_product_ids: z.array(z.string()).optional()` but `UpdateAction` omits it. This means promotions' product applicability cannot be changed after creation via this tool, even though the underlying API likely supports it.

---

### 5. Inconsistent ID type constraints across tools

`warehouses-tool.ts` uses `z.string().uuid()` for `warehouse_id` (correct — Pancake warehouse IDs are UUIDs). But other tools using UUID-format IDs (`product_ids`, `variation_id` in nested objects, `contact_id`, `deal_id`, etc.) use plain `z.string()`. This is an inconsistency that also widens the path-traversal surface noted in issue #1.

Specifically, the `tool-registry.ts` flat schema for warehouses does NOT include `.uuid()` — it uses plain `z.string().optional()` — which means the discriminated-union UUID validation is bypassed in the registry path when calling `warehousesToolSchema.parse(args)`. The uuid constraint is re-applied during `parse()` but the inconsistency is a code smell.

---

### 6. `shop-info-tool.ts` uses `POST /shop/update` instead of `PUT /shop`

Minor but noteworthy: the update action calls `client.post("shop/update", body)` while every other update in the codebase uses `client.put(...)`. This is likely correct per the Pancake API (which may not expose a `PUT /shops/{id}` endpoint), but it breaks the convention established by all other 18 tools and silently differs.

---

### 7. No cross-field validation: discount percent > 100%, negative discount values

**Files:** `promotions-tool.ts`, `vouchers-tool.ts`, `combos-tool.ts`

`discount_value` accepts any `z.number()` — including negative numbers and percent values over 100. For `discount_type: "percent"`, a value of 150 or -5 would pass schema validation and be forwarded to the API. The API may accept or silently truncate these values depending on its own validation.

---

### 8. `ecommerce-tool.ts` SyncAction: `shop_channel_id` is untyped string with no constraint

**File:** `ecommerce-tool.ts`

`shop_channel_id` is an opaque `z.string().optional()`. No guidance in the description on format. The schema note says "Specific channel shop ID to sync" but since this goes into a POST body (not a path), the path-traversal risk does not apply — but the lack of constraints leaves the field wide open.

---

## Low Priority / Informational

### 9. `returns-tool.ts`: no schema enforcement that `exchange_items` is required when `is_exchange: true`

When `is_exchange: true`, `exchange_items` is semantically required but schema marks it optional. Zod supports `.superRefine()` for this cross-field check. Without it, an LLM can submit `is_exchange: true` with no exchange items and the request reaches the API, which will error at the server level.

### 10. `statistics-tool.ts` single-action discriminated union is redundant overhead

`z.discriminatedUnion("action", [GetStatisticsAction])` with only one variant is unnecessary — a plain `z.object({...})` is simpler and more readable for a single-action tool. No functional impact.

### 11. `address-lookup-tool.ts` uses `unknown[]` as return type for `getRaw<unknown[]>`

The generic parameter `unknown[]` is not validated — if the Pancake API returns a non-array (e.g. `null` on 404), the caller receives `{ data: null }` with no error. Acceptable given this is a reference data endpoint, but worth noting.

### 12. `tool-registry.ts` flat schemas lose discriminated-union strictness at registration time

The tool registry explicitly documents this design tradeoff: flat schema exposed to MCP SDK, then re-validated via discriminated union in the handler. The risk is that MCP will accept calls with contradictory parameters (e.g. both `warehouse_id` and `name` without `action`) and the Zod parse will fail at runtime with a generic validation error rather than a clear "missing required field" message. Acceptable design for MCP compatibility, but the error messages from parse failures could be improved.

---

## Positive Observations

- Uniform pattern across all 19 tools: discriminated union schema + flat registry schema + try/catch with formatToolError. Zero deviation.
- `redactUrl()` properly strips `api_key` from all logged URLs — no credential leakage in logs.
- `executeWithRetry` uses `AbortSignal.timeout(30_000)` on every fetch — no hanging requests.
- Token bucket rate limiter correctly uses a `while` re-check loop after `await sleep()`, avoiding over-issuance in single-threaded JS.
- `formatToolError` catches `PancakeApiError` separately from generic `Error` — clean error surfacing to MCP clients.
- `warehouses-tool.ts` correctly applies `.uuid()` constraint on its ID field.
- `webhooks-tool.ts` correctly applies `.url()` constraint on the target URL field.
- `parseResponse` / `parsePaginatedResponse` check both `response.ok` and `json.success === false` — two-layer error detection.
- Phase 1 pattern is consistently extended across 14 new tools — no drift in conventions.

---

## Recommended Actions (priority order)

1. **[Critical]** Add `encodeURIComponent` to path segment interpolation in `buildRequestUrl`, or add a `contains("..")` guard before URL construction. This is a one-line fix in `request-builder.ts` that eliminates path traversal across all tools.
2. **[Critical]** Add `response.ok` check to `getRaw` in `pancake-http-client.ts` to surface HTTP errors from address endpoints.
3. **[High]** Add `applicable_product_ids` to `promotions-tool.ts` `UpdateAction`.
4. **[Medium]** Add `.min(0).max(100)` refinement for `discount_value` when `discount_type === "percent"` in promotions/vouchers.
5. **[Medium]** Add `.superRefine()` to `returns-tool.ts` `CreateAction` to require `exchange_items` when `is_exchange === true`.
6. **[Low]** Document SSRF limitation on `webhooks-tool.ts` URL field.

---

## Unresolved Questions

- Are `crm/contacts`, `crm/deals`, `crm/activities`, `ecommerce/sync`, `ecommerce/products`, `livestream`, and `statistics/{type}` actual Pancake API paths? These are plausible but unverified against official Pancake API docs. If any are wrong, those tools will silently 404 at runtime.
- Does the Pancake API actually expose `POST /shops/{id}/shop/update` for shop info, or should this be `PUT /shops/{id}`?
- What is the actual format of `transfer_id`, `purchase_id`, `stocktaking_id`, `return_id` — are they UUIDs or numeric IDs? This determines whether `z.string().uuid()` or `z.number().int()` is more appropriate.
