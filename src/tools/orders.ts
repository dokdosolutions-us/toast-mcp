import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerOrderTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_orders",
    "List recent orders for the restaurant. Filter by status or date.",
    {
      status: z.enum(["OPEN", "PAID", "VOIDED"]).optional().describe("Filter by order status"),
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ status, startDate, endDate }) => {
      const params: any = {};
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await toast.get<any>("/orders/v2/orders", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_order_details",
    "Get full details for a specific order, including line items and payments.",
    {
      orderGuid: z.string().describe("Toast order GUID"),
    },
    async ({ orderGuid }) => {
      const data = await toast.get<any>(`/orders/v2/orders/${orderGuid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "void_order",
    "Void an existing order. Requires a valid reason.",
    {
      orderGuid: z.string().describe("Toast order GUID"),
      reason: z.string().describe("Reason for voiding"),
    },
    async ({ orderGuid, reason }) => {
      await toast.post<any>(`/orders/v2/orders/${orderGuid}/void`, { reason });
      return { content: [{ type: "text", text: `Order ${orderGuid} has been voided. Reason: ${reason}` }] };
    }
  );

  server.tool(
    "get_delivery_orders",
    "Get orders from third-party delivery platforms (UberEats, DoorDash, GrubHub, Postmates, Caviar, etc). Groups by service and shows revenue breakdown per platform.",
    {
      service: z.enum(["all", "ubereats", "doordash", "grubhub", "postmates", "caviar", "unknown"]).optional().default("all").describe("Filter to a specific delivery service"),
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ service, startDate, endDate }) => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await toast.get<any>("/orders/v2/orders", params);
      const orders = data.results || data.orders || [];

      const normalizeService = (source: string): string => {
        if (!source) return "unknown";
        const lower = source.toLowerCase();
        if (/uber/.test(lower)) return "ubereats";
        if (/door\s?dash/.test(lower)) return "doordash";
        if (/grub\s?hub/.test(lower)) return "grubhub";
        if (/postmates/.test(lower)) return "postmates";
        if (/caviar/.test(lower)) return "caviar";
        if (/delivery|takeout|online|third.?party/.test(lower)) return "online";
        return "unknown";
      };

      const deliveryServices = ["ubereats", "doordash", "grubhub", "postmates", "caviar"];
      const deliveryOrders = orders.filter((order: any) => {
        const source = order.source?.name || order.sourceType || order.orderType || "";
        return deliveryServices.some(svc => normalizeService(source).includes(svc)) || /delivery|online|third.?party/.test(source.toLowerCase());
      });

      if (service === "all") {
        const grouped = deliveryOrders.reduce((acc: any, order: any) => {
          const source = order.source?.name || order.sourceType || order.orderType || "unknown";
          const svc = normalizeService(source);
          if (!acc[svc]) acc[svc] = { count: 0, total: 0, orders: [] };
          acc[svc].count += 1;
          acc[svc].total += order.total || 0;
          acc[svc].orders.push(order);
          return acc;
        }, {});

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              summary: {
                totalDeliveryOrders: deliveryOrders.length,
                byService: Object.entries(grouped).map(([svc, data]: [string, any]) => ({
                  service: svc,
                  orders: data.count,
                  revenue: data.total,
                })),
              },
              orders: grouped,
            }, null, 2),
          }],
        };
      } else {
        const filtered = deliveryOrders.filter((order: any) => {
          const source = order.source?.name || order.sourceType || order.orderType || "";
          return normalizeService(source) === service;
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              service,
              count: filtered.length,
              total: filtered.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
              orders: filtered,
            }, null, 2),
          }],
        };
      }
    }
  );
}
