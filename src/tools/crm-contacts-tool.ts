import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { formatPaginatedResult } from "../shared/pagination-helpers.js";
import { PaginationParams } from "../shared/schemas.js";

const ListAction = z.object({
  action: z.literal("list"),
  search: z.string().optional().describe("Search by name, phone, or email"),
  ...PaginationParams.shape,
});

const GetAction = z.object({
  action: z.literal("get"),
  contact_id: z.string().describe("CRM contact ID"),
});

const CreateAction = z.object({
  action: z.literal("create"),
  name: z.string().describe("Contact full name"),
  phone: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  contact_id: z.string().describe("CRM contact ID to update"),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const DeleteAction = z.object({
  action: z.literal("delete"),
  contact_id: z.string().describe("CRM contact ID to delete"),
});

export const crmContactsToolSchema = z.discriminatedUnion("action", [
  ListAction,
  GetAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
]);

export type CrmContactsToolInput = z.infer<typeof crmContactsToolSchema>;

export async function handleCrmContactsTool(args: CrmContactsToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "list": {
      const { action, ...params } = args;
      const result = await client.getList("crm/contacts", params);
      return formatPaginatedResult(result);
    }
    case "get": {
      const result = await client.get(`crm/contacts/${args.contact_id}`);
      return result.data;
    }
    case "create": {
      const { action, ...body } = args;
      const result = await client.post("crm/contacts", body);
      return result.data;
    }
    case "update": {
      const { action, contact_id, ...body } = args;
      const result = await client.put(`crm/contacts/${contact_id}`, body);
      return result.data;
    }
    case "delete": {
      await client.delete(`crm/contacts/${args.contact_id}`);
      return { success: true, message: `CRM contact ${args.contact_id} deleted` };
    }
  }
}
