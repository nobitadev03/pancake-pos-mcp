import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams, DateRangeParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by phone, customer name, note, or order code"),
  filter_status: z.array(z.number().int()).optional().describe("Filter by status codes (e.g. [0,1])"),
  include_removed: z.literal(1).optional().describe("Set to 1 to include deleted orders"),
  updateStatus: z.string().optional().describe("Filter by time type: inserted_at, updated_at, paid_at, etc."),
  option_sort: z.string().optional().describe("Sort order, e.g. inserted_at_desc, order_valuation_desc"),
  fields: z.array(z.string()).optional().describe("Specific fields to return"),
  partner_id: z.array(z.number().int()).optional().describe("Filter by shipping partner IDs"),
  customer_id: z.string().optional().describe("Filter by customer UUID"),
  order_sources: z.array(z.array(z.string())).optional().describe("Filter by source [[source_code, account_id]]"),
  ...PaginationParams.shape,
  ...DateRangeParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  order_id: z.number().int().describe("Order ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  bill_full_name: z.string().describe("Buyer full name"),
  bill_phone_number: z.string().describe("Buyer phone number"),
  bill_email: z.string().optional().describe("Buyer email"),
  is_free_shipping: z.boolean().optional(),
  received_at_shop: z.boolean().optional().describe("Customer picks up at shop"),
  items: z.array(z.object({
    quantity: z.number().int().min(1),
    variation_id: z.string(),
    product_id: z.string(),
    discount_each_product: z.number().optional(),
    is_bonus_product: z.boolean().optional(),
    note: z.string().optional(),
  })).min(1).describe("Order items"),
  note: z.string().optional().describe("Order note"),
  note_print: z.string().optional().describe("Note printed on order"),
  warehouse_id: z.string().describe("Warehouse UUID for order fulfillment"),
  shipping_address: z.object({
    full_name: z.string(),
    phone_number: z.string(),
    address: z.string(),
    province_id: z.string(),
    district_id: z.string(),
    commune_id: z.string(),
    country_code: z.number().optional(),
  }).describe("Shipping address"),
  shipping_fee: z.number().optional(),
  total_discount: z.number().optional(),
  surcharge: z.number().optional(),
  custom_id: z.string().optional().describe("Custom order ID"),
  customer_pay_fee: z.boolean().optional(),
  tags: z.array(z.number().int()).optional(),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  order_id: z.number().int().describe("Order ID to update"),
  status: z.number().int().optional().describe("New order status"),
  shipping_address: z.object({
    full_name: z.string().optional(),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    province_id: z.string().optional(),
    district_id: z.string().optional(),
    commune_id: z.string().optional(),
  }).optional(),
  note: z.string().optional(),
  tags: z.array(z.number().int()).optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  order_id: z.number().int().describe("Order ID to delete (only status=0 orders)"),
});

const PrintAction = z.object({
  action: z.literal("print"),
  order_id: z.number().int().describe("Order ID to print"),
  template: z.enum(["default", "a5", "label"]).optional().describe("Print template"),
});

const ShipAction = z.object({
  action: z.literal("ship"),
  order_id: z.number().int().describe("Order ID to ship"),
  partner_id: z.number().int().describe("Shipping partner ID"),
  customer_pay_fee: z.boolean().optional(),
  note_print: z.string().optional(),
  service_type_id: z.number().int().optional().describe("Service type (2=standard)"),
  pick_shift: z.array(z.number().int()).optional(),
  required_note: z.string().optional().describe("Delivery requirement note"),
});

const CallLaterAction = z.object({
  action: z.literal("call_later"),
  order_ids: z.array(z.string()).min(1).describe("Order IDs to schedule callback"),
  needs_call_at: z.string().describe("ISO datetime for callback schedule"),
  phone_number: z.string().describe("Phone number to call"),
  notice_created: z.string().describe("Callback reminder note"),
  need_notify_users: z.array(z.string()).describe("User UUIDs to notify"),
});

export const ordersToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
  PrintAction,
  ShipAction,
  CallLaterAction,
]);

export type OrdersToolInput = z.infer<typeof ordersToolSchema>;

export async function handleOrdersTool(args: OrdersToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("orders", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`orders/${args.order_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("orders", body);
      return result.data;
    }
    case "update": {
      const { action, order_id, ...body } = args;
      const result = await client.put(`orders/${order_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`orders/${args.order_id}`);
      return { success: true, message: `Order ${args.order_id} deleted` };
    }
    case "print": {
      const params: Record<string, unknown> = {};
      if (args.template) params.template = args.template;
      const result = await client.get(`orders/${args.order_id}/print`, params);
      return result.data;
    }
    case "ship": {
      const { action, order_id, ...body } = args;
      const result = await client.post(`orders/${order_id}/send-to-partner`, body);
      return result.data;
    }
    case "call_later": {
      const { action, ...rest } = args;
      const result = await client.post("order-call-later", {
        order_call_later: { status: 0, ...rest },
      });
      return result.data;
    }
  }
}
