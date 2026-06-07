import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerFinancialTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_daily_summary",
    "Get daily financial summary including revenue, transactions, and payment methods.",
    {
      date: z.string().optional().describe("ISO 8601 date (defaults to today)"),
    },
    async ({ date }) => {
      const targetDate = date || new Date().toISOString().slice(0, 10);
      const startDate = `${targetDate}T00:00:00Z`;
      const endDate = `${targetDate}T23:59:59Z`;

      const data = await toast.get<any>("/orders/v2/orders", {
        startDate,
        endDate,
      });

      const orders = data.results || data.orders || [];
      const payments: Record<string, number> = {};

      orders.forEach((order: any) => {
        const paymentMethods = order.payments || [];
        paymentMethods.forEach((payment: any) => {
          const method = payment.paymentMethod || payment.type || "unknown";
          payments[method] = (payments[method] || 0) + (payment.amount || 0);
        });
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            date: targetDate,
            summary: {
              totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
              transactionCount: orders.length,
              averageTransaction: orders.length > 0 ? orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0) / orders.length : 0,
            },
            paymentBreakdown: payments,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_weekly_summary",
    "Get weekly financial summary.",
    {
      weekStart: z.string().optional().describe("ISO 8601 week start date"),
    },
    async ({ weekStart }) => {
      const start = weekStart || new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().slice(0, 10);
      const end = new Date(new Date(`${start}T00:00:00Z`).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const data = await toast.get<any>("/orders/v2/orders", {
        startDate: `${start}T00:00:00Z`,
        endDate: `${end}T23:59:59Z`,
      });

      const orders = data.results || data.orders || [];
      const daily: Record<string, { count: number; revenue: number }> = {};

      orders.forEach((order: any) => {
        const day = new Date(order.createdTime || order.timestamp).toISOString().slice(0, 10);
        if (!daily[day]) daily[day] = { count: 0, revenue: 0 };
        daily[day].count += 1;
        daily[day].revenue += order.total || 0;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            weekStart: start,
            weekEnd: end,
            summary: {
              totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
              totalTransactions: orders.length,
              avgDailyRevenue: orders.length > 0 ? orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 7 : 0,
            },
            dailyBreakdown: daily,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_monthly_summary",
    "Get monthly financial summary.",
    {
      monthDate: z.string().optional().describe("ISO 8601 date within the month (YYYY-MM-DD)"),
    },
    async ({ monthDate }) => {
      const date = monthDate ? new Date(monthDate) : new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const data = await toast.get<any>("/orders/v2/orders", {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      });

      const orders = data.results || data.orders || [];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            month: `${year}-${String(month + 1).padStart(2, "0")}`,
            summary: {
              totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
              totalTransactions: orders.length,
              averageTransaction: orders.length > 0 ? orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0) / orders.length : 0,
            },
          }, null, 2),
        }],
      };
    }
  );
}
