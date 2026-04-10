# Phase 4: CRM + Multi-Channel

**Priority:** P2
**Status:** complete
**Estimated effort:** Medium
**Depends on:** Phase 1 (Foundation)

## Context Links

- [Plan Overview](plan.md)
- [API Taxonomy](../../docs/pancake-api-complete-taxonomy.md)

## Overview

Add 5 tools: CRM contacts, deals, activities + ecommerce sync + livestream. CRM tools follow standard CRUD. Ecommerce has unique sync action. Livestream is standard CRUD.

## Key Insights

1. CRM is a separate module with `/crm/contacts`, `/crm/deals`, `/crm/activities` paths
2. CRM pipeline: Contacts → Deals → Activities (relationship tracking)
3. Ecommerce sync connects to Shopee/Lazada/TikTok — POST-only action
4. Livestream is Asia-specific live selling feature
5. Call-later tasks (already in manage_orders) complement CRM workflow

## Related Code Files

### Files to Create
- `src/tools/crm-contacts-tool.ts`
- `src/tools/crm-deals-tool.ts`
- `src/tools/crm-activities-tool.ts`
- `src/tools/ecommerce-tool.ts`
- `src/tools/livestream-tool.ts`

### Files to Modify
- `src/tools/tool-registry.ts` — Register 5 new tools

## Implementation Steps

### Step 1: manage_crm_contacts Tool
1. Create `src/tools/crm-contacts-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/crm/contacts`
4. Standard CRUD

### Step 2: manage_crm_deals Tool
1. Create `src/tools/crm-deals-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/crm/deals`
4. Deals have pipeline stages, amounts, linked contacts

### Step 3: manage_crm_activities Tool
1. Create `src/tools/crm-activities-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/crm/activities`
4. Activities: calls, meetings, notes linked to contacts/deals

### Step 4: manage_ecommerce Tool
1. Create `src/tools/ecommerce-tool.ts`
2. Actions: sync, list_products
3. Endpoints:
   - POST `/shops/{SHOP_ID}/ecommerce/sync` — Trigger channel sync
   - GET `/shops/{SHOP_ID}/ecommerce/products` — List synced products

### Step 5: manage_livestream Tool
1. Create `src/tools/livestream-tool.ts`
2. Actions: list, get, create, update, delete
3. Endpoints: `/shops/{SHOP_ID}/livestream`
4. Standard CRUD

### Step 6: Register + Test
1. Update registry
2. Test all CRM tools
3. Test ecommerce sync (may need marketplace connection configured)

## Todo List

- [ ] Implement manage_crm_contacts tool
- [ ] Implement manage_crm_deals tool
- [ ] Implement manage_crm_activities tool
- [ ] Implement manage_ecommerce tool
- [ ] Implement manage_livestream tool
- [ ] Register all tools in registry
- [ ] Compile check
- [ ] Smoke test with real API

## Success Criteria

- 5 new tools registered
- CRM tools support full pipeline (contacts → deals → activities)
- Ecommerce sync action triggers without error
- All list actions return paginated data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CRM module may require separate auth/config | Low | Test with existing api_key first |
| Ecommerce sync requires marketplace setup | Medium | Test with available channels, document limitations |
| Livestream may not be enabled for all shops | Low | Handle 403/404 gracefully |
