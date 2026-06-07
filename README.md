# Jam – Toast MCP Server 🍓

**A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Toast POS](https://www.toasttab.com) — giving AI agents direct access to restaurant operations: menu management, orders, inventory, labor, delivery integrations, and smart operational insights.**

Connect any MCP-compatible AI (Claude, GPT-4, Cursor, Continue, and others) to your Toast account and turn natural language into real POS actions — no dashboard, no manual lookups, no custom integration code.

This project was born out of a simple idea: restaurant owners deserve the same kind of intelligent assistant that enterprise businesses take for granted. Not a chatbot. Not a dashboard. Something that watches your inventory, knows your peak hours, and surfaces insights when you need them most.

We built this as the data layer for an AI co-pilot system. It exposes the Toast API as a clean set of MCP tools that any LLM can call — so instead of logging into Toast, checking stock levels, cross-referencing delivery platforms, and manually updating your menu, you just ask.

---

## What It Does

This server wraps the Toast API into **LLM-callable tools** across every major area of restaurant operations:

| Domain | Capabilities |
|---|---|
| **Inventory** | Real-time stock levels, low-stock alerts, auto-menu adjustments when ingredients run out |
| **Orders** | Order history, details, void handling, **third-party delivery filtering** (UberEats, DoorDash, GrubHub, Postmates, Caviar) |
| **Menu** | Browse items, categories, pricing, search functionality |
| **Labor** | Employee management, shift tracking, labor cost visibility |
| **Smart Operations** | Stock velocity predictions, peak hour detection, automated ordering recommendations |

**Key difference:** Unlike other Toast integrations, Jam includes **native third-party delivery order tracking** with platform-level revenue breakdown — something competitors haven't built.

---

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
- `get_delivery_orders`: Track third-party delivery orders (UberEats, DoorDash, GrubHub, Postmates, Caviar) with revenue breakdown by platform.

### Labor & Staff
- `get_employees`: Manage your team.
- `get_time_entries`: Track shifts and labor costs.

### Smart Operations
- `analyze_stock_needs`: Sales-velocity based predictions.
- `detect_peak_hours`: Staffing optimization intelligence.
- `generate_wholesaler_list`: Automated shopping list generation based on stock levels.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Toast developer account](https://www.toasttab.com) with API credentials
- Your Toast Restaurant GUID

### Install via npm (recommended)

```bash
npx @dokdosolutions/toast-mcp
```

### Or install from source

```bash
npm install
npm run build
```

### Configure

```bash
cp .env.example .env
# Fill in your TOAST_CLIENT_ID, TOAST_CLIENT_SECRET, and TOAST_RESTAURANT_GUID
```

### Run

```bash
npm start
```

Or connect it to your MCP host (like Claude Desktop) using the absolute path to the build:

```json
{
  "mcpServers": {
    "jam": {
      "command": "node",
      "args": ["/absolute/path/to/toast-mcp/dist/index.js"],
      "env": {
        "TOAST_CLIENT_ID": "your_client_id",
        "TOAST_CLIENT_SECRET": "your_client_secret",
        "TOAST_RESTAURANT_GUID": "your_restaurant_guid"
      }
    }
  }
}
```

---

## Built By

[Dokdo Solutions](https://github.com/dokdosolutions-us) — AI integration for restaurant owners.

---

## License

MIT
