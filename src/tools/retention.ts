import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerRetentionTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_frequent_customers",
    "Identify your most loyal customers by order frequency.",
    {
      minOrders: z.number().optional().default(5).describe("Minimum orders to qualify"),
      limit: z.number().optional().default(20).describe("Number of customers to return"),
    },
    async ({ minOrders, limit }) => {
      const data = await toast.get<any>("/orders/v2/orders");
      const orders = data.results || data.orders || [];

      const customers: Record<string, { name: string; count: number; totalSpent: number }> = {};

      orders.forEach((order: any) => {
        const customerId = order.customerId || order.customer?.id || "unknown";
        const customerName = order.customer?.name || order.customerId || "Unknown Customer";

        if (!customers[customerId]) {
          customers[customerId] = { name: customerName, count: 0, totalSpent: 0 };
        }
        customers[customerId].count += 1;
        customers[customerId].totalSpent += order.total || 0;
      });

      const filtered = Object.values(customers)
        .filter(c => c.count >= minOrders)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            frequentCustomers: filtered,
            totalIdentified: filtered.length,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_lapsed_customers",
    "Find customers who haven't visited in a specified period.",
    {
      daysSince: z.number().optional().default(30).describe("Days since last visit"),
      minOrders: z.number().optional().default(2).describe("Minimum prior visits"),
    },
    async ({ daysSince, minOrders }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);

      const data = await toast.get<any>("/orders/v2/orders");
      const orders = (data.results || data.orders || []).sort((a: any, b: any) => {
        const timeA = new Date(a.createdTime || a.timestamp).getTime();
        const timeB = new Date(b.createdTime || b.timestamp).getTime();
        return timeB - timeA;
      });

      const customers: Record<string, { name: string; lastVisit: string; count: number; totalSpent: number }> = {};

      orders.forEach((order: any) => {
        const customerId = order.customerId || order.customer?.id || "unknown";
        const customerName = order.customer?.name || order.customerId || "Unknown Customer";

        if (!customers[customerId]) {
          customers[customerId] = {
            name: customerName,
            lastVisit: order.createdTime || order.timestamp,
            count: 0,
            totalSpent: 0,
          };
        }
        customers[customerId].count += 1;
        customers[customerId].totalSpent += order.total || 0;
      });

      const lapsed = Object.values(customers)
        .filter(c => {
          const lastVisitDate = new Date(c.lastVisit);
          return lastVisitDate < cutoffDate && c.count >= minOrders;
        })
        .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            lapsedCount: lapsed.length,
            daysSince,
            customers: lapsed.slice(0, 20),
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "draft_winback_message",
    "Generate a personalized win-back message for a lapsed customer.",
    {
      customerName: z.string().describe("Customer name"),
      daysSince: z.number().describe("Days since last visit"),
    },
    async ({ customerName, daysSince }) => {
      const messages = [
        `Hi ${customerName}! We've missed you! It's been ${daysSince} days since your last visit. Come back and enjoy your favorite dishes — we have new specials just for returning guests.`,
        `${customerName}, we noticed you haven't stopped by in a while. We'd love to see you again! Enjoy 10% off your next visit.`,
        `Welcome back, ${customerName}! We've added new items to our menu since you last visited ${daysSince} days ago. Come try something fresh!`,
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            customerName,
            daysSince,
            message,
          }, null, 2),
        }],
      };
    }
  );
}
