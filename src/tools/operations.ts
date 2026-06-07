import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerOperationsTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_open_orders",
    "Get all currently open (unpaid) orders.",
    {
      limit: z.number().optional().default(50).describe("Maximum orders to return"),
    },
    async ({ limit }) => {
      const data = await toast.get<any>("/orders/v2/orders", {
        status: "OPEN",
      });

      const orders = (data.results || data.orders || []).slice(0, limit);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            openOrders: orders.length,
            orders: orders.map((o: any) => ({
              guid: o.guid,
              createdTime: o.createdTime,
              items: o.lineItems?.length || 0,
              total: o.total,
              status: o.status,
            })),
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_voided_orders",
    "Get recently voided orders to track cancellations and adjustments.",
    {
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ startDate, endDate }) => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await toast.get<any>("/orders/v2/orders", {
        ...params,
        status: "VOIDED",
      });

      const orders = data.results || data.orders || [];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            voidedCount: orders.length,
            totalVoidedRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
            orders: orders.map((o: any) => ({
              guid: o.guid,
              createdTime: o.createdTime,
              voidedTime: o.voidedTime,
              total: o.total,
            })),
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_refund_analysis",
    "Analyze refund patterns and amounts.",
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

      const refunds = orders.filter((o: any) => o.refunds && o.refunds.length > 0);
      const totalRefunded = refunds.reduce((sum: number, o: any) => {
        const orderRefunds = o.refunds || [];
        return sum + orderRefunds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
      }, 0);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: {
              totalOrders: orders.length,
              refundedOrders: refunds.length,
              refundRate: orders.length > 0 ? ((refunds.length / orders.length) * 100).toFixed(2) + "%" : "0%",
              totalRefunded,
              averageRefund: refunds.length > 0 ? (totalRefunded / refunds.length).toFixed(2) : 0,
            },
          }, null, 2),
        }],
      };
    }
  );
}
