import { z } from "zod";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import { DateRangeParams } from "../shared/schemas.js";

const StatisticsType = z.enum(["inventory", "sales", "orders"]);

const GetStatisticsAction = z.object({
  action: z.literal("get"),
  type: StatisticsType.describe("Statistics type: inventory, sales, or orders"),
  group_by: z.string().optional().describe("Group by dimension, e.g. day, week, month, product, category"),
  warehouse_id: z.string().optional().describe("Filter by warehouse UUID"),
  ...DateRangeParams.shape,
});

export const statisticsToolSchema = z.discriminatedUnion("action", [
  GetStatisticsAction,
]);

export type StatisticsToolInput = z.infer<typeof statisticsToolSchema>;

export async function handleStatisticsTool(args: StatisticsToolInput, client: PancakeHttpClient) {
  const { action, type, ...params } = args;
  const result = await client.get(`statistics/${type}`, params);
  return result.data;
}
