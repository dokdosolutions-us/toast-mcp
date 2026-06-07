# Jam – Toast MCP Server 🍓

A production-ready Model Context Protocol (MCP) server for Toast POS, engineered for the front lines of restaurant operations. Give any LLM direct access to your Toast data — inventory, orders, menu, labor, and smart operational insights.

## The Mission
Dokdo Solutions believes in empowering restaurant owners with the same level of intelligence and automation as tech giants. This MCP server bridges the gap between Toast's robust POS data and the reasoning capabilities of Large Language Models (LLMs), enabling smarter inventory tracking, predictive ordering, and seamless "restaurant owner first" operations.

## Key Features

- **Inventory Mastery:** Real-time stock tracking and low-stock alerts.
- **Smart Insights:** Predictive analysis of stock needs and peak hour detection.
- **Modular Tools:** Dedicated modules for Menu, Orders, Inventory, Labor, and Restaurant management.
- **Robust Architecture:** Built with TypeScript, Zod validation, Bottleneck rate-limiting, and Axios-retry for mission-critical reliability.

## Tools

### Inventory
- `get_stock_levels`: Full visibility into your ingredients.
- `update_stock`: Manual corrections after shipments.
- `auto_86_item`: Instant menu updates for depleted items.
- `get_low_stock_items`: Automated alerts for reordering.

### Menu
- `get_menu`: Comprehensive menu fetch.
- `get_menu_item`: Deep dive into specific selections.
- `search_menu`: Find what you need, fast.

### Orders
- `get_orders`: Monitor recent transactions.
- `get_order_details`: Audit specific orders.
- `void_order`: Handle corrections with ease.

### Labor & Staff
- `get_employees`: Manage your team.
- `get_time_entries`: Track shifts and labor costs.

### Smart Operations
- `analyze_stock_needs`: Sales-velocity based predictions.
- `detect_peak_hours`: Staffing optimization intelligence.
- `generate_wholesaler_list`: Automated shopping list generation based on stock levels.

## Setup

### 1. Prerequisites
- Toast API Client ID and Secret.
- Your Restaurant GUID.

### 2. Environment Configuration
Create a `.env` file from the provided `.env.example`:
```bash
TOAST_CLIENT_ID=your_client_id
TOAST_CLIENT_SECRET=your_client_secret
TOAST_RESTAURANT_GUID=your_restaurant_guid
TOAST_API_BASE_URL=https://api.toasttab.com
```

### 3. Installation
```bash
npm install
npm run build
```

### 4. Usage
Run via `npx`:
```bash
npx .
```

Or connect it to your MCP host (like Claude Desktop) using the absolute path to the build:
```json
{
  "mcpServers": {
    "toast": {
      "command": "node",
      "args": ["/absolute/path/to/toast-mcp/dist/index.js"],
      "env": {
        "TOAST_CLIENT_ID": "...",
        "TOAST_CLIENT_SECRET": "...",
        "TOAST_RESTAURANT_GUID": "..."
      }
    }
  }
}
```

## License
MIT - Created with pride by Dokdo Solutions.
