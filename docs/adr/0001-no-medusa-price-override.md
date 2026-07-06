# ADR 0001 — Do Not Override Medusa Prices

**Date:** 2025  
**Status:** Accepted

## Context

Medusa v2 has a built-in price management system (price lists, price sets, price rules) that stores prices in the database and serves them through the standard cart and checkout APIs. For precious metals, however, prices change every few seconds — sometimes by meaningful amounts. Writing a new price to Medusa's price tables on every spot-price update would be extremely high-frequency for a relational DB schema designed for stable catalog pricing, and would require overriding or patching internal Medusa workflows to substitute the dynamic price at order creation.

## Decision

We do **not** write dynamic prices to Medusa's price tables (`price_set`, `price`, `price_rule`, `money_amount`). Product variants carry a Medusa `price` of `0` (or a nominal placeholder). The actual price is:

1. **Computed on the frontend** from the live SSE spot price + the variant's pricing rule
2. **Locked to the cart** via `CartPriceLock` when the customer enters checkout
3. **Injected into cart line items** (`cartModule.updateLineItems`) during lock creation so the Medusa order total reflects the locked price

The locked price flows naturally into order creation because Medusa reads line item prices from the cart at order time.

## Consequences

**Positive:**
- Medusa's price tables are never polluted with high-frequency spot price writes
- The pricing system is fully decoupled from Medusa internals — it can be changed without touching Medusa core
- Price history is captured in `CartPriceLock` and `SpotPrice` tables, not scattered across Medusa's price tables
- No need to patch or extend Medusa's pricing workflows

**Negative:**
- The storefront cannot use Medusa's standard price-display logic; it must implement its own using `computeFinalPrice`
- Admin price display requires custom widgets, not the standard Medusa variant pricing UI
- Medusa's promotional/discount engine operates on list prices, which don't reflect spot prices; promotions must be handled separately

## Alternatives Considered

**Write to Medusa price tables on each fetch** — Rejected. Too high a write frequency (~every 10 seconds per material) for a table with complex relational constraints. Concurrent cart and fetch writes risk lock contention.

**Compute price server-side in a custom cart middleware** — Rejected. Medusa's cart internals don't have a clean hook for injecting a custom price at retrieval time without forking internal services.
