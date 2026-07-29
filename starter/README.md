<h1 align="center">
  Fluctum Starter
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
  Real-time dynamic pricing for Medusa — gold, silver, and any volatile-price asset.
</p>

**[→ Use this template on GitHub](https://github.com/u11d-com/fluctum_starter/generate)** to create your own repository pre-wired with the Fluctum dynamic pricing plugin.

## What's included

- **Medusa backend** (`backend/`) — pre-configured with [`@u11d/medusa-dynamic-pricing`](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing)
- **Next.js 16 storefront** (`storefront/`) — live SSE price bar, dynamic cart, price-locked checkout
- **Docker Compose** — PostgreSQL 17 + Redis 8 for local development
- **Turbo** monorepo (pnpm workspaces) with `dev` / `build` / `lint` / `test` tasks

Prices update every few seconds from a live spot-price feed (goldapi.io or the built-in random provider for dev). They are displayed in real time via SSE and locked at checkout entry to protect both customer and merchant.

## Prerequisites

- Node.js v24+
- pnpm v11+ (`corepack enable` to get the version pinned in `package.json` automatically)
- Docker & Docker Compose

## Quick start

### 1. Use this template

Click **[Use this template](https://github.com/u11d-com/fluctum_starter/generate)** on GitHub, or clone directly:

```bash
git clone https://github.com/u11d-com/fluctum_starter.git my-store
cd my-store
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.template backend/.env
```

For the storefront:

```bash
cp storefront/.env.template storefront/.env
```

### 3. Start infrastructure

```bash
docker compose up -d
```

PostgreSQL will be available on port `5432` (database: `fluctum`) and Redis on port `6379`.

### 4. Run migrations (also seeds initial data)

```bash
pnpm run backend:migrate
```

### 5. Create admin user

```bash
pnpm run backend:create-admin
```

### 6. Start the backend

```bash
pnpm run backend:dev
```

| Service     | URL                       |
| ----------- | ------------------------- |
| Backend API | http://localhost:9000     |
| Admin panel | http://localhost:9000/app |

Log into the admin panel and confirm it loads correctly, then copy the **Publishable API key** (`http://localhost:9000/app` → Settings → API Keys) into `storefront/.env`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 7. Start the storefront

In a separate terminal, with the backend still running:

```bash
pnpm run storefront:dev
```

| Service    | URL                   |
| ---------- | --------------------- |
| Storefront | http://localhost:8000 |

Once both are confirmed working, you can stop them and use `pnpm run dev` going forward to start backend + storefront together.

## Deploy to Medusa Cloud

[![Deploy to Medusa Cloud](https://img.shields.io/badge/Deploy%20to-Medusa%20Cloud-7C3AED?style=for-the-badge)](https://cloud.medusajs.com)

1. Push your repository to GitHub
2. Go to [cloud.medusajs.com](https://cloud.medusajs.com) and connect your repo
3. Deploy — Medusa Cloud handles migrations, scaling, and SSL automatically

## Plugin configuration

The plugin is configured in `backend/medusa-config.ts`:

```ts
import { randomProvider, createGoldApiProvider } from "@u11d/medusa-dynamic-pricing"

{
  resolve: "@u11d/medusa-dynamic-pricing",
  options: {
    materials: ["XAU", "XAG"],
    fetchIntervalSeconds: 10,
    priceLockDurationSeconds: 600,
    provider: process.env.GOLD_API_KEY
      ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
      : randomProvider,
  },
}
```

See the [plugin documentation](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing) for all options.

## Scripts

| Script                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `pnpm run dev`            | Start backend + storefront in parallel              |
| `pnpm run backend:dev`    | Start only the backend (useful for first-run setup) |
| `pnpm run storefront:dev` | Start only the storefront                           |
| `pnpm run build`          | Build all packages                                  |
| `pnpm run lint`           | Lint all packages                                   |
| `pnpm run test`           | Run all tests                                       |

## License

MIT
