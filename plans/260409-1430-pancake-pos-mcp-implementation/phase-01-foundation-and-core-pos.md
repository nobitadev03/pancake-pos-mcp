# Phase 1: Foundation + Core POS

**Priority:** P0 — Must complete first
**Status:** complete
**Estimated effort:** Large
**Depends on:** Nothing

## Context Links

- [Brainstorm Report](../reports/brainstorm-260409-pancake-pos-mcp-design.md)
- [Pancake API Docs](../../docs/poscake-api-docs.md) — Real endpoint formats, request/response examples
- [API Taxonomy](../../docs/pancake-api-complete-taxonomy.md) — Complete endpoint list
- [OpenAPI Spec](../../docs/pancake-openapi-spec.json) — Machine-readable spec

## Overview

Set up the Bun project, MCP SDK integration, HTTP client layer, and the 4 most critical tools (orders, products, customers, inventory). Also set up MCP Resources for reference data and both transports (stdio + Streamable HTTP).

## Key Insights

1. **URL pattern discrepancy**: OpenAPI spec says `/api/v1/orders` but actual docs show `/shops/<SHOP_ID>/orders?api_key=<api_key>`. HTTP client must handle `shop_id` path injection.
2. **Auth is query-param based**, not header. Must strip api_key from logs.
3. **Pagination** uses `page_number`/`page_size` with total metadata in response.
4. **Order statuses** have 16+ values (0-20) — expose as MCP Resource.
5. **Products have variations** — nested resource pattern `/products/{id}/variations`.

## Requirements

### Functional
- Initialize Bun project with TypeScript + MCP SDK
- HTTP client with auth injection, rate limiting (token bucket), exponential backoff retry
- 4 MCP tools: manage_orders, manage_products, manage_customers, manage_inventory
- 7 MCP Resources for reference data
- stdio transport for Claude Desktop
- Streamable HTTP transport for remote access

### Non-Functional
- Response time < 2s for standard queries
- No api_key in log output
- Graceful error handling with English error messages

## Architecture

### HTTP Client (`src/api-client/pancake-http-client.ts`)

```
PancakeHttpClient
├── constructor(config: PancakeConfig)
├── get<T>(path: string, params?: Record<string, any>): Promise<PancakeResponse<T>>
├── post<T>(path: string, body: any): Promise<PancakeResponse<T>>
├── put<T>(path: string, body: any): Promise<PancakeResponse<T>>
├── delete(path: string): Promise<PancakeResponse<void>>
│
├── (private) buildUrl(path: string, params?): URL
│   └── Injects /shops/{SHOP_ID}/ prefix + api_key param
├── (private) executeWithRetry(request): Promise<Response>
│   └── Exponential backoff on 5xx, max 3 retries
└── (private) checkRateLimit(): void
    └── Token bucket: 1000 tokens/min, refill every 60ms
```

### Tool Pattern (each tool file)

```typescript
// Each tool exports: name, description, schema, handler
export const toolName = "manage_orders";
export const toolDescription = "Manage orders in Pancake POS. Actions: list, get, create, update, delete, print, ship, call_later.";
export const toolSchema = z.discriminatedUnion("action", [...]);
export async function handler(args, client): Promise<ToolResult> { ... }
```

## Related Code Files

### Files to Create
- `package.json` — Bun project config
- `tsconfig.json` — TypeScript config
- `.env.example` — Environment template
- `src/index.ts` — Entry point (stdio + Streamable HTTP)
- `src/server.ts` — MCP server setup + registration
- `src/config.ts` — Env config validation with Zod
- `src/api-client/pancake-http-client.ts` — HTTP client
- `src/api-client/request-builder.ts` — URL builder
- `src/api-client/response-parser.ts` — Response normalizer
- `src/tools/tool-registry.ts` — Tool auto-registration
- `src/tools/orders-tool.ts` — manage_orders tool
- `src/tools/products-tool.ts` — manage_products tool
- `src/tools/customers-tool.ts` — manage_customers tool
- `src/tools/inventory-tool.ts` — manage_inventory tool
- `src/resources/resource-registry.ts` — Resource auto-registration
- `src/resources/reference-data.ts` — Static reference data
- `src/shared/schemas.ts` — Shared Zod schemas
- `src/shared/pagination-helpers.ts` — Pagination utils
- `src/shared/error-handler.ts` — Error formatting

## Implementation Steps

### Step 1: Project Scaffolding
1. `bun init` in project root
2. Install deps: `@modelcontextprotocol/sdk`, `zod`
3. Configure `tsconfig.json` (strict mode, ESM)
4. Create `.env.example` with `PANCAKE_API_KEY`, `PANCAKE_SHOP_ID`, `PANCAKE_BASE_URL`
5. Create `src/config.ts` — Zod schema for env validation

### Step 2: HTTP Client
1. Create `src/api-client/pancake-http-client.ts`
   - Constructor takes config (baseUrl, apiKey, shopId)
   - `buildUrl()` — Prepends `/shops/{SHOP_ID}/` to path, appends `?api_key=`
   - Token bucket rate limiter (1000/min capacity)
   - Retry with exponential backoff (3 attempts, 1s/2s/4s delays)
   - Response type: `{ data, success, page_number?, page_size?, total_entries?, total_pages? }`
2. Create `src/api-client/request-builder.ts`
   - Build query strings from filter objects
   - Handle array params (e.g., `filter_status=[0,1]`)
3. Create `src/api-client/response-parser.ts`
   - Parse Pancake response, extract pagination metadata
   - Normalize errors to `{ error: true, code, message }`

### Step 3: MCP Server + Transports
1. Create `src/server.ts`
   - Instantiate `McpServer` with name "pancake-pos" and version
   - Register tools and resources via registries
2. Create `src/index.ts`
   - Parse CLI args to select transport
   - `--stdio` (default): Use `StdioServerTransport`
   - `--http`: Use Streamable HTTP transport with `StreamableHTTPServerTransport`
   - Start server with selected transport

### Step 4: Shared Schemas
1. Create `src/shared/schemas.ts`
   - `PaginationParams` schema (page_number, page_size)
   - `DateRangeParams` schema (startDateTime, endDateTime as unix timestamps)
   - `PancakeListResponse<T>` type
2. Create `src/shared/pagination-helpers.ts`
   - `formatPaginationResponse()` — Normalize pagination metadata
3. Create `src/shared/error-handler.ts`
   - `formatToolError()` — Convert Pancake errors to MCP tool errors

### Step 5: manage_orders Tool
1. Create `src/tools/orders-tool.ts`
2. Zod schema — Discriminated union on `action`:
   - `list`: page_number?, page_size?, search?, filter_status?, startDateTime?, endDateTime?, option_sort?
   - `get`: order_id (required)
   - `create`: bill_full_name, bill_phone_number, items[], warehouse_id, shipping_address, etc.
   - `update`: order_id, fields to update
   - `delete`: order_id
   - `print`: order_id, template?
   - `ship`: order_id, partner_id, customer_pay_fee?, note_print?, service_type_id?
   - `call_later`: order_ids[], needs_call_at, phone_number, notice_created, need_notify_users[]
3. Handler dispatches to correct HTTP client method based on action
4. Test with real API credentials

### Step 6: manage_products Tool
1. Create `src/tools/products-tool.ts`
2. Actions: list, get, create, update, delete, list_variations, create_variation, import, export
3. Special handling:
   - `import` uses multipart/form-data (file upload)
   - `export` returns file content
   - `list_variations` uses nested path `/products/{id}/variations`

### Step 7: manage_customers Tool
1. Create `src/tools/customers-tool.ts`
2. Actions: list, get, create, update, delete, reward_points, reward_history, add_note, list_notes
3. Special handling:
   - `reward_points` / `reward_history` use nested path `/customers/{id}/reward-points`
   - `add_note` / `list_notes` use nested path `/customers/{id}/notes`
   - Customer notes support image attachments

### Step 8: manage_inventory Tool
1. Create `src/tools/inventory-tool.ts`
2. Actions: report
3. Params: warehouse_ids?, category_ids?, supplier_ids?, min_quantity?, max_quantity?
4. Returns: summary + detailed breakdown by product/variation/warehouse

### Step 9: MCP Resources
1. Create `src/resources/reference-data.ts`
2. Static resources (hardcoded from API docs):
   - `pancake://reference/order-statuses` — 16 status codes + Vietnamese names
   - `pancake://reference/order-sources` — 10 source codes (-1 to -10)
   - `pancake://reference/sort-options` — 22 sort options
   - `pancake://reference/webhook-events` — 6 event types
   - `pancake://reference/error-codes` — HTTP error codes + format
   - `pancake://reference/rate-limits` — 1000/min, 10000/hour
3. Dynamic resource (fetched from API):
   - `pancake://reference/shipping-partners` — Cached from GET /partners

### Step 10: Tool + Resource Registry
1. Create `src/tools/tool-registry.ts` — Imports all tools, registers with server
2. Create `src/resources/resource-registry.ts` — Imports all resources, registers with server

### Step 11: Compile + Smoke Test
1. `bun run src/index.ts --stdio` — Verify stdio transport starts
2. `bun run src/index.ts --http` — Verify HTTP transport starts
3. Test each tool action with real API credentials
4. Verify MCP resources are readable

## Todo List

- [ ] Initialize Bun project + install deps
- [ ] Create config.ts with env validation
- [ ] Build PancakeHttpClient (auth, rate limit, retry)
- [ ] Build request-builder.ts + response-parser.ts
- [ ] Create MCP server + transport setup (stdio + Streamable HTTP)
- [ ] Create shared schemas + helpers
- [ ] Implement manage_orders tool (8 actions)
- [ ] Implement manage_products tool (9 actions)
- [ ] Implement manage_customers tool (9 actions)
- [ ] Implement manage_inventory tool (1 action)
- [ ] Implement 7 MCP Resources
- [ ] Register all tools + resources
- [ ] Compile check (bun build)
- [ ] Smoke test with real API credentials

## Success Criteria

- `bun run src/index.ts --stdio` starts without error
- `bun run src/index.ts --http` starts on port 3000
- All 4 tools appear in MCP tool listing
- All 7 resources readable via MCP protocol
- `manage_orders list` returns real orders from Pancake API
- `manage_products list` returns real products
- `manage_customers list` returns real customers
- Rate limiter prevents >1000 requests/min
- Errors return structured `{ error, code, message }` format

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| URL pattern mismatch (OpenAPI vs actual) | High | Use actual docs pattern `/shops/{id}/...`, test immediately |
| Some API responses undocumented | Medium | Test each endpoint, document actual response |
| Multipart upload for product import | Low | Implement last, lower priority action |
| Streamable HTTP transport setup | Medium | Follow MCP SDK examples closely |

## Security Considerations

- Never log api_key in URL or headers
- Validate all tool inputs with Zod before API calls
- Rate limit protects against accidental API abuse
- Single-shop instance limits blast radius
