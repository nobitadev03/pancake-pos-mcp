import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PancakeHttpClient } from "../api-client/pancake-http-client.js";
import {
  ORDER_STATUSES,
  ORDER_SOURCES,
  SORT_OPTIONS,
  WEBHOOK_EVENTS,
  ERROR_CODES,
  RATE_LIMITS,
  getShippingPartners,
} from "./reference-data-resources.js";

/**
 * Register all MCP resources with the server.
 */
export function registerAllResources(server: McpServer, client: PancakeHttpClient): void {
  server.resource(
    "order-statuses",
    "pancake://reference/order-statuses",
    { description: "All Pancake POS order status codes with Vietnamese names and English descriptions" },
    async () => ({
      contents: [{
        uri: "pancake://reference/order-statuses",
        mimeType: "application/json",
        text: JSON.stringify(ORDER_STATUSES, null, 2),
      }],
    }),
  );

  server.resource(
    "order-sources",
    "pancake://reference/order-sources",
    { description: "Order source codes (Facebook, Shopee, Lazada, TikTok Shop, etc.)" },
    async () => ({
      contents: [{
        uri: "pancake://reference/order-sources",
        mimeType: "application/json",
        text: JSON.stringify(ORDER_SOURCES, null, 2),
      }],
    }),
  );

  server.resource(
    "sort-options",
    "pancake://reference/sort-options",
    { description: "Available sorting options for order list queries" },
    async () => ({
      contents: [{
        uri: "pancake://reference/sort-options",
        mimeType: "application/json",
        text: JSON.stringify(SORT_OPTIONS, null, 2),
      }],
    }),
  );

  server.resource(
    "webhook-events",
    "pancake://reference/webhook-events",
    { description: "Webhook event types supported by Pancake POS" },
    async () => ({
      contents: [{
        uri: "pancake://reference/webhook-events",
        mimeType: "application/json",
        text: JSON.stringify(WEBHOOK_EVENTS, null, 2),
      }],
    }),
  );

  server.resource(
    "error-codes",
    "pancake://reference/error-codes",
    { description: "HTTP error codes and their meanings in Pancake POS API" },
    async () => ({
      contents: [{
        uri: "pancake://reference/error-codes",
        mimeType: "application/json",
        text: JSON.stringify(ERROR_CODES, null, 2),
      }],
    }),
  );

  server.resource(
    "rate-limits",
    "pancake://reference/rate-limits",
    { description: "API rate limit information (1000/min, 10000/hour)" },
    async () => ({
      contents: [{
        uri: "pancake://reference/rate-limits",
        mimeType: "application/json",
        text: JSON.stringify(RATE_LIMITS, null, 2),
      }],
    }),
  );

  server.resource(
    "shipping-partners",
    "pancake://reference/shipping-partners",
    { description: "Available shipping partners with IDs and names (fetched from API)" },
    async () => {
      const partners = await getShippingPartners(client);
      return {
        contents: [{
          uri: "pancake://reference/shipping-partners",
          mimeType: "application/json",
          text: JSON.stringify(partners, null, 2),
        }],
      };
    },
  );
}
