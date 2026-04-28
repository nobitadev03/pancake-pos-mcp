---
phase: 0
title: "Pre-flight verification"
status: pending
priority: P1
effort: "15m"
dependencies: []
---

# Phase 0: Pre-flight verification

## Overview

Verify 3 assumption critical trước khi implement. Nếu sai → revise plan, không patch sau.

## Requirements

**Functional:**
- Confirm PUT order với NEW format address thực sự mutate trên server
- Confirm `customer_pay_fee` consistency across shops với api_key
- Probe rate limit để biết verify-after-update có safe không

## Architecture

Curl-based smoke tests. Không touch codebase. Document findings ở cuối phase này.

## Implementation Steps

### A1. NEW format mutability — DEFERRED to Phase 2 smoke test
Skipped: order 361 không có `new_commune_id` filled, không có ID hợp lệ để test isolated. Validate khi Phase 2 smoke test với data thật. Nếu Phase 2 phát hiện NEW format silent-drop → revert Phase 2 schema, mở plan investigation riêng.

### A2. `customer_pay_fee` cross-shop verify
PUT `{customer_pay_fee: true}` trên ít nhất 2 shop khác nhau via api_key → GET verify.
- Nếu cả 2 shop đều ignore → confirm reject `customer_pay_fee` ở schema (như plan)
- Nếu 1 apply, 1 ignore → đổi sang allow + warning trong description

### A3. Rate limit probe
Loop 30 GET requests trong 10s → đếm 429 hoặc latency spike.
- Nếu rate limited rõ → verify-after-update phải optional, không default-on
- Nếu OK → proceed Phase 5 plan

## Output

Tạo file `plans/260428-1730-orders-address-schema-overhaul/preflight-findings.md` với:
- Each test result (raw response snippet)
- Decision per assumption
- Plan pivots nếu có

## Success Criteria

- [ ] A1 deferred → noted, validate ở Phase 2 smoke
- [ ] A2 chạy → quyết định schema reject / allow `customer_pay_fee`
- [ ] A3 chạy → quyết định verify default-on / opt-in
- [ ] `preflight-findings.md` được tạo
- [ ] Plan files được update nếu cần pivot

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Modify đơn thật khi test | Revert ngay sau verify; chọn đơn `status=0` ít quan trọng |
| Test trên shop chỉ có 1 shop access | Báo user request access hoặc skip A2, document risk |
| Findings âm tính → plan pivot lớn | Phase 0 là chỉ 15m → cost rẻ để biết sớm |
