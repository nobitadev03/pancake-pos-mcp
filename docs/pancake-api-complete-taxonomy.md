# Pancake POS API - Complete Endpoint Taxonomy

**Generated:** 2026-04-09  
**Source:** Official OpenAPI Specification (https://api-docs.pancake.vn)  
**Total Endpoint Groups:** 27  
**Total Endpoints:** 110+

---

## Endpoint Directory by Domain

### 1. ORDERS (9 endpoints)
```
Orders Management
├─ GET    /api/v1/orders                    List all orders (paginated)
├─ POST   /api/v1/orders                    Create new order
├─ GET    /api/v1/orders/{id}               Get order details
├─ PUT    /api/v1/orders/{id}               Update order
├─ DELETE /api/v1/orders/{id}               Delete order
├─ GET    /api/v1/orders/{id}/statistics    Get order statistics
├─ POST   /api/v1/orders/{id}/print         Generate print output
├─ POST   /api/v1/orders/{id}/shipping      Send to shipping partner

Order Returns & Exchanges (8 endpoints)
├─ GET    /api/v1/order-returns             List returns
├─ POST   /api/v1/order-returns             Create return
├─ PUT    /api/v1/order-returns             Update return
├─ DELETE /api/v1/order-returns             Delete return
├─ GET    /api/v1/order-exchanges           List exchanges
├─ POST   /api/v1/order-exchanges           Create exchange
├─ PUT    /api/v1/order-exchanges           Update exchange
└─ DELETE /api/v1/order-exchanges           Delete exchange
```

---

### 2. PRODUCTS (9 endpoints)
```
Product Catalog Management
├─ GET    /api/v1/products                  List all products (paginated)
├─ POST   /api/v1/products                  Create product
├─ GET    /api/v1/products/{id}             Get product details
├─ PUT    /api/v1/products/{id}             Update product
├─ DELETE /api/v1/products/{id}             Delete product
├─ GET    /api/v1/products/{id}/variations  List product variations
├─ POST   /api/v1/products/{id}/variations  Create product variation
├─ POST   /api/v1/products/import           Bulk import products (multipart/form-data)
└─ GET    /api/v1/products/export           Bulk export products
```

---

### 3. CUSTOMERS (9 endpoints)
```
Customer Relationship Management
├─ GET    /api/v1/customers                 List all customers
├─ POST   /api/v1/customers                 Create customer
├─ GET    /api/v1/customers/{id}            Get customer details
├─ PUT    /api/v1/customers/{id}            Update customer
├─ DELETE /api/v1/customers/{id}            Delete customer
├─ GET    /api/v1/customers/{id}/reward-points    View reward balance
├─ POST   /api/v1/customers/{id}/reward-points    Add/award points
├─ GET    /api/v1/customers/{id}/notes      List customer notes
└─ POST   /api/v1/customers/{id}/notes      Add customer note
```

---

### 4. INVENTORY & WAREHOUSING (15 endpoints)
```
Warehouse Management (5 endpoints)
├─ GET    /api/v1/warehouses                List all warehouses
├─ POST   /api/v1/warehouses                Create warehouse
├─ GET    /api/v1/warehouses/{id}           Get warehouse details
├─ PUT    /api/v1/warehouses/{id}           Update warehouse
└─ DELETE /api/v1/warehouses/{id}           Delete warehouse

Inventory Reports (1 endpoint)
├─ GET    /api/v1/inventory/reports         Get inventory analytics

Warehouse Transfers (5 endpoints)
├─ GET    /api/v1/warehouse-transfers       List stock transfers
├─ POST   /api/v1/warehouse-transfers       Create transfer between warehouses
├─ GET    /api/v1/warehouse-transfers/{id}  Get transfer details
├─ PUT    /api/v1/warehouse-transfers/{id}  Update transfer
└─ DELETE /api/v1/warehouse-transfers/{id}  Cancel transfer

Stocktaking/Inventory Audit (5 endpoints)
├─ GET    /api/v1/stocktaking               List stocktaking sessions
├─ POST   /api/v1/stocktaking               Create new stocktake
├─ GET    /api/v1/stocktaking/{id}          Get stocktake details
├─ PUT    /api/v1/stocktaking/{id}          Update stocktake counts
└─ DELETE /api/v1/stocktaking/{id}          Delete/cancel stocktake
```

---

### 5. PRODUCTS EXTENDED (5 endpoints)
```
Combo Products (5 endpoints)
├─ GET    /api/v1/combos                    List combo products
├─ POST   /api/v1/combos                    Create combo bundle
├─ GET    /api/v1/combos/{id}               Get combo details
├─ PUT    /api/v1/combos/{id}               Update combo
└─ DELETE /api/v1/combos/{id}               Delete combo
```

---

### 6. SUPPLY CHAIN (15 endpoints)
```
Supplier Management (5 endpoints)
├─ GET    /api/v1/suppliers                 List all suppliers
├─ POST   /api/v1/suppliers                 Create supplier
├─ GET    /api/v1/suppliers/{id}            Get supplier details
├─ PUT    /api/v1/suppliers/{id}            Update supplier
└─ DELETE /api/v1/suppliers/{id}            Delete supplier

Purchase Orders (5 endpoints)
├─ GET    /api/v1/purchases                 List purchase orders
├─ POST   /api/v1/purchases                 Create purchase order
├─ GET    /api/v1/purchases/{id}            Get PO details
├─ PUT    /api/v1/purchases/{id}            Update purchase order
└─ DELETE /api/v1/purchases/{id}            Delete purchase order

Exports/Outbound (5 endpoints)
├─ GET    /api/v1/exports                   List inventory exports
├─ POST   /api/v1/exports                   Create export (inventory deduction)
├─ GET    /api/v1/exports/{id}              Get export details
├─ PUT    /api/v1/exports/{id}              Update export
└─ DELETE /api/v1/exports/{id}              Delete export

Shipping Partners (1 endpoint)
└─ GET    /api/v1/shipping-partners         List available shipping partners
```

---

### 7. FINANCIAL MANAGEMENT (8 endpoints)
```
Transactions & Accounting (5 endpoints)
├─ GET    /api/v1/transactions              List financial transactions
├─ POST   /api/v1/transactions              Record transaction
├─ GET    /api/v1/transactions/{id}         Get transaction details
├─ PUT    /api/v1/transactions/{id}         Update transaction
└─ DELETE /api/v1/transactions/{id}         Delete transaction

Debt Management (5 endpoints)
├─ GET    /api/v1/debt                      List debts (A/R & A/P)
├─ POST   /api/v1/debt                      Create debt record
├─ GET    /api/v1/debt/{id}                 Get debt details
├─ PUT    /api/v1/debt/{id}                 Update debt (payment status)
└─ DELETE /api/v1/debt/{id}                 Delete debt record

E-Invoice/Tax Compliance (5 endpoints)
├─ GET    /api/v1/invoices                  List e-invoices
├─ POST   /api/v1/invoices                  Create e-invoice (gov compliance)
├─ GET    /api/v1/invoices/{id}             Get e-invoice details
├─ PUT    /api/v1/invoices/{id}             Update e-invoice
└─ DELETE /api/v1/invoices/{id}             Delete e-invoice
```

---

### 8. MARKETING & PROMOTIONS (10 endpoints)
```
Promotions (5 endpoints)
├─ GET    /api/v1/promotions                List promotion campaigns
├─ POST   /api/v1/promotions                Create promotion rule
├─ GET    /api/v1/promotions/{id}           Get promotion details
├─ PUT    /api/v1/promotions/{id}           Update promotion
└─ DELETE /api/v1/promotions/{id}           Delete promotion

Vouchers/Promo Codes (5 endpoints)
├─ GET    /api/v1/vouchers                  List voucher codes
├─ POST   /api/v1/vouchers                  Create voucher/gift card
├─ GET    /api/v1/vouchers/{id}             Get voucher details
├─ PUT    /api/v1/vouchers/{id}             Update voucher (redeem count)
└─ DELETE /api/v1/vouchers/{id}             Delete voucher
```

---

### 9. MULTI-CHANNEL SALES (7 endpoints)
```
eCommerce Integration (2 endpoints)
├─ POST   /api/v1/ecommerce/sync            Sync with external channels (Shopee, Lazada, TikTok)
└─ GET    /api/v1/ecommerce/products        Get ecommerce channel products

Livestream Commerce (5 endpoints)
├─ GET    /api/v1/livestream                List livestream sessions
├─ POST   /api/v1/livestream                Create livestream
├─ GET    /api/v1/livestream/{id}           Get livestream details
├─ PUT    /api/v1/livestream/{id}           Update livestream
└─ DELETE /api/v1/livestream/{id}           Delete livestream
```

---

### 10. CUSTOMER ENGAGEMENT (10 endpoints)
```
CRM Module - Contacts (5 endpoints)
├─ GET    /api/v1/crm/contacts              List CRM contacts
├─ POST   /api/v1/crm/contacts              Create contact
├─ GET    /api/v1/crm/contacts/{id}         Get contact details
├─ PUT    /api/v1/crm/contacts/{id}         Update contact
└─ DELETE /api/v1/crm/contacts/{id}         Delete contact

CRM Module - Deals (5 endpoints)
├─ GET    /api/v1/crm/deals                 List sales opportunities/deals
├─ POST   /api/v1/crm/deals                 Create deal
├─ GET    /api/v1/crm/deals/{id}            Get deal details & pipeline stage
├─ PUT    /api/v1/crm/deals/{id}            Update deal (status, amount, stage)
└─ DELETE /api/v1/crm/deals/{id}            Delete deal

CRM Module - Activities (5 endpoints)
├─ GET    /api/v1/crm/activities            List activities (calls, meetings, notes)
├─ POST   /api/v1/crm/activities            Create activity
├─ GET    /api/v1/crm/activities/{id}       Get activity details
├─ PUT    /api/v1/crm/activities/{id}       Update activity
└─ DELETE /api/v1/crm/activities/{id}       Delete activity

Call Later Tasks (5 endpoints)
├─ GET    /api/v1/call-later                List call-back reminders
├─ POST   /api/v1/call-later                Create call-later task
├─ GET    /api/v1/call-later/{id}           Get task details
├─ PUT    /api/v1/call-later/{id}           Update task (status, date/time)
└─ DELETE /api/v1/call-later/{id}           Delete task
```

---

### 11. BUSINESS ANALYTICS (3 endpoints)
```
Statistics & Reporting (3 endpoints)
├─ GET    /api/v1/statistics/inventory      Inventory analytics (stock levels, turnover, SKU analysis)
├─ GET    /api/v1/statistics/sales          Sales analytics (revenue, trends, top products)
└─ GET    /api/v1/statistics/orders         Order analytics (volume, avg order value, status breakdown)
```

---

### 12. ADMINISTRATION (5 endpoints)
```
Employee Management (5 endpoints)
├─ GET    /api/v1/employees                 List employees
├─ POST   /api/v1/employees                 Create employee
├─ GET    /api/v1/employees/{id}            Get employee details
├─ PUT    /api/v1/employees/{id}            Update employee (role, permissions, contact)
└─ DELETE /api/v1/employees/{id}            Delete/deactivate employee

Shop Management (2 endpoints)
├─ GET    /api/v1/shop                      Get shop information
└─ POST   /api/v1/shop/update               Update shop configuration

Address Hierarchy (3 endpoints)
├─ GET    /api/v1/address/provinces         List all provinces/states
├─ GET    /api/v1/address/districts/{provinceId}     List districts by province
└─ GET    /api/v1/address/communes/{districtId}      List communes/wards by district
```

---

### 13. INTEGRATIONS (5 endpoints)
```
Webhooks (5 endpoints)
├─ GET    /api/v1/webhooks                  List configured webhooks
├─ POST   /api/v1/webhooks                  Register webhook endpoint
├─ GET    /api/v1/webhooks/{id}             Get webhook details
├─ PUT    /api/v1/webhooks/{id}             Update webhook (events, URL)
└─ DELETE /api/v1/webhooks/{id}             Delete webhook
```

---

## Endpoint Statistics

| Domain | Groups | Endpoints | Status |
|--------|--------|-----------|--------|
| **Orders** | 2 | 17 | ✓ Documented |
| **Inventory** | 4 | 16 | ✓ Documented |
| **Products** | 2 | 14 | ✓ Documented |
| **Customers** | 1 | 9 | ✓ Documented |
| **Supply Chain** | 3 | 16 | ✓ Documented |
| **Finance** | 3 | 15 | ✓ Documented |
| **Marketing** | 2 | 10 | ✓ Documented |
| **Multi-Channel** | 2 | 7 | ✓ Documented |
| **CRM & Engagement** | 4 | 20 | ✓ Documented |
| **Analytics** | 1 | 3 | ✓ Documented |
| **Admin** | 3 | 10 | ✓ Documented |
| **Integration** | 1 | 5 | ✓ Documented |
| **TOTAL** | **27** | **137+** | Complete |

---

## Standard CRUD Pattern

Most endpoints follow a consistent REST pattern:

```
├─ GET    /api/v1/{resource}                  List (all items, paginated)
├─ POST   /api/v1/{resource}                  Create (new item)
├─ GET    /api/v1/{resource}/{id}             Retrieve (specific item)
├─ PUT    /api/v1/{resource}/{id}             Update (entire item)
└─ DELETE /api/v1/{resource}/{id}             Delete (remove item)
```

**Exceptions:**
- GET-only: `/address/*`, `/inventory/reports`, `/statistics/*`, `/shipping-partners`
- POST-only: `/orders/{id}/print`, `/orders/{id}/shipping`, `/ecommerce/sync`
- Nested resources: `/customers/{id}/reward-points`, `/products/{id}/variations`

---

## Data Flow Integration Points

```
┌─────────────────────────────────────────────────────────┐
│ ORDERS                                                   │
│  ├─ references CUSTOMERS                               │
│  ├─ references PRODUCTS                                │
│  ├─ integrates with SHIPPING-PARTNERS                 │
│  ├─ generates E-INVOICES                              │
│  └─ tracked in STATISTICS/orders                      │
├─────────────────────────────────────────────────────────┤
│ INVENTORY                                              │
│  ├─ PRODUCTS → VARIATIONS → COMBOS                    │
│  ├─ WAREHOUSES ↔ WAREHOUSE-TRANSFERS                  │
│  ├─ SUPPLIERS → PURCHASES → EXPORTS                   │
│  ├─ STOCKTAKING validates physical counts             │
│  └─ reported via STATISTICS/inventory                 │
├─────────────────────────────────────────────────────────┤
│ FINANCE                                                │
│  ├─ ORDERS → TRANSACTIONS → DEBT                      │
│  ├─ CUSTOMERS/SUPPLIERS ↔ DEBT                        │
│  └─ INVOICES for tax compliance                       │
├─────────────────────────────────────────────────────────┤
│ SALES & MARKETING                                      │
│  ├─ CUSTOMERS → PROMOTIONS/VOUCHERS → ORDERS          │
│  ├─ CUSTOMERS → REWARD-POINTS                         │
│  ├─ CRM workflow: CONTACTS → DEALS → ACTIVITIES       │
│  ├─ CALL-LATER for follow-ups                         │
│  └─ LIVESTREAM for multi-channel selling              │
├─────────────────────────────────────────────────────────┤
│ CHANNELS                                               │
│  ├─ ECOMMERCE/sync integrates with ORDERS             │
│  └─ LIVESTREAM creates alternative order flow         │
└─────────────────────────────────────────────────────────┘
```

---

## API Maturity Indicators

✓ **Well-organized** — Clear domain grouping  
✓ **Comprehensive** — Covers full POS workflow  
✓ **RESTful** — Standard HTTP verbs, resource-oriented design  
✓ **Scalable** — Support for pagination, bulk operations  
✓ **Integrated** — Webhooks for event-driven architecture  
⚠ **Authentication not detailed** — Need additional docs  
⚠ **Error handling not specified** — Standard HTTP codes assumed  
⚠ **Rate limiting not documented** — Unknown limits  

---

**OpenAPI Spec Location:** `./docs/pancake-openapi-spec.json`  
**Full Research Report:** `./docs/pancake-api-research-report.md`  
**Discovery Summary:** `./docs/pancake-api-discovery-summary.md`
