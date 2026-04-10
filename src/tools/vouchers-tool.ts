import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by voucher code or name"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  voucher_id: z.string().describe("Voucher ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  code: z.string().describe("Voucher code (unique)"),
  name: z.string().optional().describe("Voucher display name"),
  discount_type: z.enum(["percent", "amount"]).optional().describe("Discount type: percent or fixed amount"),
  discount_value: z.number().optional().describe("Discount value"),
  minimum_order_value: z.number().optional().describe("Minimum order value to use voucher"),
  max_usage: z.number().int().optional().describe("Maximum number of times voucher can be used"),
  start_time: z.number().int().optional().describe("Start time (unix timestamp)"),
  end_time: z.number().int().optional().describe("End time (unix timestamp)"),
  is_active: z.boolean().optional(),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  voucher_id: z.string().describe("Voucher ID to update"),
  name: z.string().optional(),
  discount_type: z.enum(["percent", "amount"]).optional(),
  discount_value: z.number().optional(),
  minimum_order_value: z.number().optional(),
  max_usage: z.number().int().optional(),
  start_time: z.number().int().optional(),
  end_time: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  voucher_id: z.string().describe("Voucher ID to delete"),
});

export const vouchersToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type VouchersToolInput = z.infer<typeof vouchersToolSchema>;

export async function handleVouchersTool(args: VouchersToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("vouchers", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`vouchers/${args.voucher_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("vouchers", body);
      return result.data;
    }
    case "update": {
      const { action, voucher_id, ...body } = args;
      const result = await client.put(`vouchers/${voucher_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`vouchers/${args.voucher_id}`);
      return { success: true, message: `Voucher ${args.voucher_id} deleted` };
    }
  }
}
