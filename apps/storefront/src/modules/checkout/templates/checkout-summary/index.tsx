"use client"

import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import PriceLockCountdown from "@modules/checkout/components/price-lock-countdown"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { lockCartPrices } from "@lib/data/cart"
import { useState, useMemo, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"

type Props = {
  cart: HttpTypes.StoreCart
}

type LockedPriceMap = Record<string, { unit_price: number; total: number }>

function buildLockedPriceMap(
  locks: { variant_id: string; unit_price: number; quantity: number }[],
  items: { id: string; variant_id?: string | null; quantity: number }[]
): LockedPriceMap {
  const variantPriceMap = new Map<string, number>()
  for (const lock of locks) {
    variantPriceMap.set(lock.variant_id, lock.unit_price)
  }

  const prices: LockedPriceMap = {}
  for (const item of items) {
    const unitPrice = item.variant_id ? variantPriceMap.get(item.variant_id) : undefined
    if (unitPrice !== undefined) {
      prices[item.id] = {
        unit_price: unitPrice,
        total: Math.round(unitPrice * item.quantity * 100) / 100,
      }
    }
  }
  return prices
}

const CheckoutSummary = ({
  cart,
}: Props) => {
  const [refreshResult, setRefreshResult] = useState<{
    lockedPrices: LockedPriceMap
    expiresAt: string
  }>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const lockedPrices = refreshResult?.lockedPrices ?? null
  const expiresAt = refreshResult?.expiresAt ?? null

  const doLock = async () => {
    if (!cart.id) return
    setIsRefreshing(true)
    setRefreshError(null)

    try {
      const result = await lockCartPrices(cart.id, true)
      const prices = buildLockedPriceMap(result.locks, cart.items ?? [])
      setRefreshResult({ lockedPrices: prices, expiresAt: result.expires_at })
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Failed to lock prices")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Lock prices on mount (fresh navigation, paste URL, browser refresh).
  // Uses force=false so existing valid locks are reused when CheckoutSummary
  // remounts after form-step redirects.
  useEffect(() => {
    if (!cart.id) return
    let cancelled = false

    const init = async () => {
      try {
        const result = await lockCartPrices(cart.id, false)
        if (cancelled) return

        const prices = buildLockedPriceMap(result.locks, cart.items ?? [])

        if (!cancelled) {
          setRefreshResult({ lockedPrices: prices, expiresAt: result.expires_at })
        }
      } catch (e) {
        if (!cancelled) {
          setRefreshError(e instanceof Error ? e.message : "Failed to lock prices")
        }
      }
    }

    init()

    return () => { cancelled = true }
  }, [cart.id])

  const lockedSubtotal = useMemo(() => {
    if (!lockedPrices) return 0
    let total = 0
    for (const price of Object.values(lockedPrices)) {
      total += price.total
    }
    return Math.round(total * 100) / 100
  }, [lockedPrices])

  const lockedTotal = lockedSubtotal > 0
    ? lockedSubtotal + (cart.shipping_subtotal ?? 0) + (cart.tax_total ?? 0)
    : undefined

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-white flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          In your Cart
        </Heading>
        <Divider className="my-6" />
        <PriceLockCountdown
          expiresAt={expiresAt}
          isRefreshing={isRefreshing}
          onRefresh={doLock}
          error={refreshError}
        />
        <CartTotals totals={cart} subtotalOverride={lockedSubtotal > 0 ? lockedSubtotal : undefined} totalOverride={lockedTotal} />
        {lockedPrices ? (
          <ItemsPreviewTemplate cart={cart} lockedPrices={lockedPrices} />
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            {isRefreshing ? "Locking prices..." : "Loading cart items..."}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutSummary
