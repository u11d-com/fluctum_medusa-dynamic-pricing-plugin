# Backend — Agent Reference

This file provides context for AI coding agents working inside `starter/backend/`. Read in conjunction with the root [`AGENTS.md`](../../AGENTS.md).

---

## Purpose

`starter/backend/` is a **Medusa v2 backend starter** that consumes the `@u11d/medusa-dynamic-pricing`. It contains:

- `medusa-config.ts` — main configuration: plugin setup, modules, database, Redis
- `integration-tests/` — HTTP integration tests for the full backend
- `src/migration-scripts/` — initial data seed script

The `src/` subdirectories (`api/`, `jobs/`, `links/`, `modules/`, `subscribers/`, `workflows/`, `admin/`) are intentionally empty — all business logic lives in the plugin.

---

## Key Files

```
starter/backend/
├── medusa-config.ts            ← plugin registration, modules, DB/Redis config
├── .env.template               ← environment variable template
├── package.json
├── src/
│   ├── migration-scripts/
│   │   └── initial-data-seed.ts  ← seeds regions, stores, currencies, sales channels
│   ├── api/                    ← empty (all routes in plugin)
│   ├── jobs/                   ← empty (all jobs in plugin)
│   ├── links/                  ← empty (all links in plugin)
│   ├── modules/                ← empty (all modules in plugin)
│   ├── subscribers/            ← empty
│   └── workflows/              ← empty
└── integration-tests/
    └── http/
        ├── checkout-flow.spec.ts    ← 7 tests: lock creation, recalc, completion, rejection
        ├── pricing-rules.spec.ts    ← CRUD for pricing rules
        └── sse-spot-prices.spec.ts  ← SSE subscription test
```

---

## medusa-config.ts Key Details

```ts
// Plugin configuration
{
  resolve: "@u11d/medusa-dynamic-pricing",
  options: {
    materials: ["XAU", "XAG", "XPT", "XPD"],
    fetchIntervalSeconds: 10,
    priceLockDurationSeconds: 600,   // 10 minutes (longer than plugin default of 120s)
    provider: process.env.GOLD_API_KEY
      ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
      : randomProvider,
  },
}

// Redis modules (disabled in test mode)
const isTest = process.env.NODE_ENV === "test"
// eventBus, locking modules only registered when !isTest
// redisUrl: isTest ? undefined : process.env.REDIS_URL
```

**Payment module must always be registered** (`@medusajs/medusa/payment`) — required for cart completion in tests.

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `REDIS_URL` | yes (non-test) | Redis connection string |
| `GOLD_API_KEY` | no | goldapi.io key; omit to use `randomProvider` |
| `JWT_SECRET` | yes | Medusa auth JWT secret |
| `COOKIE_SECRET` | yes | Medusa cookie secret |

---

## Integration Tests

Integration tests use `@medusajs/test-utils` and run a full Medusa backend in memory with a real PostgreSQL DB.

### Running Tests

```bash
# From monorepo root
npm run test:integration

# From this package
npx jest --runInBand --forceExit
```

### Critical Test Gotchas

1. **Resource name collisions** — When `disableAutoTeardown: true`, append `Date.now()` to resource names (e.g. cart IDs, product titles) to avoid test-run collisions.

2. **Payment module required** — `@medusajs/medusa/payment` must be in the `modules` list in `medusa-config.ts` for `cart.complete()` to work.

3. **System payment provider** — Use `provider_id: "pp_system_default"` for test payment sessions (not `"system"`).

4. **`force` is a query param** — The price-lock endpoint reads `force` from `req.query`, not `req.body`. Use `?force=true` in test HTTP calls.

5. **Raw knex inserts** — Price locks are written via raw Knex; tests interact with them through the store API, not the ORM directly.

---

## Migrations

Migrations live in the plugin (`dynamic-pricing-plugin/src/modules/dynamic-pricing/migrations/`). To run:

```bash
# From monorepo root
npm run backend:migrate

# Or from this package
npx medusa db:migrate
```

To generate a new migration after changing a data model in the plugin, see the [`db-generate` skill](../.agents/skills/db-generate/SKILL.md).

---

## Common Agent Tasks

### Adding a new backend-level customisation

If you need to add a route, job, subscriber, or module at the backend level (not the plugin):

1. Create the file in the appropriate `src/` subdirectory
2. Follow Medusa v2 conventions for that file type
3. Run `npm run build` to verify compilation
4. Add integration tests in `integration-tests/http/`

### Modifying plugin config

Edit `starter/backend/medusa-config.ts`. The plugin validates its options on startup — any validation failure throws `ConfigValidationError`.

### Adding an integration test

Follow the existing pattern in `integration-tests/http/checkout-flow.spec.ts`:

```ts
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    it("test name", async () => {
      // ...
    })
  },
})
```
