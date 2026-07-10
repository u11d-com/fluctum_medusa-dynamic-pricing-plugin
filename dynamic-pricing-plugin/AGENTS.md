# Dynamic Pricing Plugin — Agent Reference

This file provides context for AI coding agents working inside `dynamic-pricing-plugin/`. Read in conjunction with the root [`AGENTS.md`](../AGENTS.md) and [`docs/architecture.md`](../docs/architecture.md).

---

## Directory Layout

```
dynamic-pricing-plugin/
├── src/
│   ├── index.ts                          ← public exports (types, utils, providers, DYNAMIC_PRICING_MODULE)
│   ├── client.ts                         ← storefront-safe exports (computeFinalPrice, client-types)
│   ├── client-types.ts                   ← SpotPricePayload, VariantPricingData, CartItemPrice, LockedPriceMap, LockPricesResult
│   ├── types.ts                          ← DynamicPricingOptions, ResolvedDynamicPricingOptions, PriceProviderFn
│   ├── options-store.ts                  ← module-level singleton: setPluginOptions() / getPluginOptions()
│   │
│   ├── modules/dynamic-pricing/
│   │   ├── index.ts                      ← Module.define(DYNAMIC_PRICING_MODULE, service, models, migrations, loaders)
│   │   ├── service.ts                    ← DynamicPricingModuleService extends MedusaService
│   │   │                                   Custom methods: getKnex(), getLatestSpotPrices(), deleteCartPriceLocksByCart()
│   │   ├── config.ts                     ← resolvePluginOptions(), ConfigValidationError
│   │   ├── models/
│   │   │   ├── spot-price.ts             ← id, material, ask, bid, price, timestamp
│   │   │   ├── pricing-rule.ts           ← id, name, spread_factor, spread_fixed, premium_percentage, premium_fixed
│   │   │   └── cart-price-lock.ts        ← full lock snapshot; bigNumber fields require raw_* JSONB cols
│   │   ├── migrations/                   ← 3 Knex migration files (never edit manually)
│   │   └── loaders/
│   │       └── config-loader.ts          ← validates config, stores via setPluginOptions(), registers validate hook
│   │
│   ├── links/
│   │   └── variant-pricing-rule.ts       ← ProductVariant ↔ PricingRule; extra cols: material TEXT, weight_oz FLOAT
│   │
│   ├── workflows/
│   │   ├── fetch-and-save-spot-prices.ts ← fetchSpotPricesStep → saveSpotPricesStep (DB + SSE broadcast)
│   │   ├── lock-cart-prices.ts           ← createCartPriceLocksStep: JOIN link+rule+spot → DELETE+INSERT via raw Knex
│   │   ├── create-pricing-rule.ts        ← createPricingRuleWorkflow
│   │   ├── delete-pricing-rule.ts        ← deletePricingRuleWorkflow
│   │   ├── variant-pricing-rule.ts       ← assignVariantPricingRuleWorkflow, unassignVariantPricingRuleWorkflow
│   │   ├── seed-products.ts              ← seedProductsWorkflow (dev only)
│   │   └── currency-rates.ts             ← setReferenceCurrencyCodeWorkflow, upsertCurrencyRateWorkflow
│   │
│   ├── jobs/
│   │   └── fetch-spot-prices.ts          ← cron */10 * * * * *; Redis throttle for intervals ≥60s
│   │
│   ├── api/
│   │   ├── middlewares.ts                ← Zod validation: CreatePricingRuleSchema, AssignVariantPricingRuleSchema, BulkAssignProductPricingRuleSchema
│   │   ├── store/dynamic-pricing/        ← store routes (see below)
│   │   └── admin/dynamic-pricing/        ← admin routes (see below)
│   │
│   ├── admin/
│   │   ├── routes/dynamic-pricing/       ← admin UI pages (config, pricing-rules, spot-prices, currency-rates/)
│   │   ├── widgets/                      ← product-pricing-rule.tsx, variant-pricing-rule.tsx
│   │   ├── hooks.ts                      ← useRules, useMaterials, useVariantRule, useLiveSpotPrices
│   │   ├── components.tsx                ← computePrice() (uses ask), RuleAssignForm, useRuleAssignState
│   │   ├── types.ts                      ← PricingRule, PricingRuleWithMaterial, VariantAssignment, ConfigResponse, SpotPriceMap
│   │   └── lib/client.ts                 ← Medusa SDK (session auth, VITE_BACKEND_URL || "/")
│   │
│   ├── providers/
│   │   ├── random/index.ts               ← sinusoidal drift: BASE_PRICES, DRIFT_AMPLITUDE=0.02, DRIFT_PERIOD_MS=20min
│   │   └── gold-api/index.ts             ← createGoldApiProvider(opts): fetches from goldapi.io
│   │
│   └── utils/
│       ├── price-formula.ts              ← computeFinalPrice(PricingFactors): rounds to 2dp
│       ├── sse-manager.ts                ← SseManager singleton: Map<string, Response>, add/remove/broadcast
│       └── cache.ts                      ← createSimpleCache<T>(ttlMs): in-memory TTL cache
│
└── src/**/__tests__/                     ← unit tests (*.unit.spec.ts)
```

---

## Critical Rules

### Pricing Formula — Never Change Without Explicit Request

```
base          = weight_oz × spot_price × spread_factor × currency_conversion
after_premium = base × (1 + premium_percentage / 100)
final_price   = after_premium + spread_fixed + premium_fixed
```

- `computeFinalPrice()` in `utils/price-formula.ts` is the canonical implementation
- `computePrice()` in `admin/components.tsx` uses `ask` (not `price`) — this is intentional (sell-side admin preview)
- Both must stay in sync. See [`docs/pricing-formula.md`](../docs/pricing-formula.md)

### Price Locks — Never Change Semantics Without Explicit Request

- `force=true` → always fetches from provider directly (not DB cache); creates new locks
- `force=false` → idempotent: reuses existing valid locks; only creates if none exist
- The validate hook in `config-loader.ts` runs at order completion; must always reject missing/expired locks
- `hookRegistered` flag prevents double-registration — do not remove it
- See [`docs/checkout-flow.md`](../docs/checkout-flow.md) and [ADR 0003](../docs/adr/0003-price-lock-on-checkout.md)

### Raw Knex for CartPriceLock Writes

Use raw Knex (via `service.getKnex()`) for all CartPriceLock writes. Do NOT use the MikroORM service layer for these:
- ORM entity cache causes stale reads after DELETE + INSERT in same unit of work
- `model.bigNumber()` fields require explicit `raw_*` JSONB shadow columns
- See [ADR 0004](../docs/adr/0004-raw-knex-for-price-locks.md)

### No Medusa Price Table Writes

Never write to Medusa's `price_set`, `price`, `price_rule`, or `money_amount` tables for dynamic pricing. See [ADR 0001](../docs/adr/0001-no-medusa-price-override.md).

### HTTP Methods

Only `GET`, `POST`, `DELETE` are used. Never add `PUT` or `PATCH` routes.

### Mutations via Workflows

All data mutations must go through Medusa workflows. Do not write to DB directly from route handlers (except the validate hook, which is a framework hook, not a route).

---

## Data Models

### SpotPrice
```ts
{ id, material: string, ask: number, bid: number, price: number, timestamp: Date }
```

### PricingRule
```ts
{ id, name: string, spread_factor: number, spread_fixed: number, premium_percentage: number, premium_fixed: number }
```

### CartPriceLock
```ts
{
  id, cart_id: string, variant_id: string, material: string, weight_oz: number,
  unit_price: BigNumber, quantity: number, spot_price: BigNumber,
  spread_factor: number, spread_fixed: number, premium_percentage: number, premium_fixed: number,
  locked_at: Date, expires_at: Date
}
// bigNumber fields (unit_price, spot_price) require raw_* JSONB shadow columns on INSERT
```

### Module Link
```
ProductVariant ↔ PricingRule
  extra columns: material TEXT NOT NULL, weight_oz FLOAT
  link table: product_product_variant_dynamicpricing_pricing_rule
```

---

## API Routes Reference

### Store (`/store/dynamic-pricing/`)

| Method | Path | Notes |
|---|---|---|
| GET | `/spot-prices` | `?material=` filter |
| GET | `/sse` | SSE stream; keep-alive comment every 30s |
| POST | `/carts/:id/price-lock` | `?force=true\|false` (query param, not body) |
| GET | `/variant-pricing` | Rule + material + weight per variant |
| GET | `/currency-rates` | Active conversion rates |
| GET | `/plugin` | Plugin info |

### Admin (`/admin/dynamic-pricing/`)

| Method | Path | Notes |
|---|---|---|
| GET | `/config` | Read-only plugin config |
| GET | `/pricing-rules` | List, paginated |
| POST | `/pricing-rules` | Zod-validated body |
| GET/DELETE | `/pricing-rules/:id` | |
| GET/POST/DELETE | `/variants/:id/pricing-rule` | assign / read / remove |
| POST | `/products/:id/pricing-rule` | Bulk assign to all variants |
| GET | `/spot-prices` | Historical, paginated |
| GET | `/sse` | Admin SSE stream |
| GET/POST | `/currency-rates` | |
| GET/POST | `/config/reference-currency` | |
| GET | `/seed` | Dev seed only |

---

## Plugin Options

```ts
type DynamicPricingOptions = {
  materials: string[]           // required, e.g. ["XAU", "XAG"]
  fetchIntervalSeconds?: number // default 10
  provider: PriceProviderFn     // required
  priceLockDurationSeconds?: number // default 120
}
```

Options are validated in `config-loader.ts`, stored via `setPluginOptions()`, and read by jobs/steps/routes via `getPluginOptions()`.

---

## Testing

```
src/**/__tests__/*.unit.spec.ts          ← unit tests (pure functions)
src/modules/dynamic-pricing/__tests__/   ← module service integration tests
integration-tests/http/                  ← in starter/backend/ (HTTP cycle tests)
```

```bash
# Unit tests only (in this package)
npm run test:unit

# Integration tests (run from monorepo root)
npm run test:integration
```

**Key integration test notes:**
- Use `Date.now()` suffix on resource names when `disableAutoTeardown: true` to avoid handle collisions
- Payment module (`@medusajs/medusa/payment`) must be in `medusa-config.ts` modules for cart completion
- System payment provider key: `pp_system_default` (not `"system"`)
- `force` parameter is a query param (`?force=true`), not request body

---

## Build & Local Dev

```bash
# Build plugin and push to yalc (run from monorepo root)
npm run plugin:build

# Or directly in this package
npm run build        # medusa plugin:build
npm run dev          # medusa plugin:develop (watch mode)
```

After `plugin:build`, the backend's `.yalc/` copy is updated automatically. Restart the backend to pick up changes.
