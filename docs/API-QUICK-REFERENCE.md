# Pancake API Quick Reference Card

**API Base:** `https://api.pancake.vn/api/v1/`  
**Version:** v1  
**Format:** JSON REST/OpenAPI 3.0

---

## Endpoint Counts by Domain

| Endpoint | Count | CRUD | Async |
|----------|-------|------|-------|
| **Orders** | 17 | ✓ | Print, Shipping |
| **Inventory** | 16 | ✓ | - |
| **Products** | 14 | ✓ | Import/Export |
| **Customers** | 9 | ✓ | Reward points |
| **Warehouses** | 5 | ✓ | - |
| **Combos** | 5 | ✓ | - |
| **Supply Chain** | 16 | ✓ | - |
| **Finance** | 15 | ✓ | - |
| **CRM** | 20 | ✓ | - |
| **Marketing** | 10 | ✓ | - |
| **Multi-Channel** | 7 | ✓ | Sync |
| **Admin** | 10 | ✓/RO | - |
| **Integration** | 5 | ✓ | - |
| **TOTAL** | **137+** | | |

---

## Quick Endpoints Reference

### Sales
```
/orders                          [GET/POST]
/orders/{id}                     [GET/PUT/DELETE]
/orders/{id}/print               [POST]
/orders/{id}/shipping            [POST]
/order-returns                   [GET/POST/PUT/DELETE]
/order-exchanges                 [GET/POST/PUT/DELETE]
```

### Products
```
/products                        [GET/POST]
/products/{id}                   [GET/PUT/DELETE]
/products/{id}/variations        [GET/POST]
/products/import                 [POST - multipart]
/products/export                 [GET]
/combos                          [GET/POST/PUT/DELETE]
```

### Customers
```
/customers                       [GET/POST]
/customers/{id}                  [GET/PUT/DELETE]
/customers/{id}/reward-points    [GET/POST]
/customers/{id}/notes            [GET/POST]
```

### Inventory
```
/warehouses                      [GET/POST/PUT/DELETE]
/warehouse-transfers             [GET/POST/PUT/DELETE]
/stocktaking                     [GET/POST/PUT/DELETE]
/inventory/reports               [GET]
```

### Supply Chain
```
/suppliers                       [GET/POST/PUT/DELETE]
/purchases                       [GET/POST/PUT/DELETE]
/exports                         [GET/POST/PUT/DELETE]
/shipping-partners               [GET]
```

### Finance
```
/transactions                    [GET/POST/PUT/DELETE]
/debt                            [GET/POST/PUT/DELETE]
/invoices                        [GET/POST/PUT/DELETE]
```

### CRM & Engagement
```
/crm/contacts                    [GET/POST/PUT/DELETE]
/crm/deals                       [GET/POST/PUT/DELETE]
/crm/activities                  [GET/POST/PUT/DELETE]
/call-later                      [GET/POST/PUT/DELETE]
```

### Marketing
```
/promotions                      [GET/POST/PUT/DELETE]
/vouchers                        [GET/POST/PUT/DELETE]
```

### Channels
```
/livestream                      [GET/POST/PUT/DELETE]
/ecommerce/sync                  [POST]
/ecommerce/products              [GET]
```

### Admin
```
/shop                            [GET]
/shop/update                     [POST]
/address/provinces               [GET]
/address/districts/{id}          [GET]
/address/communes/{id}           [GET]
/employees                       [GET/POST/PUT/DELETE]
```

### Analytics
```
/statistics/inventory            [GET]
/statistics/sales                [GET]
/statistics/orders               [GET]
```

### Integration
```
/webhooks                        [GET/POST/PUT/DELETE]
```

---

## Standard Query Parameters

### Pagination
- `per_page` — Items per page (default: 20)
- Inferred: `page` or cursor-based pagination

### Filtering & Sorting
- Not documented in OpenAPI excerpt
- Likely supports: `sort`, `filter`, `status`, date ranges

---

## HTTP Methods Reference

| Method | Purpose | Status Code |
|--------|---------|------------|
| **GET** | Retrieve | 200 OK |
| **POST** | Create | 201 Created |
| **PUT** | Update | 200 OK |
| **DELETE** | Remove | 204 No Content |

---

## Content Types

- **Request:** `application/json`
- **File Upload:** `multipart/form-data` (products import)
- **Response:** `application/json`

---

## Authentication (Inferred from Spec)

❓ **Not documented in OpenAPI excerpt**

Likely options:
- Bearer token (JWT)
- API key in header
- OAuth2

**Action:** Consult official authentication docs before implementation.

---

## Rate Limiting

❓ **Not documented**

Estimated assumptions:
- Per-second rate limit (likely 10-100 req/sec)
- Per-minute/hourly quotas
- Burst allowance

**Action:** Test in development environment to determine actual limits.

---

## Error Handling

✓ Standard HTTP status codes inferred:
- `4xx` — Client error (bad request, not found, etc.)
- `5xx` — Server error

⚠ Specific error response format not documented

**Action:** Test error scenarios to document response structure.

---

## Webhooks

✓ **CRUD Available**
```
GET    /webhooks              List registered webhooks
POST   /webhooks              Register endpoint
GET    /webhooks/{id}         Get details
PUT    /webhooks/{id}         Update (events, URL)
DELETE /webhooks/{id}         Delete
```

❓ **Event types not documented** (e.g., `order.created`, `product.updated`)

---

## Known Limitations

1. ❌ Partial updates (PATCH) not available
2. ⚠️ Bulk operations limited to products (import/export)
3. ❌ GraphQL support not documented
4. ⚠️ Cross-resource queries unclear (can you fetch Order + Customer in one call?)
5. ❌ Batch endpoints for multiple records not evident

---

## Implementation Checklist

- [ ] Read full OpenAPI specification
- [ ] Test authentication & token management
- [ ] Document rate limits (actual vs. inferred)
- [ ] Map webhook event types
- [ ] Test pagination behavior
- [ ] Document error response formats
- [ ] Plan data relationships (Order → Customer → Reward Points)
- [ ] Design MCP tool schemas
- [ ] Create code generation from OpenAPI spec
- [ ] Build example integration tests

---

## Research Artifacts Location

All files in: `./docs/`

1. `pancake-openapi-spec.json` — Machine-readable spec
2. `pancake-api-research-report.md` — Full analysis
3. `pancake-api-complete-taxonomy.md` — Directory of all endpoints
4. `pancake-api-discovery-summary.md` — What's new vs. known
5. `RESEARCH-COMPLETE.md` — Executive summary

---

**Last Updated:** 2026-04-09  
**Status:** Ready for implementation planning  
**Confidence:** HIGH (official source)

Next: Request full authentication documentation and webhook event catalog.
