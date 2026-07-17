# Contributing

## Prerequisites

- Node.js v24+
- Docker (for PostgreSQL + Redis)
- pnpm v11+ (`corepack enable` picks up the version pinned in each project's `package.json`)
- [yalc](https://github.com/wclr/yalc) — local plugin linking (installed as devDependency in the plugin, invoked via `pnpm exec yalc`)

## Local Setup

### 1. Clone & install

This repo has **no root package.json** — every project (`dynamic-pricing-plugin/`, `starter/`, `landing-page/www/`, `landing-page/form-handler/`, `infra/landing-page/`) is an independent pnpm project. For backend/storefront development:

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

PostgreSQL will be available at `localhost:5432` (db: `dynamic_pricing`).  
Redis will be available at `localhost:6379`.

### 3. Configure the backend

```bash
cp starter/backend/.env.template starter/backend/.env
```

Edit `starter/backend/.env`:

```bash
DATABASE_URL=postgres://postgres:@localhost:5432/dynamic_pricing
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
# GOLD_API_KEY=your-key   # Optional: omit to use randomProvider
```

### 4. Run migrations (also seeds initial data)

```bash
cd starter && pnpm run backend:migrate
```

### 5. Create admin user

```bash
cd starter/backend && pnpm exec medusa user -e admin@example.com -p yourpassword
cd ../..
```

### 6. Start everything

```bash
cd starter && pnpm run dev
```

- Backend: `http://localhost:9000`
- Admin: `http://localhost:9000/app`
- Storefront: `http://localhost:8000`

---

## Plugin Development Workflow

The plugin is linked to the backend and storefront via [yalc](https://github.com/wclr/yalc). After every plugin change:

```bash
cd dynamic-pricing-plugin
pnpm run build       # runs `medusa plugin:build`
pnpm exec yalc push  # pushes the built package to every linked consumer
```

Restart the backend to pick up changes.

> **Important:** `.yalc/` directories are gitignored. After a fresh clone (or after deleting yalc state), `pnpm exec yalc push` from `dynamic-pricing-plugin/` auto-pushes to any project with a `yalc.lock` entry. If a NEW consumer needs linking (no prior `yalc.lock` entry), run `pnpm dlx yalc add @u11d/medusa-dynamic-pricing` from within that consumer's directory.

---

## Scripts

There is no root package.json — run scripts from each project's own directory.

| Script                          | Where                     | Description                                        |
| ------------------------------- | ------------------------- | -------------------------------------------------- |
| `pnpm run dev`                  | `starter/`                | Start backend + storefront (turbo, parallel)       |
| `pnpm run build`                | `starter/`                | Build backend + storefront                         |
| `pnpm run backend:migrate`      | `starter/`                | Run Medusa DB migrations (also seeds initial data) |
| `pnpm run backend:create-admin` | `starter/`                | Create the default admin user                      |
| `pnpm run build`                | `dynamic-pricing-plugin/` | Build plugin (`medusa plugin:build`)               |
| `pnpm exec yalc push`           | `dynamic-pricing-plugin/` | Push built plugin to yalc consumers                |
| `pnpm run test:unit`            | `dynamic-pricing-plugin/` | Run plugin unit tests                              |
| `pnpm run test:integration`     | `starter/backend/`        | Run backend HTTP integration tests                 |
| `pnpm run check`                | `starter/storefront/`     | Lint + type-check the storefront                   |

---

## Code Conventions

### TypeScript

- **No `any`** — fix at the source. No `as Type` casts unless unavoidable and documented.
- **No `@ts-ignore` / `@ts-expect-error`** — fix the underlying type issue.
- Strict mode enabled everywhere.

### HTTP Methods

Only `GET`, `POST`, `DELETE`. Never `PUT` or `PATCH`.

### Mutations

All data mutations go through **Medusa workflows**. No direct DB writes from route handlers.  
Exception: the `completeCartWorkflow.hooks.validate` validate hook uses raw Knex (it is a framework hook, not a route).

### Price Storage

Prices are stored as plain decimal numbers, **not** cents. Never write to Medusa's price tables (`price_set`, `price`, `money_amount`).

### Raw Knex

Use raw Knex for `CartPriceLock` writes. See [ADR 0004](docs/adr/0004-raw-knex-for-price-locks.md).

### React (Storefront & Admin)

- Use a `cancelled` closure flag for async work in `useEffect` (not a ref) — safe under React Strict Mode double-mount.
- No dead code — remove commented-out blocks, unused imports, and orphaned components.
- Follow the storefront component conventions in `starter/storefront/AGENTS.md` (UI primitives, RSC/client boundaries).

---

## Testing

### Unit Tests (plugin)

```bash
cd dynamic-pricing-plugin && pnpm run test:unit
```

Files: `dynamic-pricing-plugin/src/**/__tests__/*.unit.spec.ts`

Scope: pure functions (price formula, provider logic, config validation).

### Integration Tests (backend)

```bash
cd starter/backend && pnpm run test:integration
```

Files: `starter/backend/integration-tests/http/*.spec.ts`

These run a full Medusa backend with a real PostgreSQL database. They cover:

- Price lock creation, idempotency, force-refresh
- Order completion with valid locks
- Order rejection with missing/expired locks
- Pricing rule CRUD
- SSE subscription

**Always run integration tests before marking a step complete.**

---

## Development Process

1. **Approval gate** — After each numbered step (see `AGENTS.md`), stop and wait for manual testing and explicit approval before proceeding to the next step.

2. **Build verification** — Run `pnpm run build` (in `starter/`) or `pnpm run build` (in `dynamic-pricing-plugin/`) after every change. Do not mark a step complete until the build passes.

3. **Migrations** — Every new data model requires a migration. Run `pnpm run backend:migrate` (from `starter/`) before testing. See the `db-generate` skill for how to generate migrations.

4. **Plugin → backend sync** — After plugin changes, run `pnpm run build && pnpm exec yalc push` from `dynamic-pricing-plugin/`. Restart the backend.

5. **No commits without explicit request** — Agents do not commit unless the user explicitly asks.

---

## Project Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture
- [`docs/pricing-formula.md`](docs/pricing-formula.md) — Pricing formula
- [`docs/checkout-flow.md`](docs/checkout-flow.md) — Checkout / price lock flow
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`AGENTS.md`](AGENTS.md) — Developer reference + AI agent context
- [`dynamic-pricing-plugin/AGENTS.md`](dynamic-pricing-plugin/AGENTS.md) — Plugin-specific agent context
- [`starter/backend/AGENTS.md`](starter/backend/AGENTS.md) — Backend-specific agent context
- [`starter/storefront/AGENTS.md`](starter/storefront/AGENTS.md) — Storefront-specific agent context
