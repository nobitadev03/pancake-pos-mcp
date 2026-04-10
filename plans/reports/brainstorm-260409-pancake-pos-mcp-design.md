# Brainstorm: Pancake POS MCP Server Design

**Date:** 2026-04-09
**Status:** AGREED
**Participants:** Plateau + Claude

---

## Problem Statement

Build an MCP server wrapping Pancake POS REST API (137+ endpoints, 27 feature groups) to enable:
1. AI assistants (Claude/GPT) to manage POS operations via natural language
2. Automation platforms (n8n, Zapier, custom apps) to integrate via MCP protocol

### Constraints
- Single shop per instance (api_key + shop_id)
- Base URL: `https://pos.pages.fm/api/v1`
- Auth: `api_key` as query parameter
- Rate limit: 1000 req/min, 10000 req/hour
- Vietnamese data passthrough, English tool descriptions

---

## Agreed Solution

### Tech Stack
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | **Bun** | Fast startup, native TS, good DX |
| MCP SDK | **@modelcontextprotocol/sdk** | Official, supports stdio + Streamable HTTP |
| Transport | **stdio + Streamable HTTP** | Local dev (Claude Desktop) + remote (automation) |
| HTTP client | **Built-in fetch** (Bun native) | Zero dependencies, sufficient for REST |
| Validation | **Zod** | Schema validation for tool inputs |
| Config | **Environment variables** | `PANCAKE_API_KEY`, `PANCAKE_SHOP_ID`, `PANCAKE_BASE_URL` |

### Tool Design: Domain-Grouped (~25 tools)

Each tool maps to a business domain with an `action` discriminator.

#### Core POS (4 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_orders` | list, get, create, update, delete, print, ship, call_later | 8 |
| `manage_products` | list, get, create, update, delete, list_variations, create_variation, import, export | 9 |
| `manage_customers` | list, get, create, update, delete, reward_points, reward_history, add_note, list_notes | 9 |
| `manage_inventory` | report, list_by_warehouse | 2 |

#### Supply Chain (5 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_warehouses` | list, get, create, update, delete | 5 |
| `manage_suppliers` | list, get, create, update, delete | 5 |
| `manage_purchases` | list, get, create, update, delete | 5 |
| `manage_transfers` | list, get, create, update, delete | 5 |
| `manage_stocktaking` | list, get, create, update, delete | 5 |

#### Sales Extensions (4 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_returns` | list, get, create, update, delete | 5 |
| `manage_combos` | list, get, create, update, delete | 5 |
| `manage_promotions` | list, get, create, update, delete | 5 |
| `manage_vouchers` | list, get, create, update, delete | 5 |

#### CRM (3 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_crm_contacts` | list, get, create, update, delete | 5 |
| `manage_crm_deals` | list, get, create, update, delete | 5 |
| `manage_crm_activities` | list, get, create, update, delete | 5 |

#### Multi-Channel (2 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_ecommerce` | sync, list_products | 2 |
| `manage_livestream` | list, get, create, update, delete | 5 |

#### Operations (5 tools)
| Tool | Actions | Endpoints |
|------|---------|-----------|
| `manage_employees` | list, get, create, update, delete | 5 |
| `manage_webhooks` | list, get, create, update, delete | 5 |
| `get_statistics` | sales, orders, inventory | 3 |
| `get_shop_info` | (single action) | 1 |
| `lookup_address` | provinces, districts, communes | 3 |

**Total: ~23 tools covering 137+ endpoints**

### MCP Resources (Reference Data)

Static/semi-static data exposed as resources for LLM context:

| Resource URI | Description |
|-------------|-------------|
| `pancake://reference/order-statuses` | All order status codes + Vietnamese names |
| `pancake://reference/order-sources` | Source codes (-1=Facebook, -3=Shopee, etc.) |
| `pancake://reference/sort-options` | Available sorting parameters |
| `pancake://reference/shipping-partners` | Partner IDs + names (cached from API) |
| `pancake://reference/webhook-events` | Event types + payload schemas |
| `pancake://reference/error-codes` | HTTP codes + Pancake error format |
| `pancake://reference/rate-limits` | Rate limit info |

Resources are loaded once at startup and refreshed on demand.

### Architecture

```
pancake-pos-mcp/
├── src/
│   ├── index.ts                          # Entry point, transport setup
│   ├── server.ts                         # MCP server instance + tool/resource registration
│   ├── config.ts                         # Environment config + validation
│   ├── api-client/
│   │   ├── pancake-http-client.ts        # HTTP client wrapper (auth, rate limit, retry)
│   │   ├── request-builder.ts            # URL + query param builder
│   │   └── response-parser.ts            # Response normalization + error handling
│   ├── tools/
│   │   ├── tool-registry.ts              # Auto-registers all tools
│   │   ├── orders-tool.ts                # manage_orders implementation
│   │   ├── products-tool.ts              # manage_products implementation
│   │   ├── customers-tool.ts             # manage_customers implementation
│   │   ├── inventory-tool.ts             # manage_inventory implementation
│   │   ├── warehouses-tool.ts            # manage_warehouses implementation
│   │   ├── suppliers-tool.ts             # manage_suppliers implementation
│   │   ├── purchases-tool.ts             # manage_purchases implementation
│   │   ├── transfers-tool.ts             # manage_transfers implementation
│   │   ├── stocktaking-tool.ts           # manage_stocktaking implementation
│   │   ├── returns-tool.ts               # manage_returns implementation
│   │   ├── combos-tool.ts               # manage_combos implementation
│   │   ├── promotions-tool.ts            # manage_promotions implementation
│   │   ├── vouchers-tool.ts              # manage_vouchers implementation
│   │   ├── crm-contacts-tool.ts          # manage_crm_contacts implementation
│   │   ├── crm-deals-tool.ts             # manage_crm_deals implementation
│   │   ├── crm-activities-tool.ts        # manage_crm_activities implementation
│   │   ├── ecommerce-tool.ts             # manage_ecommerce implementation
│   │   ├── livestream-tool.ts            # manage_livestream implementation
│   │   ├── employees-tool.ts             # manage_employees implementation
│   │   ├── webhooks-tool.ts              # manage_webhooks implementation
│   │   ├── statistics-tool.ts            # get_statistics implementation
│   │   ├── shop-info-tool.ts             # get_shop_info implementation
│   │   └── address-lookup-tool.ts        # lookup_address implementation
│   ├── resources/
│   │   ├── resource-registry.ts          # Auto-registers all resources
│   │   └── reference-data-resources.ts   # Static reference data
│   └── shared/
│       ├── schemas.ts                    # Shared Zod schemas
│       ├── pagination-helpers.ts         # Pagination normalization
│       └── error-handler.ts              # Unified error formatting
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── tests/
    └── ...
```

### Key Design Decisions

#### 1. HTTP Client Layer
- Single `PancakeHttpClient` handles auth injection (`?api_key=X`), rate limiting (token bucket), retry (exponential backoff on 5xx), and response normalization
- All tools call client methods, never raw `fetch`
- Client auto-injects `shop_id` into URL path

#### 2. Tool Pattern
Each tool file exports:
- Zod schema for input validation (discriminated union on `action`)
- Tool description (English, concise, lists available actions)
- Handler function that dispatches to correct API call based on action

Example tool description format:
```
Manage orders in Pancake POS. Actions: list (with filters/pagination), 
get (by ID), create, update, delete, print (generate PDF), ship (send 
to delivery partner), call_later (schedule callback).
```

#### 3. Pagination Strategy
- Tools return `{ data, pagination: { page, pageSize, total, totalPages } }`
- LLMs can request specific pages via `page` and `page_size` params
- Default page_size: 30 (matches Pancake API default)

#### 4. Response Format
- Return raw Pancake data (Vietnamese) with English metadata wrapper
- Truncate large lists to configurable max (default 50 items) with `hasMore` flag
- Errors: `{ error: true, code: "...", message: "...", details: {...} }`

#### 5. Transport Setup
- stdio: Default for Claude Desktop / Claude Code integration
- Streamable HTTP: For remote access (n8n, custom apps)
- Both transports share same server instance

---

## Evaluated Alternatives

### Alt 1: Fine-grained tools (80+)
- **Rejected**: Too many tools causes LLM confusion. Research shows >40-50 tools degrades tool selection accuracy.

### Alt 2: Single mega-tool with resource+action
- **Rejected**: One tool handling all 137 endpoints = massive schema, poor discoverability, harder to debug.

### Alt 3: Python + FastMCP
- **Rejected**: User prefers TypeScript. Bun provides sufficient performance.

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Pancake API undocumented behaviors | Medium | Test each endpoint with real credentials. Document actual vs expected responses. |
| Rate limiting (1000/min) | Low | Token bucket in HTTP client. Queue requests if near limit. |
| Large response payloads | Medium | Truncate lists, expose pagination params. |
| Auth token in query param (security) | Low | Single-shop instance. Don't log URLs with api_key. |
| Missing API responses in docs | Medium | Test endpoints via n8n/Postman first, fill in response examples. |

---

## Success Metrics
1. All 23 tools registered and functional
2. Every Pancake API endpoint reachable through MCP
3. LLMs can complete common workflows: create order, check inventory, look up customer
4. Both stdio and Streamable HTTP transports working
5. Error handling covers all Pancake API error codes
6. Response times < 2s for standard queries

---

## Implementation Phases

### Phase 1: Foundation + Core POS (Week 1)
- Project scaffolding (Bun, TypeScript, MCP SDK)
- HTTP client with auth, rate limiting, retry
- 4 core tools: orders, products, customers, inventory
- MCP resources for reference data
- stdio + Streamable HTTP transport

### Phase 2: Supply Chain (Week 2)
- 5 tools: warehouses, suppliers, purchases, transfers, stocktaking

### Phase 3: Sales Extensions (Week 3)
- 4 tools: returns, combos, promotions, vouchers

### Phase 4: CRM + Multi-Channel (Week 4)
- 5 tools: CRM contacts/deals/activities, ecommerce, livestream

### Phase 5: Operations + Polish (Week 5)
- 5 tools: employees, webhooks, statistics, shop info, address lookup
- Integration tests
- Documentation

---

## Next Steps
1. Create implementation plan with detailed phase files
2. Initialize Bun project with MCP SDK
3. Build HTTP client + first tool (manage_orders)
4. Test with real Pancake API credentials
