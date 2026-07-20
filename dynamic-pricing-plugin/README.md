<h1 align="center">
  @u11d/medusa-dynamic-pricing
</h1>

<!-- prettier-ignore -->
<p align="center">
<a href="https://u11d.com"><picture><source media="(prefers-color-scheme: dark)" srcset="https://u11d.com/static/u11d-white-b0b10621fc20805805f23cd6b8c349e0.svg"><source media="(prefers-color-scheme: light)" srcset="https://u11d.com/static/u11d-color-136ce418fbbb940b43748ef1bef30220.svg"><img alt="u11d logo" src="https://u11d.com/static/u11d-color-136ce418fbbb940b43748ef1bef30220.svg" width="110" height="37"></picture></a>
&nbsp;&nbsp;&nbsp;
<a href="https://www.medusajs.com"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin/main/landing-page/www/public/medusa-logo-light.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin/main/landing-page/www/public/medusa-logo-dark.svg"><img alt="Medusa logo" src="https://raw.githubusercontent.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin/main/landing-page/www/public/medusa-logo-dark.svg" width="37" height="37"></picture></a>
&nbsp;&nbsp;&nbsp;
<a href="https://fluctum.io"><img alt="Fluctum logo" src="https://raw.githubusercontent.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin/main/landing-page/www/public/fluctum-logo-full.svg" width="80" height="37"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing"><img src="https://img.shields.io/npm/v/@u11d/medusa-dynamic-pricing.svg" alt="NPM Version"/></a>
  <a href="https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing"><img src="https://img.shields.io/npm/dm/@u11d/medusa-dynamic-pricing.svg" alt="NPM Weekly Downloads"/></a>
  <a href="https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin"><img src="https://img.shields.io/github/stars/u11d-com/fluctum_medusa-dynamic-pricing-plugin.svg" alt="GitHub Stars"/></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
  <a href="https://docs.medusajs.com"><img src="https://img.shields.io/badge/Medusa-2.15%2B-9333ea.svg" alt="Medusa Version"/></a>
</p>

A [Medusa](https://docs.medusajs.com) plugin for real-time dynamic pricing in Medusa stores (precious metals and other volatile-price catalogs). Prices update every few seconds via SSE, are computed on the frontend from live spot prices, and are locked at checkout entry. Created and maintained by [u11d](https://u11d.com).

## Features

- **Live spot prices** — scheduled job fetches ask/bid/spot prices from a configurable provider on every `fetchIntervalSeconds` interval
- **Real-time delivery** — Server-Sent Events (SSE) push prices to the storefront and admin panel without polling
- **Pricing rules** — named rules with spread factor, spread fixed, premium percentage, and premium fixed; assigned per product variant
- **Per-variant material + weight** — each variant carries a material symbol (XAU, XAG, …) and weight in troy ounces via a module link
- **Checkout price locks** — prices are locked when the customer enters checkout; `force=true` creates fresh locks and `force=false` reuses valid locks, both using the latest spot prices stored in DB
- **Admin panel** — config overview, pricing-rule CRUD, live spot-price dashboard, historical prices, variant/product assignment widgets
- **Currency conversion** — optional conversion rates stored in DB and applied in the pricing formula
- **Built-in providers** — `randomProvider` (sinusoidal drift, for dev/testing), `createGoldApiProvider` (goldapi.io), `createStaticRatesProvider` and `exchangeRateHostProvider` for currency conversion

## Installation

```bash
npm install @u11d/medusa-dynamic-pricing
```

Register in `medusa-config.ts`:

```ts
import { randomProvider } from "@u11d/medusa-dynamic-pricing";

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
});
```

## Plugin Options

| Option                     | Type                        | Default  | Description                                                                                                                                            |
| -------------------------- | --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `materials`                | `string[]`                  | required | Material symbols to track, e.g. `["XAU", "XAG"]`                                                                                                       |
| `fetchIntervalSeconds`     | `number`                    | `10`     | How often to fetch/generate spot prices (1–3600)                                                                                                       |
| `provider`                 | `PriceProviderFn`           | required | Function that returns spot prices for a list of materials                                                                                              |
| `pricingCurrency`          | `string`                    | `"USD"`  | ISO-4217 currency code in which `provider` returns spot prices                                                                                         |
| `currencyConversion`       | `CurrencyConversionOptions` | `null`   | Optional block: `{ provider: CurrencyRateProviderFn, refreshIntervalSeconds?: number, targetCurrencies: string[] }`. Enables multi-currency conversion |
| `priceLockDurationSeconds` | `number`                    | `120`    | How long a price lock is valid during checkout                                                                                                         |

## Pricing Formula

```
base  = weight_oz × spot_price × spread_factor × currency_conversion
after_premium = base × (1 + premium_percentage / 100)
final = after_premium + spread_fixed + premium_fixed
```

Prices are stored and returned as decimal numbers (not cents). The `computeFinalPrice` utility is exported from both the main entry point and the `./client` subpath for use in storefronts.

## Data Models

| Model           | Key fields                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `SpotPrice`     | `material`, `ask`, `bid`, `price`, `timestamp`                                                          |
| `PricingRule`   | `name`, `spread_factor`, `spread_fixed`, `premium_percentage`, `premium_fixed`                          |
| `CartPriceLock` | `cart_id`, `variant_id`, `material`, `weight_oz`, `unit_price`, `spot_price`, `locked_at`, `expires_at` |

## Store API Routes

All routes are under `/store/dynamic-pricing/` unless noted.

| Method | Path                    | Description                                                                                       |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/spot-prices`          | Latest spot prices; optional `?material=` filter                                                  |
| GET    | `/sse`                  | SSE stream; sends current prices and a `currency-rates` event on connect, then broadcasts updates |
| POST   | `/carts/:id/price-lock` | Lock prices for a cart; `?force=true` always creates fresh locks (from latest DB spot prices)     |
| GET    | `/variant-pricing`      | Variant pricing details (rule + material + weight) for one or more `?variant_id=` values          |
| GET    | `/currency-rates`       | Latest FX rates relative to `pricingCurrency`; used as an SSE-fallback polling source             |
| GET    | `/plugin`               | Liveness check — top-level `/store/plugin` (not nested under `/dynamic-pricing/`)                 |

## Admin API Routes

All routes are under `/admin/dynamic-pricing/` unless noted.

| Method          | Path                         | Description                                                                       |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| GET             | `/config`                    | Plugin config (read-only)                                                         |
| GET/POST        | `/pricing-rules`             | List / create pricing rules                                                       |
| GET/DELETE      | `/pricing-rules/:id`         | Get / delete a pricing rule                                                       |
| GET/POST/DELETE | `/variants/:id/pricing-rule` | Assign / read / remove a pricing rule from a variant                              |
| POST            | `/products/:id/pricing-rule` | Bulk-assign a rule to all variants in a product                                   |
| GET             | `/spot-prices`               | Historical spot prices with pagination                                            |
| GET             | `/sse`                       | Admin SSE stream                                                                  |
| POST            | `/seed`                      | Seed sample products via `seedProductsWorkflow`                                   |
| GET             | `/plugin`                    | Liveness check — top-level `/admin/plugin` (not nested under `/dynamic-pricing/`) |

## Exports

```ts
import {
  randomProvider,
  createGoldApiProvider,
  createStaticRatesProvider,
  exchangeRateHostProvider,
  seedProductsWorkflow,
  DYNAMIC_PRICING_MODULE,
} from "@u11d/medusa-dynamic-pricing";
import {
  computeFinalPrice,
  PricingFactors,
} from "@u11d/medusa-dynamic-pricing/client";
import { lockCartPricesWorkflow } from "@u11d/medusa-dynamic-pricing/workflows";
```

## Development

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for local setup, build workflow, and testing instructions.
