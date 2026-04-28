import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";

/**
 * KNOWN BROKEN: Pancake API endpoints `/address/provinces`, `/address/districts/{id}`,
 * `/address/communes/{id}` return HTTP 404 on both pos.pages.fm and pos.pancake.vn,
 * with both api_key and JWT authentication (verified 2026-04-28).
 *
 * Tool surface kept for LLM-discoverability and forward-compat in case Pancake
 * restores the endpoints. Handler intercepts 404 and returns a structured
 * deprecation message with a workaround hint.
 *
 * Workaround: obtain location IDs from existing entities. Order GET response
 * includes `shipping_address.province_id` (OLD format) and
 * `shipping_address.new_province_id` / `new_commune_id` (NEW format post-2025-07-01).
 */

const DEPRECATION_NOTE =
  "address-lookup endpoint is currently unavailable upstream (HTTP 404, verified 2026-04-28). " +
  "Workaround: extract location IDs from existing entities — e.g. orders.get response " +
  "includes shipping_address.province_id (OLD) or shipping_address.new_province_id / " +
  "new_commune_id (NEW format post-2025-07-01). Investigation deferred to a separate plan.";

function is404(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: number; message?: string };
  if (e.status === 404) return true;
  return typeof e.message === "string" && /\b404\b/.test(e.message);
}

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
  try {
    switch (args.action) {
      case "provinces": {
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
  } catch (err) {
    if (is404(err)) {
      throw new Error(DEPRECATION_NOTE);
    }
    throw err;
  }
}
