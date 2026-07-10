# Contributing

## Prerequisites

- Node.js v20+
- Docker (for PostgreSQL + Redis)
- npm v11+ (managed via `engines` in `package.json`)
- [yalc](https://github.com/wclr/yalc) — local plugin linking (installed as devDependency in the plugin)

## Local Setup

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

### 4. Run migrations

```bash
npm run backend:migrate
```

### 5. Seed initial data (optional)

```bash
npm run backend:seed
```

### 6. Create admin user

```bash
cd starter/backend && npx medusa user -e admin@example.com -p yourpassword
cd ../..
```

### 7. Start everything

```bash
npm run dev
```

- Backend: `http://localhost:9000`
- Admin: `http://localhost:9000/app`
- Storefront: `http://localhost:8000`

---

## Plugin Development Workflow

The plugin is linked to the backend via [yalc](https://github.com/wclr/yalc). After every plugin change:

```bash
npm run plugin:build
```

This runs `medusa plugin:build` and then `yalc push`, updating the `.yalc/` copy in the backend. Restart the backend to pick up changes.

> **Important:** The plugin must be linked to **both** `starter/backend` and the monorepo root. The root link ensures Medusa CLI can resolve the module from `node_modules`. If the root link is missing: `cd <root> && yalc add @u11d/medusa-dynamic-pricing`.

---

## Scripts

| Script                     | Description                                  |
| -------------------------- | -------------------------------------------- |
| `npm run dev`              | Start backend + storefront (turbo, parallel) |
| `npm run build`            | Build all packages                           |
| `npm run plugin:build`     | Build plugin + push to yalc                  |
| `npm run test:unit`        | Run plugin unit tests                        |
| `npm run test:integration` | Run backend HTTP integration tests           |
| `npm run backend:migrate`  | Run Medusa DB migrations                     |
| `npm run backend:seed`     | Run initial data seed                        |
| `npm run storefront:check` | Type-check the storefront                    |

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
npm run test:unit
```

Files: `dynamic-pricing-plugin/src/**/__tests__/*.unit.spec.ts`

Scope: pure functions (price formula, provider logic, config validation).

### Integration Tests (backend)

```bash
npm run test:integration
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

2. **Build verification** — Run `npm run build` (or `npm run plugin:build`) after every change. Do not mark a step complete until the build passes.

3. **Migrations** — Every new data model requires a migration. Run `npm run backend:migrate` before testing. See the `db-generate` skill for how to generate migrations.

4. **Plugin → backend sync** — After plugin changes, run `npm run plugin:build`. Restart the backend.

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
