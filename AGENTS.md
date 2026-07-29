# Dynamic Pricing Framework — Agent Reference

> **Note:** This file is an internal development journal and AI agent context. End users should read [README.md](README.md) and the [docs/](docs/) directory first.

## Project Overview

An open-source dynamic pricing framework built on top of MedusaJS. Targets precious metals e-commerce (gold, silver, etc.) or another industry where prices update every few seconds. The framework consists of:

- **`dynamic-pricing-plugin/`** — Medusa plugin (`@u11d/medusa-dynamic-pricing`) containing all dynamic pricing logic
- **`starter/backend/`** — Medusa backend starter (uses the plugin)
- **`starter/storefront/`** — Next.js 16 storefront with live SSE price bar, dynamic-pricing cart, and price-locked checkout

---

## Repository Structure

```
dynamic-pricing/                ← monorepo root
├── starter/
│   ├── backend/                ← @u11d/medusa-dynamic-pricing-backend — Medusa backend starter
│   └── storefront/             ← Next.js 16 storefront (live prices + checkout)
├── landing-page/
│   ├── www/                    ← fluctum.io landing page
│   └── form-handler/           ← Serverless form handler
├── dynamic-pricing-plugin/     ← @u11d/medusa-dynamic-pricing — Medusa plugin
├── docker-compose.yml          ← PostgreSQL 17 + Redis 8 for local dev
├── reset-db.sh                 ← authoritative local-env reset script (see below)
└── AGENTS.md                   ← this file
```

Plugin is linked to backend via yalc (`.yalc/` in backend) in local development. Workflow for local dev: `build plugin` → `yalc push` → backend picks it up. Released starter backed uses plugin code published in NPM.

---

## Local Development — Fresh Environment Reset

**⚠️ ALWAYS use `./reset-db.sh` when resetting your local database. Do NOT reset manually.**

This is a common failure mode: manually dropping the DB or running `docker compose down -v` recreates a fresh Postgres with a fresh publishable API key — but `starter/storefront/.env` still holds the OLD key. The storefront then returns HTTP 500 on every request because the key is rejected by the backend (`{"type":"not_allowed","message":"A valid publishable key is required..."}`).

The `reset-db.sh` script at the repo root does everything in one atomic operation (there is no root `package.json`, so it's run directly, not via a package-manager script):

1. Terminates active Postgres connections to `dynamic_pricing`
2. `DROP DATABASE dynamic_pricing`
3. `CREATE DATABASE dynamic_pricing`
4. `pnpm run backend:migrate` (from `starter/`, also runs the initial data seed)
5. `pnpm run backend:create-admin` (from `starter/`, creates the default admin user)
6. Reads the freshly-generated publishable API key and updates `starter/storefront/.env` in place

Usage:

```bash
./reset-db.sh
```

**Restart the storefront after resetting.** `NEXT_PUBLIC_*` env vars are baked in at Next.js process start — an already-running storefront will keep serving requests with the stale key from memory. Recommended flow:

1. Stop backend + storefront (Ctrl+C the `pnpm run dev` / turbo process, run from `starter/`)
2. `./reset-db.sh`
3. `cd starter && pnpm run dev` again

---

## Business Domain

### Pricing Formula

See [pricing-formula.md](./docs/pricing-formula.md) for details about pricing formula details.

**We do NOT override Medusa prices in cart.** Prices are calculated dynamically on the frontend using SSE spot prices.

### Cart / Checkout Flow

- While items are in cart, prices update in real time via SSE; the prices do not come from Medusa cart. Medusa cart provides products with weight and spread factor data only. Storefront builds the final price using Medusa cart data and other dynamic values (metal spot prices) received via SSE.
- When the user clicks "Go to checkout" (a server action, `goToCheckout` in `lib/data/cart.ts`), prices are **locked** (force-recalculated, `force=true`) before redirecting to the checkout page.
- The checkout page (`checkout/page.tsx`) is a server component (`force-dynamic`). On every request it calls `retrieveCartWithLock(cartId, force=false)`, which locks prices idempotently — reusing any existing valid lock, or creating one if none exists (covers pasted checkout URLs and browser refreshes). The resolved cart + locked prices + lock expiry are passed down as props; `CheckoutSummary` is a purely presentational client component seeded from these props — there is no client-side fetch-on-mount.
- During checkout form steps (delivery, payment), prices do NOT refresh — those steps use client-side navigation (`router.push()`) so the checkout page does not re-render and `CheckoutSummary` stays mounted with the same props.
- Submitting the address step uses `redirect()` in a server action, causing a full page navigation — this re-runs `checkout/page.tsx`, which calls `retrieveCartWithLock(cartId, force=false)` again and transparently reuses the existing lock (same idempotent codepath as a page refresh).
- `placeOrder()` does NOT re-lock prices — the checkout page's server-side lock is reused. The validate hook (`config-loader.ts`) checks that locks still exist and haven't expired at order completion.
- Admin panel order placement is blocked (store only)

### Price Refreshing Rules

These rules govern when price locks are created or reused:

| Action                                      | Lock behavior                             | Why                                                                                                                                |
| ------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Click "Refresh prices" on checkout          | Always creates fresh locks (`force=true`) | Intentional user action (`doLock` in `CheckoutSummary`, client → `lockCartPrices(id, true)`)                                       |
| Click "Go to checkout" on cart page         | Always creates fresh locks (`force=true`) | `goToCheckout` server action calls `lockCartPrices(id, true)` before redirecting                                                   |
| Paste checkout URL or page refresh          | Creates fresh locks if none exist         | `checkout/page.tsx` calls `retrieveCartWithLock(id, false)` server-side on every render — no existing locks → fresh created        |
| Submit address (`redirect()`)               | Reuses existing locks (`force=false`)     | `redirect()` triggers full page navigation → `checkout/page.tsx` re-runs → `retrieveCartWithLock(id, false)` reuses existing locks |
| Select delivery / payment (`router.push()`) | Prices do NOT change                      | Client-side navigation only — `checkout/page.tsx` doesn't re-run, `CheckoutSummary` stays mounted with the same props              |
| Click "Place order"                         | Does NOT create locks                     | Uses the checkout page's server-side lock; validate hook checks it still exists and hasn't expired                                 |
| Cart page                                   | Dynamic SSE prices (never locked)         | Real-time spot price display                                                                                                       |

- add checkout summary page :: static data stored in medusa data (what exactly)

**Key architectural constraint**: The address form uses `redirect()` in a server action (`setAddresses`), which triggers a full page navigation. This re-runs `checkout/page.tsx` server-side, which calls `retrieveCartWithLock(id, force=false)` — without `force`, this idempotently reuses any existing valid locks, preserving prices across the redirect. The delivery and payment steps use `router.push()` (client-side navigation), so `checkout/page.tsx` doesn't re-run and `CheckoutSummary` stays mounted with the same props.

---

## Plugin Configuration (`@u11d/medusa-dynamic-pricing`)

Plugin options defined in `medusa-config.ts` `plugins` array:

| Option                     | Description                                                                                                                                                                                                   | Default  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `materials`                | Array of material symbols, e.g. `["XAU", "XAG"]`                                                                                                                                                              | required |
| `fetchIntervalSeconds`     | How often to fetch/generate spot prices                                                                                                                                                                       | `10`     |
| `provider`                 | Price provider function                                                                                                                                                                                       | required |
| `priceLockDurationSeconds` | How long prices are locked during checkout                                                                                                                                                                    | `600`    |
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

Run E2E tests: `pnpm exec playwright test --project=chromium` from `starter/storefront/`. Requires both dev servers running (`pnpm run dev` from `starter/`).

**HTTP integration tests must cover:** full checkout flow (Step 8), pricing rule assignment, SSE subscription.

---

## Process Rules

1. **Build verification**: Run `pnpm run build` (in `starter/`) or `pnpm run build` (`medusa plugin:build`, in `dynamic-pricing-plugin/`) after every change. Do not mark a step complete until build succeeds.
2. **Migrations**: Every new data model requires a migration. Run migrations before testing.
3. **Plugin → backend sync**: After plugin changes, run `pnpm exec yalc push` in `dynamic-pricing-plugin/`.
4. **Workflows for mutations**: All data mutations go through Medusa workflows.
5. **No Medusa price overrides**: We never write to Medusa's price tables for dynamic pricing.
6. **Price storage**: Prices stored as-is (not in cents).

---

## Tech Stack

- Medusa v2 (2.15.2)
- TypeScript
- PostgreSQL 16
- Jest + @medusajs/test-utils
- yalc (local plugin linking)
- pnpm (package manager, independent projects — no root workspace)
- turbo (within the `starter/` workspace only)
- Docker Compose (local DB)
