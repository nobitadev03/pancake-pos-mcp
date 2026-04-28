---
phase: 5
title: "Verify-after-update for order updates"
status: pending
priority: P2
effort: "25m"
dependencies: [4]
---

# Phase 5: Verify-after-update for order updates

## Overview

Sau PUT order update, GET lại đơn và so sánh các "fragile fields" gửi vs nhận. Nếu mismatch → return `warnings: string[]` cùng data. Đã chứng minh silent-drop có thật trên shop 430269105 (`shipping_fee` đơn lẻ bị drop, cần kèm `is_free_shipping`).

## Requirements

**Functional:**
- Sau `client.put` thành công, gọi `client.get` lại đơn
- So sánh fragile fields user gửi với giá trị server hiện tại
- Trả về `{ ...data, warnings? }` — `warnings` chỉ có nếu có mismatch
- Mismatch message gợi ý workaround (vd "try sending with is_free_shipping: false")

**Non-functional:**
- Overhead: +1 GET request (~100–300ms) — chấp nhận được cho update path
- Chỉ check fragile fields, không full diff (giảm noise)

## Architecture

Fragile fields list (verify được silent-drop trong test):
- `shipping_fee`
- `partner_fee`
- `is_free_shipping`

Không bao gồm: `note`, `tags`, `status`, `custom_id`, `bill_email`, `note_print` — assume reliable (chưa thấy bị drop). Có thể mở rộng list này sau khi gặp case mới.

`orders-tool.ts:137` `case "update"` refactor:

```ts
const FRAGILE_FIELDS = ["shipping_fee", "partner_fee", "is_free_shipping"] as const;

const WORKAROUND_HINTS: Record<string, string> = {
  shipping_fee: "Try sending with is_free_shipping=false on shops that require it.",
  partner_fee: "Try sending shipping_fee together with partner_fee.",
  is_free_shipping: "Some shops require explicit shipping_fee value alongside this flag.",
};

case "update": {
  const { action, order_id, ...body } = args;
  const putResult = await client.put(`orders/${order_id}`, body);

  // No fragile fields → preserve PUT response shape (no behavior change)
  const sentFragile = FRAGILE_FIELDS.filter(k => body[k] !== undefined);
  if (sentFragile.length === 0) {
    return putResult.data;
  }

  // Fragile fields present → verify via GET, build warnings, but return PUT data shape
  let warnings: string[] = [];
  try {
    const verify = await client.get(`orders/${order_id}`);
    const current = verify.data;
    for (const field of sentFragile) {
      const sent = body[field];
      const got = current[field];
      if (sent !== got) {
        warnings.push(
          `Field '${field}' silently dropped: sent ${JSON.stringify(sent)}, ` +
          `current ${JSON.stringify(got)}. ${WORKAROUND_HINTS[field] ?? ""}`.trim()
        );
      }
    }
  } catch (err) {
    warnings.push(`verify-after-update GET failed: ${err.message ?? err}`);
  }

  return warnings.length > 0
    ? { ...putResult.data, warnings }
    : putResult.data;
}
```

**Key changes vs original:**
- Return base = `putResult.data` (giữ shape như trước refactor) — không break callers expect PUT response
- `warnings` chỉ thêm key khi có mismatch; không có warnings → response identical to pre-refactor
- GET failure → soft-warn, không throw (PUT đã success, không nên fail toàn bộ tool call)
- `WORKAROUND_HINTS` map per-field — mở rộng dễ khi list fragile fields tăng

## Related Code Files

- Modify: `src/tools/orders-tool.ts` (case "update")
- Modify: `tests/orders-tool.test.ts`

## Implementation Steps (TDD)

1. **Test first** (mock client):
   - GET returns shipping_fee matching sent value → no warnings, no `warnings` key in response
   - GET returns mismatched shipping_fee → `warnings` array with 1 entry containing field-specific hint
   - Update without fragile fields → `client.get` NOT called, returns putResult.data unchanged
   - Multiple fragile fields, mixed mismatch/match → exactly N warnings for N mismatches
   - GET throws → `warnings` contains "verify-after-update GET failed"; tool does not throw
   - **Snapshot test:** Compare PUT response shape pre-refactor vs post-refactor with no fragile fields → identical
2. Run → red
3. Refactor `case "update"` theo architecture trên
4. Run → green
5. `bun run build`
6. **Manual smoke test:**
   - Update shipping_fee=99000 trên shop 123456789 đơn 361 → expect no warning (apply OK)
   - Switch test với shop 430269105 đơn 3679 (nếu có api_key) → expect warning vì silent-drop
   - Revert tất cả

## Success Criteria

- [ ] Test pass cho mọi case mismatch/match
- [ ] Update không có fragile fields → vẫn return data, không lỗi
- [ ] Warnings array có message gợi ý workaround
- [ ] Build xanh
- [ ] Smoke test trên đơn thật xác nhận behavior

## Risk Assessment

| Risk | Mitigation |
|---|---|
| GET fail sau PUT thành công → user nghĩ update fail | Catch GET error, return PUT data với warning "verify failed" |
| Race condition: ai đó update giữa PUT và GET | Hiếm + warning sẽ là false positive; document edge case |
| Fragile field list không cover hết | Khởi đầu 3 field; mở rộng khi user report |
| +100–300ms latency mỗi update | Acceptable; document trong tool description |
