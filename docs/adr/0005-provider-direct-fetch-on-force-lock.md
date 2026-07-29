# ADR 0005 — Direct Provider Fetch on Force Lock

**Date:** 2025  
**Status:** Superseded — see [Update](#update-2026-reverted) below. `force=true` reads from the DB, same as `force=false`.

## Context

When a customer clicks "Go to checkout" or "Refresh prices", we create price locks with `force=true`. Initially, `createCartPriceLocksStep` read spot prices from the most recent `SpotPrice` record in the database. The scheduled job writes to this table every `fetchIntervalSeconds` (10 seconds by default).

The issue: if the scheduled job last ran 9 seconds ago and the customer clicks "Go to checkout", the lock is created from a 9-second-old price. On a volatile asset like gold, this could be a meaningful difference.

## Decision

When `force=true`, `createCartPriceLocksStep` calls the configured **provider function directly** to fetch the current spot prices — bypassing the DB cache entirely:

```ts
// force=true path
const spotPrices = await pluginOptions.provider(materials);

// force=false path (idempotent reuse)
const spotPrices = await dynamicPricingService.getLatestSpotPrices(materials);
```

When `force=false` (idempotent reuse of existing locks), the DB is read as normal — no live fetch needed because the existing lock price is already committed.

The provider-fetched prices are also saved to the `SpotPrice` table and broadcast to SSE clients, keeping the DB and the live feed in sync.

## Consequences

**Positive:**

- "Go to checkout" and "Refresh prices" always use the most current available price
- No accumulated staleness from the polling interval
- Consistent: the price the customer sees locked is exactly the price from the provider at that moment

**Negative:**

- Force-lock requests are slightly slower (live provider HTTP call instead of DB read)
- If the price provider is unavailable, force-lock fails. This is acceptable — we prefer a clear error over locking at a stale price
- Each "Go to checkout" click triggers one provider call per material in the cart. At typical store volumes, this is well within goldapi.io rate limits

## Alternatives Considered

**Always read from DB** — Rejected. DB cache can be up to `fetchIntervalSeconds` stale. For a user-initiated "lock now" action, this is a poor UX guarantee.

**Read from DB but add a freshness check** — Considered. Would add complexity (what staleness threshold is acceptable?) without a clear business rule. Fetching directly from the provider is cleaner and unambiguous.

**Cache the provider response in memory** — Rejected. The `SseManager` already keeps the latest broadcast value; using it would bypass the provider entirely. The scheduled-job cache is the `SpotPrice` DB row, not an in-memory object — so force-fetch from provider remains the right choice for user-initiated locks.

## Implementation Status (historical)

This decision was briefly implemented as described above, then reverted — see [Update](#update-2026-reverted).

## Update (2026): Reverted

The direct-provider-fetch-on-force behavior was implemented, then reverted back to always reading from `getLatestSpotPrices` (DB) for both `force=true` and `force=false`, per a scalability review:

- The "Negative consequences" section below already flagged that each force-lock triggers one provider call per material, dismissing it as "well within rate limits at typical store volumes" — but this repo explicitly targets production workloads under high traffic (see root `AGENTS.md`). Under load, provider QPS would scale linearly with checkout/refresh traffic (e.g. 10 checkouts/sec ⇒ 10+ provider requests/sec) with **no ceiling**, unlike the scheduled job's fixed `fetchIntervalSeconds` cadence. This risks third-party rate-limiting, added API cost, and ties checkout latency/availability to a third-party HTTP call.
- **Current behavior:** `createCartPriceLocksStep` always calls `pricingModule.getLatestSpotPrices(materials)` regardless of `force`. `force` only controls whether existing `CartPriceLock` rows are reused (`false`) or recreated (`true`) — it does not change the spot price source. Staleness is bounded by `fetchIntervalSeconds` (default 10s), which is an accepted trade-off in exchange for predictable, traffic-independent load on the price provider.
- If sub-`fetchIntervalSeconds` freshness on "Go to checkout"/"Refresh prices" is needed in the future, prefer a bounded approach over unconditional per-request fetches — e.g. lowering `fetchIntervalSeconds`, or coalescing/debouncing concurrent force-lock requests within a short window into a single provider call — rather than reintroducing unbounded per-checkout provider calls.
