---
phase: 2
title: "Apply schema to orders-tool"
status: pending
priority: P1
effort: "30m"
dependencies: [1]
---

# Phase 2: Apply schema to orders-tool

## Overview

Thay `shipping_address` schema trong `CreateAction` và `UpdateAction` của `orders-tool.ts` bằng `VietnamAddressSchema` từ Phase 1. Bỏ required `district_id`/`commune_id` trong CreateAction. Thêm runtime validation: ít nhất 1 location ID phải có.

## Requirements

**Functional:**
- `CreateAction.shipping_address` chấp nhận cả OLD và NEW format
- `UpdateAction.shipping_address` chấp nhận cả OLD và NEW format
- Runtime check: rỗng cả 2 format → reject với message rõ ràng
- Existing callers OLD format vẫn pass

**Non-functional:**
- Không breaking type signature handler
- Description hướng dẫn LLM khi nào dùng format nào

## Architecture

`orders-tool.ts:44–52` (CreateAction) và `:65–72` (UpdateAction) thay bằng:

```ts
import { VietnamAddressSchema } from "../shared/schemas.js";

const CreateShippingAddressSchema = VietnamAddressSchema.extend({
  full_name: z.string(),
  phone_number: z.string(),
  address: z.string(),
});

const CreateAction = z.object({
  // ...
  shipping_address: CreateShippingAddressSchema.describe(
    "Use OLD (province_id+district_id+commune_id) for legacy or NEW (new_province_id+new_commune_id) post-2025-07-01."
  ),
  // ...
});

const UpdateAction = z.object({
  // ...
  shipping_address: VietnamAddressSchema.optional()
    .describe("Update shipping address. Send only fields to change. Mix OLD/NEW format as needed."),
  // ...
});
```

Handler validation (refined per red-team):

```ts
const LOCATION_FIELDS = [
  "province_id", "district_id", "commune_id",
  "new_province_id", "new_commune_id"
] as const;

/**
 * Validate location fields ONLY when caller intends to set/change location.
 * Pure contact updates (e.g. update phone_number only) bypass this check.
 *
 * Required for `create` (full address mandatory).
 * Required for `update` ONLY if caller sent any location-related field but the set is incomplete.
 */
function assertAddressHasLocation(addr, mode: "create" | "update") {
  const hasOld = !!(addr.province_id);  // province is the anchor for OLD
  const hasNew = !!(addr.new_province_id);  // province is the anchor for NEW
  const sentAnyLocation = LOCATION_FIELDS.some(k => addr[k] !== undefined);

  if (mode === "create") {
    if (!hasOld && !hasNew) {
      throw new Error("Create order: shipping_address requires province_id (OLD) or new_province_id (NEW)");
    }
    return;
  }

  // mode === "update": only enforce if user is touching location
  if (sentAnyLocation && !hasOld && !hasNew) {
    throw new Error(
      "Update shipping_address: when sending location fields, at least province_id (OLD) " +
      "or new_province_id (NEW) is required. Pure contact updates (phone_number, full_name) are OK."
    );
  }
}
```

Gọi trong `case "create"` (always) và `case "update"` (chỉ khi `shipping_address` present).

## Related Code Files

- Modify: `src/tools/orders-tool.ts`
- Create or modify: `tests/orders-tool.test.ts` (project convention)

## Implementation Steps (TDD)

1. **Test first** (`orders-tool.test.ts`):
   - Schema: Create NEW format only (no district) → valid
   - Schema: Update chỉ `new_full_address` → valid (no location anchor field)
   - Handler: Create no location → throws (mode=create)
   - Handler: Create OLD format → calls `client.post` đúng
   - Handler: Create NEW format → calls `client.post` với new_*
   - Handler: Update **chỉ** `phone_number` (no location) → bypass check, calls put OK
   - Handler: Update với `district_id` only (sent location nhưng thiếu province) → throws
   - Handler: Update với `new_province_id` + `new_commune_id` → calls put với new_*
2. Run test → red
3. Refactor schema: import `VietnamAddressSchema*`, thay 2 chỗ
4. Implement `assertAddressHasLocation`
5. Wire vào `case "create"` và `case "update"`
6. Run test → green
7. `bun run build`

## Success Criteria

- [ ] Test mới pass
- [ ] Test cũ vẫn pass
- [ ] Build xanh
- [ ] Smoke test: `orders create` với NEW format trên shop 123456789 không lỗi schema

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Backend từ chối NEW format trên shop chưa migrate | Manual test + handle error backend |
| Existing test dùng OLD format | Giữ test cũ pass trước khi thêm test mới |
| Error message khó hiểu cho LLM | Message English rõ, gợi ý field thiếu |
