import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerMenuTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_menu",
    "Fetch the full restaurant menu including categories, items, and prices.",
    {},
    async () => {
      const data = await toast.get<any>(`/menus/v1/menus/${toast.restaurantGuid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_menu_item",
    "Get detailed information for a specific menu item.",
    {
      itemGuid: z.string().describe("Toast item GUID"),
    },
    async ({ itemGuid }) => {
      const data = await toast.get<any>(`/menus/v1/items/${itemGuid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "search_menu",
    "Search for menu items or categories by name.",
    {
      query: z.string().describe("Search term"),
    },
    async ({ query }) => {
      const menu = await toast.get<any>(`/menus/v1/menus/${toast.restaurantGuid}`);
      // Simple search implementation
      const results: any[] = [];
      const lowerQuery = query.toLowerCase();

      const searchItems = (container: any) => {
        if (container.items) {
          for (const item of container.items) {
            if (item.name.toLowerCase().includes(lowerQuery)) {
              results.push(item);
            }
          }
        }
        if (container.categories) {
          for (const cat of container.categories) {
            if (cat.name.toLowerCase().includes(lowerQuery)) {
              results.push(cat);
            }
            searchItems(cat);
          }
        }
      };

      searchItems(menu);

      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }
  );
}
