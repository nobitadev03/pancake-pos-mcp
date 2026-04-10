import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by promotion name"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  promotion_id: z.string().describe("Promotion ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  name: z.string().describe("Promotion name"),
  discount_type: z.enum(["percent", "amount"]).optional().describe("Discount type: percent or fixed amount"),
  discount_value: z.number().optional().describe("Discount value"),
  minimum_order_value: z.number().optional().describe("Minimum order value to apply promotion"),
  start_time: z.number().int().optional().describe("Start time (unix timestamp)"),
  end_time: z.number().int().optional().describe("End time (unix timestamp)"),
  is_active: z.boolean().optional(),
  applicable_product_ids: z.array(z.string()).optional().describe("Specific product UUIDs this applies to"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  promotion_id: z.string().describe("Promotion ID to update"),
  name: z.string().optional(),
  discount_type: z.enum(["percent", "amount"]).optional(),
  discount_value: z.number().optional(),
  minimum_order_value: z.number().optional(),
  start_time: z.number().int().optional(),
  end_time: z.number().int().optional(),
  is_active: z.boolean().optional(),
  applicable_product_ids: z.array(z.string()).optional().describe("Specific product UUIDs this applies to"),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  promotion_id: z.string().describe("Promotion ID to delete"),
});

export const promotionsToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type PromotionsToolInput = z.infer<typeof promotionsToolSchema>;

export async function handlePromotionsTool(args: PromotionsToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("promotions", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`promotions/${args.promotion_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("promotions", body);
      return result.data;
    }
    case "update": {
      const { action, promotion_id, ...body } = args;
      const result = await client.put(`promotions/${promotion_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`promotions/${args.promotion_id}`);
      return { success: true, message: `Promotion ${args.promotion_id} deleted` };
    }
  }
}
