import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerRestaurantTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_restaurant_info",
    "Get general restaurant metadata and configuration.",
    {},
    async () => {
      const data = await toast.get<any>(`/menus/v1/restaurants/${toast.restaurantGuid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_tables",
    "List all tables and their current status (e.g., occupied, available).",
    {},
    async () => {
      // Assuming Toast Table API
      const data = await toast.get<any>(`/tables/v1/restaurants/${toast.restaurantGuid}/tables`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
