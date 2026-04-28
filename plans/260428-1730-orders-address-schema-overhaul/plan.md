---
title: "Orders update fields & VN address schema overhaul"
description: "Sweep address schema (OLD + NEW VN format) cho 4 tool, mở rộng UpdateAction orders với financial fields, verify-after-update cho silent-drop"
status: completed
priority: P2
branch: "main"
tags: [orders, address, schema, mcp]
blockedBy: []
blocks: []
created: "2026-04-28T16:27:18.861Z"
createdBy: "ck:plan"
source: skill
---

# Orders update fields & VN address schema overhaul

## Overview

Fix MCP wrapper để: (1) update được phí vận chuyển + financial fields của order, (2) hỗ trợ cả 2 format địa chỉ Việt Nam (OLD 3-tier pre-2025 + NEW 2-tier post-2025-07-01) trên 4 tool có địa chỉ. Verify-after-update để cảnh báo silent-drop từ backend.

**Brainstorm summary:** `plans/reports/brainstorm-260428-orders-address-schema-overhaul.md`
**Auth scope:** `PANCAKE_API_KEY` only (JWT excluded). `customer_pay_fee` cố ý loại vì api_key bị silent-ignore.
**Mode:** TDD — tests trước impl trong mỗi phase.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | [Pre-flight verification](./phase-00-preflight-verification.md) | Completed |
| 1 | [Shared address schema](./phase-01-shared-address-schema.md) | Completed |
| 2 | [Apply schema to orders-tool](./phase-02-apply-schema-to-orders-tool.md) | Completed |
| 3 | [Apply schema to customers/warehouses/shop-info](./phase-03-apply-schema-to-customers-warehouses-shop-info.md) | Deferred (separate plan) |
| 4 | [Expand UpdateAction order financial fields](./phase-04-expand-updateaction-order-financial-fields.md) | Completed |
| 5 | [Verify-after-update for order updates](./phase-05-verify-after-update-for-order-updates.md) | Completed |
| 6 | [Mark address-lookup broken & docs](./phase-06-mark-address-lookup-broken-docs.md) | Completed |

## Build Order & Dependencies

```
Phase 0 (preflight) ──► Phase 1 (schema) ──► Phase 2 (orders) ──┬──► Phase 4 (financial) ──► Phase 5 (verify)
                                          ├──► Phase 3 (others) │
                                                                └──► Phase 6 (docs)
```

- Phase 0 blocks all (preflight → revise nếu assumption sai)
- Phase 1 blocks Phase 2 & 3 (shared schema)
- Phase 2 blocks Phase 4 (UpdateAction lives in orders-tool)
- Phase 4 blocks Phase 5 (verify only meaningful after fields exposed)
- Phase 6 độc lập (sau Phase 1)

## Success Criteria (plan-level)

- [ ] PUT shipping_fee qua MCP `orders update` apply đúng + verify GET match
- [ ] Tạo order với địa chỉ NEW format (no district) thành công
- [ ] Update địa chỉ OLD → NEW thành công
- [ ] Verify-after-update trả `warnings` array khi field bị silent-drop
- [ ] `bun run build` xanh, `bun test` xanh (cả test cũ + test mới)
- [ ] Existing MCP callers (CreateAction order với OLD format) vẫn chạy không breaking

## Validation Decisions (2026-04-29)

| Q | Decision | Rationale |
|---|---|---|
| Q1 NEW format mutability test | **Defer** Phase 0 A1 → validate ở Phase 2 smoke test | Không có `new_commune_id` valid để test isolated |
| Q2 Phase 3 shape mismatch | **Defer Phase 3 thành plan riêng** nếu shape lệch | Ship core (orders update) trước, không block by P2 |
| Q3a Test location | `tests/` directory (project convention), KHÔNG colocated | Match existing tests/e2e-mcp.test.ts pattern |
| Q4 PUT success:false guard | **Không cần guard thêm** | `parseResponse` (response-parser.ts:16) đã throw khi `success: false` |
| Q5 Branch + flag | Merge thẳng `main`, không feature flag | Verify-after-update đã opt-in qua fragile-fields-only |
| Q6 `new_district_id` | **KHÔNG add** | Cải cách 2025 bỏ cấp huyện; Pancake response không có field này |

## Dependencies

Không có cross-plan dependency. Address-lookup investigation tách plan riêng (chưa tạo).
