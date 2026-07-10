# Fluctum — Real-Time Dynamic Pricing for Medusa

> **Fluctum** keeps prices live — gold, silver, or any volatile asset. Prices update every second. Checkout locks them at the right moment.

[![npm](https://img.shields.io/npm/v/@u11d/medusa-dynamic-pricing)](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fluctum is an open-source dynamic pricing plugin for [Medusa v2](https://docs.medusajs.com) — built for precious metals (gold, silver bullion) but architected for any volatile-price asset. Prices update every few seconds from live spot-price feeds, are displayed in real time via SSE on the storefront, and are locked at checkout entry to protect both customer and merchant.

## Repository Structure

```
dynamic-pricing/
├── starter/
│   ├── backend/          # @u11d/medusa-dynamic-pricing-backend — Medusa v2 backend (uses plugin via yalc)
│   └── storefront/       # Next.js 16 storefront with live price bar + checkout flow
├── landing-page/
│   ├── www/              # fluctum.io landing page (Next.js SSG)
│   └── form-handler/     # Serverless form handler
├── dynamic-pricing-plugin/  # @u11d/medusa-dynamic-pricing — the Medusa plugin
├── docs/                 # Architecture docs, domain guides, ADRs
├── docker-compose.yml    # PostgreSQL 17 + Redis 8 for local dev
├── turbo.json
└── package.json
```

## How It Works

```
Provider (goldapi.io / random)
    ↓  every fetchIntervalSeconds
Scheduled job → fetchAndSaveSpotPricesWorkflow
    ↓  saves to DB + broadcasts
SSE endpoint → Storefront / Admin panel

Storefront:
  Cart page       → live SSE prices (no locks)
  "Go to checkout"→ lockCartPrices(force=true) → navigate
  Checkout page   → lockCartPrices(force=false) on mount
  Place order     → completeCartWorkflow.hooks.validate → check locks exist + not expired
```

Prices are **never** written to Medusa's price tables. The frontend computes the final price locally from the spot price and the variant's pricing rule using the formula in [`docs/pricing-formula.md`](docs/pricing-formula.md).

## Quick Start

### Prerequisites

- Node.js v24+
- Docker (for PostgreSQL + Redis)
- npm v11+

### 1. Clone & install

```bash
git clone https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin.git
cd fluctum_medusa-dynamic-pricing-plugin
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 (db: `dynamic_pricing`) and Redis on port 6379.

### 3. Configure backend

```bash
cp starter/backend/.env.template starter/backend/.env
# Edit starter/backend/.env — set DATABASE_URL and REDIS_URL at minimum
```

### 5. Configure storefront

```bash
cp starter/storefront/.env.template starter/storefront/.env.local
# You'll set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY after creating the admin user in step 7
```

### 6. Run migrations

```bash
npm run backend:migrate
```

### 7. Seed initial data (optional)

```bash
npm run backend:seed
```

### 8. Create admin user

```bash
cd starter/backend && npx medusa user -e admin@example.com -p yourpassword
```

Copy the **Publishable API key** from the admin panel (`http://localhost:9000/app` → Settings → API Keys) into `starter/storefront/.env.local`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 9. Start everything

```bash
npm run dev
```

- Backend: `http://localhost:9000`
- Admin panel: `http://localhost:9000/app`
- Storefront: `http://localhost:8000`

### Resetting your local environment

Once set up, if you need a clean slate (schema changes, corrupted data, reproducing a bug):

```bash
npm run db:reset
```

This runs [`reset-db.sh`](reset-db.sh) which drops and recreates the `dynamic_pricing` database, runs migrations, creates the admin user, and **syncs the fresh publishable API key into `starter/storefront/.env`**. Restart the storefront afterwards — `NEXT_PUBLIC_*` env vars are baked in at process start, so an already-running storefront will keep using the stale key. See [`AGENTS.md`](AGENTS.md#local-development--fresh-environment-reset) for the full rationale.

## Environment Variables

### Backend (`starter/backend/.env`)

| Variable        | Description                                      | Required       |
| --------------- | ------------------------------------------------ | -------------- |
| `DATABASE_URL`  | PostgreSQL connection string                     | yes            |
| `REDIS_URL`     | Redis connection string                          | yes (non-test) |
| `GOLD_API_KEY`  | goldapi.io API key; omit to use `randomProvider` | no             |
| `JWT_SECRET`    | Medusa JWT secret                                | yes            |
| `COOKIE_SECRET` | Medusa cookie secret                             | yes            |

### Storefront (`starter/storefront/.env.local`)

| Variable                             | Description                    | Default                 |
| ------------------------------------ | ------------------------------ | ----------------------- |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from admin | —                       |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL`     | Backend URL                    | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION`         | Default region country code    | `dk`                    |
| `NEXT_PUBLIC_BASE_URL`               | Storefront base URL            | `http://localhost:8000` |

## Plugin Configuration

The plugin is configured in `starter/backend/medusa-config.ts`:

```ts
import { randomProvider, createGoldApiProvider } from "@u11d/medusa-dynamic-pricing"

{
  resolve: "@u11d/medusa-dynamic-pricing",
  options: {
    materials: ["XAU", "XAG", "XPT", "XPD"],
    fetchIntervalSeconds: 10,
    priceLockDurationSeconds: 600,
    provider: process.env.GOLD_API_KEY
      ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
      : randomProvider,
  },
}
```

## Plugin Development (yalc workflow)

The plugin is linked to the backend via [yalc](https://github.com/wclr/yalc):

```bash
# After any plugin change:
npm run plugin:build   # builds plugin AND pushes to yalc store
# Backend picks up the updated .yalc copy automatically
```

## Scripts

| Script                     | Description                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Start backend + storefront in parallel (turbo)                                                                                                                    |
| `npm run build`            | Build all packages                                                                                                                                                |
| `npm run plugin:build`     | Build plugin and push to yalc                                                                                                                                     |
| `npm run test:unit`        | Run unit tests in the plugin                                                                                                                                      |
| `npm run test:integration` | Run HTTP integration tests in the backend                                                                                                                         |
| `npm run backend:migrate`  | Run Medusa DB migrations                                                                                                                                          |
| `npm run backend:seed`     | Run initial data seed                                                                                                                                             |
| `npm run db:reset`         | **Destructive:** drop DB, recreate, migrate, seed, create admin, sync storefront `.env` — see [`AGENTS.md`](AGENTS.md#local-development--fresh-environment-reset) |
| `npm run storefront:check` | Type-check the storefront                                                                                                                                         |

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture and component overview
- [`docs/pricing-formula.md`](docs/pricing-formula.md) — Pricing formula breakdown with examples
- [`docs/checkout-flow.md`](docs/checkout-flow.md) — Price lock lifecycle and checkout navigation rules
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`AGENTS.md`](AGENTS.md) — Developer reference and AI agent context
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — Local dev setup, conventions, process

## Testing

```bash
# Unit tests (plugin)
npm run test:unit

# Integration tests (full HTTP cycle against real DB)
npm run test:integration
```

Integration tests cover: price lock creation, idempotency, order completion with valid locks, rejection of missing/expired locks, pricing rule CRUD, and SSE subscription.

## Deployment

Documentation for deploying Fluctum components can be found in [`docs/deployment/README.md`](docs/deployment/README.md).

## License

MIT
