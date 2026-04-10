import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PancakeHttpClient } from "./api-client/pancake-http-client.js";
import { registerAllTools } from "./tools/tool-registry.js";
import { registerAllResources } from "./resources/resource-registry.js";

/**
 * Create and configure the Pancake POS MCP server with all tools and resources.
 */
export function createServer(client: PancakeHttpClient): McpServer {
  const server = new McpServer({
    name: "pancake-pos",
    version: "0.1.0",
  });

  registerAllTools(server, client);
  registerAllResources(server, client);

  return server;
}
