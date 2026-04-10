# Phase 2: Supply Chain

**Priority:** P1
**Status:** complete
**Estimated effort:** Medium
**Depends on:** Phase 1 (Foundation + Core POS)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1](phase-01-foundation-and-core-pos.md) — HTTP client, shared schemas
- [API Taxonomy](../../docs/pancake-api-complete-taxonomy.md) — Endpoints reference

## Overview

Add 5 supply chain tools: warehouses, suppliers, purchases, transfers, stocktaking. All follow standard CRUD pattern — leverage shared schemas and HTTP client from Phase 1.

## Key Insights

1. All 5 resources follow identical CRUD pattern (list/get/create/update/delete)
2. Warehouse transfers link two warehouses — need source + destination warehouse_id
3. Stocktaking compares physical vs system counts — important for inventory accuracy
4. Purchases link suppliers to inventory — creates inbound stock movement

## Requirements

### Functional
- 5 MCP tools: manage_warehouses, manage_suppliers, manage_purchases, manage_transfers, manage_stocktaking
- Each tool: list, get, create, update, delete actions
- Proper pagination on list actions

### Non-Functional
- Consistent with Phase 1 tool patterns
- Under 200 lines per tool file

## Related Code Files

### Files to Create
- `src/tools/warehouses-tool.ts`
- `src/tools/suppliers-tool.ts`
- `src/tools/purchases-tool.ts`
- `src/tools/transfers-tool.ts`
- `src/tools/stocktaking-tool.ts`

### Files to Modify
- `src/tools/tool-registry.ts` — Register 5 new tools

## Implementation Steps

### Step 1: manage_warehouses Tool
1. Create `src/tools/warehouses-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/warehouses`
4. Create: name, phone_number, address, province_id, district_id, commune_id, allow_create_order
5. Response includes full_address computed by API

### Step 2: manage_suppliers Tool
1. Create `src/tools/suppliers-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/suppliers`

### Step 3: manage_purchases Tool
1. Create `src/tools/purchases-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/purchases`
4. Create links supplier_id + items with quantities + warehouse_id

### Step 4: manage_transfers Tool
1. Create `src/tools/transfers-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/warehouse-transfers`
4. Create needs: source_warehouse_id, destination_warehouse_id, items[]

### Step 5: manage_stocktaking Tool
1. Create `src/tools/stocktaking-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/stocktaking`
4. Create: warehouse_id, items with actual_quantity vs system_quantity

### Step 6: Register + Test
1. Update `src/tools/tool-registry.ts` — Add 5 new tools
2. Compile check
3. Smoke test list actions with real API

## Todo List

- [ ] Implement manage_warehouses tool
- [ ] Implement manage_suppliers tool
- [ ] Implement manage_purchases tool
- [ ] Implement manage_transfers tool
- [ ] Implement manage_stocktaking tool
- [ ] Register all tools in registry
- [ ] Compile check
- [ ] Smoke test with real API

## Success Criteria

- 5 new tools registered in MCP server
- `manage_warehouses list` returns warehouse data
- All CRUD actions work for each tool
- Tool files each under 200 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Purchase/transfer schemas undocumented | Medium | Test with API, infer from response |
| Stocktaking may have complex state machine | Low | Start with basic CRUD, iterate |
