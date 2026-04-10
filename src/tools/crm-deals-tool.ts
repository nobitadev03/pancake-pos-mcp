import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by deal name or contact"),
  contact_id: z.string().optional().describe("Filter by CRM contact ID"),
  stage: z.string().optional().describe("Filter by pipeline stage"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  deal_id: z.string().describe("CRM deal ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  name: z.string().describe("Deal name"),
  contact_id: z.string().optional().describe("Linked CRM contact ID"),
  amount: z.number().optional().describe("Deal value amount"),
  stage: z.string().optional().describe("Pipeline stage"),
  expected_close_date: z.string().optional().describe("Expected close date (ISO datetime)"),
  note: z.string().optional(),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  deal_id: z.string().describe("CRM deal ID to update"),
  name: z.string().optional(),
  contact_id: z.string().optional(),
  amount: z.number().optional(),
  stage: z.string().optional(),
  expected_close_date: z.string().optional(),
  note: z.string().optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  deal_id: z.string().describe("CRM deal ID to delete"),
});

export const crmDealsToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type CrmDealsToolInput = z.infer<typeof crmDealsToolSchema>;

export async function handleCrmDealsTool(args: CrmDealsToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("crm/deals", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`crm/deals/${args.deal_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("crm/deals", body);
      return result.data;
    }
    case "update": {
      const { action, deal_id, ...body } = args;
      const result = await client.put(`crm/deals/${deal_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`crm/deals/${args.deal_id}`);
      return { success: true, message: `CRM deal ${args.deal_id} deleted` };
    }
  }
}
