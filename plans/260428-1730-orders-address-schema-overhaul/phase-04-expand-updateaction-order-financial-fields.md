---
phase: 4
title: "Expand UpdateAction order financial fields"
status: pending
priority: P1
effort: "20m"
dependencies: [2]
---

# Phase 4: Expand UpdateAction order financial fields

## Overview

Thêm financial fields vào `UpdateAction` của `orders-tool.ts`. Cố ý loại `customer_pay_fee` vì đã verify api_key bị silent-ignore. Defer `items` và `warehouse_id` (rủi ro inventory side-effect).

## Requirements

**Functional:**
- LLM gửi `orders update {shipping_fee: N}` → backend nhận N
- Hỗ trợ: `shipping_fee`, `partner_fee`, `is_free_shipping`, `total_discount`, `surcharge`, `note_print`, `received_at_shop`, `custom_id`, `bill_email`

**Non-functional:**
- Description rõ rang về quirk silent-drop (Phase 5 sẽ verify)
- Type-safe, không passthrough raw

## Architecture

`orders-tool.ts:61–75` UpdateAction thêm:

```ts
const UpdateAction = z.object({
  action: z.literal("update"),
  order_id: z.number().int().describe("Order ID to update"),
  status: z.number().int().optional().describe("New order status"),
  shipping_address: VietnamAddressSchema.optional()  // từ Phase 2
    .describe("Update shipping address. Mix OLD/NEW format as needed."),
  note: z.string().optional(),
  tags: z.array(z.number().int()).optional(),
  // Financial fields (Phase 4)
  shipping_fee: z.number().optional()
    .describe("Shipping fee. Some shops require sending is_free_shipping together — Phase 5 verify-after-update will warn if silently dropped."),
  partner_fee: z.number().optional()
    .describe("Partner shipping fee (often auto-syncs shipping_fee on backend)."),
  is_free_shipping: z.boolean().optional()
    .describe("Free shipping flag. Send together with shipping_fee on shops that require it."),
  total_discount: z.number().optional(),
  surcharge: z.number().optional(),
  note_print: z.string().optional().describe("Note printed on order receipt"),
  received_at_shop: z.boolean().optional().describe("Customer pickup at shop"),
  custom_id: z.string().optional(),
  bill_email: z.string().optional(),
});
```

Handler không đổi — chỉ pass `body` qua `client.put`. Body sẽ tự động chứa fields mới.

**Cố ý không thêm:**
- `customer_pay_fee` — api_key silent-ignore (verify trên shop 123456789 đơn 361)
- `items`, `warehouse_id` — rủi ro inventory, scope plan riêng nếu cần

## Related Code Files

- Modify: `src/tools/orders-tool.ts`
- Modify: `tests/orders-tool.test.ts`

## Implementation Steps (TDD)

1. **Test first**:
   - Schema test: Update với `shipping_fee` + `partner_fee` → valid
   - Schema test: Update với `customer_pay_fee` → **invalid** (đảm bảo cố ý loại)
   - Handler test: Update với `shipping_fee` → `client.put` được gọi với body chứa `shipping_fee`
2. Run → red
3. Thêm fields vào `UpdateAction`
4. Run → green
5. `bun run build`
6. **Manual smoke test** (curl thẳng MCP nếu có hoặc chạy MCP server local):
   - `orders update {order_id: 361, shipping_fee: 99000}` → verify GET sau update thấy 99000
   - Revert về 83000

## Success Criteria

- [ ] Tất cả test mới pass
- [ ] Schema reject `customer_pay_fee`
- [ ] Build xanh
- [ ] Smoke test update shipping_fee thành công trên đơn thật

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Backend silent-drop `shipping_fee` đơn lẻ trên shop khác | Phase 5 verify-after-update bắt được |
| LLM nhầm `customer_pay_fee` (không có) | Schema reject + description không nhắc field này |
| Field type sai (vd backend chấp nhận string number) | Test với cả number, fail nếu schema không match |
