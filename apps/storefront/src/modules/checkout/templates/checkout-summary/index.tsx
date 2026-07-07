"use client"

import { Heading, Surface } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import PriceLockCountdown from "@modules/checkout/components/price-lock-countdown"
import CartTotals from "@modules/common/components/cart-totals"
import { Divider } from "@modules/common/components/ui"
import { lockCartPrices } from "@lib/data/cart"
import { buildLockedPriceMap } from "@lib/util/dynamic-pricing"
import { useState, useMemo, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import type { LockedPriceMap } from "@u11d/medusa-dynamic-pricing/client"

type Props = {
  cart: HttpTypes.StoreCart
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
    : null

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <Surface className="w-full p-6 flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          size="2xl"
          className="flex flex-row items-baseline"
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
        <CartTotals totals={cart} subtotalOverride={lockedSubtotal > 0 ? lockedSubtotal : null} totalOverride={lockedTotal} />
        <ItemsPreviewTemplate cart={cart} lockedPrices={lockedPrices} />
      </Surface>
    </div>
  )
}

export default CheckoutSummary
