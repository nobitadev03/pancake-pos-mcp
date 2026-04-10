import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { PancakeHttpClient } from "./api-client/pancake-http-client.js";
import { createServer } from "./server.js";

const args = process.argv.slice(2);
const transportMode = args.includes("--http") ? "http" : "stdio";

const config = loadConfig();
const client = new PancakeHttpClient(config);
const server = createServer(client);

if (transportMode === "stdio") {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[pancake-pos-mcp] Server started on stdio transport");
} else {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await server.connect(transport);

  const authToken = config.MCP_AUTH_TOKEN;
  if (!authToken) {
    console.error("[pancake-pos-mcp] WARNING: No MCP_AUTH_TOKEN set. HTTP endpoint is unauthenticated.");
  }

  const httpServer = Bun.serve({
    port: config.PORT,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);

      // Health check — no auth required
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok", transport: "streamable-http" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // MCP endpoint — auth required if token is set
      if (url.pathname === "/mcp") {
        if (authToken) {
          const authHeader = req.headers.get("authorization");
          if (authHeader !== `Bearer ${authToken}`) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        return transport.handleRequest(req);
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.error(`[pancake-pos-mcp] Server started on HTTP transport at http://localhost:${httpServer.port}/mcp`);
}
