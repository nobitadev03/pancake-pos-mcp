import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  webhook_id: z.string().describe("Webhook ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  url: z.string().url().describe("Webhook target URL"),
  events: z.array(z.string()).min(1).describe("Events to subscribe to (e.g. order.created, order.updated)"),
  headers: z.record(z.string(), z.string()).optional().describe("Custom HTTP headers to include in webhook requests"),
  is_active: z.boolean().optional(),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  webhook_id: z.string().describe("Webhook ID to update"),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  is_active: z.boolean().optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  webhook_id: z.string().describe("Webhook ID to delete"),
});

export const webhooksToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type WebhooksToolInput = z.infer<typeof webhooksToolSchema>;

export async function handleWebhooksTool(args: WebhooksToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("webhooks", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`webhooks/${args.webhook_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("webhooks", body);
      return result.data;
    }
    case "update": {
      const { action, webhook_id, ...body } = args;
      const result = await client.put(`webhooks/${webhook_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`webhooks/${args.webhook_id}`);
      return { success: true, message: `Webhook ${args.webhook_id} deleted` };
    }
  }
}
