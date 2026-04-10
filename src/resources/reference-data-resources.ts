import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";

/**
 * Static reference data for Pancake POS, exposed as MCP Resources.
 */

export const ORDER_STATUSES = [
  { status: 0, name: "Mới", description: "New order" },
  { status: 1, name: "Đã xác nhận", description: "Confirmed" },
  { status: 2, name: "Đã gửi hàng", description: "Shipped" },
  { status: 3, name: "Đã nhận", description: "Delivered" },
  { status: 4, name: "Đang trả hàng", description: "Returning" },
  { status: 5, name: "Đã hoàn", description: "Returned" },
  { status: 8, name: "Đang đóng hàng", description: "Packing" },
  { status: 9, name: "Chờ chuyển hàng", description: "Waiting for pickup" },
  { status: 11, name: "Chờ hàng", description: "Waiting for stock" },
  { status: 12, name: "Chờ in", description: "Waiting to print" },
  { status: 13, name: "Đã in", description: "Printed" },
  { status: 15, name: "Hoàn 1 phần", description: "Partially returned" },
  { status: 16, name: "Đã thu tiền", description: "Payment collected" },
  { status: 20, name: "Đã đặt hàng", description: "Ordered from supplier" },
];

export const ORDER_SOURCES = [
  { code: -1, name: "Facebook" },
  { code: -2, name: "Website" },
  { code: -3, name: "Shopee" },
  { code: -4, name: "Lazada" },
  { code: -5, name: "Tiki" },
  { code: -6, name: "Sendo" },
  { code: -7, name: "TikTok Shop" },
  { code: -8, name: "Zalo" },
  { code: -9, name: "Instagram" },
  { code: -10, name: "Khác (Other)" },
];

export const SORT_OPTIONS = [
  { value: "inserted_at_desc", description: "Created date descending" },
  { value: "inserted_at_asc", description: "Created date ascending" },
  { value: "last_updated_order_desc", description: "Last updated descending" },
  { value: "last_updated_order_asc", description: "Last updated ascending" },
  { value: "last_update_status_at_desc", description: "Status update descending" },
  { value: "last_update_status_at_asc", description: "Status update ascending" },
  { value: "order_valuation_desc", description: "Order value descending" },
  { value: "order_valuation_asc", description: "Order value ascending" },
  { value: "product_quantity_desc", description: "Product quantity descending" },
  { value: "product_quantity_asc", description: "Product quantity ascending" },
  { value: "product_name_desc", description: "Product name descending" },
  { value: "product_name_asc", description: "Product name ascending" },
  { value: "sub_status_sort_desc", description: "Delivery delay descending" },
  { value: "sub_status_sort_asc", description: "Delivery delay ascending" },
  { value: "first_undeliverable_at_desc", description: "Undeliverable date descending" },
  { value: "first_undeliverable_at_asc", description: "Undeliverable date ascending" },
  { value: "customer_sort_desc", description: "Customer name descending" },
  { value: "customer_sort_asc", description: "Customer name ascending" },
  { value: "estimate_delivery_date_desc", description: "Estimated delivery descending" },
  { value: "estimate_delivery_date_asc", description: "Estimated delivery ascending" },
  { value: "order_source_desc", description: "Order source descending" },
  { value: "order_source_asc", description: "Order source ascending" },
];

export const WEBHOOK_EVENTS = [
  { event: "order.created", description: "New order created" },
  { event: "order.updated", description: "Order updated" },
  { event: "order.status_changed", description: "Order status changed" },
  { event: "customer.created", description: "New customer created" },
  { event: "customer.updated", description: "Customer info updated" },
  { event: "inventory.changed", description: "Inventory quantity changed" },
];

export const ERROR_CODES = [
  { code: 200, description: "Success" },
  { code: 400, description: "Bad Request — invalid parameters" },
  { code: 401, description: "Unauthorized — invalid api_key" },
  { code: 403, description: "Forbidden — no access" },
  { code: 404, description: "Not Found — resource does not exist" },
  { code: 500, description: "Internal Server Error" },
];

export const RATE_LIMITS = {
  per_minute: 1000,
  per_hour: 10000,
  note: "Limits apply per api_key. Exceeding returns HTTP 429.",
};

// Dynamic resource: shipping partners (fetched from API and cached)
let cachedPartners: unknown[] | null = null;

export async function getShippingPartners(client: PancakeHttpClient): Promise<unknown[]> {
  if (cachedPartners) return cachedPartners;

  try {
    const result = await client.get<unknown[]>("/partners");
    cachedPartners = Array.isArray(result.data) ? result.data : [];
    return cachedPartners;
  } catch {
    return [];
  }
}
