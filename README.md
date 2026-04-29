# Pancake POS MCP

Model Context Protocol (MCP) server wrapping the Pancake POS REST API, enabling AI assistants like Claude to manage Vietnamese e-commerce POS operations with 23 specialized tools and 7 reference resources.

## Overview

Pancake POS MCP exposes the Pancake POS API (https://pos.pages.fm/api/v1) as Model Context Protocol tools, allowing Claude and other AI assistants to automate POS management across:

- **Core POS:** Orders, Products, Customers, Inventory
- **Supply Chain:** Warehouses, Suppliers, Purchases, Transfers, Stocktaking
- **Sales:** Returns, Exchanges, Combos, Promotions, Vouchers
- **CRM:** Contacts, Deals, Activities
- **Multi-Channel:** eCommerce (Shopee/Lazada/TikTok), Livestream Commerce
- **Operations:** Employees, Webhooks, Analytics, Shop Info, Address Lookup

## Prerequisites

- **Bun** (runtime) — install from https://bun.sh (`curl -fsSL https://bun.sh/install | bash`)
- **Pancake POS API Key** + **Shop ID** — see [Getting Pancake credentials](#getting-pancake-credentials) below
- **Node.js 18+** (optional, for development tooling)

## Quick Start

Get from zero to a working MCP server in ~5 minutes:

```bash
# 1. Clone the repo
git clone https://github.com/nguyennguyenit/pancake-pos-mcp.git
cd pancake-pos-mcp

# 2. Install dependencies
bun install

# 3. Configure credentials
cp .env.example .env
# Open .env and fill in PANCAKE_API_KEY + PANCAKE_SHOP_ID
# (See "Getting Pancake credentials" section below)

# 4. Verify it runs
bun run src/index.ts
# Expected output:
#   [pancake-pos-mcp] Server started on stdio transport
# Press Ctrl+C to stop.

# 5. Connect Claude Desktop — see "Stdio Transport" section below
```

If step 4 prints an error, double-check your `.env` values and that you ran `bun install`. Common issues are listed in [Troubleshooting](#troubleshooting).

## Getting Pancake credentials

You need two values from your Pancake POS account:

1. **`PANCAKE_SHOP_ID`** — the numeric ID of your shop
   - Log in to https://pos.pages.fm
   - The shop ID appears in the URL after login: `https://pos.pages.fm/shops/<SHOP_ID>/...`
2. **`PANCAKE_API_KEY`** — your API authentication token
   - Pancake Dashboard → **Cài đặt** (Settings) → **API** → **Generate API key**
   - Copy the key immediately — it is only shown once

> Keep both values secret. Never commit them to git. The `.gitignore` already excludes `.env` and `.dev.vars`.

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
# Copy the template
cp .env.example .env

# Edit with your credentials
PANCAKE_API_KEY=your_api_key_here
PANCAKE_SHOP_ID=your_shop_id_here

# Optional: override default API base URL
# PANCAKE_BASE_URL=https://pos.pages.fm/api/v1

# Optional: HTTP transport port (default: 3000)
# PORT=3000

# Optional: Bearer token for HTTP transport authentication
# MCP_AUTH_TOKEN=your_secret_token_here
```

## Usage

### Stdio Transport (Claude Desktop)

Default mode - connect via Claude Desktop:

```bash
bun run src/index.ts
```

Add to Claude Desktop config `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pancake-pos": {
      "command": "bun",
      "args": ["run", "/path/to/pancake-pos-mcp/src/index.ts"]
    }
  }
}
```

### HTTP Transport (Remote Access)

Enable Streamable HTTP transport:

```bash
bun run src/index.ts --http
```

Server starts at `http://localhost:3000/mcp`. Health check: `http://localhost:3000/health`

With authentication (recommended for production):

```bash
# .env
PORT=3000
MCP_AUTH_TOKEN=your_secret_token

# Client usage
curl -H "Authorization: Bearer your_secret_token" http://localhost:3000/mcp
```

### Cloudflare Workers (Serverless Edge)

Deploy globally on Cloudflare Workers for low-latency access from anywhere:

```bash
# Install dependencies
bun install

# Local development (uses .dev.vars for secrets)
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your credentials
bun run dev:workers
# Runs at http://localhost:8787

# Deploy to Cloudflare
wrangler login
bun run deploy

# Set production secrets
wrangler secret put PANCAKE_API_KEY
wrangler secret put PANCAKE_SHOP_ID
wrangler secret put MCP_AUTH_TOKEN
```

Workers URL: `https://pancake-pos-mcp.<your-subdomain>.workers.dev/mcp`

**Connect Claude Desktop via mcp-remote:**

```json
{
  "mcpServers": {
    "pancake-pos": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://pancake-pos-mcp.<your-subdomain>.workers.dev/mcp",
        "--header", "Authorization: Bearer <your-token>"
      ]
    }
  }
}
```

**Workers characteristics:** 8s timeout per upstream call, 2 retries, rate limiter disabled (stateless per-request model). Free tier: 100k requests/day. See [deployment guide](./docs/deployment-guide.md) for full details.

## Available Tools

| Tool | Phase | Description |
|------|-------|-------------|
| `manage_orders` | 1 | Create, read, update, delete, print, ship, and manage order status |
| `manage_products` | 1 | Manage product catalog with variations and pricing |
| `manage_customers` | 1 | Customer CRUD, reward points, transaction history |
| `manage_inventory` | 1 | Inventory reports filtered by warehouse, category, supplier |
| `manage_warehouses` | 2 | Warehouse CRUD and configuration |
| `manage_suppliers` | 2 | Supplier contact and profile management |
| `manage_purchases` | 2 | Purchase orders and inbound inventory |
| `manage_transfers` | 2 | Warehouse-to-warehouse transfer management |
| `manage_stocktaking` | 2 | Physical inventory count records |
| `manage_returns` | 3 | Order returns and exchange processing |
| `manage_combos` | 3 | Product bundle deals and time-limited offers |
| `manage_promotions` | 3 | Discount campaigns (percent/amount-based) |
| `manage_vouchers` | 3 | Voucher code generation and usage tracking |
| `manage_crm_contacts` | 4 | CRM contact CRUD and relationship management |
| `manage_crm_deals` | 4 | Sales pipeline opportunities and stages |
| `manage_crm_activities` | 4 | Calls, meetings, tasks, notes tied to contacts/deals |
| `manage_ecommerce` | 4 | Multi-channel sync (Shopee, Lazada, TikTok) |
| `manage_livestream` | 4 | Live selling session management and scheduling |
| `manage_employees` | 5 | Staff management and warehouse assignments |
| `manage_webhooks` | 5 | Event subscription and webhook configuration |
| `get_statistics` | 5 | Analytics for inventory, sales, orders with grouping |
| `get_shop_info` | 5 | Shop profile information and settings |
| `lookup_address` | 5 | Vietnamese address hierarchy (provinces → districts → communes) |

## Available Resources

Static reference resources (no authentication required):

| Resource | Contents |
|----------|----------|
| `order-statuses` | 16 order status codes with Vietnamese/English names |
| `order-sources` | Sales channel codes (Facebook, Shopee, Lazada, etc.) |
| `sort-options` | 22 sort options for order listing |
| `webhook-events` | Webhook event types (order.created, order.updated, etc.) |
| `error-codes` | HTTP error code reference |
| `rate-limits` | API rate limits (1000/min, 10000/hour) |
| `shipping-partners` | Live shipping partner data (cached from API) |

## Architecture

- **API Client:** Token-bucket rate limiting (1000/min, 10000/hour), exponential backoff retries (3 attempts)
- **Tools:** 23 MCP tools organized by business domain
- **Schema Validation:** Zod with discriminated unions for strict runtime validation
- **Transport:** Stdio (default) + Streamable HTTP + Cloudflare Workers with optional Bearer token auth
- **Error Handling:** Structured error responses with code and message

## Development

### Type Checking

```bash
bun run typecheck
```

### Rebuild on Changes

```bash
bun run start:stdio  # Auto-reload with Bun
```

### Project Structure

```
src/
├── api-client/              # HTTP layer with rate limiting
│   ├── pancake-http-client.ts
│   ├── request-builder.ts
│   └── response-parser.ts
├── tools/                   # 23 MCP tools (23 files)
├── resources/               # MCP reference resources
├── shared/                  # Schemas, errors, pagination
├── config.ts                # Environment configuration
├── server.ts                # MCP server factory
├── worker.ts                # Cloudflare Workers entry point
└── index.ts                 # Entry point (stdio + HTTP)
```

See [docs/code-standards.md](./docs/code-standards.md) for full development guidelines.

## Documentation

- **[codebase-summary.md](./docs/codebase-summary.md)** — Architecture and implementation overview
- **[system-architecture.md](./docs/system-architecture.md)** — Detailed system design and data flows
- **[code-standards.md](./docs/code-standards.md)** — TypeScript and tool implementation standards
- **[project-overview-pdr.md](./docs/project-overview-pdr.md)** — Project requirements and features
- **[deployment-guide.md](./docs/deployment-guide.md)** — Setup and deployment instructions
- **[project-roadmap.md](./docs/project-roadmap.md)** — Implementation progress and milestones
- **[poscake-api-docs.md](./docs/poscake-api-docs.md)** — Complete Pancake API reference

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `bun: command not found` | Bun not installed or not in PATH | `curl -fsSL https://bun.sh/install \| bash` then restart shell |
| `Missing PANCAKE_API_KEY` on startup | `.env` file missing or empty | `cp .env.example .env` and fill in real values |
| `401 Unauthorized` from Pancake API | Invalid or expired API key | Regenerate key in Pancake Dashboard → Settings → API |
| `404 Not Found` on every API call | Wrong `PANCAKE_SHOP_ID` | Re-check the shop ID in your Pancake URL |
| Port 3000 already in use (HTTP mode) | Another process on port 3000 | Set `PORT=3001` in `.env` |
| Claude Desktop doesn't see the tools | Wrong path in `claude_desktop_config.json` | Use absolute path; restart Claude Desktop after editing |
| `429 Too Many Requests` | Hit Pancake rate limit (1000/min, 10000/hour) | Wait — built-in token bucket auto-throttles; reduce parallelism |
| Tests fail with `Cannot find package 'cloudflare:test'` | Ran `bun test` instead of `bun run test` | Use `bun run test` (vitest), not native `bun test` |

## License

MIT License — See [LICENSE](./LICENSE) file for full text.

## Support

For issues or questions:
1. Check documentation in `./docs`
2. Review tool schemas and error messages
3. Verify `.env` configuration and API credentials
4. Check Pancake API status at https://pos.pages.fm
