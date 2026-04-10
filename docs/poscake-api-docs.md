# Tài liệu API Pancake POS


lưu ý quan trọng: <<<Tự gọi API trên n8n xong lấy Response của mấy cái API thiếu thay vào file>>>

## Giới thiệu

API Pancake POS cho phép bạn truy cập và quản lý thông tin đơn hàng, sản phẩm trong hệ thống của bạn.

### Cấu hình chung

**Base URL Production:**
```
https://pos.pages.fm/api/v1
```

### Xác thực

API sử dụng `api_key` để xác thực. 

**Cách tạo API Key:**
1. Vào giao diện **Cấu hình** → **Cấu hình ứng dụng**
2. Trong khung **API KEY**, click **Thêm mới**

---

## 1. Lấy danh sách đơn hàng

### Endpoint
```
GET /shops/<SHOP_ID>/orders?api_key=<api_key>
```

### Query Parameters

| Parameter | Required | Type | Default | Description | Example |
|-----------|----------|------|---------|-------------|---------|
| `page_size` | false | int | 30 | Số lượng đơn hàng trên mỗi trang | 100 |
| `page_number` | false | int | 1 | Số trang | 1 |
| `search` | false | string | null | Tìm kiếm theo SĐT, tên khách hàng, ghi chú, mã đơn... | "0987654321" |
| `filter_status` | false | array | null | Lọc theo trạng thái đơn hàng | [0, 1] |
| `include_removed` | false | int | null | Bao gồm đơn đã xóa (1: bao gồm, null: không) | 1 |
| `updateStatus` | false | string/int | inserted_at | Lọc đơn hàng theo loại thời gian | "updated_at" |
| `startDateTime` | false | unix timestamp | null | Ngày bắt đầu (unix timestamp) | 1699635600 |
| `endDateTime` | false | unix timestamp | null | Ngày kết thúc (unix timestamp) | 1699722000 |
| `option_sort` | false | string | inserted_at_desc | Thứ tự sắp xếp đơn hàng | "order_valuation_desc" |
| `fields` | false | array | null | Các trường dữ liệu cần trả về | ["id", "bill_phone_number"] |
| `partner_id` | false | array | null | Mã đối tác vận chuyển | [1, 3, 5] |
| `customer_id` | false | uid | null | Mã khách hàng | "b0110315-b102..." |
| `order_sources` | false | array | null | Nguồn đơn hàng [[Mã nguồn, Mã TK nguồn]] | [["-1", "314"], ["-3"]] |
| `is_filter_exclude_source` | false | boolean | false | Loại trừ nguồn đơn hàng | true |

### Bảng updateStatus - Lọc đơn hàng theo thời gian

| Giá trị | Mô tả |
|---------|-------|
| `inserted_at` | Tạo đơn hàng |
| `updated_at` | Cập nhật cuối |
| `partner_inserted_at` | Đẩy đơn sang DVVC |
| `paid_at` | Đối soát |
| `estimate_delivery_date` | Dự kiến nhận hàng |
| `picked_up_at` | DVVC lấy hàng lúc |
| `first_delivery_at` | DVVC giao lần đầu lúc |
| `transfer_proof` | Xác thực chuyển khoản |
| `time_assign_seller` | Phân công nhân viên xử lý |
| `time_assign_care` | Thời điểm phân công NV chăm sóc |
| `time_assign_marketer` | Thời điểm phân công marketer |

### Bảng trạng thái đơn hàng (filter_status)

| Status | Tên trạng thái | Mô tả |
|--------|----------------|-------|
| -1 | Lần cuối cập nhật trạng thái | Lọc theo thời gian cập nhật trạng thái cuối |
| 0 | Mới | Đơn hàng mới tạo |
| 1 | Đã xác nhận | Đơn hàng đã được xác nhận |
| 2 | Đã gửi hàng | Đã giao cho ĐVVC |
| 3 | Đã nhận | Khách đã nhận hàng |
| 4 | Đang trả hàng | Đang trong quá trình hoàn |
| 5 | Đã hoàn | Đã hoàn về kho |
| 8 | Đang đóng hàng | Đang chuẩn bị hàng |
| 9 | Chờ chuyển hàng | Chờ ĐVVC đến lấy |
| 11 | Chờ hàng | Chờ có hàng |
| 12 | Chờ in | Chờ in đơn |
| 13 | Đã in | Đã in đơn |
| 15 | Hoàn 1 phần | Hoàn một phần sản phẩm |
| 16 | Đã thu tiền | Đã thu tiền từ khách |
| 20 | Đã đặt hàng | Đã đặt hàng với NCC |

### Bảng option_sort - Thứ tự sắp xếp

| Giá trị | Mô tả |
|---------|-------|
| `inserted_at_desc` | Thời điểm tạo đơn giảm dần |
| `inserted_at_asc` | Thời điểm tạo đơn tăng dần |
| `last_updated_order_desc` | Thời điểm cập nhật cuối giảm dần |
| `last_updated_order_asc` | Thời điểm cập nhật cuối tăng dần |
| `last_update_status_at_desc` | Thời điểm cập nhật trạng thái giảm dần |
| `last_update_status_at_asc` | Thời điểm cập nhật trạng thái tăng dần |
| `order_valuation_desc` | Giá trị đơn hàng giảm dần |
| `order_valuation_asc` | Giá trị đơn hàng tăng dần |
| `product_quantity_desc` | Số lượng sản phẩm giảm dần |
| `product_quantity_asc` | Số lượng sản phẩm tăng dần |
| `product_name_desc` | Tên sản phẩm giảm dần |
| `product_name_asc` | Tên sản phẩm tăng dần |
| `sub_status_sort_desc` | Cập nhật delay giao hàng giảm dần |
| `sub_status_sort_asc` | Cập nhật delay giao hàng tăng dần |
| `first_undeliverable_at_desc` | Cập nhật giao không thành giảm dần |
| `first_undeliverable_at_asc` | Cập nhật giao không thành tăng dần |
| `customer_sort_desc` | Tên khách hàng giảm dần |
| `customer_sort_asc` | Tên khách hàng tăng dần |
| `estimate_delivery_date_desc` | Dự kiến nhận hàng giảm dần |
| `estimate_delivery_date_asc` | Dự kiến nhận hàng tăng dần |
| `order_source_desc` | Nguồn đơn hàng giảm dần |
| `order_source_asc` | Nguồn đơn hàng tăng dần |

**Response Example:**
```json
<<<Tự gọi API trên n8n xong lấy Response của API đó dán vào đây>>>
```

## 2. Lấy chi tiết đơn hàng

### Endpoint
```
GET /shops/<SHOP_ID>/orders/<ORDER_ID>?api_key=<api_key>
```

### Response Example
```json
<<<Tự gọi API trên n8n xong lấy Response của API đó dán vào đây>>>
```

## 3. Tạo đơn hàng mới

### Endpoint
```
POST /shops/<SHOP_ID>/orders?api_key=<api_key>
```

### Request Body
```json
{
  "bill_full_name": "hoang anh",
  "bill_phone_number": "0999999999",
  "bill_email": "customer@email.com",
  "is_free_shipping": false,
  "received_at_shop": false,
  "page_id": "256469571178082",
  "account": 4,
  "account_name": "facebook321",
  "assigning_seller_id": "340644fc-314d-450e-a45f-33343678cab6",
  "items": [
    {
      "quantity": 1,
      "variation_id": "415040f4-ab63-465e-8699-e9ebfff4c6c7",
      "product_id": "3487e126-b0d9-4dae-89a9-ee60bef2f4e9",
      "discount_each_product": 0,
      "is_bonus_product": false,
      "is_discount_percent": false,
      "is_wholesale": false,
      "one_time_product": false,
      "note": "Ghi chú sản phẩm"
    }
  ],
  "note": "Ghi chú đơn hàng",
  "note_print": "KHÔNG CHO THỬ HÀNG",
  "warehouse_id": "630744ef-4614-4a70-988c-52e6d78c953c",
  "shipping_address": {
    "full_name": "hoang anh",
    "phone_number": "0999999999",
    "address": "123 Nguyễn Văn Cừ",
    "province_id": "221",
    "district_id": "22109", 
    "commune_id": "2210941",
    "country_code": 84,
    "post_code": null
  },
  "shipping_fee": 30000,
  "total_discount": 0,
  "surcharge": 0,
  "custom_id": "Ma0001",
  "customer_pay_fee": false,
  "tags": [2, 3],
  "activated_promotion_advances": [
    {
      "promotion_advance_id": "fb056b32-9cf6-4c5a-92de-0eb94db71121",
      "is_activated": true
    }
  ],
  "activated_combo_products": [
    {
      "combo_product_id": 430000823,
      "quantity_combo_activated": 1
    }
  ],
  "arrange_shipment_marketplace": true,
  "pick_up_method": "pick_up",
  "picking_shif_marketplace": "closest"
}
```

### Request Parameters

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `bill_full_name` | true | string | Tên người mua |
| `bill_phone_number` | true | string | SĐT người mua |
| `bill_email` | false | string | Email người mua |
| `is_free_shipping` | false | boolean | Miễn phí vận chuyển |
| `received_at_shop` | false | boolean | Nhận tại shop |
| `page_id` | false | string | ID trang Facebook |
| `account` | false | int/string | Mã tài khoản nguồn |
| `account_name` | false | string | Tên tài khoản nguồn |
| `assigning_seller_id` | false | string | ID nhân viên phụ trách |
| `items` | true | array | Danh sách sản phẩm |
| `items[].quantity` | true | int | Số lượng |
| `items[].variation_id` | true | string | ID mẫu mã |
| `items[].product_id` | true | string | ID sản phẩm |
| `items[].discount_each_product` | false | number | Giảm giá mỗi sản phẩm |
| `items[].is_bonus_product` | false | boolean | Sản phẩm tặng kèm |
| `items[].note` | false | string | Ghi chú sản phẩm |
| `note` | false | string | Ghi chú đơn hàng |
| `note_print` | false | string | Ghi chú in trên đơn |
| `warehouse_id` | true | string | ID kho xuất hàng |
| `shipping_address` | true | object | Địa chỉ giao hàng |
| `shipping_address.full_name` | true | string | Tên người nhận |
| `shipping_address.phone_number` | true | string | SĐT người nhận |
| `shipping_address.address` | true | string | Địa chỉ chi tiết |
| `shipping_address.province_id` | true | string | Mã tỉnh/thành |
| `shipping_address.district_id` | true | string | Mã quận/huyện |
| `shipping_address.commune_id` | true | string | Mã phường/xã |
| `shipping_fee` | false | number | Phí vận chuyển |
| `total_discount` | false | number | Tổng giảm giá |
| `surcharge` | false | number | Phụ thu |
| `custom_id` | false | string | Mã đơn tùy chỉnh |
| `customer_pay_fee` | false | boolean | Khách trả phí ship |
| `tags` | false | array | Tags đơn hàng |
| `activated_promotion_advances` | false | array | Khuyến mãi áp dụng |
| `activated_combo_products` | false | array | Combo sản phẩm |

### Response
```json
{
  "data": {
    "id": 1418,
    "bill_full_name": "hoang anh",
    "status": 0,
    "total_price": 100000,
    "shipping_fee": 30000,
    "cod": 130000
  },
  "success": true
}
```

## 4. Cập nhật đơn hàng

### Endpoint
```
PUT /shops/<SHOP_ID>/orders/<ORDER_ID>?api_key=<api_key>
```

### Request Body
Tương tự như tạo đơn hàng, nhưng chỉ gửi các trường cần cập nhật.

```json
{
  "status": 1,
  "shipping_address": {
    "full_name": "Nguyễn Văn A",
    "phone_number": "0987654321",
    "address": "456 Lê Lợi",
    "province_id": "101",
    "district_id": "10101",
    "commune_id": "1010101"
  },
  "note": "Giao giờ hành chính",
  "tags": [2, 3, 13]
}
```

### Lưu ý khi cập nhật
- Không thể cập nhật đơn hàng đã gửi sang ĐVVC (status >= 2)
- Không thể thay đổi items sau khi đơn đã xác nhận (status >= 1)
- Cập nhật địa chỉ sẽ tự động tính lại phí ship

## 5. Xóa đơn hàng

### Endpoint
```
DELETE /shops/<SHOP_ID>/orders/<ORDER_ID>?api_key=<api_key>
```

### Response
```json
{
  "success": true,
  "message": "Xóa đơn hàng thành công"
}
```

### Lưu ý
- Chỉ có thể xóa đơn hàng ở trạng thái Mới (status = 0)
- Đơn hàng đã gửi ĐVVC không thể xóa

## 6. Lấy danh sách đơn đổi/trả hàng

### Endpoint
```
GET /shops/<SHOP_ID>/order-returns?api_key=<api_key>
```

### Query Parameters
Tương tự như lấy danh sách đơn hàng

### Response Example
```json
{
  "data": [
    {
      "id": 1403,
      "display_id": 636,
      "status": 0,
      "status_name": "new",
      "order_id": 109503,
      "order_id_to_returned": 109502,
      "returned_fee": 0,
      "discount": 0,
      "discount_from_order_to_returned": 0,
      "bill_full_name": "HUy",
      "bill_phone_number": "0377666434",
      "returned_items": [
        {
          "id": 1423,
          "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
          "variation_id": "76887a5b-8a27-472c-a15a-661ea59434dd",
          "returned_quantity": 1,
          "variation_info": {
            "name": "Áo thời trang Nam Pari",
            "retail_price": 500000
          }
        }
      ],
      "order": {
        "id": 109503,
        "status": 0,
        "cod": -80000,
        "exchange_payment": 500000,
        "is_exchange_order": false
      },
      "order_to_returned": {
        "id": 109502,
        "status": 3,
        "cod": 1020000,
        "is_exchange_order": true
      },
      "inserted_at": "2024-04-25T08:34:50",
      "updated_at": "2024-04-25T08:34:50"
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 636,
  "total_pages": 22,
  "success": true
}
```

## 7. Tạo đơn đổi/trả hàng

### Endpoint
```
POST /shops/<SHOP_ID>/order-returns?api_key=<api_key>
```

### Request Body
```json
{
  "order_id_to_returned": 109502,
  "returned_items": [
    {
      "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
      "variation_id": "76887a5b-8a27-472c-a15a-661ea59434dd",
      "returned_quantity": 1
    }
  ],
  "discount": 0,
  "returned_fee": 0,
  "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
  "is_exchange": true,
  "exchange_items": [
    {
      "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
      "variation_id": "23f91ea1-5cb8-46a1-a8a6-e3819af9abad",
      "quantity": 2
    }
  ]
}
```

## 8. Hẹn gọi lại cho đơn hàng

### Endpoint
```
POST /shops/<SHOP_ID>/order-call-later?api_key=<api_key>
```

### Request Body
```json
{
  "order_call_later": {
    "status": 0,
    "need_notify_users": ["cee3c05e-5f85-43c4-b27e-889b99c50097"],
    "notice_created": "Gọi lại xác nhận",
    "needs_call_at": "2024-08-29T05:50:31.700Z",
    "phone_number": "0929911922",
    "order_ids": ["106703"]
  }
}
```

### Request Parameters

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `status` | true | int | Trạng thái (0: Chưa gọi, 1: Đã gọi) |
| `need_notify_users` | true | array | Danh sách user ID cần thông báo |
| `notice_created` | true | string | Nội dung nhắc nhở |
| `needs_call_at` | true | datetime | Thời gian cần gọi |
| `phone_number` | true | string | Số điện thoại |
| `order_ids` | true | array | Danh sách ID đơn hàng |

## 9. Lấy danh sách kho hàng

### Endpoint
```
GET /shops/<SHOP_ID>/warehouses?api_key=<api_key>
```

### Response Example
```json
{
  "data": [
    {
      "id": "b4cb5897-6e56-4581-96cc-2f12677c7bd8",
      "name": "Kho chính",
      "phone_number": "0999999999",
      "address": "123 ABC",
      "province_id": "717",
      "district_id": "71705",
      "commune_id": "7170510",
      "full_address": "123 ABC, Xã Bình Trung, Huyện Châu Đức, Bà Rịa-Vũng Tàu",
      "allow_create_order": true,
      "custom_id": null
    }
  ],
  "success": true
}
```

## 10. Gửi đơn sang đối tác vận chuyển

### Endpoint
```
POST /shops/<SHOP_ID>/orders/<ORDER_ID>/send-to-partner?api_key=<api_key>
```

### Request Body
```json
{
  "partner_id": 5,
  "customer_pay_fee": false,
  "note_print": "KHÔNG CHO THỬ HÀNG",
  "service_type_id": 2,
  "pick_shift": [1],
  "required_note": "CHOXEMHANGKHONGTHU"
}
```

### Request Parameters

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `partner_id` | true | int | ID đối tác vận chuyển |
| `customer_pay_fee` | false | boolean | Khách trả phí ship |
| `note_print` | false | string | Ghi chú in trên đơn |
| `service_type_id` | false | int | Loại dịch vụ (2: tiêu chuẩn) |
| `pick_shift` | false | array | Ca lấy hàng |
| `required_note` | false | string | Yêu cầu khi giao |

## 11. In đơn hàng

### Endpoint
```
GET /shops/<SHOP_ID>/orders/<ORDER_ID>/print?api_key=<api_key>&template=<template_type>
```

### Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `template` | false | string | Mẫu in (default/a5/label) |

### Response
Trả về file PDF để in

## 12. Thống kê đơn hàng

### Endpoint
```
GET /shops/<SHOP_ID>/orders/statistics?api_key=<api_key>
```

### Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `start_date` | true | unix timestamp | Ngày bắt đầu |
| `end_date` | true | unix timestamp | Ngày kết thúc |
| `group_by` | false | string | Nhóm theo (date/status/source) |

### Response Example
```json
{
  "data": {
    "summary": {
      "total_orders": 1250,
      "total_revenue": 125000000,
      "total_profit": 45000000,
      "average_order_value": 100000
    },
    "by_status": [
      {"status": 0, "count": 50, "revenue": 5000000},
      {"status": 3, "count": 1000, "revenue": 100000000}
    ],
    "by_date": [
      {"date": "2024-01-01", "orders": 42, "revenue": 4200000},
      {"date": "2024-01-02", "orders": 38, "revenue": 3800000}
    ]
  },
  "success": true
}
```

## Mã nguồn đơn hàng (order_sources)

| Mã | Nguồn |
|----|-------|
| -1 | Facebook |
| -2 | Website |
| -3 | Shopee |
| -4 | Lazada |
| -5 | Tiki |
| -6 | Sendo |
| -7 | TikTok Shop |
| -8 | Zalo |
| -9 | Instagram |
| -10 | Khác |

## Webhook Events

Khi có thay đổi về đơn hàng, hệ thống sẽ gửi POST request đến Webhook URL đã cấu hình.

### Order Created
```json
{
  "event": "order.created",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 1418,
    "status": 0,
    "total_price": 100000
  }
}
```

### Order Updated
```json
{
  "event": "order.updated",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 1418,
    "status": 1,
    "changes": {
      "status": {"old": 0, "new": 1}
    }
  }
}
```

### Order Status Changed
```json
{
  "event": "order.status_changed",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 1418,
    "old_status": 0,
    "new_status": 1,
    "editor_id": "cee3c05e-5f85-43c4-b27e-889b99c50097"
  }
}
```

## Best Practices

1. **Xử lý đơn hàng theo batch**: Khi cần xử lý nhiều đơn, sử dụng pagination và xử lý từng batch 100-200 đơn.

2. **Caching thông tin**: Cache thông tin ít thay đổi như danh sách kho, tags, nhân viên.

3. **Retry logic**: Implement retry với exponential backoff cho các request bị lỗi 5xx.

4. **Webhook reliability**: 
   - Verify webhook signature nếu có
   - Respond với 200 OK ngay lập tức
   - Xử lý async để tránh timeout

5. **Rate limiting**: Không gửi quá 60 requests/phút cho cùng một endpoint.

6. **Error handling**: Luôn kiểm tra field `success` và xử lý các mã lỗi phù hợp.

## Mã lỗi thường gặp

| Code | Message | Giải pháp |
|------|---------|-----------|
| 400 | Invalid order status | Kiểm tra trạng thái đơn hàng hiện tại |
| 404 | Order not found | Kiểm tra ORDER_ID |
| 422 | Invalid shipping address | Kiểm tra province_id, district_id, commune_id |
| 429 | Rate limit exceeded | Giảm tần suất request |
| 500 | Internal server error | Retry sau vài giây |

---

## 2. API Sản phẩm

### 2.1. Lấy danh sách sản phẩm

**Endpoint:**
```
GET /shops/<SHOP_ID>/products?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `page_size` | false | int | 30 | Số lượng sản phẩm trên mỗi trang |
| `page_number` | false | int | 1 | Số trang |
| `search` | false | string | null | Tìm kiếm theo tên, mã sản phẩm, barcode |
| `category_ids` | false | array | null | Lọc theo danh mục. VD: `[1290021044, 201250699]` |
| `is_published` | false | boolean | null | Lọc sản phẩm đã xuất bản |
| `is_hidden` | false | boolean | null | Lọc sản phẩm ẩn/hiện |
| `tag_ids` | false | array | null | Lọc theo tags. VD: `[193, 51]` |
| `supplier_product_ids` | false | array | null | Lọc theo nhà cung cấp |
| `brand_id` | false | string | null | Lọc theo thương hiệu |
| `warehouse_id` | false | string | null | Lọc theo kho hàng |
| `min_price` | false | number | null | Giá tối thiểu |
| `max_price` | false | number | null | Giá tối đa |
| `min_quantity` | false | number | null | Tồn kho tối thiểu |
| `max_quantity` | false | number | null | Tồn kho tối đa |

**Response Example:**
```json
{
  "data": [
    {
      "id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
      "name": "Áo thời trang Nam Pari",
      "custom_id": "ANPR",
      "display_id": 12392,
      "type": "product",
      "image": null,
      "images": ["https://example.com/product.jpg"],
      "description": null,
      "note_product": "Ghi chú sản phẩm",
      "is_published": true,
      "is_hidden": false,
      "brand_id": "a205de96-1d36-443e-9dd8-5f12f1b26909",
      "category_ids": [1290021044, 201250699],
      "categories": [
        {
          "id": 1290021044,
          "name": "Áo nam"
        },
        {
          "id": 201250699,
          "name": "Thời trang"
        }
      ],
      "tags": [
        {
          "id": 193,
          "name": "Mùa hè"
        },
        {
          "id": 51,
          "name": "Hot trend"
        }
      ],
      "supplier_product_ids": [293],
      "product_links": ["www.product.com", "google.com.vn"],
      "product_attributes": [
        {
          "id": "56e0ac18-3bd0-47ac-91ba-0f4056326c1d",
          "name": "Màu",
          "values": ["Đen", "Trắng", "Đỏ"]
        },
        {
          "id": "50c8ba70-db9a-40e0-8198-af2237335bf2",
          "name": "Size",
          "values": ["S", "M", "L", "XL"]
        }
      ],
      "variations": [
        {
          "id": "76887a5b-8a27-472c-a15a-661ea59434dd",
          "custom_id": "Nam Pari TX",
          "display_id": 1,
          "barcode": "12392-4",
          "name": "Áo thời trang Nam Pari",
          "detail": "mau: trang, size: X",
          "fields": [
            {
              "id": "56e0ac18-3bd0-47ac-91ba-0f4056326c1d",
              "name": "mau",
              "value": "trang",
              "keyValue": "TRANG"
            },
            {
              "id": "50c8ba70-db9a-40e0-8198-af2237335bf2",
              "name": "size",
              "value": "X",
              "keyValue": "X"
            }
          ],
          "images": ["https://example.com/variation.jpg"],
          "weight": 700,
          "retail_price": 200000,
          "price_at_counter": 180000,
          "wholesale_price": 150000,
          "last_imported_price": 100000,
          "is_hidden": false,
          "is_locked": false,
          "is_sell_negative_variation": true,
          "remain_quantity": 968,
          "total_quantity": 1246,
          "defect_quantity": 15,
          "variations_warehouses": [
            {
              "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
              "warehouse_name": "Kho mặc định",
              "remain_quantity": 968,
              "total_quantity": 1246,
              "actual_remain_quantity": 1170,
              "available_quantity": 950,
              "pending_quantity": 18,
              "defect_quantity": 15,
              "avg_price": 100000,
              "batch_position": "lô 1",
              "shelf_position": "1.2"
            }
          ],
          "measure_info": {
            "exchange_value": 30,
            "measure_id": 61
          },
          "inserted_at": "2023-05-17T08:46:39",
          "updated_at": "2024-11-15T02:32:51"
        }
      ],
      "warranty_period": 12,
      "lifecycle_days": 365,
      "limit_quantity_to_warn": 10,
      "warning_by_variation": true,
      "inserted_at": "2023-01-27T07:55:09",
      "updated_at": "2024-11-15T07:44:17",
      "creator_id": "cee3c05e-5f85-43c4-b27e-889b99c50097"
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 1406,
  "total_pages": 47,
  "success": true
}
```

### 2.2. Lấy chi tiết sản phẩm

**Endpoint:**
```
GET /shops/<SHOP_ID>/products/<PRODUCT_ID>?api_key=<api_key>
```

**Response:** Trả về thông tin chi tiết của sản phẩm tương tự như trong danh sách

### 2.3. Tạo sản phẩm mới

**Endpoint:**
```
POST /shops/<SHOP_ID>/products?api_key=<api_key>
```

**Request Body:**
```json
{
  "product": {
    "name": "Ao so mi nam",
    "custom_id": "PCUSTOMID",
    "type": "product",
    "description": "Mô tả sản phẩm",
    "note_product": "Ghi chú sản phẩm",
    "category_ids": [1290021044, 201250699],
    "tags": [193, 51],
    "brand_id": "a205de96-1d36-443e-9dd8-5f12f1b26909",
    "supplier_product_ids": [293],
    "product_links": ["www.product.com"],
    "is_published": true,
    "weight": 1,
    "warranty_period": 12,
    "lifecycle_days": 365,
    "limit_quantity_to_warn": 10,
    "warning_by_variation": false,
    "product_attributes": [
      {
        "name": "Màu",
        "values": ["Đen", "Trắng", "Đỏ"]
      },
      {
        "name": "Size",
        "values": ["S", "M", "L"]
      }
    ],
    "variations": [
      {
        "fields": [
          {"name": "Màu", "value": "Trắng"},
          {"name": "Size", "value": "M"}
        ],
        "custom_id": "VCUSTOMID",
        "barcode": "BARCODE123",
        "images": ["https://example.com/image.jpg"],
        "weight": 300,
        "retail_price": 140000,
        "price_at_counter": 123000,
        "wholesale_price": 100000,
        "last_imported_price": 30000,
        "is_hidden": false,
        "is_sell_negative_variation": false
      }
    ],
    "variations_warehouses": [
      {
        "variation_custom_id": "VCUSTOMID",
        "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
        "remain_quantity": 10,
        "batch_position": "lô 1",
        "shelf_position": "1.2"
      }
    ]
  }
}
```

**Request Parameters:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `product.name` | true | string | Tên sản phẩm |
| `product.custom_id` | false | string | Mã sản phẩm tùy chỉnh |
| `product.type` | false | string | Loại sản phẩm (mặc định: "product") |
| `product.description` | false | string | Mô tả chi tiết |
| `product.note_product` | false | string | Ghi chú nội bộ |
| `product.category_ids` | false | array | Mảng ID danh mục |
| `product.tags` | false | array | Mảng ID tags |
| `product.brand_id` | false | string | ID thương hiệu |
| `product.supplier_product_ids` | false | array | Mảng ID nhà cung cấp |
| `product.product_links` | false | array | Links liên quan |
| `product.is_published` | false | boolean | Trạng thái xuất bản |
| `product.weight` | false | number | Trọng lượng sản phẩm (gram) |
| `product.warranty_period` | false | number | Thời gian bảo hành (tháng) |
| `product.lifecycle_days` | false | number | Vòng đời sản phẩm (ngày) |
| `product.limit_quantity_to_warn` | false | number | Ngưỡng cảnh báo tồn kho |
| `product.warning_by_variation` | false | boolean | Cảnh báo theo từng mẫu mã |
| `product.product_attributes` | false | array | Thuộc tính sản phẩm |
| `product.variations` | true | array | Danh sách mẫu mã |
| `product.variations[].fields` | true | array | Thuộc tính của mẫu mã |
| `product.variations[].custom_id` | false | string | Mã mẫu mã tùy chỉnh |
| `product.variations[].barcode` | false | string | Mã vạch |
| `product.variations[].images` | false | array | Ảnh của mẫu mã |
| `product.variations[].weight` | false | number | Trọng lượng (gram) |
| `product.variations[].retail_price` | true | number | Giá bán lẻ |
| `product.variations[].price_at_counter` | false | number | Giá tại quầy |
| `product.variations[].wholesale_price` | false | number | Giá sỉ |
| `product.variations[].last_imported_price` | false | number | Giá nhập cuối |
| `product.variations[].is_hidden` | false | boolean | Ẩn/hiện mẫu mã |
| `product.variations[].is_sell_negative_variation` | false | boolean | Cho phép bán âm |
| `product.variations_warehouses` | false | array | Tồn kho theo kho |

### 2.4. Cập nhật sản phẩm

**Endpoint:**
```
PUT /shops/<SHOP_ID>/products/<PRODUCT_ID>?api_key=<api_key>
```

**Request Body:**
```json
{
  "product": {
    "name": "Ao so mi nam - Updated",
    "category_ids": [1290021044, 201250699],
    "note_product": "Ghi chú sản phẩm đã cập nhật",
    "product_attributes": [
      {
        "name": "Màu",
        "values": ["Đen", "Trắng", "Đỏ", "Xanh"]
      },
      {
        "name": "Size",
        "values": ["S", "M", "L", "XL"]
      }
    ],
    "variations": [
      {
        "id": "3c3aca82-030e-4708-a75b-b2eaf538a2f5",
        "fields": [
          {"name": "Màu", "value": "Trắng"},
          {"name": "Size", "value": "M"}
        ],
        "images": [],
        "retail_price": 150000,
        "price_at_counter": 135000,
        "is_hidden": false
      },
      {
        "fields": [
          {"name": "Màu", "value": "Xanh"},
          {"name": "Size", "value": "L"}
        ],
        "images": ["https://example.com/new-variation.jpg"],
        "custom_id": "VCUSTOMID2",
        "barcode": "BARCODE456",
        "retail_price": 160000,
        "price_at_counter": 145000,
        "is_hidden": false
      }
    ],
    "tags": [193, 51, 100],
    "variations_warehouses": [
      {
        "variation_id": "3c3aca82-030e-4708-a75b-b2eaf538a2f5",
        "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
        "remain_quantity": 15,
        "batch_position": "lô 2",
        "shelf_position": "2.3"
      }
    ]
  }
}
```

**Lưu ý khi cập nhật:**
- Với mẫu mã (variations):
  - Nếu có `id`: Cập nhật mẫu mã hiện tại
  - Nếu không có `id`: Tạo mẫu mã mới
- Các mẫu mã không được gửi trong request sẽ được giữ nguyên
- Để xóa mẫu mã, cần gọi API riêng hoặc set `is_removed: true`

### 2.5. Xóa sản phẩm

**Endpoint:**
```
DELETE /shops/<SHOP_ID>/products/<PRODUCT_ID>?api_key=<api_key>
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa sản phẩm thành công"
}
```

### 2.6. Lấy danh sách mẫu mã (variations)

**Endpoint:**
```
GET /shops/<SHOP_ID>/products/variations?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `page_size` | false | int | 30 | Số lượng mẫu mã trên mỗi trang |
| `page_number` | false | int | 1 | Số trang |
| `search` | false | string | null | Tìm kiếm theo tên, mã, barcode |
| `product_id` | false | string | null | Lọc theo ID sản phẩm |
| `warehouse_id` | false | string | null | Lọc theo kho |
| `min_quantity` | false | number | null | Tồn kho tối thiểu |
| `max_quantity` | false | number | null | Tồn kho tối đa |

**Response Example:**
```json
{
  "data": [
    {
      "id": "a87cf64d-4da8-4f88-8636-9e543ac7299f",
      "product_id": "83700e88-66ed-47ed-9cce-3c614339b771",
      "custom_id": "A483",
      "display_id": "A483",
      "barcode": "3143-1",
      "fields": [],
      "images": ["https://example.com/variation.jpg"],
      "weight": 0,
      "retail_price": 135000,
      "retail_price_after_discount": 135000,
      "price_at_counter": 0,
      "wholesale_price": [],
      "last_imported_price": 65000,
      "total_purchase_price": 260000,
      "remain_quantity": 4,
      "is_hidden": false,
      "is_locked": false,
      "is_removed": null,
      "is_sell_negative_variation": false,
      "inserted_at": "2025-06-24T03:24:15.065016",
      "product": {
        "id": "83700e88-66ed-47ed-9cce-3c614339b771",
        "name": "A483",
        "display_id": "A483",
        "image": null,
        "categories": [],
        "tags": [],
        "is_published": null,
        "note_product": ""
      },
      "variations_warehouses": [
        {
          "warehouse_id": "b9adb090-f508-4ec6-a9e4-386b1f91fca9",
          "actual_remain_quantity": 19,
          "remain_quantity": 4,
          "total_quantity": 19,
          "pending_quantity": 0,
          "returning_quantity": 0,
          "waiting_quantity": 0,
          "batch_position": null,
          "shelf_position": null,
          "selling_avg": null
        }
      ],
      "bonus_variations": [],
      "composite_products": [],
      "videos": null,
      "webcms_info": null
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 1406,
  "total_pages": 47,
  "success": true
}
```

### 2.7. Nhập hàng (Purchase)

**Endpoint:**
```
POST /shops/<SHOP_ID>/purchases?api_key=<api_key>
```

**Request Body:**
```json
{
  "purchase": {
    "supplier_products_id": 293,
    "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
    "status": 0,
    "received_at": "2023-09-21T00:00:00",
    "note": "Nhập hàng để bán",
    "transport_fee": 10000,
    "discount": 10000,
    "prepaid_debt": 100000,
    "auto_create_debts": true,
    "not_create_transaction": false,
    "tags": [1],
    "images": ["https://example.com/bill.jpg"],
    "items": [
      {
        "variation_id": "20e7d183-c70c-445e-8ce2-4d7e3a378e34",
        "quantity": 10,
        "imported_price": 200000,
        "gross_price": 200000,
        "discount": 10000,
        "note_purchase": "áo nam thời trang",
        "selling_status": "good"
      }
    ]
  }
}
```

**Request Parameters:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `purchase.supplier_products_id` | true | int | ID nhà cung cấp |
| `purchase.warehouse_id` | true | string | ID kho nhập |
| `purchase.status` | true | int | Trạng thái phiếu nhập (0: Chưa duyệt, 1: Đã duyệt) |
| `purchase.received_at` | true | datetime | Ngày nhập hàng |
| `purchase.note` | false | string | Ghi chú |
| `purchase.transport_fee` | false | number | Phí vận chuyển |
| `purchase.discount` | false | number | Chiết khấu |
| `purchase.prepaid_debt` | false | number | Số tiền đã trả |
| `purchase.auto_create_debts` | false | boolean | Tự động tạo công nợ |
| `purchase.not_create_transaction` | false | boolean | Không tạo giao dịch |
| `purchase.tags` | false | array | Tags phiếu nhập |
| `purchase.images` | false | array | Ảnh hóa đơn |
| `purchase.items` | true | array | Danh sách sản phẩm nhập |
| `purchase.items[].variation_id` | true | string | ID mẫu mã |
| `purchase.items[].quantity` | true | number | Số lượng |
| `purchase.items[].imported_price` | true | number | Giá nhập |
| `purchase.items[].gross_price` | false | number | Giá gốc |
| `purchase.items[].discount` | false | number | Chiết khấu |
| `purchase.items[].note_purchase` | false | string | Ghi chú |
| `purchase.items[].selling_status` | false | string | Tình trạng hàng (good/bad) |

### 2.8. Xuất hàng

**Endpoint:**
```
POST /shops/<SHOP_ID>/export-lists?api_key=<api_key>
```

**Request Body:**
```json
{
  "export_list": {
    "supplier_products_id": 169,
    "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
    "type": 1,
    "status": 0,
    "note": "Xuất hàng lỗi",
    "shop_id": 20,
    "change_inserted_at": true,
    "inserted_at": 1651683600,
    "images": ["https://example.com/export.jpg"],
    "export_items": [
      {
        "variation_id": "29044dcf-2f4c-492f-a0a9-e447b20e21da",
        "quantity": 1,
        "imported_price": 100000
      }
    ]
  }
}
```

**Request Parameters:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `export_list.supplier_products_id` | false | int | ID nhà cung cấp |
| `export_list.warehouse_id` | true | string | ID kho xuất |
| `export_list.type` | true | int | Loại xuất (1: Xuất hủy, 2: Xuất trả NCC) |
| `export_list.status` | true | int | Trạng thái (0: Chưa duyệt, 1: Đã duyệt) |
| `export_list.note` | false | string | Ghi chú |
| `export_list.export_items` | true | array | Danh sách sản phẩm xuất |

### 2.9. Chuyển kho

**Endpoint:**
```
POST /shops/<SHOP_ID>/warehouse-transfers?api_key=<api_key>
```

**Request Body:**
```json
{
  "transfer": {
    "from_warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
    "to_warehouse_ids": ["229102e4-39c3-4523-bd57-4ed0a45a85ba"],
    "shipping_fee": 20000,
    "note": "Chuyển kho do cân bằng tồn",
    "inserted_at": "2025-03-11T09:24:42",
    "images": ["https://example.com/transfer.jpg"],
    "items": [
      {
        "variation_id": "20e7d183-c70c-445e-8ce2-4d7e3a378e34",
        "quantity": 5
      }
    ]
  }
}
```

### 2.10. Kiểm kho

**Endpoint:**
```
POST /shops/<SHOP_ID>/stocktakings?api_key=<api_key>
```

**Request Body:**
```json
{
  "stocktaking": {
    "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
    "note": "Kiểm hàng tồn định kỳ",
    "status": 0,
    "stocktaking_at": "2023-10-11T10:38:34",
    "stocktaking_by": "category_ids",
    "stocktaking_by_value": ["1315"],
    "items": [
      {
        "variation_id": "20e7d183-c70c-445e-8ce2-4d7e3a378e34",
        "changed_quantity": -1
      }
    ]
  }
}
```

**Request Parameters:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `stocktaking.warehouse_id` | true | string | ID kho kiểm |
| `stocktaking.note` | false | string | Ghi chú |
| `stocktaking.status` | true | int | Trạng thái (0: Chưa duyệt, 1: Đã duyệt) |
| `stocktaking.stocktaking_at` | false | datetime | Thời gian kiểm |
| `stocktaking.stocktaking_by` | false | string | Kiểm theo (category_ids/supplier_ids/brand_ids) |
| `stocktaking.stocktaking_by_value` | false | array | Giá trị lọc |
| `stocktaking.items` | true | array | Danh sách sản phẩm kiểm |
| `stocktaking.items[].variation_id` | true | string | ID mẫu mã |
| `stocktaking.items[].changed_quantity` | true | int | Số lượng chênh lệch (+/-) |

### 2.11. Lấy lịch sử xuất nhập kho

**Endpoint:**
```
GET /shops/<SHOP_ID>/inventory_histories?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `variation_id` | false | string | Mã mẫu mã |
| `warehouse_id` | false | string | Mã kho |
| `start_date` | false | unix timestamp | Ngày bắt đầu |
| `end_date` | false | unix timestamp | Ngày kết thúc |
| `table_name` | false | string | Loại giao dịch (orders/purchases/warehouse_transfers...) |
| `page_size` | false | int | Số lượng trên trang |
| `page_number` | false | int | Số trang |

**Response Example:**
```json
{
  "data": [
    {
      "id": 186206,
      "variation_id": "76887a5b-8a27-472c-a15a-661ea59434dd",
      "warehouse_id": "c0b42d67-7b53-48b7-9119-29c5b6e18d19",
      "quantity": -1,
      "remain_quantity": 3387,
      "avg_price": 100000,
      "type": "Tạo phiếu chuyển kho #433",
      "table_name": "warehouse_transfers",
      "ref_display_id": "433",
      "editor_id": "cee3c05e-5f85-43c4-b27e-889b99c50097",
      "inserted_at": "2024-06-10T10:03:53.015323",
      "current_inventory": [
        {
          "id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
          "name": "Kho mặc định",
          "remain_quantity": 968,
          "total_quantity": 1246,
          "actual_remain_quantity": 1170,
          "avg_price": 242295.35
        }
      ],
      "variation_now": {
        "id": "76887a5b-8a27-472c-a15a-661ea59434dd",
        "barcode": null,
        "display_id": "Nam Pari TX",
        "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
        "retail_price": 200000,
        "last_imported_price": 100000,
        "weight": 700,
        "is_hidden": false,
        "is_locked": false,
        "is_sell_negative_variation": true,
        "fields": [
          {
            "id": "56e0ac18-3bd0-47ac-91ba-0f4056326c1d",
            "name": "Color",
            "value": "WHITE",
            "keyValue": "WHITE"
          }
        ],
        "images": ["https://example.com/product.jpg"]
      },
      "warehouse": {
        "id": "c0b42d67-7b53-48b7-9119-29c5b6e18d19",
        "name": "kho Malay",
        "phone_number": "0984565082",
        "full_address": "22, Jalan Kiara 6, Pekan Nenas, Johor, 81500",
        "custom_id": null,
        "ffm_id": null
      }
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 1,
  "total_pages": 1,
  "success": true
}
```

### 2.12. Lấy danh sách combo sản phẩm

**Endpoint:**
```
GET /shops/<SHOP_ID>/combo-products?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `page_size` | false | int | 30 | Số lượng combo trên mỗi trang |
| `page_number` | false | int | 1 | Số trang |
| `search` | false | string | null | Tìm kiếm theo tên combo |
| `is_variation` | false | boolean | null | Lọc combo theo mẫu mã |
| `start_time` | false | datetime | null | Thời gian bắt đầu |
| `end_time` | false | datetime | null | Thời gian kết thúc |

**Response Example:**
```json
{
  "data": [
    {
      "id": 282,
      "name": "combo 1",
      "custom_id": null,
      "snippet": null,
      "currency": "VND",
      "discount_amount": 10000,
      "discount_by_percent": 0,
      "max_discount_by_percent": 0,
      "is_use_percent": false,
      "is_free_shipping": true,
      "is_value_combo": false,
      "is_variation": true,
      "value_combo": 0,
      "start_time": "2024-06-18T17:00:00",
      "end_time": "2024-07-19T16:59:59",
      "order_types": ["all"],
      "order_sources": [
        {
          "key": "-2",
          "account": null,
          "page_id": null
        }
      ],
      "shop_id": 20,
      "inserted_at": "2024-06-19T10:42:33",
      "updated_at": "2024-06-19T10:42:33",
      "bonus_products": [
        {
          "product_id": "3116c7bc-d206-4c6c-a6e9-13b7999a543a",
          "variation_id": "fd46af68-9c2c-419b-adb6-309cd01a548c",
          "quantity": 1,
          "discount_each_product": 0,
          "price_original": 200000,
          "images": ["https://example.com/bonus.jpg"],
          "key": "fd46af68-9c2c-419b-adb6-309cd01a548c",
          "variation_info": {
            "id": "XXL-yellow",
            "product_id": "áo phông nam",
            "name": "áo phông nam",
            "custom_id": "áo phông nam",
            "retail_price": 0,
            "display_id": 11772,
            "categories": [
              {
                "id": 564,
                "name": "danh muc 1"
              }
            ],
            "tags": [
              {
                "id": 95,
                "note": "thẻ 3. 2"
              }
            ]
          }
        }
      ],
      "variations": [
        {
          "id": "23f91ea1-5cb8-46a1-a8a6-e3819af9abad",
          "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
          "custom_id": "Nam Pari XX",
          "display_id": 2,
          "barcode": null,
          "keyword": "xx",
          "weight": 200,
          "retail_price": 200000,
          "retail_price_after_discount": 200000,
          "retail_price_currency_original": 200000,
          "price_at_counter": 0,
          "wholesale_price": 0,
          "last_imported_price": 100000,
          "images": ["https://example.com/variation.jpg"],
          "remain_quantity": 2651,
          "total_quantity": 3559,
          "defect_quantity": 15,
          "limit_quantity_to_warn": 0,
          "profit_rate": 50,
          "count": 1,
          "is_sell_negative_variation": null,
          "is_removed": null,
          "is_composite": null,
          "cogs": 0,
          "fields": [
            {
              "id": "283d9e1d-c254-4bad-8d69-19be477f2512",
              "name": "Color",
              "value": "BLUE",
              "keyValue": "BLUE"
            }
          ],
          "product": {
            "id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
            "name": "Áo thời trang Nam Pari đơn giản đẹp",
            "custom_id": "ANPR",
            "display_id": 12392,
            "type": "product",
            "brand_id": null,
            "category_ids": [590],
            "categories": [
              {
                "id": 590,
                "name": "Áo Phông"
              }
            ],
            "lifecycle_days": 0,
            "limit_quantity_to_warn": 3,
            "warning_by_variation": false,
            "product_links": ["www.product.com", "google.com.vn"],
            "note_product": null,
            "description": null,
            "inserted_at": "2023-01-27T07:55:09",
            "updated_at": "2024-11-15T07:44:17"
          },
          "variations_warehouses": [
            {
              "id": "313f126b-f690-423e-82b5-939e5a7a72c4",
              "warehouse_id": "f8aef54c-7e19-412c-9109-cae52c45cad0",
              "variation_id": "23f91ea1-5cb8-46a1-a8a6-e3819af9abad",
              "remain_quantity": -1,
              "total_quantity": 0,
              "actual_remain_quantity": 0,
              "available_quantity": 0,
              "pending_quantity": 0,
              "pending_export_quantity": 0,
              "pending_transfer_quantity": 0,
              "returning_quantity": 0,
              "shipping_quantity": 0,
              "transfer_quantity": 0,
              "waitting_quantity": 0,
              "defect_quantity": 0,
              "quantity_in_batch": 0,
              "total_quantity_transfer": 0,
              "avg_price": 100000,
              "shop_id": 20
            }
          ],
          "size": {
            "id": "30bc4d59-f934-4c6b-b6a5-5409289aee32",
            "length": 1,
            "width": 2,
            "height": 3
          },
          "updated_at": "2024-11-15T02:32:51.303603"
        }
      ]
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 3,
  "total_pages": 1,
  "success": true
}
```

### 2.13. Tạo/Cập nhật combo sản phẩm

**Endpoint:**
```
POST /shops/<SHOP_ID>/combo-products?api_key=<api_key>
```

**Request Body:**
```json
{
  "combo_product": {
    "name": "Combo mùa hè",
    "custom_id": "COMBO001",
    "discount_amount": 50000,
    "discount_by_percent": 0,
    "is_use_percent": false,
    "is_free_shipping": true,
    "is_variation": true,
    "start_time": "2024-06-01T00:00:00",
    "end_time": "2024-08-31T23:59:59",
    "order_types": ["all"],
    "order_sources": [
      {
        "key": "-1",
        "account": null,
        "page_id": null
      }
    ],
    "variations": [
      {
        "variation_id": "23f91ea1-5cb8-46a1-a8a6-e3819af9abad",
        "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d"
      }
    ],
    "bonus_products": [
      {
        "product_id": "3116c7bc-d206-4c6c-a6e9-13b7999a543a",
        "variation_id": "fd46af68-9c2c-419b-adb6-309cd01a548c",
        "quantity": 1,
        "discount_each_product": 0
      }
    ]
  }
}
```

### 2.14. Lấy báo cáo tồn kho

**Endpoint:**
```
GET /shops/<SHOP_ID>/inventory-report?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `warehouse_ids` | false | array | Lọc theo kho |
| `category_ids` | false | array | Lọc theo danh mục |
| `supplier_ids` | false | array | Lọc theo nhà cung cấp |
| `brand_ids` | false | array | Lọc theo thương hiệu |
| `min_quantity` | false | number | Tồn kho tối thiểu |
| `max_quantity` | false | number | Tồn kho tối đa |
| `include_hidden` | false | boolean | Bao gồm sản phẩm ẩn |

**Response Example:**
```json
{
  "data": {
    "summary": {
      "total_products": 1406,
      "total_variations": 2853,
      "total_quantity": 45678,
      "total_value": 4567800000,
      "warehouses": [
        {
          "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
          "warehouse_name": "Kho mặc định",
          "total_quantity": 35678,
          "total_value": 3567800000
        }
      ]
    },
    "details": [
      {
        "product_id": "73ec61e2-52e3-41dd-bd24-b7ec1035184d",
        "product_name": "Áo thời trang Nam Pari",
        "variations": [
          {
            "variation_id": "76887a5b-8a27-472c-a15a-661ea59434dd",
            "variation_name": "Nam Pari TX",
            "barcode": "12392-4",
            "warehouses": [
              {
                "warehouse_id": "c52e67ad-d9d0-4276-abe4-e0c9f1f7d2da",
                "warehouse_name": "Kho mặc định",
                "quantity": 968,
                "avg_price": 100000,
                "total_value": 96800000
              }
            ],
            "total_quantity": 968,
            "total_value": 96800000
          }
        ]
      }
    ]
  },
  "success": true
}
```

### 2.15. Import sản phẩm từ file

**Endpoint:**
```
POST /shops/<SHOP_ID>/products/import?api_key=<api_key>
```

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - file: File Excel (.xlsx, .xls) hoặc CSV
  - warehouse_id: ID kho (optional)
  - update_existing: true/false (cập nhật sản phẩm đã tồn tại)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_rows": 100,
    "imported": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "message": "Thiếu tên sản phẩm"
      },
      {
        "row": 25,
        "message": "Mã sản phẩm đã tồn tại"
      }
    ]
  }
}
```

### 2.16. Export sản phẩm

**Endpoint:**
```
GET /shops/<SHOP_ID>/products/export?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `format` | false | string | Định dạng file (excel/csv) |
| `warehouse_id` | false | string | Lọc theo kho |
| `category_ids` | false | array | Lọc theo danh mục |
| `include_inventory` | false | boolean | Bao gồm thông tin tồn kho |

**Response:** File Excel hoặc CSV chứa danh sách sản phẩm

## 3. API Khách hàng

### 3.1. Lấy danh sách khách hàng

**Endpoint:**
```
GET /shops/<SHOP_ID>/customers?api_key=<api_key>
```

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `page_size` | false | int | 30 | Số lượng khách hàng trên mỗi trang |
| `page_number` | false | int | 1 | Số trang |
| `search` | false | string | null | Tìm kiếm theo tên, SĐT, email |
| `tags` | false | array | null | Lọc theo tags |

**Response Example:**
```json
{
  "data": [
    {
      "id": "b0110315-b102-436b-8b3b-ed8d16740327",
      "name": "Trần Thủ độ",
      "phone_numbers": ["0999999999"],
      "emails": ["thudo@gmail.com"],
      "date_of_birth": "1999-09-01",
      "gender": "male",
      "reward_point": 100.5,
      "level": null,
      "order_count": 108,
      "succeed_order_count": 8,
      "purchased_amount": 0,
      "last_order_at": "2020-04-01T10:18:41",
      "referral_code": "1nw4geGA",
      "tags": [],
      "shop_customer_addresses": [
        {
          "id": "0fefd213-7d0c-4d5b-bdbf-35694da80857",
          "full_name": "test",
          "phone_number": "0999999999",
          "full_address": "lê văn lương, Quận Ba Đình, Hà Nội",
          "province_id": "101",
          "district_id": "10101"
        }
      ]
    }
  ],
  "page_number": 1,
  "page_size": 30,
  "total_entries": 3,
  "total_pages": 1,
  "success": true
}
```

### 3.2. Lấy chi tiết khách hàng

**Endpoint:**
```
GET /shops/<SHOP_ID>/customers/<CUSTOMER_ID>?api_key=<api_key>
```

### 3.3. Tạo/Cập nhật khách hàng

**Endpoint:**
```
POST /shops/<SHOP_ID>/customers?api_key=<api_key>
```

**Request Body:**
```json
{
  "customer": {
    "name": "Nguyễn Thị Hằng",
    "gender": "female",
    "emails": ["pancake@gmail.com", "hoang@gmail.com"],
    "phone_numbers": ["0983925966"],
    "date_of_birth": "1995-03-04",
    "reward_point": 20,
    "is_discount_by_level": false,
    "tags": ["Hay hoàn"],
    "is_block": false,
    "assigned_user_id": "cee3c05e-5f85-43c4-b27e-889b99c50097",
    "level_id": "f8dced06-965d-4070-a765-dd8268373f1e",
    "notes": [
      {
        "id": "8a6f5380-4674-44e9-aaf2-40d898d460f5",
        "message": "Khách hàng thân thiết",
        "images": [
          {
            "url": "https://example.com/image.png"
          }
        ]
      }
    ],
    "shop_customer_addresses": [
      {
        "id": "df631f21-3841-4d1c-8204-b85a7ecfce0c",
        "country_code": 84,
        "province_id": "101",
        "district_id": "10113",
        "commune_id": "1011309",
        "address": "190 Cầu Giấy",
        "full_name": "sơn",
        "phone_number": "0972868874"
      }
    ]
  }
}
```

### 3.4. Lấy lịch sử điểm thưởng

**Endpoint:**
```
GET /shops/<SHOP_ID>/customers/<CUSTOMER_ID>/reward-point-history?api_key=<api_key>
```

### 3.5. Thêm ghi chú cho khách hàng

**Endpoint:**
```
POST /shops/<SHOP_ID>/customer-notes?api_key=<api_key>
```

**Request Body:**
```json
{
  "conversation_id": "117967746266487_9306266852780716",
  "page_id": "117967746266487",
  "message": "khách hàng mua nhiều lần",
  "images": [
    {
      "image_data": {
        "height": 225,
        "width": 225
      },
      "name": "iship thai.jpeg",
      "preview_url": "https://example.com/preview.jpg",
      "url": "https://example.com/image.jpg"
    }
  ],
  "order_id": 116947
}
```

---

## 4. API Đối tác vận chuyển

### 4.1. Lấy danh sách đối tác vận chuyển

**Endpoint:**
```
GET /partners?api_key=<api_key>
```

**Response Example:**
```json
{
  "data": [
    {"id": 0, "name": "Snappy"},
    {"id": 1, "name": "Giao hàng tiết kiệm"},
    {"id": 2, "name": "EMS"},
    {"id": 4, "name": "247 Express"},
    {"id": 5, "name": "Giao hàng nhanh"},
    {"id": 15, "name": "J&T"}
  ],
  "success": true
}
```

---

## 5. Webhook

### 5.1. Cấu hình Webhook

1. Vào giao diện **Cấu hình** → **Cấu hình ứng dụng**
2. Trong khung **WEBHOOK URL**, bật ứng dụng và cấu hình:
   - **Webhook URL** (bắt buộc)
   - Email thông báo lỗi
   - Request Headers
   - Dữ liệu:
     - Đơn hàng (POS)
     - Dữ liệu bảng (CRM)
     - Khách hàng (POS, CRM)
     - Tồn kho (POS)

### 5.2. Webhook Đơn hàng

Khi có thay đổi về đơn hàng, hệ thống sẽ gửi POST request đến Webhook URL đã cấu hình.

**Webhook Payload Example:**
```json
{
  "event": "order.created",
  "timestamp": "2020-05-12T04:51:42",
  "data": {
    "id": 1418,
    "bill_full_name": "hoang anh",
    "bill_phone_number": "0999999999",
    "status": 0,
    "status_name": "new",
    "items": [
      {
        "product_id": "3487e126-b0d9-4dae-89a9-ee60bef2f4e9",
        "variation_id": "415040f4-ab63-465e-8699-e9ebfff4c6c7",
        "quantity": 1,
        "retail_price": 100000
      }
    ],
    "total_price": 100000,
    "shipping_fee": 0,
    "shipping_address": {
      "full_address": "aaaaa, Xã Bắc Lý, Huyện Hiệp Hòa, Bắc Giang",
      "province_id": "221",
      "district_id": "22109",
      "commune_id": "2210941"
    }
  }
}
```

### 5.3. Các sự kiện Webhook

| Event | Mô tả |
|-------|-------|
| `order.created` | Đơn hàng mới được tạo |
| `order.updated` | Đơn hàng được cập nhật |
| `order.status_changed` | Trạng thái đơn hàng thay đổi |
| `customer.created` | Khách hàng mới được tạo |
| `customer.updated` | Thông tin khách hàng được cập nhật |
| `inventory.changed` | Tồn kho thay đổi |

---

## 6. Mã lỗi và xử lý lỗi

### Mã lỗi HTTP

| Code | Mô tả |
|------|-------|
| 200 | Thành công |
| 400 | Bad Request - Yêu cầu không hợp lệ |
| 401 | Unauthorized - API key không hợp lệ |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Không tìm thấy tài nguyên |
| 500 | Internal Server Error - Lỗi server |

### Response lỗi

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key không hợp lệ hoặc đã hết hạn"
  }
}
```

---

## 7. Giới hạn và Best Practices

### Rate Limiting
- Tối đa 1000 requests/phút cho mỗi API key
- Tối đa 10000 requests/giờ cho mỗi API key

### Best Practices
1. Luôn kiểm tra field `success` trong response
2. Sử dụng pagination cho các endpoint trả về danh sách
3. Cache dữ liệu ít thay đổi như danh sách tỉnh/thành, quận/huyện
4. Xử lý retry logic cho các request bị lỗi 5xx
5. Log tất cả các request/response để debug
6. Sử dụng webhook để nhận thông báo realtime thay vì polling

---

## 8. Hỗ trợ

Nếu bạn cần hỗ trợ về API, vui lòng liên hệ:
- Email: support@pancake.vn
- Documentation: https://api-docs.pancake.vn