# Brainstorm — Orders update fields & Vietnam address schema overhaul

**Date:** 2026-04-28
**Status:** approved (option B + verify-after-update)
**Auth scope:** `PANCAKE_API_KEY` only — JWT user token excluded.

## 1. Problem statement

MCP wrapper không update được phí vận chuyển và 1 số field tài chính của order; toàn bộ tool có địa chỉ chỉ support format CŨ 3-tier (tỉnh→huyện→xã) nên fail với đơn/khách/kho theo địa giới hành chính mới sau cải cách 2025-07-01 (2-tier: tỉnh→phường/xã).

## 2. Findings (verify thực tế qua curl tới Pancake API)

### 2.1 Update order fields gap
`UpdateAction` (orders-tool.ts:61–75) chỉ có `status`, `shipping_address`, `note`, `tags`. Backend `PUT /shops/{id}/orders/{id}` accept thêm: `shipping_fee`, `partner_fee`, `is_free_shipping`, `total_discount`, `surcharge`, `note_print`, `received_at_shop`, `custom_id`, `bill_email`.

### 2.2 Silent-drop hazard
Backend trả `success: true` ngay cả khi field bị drop:
- Shop 430269105: `{shipping_fee: N}` đơn lẻ bị ignore, phải kèm `is_free_shipping: false` mới apply
- Shop 123456789: `{shipping_fee: N}` đơn lẻ apply OK
→ Behavior không nhất quán giữa shop. LLM/user không có cách biết update fail trừ khi GET lại.

### 2.3 Permission scope của api_key
- ✅ `shipping_fee`, `partner_fee`, `is_free_shipping`, address fields, `note`, `status`, `tags`: update OK
- ❌ `customer_pay_fee`: silent-ignored với api_key (cần JWT). User chốt KHÔNG dùng JWT → field này bị loại khỏi schema.

### 2.4 Address schema lỗi thời ở 4 tool
Pancake response chứa song song 2 format trên cùng object:
- OLD: `province_id`, `district_id`, `commune_id` (vd `"701"`)
- NEW: `new_province_id` (vd `"84_VN129"`), `new_commune_id`, `new_full_address`
- Flag: `render_type: "old" | "new"`

MCP hiện chỉ có OLD ở:
- `orders-tool` Create:44–52 (district_id/commune_id **required** → block đơn 2-tier)
- `orders-tool` Update:65–72 (optional, OLD only)
- `customers-tool`:31–33
- `warehouses-tool`:22–24, 34–36
- `shop-info-tool`:13–15

### 2.5 Address-lookup tool dead
`address-lookup-tool` gọi `/address/{provinces,districts,communes}` — verify trả 404 ở cả `pos.pages.fm` & `pos.pancake.vn`, cả api_key & JWT. Tách thành plan riêng — **không gộp vào plan này** để tránh block scope chắc ăn.

## 3. Approaches evaluated

| Option | Mô tả | Effort | Risk | Verdict |
|---|---|---|---|---|
| A | Chỉ orders-tool | 30 phút | Thấp | Lặp công khi customers/warehouses cần |
| **B + verify** | Sweep 4 tool + shared schema + verify-after-update | 1.5–2.5h | Thấp | ✅ **Chosen** |
| C | B + fix lookup | 3–8h | Cao | Bundle wildcard rủi ro vào core fix |

## 4. Recommended solution (option B + verify)

### 4.1 Shared address schema
File mới hoặc thêm vào `src/shared/schemas.ts`:

```ts
export const VietnamAddressSchema = z.object({
  full_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  country_code: z.number().optional(),
  // OLD format (3-tier, pre-2025-07-01)
  province_id: z.string().optional(),
  district_id: z.string().optional(),
  commune_id: z.string().optional(),
  // NEW format (2-tier, post-2025-07-01)
  new_province_id: z.string().optional(),
  new_commune_id: z.string().optional(),
  new_full_address: z.string().optional(),
});
```

`Create*` actions cần subset với required minimum (`full_name`, `phone_number`, `address`) + cross-field validation: phải có ít nhất 1 trong 2 format đầy đủ.

### 4.2 Apply lên 4 tool
- `orders-tool`: bỏ required district_id/commune_id ở Create; thay shipping_address của Update bằng VietnamAddressSchema
- `customers-tool`: thay address schema
- `warehouses-tool`: thay address fields
- `shop-info-tool`: thay address fields

### 4.3 Mở rộng `UpdateAction` orders (full set, loại trừ customer_pay_fee)

```ts
shipping_fee: z.number().optional()
  .describe("Shipping fee. Some shops require sending is_free_shipping together — verify-after-update will warn if silently dropped."),
partner_fee: z.number().optional()
  .describe("Partner shipping fee (auto-syncs shipping_fee)."),
is_free_shipping: z.boolean().optional(),
total_discount: z.number().optional(),
surcharge: z.number().optional(),
note_print: z.string().optional(),
received_at_shop: z.boolean().optional(),
custom_id: z.string().optional(),
bill_email: z.string().optional(),
```

**Cố ý loại:** `customer_pay_fee` (api_key bị ignore — gây nhầm lẫn cho LLM)
**Defer:** `items`, `warehouse_id` (out of scope, có rủi ro inventory side-effect)

### 4.4 Verify-after-update (orders update only)
Trong `case "update"` handler (orders-tool.ts:137):
1. PUT
2. GET lại đơn
3. So sánh "fragile fields" gửi vs nhận: `shipping_fee`, `partner_fee`, `is_free_shipping`
4. Build `warnings: string[]` cho field mismatch
5. Return `{ ...data, warnings }` (warnings rỗng thì không thêm key)

Overhead: +1 GET (~100–300ms). Order update không phải hot path → chấp nhận được.

### 4.5 Address-lookup tool — defer
- Thêm comment `// KNOWN BROKEN: Pancake /address/* endpoints return 404. Tracked in plans/.../address-lookup-investigation`
- Note ở `docs/codebase-summary.md`
- Plan riêng investigate

## 5. Implementation phases

| Phase | Nội dung | File chính |
|---|---|---|
| 1 | `VietnamAddressSchema` shared | `src/shared/schemas.ts` |
| 2 | Apply schema vào 4 tool | `orders-tool.ts`, `customers-tool.ts`, `warehouses-tool.ts`, `shop-info-tool.ts` |
| 3 | Mở rộng UpdateAction orders | `orders-tool.ts` |
| 4 | Verify-after-update cho update order | `orders-tool.ts` handler |
| 5 | Note dead lookup + docs | `address-lookup-tool.ts`, `docs/codebase-summary.md`, `docs/project-changelog.md` |
| 6 | Test (Vitest) | `*.test.ts` |

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM gửi cả 2 format cùng lúc | Validate runtime: nếu cả 2 → ưu tiên NEW, log warning |
| Backend silent-drop field mới sau update | Verify-after-update phát hiện, return warnings |
| Breaking change cho LLM caller hiện tại (Create order với address cũ) | Giữ nguyên field OLD optional + add NEW optional. Pre-existing call vẫn chạy |
| Shop khác có rule khác (như `is_free_shipping` requirement) | Description rõ ràng + verify-after-update bắt được |
| Customers/Warehouses chưa verify thực tế | Phase 2 sẽ test PUT thực tế trên các tool này, không chỉ assume |

## 7. Success criteria

- [x] PUT shipping_fee qua MCP update tool → reflect đúng giá trị (verify GET)
- [x] Tạo order với địa chỉ NEW format (`new_province_id` + `new_commune_id`, không district) thành công
- [x] Update địa chỉ order từ OLD → NEW format thành công
- [x] Verify-after-update trả warning khi field bị silent-drop
- [x] All existing tests pass + new tests cho address schema + update fields
- [x] `bun run build` xanh, `bun test` xanh

## 8. Open questions

- **Customers tool:** Pancake có endpoint update địa chỉ riêng (vd `customer_addresses`) hay update qua object `addresses` array của customer PUT? → Xác minh ở Phase 2 trước khi sửa schema.
- **`new_province_id` format:** `"84_VN129"` — `84` là country code VN, `VN129` là provice code. Có cần chuẩn hoá khi LLM gửi `"VN129"` không? → Khả năng: backend tự handle, nhưng cần test để confirm.
- **Address-lookup investigation:** Khi nào trigger plan riêng? → Khi có user case thực tế cần LLM resolve text → IDs.

## 9. Next steps

→ Invoke `/ck:plan` với context của report này để tạo phase files chi tiết trong `plans/260428-1730-orders-address-schema-overhaul/`.
