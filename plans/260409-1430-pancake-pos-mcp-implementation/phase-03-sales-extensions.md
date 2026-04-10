# Phase 3: Sales Extensions

**Priority:** P1
**Status:** complete
**Estimated effort:** Medium
**Depends on:** Phase 1 (Foundation)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1](phase-01-foundation-and-core-pos.md) — HTTP client, shared schemas
- [API Docs](../../docs/poscake-api-docs.md) — Returns, combos detailed docs

## Overview

Add 4 sales extension tools: returns, combos, promotions, vouchers. Returns have documented request/response examples. Combos have complex variation+bonus product structures.

## Key Insights

1. **Order returns** have detailed docs — include exchange flow (return items + create new order)
2. **Combos** are complex — variations[], bonus_products[], time-limited, source-filtered
3. **Promotions** and **vouchers** follow standard CRUD but may have time-based activation
4. Returns link to original order via `order_id_to_returned`

## Related Code Files

### Files to Create
- `src/tools/returns-tool.ts`
- `src/tools/combos-tool.ts`
- `src/tools/promotions-tool.ts`
- `src/tools/vouchers-tool.ts`

### Files to Modify
- `src/tools/tool-registry.ts` — Register 4 new tools

## Implementation Steps

### Step 1: manage_returns Tool
1. Create `src/tools/returns-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/order-returns`
4. Create body: order_id_to_returned, returned_items[], discount, returned_fee, warehouse_id
5. Exchange support: is_exchange=true + exchange_items[]
6. Response includes original order reference + return items with variation_info

### Step 2: manage_combos Tool
1. Create `src/tools/combos-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/combo-products`
4. Create body: name, discount_amount, is_free_shipping, variations[], bonus_products[], start_time, end_time, order_sources[]
5. Complex nested structure — validate carefully

### Step 3: manage_promotions Tool
1. Create `src/tools/promotions-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/promotions`
4. Standard CRUD — exact schema from API testing

### Step 4: manage_vouchers Tool
1. Create `src/tools/vouchers-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/vouchers`
4. Standard CRUD — exact schema from API testing

### Step 5: Register + Test
1. Update registry
2. Test returns create with real order data
3. Test combo list to verify complex response parsing

## Todo List

- [ ] Implement manage_returns tool (with exchange support)
- [ ] Implement manage_combos tool (complex schema)
- [ ] Implement manage_promotions tool
- [ ] Implement manage_vouchers tool
- [ ] Register all tools in registry
- [ ] Compile check
- [ ] Smoke test with real API

## Success Criteria

- 4 new tools registered
- Returns tool supports exchange flow
- Combo tool handles variations + bonus products
- All list actions return paginated data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Combo schema complexity | Medium | Start with list/get, iterate create schema based on response |
| Promotion/voucher schemas undocumented | Low | Standard CRUD, test and document |
