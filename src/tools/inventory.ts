import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerInventoryTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_stock_levels",
    "Get current stock levels for all inventory items. Essential for Koryo KBBQ wholesaler coordination.",
    {},
    async () => {
      // Assuming Toast Inventory API structure
      const data = await toast.get<any>("/inventory/v1/inventoryItems");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_stock",
    "Update the stock quantity for a specific inventory item (e.g., after receiving a wholesaler shipment).",
    {
      itemGuid: z.string().describe("Toast inventory item GUID"),
      quantity: z.number().describe("New stock quantity"),
    },
    async ({ itemGuid, quantity }) => {
      await toast.patch<any>(`/inventory/v1/inventoryItems/${itemGuid}`, { quantity });
      return {
        content: [{ type: "text", text: `Stock for item ${itemGuid} updated to ${quantity}.` }],
      };
    }
  );

  server.tool(
    "auto_86_item",
    "Mark an item as out-of-stock (86'd) immediately across all menus.",
    {
      selectionGuid: z.string().describe("Toast menu selection/item GUID"),
    },
    async ({ selectionGuid }) => {
      // In Toast, 86'ing is often done via the 'outOfStock' flag on a selection
      await toast.post<any>(`/menus/v1/menus/${toast.restaurantGuid}/selections/${selectionGuid}/outOfStock`, {});
      return {
        content: [{ type: "text", text: `Item ${selectionGuid} has been 86'd.` }],
      };
    }
  );

  server.tool(
    "get_low_stock_items",
    "Identify items that are below a certain threshold and may need reordering from wholesalers.",
    {
      threshold: z.number().optional().default(10).describe("Stock level threshold"),
    },
    async ({ threshold }) => {
      const data = await toast.get<any[]>("/inventory/v1/inventoryItems");
      const lowStock = data.filter((item: any) => item.quantity <= threshold);
      
      if (lowStock.length === 0) {
        return { content: [{ type: "text", text: "All items are well-stocked." }] };
      }

      return { content: [{ type: "text", text: JSON.stringify(lowStock, null, 2) }] };
    }
  );
}
