---
phase: 1
title: "Shared address schema"
status: pending
priority: P1
effort: "15m"
dependencies: [0]
---

# Phase 1: Shared address schema

## Overview

Tạo `VietnamAddressSchema` shared ở `src/shared/schemas.ts`, chứa cả OLD (3-tier: tỉnh→huyện→xã) và NEW (2-tier post-2025-07-01: tỉnh→phường/xã) fields. Tất cả optional. Callsite tự `.extend()` khi cần required (KISS — 1 schema thay vì 2 variants).

## Requirements

**Functional:**
- Schema export thuần Zod, không phụ thuộc context tool nào
- Hỗ trợ song song OLD + NEW fields trên cùng 1 object (match Pancake API response shape)
- Tất cả field optional → callsite (Create actions) tự `.extend({ full_name: z.string(), ... })` để bắt buộc

**Non-functional:**
- Backwards compatible: existing callers gửi OLD format vẫn pass
- Self-documenting via Zod `.describe()` để LLM hiểu khi nào dùng OLD vs NEW

## Architecture

Thêm vào cuối `src/shared/schemas.ts`:

```ts
export const VietnamAddressSchema = z.object({
  full_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional().describe("Street address (house number, street name)"),
  country_code: z.number().optional().describe("Country code, default 84 for Vietnam"),
  // OLD format (pre-2025-07-01, 3-tier)
  province_id: z.string().optional().describe("OLD format province ID (e.g. '701')"),
  district_id: z.string().optional().describe("OLD format district ID (3-tier only)"),
  commune_id: z.string().optional().describe("OLD format commune/ward ID (3-tier only)"),
  // NEW format (post-2025-07-01, 2-tier — administrative reform removed district level)
  new_province_id: z.string().optional().describe("NEW format province ID (e.g. '84_VN129')"),
  new_commune_id: z.string().optional().describe("NEW format commune/ward ID (no district level)"),
  new_full_address: z.string().optional().describe("NEW format pre-formatted full address"),
});

export type VietnamAddress = z.infer<typeof VietnamAddressSchema>;
```

Callsite (Phase 2 example):

```ts
// Create order — contact + address required
shipping_address: VietnamAddressSchema.extend({
  full_name: z.string(),
  phone_number: z.string(),
  address: z.string(),
})
```

Cross-field validation **không** đặt ở Zod level — sẽ làm ở handler layer Phase 2.

## Related Code Files

- Modify: `src/shared/schemas.ts`
- Create: `tests/shared-schemas.test.ts` (project convention: tests in `tests/` dir, NOT colocated)

## Implementation Steps (TDD)

1. **Test first** — `src/shared/schemas.test.ts`:
   - Pass: empty object → valid
   - Pass: chỉ OLD fields đầy đủ → valid
   - Pass: chỉ NEW fields đầy đủ → valid
   - Pass: cả 2 format cùng lúc → valid (handler tự xử lý)
   - Fail: wrong type (province_id as number) → invalid
   - Pass: extended schema (`.extend({full_name: z.string()})`) reject missing full_name
2. Run test → red
3. Implement `VietnamAddressSchema` ở `schemas.ts` + export type
4. Run test → green
5. `bun run build` đảm bảo type compile

## Success Criteria

- [ ] Test file pass với tất cả case trên
- [ ] `VietnamAddressSchema` + `VietnamAddress` type exported
- [ ] `bun run build` xanh
- [ ] Không thay đổi callsite hiện tại (chỉ add export, chưa apply)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Conflict tên với type/schema có sẵn | Grep `VietnamAddress` trước khi tạo |
| LLM không hiểu khi nào OLD vs NEW | `.describe()` rõ ràng + Phase 6 docs |
