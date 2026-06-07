import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerAnalyticsTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_sales_by_period",
    "Get revenue breakdown by day, week, or month.",
    {
      period: z.enum(["day", "week", "month"]).optional().default("day").describe("Reporting period"),
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ period, startDate, endDate }) => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await toast.get<any>("/orders/v2/orders", params);
      const orders = data.results || data.orders || [];

      const grouped: Record<string, { count: number; revenue: number }> = {};

      orders.forEach((order: any) => {
        const orderDate = new Date(order.createdTime || order.timestamp);
        let key: string;

        if (period === "month") {
          key = orderDate.toISOString().slice(0, 7);
        } else if (period === "week") {
          const d = new Date(orderDate);
          d.setDate(d.getDate() - d.getDay());
          key = d.toISOString().slice(0, 10);
        } else {
          key = orderDate.toISOString().slice(0, 10);
        }

        if (!grouped[key]) grouped[key] = { count: 0, revenue: 0 };
        grouped[key].count += 1;
        grouped[key].revenue += order.total || 0;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            period,
            summary: {
              totalOrders: orders.length,
              totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
            },
            breakdown: grouped,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_peak_hours",
    "Detect peak operating hours based on order volume.",
    {
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ startDate, endDate }) => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await toast.get<any>("/orders/v2/orders", params);
      const orders = data.results || data.orders || [];

      const hourly: Record<number, number> = {};
      orders.forEach((order: any) => {
        const hour = new Date(order.createdTime || order.timestamp).getHours();
        hourly[hour] = (hourly[hour] || 0) + 1;
      });

      const sorted = Object.entries(hourly)
        .sort(([, a], [, b]) => b - a)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          orders: count,
          timeRange: `${String(parseInt(hour)).padStart(2, "0")}:00-${String((parseInt(hour) + 1) % 24).padStart(2, "0")}:00`,
        }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            peakHours: sorted.slice(0, 5),
            allHours: sorted,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_best_sellers",
    "Get top-selling menu items by volume and revenue.",
    {
      limit: z.number().optional().default(10).describe("Number of items to return"),
    },
    async ({ limit }) => {
      const data = await toast.get<any>("/orders/v2/orders");
      const orders = data.results || data.orders || [];

      const items: Record<string, { name: string; count: number; revenue: number }> = {};

      orders.forEach((order: any) => {
        const lineItems = order.lineItems || order.items || [];
        lineItems.forEach((item: any) => {
          const key = item.guid || item.id;
          if (!items[key]) {
            items[key] = { name: item.name || "Unknown", count: 0, revenue: 0 };
          }
          items[key].count += 1;
          items[key].revenue += (item.total || item.price || 0) * (item.quantity || 1);
        });
      });

      const sorted = Object.values(items)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            topItems: sorted,
            totalItemsTracked: Object.keys(items).length,
          }, null, 2),
        }],
      };
    }
  );
}
