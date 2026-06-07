import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToastClient } from "../toast-client.js";

export function registerLaborTools(server: McpServer, toast: ToastClient) {
  server.tool(
    "get_employees",
    "List all employees and their roles.",
    {},
    async () => {
      const data = await toast.get<any>(`/labor/v1/employees/${toast.restaurantGuid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_time_entries",
    "Fetch labor time entries for a specific period to monitor shifts and overtime.",
    {
      startDate: z.string().describe("ISO 8601 start date"),
      endDate: z.string().describe("ISO 8601 end date"),
    },
    async ({ startDate, endDate }) => {
      const data = await toast.get<any>(`/labor/v1/timeEntries/${toast.restaurantGuid}`, { startDate, endDate });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
