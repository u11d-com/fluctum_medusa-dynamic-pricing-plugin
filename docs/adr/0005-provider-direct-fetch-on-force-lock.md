# ADR 0005 — Direct Provider Fetch on Force Lock

**Date:** 2025  
**Status:** Accepted

## Context

When a customer clicks "Go to checkout" or "Refresh prices", we create price locks with `force=true`. Initially, `createCartPriceLocksStep` read spot prices from the most recent `SpotPrice` record in the database. The scheduled job writes to this table every `fetchIntervalSeconds` (10 seconds by default).

The issue: if the scheduled job last ran 9 seconds ago and the customer clicks "Go to checkout", the lock is created from a 9-second-old price. On a volatile asset like gold, this could be a meaningful difference.

## Decision

When `force=true`, `createCartPriceLocksStep` calls the configured **provider function directly** to fetch the current spot prices — bypassing the DB cache entirely:

```ts
// force=true path
const spotPrices = await pluginOptions.provider(materials)

// force=false path (idempotent reuse)
const spotPrices = await dynamicPricingService.getLatestSpotPrices(materials)
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
