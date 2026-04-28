# Project Changelog

## 2026-04-28 — Orders update fields & VN address schema overhaul

Plan: `plans/260428-1730-orders-address-schema-overhaul/`

### Added
- `VietnamAddressSchema` shared (`src/shared/schemas.ts`) — supports both OLD 3-tier (`province_id`+`district_id`+`commune_id`) and NEW 2-tier (`new_province_id`+`new_commune_id`) Vietnamese address formats post-2025-07-01 administrative reform.
- `orders update` financial fields: `shipping_fee`, `partner_fee`, `is_free_shipping`, `total_discount`, `surcharge`, `note_print`, `received_at_shop`, `custom_id`, `bill_email`.
- Verify-after-update for orders: when any fragile field (`shipping_fee`, `partner_fee`, `is_free_shipping`) is sent in an update, the handler GETs the order to detect silent-drops and surfaces `warnings: string[]` with per-field workaround hints.
- Handler-layer `assertAddressHasLocation` enforcing province anchor on order create; on update, only when caller sends location fields.

### Changed
- `orders-tool.ts` `CreateAction.shipping_address` and `UpdateAction.shipping_address` now use `VietnamAddressSchema`. `district_id` / `commune_id` are no longer required on create.
- `address-lookup-tool.ts` wraps handler with 404 interceptor, throws structured deprecation message with workaround. Tool surface kept for forward-compat.
- `vitest.config.ts` pins `compatibilityDate: "2026-04-01"` for both plugin and pool to keep miniflare runtime within supported range.

### Excluded (verified silent-drop / out of scope)
- `customer_pay_fee` on `orders update` — Pancake api_key auth silently ignores this field (verified 2026-04-28 on shop 123456789). Schema rejects it.
- Phase 3 (apply VietnamAddressSchema to customers/warehouses/shop-info) deferred to a separate plan pending shape verification.

### Deprecated
- `address-lookup-tool` (`provinces`, `districts`, `communes`) — endpoints return 404 upstream on both pos.pages.fm and pos.pancake.vn with api_key and JWT. Workaround: extract IDs from existing entity responses (orders.get → `shipping_address`).

### Tests
- `tests/shared-schemas.test.ts` — 7 cases for `VietnamAddressSchema`.
- `tests/orders-tool.test.ts` — 17 cases (schema + handler create/update validation + verify-after-update).
- `tests/address-lookup-tool.test.ts` — 3 cases (404 wrapper, non-404 passthrough, success forward-compat).
- Total suite: 46 tests passing.

### References
- Brainstorm: `plans/reports/brainstorm-260428-orders-address-schema-overhaul.md`
- Preflight findings: `plans/260428-1730-orders-address-schema-overhaul/preflight-findings.md`
