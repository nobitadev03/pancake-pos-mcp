import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by livestream name"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  livestream_id: z.string().describe("Livestream ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  name: z.string().describe("Livestream name/title"),
  scheduled_at: z.string().optional().describe("Scheduled start time (ISO datetime)"),
  description: z.string().optional(),
  product_ids: z.array(z.string()).optional().describe("Product UUIDs featured in livestream"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  livestream_id: z.string().describe("Livestream ID to update"),
  name: z.string().optional(),
  scheduled_at: z.string().optional(),
  description: z.string().optional(),
  status: z.coerce.number().int().optional().describe("Livestream status"),
  product_ids: z.array(z.string()).optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  livestream_id: z.string().describe("Livestream ID to delete"),
});

export const livestreamToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type LivestreamToolInput = z.infer<typeof livestreamToolSchema>;

export async function handleLivestreamTool(args: LivestreamToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("livestream", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`livestream/${args.livestream_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("livestream", body);
      return result.data;
    }
    case "update": {
      const { action, livestream_id, ...body } = args;
      const result = await client.put(`livestream/${livestream_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`livestream/${args.livestream_id}`);
      return { success: true, message: `Livestream ${args.livestream_id} deleted` };
    }
  }
}
