# Phase 5: Deploy & Documentation

## Context Links
- [plan.md](./plan.md) — Overview
- `docs/deployment-guide.md` — Current deployment docs (update)
- `README.md` — Project README (update)

## Overview
- **Priority:** P1
- **Status:** in-progress
- **Description:** Deploy to Cloudflare Workers, set production secrets, update documentation

## Key Insights
- `wrangler deploy` handles bundling + upload in one step
- Secrets set via `wrangler secret put` — encrypted at rest, never visible after creation
- Workers URL: `https://pancake-pos-mcp.<account>.workers.dev/mcp`
- Custom domain optional — can add later via Cloudflare dashboard

## Requirements
### Functional
- Deploy Worker to Cloudflare
- Set production secrets (PANCAKE_API_KEY, PANCAKE_SHOP_ID, MCP_AUTH_TOKEN)
- Verify health endpoint on production URL
- Verify MCP protocol works via Inspector against production URL

### Non-functional
- Documentation updated to include Cloudflare Workers deployment option
- README updated with Workers usage section
- Zero downtime during first deploy (no existing service to disrupt)

## Related Code Files
### Modify
- `docs/deployment-guide.md` — Add Cloudflare Workers section
- `README.md` — Add Workers deployment section

### Create
- None (all code created in previous phases)

## TDD: Tests First

### Test 1: Production smoke test (post-deploy)
```bash
# Health check
curl https://pancake-pos-mcp.<account>.workers.dev/health
# Expected: {"status":"ok","transport":"streamable-http"}

# Auth check (should return 401)
curl -X POST https://pancake-pos-mcp.<account>.workers.dev/mcp
# Expected: {"error":"Unauthorized"}

# MCP initialize (with auth)
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}},"id":1}' \
  https://pancake-pos-mcp.<account>.workers.dev/mcp
# Expected: {"jsonrpc":"2.0","result":{"serverInfo":{"name":"pancake-pos",...},...},"id":1}
```

## Implementation Steps

1. **Deploy to Cloudflare**
   ```bash
   # First deployment
   wrangler deploy

   # Set production secrets
   wrangler secret put PANCAKE_API_KEY
   wrangler secret put PANCAKE_SHOP_ID
   wrangler secret put MCP_AUTH_TOKEN
   ```

2. **Verify deployment**
   ```bash
   # Health check
   curl https://pancake-pos-mcp.<account>.workers.dev/health

   # MCP Inspector
   npx @modelcontextprotocol/inspector https://pancake-pos-mcp.<account>.workers.dev/mcp
   ```

3. **Update `docs/deployment-guide.md`** — Add section:
   ```markdown
   ### Architecture 4: Cloudflare Workers (Serverless Edge)

   **Topology:**
   ​```
   MCP Clients (Claude, Cursor, etc.)
       ↓ (HTTPS, Streamable HTTP)
   Cloudflare Workers (edge, global)
       ↓ (HTTPS)
   Pancake POS API
   ​```

   **Prerequisites:**
   - Cloudflare account (free tier works for testing)
   - Wrangler CLI installed
   - Pancake POS API credentials

   **Setup:**
   ​```bash
   # Install dependencies
   bun install

   # Configure local development secrets
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your credentials

   # Local development
   bun run dev:workers

   # Deploy
   bun run deploy

   # Set production secrets
   wrangler secret put PANCAKE_API_KEY
   wrangler secret put PANCAKE_SHOP_ID
   wrangler secret put MCP_AUTH_TOKEN
   ​```

   **Client configuration (Claude Desktop via mcp-remote):**
   ​```json
   {
     "mcpServers": {
       "pancake-pos": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://pancake-pos-mcp.<account>.workers.dev/mcp",
           "--header", "Authorization: Bearer <your-token>"
         ]
       }
     }
   }
   ​```

   **Pros:**
   - Global edge deployment (low latency worldwide)
   - Zero infrastructure management
   - Free tier: 100k requests/day
   - Auto-scaling, no cold start concerns

   **Cons:**
   - No persistent state (rate limiter disabled)
   - Subrequest limits (50 free, 10k paid per invocation)
   - Workers CPU timeout (30s max)
   ```

4. **Update `README.md`** — Add Workers section to Usage

5. **Run smoke tests** against production URL

## Todo List
- [ ] Deploy Worker to Cloudflare
- [ ] Set production secrets via wrangler
- [ ] Run health check smoke test
- [ ] Run MCP Inspector against production URL
- [x] Update docs/deployment-guide.md with Workers section
- [x] Update README.md with Workers usage
- [ ] Verify Claude Desktop can connect via mcp-remote

## Success Criteria
- Worker deployed and accessible at `*.workers.dev/mcp`
- Health check returns 200
- MCP Inspector lists 23 tools and 7 resources on production
- Documentation covers full Workers setup
- Claude Desktop can connect via `mcp-remote` proxy

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| First deploy fails | Check wrangler logs, verify wrangler.toml, check compatibility flags |
| Secrets not set | `wrangler secret list` to verify all 3 secrets exist |
| Pancake API unreachable from CF | Test outbound fetch from Worker; CF Workers have global egress |

## Security Considerations
- Production secrets encrypted at rest on Cloudflare
- Never log secrets in Worker code
- MCP_AUTH_TOKEN required for production (no unauthenticated access)
- Workers.dev URL is publicly routable — auth is critical
- Consider Cloudflare Access for additional auth layer later

## Next Steps
- Monitor Worker performance via Cloudflare dashboard
- Consider custom domain if needed
- Consider Cloudflare Access (OAuth) for multi-user auth
