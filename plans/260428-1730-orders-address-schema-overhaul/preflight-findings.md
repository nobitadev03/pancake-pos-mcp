# Preflight findings (2026-04-28)

## A1 — NEW format mutability
**Deferred** to Phase 2 smoke test. Order 361 không có `new_commune_id` valid để test isolated.

## A2 — `customer_pay_fee` silent-ignore
**Tested:** Shop 123456789, đơn 361, api_key.
- PUT `{"customer_pay_fee": true}` → 200 success
- GET sau → `customer_pay_fee: false`
- **Result:** Silent-drop confirmed (1 shop). Cross-shop verify skipped (chỉ có access 1 shop).

**Decision:** Schema **reject** `customer_pay_fee` ở `UpdateAction` (Phase 4). Match plan.

**Bonus finding:** Response `histories` cho thấy prior `shipping_fee` mutations đều apply (83000→99000→12345→83000). Xác nhận `shipping_fee` mutate được qua api_key trên shop này → Phase 4 plan vững.

## A3 — Rate limit probe
**Tested:** 30 GET requests liên tiếp shop 123456789 đơn 361.
- 30/30 → HTTP 200
- Latency: 137–330ms (median ~150ms, 2 outliers ~330ms)
- Không 429, không throttle visible

**Decision:** Verify-after-update **default-on** (không cần opt-in flag). +1 GET/update overhead acceptable. Match plan Phase 5.

## Plan pivots
None. Tất cả assumption đã được confirm hoặc match plan.
