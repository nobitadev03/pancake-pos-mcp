---
phase: 6
title: "Mark address-lookup broken & docs"
status: pending
priority: P3
effort: "15m"
dependencies: []
---

# Phase 6: Mark address-lookup broken & docs

## Overview

`address-lookup-tool` gọi endpoint `/address/{provinces,districts,communes}` trả 404. Mark known-broken trong code, document trong `docs/`, defer fix vào plan riêng. Update changelog với toàn bộ thay đổi của plan này.

## Requirements

**Functional:**
- Comment trong `address-lookup-tool.ts` ghi rõ "KNOWN BROKEN" với link đến plan investigation
- `docs/codebase-summary.md` note về VN address dual-format support + address-lookup status
- `docs/project-changelog.md` add entry cho plan này

**Non-functional:**
- Không xoá tool (giữ surface area cho LLM nếu Pancake fix sau)
- Documentation đủ context để future dev hiểu lý do

## Architecture

### `src/tools/address-lookup-tool.ts`

Thêm JSDoc + wrap handler để intercept 404 với message rõ ràng (LLM thấy được, không chỉ là raw HTTP error):

```ts
/**
 * KNOWN BROKEN: Pancake API endpoints `/address/provinces`, `/address/districts/{id}`,
 * `/address/communes/{id}` return HTTP 404 on both pos.pages.fm and pos.pancake.vn,
 * with both api_key and JWT authentication (verified 2026-04-28).
 *
 * Tool surface kept for LLM-discoverability, but handler returns a structured
 * deprecation error. Investigation tracked in a separate plan.
 *
 * Workaround for callers: obtain location IDs from existing data — e.g. order
 * GET response includes `shipping_address.province_id` (OLD) and
 * `shipping_address.new_province_id` / `new_commune_id` (NEW format).
 */

const DEPRECATION_NOTE =
  "address-lookup endpoint is currently unavailable upstream (HTTP 404). " +
  "Workaround: extract location IDs from existing entities (e.g. orders.get → " +
  "shipping_address.province_id or new_province_id). " +
  "Investigation deferred — see plans/ for status.";

export async function handleAddressLookupTool(args, client) {
  try {
    // ... existing switch ...
  } catch (err) {
    if (err?.status === 404 || /404/.test(String(err?.message))) {
      throw new Error(DEPRECATION_NOTE);
    }
    throw err;
  }
}
```

→ LLM gọi tool sẽ nhận message rõ ràng thay vì raw 404, biết workaround ngay.

### `docs/codebase-summary.md`
Thêm section "Vietnam address handling":
- Pancake POS supports 2 address formats since 2025-07-01 reform: OLD 3-tier (province→district→commune) and NEW 2-tier (province→commune)
- MCP `VietnamAddressSchema` exposes both, callers choose
- Address-lookup tool currently broken upstream

### `docs/project-changelog.md`
Entry:
- **2026-04-28** Orders update fields & VN address schema overhaul
  - Added `VietnamAddressSchema` shared (OLD + NEW format)
  - Applied to orders/customers/warehouses/shop-info tools
  - Expanded `orders update` with shipping_fee, partner_fee, is_free_shipping, total_discount, surcharge, note_print, received_at_shop, custom_id, bill_email
  - Verify-after-update for fragile fields (silent-drop detection)
  - Marked address-lookup tool as known-broken upstream

## Related Code Files

- Modify: `src/tools/address-lookup-tool.ts`
- Modify: `docs/codebase-summary.md`
- Modify: `docs/project-changelog.md`

## Implementation Steps

1. **Test first** (`address-lookup-tool.test.ts`):
   - Mock `client.getRaw` throw 404-shaped error → handler throws with `DEPRECATION_NOTE` message
   - Mock `client.getRaw` return data → handler returns data normally (forward-compat nếu Pancake fix)
2. Read existing `docs/codebase-summary.md` để biết structure hiện tại
3. Read existing `docs/project-changelog.md`
4. Add JSDoc + try/catch wrapper vào `address-lookup-tool.ts`
5. Update 2 doc files (codebase-summary section + changelog entry)
6. Manual review: render markdown, đảm bảo formatting OK
7. `bun run build` + `bun test` xanh

## Success Criteria

- [ ] JSDoc block xuất hiện trong tool file
- [ ] `codebase-summary.md` có section VN address handling
- [ ] `project-changelog.md` có entry 2026-04-28
- [ ] Không thay đổi runtime behavior của address-lookup tool

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Docs drift: ai đó sửa code address-lookup không update docs | Comment ngay trong code (gần nhất với code) |
| Future dev không thấy plan investigation | Link rõ trong JSDoc |
