import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const SyncAction = z.object({
  action: z.literal("sync"),
  channel: z.enum(["shopee", "lazada", "tiktok"]).describe("Ecommerce channel to sync"),
  shop_channel_id: z.string().optional().describe("Specific channel shop ID to sync"),
});

const ListProductsAction = z.object({
  action: z.literal("list_products"),
  channel: z.enum(["shopee", "lazada", "tiktok"]).optional().describe("Filter by ecommerce channel"),
  search: z.string().optional(),
  ...PaginationParams.shape,
});

export const ecommerceToolSchema = z.discriminatedUnion("action", [
  SyncAction,
  ListProductsAction,
]);

export type EcommerceToolInput = z.infer<typeof ecommerceToolSchema>;

export async function handleEcommerceTool(args: EcommerceToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "sync": {
      const { action, ...body } = args;
      const result = await client.post("ecommerce/sync", body);
      return result.data;
    }
    case "list_products": {
      const { action, ...params } = args;
      const result = await client.getList("ecommerce/products", params);
      return formatPaginatedResult(result);
    }
  }
}
