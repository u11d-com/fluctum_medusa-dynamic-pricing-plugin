# Checkout Flow & Price Lock Lifecycle

## Overview

Prices in the cart are dynamic — they update in real time via SSE. When a customer moves to checkout, prices are "locked" so they don't change mid-flow. The lock is validated server-side before the order is completed.

## Price Lock Rules

| Trigger                                   | Lock behavior                     | `force` | Why                                                                                                                                    |
| ----------------------------------------- | --------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Click "Go to checkout" on cart page       | Always creates fresh locks        | `true`  | `goToCheckout` server action calls `lockCartPrices(id, true)` before redirecting                                                       |
| Paste checkout URL / page refresh         | Creates fresh locks if none exist | `false` | `checkout/page.tsx` calls `retrieveCartWithLock(id, false)` server-side on every render; no existing locks → fresh created             |
| Submit address form (`redirect()`)        | Reuses existing locks             | `false` | `redirect()` causes full page navigation → `checkout/page.tsx` re-runs → `retrieveCartWithLock(id, false)` reuses existing valid locks |
| Select delivery/payment (`router.push()`) | Prices do NOT change              | —       | Client-side navigation; `checkout/page.tsx` doesn't re-run; `CheckoutSummary` stays mounted with the same props                        |
| Click "Refresh prices" on checkout        | Always creates fresh locks        | `true`  | Intentional user action (`doLock` in `CheckoutSummary`, client → `lockCartPrices(id, true)`)                                           |
| Click "Place order"                       | Does NOT create locks             | —       | Reuses the checkout page's server-side lock; validate hook checks it exists and is not expired                                         |
| Cart page (browsing)                      | No locks                          | —       | SSE prices only; never locked                                                                                                          |

## Checkout Page Lock Lifecycle

```
                 ┌─────────────────────────────────────────────┐
                 │           Cart Page (SSE prices)            │
                 │                                             │
                 │   user submits "Go to checkout" form        │
                 └─────────────────────┬───────────────────────┘
                                       │ goToCheckout() server action
                                       │ lockCartPrices(id, force=true)
                                       │ → POST /price-lock?force=true
                                       │   fetches price DIRECTLY from provider
                                       │ → redirect(`/checkout?step=...`)
                                       ▼
                 ┌─────────────────────────────────────────────┐
                 │      /checkout (server component)           │
                 │                                             │
                 │   checkout/page.tsx (force-dynamic) runs    │
                 │   retrieveCartWithLock(id, force=false)     │
                 │   → existing locks reused ✓                 │
                 │   → renders CheckoutSummary with locked     │
                 │     prices as props (no client fetch)       │
                 │                                             │
                 │   user submits address                      │
                 │   → setAddresses() server action            │
                 │   → redirect() ← FULL PAGE NAVIGATION       │
                 └─────────────────────┬───────────────────────┘
                                       │ checkout/page.tsx re-runs
                                       │ retrieveCartWithLock(id, force=false)
                                       │ → existing locks still valid → reused ✓
                                       ▼
                 ┌─────────────────────────────────────────────┐
                 │      /checkout (delivery step)              │
                 │                                             │
                 │   user selects shipping option              │
                 │   → router.push() ← CLIENT-SIDE NAV        │
                 │   checkout/page.tsx does NOT re-run         │
                 │   CheckoutSummary STAYS MOUNTED             │
                 │   with the same props                       │
                 └─────────────────────┬───────────────────────┘
                                       │ (same for payment step)
                                       ▼
                 ┌─────────────────────────────────────────────┐
                 │      /checkout (payment step)               │
                 │                                             │
                 │   user clicks "Place order"                 │
                 │   → cart.complete()                         │
                 │   → completeCartWorkflow.hooks.validate     │
                 │       SELECT * FROM cart_price_lock         │
                 │       WHERE cart_id = ? AND variant_id IN ? │
                 │       reject if any lock missing            │
                 │       reject if any expires_at < now()      │
                 └─────────────────────────────────────────────┘
```

## API Route

```
POST /store/dynamic-pricing/carts/:id/price-lock
     ?force=true   — always delete + recreate locks
     ?force=false  — idempotent: only creates if no valid locks exist
```

Both `force=true` and `force=false` read spot prices from the DB (`getLatestSpotPrices`), not a live provider call — see [ADR 0005](adr/0005-provider-direct-fetch-on-force-lock.md#update-2026-reverted). `force` only controls whether existing lock rows are reused or recreated; staleness is bounded by `fetchIntervalSeconds` (default 10s) regardless of `force`.

## Lock Data (`CartPriceLock`)

Each lock row captures the full pricing snapshot at lock time for auditability:

| Column               | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `cart_id`            | The cart this lock belongs to                                  |
| `variant_id`         | The specific variant being locked                              |
| `material`           | Material symbol (XAU, XAG, …)                                  |
| `weight_oz`          | Variant weight in troy ounces                                  |
| `unit_price`         | Computed final price (the locked price)                        |
| `quantity`           | Line item quantity at lock time                                |
| `spot_price`         | Raw spot price used in computation                             |
| `spread_factor`      | Rule spread_factor at lock time                                |
| `spread_fixed`       | Rule spread_fixed at lock time                                 |
| `premium_percentage` | Rule premium_percentage at lock time                           |
| `premium_fixed`      | Rule premium_fixed at lock time                                |
| `locked_at`          | When the lock was created                                      |
| `expires_at`         | When the lock expires (`locked_at + priceLockDurationSeconds`) |

## Lock Creation Implementation

The `createCartPriceLocksStep` uses raw Knex INSERT (not MikroORM) to avoid ORM entity caching issues. It must also populate the `raw_*` JSONB shadow columns required by Medusa's `model.bigNumber()` field type.

## Validate Hook

The `completeCartWorkflow.hooks.validate` hook is registered by `config-loader.ts` when the plugin initialises:

```ts
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  // 1. Find all dynamically-priced variants in the cart
  // 2. Query cart_price_lock via raw Knex
  // 3. Reject if any variant has no lock or an expired lock
});
```

The hook uses an `hookRegistered` module-level flag to prevent double-registration on hot-reload.

## Order Completion Flow

When `placeOrder()` is called from the storefront:

1. `cart.complete()` is called via the Medusa SDK
2. Medusa runs `completeCartWorkflow`
3. The validate hook queries `cart_price_lock` via raw Knex
4. If all locks exist and none are expired → order proceeds
5. If any lock is missing or expired → `MedusaError` thrown → 400 returned to storefront
6. On success, the order is created with the line item prices set during lock creation

## Storefront Components

- **`retrieveCartWithLock(cartId, force)`** — server-only helper in `lib/data/cart.ts`. Fetches the cart and calls `lockCartPrices(cart.id, force)`, returning `{ cart, lockedPrices, expiresAt, lockError }`. Never throws — lock failures are captured in `lockError` so the page can still render. Called from `checkout/page.tsx` on every render (`force=false`, idempotent reuse).
- **`goToCheckout(prevState, formData)`** — Next.js server action (`useActionState` convention, returns a plain `string | null` error) that always force-locks (`force=true`) before `redirect()`-ing to `/checkout`. Used by the cart page's "Go to checkout" form.
- **`checkout/page.tsx`** — server component (`force-dynamic`) that resolves the cart + lock server-side via `retrieveCartWithLock` and passes `cart`, `initialLockedPrices`, `initialExpiresAt`, `initialError` down as props. Has a matching `loading.tsx` (`SkeletonCheckoutPage`) so Next.js shows a skeleton while this async server component resolves.
- **`CheckoutSummary`** — purely presentational client component. Seeds its `refreshResult`/`refreshError` state from the `initial*` props — there is no client-side fetch-on-mount. The only client-triggered lock is `doLock()` (force=true) from the "Refresh prices" button. Stays mounted across delivery/payment steps.
- **`PriceLockCountdown`** — displays time remaining until lock expiry, prompts user to refresh if needed.
- **`ItemPrice`** — renders the locked price for checkout line items. Falls back to SSE price on cart page. Renders `"—"` when neither locked nor SSE price is available (never falls back to Medusa's `unit_price`).
- **`lockCartPrices(cartId, force)`** — Next.js server action that calls the store API route.
