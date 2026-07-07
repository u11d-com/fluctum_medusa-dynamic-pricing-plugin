# @u11d/medusa-dynamic-pricing

A [Medusa v2](https://docs.medusajs.com) plugin for real-time dynamic pricing of precious metals (gold, silver, platinum, palladium). Prices update every few seconds via SSE, are computed on the frontend from live spot prices, and are locked at checkout entry.

## Features

- **Live spot prices** — scheduled job fetches ask/bid/spot prices from a configurable provider on every `fetchIntervalSeconds` interval
- **Real-time delivery** — Server-Sent Events (SSE) push prices to the storefront and admin panel without polling
- **Pricing rules** — named rules with spread factor, spread fixed, premium percentage, and premium fixed; assigned per product variant
- **Per-variant material + weight** — each variant carries a material symbol (XAU, XAG, …) and weight in troy ounces via a module link
- **Checkout price locks** — prices are locked when the customer enters checkout; the `completeCartWorkflow` validate hook rejects orders with missing or expired locks
- **Admin panel** — config overview, pricing-rule CRUD, live spot-price dashboard, historical prices, variant/product assignment widgets
- **Currency conversion** — optional conversion rates stored in DB and applied in the pricing formula
- **Built-in providers** — `randomProvider` (sinusoidal drift, for dev/testing), `createGoldApiProvider` (goldapi.io)

## Installation

```bash
npm install @u11d/medusa-dynamic-pricing
```

Register in `medusa-config.ts`:

```ts
import { randomProvider } from "@u11d/medusa-dynamic-pricing"

export default defineConfig({
  plugins: [
    {
      resolve: "@u11d/medusa-dynamic-pricing",
      options: {
        materials: ["XAU", "XAG"],
        fetchIntervalSeconds: 10,
        priceLockDurationSeconds: 120,
        provider: randomProvider,
      },
    },
  ],
})
```

## Plugin Options

| Option | Type | Default | Description |
|---|---|---|---|
| `materials` | `string[]` | required | Material symbols to track, e.g. `["XAU", "XAG"]` |
| `fetchIntervalSeconds` | `number` | `10` | How often to fetch/generate spot prices |
| `provider` | `PriceProviderFn` | required | Function that returns spot prices for a list of materials |
| `priceLockDurationSeconds` | `number` | `120` | How long a price lock is valid during checkout |

## Pricing Formula

```
base  = weight_oz × spot_price × spread_factor × currency_conversion
after_premium = base × (1 + premium_percentage / 100)
final = after_premium + spread_fixed + premium_fixed
```

Prices are stored and returned as decimal numbers (not cents). The `computeFinalPrice` utility is exported from both the main entry point and the `./client` subpath for use in storefronts.

## Data Models

| Model | Key fields |
|---|---|
| `SpotPrice` | `material`, `ask`, `bid`, `price`, `timestamp` |
| `PricingRule` | `name`, `spread_factor`, `spread_fixed`, `premium_percentage`, `premium_fixed` |
| `CartPriceLock` | `cart_id`, `variant_id`, `material`, `weight_oz`, `unit_price`, `spot_price`, `locked_at`, `expires_at` |

## Store API Routes

All routes are under `/store/dynamic-pricing/`.

| Method | Path | Description |
|---|---|---|
| GET | `/spot-prices` | Latest spot prices; optional `?material=` filter |
| GET | `/sse` | SSE stream; sends current prices on connect, then broadcasts updates |
| POST | `/carts/:id/price-lock` | Lock prices for a cart; `?force=true` always creates fresh locks |
| GET | `/variant-pricing` | Variant pricing details (rule + material + weight) |
| GET | `/currency-rates` | Active currency conversion rates |
| GET | `/plugin` | Plugin info (version, materials) |

## Admin API Routes

All routes are under `/admin/dynamic-pricing/`.

| Method | Path | Description |
|---|---|---|
| GET | `/config` | Plugin config (read-only) |
| GET/POST | `/pricing-rules` | List / create pricing rules |
| GET/DELETE | `/pricing-rules/:id` | Get / delete a pricing rule |
| GET/POST/DELETE | `/variants/:id/pricing-rule` | Assign / read / remove a pricing rule from a variant |
| POST | `/products/:id/pricing-rule` | Bulk-assign a rule to all variants in a product |
| GET | `/spot-prices` | Historical spot prices with pagination |
| GET | `/sse` | Admin SSE stream |
| GET/POST | `/currency-rates` | List / upsert currency conversion rates |
| GET/POST | `/config/reference-currency` | Read / set reference currency |
| GET | `/seed` | Seed sample products (dev only) |

## Exports

```ts
import { randomProvider, createGoldApiProvider } from "@u11d/medusa-dynamic-pricing"
import { computeFinalPrice, PricingFactors } from "@u11d/medusa-dynamic-pricing/client"
import { lockCartPricesWorkflow } from "@u11d/medusa-dynamic-pricing/workflows"
import { DYNAMIC_PRICING_MODULE } from "@u11d/medusa-dynamic-pricing"
```

## Development

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for local setup, build workflow, and testing instructions.
