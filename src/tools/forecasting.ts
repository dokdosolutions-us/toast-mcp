import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerForecastingTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_weekly_trends",
    "Analyze week-over-week sales trends.",
    {
      weeks: z.number().optional().default(4).describe("Number of weeks to analyze"),
    },
    async ({ weeks }) => {
      const data = await toast.get<any>("/orders/v2/orders");
      const orders = data.results || data.orders || [];

      const weeklyData: Record<string, number> = {};

      orders.forEach((order: any) => {
        const date = new Date(order.createdTime || order.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);

        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (order.total || 0);
      });

      const sorted = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-weeks);

      const trends = sorted.map(([week, revenue], idx) => {
        const prevRevenue = idx > 0 ? sorted[idx - 1][1] : revenue;
        const change = ((revenue - prevRevenue) / prevRevenue) * 100 || 0;

        return {
          week,
          revenue: revenue.toFixed(2),
          changePercent: change.toFixed(2),
          trend: change > 0 ? "↑" : change < 0 ? "↓" : "→",
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            trends,
            recommendation: trends[trends.length - 1]?.changePercent > 0
              ? "Revenue trending upward — maintain current strategy."
              : "Revenue declining — review pricing and promotions.",
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_seasonal_patterns",
    "Identify seasonal patterns in sales.",
    {
      monthsBack: z.number().optional().default(6).describe("Months of history to analyze"),
    },
    async ({ monthsBack }) => {
      const data = await toast.get<any>("/orders/v2/orders");
      const orders = data.results || data.orders || [];

      const monthlyData: Record<string, number> = {};

      orders.forEach((order: any) => {
        const date = new Date(order.createdTime || order.timestamp);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (order.total || 0);
      });

      const sorted = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-monthsBack);

      const avgRevenue = sorted.reduce((sum, [, rev]) => sum + rev, 0) / sorted.length;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            averageMonthly: avgRevenue.toFixed(2),
            breakdown: sorted.map(([month, revenue]) => ({
              month,
              revenue: revenue.toFixed(2),
              vsAverage: ((revenue - avgRevenue) / avgRevenue * 100).toFixed(2) + "%",
            })),
            highestMonth: sorted.sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A",
            lowestMonth: sorted.sort(([, a], [, b]) => a - b)[0]?.[0] || "N/A",
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "staffing_demand_forecast",
    "Forecast staffing needs based on order velocity and complexity.",
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

      const hourly: Record<number, { count: number; itemCount: number }> = {};

      orders.forEach((order: any) => {
        const hour = new Date(order.createdTime || order.timestamp).getHours();
        const itemCount = (order.lineItems || []).length;

        if (!hourly[hour]) hourly[hour] = { count: 0, itemCount: 0 };
        hourly[hour].count += 1;
        hourly[hour].itemCount += itemCount;
      });

      const forecast = Object.entries(hourly)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          expectedOrders: data.count,
          itemsPerOrder: (data.itemCount / data.count).toFixed(1),
          suggestedStaff: Math.ceil(data.count / 5),
          timeRange: `${String(parseInt(hour)).padStart(2, "0")}:00-${String((parseInt(hour) + 1) % 24).padStart(2, "0")}:00`,
        }))
        .sort((a, b) => a.hour - b.hour);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            forecast,
            totalSuggestedStaff: forecast.reduce((sum, h) => sum + h.suggestedStaff, 0),
          }, null, 2),
        }],
      };
    }
  );
}
