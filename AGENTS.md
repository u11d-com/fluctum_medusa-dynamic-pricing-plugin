# Dynamic Pricing Framework — Agent Reference

> **Note:** This file is an internal development journal and AI agent context. End users should read [README.md](README.md) and the [docs/](docs/) directory first.

## Project Overview

An open-source dynamic pricing framework built on top of MedusaJS. Targets precious metals e-commerce (gold, silver, etc.) where prices update every few seconds. The framework consists of:

- **`dynamic-pricing-plugin/`** — Medusa plugin (`@u11d/medusa-dynamic-pricing`) containing all dynamic pricing logic
- **`starter/backend/`** — Medusa backend starter (uses the plugin via yalc during development)
- **`starter/storefront/`** — Next.js 16 storefront with live SSE price bar, dynamic-pricing cart, and price-locked checkout

---

## Repository Structure

```
dynamic-pricing/                    ← monorepo root
├── starter/
│   ├── backend/                   ← @u11d/medusa-dynamic-pricing-backend — Medusa backend starter
│   └── storefront/                ← Next.js 16 storefront (live prices + checkout)
├── landing-page/
│   ├── www/                       ← fluctum.io landing page
│   └── form-handler/              ← Serverless form handler
├── dynamic-pricing-plugin/        ← @u11d/medusa-dynamic-pricing — Medusa plugin
├── docker-compose.yml             ← PostgreSQL 17 + Redis 8 for local dev
├── reset-db.sh                    ← authoritative local-env reset script (see below)
└── AGENTS.md                      ← this file
```

Plugin is linked to backend via yalc (`.yalc/` in backend). Workflow for local dev: build plugin → yalc push → backend picks it up.

---

## Local Development — Fresh Environment Reset

**⚠️ ALWAYS use `npm run db:reset` when resetting your local database. Do NOT reset manually.**

This is a common failure mode: manually dropping the DB or running `docker compose down -v` recreates a fresh Postgres with a fresh publishable API key — but `starter/storefront/.env` still holds the OLD key. The storefront then returns HTTP 500 on every request because the key is rejected by the backend (`{"type":"not_allowed","message":"A valid publishable key is required..."}`).

The `db:reset` script (`reset-db.sh` at the repo root) does everything in one atomic operation:

1. Terminates active Postgres connections to `dynamic_pricing`
2. `DROP DATABASE dynamic_pricing`
3. `CREATE DATABASE dynamic_pricing`
4. `npm run backend:migrate` (also runs the initial data seed)
5. `npm run backend:create-admin` (creates the default admin user)
6. Reads the freshly-generated publishable API key and updates `starter/storefront/.env` in place

Usage:

```bash
npm run db:reset
```

**Restart the storefront after `db:reset`.** `NEXT_PUBLIC_*` env vars are baked in at Next.js process start — an already-running storefront will keep serving requests with the stale key from memory. Recommended flow:

1. Stop backend + storefront (Ctrl+C the `npm run dev` / turbo process)
2. `npm run db:reset`
3. `npm run dev` again

Manual reset (`docker compose down -v`, dropping the DB by hand, running migrate + seed separately) is a supported fallback ONLY IF you also manually re-sync the publishable key into `starter/storefront/.env` and restart the storefront. In practice: use `db:reset`.

---

## Business Domain

### Pricing Formula

```
final_price = weight × material_spot_price × factor × currency_conversion
```

- `weight` — product variant attribute, always in troy ounces
- `material_spot_price` — fetched from provider (e.g. XAU, XAG), stored in DB
- `factor` — composed of: `spread_factor` (multiplier, default 1), `spread_fixed` (additive, default 0), `premium_percentage` (%, default 0), `premium_fixed` (additive, default 0)
- `currency_conversion` — conversion rate (default 1)

**We do NOT override Medusa prices in cart.** Prices are calculated dynamically on the frontend using SSE spot prices.

### Cart / Checkout Flow

- While items are in cart, prices update in real time via SSE
- When user clicks "Go to checkout", prices are **locked** (force-realculated) before navigating to checkout page
- On first checkout page load, prices are locked again via `useEffect` in `CheckoutSummary`
- During checkout form steps (address, delivery, payment), prices do NOT refresh — `CheckoutSummary` stays mounted
- `placeOrder()` does NOT re-lock prices — the mount-time lock is reused. The validate hook (`config-loader.ts`) checks that locks still exist and haven't expired at order completion.
- Admin panel order placement is blocked (store only)

### Price Refreshing Rules

These rules govern when price locks are created or reused:

| Action                                      | Lock behavior                             | Why                                                                                                                             |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Action                                      | Lock behavior                             | Why                                                                                                                             |
| ---                                         | ---                                       | ---                                                                                                                             |
| Click "Refresh prices" on checkout          | Always creates fresh locks (`force=true`) | Intentional user action                                                                                                         |
| Click "Go to checkout" on cart page         | Always creates fresh locks (`force=true`) | Cart page calls `lockCartPrices(id, true)` before navigating                                                                    |
| Paste checkout URL or page refresh          | Creates fresh locks if none exist         | `useEffect` calls `lockCartPrices(id, false)` — no existing locks → fresh created                                               |
| Submit address (`redirect()`)               | Reuses existing locks (`force=false`)     | `redirect()` causes full page navigation → `CheckoutSummary` remounts → `useEffect` calls `force=false` → existing locks reused |
| Select delivery / payment (`router.push()`) | Prices do NOT change                      | Client-side navigation, `CheckoutSummary` stays mounted and `useEffect` doesn't re-fire                                         |
| Click "Place order"                         | Does NOT create locks                     | Uses mount-time locks; validate hook checks they still exist and haven't expired                                                |
| Cart page                                   | Dynamic SSE prices (never locked)         | Real-time spot price display                                                                                                    |

**Key architectural constraint**: The address form uses `redirect()` in a server action (`setAddresses`), which triggers a full page navigation. This causes `CheckoutSummary` to remount, losing React state. Therefore, the `useEffect` calls `lockCartPrices(id, false)` — without `force`, the step idempotently reuses any existing valid locks, preserving prices across the redirect. The delivery and payment steps use `router.push()` (client-side navigation), so `CheckoutSummary` stays mounted and its `useEffect` never re-fires.

---

## Plugin Configuration (`@u11d/medusa-dynamic-pricing`)

Options defined in `medusa-config.ts` `plugins` array:

| Option                     | Description                                                                                                                                                                                                   | Default  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `materials`                | Array of material symbols, e.g. `["XAU", "XAG"]`                                                                                                                                                              | required |
| `fetchIntervalSeconds`     | How often to fetch/generate spot prices                                                                                                                                                                       | `10`     |
| `provider`                 | Price provider function/identifier                                                                                                                                                                            | required |
| `priceLockDurationSeconds` | How long prices are locked during checkout                                                                                                                                                                    | `120`    |
| `pricingCurrency`          | Currency code in which the provider returns spot prices                                                                                                                                                       | `"USD"`  |
| `currencyConversion`       | Optional block: `{ provider: CurrencyRateProviderFn, refreshIntervalSeconds?: number, targetCurrencies: string[] }`. When set, a scheduled job refreshes FX rates and the lock step applies them at checkout. | `null`   |

Built-in providers exported from plugin:

- `randomProvider` — generates correlated random ask/bid/spot prices (for dev/testing)
- `goldApiProvider` — fetches from goldapi.io
- `createStaticRatesProvider({ rates: Record<string, number> })` — currency rate provider using hardcoded rates (for dev/seed)
- `exchangeRateHostProvider` — fetches live FX rates from exchangerate.host API (no API key required)

---

## Data Models (in plugin module)

### `SpotPrice`

- `id`, `material` (XAU/XAG), `ask`, `bid`, `price` (mid/current), `timestamp`
- Used for both current and historical values

### `PricingRule`

- `id`, `name`, `spread_factor`, `spread_fixed`, `premium_percentage`, `premium_fixed`
- Named rules that can be assigned to product variants

### `CartPriceLock`

- `id`, `cart_id`, `variant_id`, `material`, `weight_oz`, `unit_price`, `quantity`, `spot_price`, `spread_factor`, `spread_fixed`, `premium_percentage`, `premium_fixed` — all `bigNumber` fields require `raw_*` JSONB shadow columns on INSERT
- `locked_at`, `expires_at`, `currency_code` (text), `conversion_rate` (bigNumber)
- Created when user enters checkout; `currency_code` and `conversion_rate` from the FX rates table at lock time; validated at order placement

### `CurrencyRate`

- `id`, `from_currency` (ISO3 uppercase), `to_currency` (ISO3 uppercase), `rate` (bigNumber)
- Refreshed by `refreshCurrencyRatesWorkflow` (scheduled hourly when `currencyConversion` is configured)
- Latest query uses `DISTINCT ON (from_currency, to_currency) ORDER BY created_at DESC` — only the most recent rate per pair is used

### Module Links

- `PricingRule` ↔ Medusa `ProductVariant` (variant has one pricing rule + material symbol + weight)

---

## Development Plan

### Step 0 — Environment Verification ✅ (current)

Verify plugin setup, backend setup, docker-compose, yalc link.

### Step 1 — Plugin Configuration

- Define plugin options interface
- Register plugin module with typed config
- Validate config at startup

### Step 2 — Random Price Provider + Scheduled Job

- `RandomPriceProvider` implementing provider interface
- `GoldApiPriceProvider` stub
- Scheduled job that calls provider every `fetchIntervalSeconds`
- Stores results in `SpotPrice` table
- Prices correlated to time (sinusoidal drift)
- Fields: `ask`, `bid`, `price` (current/mid)

### Step 3 — Admin Page: Plugin Config Overview

- Read-only page in Medusa admin showing current plugin config (materials, interval, provider name, lock duration)

### Step 4 — Historical Prices Module

- `SpotPrice` data model with migrations
- Module service (list, latest per material)

### Step 5 — Admin Page: Historical Prices

- Admin page showing current and historical spot prices per material
- Auto-refresh or SSE-driven

### Step 6 — Pricing Rules + Product Variant Linking

- `PricingRule` data model
- CRUD API for pricing rules
- Module link: variant → pricing rule + material + weight
- Admin UI: manage pricing rules, assign to variants
- Pricing tiers (volume-based or customer-tier discounts) — TBD

### Step 7 — Server-Sent Events (SSE)

- Store SSE endpoint publishing current spot prices every `fetchIntervalSeconds`
- Admin SSE endpoint for admin panel live updates

### Step 8 — Checkout / Order Flow ✅ (current)

- `CartPriceLock` data model (`modules/dynamic-pricing/models/cart-price-lock.ts`) with migration
- `createCartPriceLocksStep` — workflow step that fetches cart items → variant links → spot prices → deletes old locks → creates new records via raw knex insert (bypasses ORM caching)
- `lockCartPricesWorkflow` — wraps the step
- Store API route `POST /store/dynamic-pricing/carts/:id/price-lock` — triggers the workflow
- `config-loader.ts` — registers `completeCartWorkflow.hooks.validate` hook that queries `cart_price_lock` via knex, rejects missing or expired locks (idempotent via `hookRegistered` flag)
- Storefront `lockCartPrices()` server action; `placeOrder()` calls `lockCartPrices(id, true)` before `cart.complete()`
- `CheckoutSummary` (client component) locks prices on mount via `useEffect` — stays mounted across form step changes
- Cart page `Summary` calls `lockCartPrices(id, true)` before navigating to checkout
- Integration tests: 8 tests covering lock creation, recalc on fresh spot, missing API key, completion with lock, rejection without lock, rejection with expired lock, multi-currency conversion (PLN cart)
- **Fixes applied during implementation:**
  - Raw knex insert must populate `raw_*` JSONB columns for `model.bigNumber()` fields
  - `generateEntityId(undefined, "cplock")` — single-arg call treated as existing ID; must pass `undefined` explicitly
  - Test resources need `Date.now()` suffix when `disableAutoTeardown: true` to avoid handle collisions
  - Payment module (`@medusajs/medusa/payment`) must be registered in `medusa-config.ts` modules list for cart completion to work in tests
  - System payment provider container key is `pp_system_default` (not `"system"`) — use `provider_id: "pp_system_default"` for test payment sessions
  - `force` parameter moved from request body to query parameter (`?force=true`) — `req.body` not reliably parsed in Medusa API routes
  - `ItemPrice` renders `"—"` when neither locked nor SSE price is available (never falls back to Medusa's default `unit_price`)
  - Lock creation moved from server component (`page.tsx`) to client component (`CheckoutSummary` `useEffect`) because every form step transition causes a full server component re-render
  - `force=true` vs `force=false` controls lock **reuse**, not the price source. Both always call `pricingModule.getLatestSpotPrices(materials)` which is a pure DB `DISTINCT ON (material) ORDER BY created_at DESC` read. There are no provider calls during lock creation.

### Step 9 — Storefront Reactivity & UX Polish ✅

**Cart reactivity (CartProvider pattern):**

- `starter/storefront/src/modules/cart/context/cart-context.tsx` — client-side cart state via `useState`. Exports `CartProvider` + `useCart()`.
- `CartProvider` wraps the `(main)` layout (`starter/storefront/src/app/[countryCode]/(main)/layout.tsx`) and receives `initialCart` from the server-fetched RSC cart.
- `useCart()` returns `{ cart, addToCart, updateLineItem, deleteLineItem }`. Returns a **no-op context** (not throw) when used outside `CartProvider` — safe for checkout page components.
- Cart mutations (`cart.ts`) return `Promise<HttpTypes.StoreCart | null>` (calls `retrieveCart(cartId)` after mutating). `CartProvider` calls `setCart(updated)` on success.
- Success toasts fired inside `CartProvider`: "Added to cart", "Cart updated", "Item removed from cart".
- `ItemsTemplate` (`cart/templates/items.tsx`) converted to `"use client"` + `useCart()` so Item children receive live `item` props from context — without this, cart page item list never updates after mutations.
- `starter/storefront/src/modules/layout/components/cart-button/index.tsx` deleted; `Nav` renders `<CartDropdown />` directly (no Suspense fallback needed).

**Pricing display rules (no Medusa fallback prices):**

- `LineItemPrice` shows `"—"` when `price` prop is `undefined` (never falls back to `item.total`).
- `CartTotals` accepts `null` for `subtotalOverride`/`totalOverride` → renders `"—"` instead of Medusa fallback values.
- Cart dropdown subtotal: `dynamicSubtotal > 0 ? dynamicSubtotal : null` — shows `"—"` while SSE loads.
- Cart page Summary / Checkout Summary: same null-passthrough pattern.
- Checkout preview items: no SSE fallback (`cart` prop removed from `<Item>` in `preview.tsx`) — locked prices or `"—"` only.
- Order page items always use Medusa finalized prices (`price={item.total ?? 0}` passed explicitly to `LineItemPrice`).
- `SpotPriceBarClient` never returns `null`; renders placeholder `"—"` prices while SSE is loading so the bar never jumps in/out.

**Checkout page architecture constraints:**

- Checkout is in the `(checkout)` route group — NOT wrapped in `CartProvider`. `useCart()` returns no-op there.
- `checkout/page.tsx` has `export const dynamic = "force-dynamic"` and calls `retrieveCart(undefined, undefined, true)` (the third arg is `noCache: boolean`) to bypass Next.js data cache.
- After `initiatePaymentSession`, use `window.location.assign(url)` (hard navigation) — never `router.push()`. The reason: `revalidateTag` + `router.push()` have a race where the client Router Cache serves stale RSC before the server data cache invalidation propagates. Hard reload guarantees the RSC re-renders with fresh `cart.payment_collection`.
- `retrieveCart(cartId?, fields?, noCache?)` — the third `noCache` parameter, when `true`, passes `cache: "no-store"` and skips `next` tag options entirely.
- Shipping step: separate `isSettingMethod` state for the API call vs `isLoading` for the navigation. Only "Continue to payment" click sets `isLoading`; selecting a radio option sets `isSettingMethod` (disables radio while API runs, but does NOT put the button into loading state).
- Review step: `previousStepsCompleted` skips `cart.payment_collection` check when `isOpen=true` (URL already has `step=review`, which only happens after `initiatePaymentSession` succeeded).

**Product card improvements:**

- `ProductCard` accepts optional `variantLabel?: string` prop — rendered right-aligned on the same row as the product title.
- `ProductPreview` passes `variantLabel={cheapestVariantTitle}` computed from `computeCheapestVariant()`.
- `computeCheapestVariant(variants, pricingData, spotPrices)` in `lib/util/dynamic-pricing.ts` returns `{ variant, price } | null`.
- AddToCartButton in product cards uses cheapest variant's ID (not `firstVariantId`).

**UI consistency:**

- `Button` primitive: `isLoading` shows an SVG spinner (not the `loadingText` string).
- `order-completed-template.tsx`: uses `Surface` with `gap-y-6 p-6` (matches cart page).
- Billing address checkbox: centered with `flex justify-center` + `accent-brand-primary` tick color.

**Seed data:**

- Product year variant `"Random"` renamed to `"Random Year"` in `seed-products.ts`. Takes effect after next `npm run db:reset`.

**E2E tests (Playwright):**

- `starter/storefront/e2e/cart-reactivity.spec.ts` — 6 tests covering: badge update (product page), badge update (landing page), quantity change, increment/decrement, remove item, remove one of multiple. All 6 pass.
- `starter/storefront/e2e/checkout-flow.spec.ts` — 7 tests covering: add + quantity update, add from landing, remove from cart, price check, full checkout flow, refresh prices, page refresh preserves locks. All 7 pass.
- Playwright config (`playwright.config.ts`): `timeout: 90_000`, `expect.timeout: 10_000`, `retries: 1`, `reuseExistingServer: true`.

### Step 11 — Multi-Region Support ✅

**Plugin extensions:**

- `pricingCurrency` option (default `"USD"`) — currency in which the provider returns spot prices
- `currencyConversion` config block — optional `CurrencyRateProviderFn`, `refreshIntervalSeconds` (default 3600), `targetCurrencies[]`
- `CurrencyRate` data model + migration — stores FX rates (from → to) with `DISTINCT ON` read pattern
- `createStaticRatesProvider` — dev/seed provider (pre-defined rates map)
- `exchangeRateHostProvider` — live FX provider (no API key)
- `refreshCurrencyRatesWorkflow` + scheduled job (hourly cron, no-op when `currencyConversion` is null)
- `CartPriceLock` extended with `currency_code` (text) + `conversion_rate` (bigNumber) fields + migration
- Lock step: reads `cart.currency_code`, looks up FX rate from DB, passes `currencyConversion` to `computeFinalPrice()`, stores `currency_code` + `conversion_rate` on each lock row
- SSE `sse/route.ts`: sends `currency-rates` event on connect — `{ rates: { [CURRENCY_CODE]: number } }` keyed by UPPERCASE ISO3

**Seed (21 regions):**
US (USD), Canada (CAD), Mexico (MXN), Brazil (BRL), Argentina (ARS), Europe (EUR, 20 Eurozone countries), United Kingdom (GBP), Denmark (DKK), Sweden (SEK), Poland (PLN), Czechia (CZK), Hungary (HUF), Romania (RON), Nigeria (NGN), South Africa (ZAR), Japan (JPY), South Korea (KRW), UAE (AED), Saudi Arabia (SAR), Qatar (QAR), Kuwait (KWD). Each region has Standard + Express shipping. FX rates seeded from USD baseline.

**Storefront:**

- `SpotPriceContext` extended with `rates: Record<string, number>` — populated from `currency-rates` SSE event
- `computeVariantDynamicPrice`, `computeCartItemDynamicPrice`, `computeCheapestVariant`, `computeProductDynamicPrice` — all accept `conversionRate: number = 1`
- `SpotPriceBarClient` — de-hardcoded from USD; uses `cart.currency_code` + `rates[currencyCode]` for display
- `product-price/index.tsx`, `preview-price.client.tsx` — same `conversionRate` pattern via `useCart()` + `useSpotPrices()`
- `getRegion(countryCode)` — returns `null` for unknown countries (removed silent `"us"` fallback)
- `updateRegion(countryCode, currentPath)` server action — now calls `removeCartId()` on region switch (drop cart, start fresh)
- `CountrySelect` component (`modules/layout/components/country-select/index.tsx`) — `useParams()` + `usePathname()` + `useTransition()`, triggers `updateRegion`
- Footer updated with async `listRegions()` + `<CountrySelect>` in "Region" column

**Tests:**

- `config.unit.spec.ts` — 17 new tests for `pricingCurrency` (6) and `currencyConversion` (11). 75/75 unit tests pass.
- `checkout-flow.spec.ts` — 3 new assertions on `currency_code`/`conversion_rate` for USD cart + new multi-currency PLN integration test. 8 tests total.

### Step 10 — Order Details in Admin

- Admin widget showing dynamic pricing breakdown on order detail page (material, spot price at lock time, weight, factor, final price)

---

---

## Performance & Scalability Guidelines

This project targets production workloads under high traffic. All code must follow these rules:

1. **No unnecessary type assertions** — avoid `as Type` casts. Use proper type guards, branded types, or function overloads. Type erasure in hot paths (especially in `knex.raw()`, JSON serialization) must be explicit with runtime validation.

2. **Minimize DB round trips** — batch queries with `WHERE IN`, `DISTINCT ON`, and bulk inserts. Never N+1. Always use raw Knex for write-heavy operations (price locks, spot price inserts) instead of MikroORM which adds per-row overhead.

3. **Effect cleanup pattern** — In React client components, always use a `cancelled` flag (closure variable, not ref) for async work in `useEffect`. This prevents state updates on unmounted components and is safe under React Strict Mode (double-mount in dev).

4. **No dead code in bundles** — commented-out code, unused imports, and orphaned components must be removed. They bloat the bundle and confuse maintainers.

5. **Re-render discipline** — Keep state as local as possible. Use `useMemo`/`useCallback` only when profiling shows benefit. Prefer plain functions over callbacks in event handlers. Avoid creating new object/array references in render for non-memoized children.

6. **SSE > polling** — Real-time updates use SSE (single TCP connection, server-push). Fall back to polling only on connection failure. Never use WebSockets for one-way price broadcasts.

7. **Cache strategy** — Medusa `force-cache` with cache tags for GET endpoints. Revalidate tags on mutations. Storefront server actions should use `fetch` with appropriate cache headers, not raw in-memory caches.

8. **Write idempotently** — Price lock creation is DELETE + INSERT, not UPSERT. This avoids write conflicts under concurrent requests for the same cart. Workflow compensations (rollbacks) must also be idempotent.

---

## Testing Strategy

| Layer                 | Tool                                                               | Scope                                                                       |
| --------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Unit                  | Jest (in plugin `src/**/__tests__/*.unit.spec.ts`)                 | Pure functions: price formula, provider logic, config validation (75 tests) |
| Integration (modules) | Jest + `@medusajs/test-utils` (`src/modules/*/__tests__/`)         | Module service CRUD with real DB                                            |
| Integration (HTTP)    | Jest + `@medusajs/test-utils` (`integration-tests/http/*.spec.ts`) | Full HTTP request/response cycles, auth, workflows                          |
| E2E                   | Playwright (`starter/storefront/e2e/*.spec.ts`)                    | Browser-level cart + checkout flows (13 tests, all passing)                 |

Run E2E tests: `npx playwright test --project=chromium` from `starter/storefront/`. Requires both dev servers running (`npm run dev`).

**HTTP integration tests must cover:** full checkout flow (Step 8), pricing rule assignment, SSE subscription.

---

## Process Rules

1. **Approval gate**: After each numbered step, implementation stops and waits for Michał's manual testing, code review, and explicit approval before proceeding.
2. **Build verification**: Run `npm run build` (or `medusa plugin:build`) after every change. Do not mark a step complete until build succeeds.
3. **Migrations**: Every new data model requires a migration. Run migrations before testing.
4. **Plugin → backend sync**: After plugin changes, run `yalc push` in `dynamic-pricing-plugin/`. The plugin must be linked to **both** the backend (`starter/backend`) and the monorepo root — Medusa CLI resolves modules from the root `node_modules`. Run `yalc add @u11d/medusa-dynamic-pricing` in the root if not already linked. Then restart backend.
   - **Critical order when seeding files change**: `npm run build` → `npx yalc push` → `npm run db:reset`. The `db:reset` runs the compiled plugin code from `.yalc/`/`node_modules` at reset time. If you run `db:reset` before `yalc push`, the old compiled seed runs and the DB is seeded incorrectly. Tests will appear to pass if the running DB was manually patched, masking the broken seed.
5. **No PUT/PATCH**: Only GET, POST, DELETE HTTP methods.
6. **Workflows for mutations**: All data mutations go through Medusa workflows.
7. **No Medusa price overrides**: We never write to Medusa's price tables for dynamic pricing.
8. **Price storage**: Prices stored as-is (not in cents).

---

## Tech Stack

- Medusa v2 (2.15.2)
- TypeScript
- PostgreSQL 16
- Jest + @medusajs/test-utils
- yalc (local plugin linking)
- turbo (monorepo)
- Docker Compose (local DB)
