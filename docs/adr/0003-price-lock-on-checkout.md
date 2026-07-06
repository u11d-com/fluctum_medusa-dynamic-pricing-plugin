# ADR 0003 — Price Lock on Checkout Entry

**Date:** 2025  
**Status:** Accepted

## Context

Precious-metal prices can move by 0.5–2% within minutes. If a customer spends 5 minutes filling in their address and shipping details, the spot price may have changed enough to cause a significant discrepancy between the price they saw when entering checkout and the price at order submission. This creates risk for both the merchant (selling at a loss) and the customer (paying more than expected without notice).

## Decision

When a customer enters checkout, their cart prices are **locked** for `priceLockDurationSeconds` (configurable, default 120s, backend uses 600s):

1. `lockCartPricesWorkflow` fetches the current spot prices for all materials in the cart
2. It computes the final price per variant using the pricing formula
3. It writes one `CartPriceLock` row per variant, recording the full pricing snapshot
4. It calls `cartModule.updateLineItems` to update the Medusa line item prices to match the locked prices
5. The `completeCartWorkflow.hooks.validate` hook rejects order completion if any lock is missing or expired

The lock is idempotent when `force=false`: if valid locks already exist, they are reused without modification. Locks are refreshed (`force=true`) only on explicit user actions: clicking "Go to checkout" or clicking "Refresh prices" on the checkout page.

## Consequences

**Positive:**
- Customer sees a stable price during checkout — no surprise changes while filling in forms
- Merchant is protected against selling at a stale (too-low) price
- The full pricing breakdown is stored in the lock for order auditability
- Idempotency means navigation-triggered re-mounts (e.g. after `redirect()` from address form) do not create spurious lock refreshes

**Negative:**
- Adds a mandatory round-trip (lock creation) before order submission
- If a customer abandons checkout and returns after `priceLockDurationSeconds`, they must refresh prices before placing the order
- Lock creation requires a live spot price; if the price provider is down, checkout cannot proceed

## Alternatives Considered

**No locks — accept price at time of order** — Rejected. Unacceptable merchant risk on volatile assets. Also bad UX: customer could experience silent price changes between "adding to cart" and "place order".

**Lock prices in the cart (before checkout)** — Rejected. Cart is a browsing context; real-time SSE prices are expected there. Locking cart prices would confuse customers who expect to see live prices while browsing.

**Lock only at "Place order"** — Rejected. Too late — customer has already gone through address, shipping, and payment steps expecting a specific price. Last-second price change would require navigating back to re-enter the flow.
