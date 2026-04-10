# Phase 5: Operations + Polish

**Priority:** P2
**Status:** partial (tools complete, tests + README pending)
**Estimated effort:** Medium
**Depends on:** Phase 1-4

## Context Links

- [Plan Overview](plan.md)
- [API Docs](../../docs/poscake-api-docs.md) — Shipping partners, webhooks
- [API Taxonomy](../../docs/pancake-api-complete-taxonomy.md)

## Overview

Add remaining 5 tools (employees, webhooks, statistics, shop info, address lookup), write integration tests, create README, and finalize documentation.

## Key Insights

1. **Statistics** has 3 sub-endpoints (inventory/sales/orders) — single tool with `type` param
2. **Address** is read-only, hierarchical: provinces → districts → communes
3. **Shipping partners** is GET-only at `/partners` (not under `/shops/{id}/`)
4. **Shop info** has GET + POST update — two actions
5. **Webhooks** standard CRUD + event type configuration

## Related Code Files

### Files to Create
- `src/tools/employees-tool.ts`
- `src/tools/webhooks-tool.ts`
- `src/tools/statistics-tool.ts`
- `src/tools/shop-info-tool.ts`
- `src/tools/address-lookup-tool.ts`
- `README.md` — Project documentation
- `tests/api-client.test.ts` — HTTP client tests
- `tests/tools-smoke.test.ts` — Tool smoke tests

### Files to Modify
- `src/tools/tool-registry.ts` — Register 5 new tools
- `src/resources/reference-data.ts` — Add shipping partners dynamic resource

## Implementation Steps

### Step 1: manage_employees Tool
1. Create `src/tools/employees-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/employees`

### Step 2: manage_webhooks Tool
1. Create `src/tools/webhooks-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/webhooks` (or `/webhooks` — verify)
4. Create body: url, events[], headers?

### Step 3: get_statistics Tool
1. Create `src/tools/statistics-tool.ts`
2. Single tool with `type` param: inventory | sales | orders
3. Endpoints:
   - GET `/shops/{SHOP_ID}/statistics/inventory`
   - GET `/shops/{SHOP_ID}/statistics/sales`
   - GET `/shops/{SHOP_ID}/statistics/orders`
4. Common params: start_date, end_date (unix timestamps), group_by?
5. Returns summary + breakdown data

### Step 4: get_shop_info Tool
1. Create `src/tools/shop-info-tool.ts`
2. Actions: get, update
3. Endpoints:
   - GET `/shops/{SHOP_ID}/shop` (or `/shop`)
   - POST `/shops/{SHOP_ID}/shop/update`

### Step 5: lookup_address Tool
1. Create `src/tools/address-lookup-tool.ts`
2. Actions: provinces, districts, communes
3. Endpoints:
   - GET `/address/provinces` — List all provinces
   - GET `/address/districts/{provinceId}` — Districts by province
   - GET `/address/communes/{districtId}` — Communes by district
4. Note: May not be under `/shops/{id}/` path — verify

### Step 6: Register All + Final Compile
1. Update `src/tools/tool-registry.ts` — All 23 tools registered
2. Full compile check
3. Verify all tools appear in MCP tool listing

### Step 7: Integration Tests
1. Create `tests/api-client.test.ts`
   - Test URL building with shop_id injection
   - Test rate limiter behavior
   - Test retry on 5xx
   - Test error response parsing
2. Create `tests/tools-smoke.test.ts`
   - Smoke test each tool's list action
   - Verify response structure matches expected format

### Step 8: README + Documentation
1. Create `README.md`:
   - Project description
   - Setup instructions (env vars, bun install)
   - Usage (stdio, Streamable HTTP)
   - Tool reference table (all 23 tools with actions)
   - Resource reference table (all 7 resources)
   - Claude Desktop configuration example
2. Update `.env.example` if any new vars needed

### Step 9: Final Verification
1. Full E2E test: start server, connect client, execute workflow
2. Test workflow: list products → create order → check inventory
3. Verify both transports work
4. Check all 23 tools and 7 resources are accessible

## Todo List

- [ ] Implement manage_employees tool
- [ ] Implement manage_webhooks tool
- [ ] Implement get_statistics tool (3 types)
- [ ] Implement get_shop_info tool
- [ ] Implement lookup_address tool (hierarchical)
- [ ] Register all tools — verify 23 total
- [ ] Write HTTP client tests
- [ ] Write tool smoke tests
- [ ] Create README.md
- [ ] Full E2E verification

## Success Criteria

- All 23 tools registered and functional
- All 7 resources accessible
- `bun test` passes all tests
- README documents all tools, resources, and setup
- Both stdio + Streamable HTTP transports verified
- E2E workflow (list → create → verify) works

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Some endpoints not under /shops/{id}/ path | Low | Test and adjust URL builder per endpoint |
| Statistics endpoints may need date format tweaking | Low | Test with real data |
| Address endpoints may be static/cached | Low | Cache results, refresh daily |
