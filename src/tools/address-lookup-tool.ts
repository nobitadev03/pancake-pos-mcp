import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";

// Note: Address endpoints are not under /shops/{id}/ path — use raw paths via dedicated method

const ProvincesAction = z.object({
  action: z.literal("provinces"),
});

const DistrictsAction = z.object({
  action: z.literal("districts"),
  province_id: z.string().describe("Province ID to get districts for"),
});

const CommunesAction = z.object({
  action: z.literal("communes"),
  district_id: z.string().describe("District ID to get communes for"),
});

export const addressLookupToolSchema = z.discriminatedUnion("action", [
  ProvincesAction,
  DistrictsAction,
  CommunesAction,
]);

export type AddressLookupToolInput = z.infer<typeof addressLookupToolSchema>;

export async function handleAddressLookupTool(args: AddressLookupToolInput, client: PancakeHttpClient) {
  switch (args.action) {
    case "provinces": {
      // Address endpoints are outside /shops/{id}/ scope; use non-shop path
      const result = await client.getRaw<unknown[]>("address/provinces");
      return { data: result };
    }
    case "districts": {
      const result = await client.getRaw<unknown[]>(`address/districts/${args.province_id}`);
      return { data: result };
    }
    case "communes": {
      const result = await client.getRaw<unknown[]>(`address/communes/${args.district_id}`);
      return { data: result };
    }
  }
}
