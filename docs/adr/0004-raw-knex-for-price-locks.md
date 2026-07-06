# ADR 0004 — Raw Knex for Price Lock Writes

**Date:** 2025  
**Status:** Accepted

## Context

Medusa v2 uses MikroORM as its ORM layer. MikroORM maintains an identity map (entity cache) within each unit of work. When writing `CartPriceLock` rows, we first DELETE existing locks and then INSERT new ones. We discovered that MikroORM's entity cache can return stale (deleted) entities in the same unit of work, causing incorrect reads immediately after the DELETE + INSERT cycle.

Additionally, Medusa's `model.bigNumber()` field type requires that both the value column and a `raw_<fieldname>` JSONB shadow column are populated on write. MikroORM does not automatically populate the shadow column when using the service layer's standard `create()` method in all cases.

## Decision

Price lock writes (DELETE + INSERT) use **raw Knex** instead of the MikroORM service layer:

```ts
const knex = service.getKnex()

// Delete existing locks
await knex("cart_price_lock").where({ cart_id: cartId }).delete()

// Insert new locks with explicit raw_* JSONB columns
await knex("cart_price_lock").insert(
  locks.map((lock) => ({
    ...lock,
    raw_unit_price: JSON.stringify({ value: lock.unit_price.toString(), precision: 20 }),
    raw_spot_price: JSON.stringify({ value: lock.spot_price.toString(), precision: 20 }),
  }))
)
```

The `DynamicPricingModuleService` exposes a `getKnex()` method to make the underlying Knex instance accessible to workflow steps.

Similarly, the validate hook queries `cart_price_lock` via raw Knex to guarantee it sees the committed state, not MikroORM's potentially cached view.

## Consequences

**Positive:**
- Bypasses MikroORM identity map — reads always reflect committed DB state
- Explicit control over `raw_*` JSONB column population
- Simpler, more predictable write semantics for bulk INSERT
- Lower overhead than MikroORM for write-heavy operations

**Negative:**
- No automatic entity validation (type safety at the Knex layer is weaker than at the ORM layer)
- No ORM-managed timestamps or lifecycle hooks — must set `locked_at`, `expires_at`, `created_at`, `updated_at` manually
- Must manually generate entity IDs (`generateEntityId(undefined, "cplock")`) with the correct signature

## Alternatives Considered

**MikroORM service layer (`service.create()`)** — Rejected. Entity cache caused stale reads. `raw_*` shadow column not reliably populated. Harder to bulk-insert efficiently.

**MikroORM with explicit entity manager flush** — Explored but adds complexity (managing unit-of-work boundaries across async workflow steps). Raw Knex is simpler and more direct.

## Related Decisions

- The workflow compensation handler (rollback) also uses raw Knex for consistency
- `deleteCartPriceLocksByCart()` on the module service uses raw Knex for the same reason
