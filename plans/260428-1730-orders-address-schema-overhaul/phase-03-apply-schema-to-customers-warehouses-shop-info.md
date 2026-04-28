---
phase: 3
title: "Apply schema to customers/warehouses/shop-info"
status: pending
priority: P2
effort: "30m"
dependencies: [1]
---

# Phase 3: Apply schema to customers/warehouses/shop-info

## Overview

Replicate Phase 2 cho 3 tool còn lại có địa chỉ. Mỗi tool có spec hơi khác (customers có `addresses[]` array, warehouses có address phẳng, shop-info có address phẳng) — cần xác minh shape thực tế trước khi swap.

## Requirements

**Functional:**
- `customers-tool` Create/Update address fields hỗ trợ OLD + NEW
- `warehouses-tool` Create/Update address fields hỗ trợ OLD + NEW
- `shop-info-tool` update address fields hỗ trợ OLD + NEW

**Non-functional:**
- Không breaking existing callers
- Schema reuse từ Phase 1, không duplicate

## Architecture

### customers-tool.ts:31–33
- Hiện tại có nested object `addresses[].{ province_id, district_id, commune_id }`
- **Verify trước:** Pancake API response của customer có `new_*` fields trong addresses array không? (curl GET `/customers/{id}` để confirm shape)
- Replace từng item trong `addresses` array bằng `VietnamAddressSchema` extend với contact fields theo nhu cầu

### warehouses-tool.ts:22–24, 34–36
- 2 chỗ riêng biệt (Create + Update warehouse)
- Address phẳng — apply trực tiếp `VietnamAddressSchema` field-by-field merge vào schema gốc

### shop-info-tool.ts:13–15
- Update shop info → merge `VietnamAddressSchema` vào root params

## Related Code Files

- Modify: `src/tools/customers-tool.ts`
- Modify: `src/tools/warehouses-tool.ts`
- Modify: `src/tools/shop-info-tool.ts`
- Create or modify: `tests/customers-tool.test.ts`, `tests/warehouses-tool.test.ts`, `tests/shop-info-tool.test.ts`

## Implementation Steps (TDD)

1. **Verify shape thực tế** (curl với api_key) — DECISION GATE:
   ```
   GET /shops/{id}/customers/{id}     → check addresses[]
   GET /shops/{id}/warehouses          → check warehouse address fields
   GET /shops/{id}                     → check shop-info address fields
   ```
   - **Nếu shape match** `VietnamAddressSchema` (có cả old + new_* fields hoặc subset) → proceed
   - **Nếu shape khác** (vd `ward_id` thay `commune_id`, hoặc thiếu hoàn toàn `new_*`) → **STOP**, document findings, **defer phase này thành plan riêng**, mark phase 3 status=cancelled, ship plan này với 5 phase còn lại
2. **Test first** mỗi tool (chỉ chạy nếu pass DECISION GATE): NEW format input → valid; OLD format → valid; mixed → valid.
3. Run → red.
4. Implement: import `VietnamAddressSchema`, replace fields tương ứng. **Tests file path:** `tests/{tool-name}.test.ts` (per project convention, NOT colocated).
5. Run → green.
6. `bun run build`.

## Success Criteria

- [ ] 3 tool nhận được OLD và NEW format input
- [ ] Test cũ vẫn pass
- [ ] Build xanh
- [ ] Field names trong schema khớp shape Pancake response (verified bằng curl)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Customer addresses array có shape khác (vd dùng `ward_id` thay `commune_id`) | Verify GET response trước khi sửa, document |
| Warehouse address có field bắt buộc khác | Giữ required cũ, chỉ thêm NEW fields optional |
| Shop-info có field unexpected | Verify shape trước, không assume |
