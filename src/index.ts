#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ToastClient } from "./toast-client.js";
import { registerMenuTools } from "./tools/menu.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerInventoryTools } from "./tools/inventory.js";
import { registerLaborTools } from "./tools/labor.js";
import { registerRestaurantTools } from "./tools/restaurant.js";
import { registerSmartTools } from "./tools/smart.js";
import { registerAnalyticsTools } from "./tools/analytics.js";
import { registerFinancialTools } from "./tools/financial.js";
import { registerOperationsTools } from "./tools/operations.js";
import { registerRetentionTools } from "./tools/retention.js";
import { registerForecastingTools } from "./tools/forecasting.js";
import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.TOAST_CLIENT_ID;
const clientSecret = process.env.TOAST_CLIENT_SECRET;
const restaurantGuid = process.env.TOAST_RESTAURANT_GUID;
const baseUrl = process.env.TOAST_API_BASE_URL;

if (!clientId || !clientSecret || !restaurantGuid) {
  console.error("Missing TOAST_CLIENT_ID, TOAST_CLIENT_SECRET, or TOAST_RESTAURANT_GUID");
  process.exit(1);
}

const toast = new ToastClient({
  clientId,
  clientSecret,
  restaurantGuid,
  baseUrl,
});

const server = new McpServer({
  name: "toast-mcp",
  version: "0.1.0",
});

registerMenuTools(server, toast);
registerOrderTools(server, toast);
registerInventoryTools(server, toast);
registerLaborTools(server, toast);
registerRestaurantTools(server, toast);
registerSmartTools(server, toast);
registerAnalyticsTools(server, toast);
registerFinancialTools(server, toast);
registerOperationsTools(server, toast);
registerRetentionTools(server, toast);
registerForecastingTools(server, toast);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Toast MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
