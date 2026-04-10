import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by warehouse name"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  warehouse_id: z.string().uuid().describe("Warehouse UUID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  name: z.string().describe("Warehouse name"),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  province_id: z.string().optional(),
  district_id: z.string().optional(),
  commune_id: z.string().optional(),
  allow_create_order: z.boolean().optional().describe("Allow creating orders from this warehouse"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  warehouse_id: z.string().uuid().describe("Warehouse UUID to update"),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  province_id: z.string().optional(),
  district_id: z.string().optional(),
  commune_id: z.string().optional(),
  allow_create_order: z.boolean().optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  warehouse_id: z.string().uuid().describe("Warehouse UUID to delete"),
});

export const warehousesToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type WarehousesToolInput = z.infer<typeof warehousesToolSchema>;

export async function handleWarehousesTool(args: WarehousesToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("warehouses", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`warehouses/${args.warehouse_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("warehouses", body);
      return result.data;
    }
    case "update": {
      const { action, warehouse_id, ...body } = args;
      const result = await client.put(`warehouses/${warehouse_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`warehouses/${args.warehouse_id}`);
      return { success: true, message: `Warehouse ${args.warehouse_id} deleted` };
    }
  }
}
