import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams, DateRangeParams } from "../shared/schemas.js";

const PurchaseItem = z.object({
  variation_id: z.string().describe("Product variation UUID"),
  quantity: z.coerce.number().int().min(1),
  price: z.coerce.number().optional().describe("Purchase price per unit"),
});

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional(),
  supplier_id: z.string().optional().describe("Filter by supplier ID"),
  warehouse_id: z.string().optional().describe("Filter by warehouse UUID"),
  ...PaginationParams.shape,
  ...DateRangeParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  purchase_id: z.string().describe("Purchase order ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  supplier_id: z.string().describe("Supplier ID"),
  warehouse_id: z.string().describe("Destination warehouse UUID"),
  items: z.array(PurchaseItem).min(1).describe("Items to purchase"),
  note: z.string().optional(),
  discount: z.coerce.number().optional().describe("Total discount on purchase"),
  expected_at: z.string().optional().describe("Expected delivery date (ISO datetime)"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  purchase_id: z.string().describe("Purchase order ID to update"),
  status: z.coerce.number().int().optional().describe("Purchase status"),
  note: z.string().optional(),
  discount: z.coerce.number().optional(),
  items: z.array(PurchaseItem).optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  purchase_id: z.string().describe("Purchase order ID to delete"),
});

export const purchasesToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type PurchasesToolInput = z.infer<typeof purchasesToolSchema>;

export async function handlePurchasesTool(args: PurchasesToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("purchases", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`purchases/${args.purchase_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("purchases", body);
      return result.data;
    }
    case "update": {
      const { action, purchase_id, ...body } = args;
      const result = await client.put(`purchases/${purchase_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`purchases/${args.purchase_id}`);
      return { success: true, message: `Purchase ${args.purchase_id} deleted` };
    }
  }
}
