# MCP TypeScript SDK Research Report
**Date:** 2026-04-09 | **Focus:** SDK v2.0-alpha (production trajectory), dual transport setup, tool scalability

---

## Executive Summary

**Current Version:** `@modelcontextprotocol/server@2.0.0-alpha.2` (stable pre-release, Q1 2026 target). Dual stdio + Streamable HTTP supported natively on single server. For 137+ endpoints: use resource-based grouping + tool discovery patterns, not flat tool registries. Tool descriptions must be schema-heavy with domain context; LLMs prefer precise input/output types over prose. MCP Resources + Prompts complement tools for large APIs—use tools for actions, resources for data context, prompts for workflow templates.

---

## 1. Current Version & Key Features

**Latest Release:** v2.0.0-alpha.2 (02-25-26)
**SDK Surface:** `@modelcontextprotocol/server` | `@modelcontextprotocol/client`

### Headline Breaking Changes (v2.0)
- Standard Schema support: **Zod v4, Valibot, ArkType** all work (not Zod-locked anymore)
- Error handling fixed: unknown tools return JSON-RPC `-32602` (InvalidParams) instead of `isError: true`
- Resource reads: unknown resources return `-32002` (ResourceNotFound), not `-32602`
- Tasks API extracted from Protocol into TaskManager (capability-based, experimental)
- Dropped Zod from peerDependencies (users no longer forced to install separately)

**Maturity Signals:**
- v1.x remains production-recommended until v2 ships (6mo+ bugfix support post-GA)
- No breaking changes expected between alpha and GA—API stable
- Used across Claude Desktop, Cursor, Claude Code—battle-tested

---

## 2. Dual Transport Setup (Stdio + Streamable HTTP on Single Server)

**Pattern:** Create one server, connect two transports. Each handles separate client types.

```typescript
const server = new McpServer({ name: 'pos-api', version: '1.0.0' });

// Register tools/resources once
server.registerTool('list_products', { ... });
server.registerResource('inventory', { ... });

// Attach stdio (local, e.g., Claude Desktop)
const stdioTransport = new StdioServerTransport();
await server.connect(stdioTransport);

// Attach Streamable HTTP (remote, e.g., web clients) on separate listener
const httpTransport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()  // stateful mode
});
// OR attach to Express/Hono for DNS rebinding protection
const app = createMcpExpressApp();
app.post('/mcp', (req, res) => {
  // httpTransport.handle(req, res)
});
```

**Critical:** Both transports connect to *the same server instance*. No tool duplication needed. Protocol-level message routing handles them independently.

**Deployment Implication:** For 137+ endpoints wrapped as tools, stateless Streamable HTTP is recommended (easier horizontal scaling). Stateful mode requires per-node session storage or external event store.

---

## 3. Organizing 137+ Tools: Patterns That Scale

**Problem:** Flat registry of 137+ tools causes LLM context bloat and discovery friction.

### Recommended Approach: **Resource-Based Grouping + Tool-Per-Operation**

1. **Resource Template for Collections**
   ```typescript
   server.registerResource(
     'api-products',
     new ResourceTemplate('api://products/{product_id}', {
       list: async () => ({
         resources: [
           { uri: 'api://products/P1', name: 'Product P1' },
           // ... paginated
         ]
       })
     })
   );
   ```
   → LLM queries resource templates to *discover* products without tool calls.

2. **Scoped Tool Groups** (not flat)
   ```typescript
   // Group tools by domain, not API endpoint
   server.registerTool('products.search', { ... });
   server.registerTool('products.create', { ... });
   server.registerTool('orders.list', { ... });
   server.registerTool('orders.fulfill', { ... });
   ```
   → Naming hierarchy aids LLM organization. Avoid generic `call_api(endpoint, params)` pattern.

3. **Tool Descriptions Must Include Relationship Context**
   ```typescript
   description: 'Search products by SKU, name, category. Use after list_products.search to get IDs for create_order. Supports pagination (limit, offset).'
   ```
   → Signal cross-tool workflows in descriptions. LLMs use this for chaining logic.

### Alternative: **Fine-Grained Tools vs. Resource-Heavy**
- **Fine-grained** (137 tools): Each endpoint = one tool. High discovery cost, precise control.
- **Resource-heavy** (20 tools + 10 resources): Fewer tools, data fetched via resources. Better for data-access APIs (e.g., POS with catalog queries).

**For POS APIs:** Resource-heavy is optimal. Tools for mutations (create order, payment), resources for reads (product catalog, pricing).

---

## 4. Tool Description Structure for LLM Optimization

LLMs perform **worst** on vague descriptions; **best** on schema + context.

### Required Elements (in this order):
```typescript
server.registerTool('charge_payment', {
  title: 'Charge Payment (required)',
  description: 'Process a payment charge for an order. Idempotent by charge_id. Returns success or declined reason.',
  
  inputSchema: z.object({
    charge_id: z.string().describe('Unique idempotent key, e.g., order-12345-attempt-1'),
    amount_cents: z.number().int().positive().describe('Amount in cents USD'),
    payment_method: z.enum(['card', 'cash', 'check']).describe('Payment type'),
    card_token: z.string().optional().describe('Tokenized card (required if payment_method=card)')
  }).describe('Payment charge parameters'),
  
  outputSchema: z.object({
    success: z.boolean(),
    charge_id: z.string(),
    declined_reason: z.string().optional().describe('If success=false, reason (e.g., "insufficient_funds")')
  })
});
```

### Why This Works:
- **Type precision:** `z.enum()` instead of `string` → LLM picks valid values without trial-error
- **Domain context in field descriptions:** "idempotent key" signals intent, not just "string"
- **Output schema included:** LLM sees what to expect, formats replies correctly
- **Error semantics:** Explains failure cases (declined_reason) so LLM self-corrects

### Anti-Pattern:
```typescript
description: 'Charge a payment', // vague
inputSchema: z.object({ data: z.string() }) // opaque
```

---

## 5. Resource-Based vs. Fine-Grained Tool Design

### Use **Resources** For:
- **Read-only, browsable data:** Product catalog, menu items, pricing tables
- **Large payloads:** Avoid embedding in tool schemas; use resource URIs instead
- **Context injection:** Application selects resources to include, not model-driven

**Example (POS):**
```typescript
server.registerResource(
  'menu',
  new ResourceTemplate('pos://menu/{category}', {
    list: async () => ({ resources: [
      { uri: 'pos://menu/entrees', name: 'Entrees' },
      { uri: 'pos://menu/sides', name: 'Sides' }
    ]})
  })
);
```

### Use **Tools** For:
- **Mutations:** Create order, process payment, update inventory
- **LLM-driven actions:** Model decides when to call based on user input
- **Computations:** Discounts, tax calculation, availability checks
- **Notifications:** Send SMS/email confirmations

### Use **Prompts** For:
- **Workflow templates:** "Create order" (guides selection of products, payment, etc.)
- **Domain expertise:** "Best practices for restaurant POS"
- **User-invoked helpers:** "/" commands, not auto-called

**For POS with 137 endpoints:**
- ~30 tools (mutations: order, payment, inventory, staff)
- ~10 resources (reads: menu, pricing, tables, staff schedules)
- ~3 prompts (workflows: "create order", "settle shift", "audit")
- **Result:** LLM context stays <5KB, discovery remains fast**

---

## 6. MCP Resources & Prompts Complement Tools

### Complementary Architecture Pattern:

```
Tool: list_customers → Returns paginated array
Resource: customer://{id}/profile → Detailed customer record
Prompt: "Suggest loyalty discount" → Guides tool usage + resource context
```

**Why separation matters:**
- **LLM doesn't bloat:** Tools trigger on demand; resources fetched by app or included explicitly
- **Permission boundaries:** Resources can be shown to users *before* invoking tools (read vs. write)
- **Caching:** Resources remain stable; tools stay fresh (useful for stateless Streamable HTTP)

### Real POS Example:
1. Tool `search_orders(customer_id)` → returns order summaries
2. Resource `order://{order_id}` → detailed receipt + line items
3. Prompt `"Reorder favorites"` → guides selection of prior order + creates new order

LLM fetches resource only if it needs details, not for every search.

---

## 7. Dual Transport Deployment Considerations

### Stdio Path (Claude Desktop, Local)
- Simpler session model (one connection per user)
- No DNS rebinding risk
- Suitable for light load (<10 concurrent connections)

### Streamable HTTP Path (Web, Multi-Client)
- **Required for scale:** Horizontal load balancing, multiple clients
- **Stateless mode** (no `sessionIdGenerator`): Each request independent, shared transports
- **Stateful mode** (`sessionIdGenerator: randomUUID()`): Per-session memory, requires:
  - Per-node session routing OR
  - External event store (PostgreSQL, Redis) for resumability
- **DNS rebinding protection mandatory:** Use `createMcpExpressApp()` / `createMcpHonoApp()`

---

## 8. Adoption Risk & Maturity Assessment

| Factor | Status | Risk |
|--------|--------|------|
| v2 stability | Pre-alpha, GA Q1 2026 | Low (API frozen; v1 covers production) |
| Ecosystem | Express, Hono, Fastify adapters; Claude/Cursor support | Low |
| Breaking changes | None expected alpha→GA | Low |
| Community | 12.1k GitHub stars; LF project | Low |
| Abandonment | Backed by Anthropic; protocol open | Negligible |
| TypeScript tooling | Full type safety; no runtime surprises | Low |

**Recommendation:** Production workloads use **v1.x until v2 GA**. Parallel v2 development acceptable (API stable, no churn).

---

## 9. Unresolved Questions & Gaps

1. **Event store for resumability:** Official example exists (in-memory) but no production PostgreSQL example. Needed for reliable Streamable HTTP in stateful mode.

2. **Tool discovery at scale:** No guidance on how LLMs perform with 100+ tools in a single registry. Empirical threshold unknown.

3. **Prompt chaining semantics:** Can prompts invoke other prompts? Protocol silent; implementation-defined.

4. **Resource template filtering:** No standard way to express "show only products in category X" within resource URI template. Clients must build filtering logic.

5. **Stateless vs. stateful ops:** When should a tool request sampling/elicitation vs. returning directly? Design patterns undocumented.

---

## Architecture Recommendation for POS

**Stack:**
- **Transport:** Streamable HTTP (Express + `createMcpExpressApp()`) + stdio wrapper
- **Tool count:** ~30 organized by domain (orders, payments, inventory, staff)
- **Resources:** ~10 templates for catalog reads (products, pricing, tables)
- **Prompts:** ~3 workflow templates (order creation, shift settlement, reports)
- **Scaling:** Stateless mode initially; event store + session routing only if resumability required

**File Structure:**
```
src/
  mcp/
    server.ts              # McpServer + dual transport setup
    tools/
      orders.ts            # registerTool('orders.*', ...)
      payments.ts          # registerTool('payments.*', ...)
      inventory.ts
    resources/
      catalog.ts           # registerResource templates
    prompts/
      workflows.ts         # registerPrompt templates
```

**Why this works for 137 endpoints:**
- Flat endpoint count hidden from LLM (30 tools, not 137)
- Resources + prompts handle browsable data (catalog, workflows)
- Clear separation of concerns (tools = actions, resources = context, prompts = guidance)

