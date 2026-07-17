# Fluctum — Real-Time Dynamic Pricing for Medusa

> **Fluctum** keeps prices live — gold, silver, or any volatile asset. Prices update every few seconds. Checkout locks them at the right moment.

[![npm](https://img.shields.io/npm/v/@u11d/medusa-dynamic-pricing)](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fluctum is an open-source dynamic pricing plugin for [Medusa v2](https://docs.medusajs.com) — built for precious metals (gold, silver bullion) but architected for any volatile-price asset. Prices update every few seconds from live spot-price feeds, are displayed in real time via SSE on the storefront, and are locked at checkout entry to protect both customer and merchant.

## Start Here

- **See the demo:** [demo.fluctum.io](https://demo.fluctum.io)
- **Contact the team:** [hello@u11d.com](mailto:hello@u11d.com)
- **Use the starter:** [`starter/`](starter/)
- **Install the plugin:** [npmjs.com/package/@u11d/medusa-dynamic-pricing](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing)
- **Browse source:** [github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin](https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin)

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

`force=true` always creates fresh locks and `force=false` reuses valid existing locks. Both lock paths use the latest spot prices stored in the database.

Prices are **never** written to Medusa's price tables. The frontend computes the final price locally from the spot price and the variant's pricing rule using the formula in [`docs/pricing-formula.md`](docs/pricing-formula.md).

## Quick Start

### Prerequisites

- Node.js v24+
- Docker (for PostgreSQL + Redis)
- pnpm v11+ (`corepack enable` picks up the pinned version automatically)

### 1. Clone & install

Each project in this repo is an **independent pnpm project** (no root workspace) — install per project as needed. For the full local dev flow you'll need the plugin and the `starter/` workspace:

```bash
git clone https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin.git
cd fluctum_medusa-dynamic-pricing-plugin

# Build the plugin and link it via yalc
cd dynamic-pricing-plugin && pnpm install && pnpm run build && pnpm exec yalc push && cd ..

# Install the starter workspace (backend + storefront)
cd starter && pnpm install && cd ..
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

### 4. Configure storefront

```bash
cp starter/storefront/.env.template starter/storefront/.env.local
# You'll set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY after creating the admin user in step 7
```

### 5. Run migrations (also seeds initial data)

```bash
cd starter && pnpm run backend:migrate
```

### 6. Create admin user

```bash
cd starter/backend && pnpm exec medusa user -e admin@example.com -p yourpassword
```

Copy the **Publishable API key** from the admin panel (`http://localhost:9000/app` → Settings → API Keys) into `starter/storefront/.env.local`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 7. Start everything

```bash
cd starter && pnpm run dev
```

- Backend: `http://localhost:9000`
- Admin panel: `http://localhost:9000/app`
- Storefront: `http://localhost:8000`

### Resetting your local environment

Once set up, if you need a clean slate (schema changes, corrupted data, reproducing a bug), run the script directly from the repo root (no package manager needed):

```bash
./reset-db.sh
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

The plugin is linked to the backend and storefront via [yalc](https://github.com/wclr/yalc):

```bash
# After any plugin change:
cd dynamic-pricing-plugin
pnpm run build       # runs `medusa plugin:build`
pnpm exec yalc push  # pushes the built package to every linked consumer
# Backend and storefront pick up the updated .yalc copy automatically
```

## Scripts

There is no root package.json — run each project's scripts from its own directory (or `pnpm --dir <path> run <script>` from the repo root).

| Script                          | Where                     | Description                                                                                                                                                       |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run dev`                  | `starter/`                | Start backend + storefront in parallel (turbo)                                                                                                                    |
| `pnpm run build`                | `starter/`                | Build backend + storefront                                                                                                                                        |
| `pnpm run backend:migrate`      | `starter/`                | Run Medusa DB migrations (also seeds initial data)                                                                                                                |
| `pnpm run backend:create-admin` | `starter/`                | Create the default admin user                                                                                                                                     |
| `pnpm run build`                | `dynamic-pricing-plugin/` | Build the plugin (`medusa plugin:build`)                                                                                                                          |
| `pnpm exec yalc push`           | `dynamic-pricing-plugin/` | Push the built plugin to all yalc-linked consumers                                                                                                                |
| `pnpm run test:unit`            | `dynamic-pricing-plugin/` | Run plugin unit tests                                                                                                                                             |
| `pnpm run test:integration`     | `starter/backend/`        | Run backend HTTP integration tests                                                                                                                                |
| `pnpm run check`                | `starter/storefront/`     | Lint + type-check the storefront                                                                                                                                  |
| `./reset-db.sh`                 | repo root                 | **Destructive:** drop DB, recreate, migrate, seed, create admin, sync storefront `.env` — see [`AGENTS.md`](AGENTS.md#local-development--fresh-environment-reset) |

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
cd dynamic-pricing-plugin && pnpm run test:unit

# Integration tests (full HTTP cycle against real DB)
cd starter/backend && pnpm run test:integration
```

Integration tests cover: price lock creation, idempotency, order completion with valid locks, rejection of missing/expired locks, pricing rule CRUD, and SSE subscription.

## Deployment

Documentation for deploying Fluctum components can be found in [`docs/deployment/README.md`](docs/deployment/README.md).

## License

MIT
