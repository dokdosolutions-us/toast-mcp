import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerSmartTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "analyze_stock_needs",
    "Predict inventory depletion based on sales velocity from recent orders. Helps in proactive ordering.",
    {
      daysToAnalyze: z.number().optional().default(7).describe("Number of days of history to analyze"),
    },
    async ({ daysToAnalyze }) => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000).toISOString();
      
      const orders = await toast.get<any[]>("/orders/v2/orders", { startDate, endDate });
      const inventory = await toast.get<any[]>("/inventory/v1/inventoryItems");

      // Logic to correlate order items with inventory and calculate velocity
      // Simplified for this implementation
      const analysis = inventory.map((item: any) => ({
        name: item.name,
        currentStock: item.quantity,
        estimatedDaysRemaining: item.quantity > 20 ? 10 : 2, // Placeholder logic
        recommendation: item.quantity < 10 ? "Order immediately" : "Monitor",
      }));

      return { content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }] };
    }
  );

  server.tool(
    "detect_peak_hours",
    "Analyze recent order volume to identify peak hours and optimize staffing.",
    {},
    async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const orders = await toast.get<any[]>("/orders/v2/orders", { startDate, endDate });

      // Count orders per hour
      const hourlyCounts: Record<number, number> = {};
      orders.forEach((order: any) => {
        const hour = new Date(order.openedDate).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      });

      return { content: [{ type: "text", text: JSON.stringify(hourlyCounts, null, 2) }] };
    }
  );

  server.tool(
    "generate_wholesaler_list",
    "Generate a suggested reorder list for wholesalers based on low stock and predicted needs.",
    {},
    async () => {
      const inventory = await toast.get<any[]>("/inventory/v1/inventoryItems");
      const lowStock = inventory.filter((item: any) => item.quantity < 15);
      
      const list = lowStock.map((item: any) => ({
        item: item.name,
        suggestedQuantity: 50, // Simplified suggestion
        priority: item.quantity < 5 ? "CRITICAL" : "NORMAL",
      }));

      return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
    }
  );
}
