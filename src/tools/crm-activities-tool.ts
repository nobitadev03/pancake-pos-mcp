import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  contact_id: z.string().optional().describe("Filter by CRM contact ID"),
  deal_id: z.string().optional().describe("Filter by CRM deal ID"),
  activity_type: z.enum(["call", "meeting", "note", "email", "task"]).optional(),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  activity_id: z.string().describe("CRM activity ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  activity_type: z.enum(["call", "meeting", "note", "email", "task"]).describe("Type of CRM activity"),
  contact_id: z.string().optional().describe("Linked CRM contact ID"),
  deal_id: z.string().optional().describe("Linked CRM deal ID"),
  title: z.string().describe("Activity title or subject"),
  description: z.string().optional(),
  scheduled_at: z.string().optional().describe("Scheduled time (ISO datetime)"),
  duration_minutes: z.coerce.number().int().optional().describe("Duration in minutes"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  activity_id: z.string().describe("CRM activity ID to update"),
  title: z.string().optional(),
  description: z.string().optional(),
  scheduled_at: z.string().optional(),
  duration_minutes: z.coerce.number().int().optional(),
  is_completed: z.boolean().optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  activity_id: z.string().describe("CRM activity ID to delete"),
});

export const crmActivitiesToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type CrmActivitiesToolInput = z.infer<typeof crmActivitiesToolSchema>;

export async function handleCrmActivitiesTool(args: CrmActivitiesToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("crm/activities", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`crm/activities/${args.activity_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("crm/activities", body);
      return result.data;
    }
    case "update": {
      const { action, activity_id, ...body } = args;
      const result = await client.put(`crm/activities/${activity_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`crm/activities/${args.activity_id}`);
      return { success: true, message: `CRM activity ${args.activity_id} deleted` };
    }
  }
}
