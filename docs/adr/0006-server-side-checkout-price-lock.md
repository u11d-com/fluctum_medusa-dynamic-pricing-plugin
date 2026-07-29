# ADR 0006 — Server-Side Price Lock on Checkout Page Load

**Date:** 2025  
**Status:** Accepted

## Context

Prior to this change, the checkout page (`checkout/page.tsx`) rendered a client component, `CheckoutSummary`, which locked prices on mount via a `useEffect` calling `lockCartPrices(cart.id, force=false)`. This had several drawbacks:

- The lock was created client-side, after the initial page render — causing a visible flash where the summary showed no locked price until the effect resolved.
- The `useEffect` required a `cancelled` closure flag to guard against React Strict Mode's double-mount in development, adding incidental complexity.
- The "Go to checkout" button on the cart page (`summary.tsx`) called `lockCartPrices(cart.id, force=true)` directly from a client `onClick` handler and then `router.push()`'d to `/checkout` — a different code path than the address-form's `redirect()`-based server action (`setAddresses`), creating an inconsistency in how navigation + locking were performed across the checkout flow.
- It was unclear whether the lock could simply be resolved server-side before the page renders, since `checkout/page.tsx` was already an async server component with `export const dynamic = "force-dynamic"`.

## Decision

Move price locking for checkout entry entirely server-side:

1. **`retrieveCartWithLock(cartId, force)`** (new, in `lib/data/cart.ts`) — fetches the cart and calls the existing `lockCartPrices(cart.id, force)`, returning `{ cart, lockedPrices, expiresAt, lockError }`. Lock failures are caught and returned as `lockError` rather than thrown, so the page can still render (e.g. showing an error state) instead of crashing.
2. **`checkout/page.tsx`** calls `retrieveCartWithLock(undefined, force=false)` on every render. Because the route is `force-dynamic`, this runs on: first navigation, pasted URLs, browser refreshes, and — critically — the full-page navigation triggered by `setAddresses`'s `redirect()`. In all these cases, `force=false` idempotently reuses any existing valid lock or creates one if none exists.
3. **`CheckoutSummary`** becomes a purely presentational client component. It no longer performs any fetch on mount — its `refreshResult`/`refreshError` state is seeded directly from the `initialLockedPrices`/`initialExpiresAt`/`initialError` props passed down from the server component. The only remaining client-side lock call is the explicit "Refresh prices" button (`doLock`, `force=true`), which is a genuine user-initiated action and stays as-is.
4. **`goToCheckout`** (new server action, in `lib/data/cart.ts`) replaces the client `onClick` handler in the cart page's `summary.tsx`. It follows the exact same convention as `setAddresses`: `useActionState(goToCheckout, null)` returning a plain `string | null` error, a `<form action={formAction}>` with hidden fields (`cart_id`, `country_code`, `step`), and `redirect()` on success. This unifies the two navigation-into-checkout code paths (cart page → checkout, and checkout step → checkout) under the same server-action + `redirect()` pattern.
5. **`checkout/loading.tsx`** + **`SkeletonCheckoutPage`** (new) — since `checkout/page.tsx` is now a blocking async server component (it must resolve the lock before rendering anything), Next.js needs a `loading.tsx` boundary to show a skeleton during that resolution, instead of a blank/frozen page.

## Why This Was Low-Risk

`checkout/page.tsx` already had `export const dynamic = "force-dynamic"` and there was **no existing `loading.tsx`** for this route. This means every client-side navigation into checkout (including the `redirect()` after submitting the address form) was already causing a full server-side re-render of `checkout/page.tsx` with no streaming/skeleton fallback. Adding a server-side lock resolution to this already-blocking render path does not introduce new latency characteristics — it just moves work that was happening in a client `useEffect` (after first paint) into the existing server render (before first paint), which is strictly faster from the user's perspective for the initial contentful render.

## Consequences

**Positive:**

- No more client-side flash/loading state for the initial locked price — it's resolved before the page is sent to the browser.
- Removes the `useEffect` + `cancelled`-flag pattern entirely from `CheckoutSummary`, simplifying the component to pure props-in/render-out.
- Unifies "navigate into checkout" behind one server-action + `redirect()` pattern (`goToCheckout` mirrors `setAddresses`).
- `retrieveCartWithLock`'s try/catch means a lock failure surfaces as an in-page error rather than an unhandled rejection.
- New `loading.tsx` gives users visual feedback during the (now server-side) lock resolution, improving perceived performance on slower connections.

**Negative:**

- `checkout/page.tsx` is now a hard dependency of price locking — any regression in `lockCartPrices` will prevent the checkout page from rendering rather than degrading gracefully to a client-side retry loop (mitigated by `lockError` being passed through as a prop rather than thrown).
- Adds one more prop-drilling layer (`initialLockedPrices`, `initialExpiresAt`, `initialError`) to `CheckoutSummary`.

## Alternatives Considered

**Keep the `useEffect` but add a `cancelled` fix and call it done** — Rejected. Doesn't address the root complaint (visible flash, incidental complexity, and the client/server inconsistency between the cart page and address-step navigation).

**Move the lock into a React Server Component `Suspense` boundary instead of blocking the whole page** — Considered, but the checkout page's summary and form both depend on the same locked-price data, and splitting the lock resolution into a separate suspended subtree would require either duplicating the cart fetch or passing a promise across a server/client boundary. Given the route was already fully blocking (`force-dynamic`, no existing `loading.tsx`), a straightforward blocking `await` in the page component was simpler and had no measurable downside over the current behavior.

**Leave `goToCheckout`'s client-side lock+push in `summary.tsx` as-is and only fix the checkout page** — Rejected per explicit review feedback: the inconsistency between the two navigation-into-checkout code paths was itself a request to fix, not just the `useEffect`.
