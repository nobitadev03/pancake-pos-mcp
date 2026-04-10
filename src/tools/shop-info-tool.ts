import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";

const GetAction = z.object({
  action: z.literal("get"),
});

const UpdateAction = z.object({
  action: z.literal("update"),
  name: z.string().optional().describe("Shop display name"),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  province_id: z.string().optional(),
  district_id: z.string().optional(),
  commune_id: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  logo_url: z.string().optional(),
});

export const shopInfoToolSchema = z.discriminatedUnion("action", [
  GetAction,
  UpdateAction,
]);

export type ShopInfoToolInput = z.infer<typeof shopInfoToolSchema>;

export async function handleShopInfoTool(args: ShopInfoToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "get": {
      const result = await client.get("shop");
      return result.data;
    }
    case "update": {
      const { action, ...body } = args;
      const result = await client.post("shop/update", body);
      return result.data;
    }
  }
}
