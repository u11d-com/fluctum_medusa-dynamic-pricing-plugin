# Storefront Agent Guide (Current State)

This file is the source of truth for storefront implementation conventions.

## Global Type Safety Rule (Applies Everywhere)

- Do not use `any`.
- Do not use type casting (`as`, `as unknown as`, angle-bracket casts).
- Do not use `@ts-ignore` to bypass type errors.
- Fix typing at the source using proper types, narrowing, overloads, or typed adapters.

This rule applies to all projects and repositories, not only this storefront.

## Component Architecture

- Primitive UI components live in `src/modules/common/components/ui`.
- Composed/domain components live outside `ui` and may include feature logic.
- Always prefer imports from `@modules/common/components/ui` for primitive building blocks.

## Canonical Primitive Imports

Use these exports from `src/modules/common/components/ui/index.ts`:

- `Text`
- `Heading`
- `Button`
- `IconButton`
- `Input`
- `Label`
- `Checkbox`
- `Radio`
- `RadioGroup`
- `NativeSelect`
- `Divider`
- `Surface`
- `Container`
- `Badge`
- `ChoiceCard`, `ChoiceCardButton`
- `StatusNotice`
- `EmptyState`
- `Table`
- `clx`

## Primitive vs Composed Decision Rule

Use this decision tree before creating or moving a component:

1. Pure presentational and reusable across domains -> place in `ui`.
2. Contains domain behavior, server actions, or API mutations -> keep outside `ui`.

## Typography Rules

- Prefer `Text` over raw typography tags/classes when rendering copy.
- Use `Text` variants first:
  - `body`
  - `muted`
  - `label`
  - `caption`
  - `error`
  - `warning`
  - `success`
  - `price`
  - `eyebrow`
- Use `className` on `Text` only for layout/context tweaks (spacing, alignment, special case color/size).

## Heading Rules

- `Heading` is primitive and size-based only.
- API:
  - `level?: "h1" | "h2" | "h3"`
  - `size?: "sm" | "md" | "lg" | "xl" | "2xl"`
- Do not add use-case variants (checkout/page/hero/etc.).
- Put context-specific visual tweaks in call sites.

## Styling Priority Order

When styling text and headings:

1. Component props (`variant`, `size`, `level`)
2. Primitive defaults
3. Minimal `className` overrides

Avoid adding legacy `txt-*`/`text-*-regular` patterns when an existing primitive variant already matches.

## Form Primitive Rules

- Use `Input` from `ui` for text/password/email/tel fields.
- Use `NativeSelect` from `ui` for select fields.
- Use `Checkbox`, `Radio`, and `RadioGroup` from `ui`.
- Keep floating label behavior inside `ui/Input`; do not recreate per-feature input variants.

## RSC / Client Boundary Rules

- Keep `ui` primitives server-safe by default.
- Only add `"use client"` to a primitive if absolutely required.
- If interactivity is needed, keep client-only logic scoped to that file and avoid forcing server modules to become client modules.

## Accessibility Baseline

- Keep `aria-live="polite"` for dynamic cart count updates.
- Provide accessible labels for icon-only controls.
- Preserve keyboard accessibility and focus styles on interactive components.

## Test Contract

- Preserve existing `data-testid` values unless explicitly asked to update tests.
- For new interactive controls in cart/checkout/account flows, add stable `data-testid` values.

## Disallowed Legacy Imports

Do not import these removed primitive paths:

- `@modules/common/components/input`
- `@modules/common/components/checkbox`
- `@modules/common/components/radio`
- `@modules/common/components/native-select`
- `@modules/common/components/divider`

Always replace with `@modules/common/components/ui` exports.

## Composed Components (Intentionally Outside `ui`)

These remain outside `ui` because they encapsulate behavior/domain logic:

- `@modules/common/components/delete-button` (cart mutation)
- `@modules/common/components/cart-totals`
- `@modules/common/components/line-item-*`
- `@modules/common/components/interactive-link`
- `@modules/common/components/localized-client-link`

## Dynamic Pricing Safety

- Do not change price lock semantics in checkout/cart flows unless explicitly requested.
- Keep lock countdown/refresh UX behavior stable when touching related UI.

## Cart State (CartProvider Pattern)

Cart state is managed client-side via `CartProvider` + `useCart()` in `src/modules/cart/context/cart-context.tsx`.

**Key facts:**

- `CartProvider` wraps the `(main)` layout. It does **NOT** wrap the `(checkout)` layout.
- `useCart()` returns a **no-op context** (not throw) when used outside `CartProvider` — safe for checkout components.
- `useCart()` returns `{ cart, addToCart, updateLineItem, deleteLineItem }`.
- All three mutations call the corresponding server action, then call `setCart(updated)` when it succeeds.
- Success toasts are fired inside `CartProvider`: "Added to cart", "Cart updated", "Item removed from cart". Callers should NOT fire their own success toasts.
- Callers still need their own `useTransition` for local pending state (spinner, disabled button). `isPending` is NOT in the context value.
- `ItemsTemplate` (`cart/templates/items.tsx`) is a `"use client"` component reading from `useCart()` so Item children re-render when cart state changes. Without this, cart-page item list is stale.

**Mutation callers:**

- `add-to-cart-button` — wraps call in local `useTransition`, shows spinner only while pending (no "Adding" / "Added" labels)
- `product-actions` — wraps in local `useTransition`, shows `isLoading` on Button
- `delete-button` — wraps in local `useTransition`, shows Spinner icon while pending, button disabled, forwards `data-testid` prop to inner `<button>`
- `cart/components/item` — wraps in local `useTransition` for `updating` state (quantity input + inc/dec disable)

## Pricing Display Rules (No Medusa Fallback)

We never show Medusa's cached prices in dynamic-pricing UI. Show `"—"` instead.

| Component                  | Rule                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `LineItemPrice`            | Shows `"—"` when `price` prop is `undefined` (never falls back to `item.total`)                                         |
| `CartTotals`               | Accepts `null` for `subtotalOverride`/`totalOverride` → renders `"—"` (use `null` not `undefined` to suppress fallback) |
| `CartDropdown` subtotal    | `dynamicSubtotal > 0 ? dynamicSubtotal : null` — shows `"—"` while SSE loads                                            |
| Cart page `Summary`        | Same null-passthrough pattern                                                                                           |
| Checkout `CheckoutSummary` | `lockedSubtotal > 0 ? lockedSubtotal : null` — shows `"—"` while lock loading                                           |
| Checkout preview `Item`    | No `cart` prop → no SSE fallback; locked prices or `"—"` only                                                           |
| Order page `LineItemPrice` | Pass `price={item.total ?? 0}` explicitly — orders always use finalized Medusa prices                                   |
| `SpotPriceBarClient`       | Never returns `null`; renders `"—"` per material while SSE loading                                                      |

## Checkout Page Architecture Constraints

- Checkout is in `(checkout)` route group — **NOT** wrapped in `CartProvider`. `useCart()` returns no-op.
- `checkout/page.tsx` has `export const dynamic = "force-dynamic"` and calls `retrieveCart(undefined, undefined, true)` (`noCache=true`) to bypass Next.js data cache.
- After `initiatePaymentSession`, use `window.location.assign(url)` (hard navigation) — **never `router.push()`**. Reason: `revalidateTag` + `router.push()` race where the client Router Cache serves stale RSC before server data cache invalidation propagates. Hard reload guarantees RSC re-renders with fresh `cart.payment_collection`.
- `retrieveCart(cartId?, fields?, noCache?)` — `noCache=true` passes `cache: "no-store"` and skips `next` tag options.
- Shipping step: separate `isSettingMethod` state for the API call vs `isLoading` for the navigation. Only "Continue to payment" click sets `isLoading`; selecting a radio sets `isSettingMethod` (disables radio but does NOT show button spinner).
- Review step: `previousStepsCompleted` skips `cart.payment_collection` check when `isOpen=true` (URL has `step=review` only after `initiatePaymentSession` succeeded).

## Product Card Conventions

- `ProductCard` accepts optional `variantLabel?: string` — rendered right-aligned on the same row as the product title.
- `ProductPreview` computes the cheapest variant via `computeCheapestVariant(variants, pricingData, spotPrices)` from `lib/util/dynamic-pricing.ts` and passes its title as `variantLabel` and its ID to `AddToCartButton`.
- `AddToCartButton` in product cards uses cheapest variant's ID, NOT `product.variants[0].id`.

## E2E Tests (Playwright)

Tests live in `starter/storefront/e2e/`. Playwright config: `timeout: 90_000`, `expect.timeout: 10_000`, `retries: 1`, `reuseExistingServer: true`.

| File                      | Tests | Coverage                                                                                                                                        |
| ------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `cart-reactivity.spec.ts` | 6     | Badge update (product page + landing page), quantity change, inc/dec, remove item, remove one of multiple                                       |
| `checkout-flow.spec.ts`   | 7     | Add + quantity update, add from landing, remove from cart, price format check, full checkout flow, refresh prices, page-refresh preserves locks |

Run both with:

```bash
pnpm exec playwright test cart-reactivity.spec.ts checkout-flow.spec.ts --project=chromium
```

## Validation Commands

Run from `starter/storefront`:

- `pnpm run typecheck`
- `pnpm run build`

Use these as required validation for storefront UI and type changes.
