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
  Real-time dynamic pricing for Medusa v2 — gold, silver, and any volatile-price asset.
</p>

<p align="center">
<a href="https://github.com/u11d-com/fluctum_starter/generate"><img src="https://img.shields.io/badge/-Use%20this%20template-238636?style=for-the-badge&logo=github" alt="Use this template"/></a>
<a href="https://cloud.medusajs.com"><img src="https://img.shields.io/badge/Deploy%20to-Medusa%20Cloud-7C3AED?style=for-the-badge" alt="Deploy to Medusa Cloud"/></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

---

**[→ Use this template on GitHub](https://github.com/u11d-com/fluctum_starter/generate)** to create your own repository pre-wired with the Fluctum dynamic pricing plugin.

---

## What's included

- **Medusa v2 backend** (`backend/`) — pre-configured with [`@u11d/medusa-dynamic-pricing`](https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing)
- **Next.js 16 storefront** (`storefront/`) — live SSE price bar, dynamic cart, price-locked checkout
- **Docker Compose** — PostgreSQL 17 + Redis 8 for local development
- **Turbo** monorepo (pnpm workspaces) with `dev` / `build` / `lint` / `test` tasks

Prices update every few seconds from a live spot-price feed (goldapi.io or the built-in random provider for dev). They are displayed in real time via SSE and locked at checkout entry to protect both customer and merchant.

---

## Prerequisites

- Node.js v24+
- pnpm v11+ (`corepack enable` to get the version pinned in `package.json` automatically)
- Docker & Docker Compose

---

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
# Edit backend/.env — set DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET at minimum
```

For the storefront:

```bash
cp storefront/.env.template storefront/.env
# Edit storefront/.env — set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY after running migrations
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

Copy the **Publishable API key** from the admin panel (`http://localhost:9000/app` → Settings → API Keys) into `storefront/.env`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 6. Start everything

```bash
pnpm run dev
```

| Service     | URL                       |
| ----------- | ------------------------- |
| Backend API | http://localhost:9000     |
| Admin panel | http://localhost:9000/app |
| Storefront  | http://localhost:8000     |

---

## Deploy to Medusa Cloud

[![Deploy to Medusa Cloud](https://img.shields.io/badge/Deploy%20to-Medusa%20Cloud-7C3AED?style=for-the-badge)](https://cloud.medusajs.com)

1. Push your repository to GitHub
2. Go to [cloud.medusajs.com](https://cloud.medusajs.com) and connect your repo
3. Set the environment variables listed in `.env.template`
4. Deploy — Medusa Cloud handles migrations, scaling, and SSL automatically

---

## Environment variables

See [`.env.template`](.env.template) for the full list with descriptions.

| Variable                         | Where      | Required   |
| -------------------------------- | ---------- | ---------- |
| `DATABASE_URL`                   | backend    | yes        |
| `REDIS_URL`                      | backend    | yes        |
| `JWT_SECRET`                     | backend    | yes        |
| `COOKIE_SECRET`                  | backend    | yes        |
| `STORE_CORS`                     | backend    | yes        |
| `ADMIN_CORS`                     | backend    | yes        |
| `AUTH_CORS`                      | backend    | yes        |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | storefront | yes        |
| `NEXT_PUBLIC_DEFAULT_REGION`     | storefront | yes        |
| `MEDUSA_CLOUD_S3_HOSTNAME`       | backend    | cloud only |
| `MEDUSA_CLOUD_S3_PATHNAME`       | backend    | cloud only |

---

## Plugin configuration

The plugin is configured in `backend/medusa-config.ts`:

```ts
import { randomProvider, createGoldApiProvider } from "@u11d/medusa-dynamic-pricing"

{
  resolve: "@u11d/medusa-dynamic-pricing",
  options: {
    materials: ["XAU", "XAG"],
    fetchIntervalSeconds: 10,
    priceLockDurationSeconds: 120,
    provider: process.env.GOLD_API_KEY
      ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
      : randomProvider,
  },
}
```

See the [plugin documentation](https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin) for all options.

---

## Scripts

| Script           | Description                            |
| ---------------- | -------------------------------------- |
| `pnpm run dev`   | Start backend + storefront in parallel |
| `pnpm run build` | Build all packages                     |
| `pnpm run lint`  | Lint all packages                      |
| `pnpm run test`  | Run all tests                          |

---

## License

MIT
