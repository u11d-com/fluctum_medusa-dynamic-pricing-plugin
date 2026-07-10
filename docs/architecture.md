# System Architecture

## Overview

The dynamic pricing solution is a Medusa v2 plugin (`@u11d/medusa-dynamic-pricing`) layered on top of a standard Medusa backend + Next.js storefront stack. Its core responsibility is to make product prices reflect live precious-metal spot prices in real time, while ensuring order integrity at checkout via price locks.

## Component Map

```
┌────────────────────────────────────────────────────────────────┐
│  Monorepo root                                                 │
│                                                                │
│  ┌──────────────────────────┐   ┌───────────────────────────┐  │
│  │  dynamic-pricing-plugin  │   │  starter/backend          │  │
│  │  @u11d/medusa-dynamic-   │   │  @u11d/medusa-dynamic-    │  │
│  │  pricing                 │   │  pricing-backend          │  │
│  │                          │   │                           │  │
│  │  • Module + Service      │   │  • medusa-config.ts       │  │
│  │  • Workflows             │   │  • integration-tests/     │  │
│  │  • Scheduled job         │   │  • migration-scripts/     │  │
│  │  • Store + Admin routes  │◄──│                           │  │
│  │  • Admin UI (widgets,    │   │  Plugin linked via yalc   │  │
│  │    routes)               │   └───────────────────────────┘  │
│  │  • SSE manager           │                                  │
│  │  • Price formula util    │   ┌───────────────────────────┐  │
│  │  • Providers             │   │  starter/storefront       │  │
│  └──────────────────────────┘   │  Next.js 16               │  │
│                                 │                           │  │
│  ┌──────────────────────────┐   │  • SSE context + proxy    │  │
│  │  PostgreSQL              │   │  • Live price bar         │  │
│  │  (docker-compose)        │   │  • Cart with live prices  │  │
│  └──────────────────────────┘   │  • Checkout with locks    │  │
│  ┌──────────────────────────┐   │  • Admin price widgets    │  │
│  │  Redis                   │   └───────────────────────────┘  │
│  │  (event bus + locking)   │                                  │
│  └──────────────────────────┘                                  │
└────────────────────────────────────────────────────────────────┘
```

## Plugin Internal Architecture

```
dynamic-pricing-plugin/src/
├── index.ts                         ← public exports (types, utils, providers)
├── client.ts                        ← storefront-safe exports (no server deps)
├── client-types.ts                  ← shared types for storefront integration
├── options-store.ts                 ← module-scoped singleton for plugin config
│
├── modules/dynamic-pricing/
│   ├── index.ts                     ← module definition (DYNAMIC_PRICING_MODULE)
│   ├── service.ts                   ← DynamicPricingModuleService (MedusaService)
│   ├── models/
│   │   ├── spot-price.ts
│   │   ├── pricing-rule.ts
│   │   └── cart-price-lock.ts
│   ├── migrations/                  ← 3 Knex migration files
│   └── loaders/
│       └── config-loader.ts         ← validates config, registers validate hook
│
├── links/
│   └── variant-pricing-rule.ts      ← module link: ProductVariant ↔ PricingRule
│
├── workflows/
│   ├── fetch-and-save-spot-prices.ts
│   ├── lock-cart-prices.ts
│   ├── create-pricing-rule.ts
│   ├── delete-pricing-rule.ts
│   ├── variant-pricing-rule.ts      ← assign/unassign workflows
│   ├── seed-products.ts
│   └── currency-rates.ts
│
├── jobs/
│   └── fetch-spot-prices.ts         ← cron every 10s, calls workflow
│
├── api/
│   ├── middlewares.ts               ← Zod validation for mutation routes
│   ├── store/dynamic-pricing/       ← store API routes
│   └── admin/dynamic-pricing/       ← admin API routes
│
├── admin/
│   ├── routes/dynamic-pricing/      ← admin UI pages
│   ├── widgets/                     ← product + variant detail widgets
│   ├── hooks.ts                     ← React hooks (useRules, useLiveSpotPrices…)
│   ├── components.tsx               ← shared admin components
│   ├── types.ts                     ← admin-side TypeScript types
│   └── lib/client.ts                ← Medusa SDK instance
│
├── providers/
│   ├── random/index.ts              ← sinusoidal drift for dev/testing
│   └── gold-api/index.ts            ← goldapi.io integration
│
└── utils/
    ├── price-formula.ts             ← computeFinalPrice()
    ├── sse-manager.ts               ← SseManager singleton
    └── cache.ts                     ← in-memory TTL cache
```

## Data Flow: Price Update Cycle

```
1. Scheduled job (*/10 * * * * *)
       │
       ▼
2. fetchAndSaveSpotPricesWorkflow
       ├─ fetchSpotPricesStep   → calls provider(materials[])
       └─ saveSpotPricesStep    → INSERT INTO spot_price (upsert)
                                → sseManager.broadcast(payload)
       │
       ▼
3. SSE connections (store + admin)
       ├─ Storefront SpotPriceContext → re-renders live price bar
       └─ Admin useLiveSpotPrices()   → re-renders spot price cards
```

## Data Flow: Checkout Price Lock

```
Cart page
  → user clicks "Go to checkout"
  → lockCartPrices(cartId, force=true)          ← always fresh
      → POST /store/dynamic-pricing/carts/:id/price-lock?force=true
          → lockCartPricesWorkflow
              → JOIN link table + pricing_rule + spot_price
              → DELETE old cart_price_lock rows
              → INSERT new rows (raw Knex, bigNumber JSONB fields)
              → cartModule.updateLineItems (update displayed prices)
  → navigate to /checkout

Checkout page (CheckoutSummary mounts)
  → useEffect → lockCartPrices(cartId, force=false)   ← idempotent reuse
      (creates fresh locks only if none exist)

User clicks "Place order"
  → completeCartWorkflow.hooks.validate
      → SELECT * FROM cart_price_lock WHERE cart_id = ?
      → reject if any lock missing or expires_at < now()
```

## Module Link: Variant → Pricing Rule

The plugin uses a Medusa module link to attach pricing metadata to product variants without modifying Medusa core tables:

```
ProductVariant (Medusa core)
    ↓  via link table
PricingRule (plugin module)
    + extra columns: material TEXT NOT NULL
                     weight_oz FLOAT
```

Link table: `product_product_variant_dynamicpricing_pricing_rule`

## SSE Architecture

The `SseManager` is a module-scoped singleton (one instance per Medusa worker process):

- Holds a `Map<string, Response>` of active HTTP response streams
- `add(id, res)` — registers a new SSE client; sets headers, sends current prices on connect
- `remove(id)` — removes client on disconnect
- `broadcast(payload)` — sends `data: <JSON>` to all connected clients
- Keep-alive: each SSE handler sends a comment every 30 seconds

The storefront proxies the SSE stream through a Next.js route handler (`/api/sse/spot-prices`) to avoid CORS issues and to keep the Medusa backend URL server-side.

## Technology Stack

| Layer                | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| Backend framework    | Medusa v2                                            |
| Language             | TypeScript                                           |
| Database             | PostgreSQL 17                                        |
| ORM                  | MikroORM (via Medusa) + raw Knex for write-heavy ops |
| Cache / messaging    | Redis 8 (event bus + distributed locking)            |
| Storefront           | Next.js 16 (App Router, RSC)                         |
| Admin UI             | Medusa Admin SDK (`@medusajs/ui`, `@medusajs/icons`) |
| Monorepo             | Turborepo + npm workspaces                           |
| Local plugin linking | yalc                                                 |
| Testing              | Jest + `@medusajs/test-utils`                        |
